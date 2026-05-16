/**
 * Helpers de tempo com fuso fixo em America/Sao_Paulo.
 *
 * IMPORTANTE: NUNCA use `new Date()` direto para regras de negócio.
 * A Vercel roda em UTC; comparações como "antecedência mínima" precisam
 * sempre converter para o fuso da agenda.
 *
 * Esta API usa date-fns + date-fns-tz por estabilidade. Quando o suporte
 * a `Temporal` for nativo no Node, migrar para ele.
 */
import { addMinutes, addHours, addDays, isBefore, isAfter, format, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const TZ = "America/Sao_Paulo";

/** Agora, no fuso da agenda. */
export function nowInTZ(): Date {
  return toZonedTime(new Date(), TZ);
}

/** Combina date (YYYY-MM-DD) + time (HH:mm) em uma data UTC equivalente ao horário no fuso da agenda. */
export function combineDateAndTimeInTZ(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, TZ);
}

/** Formata uma data UTC no fuso da agenda. Exemplo: "14/05/2026 às 09:00". */
export function formatInTZ(date: Date, pattern = "dd/MM/yyyy 'às' HH:mm"): string {
  return formatInTimeZone(date, TZ, pattern);
}

/** Retorna a próxima ocorrência de um horário (HH:mm) a partir de uma data. */
export function nextSlotAfter(baseDate: Date, durationMinutes: number): Date {
  return addMinutes(baseDate, durationMinutes);
}

export { addMinutes, addHours, addDays, isBefore, isAfter, format, parseISO };

// ── Helpers de calendário PT-BR ──────────────────────────────────────────────

const WEEKDAY_NAMES_LONG = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const WEEKDAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const MONTH_NAMES_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

/** Retorna o nome completo do dia da semana em PT-BR (0 = domingo). */
export function weekdayName(dow: number): string {
  return WEEKDAY_NAMES_LONG[dow] ?? "—";
}

/** Retorna o nome abreviado do dia da semana em PT-BR (0 = domingo). */
export function weekdayShort(dow: number): string {
  return WEEKDAY_NAMES_SHORT[dow] ?? "—";
}

/** Retorna o nome abreviado do mês em PT-BR (0 = janeiro). */
export function monthShort(month: number): string {
  return MONTH_NAMES_SHORT[month] ?? "—";
}

/**
 * Formata uma data (objeto Date no TZ local) no padrão brasileiro.
 * Exemplo: "14/05/2026".
 */
export function formatDateBR(date: Date): string {
  return formatInTimeZone(date, TZ, "dd/MM/yyyy");
}

/**
 * Retorna "hoje" no fuso da agenda como string YYYY-MM-DD.
 * Usado para comparar com datas armazenadas como @db.Date.
 */
export function todayISO(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}
