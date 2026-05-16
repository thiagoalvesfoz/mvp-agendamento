/**
 * CustomerAvatar — avatar com iniciais do nome do cliente.
 *
 * Server Component. Extrai até 2 iniciais e escolhe uma cor de fundo
 * determinística baseada no primeiro char, para consistência visual.
 */
import { cn } from "@/lib/utils";

// Paleta de backgrounds sutis que harmoniza com o design system
const BG_PALETTE = [
  "bg-[oklch(0.93_0.06_260)]", // azul suave
  "bg-[oklch(0.93_0.06_150)]", // verde suave
  "bg-[oklch(0.93_0.06_30)]", // laranja suave
  "bg-[oklch(0.93_0.06_320)]", // rosa suave
  "bg-[oklch(0.93_0.06_200)]", // ciano suave
  "bg-[oklch(0.93_0.06_80)]", // amarelo suave
];

function pickBg(name: string): string {
  const idx = name.charCodeAt(0) % BG_PALETTE.length;
  return BG_PALETTE[idx] ?? BG_PALETTE[0] ?? "bg-[var(--muted)]";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  const last = parts[parts.length - 1];
  return (first.charAt(0) + (last?.charAt(0) ?? "")).toUpperCase();
}

interface CustomerAvatarProps {
  name: string;
  size?: "sm" | "lg";
  className?: string;
}

export function CustomerAvatar({ name, size = "sm", className }: CustomerAvatarProps) {
  const initials = getInitials(name);
  const bg = pickBg(name);

  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        size === "sm" && "size-[38px] text-[13px]",
        size === "lg" && "size-16 text-[20px]",
        bg,
        "text-[var(--foreground)]",
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
