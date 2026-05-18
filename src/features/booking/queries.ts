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
 * Slots disponíveis para um serviço em uma data específica (RN13 completo).
 *
 * Considera:
 *  - Horário base de availability do dia da semana
 *  - Agendamentos PENDING/CONFIRMED/COMPLETED com buffer pré/pós (snapshots)
 *  - BlockedDates parciais (startTime/endTime preenchidos)
 *  - RecurringBlocks weekly/yearly — parciais ou dia inteiro
 *  - Antecedência mínima (minNoticeHours) e janela máxima (maxDaysAhead)
 *
 * Retorno vazio [] significa dia indisponível (sem availability, dia bloqueado,
 * ou todos os slots ocupados).
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
  const [, monthStr, dayStr] = dateIso.split("-");
  const month = parseInt(monthStr ?? "0", 10); // 1-12
  const dayOfMonth = parseInt(dayStr ?? "0", 10); // 1-31

  // Busca em paralelo: availability + agendamentos + bloqueios parciais + recorrentes
  const [ranges, existingAppts, partialBlocks, recurringBlocks] = await Promise.all([
    db.availability.findMany({
      where: { weekDay },
      orderBy: { startTime: "asc" },
    }),
    db.appointment.findMany({
      where: {
        date,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      select: {
        startTime: true,
        endTime: true,
        bufferPreSnapshot: true,
        bufferPosSnapshot: true,
      },
    }),
    db.blockedDate.findMany({
      where: {
        date: new Date(dateIso),
        startTime: { not: null },
        endTime: { not: null },
      },
      select: { startTime: true, endTime: true },
    }),
    db.recurringBlock.findMany({
      select: {
        pattern: true,
        weekDay: true,
        month: true,
        dayOfMonth: true,
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  if (ranges.length === 0) return [];

  // Bloqueios de dia inteiro por RecurringBlock (retorna imediatamente)
  for (const rb of recurringBlocks) {
    const applies =
      (rb.pattern === "weekly" && rb.weekDay === weekDay) ||
      (rb.pattern === "yearly" && rb.month === month && rb.dayOfMonth === dayOfMonth);
    if (applies && !rb.startTime && !rb.endTime) return [];
  }

  // Constrói lista de intervalos bloqueados (em minutos)
  type Interval = { start: number; end: number };
  const blocked: Interval[] = [];

  for (const appt of existingAppts) {
    blocked.push({
      start: toMinutes(appt.startTime) - (appt.bufferPreSnapshot ?? 0),
      end: toMinutes(appt.endTime) + (appt.bufferPosSnapshot ?? 0),
    });
  }

  for (const b of partialBlocks) {
    if (b.startTime && b.endTime) {
      blocked.push({ start: toMinutes(b.startTime), end: toMinutes(b.endTime) });
    }
  }

  for (const rb of recurringBlocks) {
    const applies =
      (rb.pattern === "weekly" && rb.weekDay === weekDay) ||
      (rb.pattern === "yearly" && rb.month === month && rb.dayOfMonth === dayOfMonth);
    if (applies && rb.startTime && rb.endTime) {
      blocked.push({ start: toMinutes(rb.startTime), end: toMinutes(rb.endTime) });
    }
  }

  // Antecedência mínima
  const earliestStart =
    rules?.minNoticeHours != null ? addHours(new Date(), rules.minNoticeHours) : null;

  const SLOT_STEP = 30;
  const slots: string[] = [];

  for (const r of ranges) {
    let cur = toMinutes(r.startTime);
    const rangeEnd = toMinutes(r.endTime);

    while (cur + service.durationMinutes <= rangeEnd) {
      const slotEnd = cur + service.durationMinutes;
      const isBlocked = blocked.some(({ start, end }) => cur < end && start < slotEnd);
      const tooEarly =
        earliestStart != null && combineDateAndTimeInTZ(dateIso, toHHmm(cur)) < earliestStart;

      if (!isBlocked && !tooEarly) slots.push(toHHmm(cur));
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
