"use client";

/**
 * DurationAdjuster — stepper ±15 min para reajustar duração de um agendamento.
 *
 * Persiste `endTime` e `actualDurationMinutes` via `updateAppointmentDuration`.
 * A constraint EXCLUDE em `appointments` rejeita extensões que invadiriam
 * outro slot (23P01) — mensagem amigável é exibida. Slots disponíveis no
 * fluxo público respeitam `endTime`, então a extensão remove os horários
 * agora ocupados automaticamente.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { I } from "@/components/shared/icons";
import { updateAppointmentDuration } from "@/features/appointments/actions";

interface DurationAdjusterProps {
  appointmentId: string;
  startTime: string;
  endTime: string;
  durationSnapshot: number;
}

const STEP = 15;
const MIN = 15;
const MAX = 600;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function addMinToHHmm(hhmm: string, minutes: number): string {
  const total = toMinutes(hhmm) + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function DurationAdjuster({
  appointmentId,
  startTime,
  endTime,
  durationSnapshot,
}: DurationAdjusterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseDuration = Math.max(0, toMinutes(endTime) - toMinutes(startTime));
  const [duration, setDuration] = useState(baseDuration);

  const changed = duration !== baseDuration;
  const deltaVsSnapshot = duration - durationSnapshot;
  const newEnd = addMinToHHmm(startTime, duration);

  function cancel() {
    setDuration(baseDuration);
    setEditing(false);
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateAppointmentDuration({
        appointmentId,
        durationMinutes: duration,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3.5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Duração atual
          </div>
          <div className="mt-0.5 text-[14px] font-medium tracking-tight">
            {baseDuration} min
            {baseDuration !== durationSnapshot && (
              <span className="ml-2 text-[12px] font-normal text-[var(--muted-foreground)]">
                ({baseDuration > durationSnapshot ? "+" : ""}
                {baseDuration - durationSnapshot} min vs. estimado)
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="press inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--primary)]"
        >
          <I.Edit size={14} /> Ajustar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3.5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Ajustar duração
        </div>
        <span className="text-[11px] text-[var(--muted-foreground)]">recalcula término</span>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDuration((d) => Math.max(MIN, d - STEP))}
          disabled={duration <= MIN || isPending}
          className="press flex size-10 items-center justify-center rounded-xl bg-[var(--muted)] disabled:opacity-40"
          aria-label="Diminuir"
        >
          <span className="text-[18px] leading-none">–</span>
        </button>
        <div className="flex-1 text-center">
          <div className="font-mono text-[20px] font-medium tracking-tight">{duration} min</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            término{" "}
            <span className={changed ? "font-medium text-[var(--primary)]" : undefined}>
              {newEnd}
            </span>
            {deltaVsSnapshot !== 0 && (
              <>
                {" "}
                · {deltaVsSnapshot > 0 ? "+" : ""}
                {deltaVsSnapshot} min vs. estimado
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDuration((d) => Math.min(MAX, d + STEP))}
          disabled={duration >= MAX || isPending}
          className="press flex size-10 items-center justify-center rounded-xl bg-[var(--muted)] disabled:opacity-40"
          aria-label="Aumentar"
        >
          <I.Plus size={16} />
        </button>
      </div>

      {error && <p className="mt-2 text-[12px] text-[var(--destructive)]">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={cancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={save}
          disabled={!changed || isPending}
        >
          {isPending ? "Salvando…" : `Salvar · término ${newEnd}`}
        </Button>
      </div>
    </div>
  );
}
