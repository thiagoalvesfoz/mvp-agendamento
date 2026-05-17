"use client";

import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

interface DurationStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Passo (padrão: 15) */
  step?: number;
  /** Valor mínimo (padrão: 0 — permite buffer zerado) */
  min?: number;
  /** Sufixo exibido ao lado do valor (padrão: "min") */
  unit?: string;
  label?: string;
  className?: string;
}

/**
 * Stepper numérico genérico (default em minutos de 15 em 15).
 * Mantém o valor na faixa [min, ∞) e em múltiplos de `step`.
 */
export function DurationStepper({
  value,
  onChange,
  step = 15,
  min = 0,
  unit = "min",
  className,
}: DurationStepperProps) {
  const decrement = () => {
    const next = value - step;
    if (next >= min) onChange(next);
  };

  const increment = () => onChange(value + step);

  return (
    <div
      className={cn(
        "flex h-11 items-center rounded-xl border border-[var(--input)] bg-[var(--background)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Diminuir"
        className="press flex h-full w-11 shrink-0 items-center justify-center text-[var(--foreground)] disabled:pointer-events-none disabled:opacity-30"
      >
        <span className="select-none text-[18px] leading-none">–</span>
      </button>

      <div className="flex-1 select-none text-center font-mono text-[15px] font-medium tabular-nums">
        {value} {unit}
      </div>

      <button
        type="button"
        onClick={increment}
        aria-label="Aumentar"
        className="press flex h-full w-11 shrink-0 items-center justify-center text-[var(--foreground)]"
      >
        <I.Plus size={15} />
      </button>
    </div>
  );
}
