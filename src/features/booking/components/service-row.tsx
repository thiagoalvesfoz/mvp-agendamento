"use client";

import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/time";
import type { ServiceForBooking } from "../queries";

interface ServiceRowProps {
  service: ServiceForBooking;
  selected: boolean;
  onSelect: (s: ServiceForBooking) => void;
}

export function ServiceRow({ service, selected, onSelect }: ServiceRowProps) {
  return (
    <button
      onClick={() => onSelect(service)}
      className={cn(
        "press flex w-full items-center gap-3 rounded-2xl border bg-white px-3.5 py-3.5 text-left transition-colors",
        selected ? "ring-[var(--primary)]/20 border-[var(--primary)] ring-2" : "border-border",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-muted text-foreground",
        )}
      >
        <I.Camera size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium tracking-tight">{service.name}</span>
        </div>
        {service.description && (
          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">
            {service.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <I.Clock size={13} />
            {formatDuration(service.durationMinutes)}
          </span>
        </div>
      </div>
      <I.Chevron size={18} className="shrink-0 text-muted-foreground" />
    </button>
  );
}
