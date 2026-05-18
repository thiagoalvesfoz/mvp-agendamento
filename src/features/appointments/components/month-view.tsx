"use client";

import { I } from "@/components/shared/icons";
import { StatusDot } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { isoFromDate, isoFromDbDate, parseISO } from "@/features/appointments/date-helpers";
import type { AppointmentCard } from "@/features/appointments/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

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

interface MonthViewProps {
  year: number;
  month: number;
  todayISO: string;
  appointments: Pick<AppointmentCard, "id" | "date" | "status">[];
  blockedDates: { date: Date; reason: string | null }[];
  onMonthChange: (y: number, m: number) => void;
  onDayJump: (iso: string) => void;
}

export function MonthView({
  year,
  month,
  todayISO,
  appointments,
  blockedDates,
  onMonthChange,
  onDayJump,
}: MonthViewProps) {
  const today = parseISO(todayISO);

  // Agrupa por chave ISO YYYY-MM-DD — compatível com isoFromDate (células) e isoFromDbDate (db)
  const byKey = useMemo(() => {
    const map = new Map<string, typeof appointments>();
    for (const a of appointments) {
      const key = isoFromDbDate(a.date);
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [appointments]);

  const blockedByKey = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const b of blockedDates) {
      m.set(isoFromDbDate(b.date), b.reason);
    }
    return m;
  }, [blockedDates]);

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
                const key = isoFromDate(d);
                const dayAppts = byKey.get(key) ?? [];
                const isToday = key === todayISO;
                const isPast = d < today && !isToday;
                const isBlocked = blockedByKey.has(key);
                const blockedReason = blockedByKey.get(key) ?? undefined;
                const hasPending = dayAppts.some((a) => a.status === "PENDING");
                return (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => onDayJump(key)}
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
