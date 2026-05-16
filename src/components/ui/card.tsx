import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };
