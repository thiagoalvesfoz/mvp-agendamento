import "server-only";
import { db } from "@/lib/db";
import { addDays, addHours, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { TZ, combineDateAndTimeInTZ } from "@/lib/time";
import type { BlockedDateEntry } from "./components/calendar-picker";

export type SlotRules = {
  /** Mínimo de horas entre agora e o início do slot. */
  minNoticeHours?: number;
  /** Janela máxima (em dias corridos) a partir de hoje. */
  maxDaysAhead?: number;
};

export type ServiceForBooking = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferPreMinutes: number;
  bufferPosMinutes: number;
};

/** Lista de serviços ativos para o fluxo público. */
export async function getActiveServices(): Promise<ServiceForBooking[]> {
  const services = await db.service.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      bufferPreMinutes: true,
      bufferPosMinutes: true,
    },
    orderBy: { name: "asc" },
  });
  return services;
}

/**
 * Slots disponíveis para um serviço em uma data específica.
 *
 * VERSÃO DESCOBERTA — simplificada:
 *  - Considera apenas o horário base de availability do dia da semana
 *  - Considera agendamentos PENDING/CONFIRMED/COMPLETED como ocupados
 *  - Gera slots de 30 em 30 minutos
 *
 * TODO (RN13 completo):
 *  - blocked_dates parciais (startTime/endTime preenchidos) — dias inteiros já são bloqueados no calendário via getBlockedDatesForCalendar
 *  - recurring_blocks (weekly/yearly)
 *  - buffer pré/pós dos agendamentos existentes (usar snapshots)
 *  - calcular usando America/Sao_Paulo (Temporal/date-fns-tz)
 *
 * Regras opcionais (passadas pelo caller público; admin não passa para não restringir):
 *  - minNoticeHours: antecedência mínima entre agora e o início do slot
 *  - maxDaysAhead: janela máxima em dias a partir de hoje
 */
export async function getAvailableSlotsForDate(
  serviceId: string,
  dateIso: string, // YYYY-MM-DD
  rules?: SlotRules,
): Promise<string[]> {
  // Janela máxima: rejeita data inteira fora do limite
  if (rules?.maxDaysAhead != null) {
    const latestISO = formatInTimeZone(addDays(new Date(), rules.maxDaysAhead), TZ, "yyyy-MM-dd");
    if (dateIso > latestISO) return [];
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true },
  });
  if (!service) return [];

  // Dia da semana 0=domingo...6=sábado
  const date = new Date(`${dateIso}T12:00:00`);
  const weekDay = date.getDay();

  const ranges = await db.availability.findMany({
    where: { weekDay },
    orderBy: { startTime: "asc" },
  });

  if (ranges.length === 0) return [];

  // Agendamentos ativos no dia
  const existing = await db.appointment.findMany({
    where: {
      date,
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    select: { startTime: true, endTime: true },
  });

  const occupied = new Set<string>();
  for (const a of existing) {
    occupied.add(`${a.startTime}-${a.endTime}`);
  }

  // Antecedência mínima: instante mais cedo aceitável para início do slot
  const earliestStart =
    rules?.minNoticeHours != null ? addHours(new Date(), rules.minNoticeHours) : null;

  // Gera slots de 30 em 30
  const SLOT_STEP = 30;
  const slots: string[] = [];

  for (const r of ranges) {
    let cur = toMinutes(r.startTime);
    const end = toMinutes(r.endTime);
    while (cur + service.durationMinutes <= end) {
      const startStr = toHHmm(cur);
      const endStr = toHHmm(cur + service.durationMinutes);
      const overlap = Array.from(occupied).some((slot) => {
        const [s, e] = slot.split("-");
        if (!s || !e) return false;
        return overlaps(startStr, endStr, s, e);
      });
      const beforeMinNotice =
        earliestStart != null && combineDateAndTimeInTZ(dateIso, startStr) < earliestStart;
      if (!overlap && !beforeMinNotice) slots.push(startStr);
      cur += SLOT_STEP;
    }
  }

  return slots;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/**
 * Datas integralmente bloqueadas para exibição no calendário público.
 *
 * Apenas registros sem startTime/endTime são retornados — esses representam
 * bloqueios de dia inteiro e devem desabilitar a célula do calendário.
 * Bloqueios parciais (com horário definido) afetam apenas a geração de slots
 * e não são tratados aqui.
 */
export async function getBlockedDatesForCalendar(): Promise<BlockedDateEntry[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db.blockedDate.findMany({
    where: {
      date: { gte: today },
      startTime: null, // dia inteiro bloqueado
    },
    select: { date: true, reason: true },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({
    // @db.Date é uma data calendário pura; Prisma a devolve como Date à
    // meia-noite UTC. Os componentes calendário só estão corretos nos
    // slots UTC — qualquer conversão de fuso desloca o dia.
    date: r.date.toISOString().slice(0, 10),
    reason: r.reason ?? undefined,
  }));
}

/** Próximos N dias para o seletor — sem verificar se há slot, só para construir UI. */
export function getNextDays(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }).map((_, i) => format(addDays(today, i), "yyyy-MM-dd"));
}
