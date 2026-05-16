"use client";

/**
 * AvailabilityEditor — Client Component.
 *
 * Gerencia o estado local da grade semanal: toggle aberto/fechado por dia,
 * adição/remoção de intervalos, e submit via Server Action saveAvailability.
 *
 * O estado inicial vem do Server Component (page.tsx) já agrupado por weekDay.
 */
import { I } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { saveAvailability } from "@/features/settings/actions";
import type { AvailabilityRow } from "@/features/settings/queries";
import { weekdayName } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";

// ── Tipos internos ────────────────────────────────────────────────────────────

interface Interval {
  startTime: string;
  endTime: string;
}

interface DayState {
  weekDay: number;
  open: boolean;
  intervals: Interval[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_INTERVAL: Interval = { startTime: "09:00", endTime: "18:00" };

/** Monta estado inicial a partir dos registros do banco (agrupados por weekDay). */
function buildInitialState(rows: AvailabilityRow[]): DayState[] {
  return Array.from({ length: 7 }, (_, dow) => {
    const dayRows = rows.filter((r) => r.weekDay === dow);
    return {
      weekDay: dow,
      open: dayRows.length > 0,
      intervals:
        dayRows.length > 0
          ? dayRows.map((r) => ({ startTime: r.startTime, endTime: r.endTime }))
          : [{ ...DEFAULT_INTERVAL }],
    };
  });
}

// ── Componente ────────────────────────────────────────────────────────────────

interface AvailabilityEditorProps {
  rows: AvailabilityRow[];
}

export function AvailabilityEditor({ rows }: AvailabilityEditorProps) {
  const [days, setDays] = useState<DayState[]>(() => buildInitialState(rows));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleDay = (dow: number) => {
    setDays((prev) =>
      prev.map((d) => (d.weekDay === dow ? { ...d, open: !d.open } : d)),
    );
    setSuccess(false);
  };

  const updateInterval = (dow: number, idx: number, field: keyof Interval, value: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekDay !== dow) return d;
        const intervals = d.intervals.map((iv, i) =>
          i === idx ? { ...iv, [field]: value } : iv,
        );
        return { ...d, intervals };
      }),
    );
    setSuccess(false);
  };

  const addInterval = (dow: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekDay !== dow) return d;
        const last = d.intervals[d.intervals.length - 1];
        const newInterval = last
          ? { startTime: last.endTime, endTime: last.endTime }
          : { ...DEFAULT_INTERVAL };
        return { ...d, intervals: [...d.intervals, newInterval] };
      }),
    );
    setSuccess(false);
  };

  const removeInterval = (dow: number, idx: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekDay !== dow) return d;
        const intervals = d.intervals.filter((_, i) => i !== idx);
        // Se removeu o último, mantém pelo menos um vazio (mas o dia fica fechado)
        return { ...d, intervals: intervals.length > 0 ? intervals : [{ ...DEFAULT_INTERVAL }] };
      }),
    );
    setSuccess(false);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const payload = days.map((d) => ({
        weekDay: d.weekDay,
        open: d.open,
        intervals: d.open ? d.intervals : [],
      }));

      const result = await saveAvailability(payload);

      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[13px] text-[var(--muted-foreground)] mb-5">
          Defina dias e horários abertos para agendamento. Você pode configurar mais de um intervalo
          por dia.
        </p>

        <div className="space-y-2.5">
          {days.map((day) => (
            <Card key={day.weekDay} className="p-3.5">
              {/* ── Header do dia ── */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14.5px] font-medium tracking-tight">
                    {weekdayName(day.weekDay)}
                  </div>
                  <div className={cn("text-[12px] text-[var(--muted-foreground)] mt-0.5", !day.open && "text-[var(--destructive)]")}>
                    {day.open
                      ? day.intervals.map((iv) => `${iv.startTime} – ${iv.endTime}`).join(" · ")
                      : "Fechado"}
                  </div>
                </div>
                <Switch
                  checked={day.open}
                  onCheckedChange={() => toggleDay(day.weekDay)}
                  aria-label={`${weekdayName(day.weekDay)} aberto`}
                />
              </div>

              {/* ── Intervalos (visíveis quando dia aberto) ── */}
              {day.open && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                  {day.intervals.map((iv, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={iv.startTime}
                        onChange={(e) =>
                          updateInterval(day.weekDay, idx, "startTime", e.target.value)
                        }
                        className={cn(
                          "flex-1 h-10 rounded-lg border border-[var(--input)] bg-[var(--background)]",
                          "px-3 font-mono text-[13.5px] text-[var(--foreground)]",
                          "focus:outline-none focus-visible:border-[var(--ring)]",
                        )}
                      />
                      <span className="text-[var(--muted-foreground)] text-[12px]">até</span>
                      <input
                        type="time"
                        value={iv.endTime}
                        onChange={(e) =>
                          updateInterval(day.weekDay, idx, "endTime", e.target.value)
                        }
                        className={cn(
                          "flex-1 h-10 rounded-lg border border-[var(--input)] bg-[var(--background)]",
                          "px-3 font-mono text-[13.5px] text-[var(--foreground)]",
                          "focus:outline-none focus-visible:border-[var(--ring)]",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => removeInterval(day.weekDay, idx)}
                        disabled={day.intervals.length === 1}
                        aria-label="Remover intervalo"
                        className="press size-8 rounded-lg flex items-center justify-center text-[var(--destructive)] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <I.Trash size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addInterval(day.weekDay)}
                    className="press text-[12.5px] text-[var(--primary)] font-medium inline-flex items-center gap-1 mt-1"
                  >
                    <I.Plus size={13} /> Adicionar intervalo
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-[var(--destructive)] text-center">{error}</p>
        )}
        {success && (
          <p className="mt-4 text-[13px] text-green-600 text-center">Disponibilidade salva.</p>
        )}
      </div>

      {/* ── Footer com CTA ── */}
      <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--background)]">
        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? "Salvando..." : "Salvar disponibilidade"}
        </Button>
      </div>
    </div>
  );
}
