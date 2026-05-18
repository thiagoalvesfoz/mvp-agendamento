/**
 * Helpers compartilhados pelas views da Agenda (Dia/Semana/Mês/Pendentes).
 *
 * Cuidado com fuso: appointments e blockedDates vêm do Prisma como `@db.Date`,
 * serializados em `YYYY-MM-DDT00:00:00.000Z`. Em navegadores em BRT, `getDate()`
 * voltaria o dia anterior — leia sempre via getters UTC.
 */
import type { AppointmentCard } from "@/features/appointments/types";

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISO(iso: string): Date {
  // Meio-dia evita problemas de DST/UTC ao construir uma data "local de exibição"
  return new Date(`${iso}T12:00:00`);
}

export function isoFromDbDate(value: Date): string {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function daysDiff(dbDate: Date, todayISO: string): number {
  const [y, m, d] = todayISO.split("-").map(Number) as [number, number, number];
  return Math.round(
    (Date.UTC(dbDate.getUTCFullYear(), dbDate.getUTCMonth(), dbDate.getUTCDate()) -
      Date.UTC(y, m - 1, d)) /
      86_400_000,
  );
}

export function buildBlockedMap(
  dates: { date: Date; reason: string | null }[],
): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const b of dates) m.set(isoFromDbDate(b.date), b.reason);
  return m;
}

export function groupByDay(appointments: AppointmentCard[]): Map<string, AppointmentCard[]> {
  const map = new Map<string, AppointmentCard[]>();
  for (const a of appointments) {
    const iso = isoFromDbDate(a.date);
    const arr = map.get(iso) ?? [];
    arr.push(a);
    map.set(iso, arr);
  }
  return map;
}
