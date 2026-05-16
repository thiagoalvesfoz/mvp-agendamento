/**
 * Tipos de domínio — agendamentos.
 *
 * Definidos aqui e reutilizados em queries, actions e componentes.
 * Nunca importe instâncias do Prisma neste arquivo.
 */
import type { AppointmentStatus } from "@prisma/client";

// ─── Tipos de leitura (DAL) ──────────────────────────────────────────────────

/** Card compacto para a view de dia na Agenda. */
export type AppointmentCard = {
  id: string;
  protocol: string;
  startTime: string;
  endTime: string;
  date: Date;
  status: AppointmentStatus;
  /** Snapshot — nome do serviço no momento do agendamento. */
  serviceNameSnapshot: string;
  /** Snapshot — duração em minutos no momento do agendamento. */
  durationMinutesSnapshot: number;
  /** Snapshot — nome do cliente no momento do agendamento. */
  customerNameSnapshot: string;
  /** Snapshot — contato (telefone normalizado) no momento do agendamento. */
  customerContactSnapshot: string;
  /** ID do cliente atual (para link de detalhe). */
  customerId: string;
};

/** Detalhe completo de um agendamento para a página `/admin/agenda/[id]`. */
export type AppointmentDetail = {
  id: string;
  protocol: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  briefing: string | null;
  actualDurationMinutes: number | null;

  // Snapshots de serviço
  serviceNameSnapshot: string;
  durationMinutesSnapshot: number;
  bufferPreSnapshot: number;
  bufferPosSnapshot: number;

  // Snapshots de cliente
  customerNameSnapshot: string;
  customerContactSnapshot: string;
  customerEmailSnapshot: string | null;
  customerSocialMediaSnapshot: string | null;

  // Relacionamentos
  serviceId: string;
  customerId: string;
  rescheduledToId: string | null;

  createdAt: Date;
  updatedAt: Date;

  history: AppointmentHistoryEntry[];
};

export type AppointmentHistoryEntry = {
  id: string;
  eventType: string;
  statusFrom: string | null;
  statusTo: string | null;
  changedBy: string;
  reason: string | null;
  createdAt: Date;
};

// ─── Tipos de mutação (Server Actions) ──────────────────────────────────────

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
