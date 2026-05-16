"use server";

import { db } from "@/lib/db";
import { createAppointmentSchema, type CreateAppointmentInput } from "./schemas";
import { Prisma } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { TZ } from "@/lib/time";

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

/** Normaliza telefone para 5599999999999 (DDI 55 + DDD + número). */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) return digits;
  if (digits.length === 11) return `55${digits}`;
  if (digits.length === 10) return `55${digits}`; // sem 9 inicial
  throw new Error("Telefone inválido");
}

/** Gera protocolo no formato AG-YYYYMMDD-XXXX (Crockford-ish, sem 0/O/I/L). */
function generateProtocol(): string {
  const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `AG-${ymd}-${suffix}`;
}

function addMinutesToHHmm(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

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

    return { ok: true, protocol, appointmentId };
  } catch (err) {
    // Constraint EXCLUDE violada → 409 conceitual
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2010"
    ) {
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
