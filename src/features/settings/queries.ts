/**
 * DAL (Data Access Layer) — domínio de settings.
 *
 * Importar somente em Server Components / Server Actions.
 * Nunca expõe instâncias do Prisma ou tipos não-serializáveis.
 */
import "server-only";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/time";
import type { Availability, BlockedDate, RecurringBlock, Settings } from "@prisma/client";

// ── Tipos exportados (serializáveis) ─────────────────────────────────────────

export type AvailabilityRow = Pick<Availability, "id" | "weekDay" | "startTime" | "endTime">;

export type BlockedDateRow = Pick<BlockedDate, "id" | "date" | "startTime" | "endTime" | "reason">;

export type RecurringBlockRow = Pick<
  RecurringBlock,
  "id" | "pattern" | "weekDay" | "month" | "dayOfMonth" | "startTime" | "endTime" | "reason"
>;

export type SettingsRow = Pick<
  Settings,
  | "id"
  | "minimumScheduleNoticeHours"
  | "maximumScheduleDaysAhead"
  | "pendingExpirationHours"
  | "retentionMonths"
  | "notificationEmail"
  | "publicSlug"
>;

export type LandingConfigRow = {
  landingName: string;
  landingTagline: string;
  landingHandle: string;
  landingCity: string;
  landingAbout: string;
  landingCallout: string;
  landingCoverLabel: string;
  landingCtaLabel: string;
};

// ── Disponibilidade ───────────────────────────────────────────────────────────

/**
 * Retorna todos os registros de disponibilidade, agrupados por weekDay.
 * Cada entrada do Map: weekDay → lista de intervalos (ordenados por startTime).
 */
export async function getAvailability(): Promise<AvailabilityRow[]> {
  return db.availability.findMany({
    select: { id: true, weekDay: true, startTime: true, endTime: true },
    orderBy: [{ weekDay: "asc" }, { startTime: "asc" }],
  });
}

// ── BlockedDates ──────────────────────────────────────────────────────────────

/**
 * Lista próximas datas bloqueadas (hoje ou futuras), ordenadas por data asc.
 * O campo `date` do Prisma com @db.Date chega como Date às 00:00 UTC — tratamos no componente.
 */
export async function listBlockedDates(): Promise<BlockedDateRow[]> {
  const today = todayISO();

  const rows = await db.blockedDate.findMany({
    where: {
      date: { gte: new Date(today) },
    },
    select: { id: true, date: true, startTime: true, endTime: true, reason: true },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({
    ...r,
    // Garante serialização segura para client: converte Date → string ISO
    date: r.date,
  }));
}

/**
 * Datas integralmente bloqueadas dentro de um range [startISO, endISO).
 *
 * Apenas bloqueios de dia inteiro (sem startTime/endTime) — usado para
 * "riscar" células nas views de dia/semana/mês da agenda do admin,
 * espelhando o comportamento do calendário do cliente em
 * `getBlockedDatesForCalendar`.
 */
export async function listBlockedDatesInRange(
  startISO: string,
  endISO: string,
): Promise<{ date: Date; reason: string | null }[]> {
  const start = new Date(startISO);
  const end = new Date(endISO);

  return db.blockedDate.findMany({
    where: {
      date: { gte: start, lt: end },
      startTime: null,
    },
    select: { date: true, reason: true },
    orderBy: { date: "asc" },
  });
}

/** Mês completo via range, mantido para uso direto na view de mês. */
export async function listBlockedDatesByMonth(
  year: number,
  month: number,
): Promise<{ date: Date; reason: string | null }[]> {
  const firstISO = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const next = new Date(firstISO);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const endISO = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  return listBlockedDatesInRange(firstISO, endISO);
}

// ── RecurringBlocks ───────────────────────────────────────────────────────────

export async function listRecurringBlocks(): Promise<RecurringBlockRow[]> {
  return db.recurringBlock.findMany({
    select: {
      id: true,
      pattern: true,
      weekDay: true,
      month: true,
      dayOfMonth: true,
      startTime: true,
      endTime: true,
      reason: true,
    },
    orderBy: { pattern: "asc" },
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

/** Retorna o registro singleton de Settings (id=1). Lança se não existir. */
export async function getSettings(): Promise<SettingsRow> {
  const settings = await db.settings.findUnique({
    where: { id: 1 },
    select: {
      id: true,
      minimumScheduleNoticeHours: true,
      maximumScheduleDaysAhead: true,
      pendingExpirationHours: true,
      retentionMonths: true,
      notificationEmail: true,
      publicSlug: true,
    },
  });

  if (!settings) throw new Error("Settings não encontrado. Rode o seed.");
  return settings;
}

// ── Landing config ────────────────────────────────────────────────────────────

const LANDING_DEFAULTS: LandingConfigRow = {
  landingName: "Estúdio Foz",
  landingTagline: "Fotografia e produção de conteúdo",
  landingHandle: "@estudio.foz",
  landingCity: "Foz do Iguaçu",
  landingAbout:
    "Trabalho com ensaios autorais, cobertura de eventos e produção de conteúdo para redes sociais. Atendimentos com hora marcada — você escolhe o horário e a gente alinha o restante pelo WhatsApp.",
  landingCallout:
    "Os horários são reservados após o seu pedido. Em até 48h, entro em contato pelo WhatsApp para confirmar valores e detalhes.",
  landingCoverLabel: "capa",
  landingCtaLabel: "Ver horários disponíveis",
};

/**
 * Tipo interno que representa as colunas de landing em Settings.
 *
 * IMPORTANTE: O Prisma client precisa ser regenerado (pnpm exec prisma generate)
 * após aplicar a migration `add_landing_fields_to_settings` para que esses campos
 * apareçam nos tipos gerados. Até lá usamos cast limitado a esta função.
 */
type SettingsWithLanding = {
  landingName: string | null;
  landingTagline: string | null;
  landingHandle: string | null;
  landingCity: string | null;
  landingAbout: string | null;
  landingCallout: string | null;
  landingCoverLabel: string | null;
  landingCtaLabel: string | null;
};

/**
 * Carrega configurações da landing page do banco.
 * Aplica fallback aos valores padrão para campos ainda não preenchidos.
 *
 * NOTA: as colunas landing* foram adicionadas à tabela settings via
 * migration `add_landing_fields_to_settings`. Após aplicar a migration,
 * rode `pnpm exec prisma generate` para regenerar os tipos do client.
 * O cast abaixo garante typecheck limpo mesmo antes da regeneração.
 */
export async function getLandingConfig(): Promise<LandingConfigRow> {
  // Cast necessário porque o Prisma client ainda não foi regenerado após a migration.
  // Seguro em runtime desde que a migration tenha sido aplicada ao banco.
  const raw = await db.settings.findUnique({
    where: { id: 1 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const settings = raw as SettingsWithLanding | null;

  if (!settings) return LANDING_DEFAULTS;

  return {
    landingName: settings.landingName || LANDING_DEFAULTS.landingName,
    landingTagline: settings.landingTagline || LANDING_DEFAULTS.landingTagline,
    landingHandle: settings.landingHandle || LANDING_DEFAULTS.landingHandle,
    landingCity: settings.landingCity || LANDING_DEFAULTS.landingCity,
    landingAbout: settings.landingAbout || LANDING_DEFAULTS.landingAbout,
    landingCallout: settings.landingCallout || LANDING_DEFAULTS.landingCallout,
    landingCoverLabel: settings.landingCoverLabel || LANDING_DEFAULTS.landingCoverLabel,
    landingCtaLabel: settings.landingCtaLabel || LANDING_DEFAULTS.landingCtaLabel,
  };
}
