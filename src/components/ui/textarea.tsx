import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] w-full resize-none rounded-[8px] border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
        "focus:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[oklch(0.708_0_0_/_0.5)]",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
