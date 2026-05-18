"use client";

import { I } from "@/components/shared/icons";
import { StatusDot } from "@/components/shared/status-badge";
import { BlockedReasonCard } from "@/features/appointments/components/agenda-shared";
import {
  buildBlockedMap,
  groupByDay,
  isoFromDate,
  parseISO,
} from "@/features/appointments/date-helpers";
import type { AppointmentCard } from "@/features/appointments/types";
import { monthShort, weekdayName } from "@/lib/time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

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

export function WeekView({
  startISO,
  todayISO,
  appointments,
  blockedDates,
  onDayJump,
  onWeekChange,
}: WeekViewProps) {
  const blockedByIso = useMemo(() => buildBlockedMap(blockedDates), [blockedDates]);
  const start = parseISO(startISO);

  const days = useMemo(() => {
    const arr: { iso: string; date: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = parseISO(startISO);
      d.setDate(d.getDate() + i);
      arr.push({ iso: isoFromDate(d), date: d });
    }
    return arr;
  }, [startISO]);

  const byDay = useMemo(() => groupByDay(appointments), [appointments]);

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
