/**
 * DAL (Data Access Layer) — agendamentos.
 *
 * Só leitura. Importar somente em Server Components / Server Actions.
 * Usa helpers de `@/lib/time.ts` para datas no fuso America/Sao_Paulo.
 */
import "server-only";
import { db } from "@/lib/db";
import { fromZonedTime } from "date-fns-tz";
import { TZ } from "@/lib/time";
import type { AppointmentCard, AppointmentDetail } from "./types";

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * Converte uma string YYYY-MM-DD para o intervalo [início, fim) em UTC
 * equivalente ao dia completo no fuso da agenda.
 *
 * Exemplo: "2026-05-16" → 03:00 UTC até 03:00 UTC do dia seguinte
 * (pois BRT = UTC-3).
 */
function dayBoundsUTC(dateISO: string): { gte: Date; lt: Date } {
  const gte = fromZonedTime(`${dateISO}T00:00:00`, TZ);
  const lt = fromZonedTime(`${dateISO}T23:59:59.999`, TZ);
  // Para ser exato, avançamos 1 segundo além
  lt.setMilliseconds(lt.getMilliseconds() + 1);
  return { gte, lt };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Agendamentos de um dia específico, ordenados por horário de início.
 *
 * @param dateISO - Data no formato YYYY-MM-DD (fuso da agenda).
 */
export async function getAppointmentsByDay(dateISO: string): Promise<AppointmentCard[]> {
  const { gte, lt } = dayBoundsUTC(dateISO);

  const rows = await db.appointment.findMany({
    where: {
      date: { gte, lt },
      status: { not: "EXPIRED" },
    },
    select: {
      id: true,
      protocol: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      serviceNameSnapshot: true,
      durationMinutesSnapshot: true,
      customerNameSnapshot: true,
      customerContactSnapshot: true,
      customerId: true,
    },
    orderBy: { startTime: "asc" },
  });

  return rows;
}

/**
 * Agendamentos num intervalo de N dias a partir de uma data inicial.
 * Retorna array plano (serializável para Client Components).
 *
 * @param startISO - Primeira data do intervalo, YYYY-MM-DD.
 * @param days - Quantidade de dias (inclui o startISO).
 */
export async function getAppointmentsByDateRange(
  startISO: string,
  days: number,
): Promise<AppointmentCard[]> {
  const start = fromZonedTime(`${startISO}T00:00:00`, TZ);
  const end = fromZonedTime(`${startISO}T00:00:00`, TZ);
  end.setDate(end.getDate() + days);

  const rows = await db.appointment.findMany({
    where: {
      date: { gte: start, lt: end },
      status: { not: "EXPIRED" },
    },
    select: {
      id: true,
      protocol: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      serviceNameSnapshot: true,
      durationMinutesSnapshot: true,
      customerNameSnapshot: true,
      customerContactSnapshot: true,
      customerId: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return rows;
}

/**
 * Agendamentos PENDING + CONFIRMED — "fila de atenção" na home.
 * Limitado a 50 para não sobrecarregar o payload.
 */
export async function getPendingAndConfirmed(limit = 50): Promise<AppointmentCard[]> {
  const rows = await db.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      id: true,
      protocol: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      serviceNameSnapshot: true,
      durationMinutesSnapshot: true,
      customerNameSnapshot: true,
      customerContactSnapshot: true,
      customerId: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: limit,
  });

  return rows;
}

/**
 * Detalhe de um agendamento específico.
 * Retorna null se não encontrado.
 */
export async function getAppointmentById(id: string): Promise<AppointmentDetail | null> {
  const row = await db.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      protocol: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      briefing: true,
      actualDurationMinutes: true,
      serviceNameSnapshot: true,
      durationMinutesSnapshot: true,
      bufferPreSnapshot: true,
      bufferPosSnapshot: true,
      customerNameSnapshot: true,
      customerContactSnapshot: true,
      customerEmailSnapshot: true,
      customerSocialMediaSnapshot: true,
      serviceId: true,
      customerId: true,
      rescheduledToId: true,
      createdAt: true,
      updatedAt: true,
      history: {
        select: {
          id: true,
          eventType: true,
          statusFrom: true,
          statusTo: true,
          changedBy: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return row;
}

/**
 * Contagem rápida por status — usada no badge da aba Agenda.
 */
export async function countByStatus(): Promise<Record<string, number>> {
  const groups = await db.appointment.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return Object.fromEntries(groups.map((g) => [g.status, g._count.id]));
}

// ─── Agregações para os pills da Agenda ─────────────────────────────────────

/**
 * Stats exibidas no topo da aba Agenda:
 *  - pending  : total de PENDING (qualquer data, demanda atenção)
 *  - today    : agendamentos ativos hoje (qualquer status menos cancelado/expirado)
 *  - week     : agendamentos ativos na semana corrente (domingo a sábado)
 *
 * "Ativo" = não está em CANCELED nem EXPIRED. Inclui PENDING porque a
 * contagem do pill precisa bater com o que aparece na view de dia.
 */
export async function getAgendaStats(todayISOStr: string): Promise<{
  pending: number;
  today: number;
  week: number;
}> {
  const { gte: todayStart, lt: todayEnd } = dayBoundsUTC(todayISOStr);

  // Semana corrente: domingo → sábado da semana que contém hoje.
  // getDay() retorna 0=dom..6=sáb; recuamos até o domingo.
  const [y, m, d] = todayISOStr.split("-").map(Number) as [number, number, number];
  const localToday = new Date(y, m - 1, d);
  const sundayDate = new Date(y, m - 1, d - localToday.getDay());
  const sundayISO = `${sundayDate.getFullYear()}-${String(sundayDate.getMonth() + 1).padStart(2, "0")}-${String(sundayDate.getDate()).padStart(2, "0")}`;
  const weekStart = fromZonedTime(`${sundayISO}T00:00:00`, TZ);
  const weekEnd = fromZonedTime(`${sundayISO}T00:00:00`, TZ);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [pending, today, week] = await Promise.all([
    db.appointment.count({ where: { status: "PENDING" } }),
    db.appointment.count({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["CANCELED", "EXPIRED"] },
      },
    }),
    db.appointment.count({
      where: {
        date: { gte: weekStart, lt: weekEnd },
        status: { notIn: ["CANCELED", "EXPIRED"] },
      },
    }),
  ]);

  return { pending, today, week };
}

/**
 * Agendamentos de um mês — para a view de mês (apenas dots e contagens).
 *
 * @param year - Ano de quatro dígitos.
 * @param month - Mês 0-11 (padrão JS).
 */
export async function getAppointmentsByMonth(
  year: number,
  month: number,
): Promise<Pick<AppointmentCard, "id" | "date" | "status">[]> {
  const firstISO = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const start = fromZonedTime(`${firstISO}T00:00:00`, TZ);
  const end = fromZonedTime(`${firstISO}T00:00:00`, TZ);
  // Avança para o primeiro dia do mês seguinte (cuida de virada de ano)
  end.setMonth(end.getMonth() + 1);

  const rows = await db.appointment.findMany({
    where: {
      date: { gte: start, lt: end },
      status: { notIn: ["CANCELED", "EXPIRED"] },
    },
    select: { id: true, date: true, status: true },
  });

  return rows;
}

/**
 * Todos os agendamentos PENDING (sem limite — usado na view "Pendentes").
 * Ordena por data crescente.
 */
export async function getAllPending(): Promise<AppointmentCard[]> {
  return db.appointment.findMany({
    where: { status: "PENDING" },
    select: {
      id: true,
      protocol: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      serviceNameSnapshot: true,
      durationMinutesSnapshot: true,
      customerNameSnapshot: true,
      customerContactSnapshot: true,
      customerId: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}
