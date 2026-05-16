"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Agenda", match: /^\/admin\/?$/, icon: I.Calendar },
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

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-border bg-white px-2 pb-2.5 pt-2">
      <div className="flex items-stretch">
        {TABS.map((t) => {
          const active = t.match.test(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "press flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.7} />
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
