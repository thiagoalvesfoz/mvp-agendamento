import { cn } from "@/lib/utils";

export function PhotoPlaceholder({
  label = "foto",
  className,
  style,
}: {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("placeholder-photo rounded-[10px]", className)} style={style}>
      <span>{label}</span>
    </div>
  );
}
