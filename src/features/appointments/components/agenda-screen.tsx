"use client";

/**
 * AgendaScreen — shell completo da aba Agenda.
 *
 * Client Component porque controla:
 *  - troca de view (Dia/Semana/Mês/Pendentes) sincronizada com a URL
 *  - navegação de data/mês (strip + setas) sem full page reload
 *  - abertura do FAB de novo agendamento via bottom sheet
 *
 * Renderização das listas é pura (sem fetch no cliente) — os dados vêm
 * pré-buscados pelo Server Component pai (`/admin/page.tsx`). Quando o
 * usuário troca de data/view, fazemos `router.push` para o servidor
 * re-fetchar com os novos searchParams.
 */
import { I } from "@/components/shared/icons";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import type { AppointmentCard } from "@/features/appointments/types";
import { formatDateBR, formatDuration, monthShort, weekdayName, weekdayShort } from "@/lib/time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

// ─── Tipos públicos ─────────────────────────────────────────────────────────

export type AgendaView = "day" | "week" | "month" | "pending";

export interface AgendaScreenProps {
  view: AgendaView;
  /** Data foco (YYYY-MM-DD no fuso SP) — usada nas views day/week. */
  selectedDate: string;
  /** Hoje (YYYY-MM-DD), calculada no servidor (fuso SP). */
  todayISO: string;
  /** Ano/mês foco da view mês (mes 0-11). */
  monthYear: number;
  monthMonth: number;
  /** Stats agregados para os pills. */
  stats: { pending: number; today: number; week: number };
  /** Dados específicos da view atual — apenas um destes é preenchido. */
  dayAppointments?: AppointmentCard[];
  weekAppointments?: AppointmentCard[];
  monthAppointments?: Pick<AppointmentCard, "id" | "date" | "status">[];
  /** Datas bloqueadas (dia inteiro) dentro do mês foco — usadas para riscar células. */
  monthBlockedDates?: { date: Date; reason: string | null }[];
  /** Datas bloqueadas no strip de 7 dias da view de dia. */
  dayBlockedDates?: { date: Date; reason: string | null }[];
  /** Datas bloqueadas no bloco de 7 dias da view de semana. */
  weekBlockedDates?: { date: Date; reason: string | null }[];
  pendingAppointments?: AppointmentCard[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(iso: string): Date {
  // Meio-dia evita problemas de DST/UTC ao construir uma data "local de exibição"
  return new Date(`${iso}T12:00:00`);
}

/**
 * Extrai chave YYYY-MM-DD de um valor vindo do Prisma `@db.Date`.
 *
 * Prisma serializa colunas DATE como `YYYY-MM-DDT00:00:00.000Z` (meia-noite
 * UTC). Em navegadores em BRT/UTC-3, `getDate()` voltaria o dia anterior —
 * sempre lemos via getters UTC para preservar o dia exato armazenado.
 */
function isoFromDbDate(value: Date): string {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function dbDateKey(value: Date): string {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DIAS_INITIAL = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ─── Componente principal ───────────────────────────────────────────────────

export function AgendaScreen({
  view,
  selectedDate,
  todayISO,
  monthYear,
  monthMonth,
  stats,
  dayAppointments = [],
  weekAppointments = [],
  monthAppointments = [],
  monthBlockedDates = [],
  dayBlockedDates = [],
  weekBlockedDates = [],
  pendingAppointments = [],
}: AgendaScreenProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function navigate(next: {
    view?: AgendaView;
    date?: string;
    monthYear?: number;
    monthMonth?: number;
  }) {
    const params = new URLSearchParams();
    const v = next.view ?? view;
    if (v !== "day") params.set("view", v);
    if (v === "day" || v === "week") {
      const d = next.date ?? selectedDate;
      if (d !== todayISO) params.set("date", d);
    }
    if (v === "month") {
      const y = next.monthYear ?? monthYear;
      const m = next.monthMonth ?? monthMonth;
      params.set("ym", `${y}-${String(m + 1).padStart(2, "0")}`);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin?${qs}` : "/admin");
    });
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      {/* ── Header com stats ── */}
      <div className="px-5 pb-3 pt-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Agenda
            </p>
            <h1 className="mt-0.5 text-[22px] font-semibold leading-tight tracking-tight">
              Atendimentos
            </h1>
          </div>
        </div>

        {/* Stats pills */}
        <div className="grid grid-cols-3 gap-2">
          <StatPill
            label="Pendentes"
            value={stats.pending}
            active={view === "pending"}
            accent
            onClick={() => navigate({ view: view === "pending" ? "day" : "pending" })}
          />
          <StatPill
            label="Hoje"
            value={stats.today}
            onClick={() => navigate({ view: "day", date: todayISO })}
          />
          <StatPill
            label="Esta semana"
            value={stats.week}
            onClick={() => navigate({ view: "week", date: todayISO })}
          />
        </div>
      </div>

      {/* ── Segmented selector ── */}
      <div className="px-5 pb-3">
        <Segmented
          value={view}
          onChange={(v) => navigate({ view: v as AgendaView })}
          options={[
            { value: "day", label: "Dia" },
            { value: "week", label: "Semana" },
            { value: "month", label: "Mês" },
            { value: "pending", label: "Pendentes" },
          ]}
        />
      </div>

      {/* ── View atual ── */}
      {view === "day" && (
        <DayView
          selectedDate={selectedDate}
          todayISO={todayISO}
          appointments={dayAppointments}
          blockedDates={dayBlockedDates}
          onSelectDate={(iso) => navigate({ view: "day", date: iso })}
        />
      )}
      {view === "week" && (
        <WeekView
          startISO={selectedDate}
          todayISO={todayISO}
          appointments={weekAppointments}
          blockedDates={weekBlockedDates}
          onDayJump={(iso) => navigate({ view: "day", date: iso })}
          onWeekChange={(iso) => navigate({ view: "week", date: iso })}
        />
      )}
      {view === "month" && (
        <MonthView
          year={monthYear}
          month={monthMonth}
          todayISO={todayISO}
          appointments={monthAppointments}
          blockedDates={monthBlockedDates}
          onMonthChange={(y, m) => navigate({ view: "month", monthYear: y, monthMonth: m })}
          onDayJump={(iso) => navigate({ view: "day", date: iso })}
        />
      )}
      {view === "pending" && <PendingView appointments={pendingAppointments} todayISO={todayISO} />}

      {/* ── FAB ── */}
      <Link
        href={`/admin/agenda/novo?date=${selectedDate}`}
        aria-label="Novo agendamento"
        className="press absolute bottom-5 right-5 z-10 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
      >
        <I.Plus size={22} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

// ─── Sub-componentes presentational ─────────────────────────────────────────

interface StatPillProps {
  label: string;
  value: number;
  accent?: boolean;
  active?: boolean;
  onClick: () => void;
}

function StatPill({ label, value, accent, active, onClick }: StatPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press rounded-2xl border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
      )}
    >
      <div
        className={cn(
          "text-[10px] uppercase tracking-[0.12em]",
          active ? "text-[var(--primary-foreground)]/80" : "text-[var(--muted-foreground)]",
        )}
      >
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[22px] font-semibold tabular-nums tracking-tight">{value}</span>
        {accent && !active && value > 0 && (
          <span className="size-1.5 rounded-full bg-[var(--primary)]" />
        )}
      </div>
    </button>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}

function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className="flex w-full rounded-full border border-[var(--border)] bg-[var(--muted)] p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "press flex-1 rounded-full px-2 py-1.5 text-[12.5px] font-medium tracking-tight transition-colors",
              active
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Day view ───────────────────────────────────────────────────────────────

interface DayViewProps {
  selectedDate: string;
  todayISO: string;
  appointments: AppointmentCard[];
  blockedDates: { date: Date; reason: string | null }[];
  onSelectDate: (iso: string) => void;
}

function DayView({
  selectedDate,
  todayISO,
  appointments,
  blockedDates,
  onSelectDate,
}: DayViewProps) {
  // Mapa ISO YYYY-MM-DD → reason (apenas dias do strip estão aqui)
  const blockedByIso = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const b of blockedDates) m.set(isoFromDbDate(b.date), b.reason);
    return m;
  }, [blockedDates]);
  const selectedBlocked = blockedByIso.has(selectedDate);
  const selectedReason = blockedByIso.get(selectedDate) ?? undefined;

  // Agrupa agendamentos do range do strip por dia (chave UTC, @db.Date)
  const apptsByDay = useMemo(() => {
    const map = new Map<string, AppointmentCard[]>();
    for (const a of appointments) {
      const iso = isoFromDbDate(a.date);
      const arr = map.get(iso) ?? [];
      arr.push(a);
      map.set(iso, arr);
    }
    return map;
  }, [appointments]);

  // Lista do dia selecionado (já ordenada na origem por startTime)
  const selectedDayAppointments = useMemo(
    () => apptsByDay.get(selectedDate) ?? [],
    [apptsByDay, selectedDate],
  );
  const selected = parseISO(selectedDate);
  const today = parseISO(todayISO);
  const dayDiff = Math.round(
    (Date.UTC(selected.getFullYear(), selected.getMonth(), selected.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );

  const dayLabel =
    dayDiff === 0
      ? "Hoje"
      : dayDiff === 1
        ? "Amanhã"
        : dayDiff === -1
          ? "Ontem"
          : weekdayName(selected.getDay());

  function shiftDay(delta: number) {
    const d = parseISO(selectedDate);
    d.setDate(d.getDate() + delta);
    onSelectDate(isoFromDate(d));
  }

  // Strip de 7 dias centrado na data selecionada
  const stripDays = useMemo(() => {
    const arr: { iso: string; date: Date }[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = parseISO(selectedDate);
      d.setDate(d.getDate() + i);
      arr.push({ iso: isoFromDate(d), date: d });
    }
    return arr;
  }, [selectedDate]);

  return (
    <>
      {/* Strip + navegação */}
      <div className="px-5 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="press flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
            aria-label="Dia anterior"
          >
            <I.ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <div
              className={cn(
                "text-[15px] font-semibold tracking-tight",
                selectedBlocked &&
                  "text-[color-mix(in_oklch,var(--destructive)_70%,var(--muted-foreground))] line-through decoration-[color-mix(in_oklch,var(--destructive)_55%,transparent)] decoration-[1.4px]",
              )}
            >
              {dayLabel}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
              {formatDateBR(selected)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="press flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
            aria-label="Próximo dia"
          >
            <I.Chevron size={16} />
          </button>
        </div>

        <div className="mt-3 flex justify-between gap-1">
          {stripDays.map(({ iso, date }) => {
            const isSelected = iso === selectedDate;
            const isToday = iso === todayISO;
            const isBlocked = blockedByIso.has(iso);
            const reason = blockedByIso.get(iso) ?? undefined;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(iso)}
                title={isBlocked ? (reason ?? "Dia bloqueado") : undefined}
                className={cn(
                  "press flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-transparent px-1 py-1.5 transition-colors",
                  isSelected
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "hover:bg-[var(--muted)]",
                  isToday && !isSelected && "text-[var(--primary)]",
                  isBlocked &&
                    !isSelected &&
                    "bg-[repeating-linear-gradient(135deg,transparent_0,transparent_3px,color-mix(in_oklch,var(--destructive)_22%,transparent)_3px,color-mix(in_oklch,var(--destructive)_22%,transparent)_4px)]",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    isSelected
                      ? "text-[var(--primary-foreground)]/80"
                      : "text-[var(--muted-foreground)]",
                    isToday && !isSelected && "text-[var(--primary)]",
                  )}
                >
                  {weekdayShort(date.getDay())}
                </span>
                <span
                  className={cn(
                    "text-[15px] font-semibold tabular-nums leading-none",
                    isBlocked &&
                      !isSelected &&
                      "text-[color-mix(in_oklch,var(--destructive)_70%,var(--muted-foreground))] line-through decoration-[color-mix(in_oklch,var(--destructive)_55%,transparent)] decoration-[1.2px]",
                  )}
                >
                  {date.getDate()}
                </span>
                {(() => {
                  const dayAppts = apptsByDay.get(iso) ?? [];
                  if (dayAppts.length === 0) return null;
                  return (
                    <div className="mt-0.5 flex items-center gap-0.5">
                      {dayAppts.slice(0, 3).map((a, i) => (
                        <StatusDot key={i} status={a.status} size="sm" />
                      ))}
                      {dayAppts.length > 3 && (
                        <span
                          className={cn(
                            "ml-0.5 font-mono text-[8.5px] leading-none",
                            isSelected
                              ? "text-[var(--primary-foreground)]/80"
                              : "text-[var(--muted-foreground)]",
                          )}
                        >
                          +{dayAppts.length - 3}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-2">
        {selectedBlocked && <BlockedReasonCard reason={selectedReason} className="mb-3" />}
        {selectedDayAppointments.length === 0 ? (
          selectedBlocked ? (
            <EmptyState
              icon={<I.Calendar size={22} />}
              title="Sem agendamentos"
              desc="Nenhum agendamento foi criado neste dia."
            />
          ) : (
            <EmptyState
              icon={<I.Calendar size={22} />}
              title="Sem agendamentos"
              desc="Aproveite para descansar ou bloqueie o dia."
            />
          )
        ) : (
          <div className="relative">
            <div className="absolute bottom-1 left-[42px] top-1 w-px bg-[var(--border)]" />
            <div className="space-y-2">
              {selectedDayAppointments.map((a) => (
                <DayApptRow key={a.id} appt={a} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DayApptRow({ appt }: { appt: AppointmentCard }) {
  return (
    <Link
      href={`/admin/agenda/${appt.id}`}
      className="press flex w-full items-stretch gap-3 text-left"
    >
      <div className="w-[42px] shrink-0 pt-1.5">
        <div className="font-mono text-[13px] font-medium leading-none">{appt.startTime}</div>
        <div className="mt-1 font-mono text-[11px] leading-none text-[var(--muted-foreground)]">
          {appt.endTime}
        </div>
      </div>
      <div className="relative -ml-[5px] pt-2.5">
        <div className="rounded-full ring-4 ring-[var(--background)]">
          <StatusDot status={appt.status} />
        </div>
      </div>
      <Card className="flex-1 rounded-2xl px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium tracking-tight">
              {appt.customerNameSnapshot}
            </span>
            <div className="mt-0.5 truncate text-[12.5px] text-[var(--muted-foreground)]">
              {appt.serviceNameSnapshot} · {formatDuration(appt.durationMinutesSnapshot)}
            </div>
          </div>
          <StatusBadge status={appt.status} />
        </div>
      </Card>
    </Link>
  );
}

// ─── Week view ──────────────────────────────────────────────────────────────

interface WeekViewProps {
  startISO: string;
  todayISO: string;
  appointments: AppointmentCard[];
  blockedDates: { date: Date; reason: string | null }[];
  /** Pula pra view de dia com a data clicada (linha do dia ou card de appt). */
  onDayJump: (iso: string) => void;
  /** Troca o startISO da própria view de semana (setas de navegação). */
  onWeekChange: (iso: string) => void;
}

function WeekView({
  startISO,
  todayISO,
  appointments,
  blockedDates,
  onDayJump,
  onWeekChange,
}: WeekViewProps) {
  const blockedByIso = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const b of blockedDates) m.set(isoFromDbDate(b.date), b.reason);
    return m;
  }, [blockedDates]);
  const start = parseISO(startISO);
  // Gera 7 dias a partir de start
  const days = useMemo(() => {
    const arr: { iso: string; date: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = parseISO(startISO);
      d.setDate(d.getDate() + i);
      arr.push({ iso: isoFromDate(d), date: d });
    }
    return arr;
  }, [startISO]);

  // Agrupa por dia — chave derivada via UTC porque appt.date é @db.Date (00:00 UTC)
  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentCard[]>();
    for (const a of appointments) {
      const iso = isoFromDbDate(a.date);
      const arr = map.get(iso) ?? [];
      arr.push(a);
      map.set(iso, arr);
    }
    return map;
  }, [appointments]);

  function shiftWeek(delta: number) {
    const d = parseISO(startISO);
    d.setDate(d.getDate() + delta * 7);
    onWeekChange(isoFromDate(d));
  }

  const last = days[6]?.date ?? start;
  const rangeLabel = `${start.getDate()} ${monthShort(start.getMonth())} – ${last.getDate()} ${monthShort(last.getMonth())}`;

  return (
    <>
      <div className="flex items-center justify-between px-5 pb-3">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="press flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
          aria-label="Semana anterior"
        >
          <I.ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold tracking-tight">{rangeLabel}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Domingo a sábado
          </div>
        </div>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="press flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
          aria-label="Próxima semana"
        >
          <I.Chevron size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <div className="space-y-4">
          {days.map(({ iso, date }) => {
            const dayAppts = byDay.get(iso) ?? [];
            const isToday = iso === todayISO;
            const isBlocked = blockedByIso.has(iso);
            const reason = blockedByIso.get(iso) ?? undefined;
            return (
              <div key={iso}>
                <button
                  type="button"
                  onClick={() => onDayJump(iso)}
                  title={isBlocked ? (reason ?? "Dia bloqueado") : undefined}
                  className="press mb-2 flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-[14px] font-semibold tracking-tight",
                        isBlocked &&
                          "text-[color-mix(in_oklch,var(--destructive)_70%,var(--muted-foreground))] line-through decoration-[color-mix(in_oklch,var(--destructive)_55%,transparent)] decoration-[1.2px]",
                      )}
                    >
                      {isToday ? "Hoje" : weekdayName(date.getDay())}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                      {date.getDate()} {monthShort(date.getMonth())}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] text-[var(--muted-foreground)]",
                      isBlocked &&
                        "text-[color-mix(in_oklch,var(--destructive)_70%,var(--muted-foreground))]",
                    )}
                  >
                    {isBlocked
                      ? "bloqueado"
                      : dayAppts.length === 0
                        ? "livre"
                        : `${dayAppts.length} agend.`}
                  </span>
                </button>
                {isBlocked && dayAppts.length > 0 && (
                  <BlockedReasonCard reason={reason} className="mb-2" />
                )}
                {dayAppts.length === 0 ? (
                  isBlocked ? (
                    <div className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[repeating-linear-gradient(135deg,transparent_0,transparent_3px,color-mix(in_oklch,var(--destructive)_22%,transparent)_3px,color-mix(in_oklch,var(--destructive)_22%,transparent)_4px)] text-[12px] text-[color-mix(in_oklch,var(--destructive)_70%,var(--muted-foreground))]">
                      <I.Ban size={13} />
                      {reason ? `bloqueado · ${reason}` : "dia bloqueado"}
                    </div>
                  ) : (
                    <div className="bg-[var(--muted)]/60 flex h-9 items-center justify-center rounded-xl text-[12px] text-[var(--muted-foreground)]">
                      livre o dia todo
                    </div>
                  )
                ) : (
                  <div className="space-y-1.5">
                    {dayAppts
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((a) => (
                        <Link
                          key={a.id}
                          href={`/admin/agenda/${a.id}`}
                          className="press flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left"
                        >
                          <StatusDot status={a.status} />
                          <span className="w-[44px] font-mono text-[12.5px]">{a.startTime}</span>
                          <span className="flex-1 truncate text-[13.5px]">
                            {a.customerNameSnapshot}
                          </span>
                          <I.Chevron size={14} className="text-[var(--muted-foreground)]" />
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Month view ─────────────────────────────────────────────────────────────

interface MonthViewProps {
  year: number;
  month: number;
  todayISO: string;
  appointments: Pick<AppointmentCard, "id" | "date" | "status">[];
  blockedDates: { date: Date; reason: string | null }[];
  onMonthChange: (y: number, m: number) => void;
  onDayJump: (iso: string) => void;
}

function MonthView({
  year,
  month,
  todayISO,
  appointments,
  blockedDates,
  onMonthChange,
  onDayJump,
}: MonthViewProps) {
  const today = parseISO(todayISO);
  // todayKey usa o tuple ano-mês-dia parseado de todayISO (não os getters do Date local)
  // para combinar com as chaves das células abaixo
  const [todayY, todayM, todayD] = todayISO.split("-").map(Number) as [number, number, number];
  const todayKey = `${todayY}-${todayM - 1}-${todayD}`;

  // Agrupa por dia — chave via UTC (appt.date é @db.Date = 00:00 UTC)
  const byKey = useMemo(() => {
    const map = new Map<string, typeof appointments>();
    for (const a of appointments) {
      const key = dbDateKey(a.date);
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [appointments]);

  // Blocked full-day por chave (mesma chave que byKey)
  const blockedByKey = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const b of blockedDates) {
      m.set(dbDateKey(b.date), b.reason);
    }
    return m;
  }, [blockedDates]);

  // Monta a grade
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = first.getDay();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < arr.length; i += 7) rows.push(arr.slice(i, i + 7));
    return rows;
  }, [year, month]);

  const totals = useMemo(() => {
    let total = 0;
    let pending = 0;
    for (const a of appointments) {
      total += 1;
      if (a.status === "PENDING") pending += 1;
    }
    return { total, pending };
  }, [appointments]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    onMonthChange(y, m);
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-24">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="press flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
          aria-label="Mês anterior"
        >
          <I.ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold capitalize tracking-tight">
            {MESES_LONG[month]}
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {year}
          </div>
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="press flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
          aria-label="Próximo mês"
        >
          <I.Chevron size={16} />
        </button>
      </div>

      {/* Totais */}
      <div className="mb-2 flex items-center justify-between px-0.5 text-[12px]">
        <span className="text-[var(--muted-foreground)]">
          <span className="font-mono font-medium text-[var(--foreground)]">{totals.total}</span>{" "}
          agendamentos
          {totals.pending > 0 && (
            <span className="ml-1.5 text-[var(--primary)]">
              · {totals.pending} pendente{totals.pending > 1 ? "s" : ""}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(today.getFullYear(), today.getMonth())}
          className="press text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          hoje
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-[var(--muted)]/40 grid grid-cols-7 border-b border-[var(--border)]">
          {DIAS_INITIAL.map((d, i) => (
            <div
              key={i}
              className="py-1.5 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="divide-y divide-[var(--border)]">
          {cells.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 divide-x divide-[var(--border)]">
              {row.map((d, ci) => {
                if (!d) return <div key={ci} className="bg-[var(--muted)]/20 h-[58px]" />;
                // Chave derivada do (year, month, day) — bate com dbDateKey (UTC)
                const dayNum = d.getDate();
                const key = `${year}-${month}-${dayNum}`;
                const dayAppts = byKey.get(key) ?? [];
                const isToday = key === todayKey;
                const isPast = d < today && !isToday;
                const isBlocked = blockedByKey.has(key);
                const blockedReason = blockedByKey.get(key) ?? undefined;
                const hasPending = dayAppts.some((a) => a.status === "PENDING");
                return (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => onDayJump(isoFromDate(d))}
                    title={isBlocked ? (blockedReason ?? "Dia bloqueado") : undefined}
                    className={cn(
                      "press relative flex h-[58px] flex-col items-start px-1.5 py-1.5 text-left transition-colors",
                      "hover:bg-[var(--muted)]",
                      isPast && "opacity-60",
                      isBlocked &&
                        "bg-[repeating-linear-gradient(135deg,transparent_0,transparent_3px,color-mix(in_oklch,var(--destructive)_22%,transparent)_3px,color-mix(in_oklch,var(--destructive)_22%,transparent)_4px)]",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[12px] tabular-nums leading-none",
                        isToday
                          ? "-ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]"
                          : "font-medium",
                        !isToday && hasPending && !isBlocked && "text-[var(--primary)]",
                        isBlocked &&
                          !isToday &&
                          "text-[color-mix(in_oklch,var(--destructive)_70%,var(--muted-foreground))] line-through decoration-[color-mix(in_oklch,var(--destructive)_55%,transparent)] decoration-[1.2px]",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {dayAppts.length > 0 && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap items-end gap-0.5">
                        {dayAppts.slice(0, 4).map((a, i) => (
                          <StatusDot key={i} status={a.status} />
                        ))}
                        {dayAppts.length > 4 && (
                          <span className="ml-0.5 font-mono text-[9px] leading-none text-[var(--muted-foreground)]">
                            +{dayAppts.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 px-1 text-[10.5px] text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="PENDING" />
          pendente
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="CONFIRMED" />
          confirmado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="COMPLETED" />
          concluído
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm border border-[color-mix(in_oklch,var(--destructive)_20%,transparent)] bg-[repeating-linear-gradient(135deg,transparent_0,transparent_2px,color-mix(in_oklch,var(--destructive)_22%,transparent)_2px,color-mix(in_oklch,var(--destructive)_22%,transparent)_3px)]" />
          bloqueado
        </span>
      </div>
    </div>
  );
}

// ─── Pending view ───────────────────────────────────────────────────────────

interface PendingViewProps {
  appointments: AppointmentCard[];
  todayISO: string;
}

function PendingView({ appointments, todayISO }: PendingViewProps) {
  const today = parseISO(todayISO);

  const buckets = useMemo(() => {
    const groups = {
      overdue: [] as AppointmentCard[],
      today: [] as AppointmentCard[],
      thisWeek: [] as AppointmentCard[],
      later: [] as AppointmentCard[],
    };
    for (const a of appointments) {
      const d = new Date(a.date);
      // UTC getters: appt.date é @db.Date (00:00 UTC); local getters errariam no BRT
      const diff = Math.round(
        (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
          86_400_000,
      );
      if (diff < 0) groups.overdue.push(a);
      else if (diff === 0) groups.today.push(a);
      else if (diff < 7) groups.thisWeek.push(a);
      else groups.later.push(a);
    }
    return groups;
  }, [appointments, today]);

  const sections = [
    {
      key: "overdue" as const,
      label: "Vencidos",
      tone: "danger" as const,
    },
    { key: "today" as const, label: "Hoje" },
    { key: "thisWeek" as const, label: "Esta semana" },
    { key: "later" as const, label: "Mais à frente" },
  ].filter((s) => buckets[s.key].length > 0);

  if (appointments.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <EmptyState
          icon={<I.Check size={22} />}
          title="Nenhum pedido pendente"
          desc="Tudo respondido. Bom trabalho."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-24">
      <p className="mb-3 text-[12.5px] text-[var(--muted-foreground)]">
        <span className="font-mono font-medium text-[var(--foreground)]">
          {appointments.length}
        </span>{" "}
        pedido{appointments.length > 1 ? "s" : ""} aguardando sua resposta.
      </p>

      <div className="space-y-5">
        {sections.map((s) => (
          <div key={s.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3
                className={cn(
                  "text-[12px] font-medium uppercase tracking-[0.14em]",
                  s.tone === "danger"
                    ? "text-[var(--destructive)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                {s.label}
              </h3>
              <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                {buckets[s.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {buckets[s.key].map((a) => (
                <PendingCard key={a.id} appt={a} todayISO={todayISO} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingCard({ appt, todayISO }: { appt: AppointmentCard; todayISO: string }) {
  const date = new Date(appt.date);
  const today = parseISO(todayISO);
  // appt.date é @db.Date → leia via UTC getters para preservar o dia exato.
  const apptY = date.getUTCFullYear();
  const apptM = date.getUTCMonth();
  const apptD = date.getUTCDate();
  const diff = Math.round(
    (Date.UTC(apptY, apptM, apptD) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );
  // Reconstrói como meio-dia local para extrair dia da semana / formato BR sem TZ shift
  const displayDate = new Date(apptY, apptM, apptD, 12, 0, 0);
  const dateLabel =
    diff === 0
      ? "Hoje"
      : diff === 1
        ? "Amanhã"
        : diff < 0
          ? `Há ${-diff}d`
          : diff < 7
            ? `${weekdayShort(displayDate.getDay())}, ${apptD} ${monthShort(apptM)}`
            : formatDateBR(displayDate);

  return (
    <Link href={`/admin/agenda/${appt.id}`} className="press block">
      <Card className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-tight">
            {appt.customerNameSnapshot}
          </span>
          <StatusBadge status={appt.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">{dateLabel}</span>
          <span>·</span>
          <span className="font-mono">{appt.startTime}</span>
          <span>·</span>
          <span className="truncate">{appt.serviceNameSnapshot}</span>
        </div>
        <div className="text-[var(--muted-foreground)]/70 mt-1 font-mono text-[10.5px]">
          {appt.protocol}
        </div>
      </Card>
    </Link>
  );
}

// ─── Blocked reason card ────────────────────────────────────────────────────

function BlockedReasonCard({ reason, className }: { reason?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-[repeating-linear-gradient(135deg,transparent_0,transparent_3px,color-mix(in_oklch,var(--destructive)_18%,transparent)_3px,color-mix(in_oklch,var(--destructive)_18%,transparent)_4px)] px-3.5 py-3",
        "border-[color-mix(in_oklch,var(--destructive)_25%,transparent)]",
        className,
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--destructive)_15%,var(--background))] text-[color-mix(in_oklch,var(--destructive)_80%,var(--muted-foreground))]">
        <I.Ban size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold tracking-tight text-[color-mix(in_oklch,var(--destructive)_75%,var(--foreground))]">
          Dia bloqueado
        </div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-[color-mix(in_oklch,var(--destructive)_55%,var(--muted-foreground))]">
          {reason ? `Motivo: ${reason}` : "Sem motivo informado."}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
        {icon}
      </div>
      <p className="text-[15px] font-medium tracking-tight">{title}</p>
      <p className="max-w-[260px] text-[13px] leading-snug text-[var(--muted-foreground)]">
        {desc}
      </p>
    </div>
  );
}
