import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "h-9 w-full min-w-0 rounded-[8px] border border-[var(--input)] bg-[var(--background)] px-3 text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
          "focus:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[oklch(0.708_0_0_/_0.5)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
