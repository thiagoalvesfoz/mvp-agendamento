"use client";

import { I } from "@/components/shared/icons";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { BlockedReasonCard, EmptyState } from "@/features/appointments/components/agenda-shared";
import {
  buildBlockedMap,
  daysDiff,
  groupByDay,
  isoFromDate,
  parseISO,
} from "@/features/appointments/date-helpers";
import type { AppointmentCard } from "@/features/appointments/types";
import { formatDateBR, formatDuration, weekdayName, weekdayShort } from "@/lib/time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

interface DayViewProps {
  selectedDate: string;
  todayISO: string;
  appointments: AppointmentCard[];
  blockedDates: { date: Date; reason: string | null }[];
  onSelectDate: (iso: string) => void;
}

export function DayView({
  selectedDate,
  todayISO,
  appointments,
  blockedDates,
  onSelectDate,
}: DayViewProps) {
  const blockedByIso = useMemo(() => buildBlockedMap(blockedDates), [blockedDates]);
  const selectedBlocked = blockedByIso.has(selectedDate);
  const selectedReason = blockedByIso.get(selectedDate) ?? undefined;

  const apptsByDay = useMemo(() => groupByDay(appointments), [appointments]);

  const selectedDayAppointments = useMemo(
    () => apptsByDay.get(selectedDate) ?? [],
    [apptsByDay, selectedDate],
  );
  const selected = parseISO(selectedDate);
  const dayDiff = daysDiff(selected, todayISO);

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
