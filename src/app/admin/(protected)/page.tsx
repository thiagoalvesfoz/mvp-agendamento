/**
 * /admin — Aba Agenda.
 *
 * Server Component. Lê `view`, `date` e `ym` (year-month) dos searchParams,
 * busca apenas os dados necessários para a view selecionada e renderiza o
 * `AgendaScreen` (Client Component) que cuida da interação e navegação.
 *
 * URL pattern:
 *   /admin                      → view dia, hoje
 *   /admin?view=day&date=YYYY-MM-DD
 *   /admin?view=week&date=YYYY-MM-DD  (data = primeiro dia do bloco de 7d)
 *   /admin?view=month&ym=2026-05
 *   /admin?view=pending
 */
import { AgendaScreen, type AgendaView } from "@/features/appointments/components/agenda-screen";
import {
  getAgendaStats,
  getAllPending,
  getAppointmentsByDateRange,
  getAppointmentsByMonth,
} from "@/features/appointments/queries";
import { listBlockedDatesByMonth, listBlockedDatesInRange } from "@/features/settings/queries";
import { todayISO } from "@/lib/time";

interface AdminAgendaPageProps {
  searchParams: Promise<{
    view?: string;
    date?: string;
    ym?: string;
  }>;
}

function parseView(raw: string | undefined): AgendaView {
  if (raw === "week" || raw === "month" || raw === "pending") return raw;
  return "day";
}

function parseDate(raw: string | undefined, fallback: string): string {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

/** Soma `days` dias a um ISO YYYY-MM-DD e retorna outro ISO. */
function shiftISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Snap ISO p/ domingo (início) da semana que contém a data.
 * View "Semana" trava sempre dom→sáb, então navegação anterior/próximo continua dom→sáb.
 */
function snapToSundayISO(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseMonth(
  raw: string | undefined,
  fallback: { year: number; month: number },
): { year: number; month: number } {
  const m = raw?.match(/^(\d{4})-(\d{2})$/);
  if (!m) return fallback;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return fallback;
  return { year, month };
}

export default async function AdminAgendaPage({ searchParams }: AdminAgendaPageProps) {
  const params = await searchParams;
  const today = todayISO();

  const view = parseView(params.view);
  const rawSelectedDate = parseDate(params.date, today);
  // Week view sempre começa no domingo (dom → sáb). Snap antes de qualquer fetch.
  const selectedDate = view === "week" ? snapToSundayISO(rawSelectedDate) : rawSelectedDate;
  const todayDate = new Date(`${today}T12:00:00`);
  const { year: monthYear, month: monthMonth } = parseMonth(params.ym, {
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });

  const stats = await getAgendaStats(today);

  // Fetch específico da view atual — evita carga desnecessária
  const [dayAppointments, weekAppointments, monthAppointments, pendingAppointments, blockedDates] =
    await Promise.all([
      // Day view busca range [-3, +3] do strip pra alimentar dots dos 7 dias visíveis.
      // Lista do dia selecionado filtra no client a partir desse mesmo conjunto.
      view === "day"
        ? getAppointmentsByDateRange(shiftISO(selectedDate, -3), 7)
        : Promise.resolve([]),
      view === "week" ? getAppointmentsByDateRange(selectedDate, 7) : Promise.resolve([]),
      view === "month" ? getAppointmentsByMonth(monthYear, monthMonth) : Promise.resolve([]),
      view === "pending" ? getAllPending() : Promise.resolve([]),
      // Day: cobre o strip de 7 dias [-3, +3]. Week: bloco de 7 dias. Month: mês inteiro.
      view === "day"
        ? listBlockedDatesInRange(shiftISO(selectedDate, -3), shiftISO(selectedDate, 4))
        : view === "week"
          ? listBlockedDatesInRange(selectedDate, shiftISO(selectedDate, 7))
          : view === "month"
            ? listBlockedDatesByMonth(monthYear, monthMonth)
            : Promise.resolve([]),
    ]);

  return (
    <AgendaScreen
      view={view}
      selectedDate={selectedDate}
      todayISO={today}
      monthYear={monthYear}
      monthMonth={monthMonth}
      stats={stats}
      dayAppointments={dayAppointments}
      weekAppointments={weekAppointments}
      monthAppointments={monthAppointments}
      monthBlockedDates={view === "month" ? blockedDates : []}
      dayBlockedDates={view === "day" ? blockedDates : []}
      weekBlockedDates={view === "week" ? blockedDates : []}
      pendingAppointments={pendingAppointments}
    />
  );
}
