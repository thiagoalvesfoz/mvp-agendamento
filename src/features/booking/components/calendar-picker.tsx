"use client";

import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MESES_ABR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const DIAS_ABR = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export type BlockedDateEntry = {
  date: Date;
  reason?: string;
};

interface CalendarPickerProps {
  value: Date | null;
  onChange: (d: Date) => void;
  /** Regra extra para desabilitar dias. Default: domingo bloqueado. */
  isDayDisabled?: (d: Date) => boolean;
  /** Datas bloqueadas pelo admin (futuro: vem do servidor). */
  blockedDates?: BlockedDateEntry[];
}

export function CalendarPicker({
  value,
  onChange,
  isDayDisabled,
  blockedDates = [],
}: CalendarPickerProps) {
  // Regra default — domingo bloqueado (no seed atual, dom não tem availability)
  const disabledFn = isDayDisabled ?? ((d: Date) => d.getDay() === 0);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState<Date>(() => {
    const base = value ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [picker, setPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(view.getFullYear());

  const blockedKeySet = useMemo(() => {
    const s = new Set<string>();
    blockedDates.forEach((b) => {
      const d = b.date;
      s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return s;
  }, [blockedDates]);

  const blockedReasonMap = useMemo(() => {
    const m = new Map<string, string>();
    blockedDates.forEach((b) => {
      if (b.reason) {
        m.set(`${b.date.getFullYear()}-${b.date.getMonth()}-${b.date.getDate()}`, b.reason);
      }
    });
    return m;
  }, [blockedDates]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let r = 0; r < 6; r++) {
    const row = cells.slice(r * 7, r * 7 + 7);
    if (row.some((c) => c !== null)) rows.push(row);
  }

  const canGoBack = startOfDay(first) > today;
  const prevMonth = () => canGoBack && setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));

  const openPicker = () => {
    setPickerYear(year);
    setPicker(true);
  };
  const pickMonth = (m: number) => {
    setView(new Date(pickerYear, m, 1));
    setPicker(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      {/* Header mês */}
      <div className="flex items-center justify-between border-b border-border px-2 py-2.5">
        <button
          onClick={prevMonth}
          disabled={!canGoBack || picker}
          className={cn(
            "press flex size-9 items-center justify-center rounded-full",
            canGoBack && !picker
              ? "text-foreground hover:bg-muted"
              : "cursor-not-allowed text-muted-foreground/30",
          )}
          aria-label="Mês anterior"
        >
          <I.ChevronLeft size={18} />
        </button>

        <button
          onClick={() => (picker ? setPicker(false) : openPicker())}
          className="press flex flex-col items-center rounded-lg px-3 py-1 hover:bg-muted"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold capitalize tracking-tight">{MESES[month]}</span>
            <I.ChevronDown
              size={14}
              className={cn(
                "text-muted-foreground transition-transform",
                picker && "rotate-180",
              )}
            />
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {year}
          </div>
        </button>

        <button
          onClick={nextMonth}
          disabled={picker}
          className={cn(
            "press flex size-9 items-center justify-center rounded-full",
            picker
              ? "cursor-not-allowed text-muted-foreground/30"
              : "text-foreground hover:bg-muted",
          )}
          aria-label="Próximo mês"
        >
          <I.Chevron size={18} />
        </button>
      </div>

      {picker ? (
        <div className="fade-in px-3 py-3">
          {/* Year stepper */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setPickerYear((y) => Math.max(today.getFullYear(), y - 1))}
              disabled={pickerYear <= today.getFullYear()}
              className={cn(
                "press flex size-8 items-center justify-center rounded-full",
                pickerYear > today.getFullYear()
                  ? "text-foreground hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground/30",
              )}
              aria-label="Ano anterior"
            >
              <I.ChevronLeft size={16} />
            </button>
            <div className="font-mono text-[14px] tabular-nums tracking-[0.18em]">{pickerYear}</div>
            <button
              onClick={() => setPickerYear((y) => Math.min(today.getFullYear() + 3, y + 1))}
              disabled={pickerYear >= today.getFullYear() + 3}
              className={cn(
                "press flex size-8 items-center justify-center rounded-full",
                pickerYear < today.getFullYear() + 3
                  ? "text-foreground hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground/30",
              )}
              aria-label="Próximo ano"
            >
              <I.Chevron size={16} />
            </button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-3 gap-1.5">
            {MESES_ABR.map((m, i) => {
              const isPast =
                pickerYear < today.getFullYear() ||
                (pickerYear === today.getFullYear() && i < today.getMonth());
              const isCurrent = pickerYear === year && i === month;
              const isThis = pickerYear === today.getFullYear() && i === today.getMonth();
              return (
                <button
                  key={i}
                  disabled={isPast}
                  onClick={() => pickMonth(i)}
                  className={cn(
                    "press h-11 rounded-[8px] text-[13px] font-medium capitalize transition-colors",
                    isCurrent
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : isPast
                        ? "cursor-not-allowed text-muted-foreground/35"
                        : "border border-border text-foreground hover:bg-muted",
                    isThis && !isCurrent && "ring-1 ring-inset ring-[var(--primary)]/50",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DIAS_ABR.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                {d.charAt(0)}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="px-2 pb-2.5">
            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1">
                {row.map((d, ci) => {
                  if (!d) return <div key={ci} className="h-10" />;
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                  const isPast = startOfDay(d) < today;
                  const isOff = disabledFn(d);
                  const isBlocked = blockedKeySet.has(key);
                  const reason = blockedReasonMap.get(key);
                  const isSel = value ? sameDay(d, value) : false;
                  const isToday = sameDay(d, today);
                  const disabled = isPast || isOff || isBlocked;
                  return (
                    <button
                      key={ci}
                      disabled={disabled}
                      title={isBlocked ? reason : undefined}
                      onClick={() => onChange(d)}
                      className={cn(
                        "press relative h-10 rounded-[8px] text-[14px] font-medium tabular-nums transition-colors",
                        isSel && "bg-[var(--primary)] text-[var(--primary-foreground)]",
                        !isSel && !disabled && "text-foreground hover:bg-muted",
                        !isSel && isPast && "cursor-not-allowed text-muted-foreground/30 opacity-40",
                        !isSel &&
                          isOff &&
                          !isPast &&
                          !isBlocked &&
                          "cursor-not-allowed text-muted-foreground/35 opacity-40",
                        !isSel &&
                          isBlocked &&
                          "cursor-not-allowed bg-[repeating-linear-gradient(135deg,transparent_0,transparent_3px,var(--border)_3px,var(--border)_4px)] text-muted-foreground/55",
                        isToday && !isSel && "ring-1 ring-inset ring-[var(--primary)]/50",
                      )}
                    >
                      <span className={cn(isBlocked && "line-through decoration-[1.2px]", isToday && "font-bold")}>
                        {d.getDate()}
                      </span>
                      {isToday && !isSel && (
                        <span className="absolute bottom-1 left-1/2 size-[3px] -translate-x-1/2 rounded-full bg-[var(--primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3.5 py-2">
            <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--primary)]" />
                hoje
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm border border-input bg-[repeating-linear-gradient(135deg,transparent_0,transparent_2px,var(--input)_2px,var(--input)_3px)]" />
                bloqueado
              </span>
            </div>
            <span className="text-[10.5px] text-muted-foreground">seg–sáb</span>
          </div>
        </>
      )}
    </div>
  );
}
