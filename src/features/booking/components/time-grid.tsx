"use client";

import { cn } from "@/lib/utils";

interface TimeGridProps {
  slots: string[];
  value: string | null;
  onChange: (s: string) => void;
  emptyMessage?: string;
}

export function TimeGrid({
  slots,
  value,
  onChange,
  emptyMessage = "Sem horários neste dia",
}: TimeGridProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-[13px] text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((s) => {
        const isSelected = s === value;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              "press flex h-10 items-center justify-center rounded-[10px] border text-[14px] font-medium transition-colors",
              isSelected
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "border-border bg-white text-foreground",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
