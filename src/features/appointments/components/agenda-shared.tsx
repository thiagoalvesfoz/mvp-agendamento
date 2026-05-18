import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

export function BlockedReasonCard({ reason, className }: { reason?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-[repeating-linear-gradient(135deg,transparent_0,transparent_3px,color-mix(in_oklch,var(--destructive)_18%,transparent)_3px,color-mix(in_oklch,var(--destructive)_18%,transparent)_4px)] px-3.5 py-3",
        "border-[color-mix(in_oklch,var(--destructive)_25%,transparent)]",
        className,
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--destructive)_15%,var(--background))] text-[color-mix(in_oklch,var(--destructive)_80%,var(--muted-foreground))]">
        <I.Ban size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold tracking-tight text-[color-mix(in_oklch,var(--destructive)_75%,var(--foreground))]">
          Dia bloqueado
        </div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-[color-mix(in_oklch,var(--destructive)_55%,var(--muted-foreground))]">
          {reason ? `Motivo: ${reason}` : "Sem motivo informado."}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
        {icon}
      </div>
      <p className="text-[15px] font-medium tracking-tight">{title}</p>
      <p className="max-w-[260px] text-[13px] leading-snug text-[var(--muted-foreground)]">
        {desc}
      </p>
    </div>
  );
}
