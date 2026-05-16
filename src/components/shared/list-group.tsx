/**
 * ListGroup + ListItem — componentes de navegação tipo "settings list" iOS-like.
 *
 * Server Component: sem estado, sem interatividade própria.
 * Itens com onClick devem ser passados em Client Components wrapper quando necessário.
 */
import { cn } from "@/lib/utils";
import { I } from "@/components/shared/icons";
import type { ReactNode } from "react";

interface ListGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ListGroup({ title, children, className }: ListGroupProps) {
  return (
    <div className={cn("px-5 pb-2", className)}>
      {title && (
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)] font-medium mb-1.5 px-1">
          {title}
        </div>
      )}
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--card)] overflow-hidden divide-y divide-[var(--border)]">
        {children}
      </div>
    </div>
  );
}

interface ListItemProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  /** Exibe chevron de navegação (padrão: true) */
  showChevron?: boolean;
  /** Item visualmente destacado como ação destrutiva */
  danger?: boolean;
  /** Item não é clicável (sem chevron, sem press) */
  static?: boolean;
  className?: string;
  /** Para uso em Client Components — transforma em <button> */
  asButton?: boolean;
  onClick?: () => void;
}

/**
 * Renderiza como <div> por padrão (Server Component friendly).
 * Para itens interativos com onClick, envolva em um Client Component
 * ou use `asButton` em contexto client.
 */
export function ListItem({
  icon,
  title,
  subtitle,
  value,
  showChevron = true,
  danger = false,
  static: isStatic = false,
  className,
}: ListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-3",
        danger && "text-[var(--destructive)]",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "size-8 rounded-lg flex items-center justify-center shrink-0",
            danger
              ? "bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)] text-[var(--destructive)]"
              : "bg-[var(--muted)] text-[var(--foreground)]",
          )}
        >
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[14px] font-medium tracking-tight",
            danger ? "text-[var(--destructive)]" : "text-[var(--foreground)]",
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-[var(--muted-foreground)] mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {value && (
        <span className="text-[13px] text-[var(--muted-foreground)] shrink-0">{value}</span>
      )}

      {!isStatic && showChevron && (
        <I.Chevron size={15} className="text-[var(--muted-foreground)] shrink-0" />
      )}
    </div>
  );
}

/**
 * Versão interativa do ListItem — precisa de "use client" no componente pai.
 * Renderiza como <button> para suportar onClick nativo.
 */
export function ListItemButton({
  icon,
  title,
  subtitle,
  value,
  showChevron = true,
  danger = false,
  className,
  onClick,
}: ListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press w-full flex items-center gap-3 px-3.5 py-3 text-left",
        danger && "text-[var(--destructive)]",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "size-8 rounded-lg flex items-center justify-center shrink-0",
            danger
              ? "bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)] text-[var(--destructive)]"
              : "bg-[var(--muted)] text-[var(--foreground)]",
          )}
        >
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[14px] font-medium tracking-tight",
            danger ? "text-[var(--destructive)]" : "text-[var(--foreground)]",
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-[var(--muted-foreground)] mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {value && (
        <span className="text-[13px] text-[var(--muted-foreground)] shrink-0">{value}</span>
      )}

      {showChevron && (
        <I.Chevron size={15} className="text-[var(--muted-foreground)] shrink-0" />
      )}
    </button>
  );
}
