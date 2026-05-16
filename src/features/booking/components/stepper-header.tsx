"use client";

import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

interface StepperHeaderProps {
  step: number;
  totalSteps: number;
  studioName: string;
  onBack: () => void;
}

export function StepperHeader({ step, totalSteps, studioName, onBack }: StepperHeaderProps) {
  return (
    <div className="px-5 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="press -ml-2 flex size-10 items-center justify-center rounded-full text-foreground"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={22} />
        </button>
        <div className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
          {studioName}
        </div>
        <div className="size-10" />
      </div>

      {step > 0 && step <= totalSteps && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i < step ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
          <div className="mt-2 text-[12px] text-muted-foreground">
            Passo {step} de {totalSteps}
          </div>
        </div>
      )}
    </div>
  );
}
