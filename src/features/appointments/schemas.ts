/**
 * Schemas Zod — domínio de agendamentos (painel admin).
 *
 * Validam inputs de Server Actions antes de qualquer acesso ao banco.
 */
import { z } from "zod";

// ─── Criação manual pelo admin ───────────────────────────────────────────────

const phoneRegex = /^[\d\s()+\-.]{8,20}$/;

/**
 * Schema para criação de agendamento pelo admin.
 * Não exige termos (o admin age em nome do cliente).
 * O protocolo é gerado no servidor.
 */
export const adminCreateAppointmentSchema = z.object({
  serviceId: z.string().uuid("Selecione um serviço válido"),
  customerId: z.string().uuid("Cliente inválido").optional().or(z.literal("")),
  /** Se o cliente ainda não existe, o admin pode preencher os dados. */
  customerName: z.string().min(1, "Informe o nome do cliente").max(120),
  customerPhone: z.string().regex(phoneRegex, "Telefone inválido (ex: (45) 99999-9999)"),
  customerEmail: z.string().email("Email inválido").max(200).optional().or(z.literal("")),
  /** Perfil social (ex: @instagram) — opcional. */
  customerInstagram: z.string().max(120).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:mm)"),
  briefing: z.string().max(2000).optional().or(z.literal("")),
  /** Status inicial — admin pode criar como confirmado ou pendente. */
  status: z.enum(["CONFIRMED", "PENDING"]).optional(),
});

export type AdminCreateAppointmentInput = z.infer<typeof adminCreateAppointmentSchema>;

// ─── Mudança de status ────────────────────────────────────────────────────────

export const appointmentStatusValues = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELED",
  "EXPIRED",
] as const;

export const updateStatusSchema = z.object({
  appointmentId: z.string().uuid("ID inválido"),
  status: z.enum(appointmentStatusValues),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ─── Atualização de duração real ─────────────────────────────────────────────

export const updateActualDurationSchema = z.object({
  appointmentId: z.string().uuid("ID inválido"),
  actualDurationMinutes: z.number().int().min(1, "Mínimo 1 minuto").max(600, "Máximo 10 horas"),
});

export type UpdateActualDurationInput = z.infer<typeof updateActualDurationSchema>;

// ─── Reajuste ativo de duração ───────────────────────────────────────────────

/**
 * Schema para reajustar a duração de um agendamento ainda ativo.
 * Diferente de `updateActualDuration`: este recalcula `endTime` e
 * revalida a anti-sobreposição (EXCLUDE USING gist) no banco.
 */
export const updateAppointmentDurationSchema = z.object({
  appointmentId: z.string().uuid("ID inválido"),
  durationMinutes: z.number().int().min(15, "Mínimo 15 minutos").max(600, "Máximo 10 horas"),
});

export type UpdateAppointmentDurationInput = z.infer<typeof updateAppointmentDurationSchema>;
