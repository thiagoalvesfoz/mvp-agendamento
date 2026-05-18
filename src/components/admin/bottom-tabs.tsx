"use client";

import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/admin",
    label: "Agenda",
    match: /^\/admin(\/agenda(\/.*)?)?\/?$/,
    icon: I.Calendar,
  },
  {
    href: "/admin/servicos",
    label: "Serviços",
    match: /^\/admin\/servicos/,
    icon: I.Camera,
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    match: /^\/admin\/clientes/,
    icon: I.Users,
  },
  {
    href: "/admin/ajustes",
    label: "Ajustes",
    match: /^\/admin\/ajustes/,
    icon: I.Settings,
  },
] as const;

export function BottomTabs({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-border bg-white px-2 pt-2"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.625rem)" }}
    >
      <div className="flex items-stretch">
        {TABS.map((t) => {
          const active = t.match.test(pathname);
          const Icon = t.icon;
          const showBadge = t.href === "/admin" && pendingCount > 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "press flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2 : 1.7} />
                {showBadge && (
                  <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-destructive" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10.5px]",
                  active ? "font-semibold tracking-tight" : "font-medium",
                )}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
