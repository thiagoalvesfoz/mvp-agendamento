import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeBase =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium";

const badgeVariants = cva(badgeBase, {
  variants: {
    variant: {
      default: "bg-secondary text-secondary-foreground border-transparent",
      outline: "bg-transparent text-foreground border-border",
      primary: "bg-primary text-primary-foreground border-transparent",
      accent: "bg-primary/10 text-primary border-primary/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
