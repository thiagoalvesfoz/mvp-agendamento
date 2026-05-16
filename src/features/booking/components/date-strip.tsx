"use client";

import { cn } from "@/lib/utils";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateStripProps {
  days: string[]; // ISO yyyy-MM-dd
  value: string | null;
  onChange: (d: string) => void;
}

export function DateStrip({ days, value, onChange }: DateStripProps) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex gap-2">
        {days.map((d) => {
          const dt = parseISO(d);
          const isSelected = d === value;
          return (
            <button
              key={d}
              onClick={() => onChange(d)}
              className={cn(
                "press flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition-colors",
                isSelected
                  ? "bg-[var(--primary)]/5 border-[var(--primary)]"
                  : "border-border bg-white",
              )}
            >
              <span
                className={cn(
                  "text-[11px] uppercase tracking-wide",
                  isSelected ? "text-[var(--primary)]" : "text-muted-foreground",
                )}
              >
                {format(dt, "EEE", { locale: ptBR }).slice(0, 3)}
              </span>
              <span
                className={cn(
                  "text-[18px] font-semibold tracking-tight",
                  isSelected ? "text-[var(--primary)]" : "text-foreground",
                )}
              >
                {format(dt, "dd")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
