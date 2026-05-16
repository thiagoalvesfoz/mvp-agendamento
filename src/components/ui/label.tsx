import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  hint?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, hint, ...props }, ref) => {
    return (
      <div className={cn("mb-1.5 flex items-baseline justify-between", className)}>
        <label
          ref={ref}
          className="text-[13px] font-medium text-[var(--foreground)]"
          {...props}
        >
          {children}
        </label>
        {hint && <span className="text-[12px] text-[var(--muted-foreground)]">{hint}</span>}
      </div>
    );
  },
);
Label.displayName = "Label";

export { Label };
