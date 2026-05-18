import "server-only";
import { db } from "@/lib/db";
import { addDays, addHours, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { TZ } from "@/lib/time";
import { computeSlots } from "./slot-engine";
import type { BlockedDateEntry } from "./components/calendar-picker";

export type SlotRules = {
  /** Mínimo de horas entre agora e o início do slot. */
  minNoticeHours?: number;
  /** Janela máxima (em dias corridos) a partir de hoje. */
  maxDaysAhead?: number;
  /** Intervalo entre slots em minutos (padrão: 60). */
  slotStep?: number;
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
    select: { durationMinutes: true, bufferPreMinutes: true, bufferPosMinutes: true },
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
        service: { select: { bufferPreMinutes: true, bufferPosMinutes: true } },
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

  // Filtra RecurringBlocks pelo dia atual e converte para BlockedRange
  const recurringBlockedRanges = recurringBlocks.flatMap((rb) => {
    const applies =
      (rb.pattern === "weekly" && rb.weekDay === weekDay) ||
      (rb.pattern === "yearly" && rb.month === month && rb.dayOfMonth === dayOfMonth);
    if (!applies) return [];
    return [{ startTime: rb.startTime, endTime: rb.endTime }];
  });

  const earliestSlotStart =
    rules?.minNoticeHours != null ? addHours(new Date(), rules.minNoticeHours) : null;

  return computeSlots({
    durationMinutes: service.durationMinutes,
    slotStep: rules?.slotStep,
    availabilities: ranges,
    appointments: existingAppts.map((a) => ({
      startTime: a.startTime,
      endTime: a.endTime,
      bufferPre: a.service.bufferPreMinutes,
      bufferPos: a.service.bufferPosMinutes,
    })),
    blockedRanges: [
      ...partialBlocks.flatMap((b) =>
        b.startTime && b.endTime ? [{ startTime: b.startTime, endTime: b.endTime }] : [],
      ),
      ...recurringBlockedRanges,
    ],
    earliestSlotStart,
    dateIso,
  });
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
