import { badgeBase } from "@/components/ui/badge";
import { STATUS_THEME } from "@/lib/status-theme";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, badgeClass } = STATUS_THEME[status];
  return <span className={cn(badgeBase, badgeClass)}>{label}</span>;
}

interface StatusDotProps extends StatusBadgeProps {
  size?: "default" | "sm";
}

export function StatusDot({ status, size }: StatusDotProps) {
  const sizeClass = size === "sm" ? "size-1.5" : "size-2";
  return (
    <span
      className={cn("shrink-0 rounded-full", sizeClass, STATUS_THEME[status].dotClass)}
      aria-hidden="true"
    />
  );
}
