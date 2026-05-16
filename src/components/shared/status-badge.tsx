/**
 * StatusBadge — mapeia AppointmentStatus → rótulo PT-BR + variante visual.
 *
 * Server Component (sem interatividade). Usa as variantes já definidas
 * em src/components/ui/badge.tsx para não duplicar tokens de cor.
 */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@prisma/client";

const STATUS_MAP: Record<
  AppointmentStatus,
  {
    label: string;
    variant: "pending" | "confirmed" | "completed" | "cancelled" | "noshow" | "expired";
  }
> = {
  PENDING: { label: "Pendente", variant: "pending" },
  CONFIRMED: { label: "Confirmado", variant: "confirmed" },
  COMPLETED: { label: "Concluído", variant: "completed" },
  NO_SHOW: { label: "Não compareceu", variant: "noshow" },
  CANCELED: { label: "Cancelado", variant: "cancelled" },
  EXPIRED: { label: "Expirado", variant: "expired" },
};

// Dot de status — circle colorido inline com o item do histórico
const DOT_MAP: Record<AppointmentStatus, string> = {
  PENDING: "bg-[oklch(0.72_0.15_75)]",
  CONFIRMED: "bg-[oklch(0.60_0.15_150)]",
  COMPLETED: "bg-[var(--primary)]",
  NO_SHOW: "bg-[var(--destructive)]",
  CANCELED: "bg-[var(--muted-foreground)]",
  EXPIRED: "bg-[var(--muted-foreground)]",
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

interface StatusDotProps extends StatusBadgeProps {
  size?: "default" | "sm";
}

export function StatusDot({ status, size }: StatusDotProps) {
  const sizeClass = size === "sm" ? "size-1.5" : "size-2";

  return (
    <span
      className={cn(`size-2 shrink-0 rounded-full ${DOT_MAP[status]}`, sizeClass)}
      aria-hidden="true"
    />
  );
}
