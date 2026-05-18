"use server";

/**
 * Server Actions — domínio de agendamentos (painel admin).
 *
 * Todas as actions:
 *  1. Verificam a sessão via auth() — nunca confiar no middleware.
 *  2. Validam o payload com Zod antes de tocar o banco.
 *  3. Registram o evento no AppointmentHistory para auditoria.
 *  4. Chamam revalidatePath para invalidar o cache das páginas afetadas.
 *
 * Erro 23P01 (EXCLUDE USING gist — anti-sobreposição) é tratado como
 * conflito e retornado como mensagem amigável, não como exceção interna.
 */

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { TZ, formatDateBR, addMinutesToHHmm } from "@/lib/time";
import { normalizePhone } from "@/lib/phone";
import { generateProtocol } from "@/lib/protocol";
import { getLandingConfig } from "@/features/settings/queries";
import { notifyCustomerConfirmed } from "./notify";
import {
  adminCreateAppointmentSchema,
  updateStatusSchema,
  updateActualDurationSchema,
  updateAppointmentDurationSchema,
  type AdminCreateAppointmentInput,
  type UpdateStatusInput,
  type UpdateActualDurationInput,
  type UpdateAppointmentDurationInput,
} from "./schemas";
import type { ActionResult } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAuth(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Não autorizado" };
  return { ok: true, userId: session.user.email };
}

/** Detecta se o erro é uma violação da constraint EXCLUDE (anti-sobreposição). */
function isOverlapError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2010") {
    return true;
  }
  if (err instanceof Error && err.message.includes("23P01")) {
    return true;
  }
  return false;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Cria um agendamento manualmente pelo admin.
 *
 * Comportamento de cliente:
 * - Se o telefone já existe → atualiza nome/email (upsert).
 * - Se não existe → cria novo Customer.
 *
 * Snapshots (RN15): copia dados de serviço e cliente no INSERT.
 * Conflito de horário (23P01): retorna { ok: false, error: <amigável> }.
 */
export async function adminCreateAppointment(
  input: AdminCreateAppointmentInput,
): Promise<ActionResult<{ protocol: string; id: string }>> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = adminCreateAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const data = parsed.data;

  // Normaliza telefone
  let phone: string;
  try {
    phone = normalizePhone(data.customerPhone);
  } catch {
    return { ok: false, error: "Telefone inválido" };
  }

  // Busca serviço — snapshot do acordo atual
  const service = await db.service.findUnique({
    where: { id: data.serviceId },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      active: true,
    },
  });

  if (!service || !service.active) {
    return { ok: false, error: "Serviço indisponível ou desativado" };
  }

  const endTime = addMinutesToHHmm(data.startTime, service.durationMinutes);
  const protocol = generateProtocol();

  // Converte a data para UTC usando o fuso da agenda (RN10)
  const dateUTC = fromZonedTime(`${data.date}T12:00:00`, TZ);

  try {
    const result = await db.$transaction(async (tx) => {
      // Upsert do customer por telefone
      const existing = await tx.customer.findUnique({ where: { phone } });
      const customer = existing
        ? await tx.customer.update({
            where: { id: existing.id },
            data: {
              name: data.customerName,
              email: data.customerEmail || null,
              socialMedia: data.customerInstagram || existing.socialMedia,
            },
          })
        : await tx.customer.create({
            data: {
              phone,
              name: data.customerName,
              email: data.customerEmail || null,
              socialMedia: data.customerInstagram || null,
            },
          });

      // Cria agendamento com snapshots (RN15)
      const appt = await tx.appointment.create({
        data: {
          protocol,
          serviceId: service.id,
          customerId: customer.id,
          // Snapshots de serviço — imutáveis após INSERT
          serviceNameSnapshot: service.name,
          durationMinutesSnapshot: service.durationMinutes,
          // Snapshots de cliente — imutáveis após INSERT
          customerNameSnapshot: data.customerName,
          customerContactSnapshot: phone,
          customerEmailSnapshot: data.customerEmail || null,
          customerSocialMediaSnapshot: data.customerInstagram || null,
          briefing: data.briefing || null,
          date: dateUTC,
          startTime: data.startTime,
          endTime,
          // Admin escolhe entre confirmado (default) ou pendente
          status: data.status ?? "CONFIRMED",
          consentAcceptedAt: new Date(),
          consentVersion: "v1",
        },
        select: { id: true },
      });

      // Registra evento inicial no histórico
      await tx.appointmentHistory.create({
        data: {
          appointmentId: appt.id,
          eventType: "status_change",
          statusFrom: null,
          statusTo: data.status ?? "CONFIRMED",
          changedBy: `admin:${guard.userId}`,
          reason: "criado pelo admin",
        },
      });

      return { id: appt.id, customerId: customer.id };
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/agenda/${result.id}`);

    return { ok: true, data: { protocol, id: result.id } };
  } catch (err) {
    if (isOverlapError(err)) {
      return {
        ok: false,
        error: "Esse horário já está ocupado. Escolha outro horário disponível.",
      };
    }
    log.error({ err }, "adminCreateAppointment failed");
    return {
      ok: false,
      error: "Não foi possível criar o agendamento. Tente novamente.",
    };
  }
}

/**
 * Atualiza o status de um agendamento.
 *
 * Transições válidas (não forçadas aqui — o admin tem controle total,
 * mas o histórico registra tudo para auditoria):
 *  PENDING  → CONFIRMED | CANCELED | EXPIRED
 *  CONFIRMED → COMPLETED | NO_SHOW | CANCELED
 *  Qualquer → qualquer (admin override)
 */
export async function updateAppointmentStatus(input: UpdateStatusInput): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const { appointmentId, status, reason } = parsed.data;

  // Busca dados atuais — `status` para registrar a transição e snapshots
  // para possíveis notificações pós-commit (sem reler banco no after()).
  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
      protocol: true,
      serviceNameSnapshot: true,
      customerNameSnapshot: true,
      customerEmailSnapshot: true,
      date: true,
      startTime: true,
    },
  });

  if (!current) return { ok: false, error: "Agendamento não encontrado" };

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: { status },
    }),
    db.appointmentHistory.create({
      data: {
        appointmentId,
        eventType: "status_change",
        statusFrom: current.status,
        statusTo: status,
        changedBy: `admin:${guard.userId}`,
        reason: reason || null,
      },
    }),
  ]);

  log.info(
    { appointmentId, statusFrom: current.status, statusTo: status, changedBy: guard.userId },
    "appointment.status_changed",
  );

  revalidatePath("/admin");
  revalidatePath(`/admin/agenda/${appointmentId}`);

  // Email pós-commit. Só CONFIRMED notifica cliente no MVP.
  // Skip se cliente não informou email no booking.
  if (status === "CONFIRMED" && current.customerEmailSnapshot) {
    const dateFormatted = formatDateBR(current.date);
    const landing = await getLandingConfig();

    after(async () => {
      await notifyCustomerConfirmed({
        protocol: current.protocol,
        customerName: current.customerNameSnapshot,
        customerEmail: current.customerEmailSnapshot!,
        serviceName: current.serviceNameSnapshot,
        dateFormatted,
        startTime: current.startTime,
        studioName: landing.landingName,
      });
    });
  }

  return { ok: true };
}

/**
 * Registra a duração real do atendimento (RN24).
 *
 * Usado pelo admin ao concluir o atendimento para registrar
 * quanto tempo ele realmente durou (pode diferir do estimado).
 */
export async function updateActualDuration(
  input: UpdateActualDurationInput,
): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateActualDurationSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const { appointmentId, actualDurationMinutes } = parsed.data;

  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      durationMinutesSnapshot: true,
      actualDurationMinutes: true,
      endTime: true,
    },
  });

  if (!current) return { ok: false, error: "Agendamento não encontrado" };

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: { actualDurationMinutes },
    }),
    db.appointmentHistory.create({
      data: {
        appointmentId,
        eventType: "duration_change",
        durationFrom: current.actualDurationMinutes ?? current.durationMinutesSnapshot,
        durationTo: actualDurationMinutes,
        changedBy: `admin:${guard.userId}`,
        reason: "duração real registrada",
      },
    }),
  ]);

  revalidatePath(`/admin/agenda/${appointmentId}`);

  return { ok: true };
}

/**
 * Reajusta a duração de um agendamento ativo.
 *
 * Recalcula `endTime` a partir de `startTime + durationMinutes` e atualiza
 * `actualDurationMinutes` para refletir a duração efetiva. A constraint
 * EXCLUDE USING gist em `appointments` cobre o intervalo final, então uma
 * extensão que invada outro slot dispara 23P01 — retornado como mensagem
 * amigável.
 *
 * Não permite ajuste em estados que não ocupam mais o slot
 * (CANCELED / EXPIRED / NO_SHOW).
 */
export async function updateAppointmentDuration(
  input: UpdateAppointmentDurationInput,
): Promise<ActionResult<{ endTime: string }>> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateAppointmentDurationSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const { appointmentId, durationMinutes } = parsed.data;

  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
      startTime: true,
      endTime: true,
      durationMinutesSnapshot: true,
      actualDurationMinutes: true,
    },
  });

  if (!current) return { ok: false, error: "Agendamento não encontrado" };

  if (current.status !== "PENDING" && current.status !== "CONFIRMED") {
    return {
      ok: false,
      error: "Só é possível ajustar duração de agendamentos pendentes ou confirmados.",
    };
  }

  const newEndTime = addMinutesToHHmm(current.startTime, durationMinutes);
  if (newEndTime === current.endTime) {
    return { ok: true, data: { endTime: current.endTime } };
  }

  try {
    await db.$transaction([
      db.appointment.update({
        where: { id: appointmentId },
        data: {
          endTime: newEndTime,
          actualDurationMinutes: durationMinutes,
        },
      }),
      db.appointmentHistory.create({
        data: {
          appointmentId,
          eventType: "duration_change",
          durationFrom: current.actualDurationMinutes ?? current.durationMinutesSnapshot,
          durationTo: durationMinutes,
          changedBy: `admin:${guard.userId}`,
          reason: "duração ajustada manualmente",
        },
      }),
    ]);
  } catch (err) {
    if (isOverlapError(err)) {
      return {
        ok: false,
        error: "A nova duração conflita com outro agendamento. Reduza o tempo ou remarque.",
      };
    }
    log.error({ err }, "updateAppointmentDuration failed");
    return {
      ok: false,
      error: "Não foi possível ajustar a duração. Tente novamente.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/agenda/${appointmentId}`);

  return { ok: true, data: { endTime: newEndTime } };
}
