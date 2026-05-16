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
