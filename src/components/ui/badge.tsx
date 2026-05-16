import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent",
        outline: "bg-transparent text-[var(--foreground)] border-[var(--border)]",
        primary: "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent",
        accent: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
        pending: "bg-[oklch(0.97_0.04_85)] text-[oklch(0.40_0.10_75)] border-transparent",
        confirmed: "bg-[oklch(0.96_0.04_150)] text-[oklch(0.38_0.10_150)] border-transparent",
        completed: "bg-[var(--primary)]/10 text-[var(--primary)] border-transparent",
        cancelled: "bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent",
        noshow:
          "bg-[color-mix(in_oklch,var(--destructive)_10%,transparent)] text-[var(--destructive)] border-transparent",
        expired: "bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
