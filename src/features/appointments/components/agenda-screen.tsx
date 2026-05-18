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
import { DayView } from "@/features/appointments/components/day-view";
import { MonthView } from "@/features/appointments/components/month-view";
import { PendingView } from "@/features/appointments/components/pending-view";
import { WeekView } from "@/features/appointments/components/week-view";
import type { AppointmentCard } from "@/features/appointments/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import useSWR from "swr";

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

  const { data: pendingData } = useSWR(
    "/api/admin/agendamentos/pending-count",
    (url: string) => fetch(url).then((r) => r.json() as Promise<{ count: number }>),
    { refreshInterval: 10_000, revalidateOnFocus: true },
  );

  const pendingCount = pendingData?.count ?? stats.pending;

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
            value={pendingCount}
            active={view === "pending"}
            accent
            onClick={() => navigate({ view: view === "pending" ? "day" : "pending" })}
          />
          <StatPill
            label="Hoje"
            value={stats.today}
            active={view === "day"}
            onClick={() => navigate({ view: "day", date: todayISO })}
          />
          <StatPill
            label="Esta semana"
            value={stats.week}
            active={view === "week"}
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
          ? "border-violet-200 bg-violet-100 text-violet-950"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
      )}
    >
      <div
        className={cn(
          "text-[10px] uppercase tracking-[0.12em]",
          active ? "text-violet-950" : "text-[var(--muted-foreground)]",
        )}
      >
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className={cn("text-[22px] font-semibold tabular-nums tracking-tight")}>{value}</span>
        {accent && value > 0 && <span className="size-1.5 rounded-full bg-destructive" />}
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
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
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
