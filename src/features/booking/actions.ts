"use server";

import { after } from "next/server";
import { db } from "@/lib/db";
import { createAppointmentSchema, type CreateAppointmentInput } from "./schemas";
import { Prisma } from "@prisma/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addDays, addHours } from "date-fns";
import { TZ, combineDateAndTimeInTZ, formatDateBR, addMinutesToHHmm } from "@/lib/time";
import { normalizePhone } from "@/lib/phone";
import { generateProtocol } from "@/lib/protocol";
import { getSettings, getLandingConfig } from "@/features/settings/queries";
import { notifyAdminPending, notifyCustomerReceived } from "./notify";

export type CreateAppointmentResult =
  | {
      ok: true;
      protocol: string;
      appointmentId: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Normaliza telefone
  let phone: string;
  try {
    phone = normalizePhone(data.phone);
  } catch {
    return { ok: false, error: "Telefone inválido" };
  }

  // Regras do estúdio (antecedência mínima e limite máximo no futuro).
  // Validamos aqui também porque a UI confia nos slots filtrados, mas o
  // endpoint é público — não dá pra confiar só no cliente.
  const settings = await getSettings();
  const now = new Date();
  const slotStart = combineDateAndTimeInTZ(data.date, data.startTime);
  const earliestStart = addHours(now, settings.minimumScheduleNoticeHours);
  if (slotStart < earliestStart) {
    return {
      ok: false,
      error: `Agendamentos exigem ao menos ${settings.minimumScheduleNoticeHours}h de antecedência.`,
    };
  }
  const latestISO = formatInTimeZone(
    addDays(now, settings.maximumScheduleDaysAhead),
    TZ,
    "yyyy-MM-dd",
  );
  if (data.date > latestISO) {
    return {
      ok: false,
      error: `Só aceitamos agendamentos até ${settings.maximumScheduleDaysAhead} dias à frente.`,
    };
  }

  // Busca serviço
  const service = await db.service.findUnique({
    where: { id: data.serviceId },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferPreMinutes: true,
      bufferPosMinutes: true,
      active: true,
    },
  });
  if (!service || !service.active) {
    return { ok: false, error: "Serviço indisponível" };
  }

  const endTime = addMinutesToHHmm(data.startTime, service.durationMinutes);
  const protocol = generateProtocol();

  // Tenta criar em transação
  try {
    const appointmentId = await db.$transaction(async (tx) => {
      // Upsert do customer
      const existing = await tx.customer.findUnique({ where: { phone } });
      const customer = existing
        ? await tx.customer.update({
            where: { id: existing.id },
            data: {
              name: data.name,
              email: data.email || null,
              socialMedia: data.instagram || null,
            },
          })
        : await tx.customer.create({
            data: {
              phone,
              name: data.name,
              email: data.email || null,
              socialMedia: data.instagram || null,
            },
          });

      // Cria appointment
      const appt = await tx.appointment.create({
        data: {
          protocol,
          serviceId: service.id,
          customerId: customer.id,
          serviceNameSnapshot: service.name,
          durationMinutesSnapshot: service.durationMinutes,
          bufferPreSnapshot: service.bufferPreMinutes,
          bufferPosSnapshot: service.bufferPosMinutes,
          customerNameSnapshot: data.name,
          customerContactSnapshot: phone,
          customerEmailSnapshot: data.email || null,
          customerSocialMediaSnapshot: data.instagram || null,
          briefing: data.briefing || null,
          date: fromZonedTime(`${data.date}T12:00:00`, TZ),
          startTime: data.startTime,
          endTime,
          status: "PENDING",
          consentAcceptedAt: new Date(),
          consentVersion: "v1",
        },
        select: { id: true },
      });

      // Histórico inicial
      await tx.appointmentHistory.create({
        data: {
          appointmentId: appt.id,
          eventType: "status_change",
          statusFrom: null,
          statusTo: "PENDING",
          changedBy: "system",
          reason: "criado pelo cliente",
        },
      });

      return appt.id;
    });

    // Emails pós-commit. Tudo passado como valor (sem releitura no callback).
    // Falha de email NÃO derruba o agendamento — sendEmail loga e segue.
    const dateFormatted = formatDateBR(fromZonedTime(`${data.date}T12:00:00`, TZ));
    const landing = await getLandingConfig();

    after(async () => {
      await notifyAdminPending({
        protocol,
        serviceName: service.name,
        dateFormatted,
        startTime: data.startTime,
        customerName: data.name,
        customerPhone: phone,
        customerEmail: data.email || null,
        customerInstagram: data.instagram || null,
        briefing: data.briefing || null,
        appointmentId,
        adminEmail: settings.notificationEmail,
      });

      if (data.email) {
        await notifyCustomerReceived({
          protocol,
          customerName: data.name,
          customerEmail: data.email,
          serviceName: service.name,
          dateFormatted,
          startTime: data.startTime,
          studioName: landing.landingName,
        });
      }
    });

    return { ok: true, protocol, appointmentId };
  } catch (err) {
    // Constraint EXCLUDE violada → 409 conceitual
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2010") {
      return {
        ok: false,
        error: "Esse horário acabou de ser reservado. Escolha outro disponível.",
      };
    }
    if (err instanceof Error && err.message.includes("23P01")) {
      return {
        ok: false,
        error: "Esse horário acabou de ser reservado. Escolha outro disponível.",
      };
    }
    console.error("createAppointment failed", err);
    return {
      ok: false,
      error: "Não foi possível criar o agendamento. Tente novamente.",
    };
  }
}
