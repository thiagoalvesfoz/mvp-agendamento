/**
 * CustomerCard — card clicável de um cliente na listagem.
 *
 * Server Component. A navegação para /admin/clientes/[id] é via Link.
 */
import Link from "next/link";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import type { CustomerRow } from "@/features/customers/queries";

/** Formata telefone BR: +55 (47) 99999-9999 → "(47) 99999-9999". */
function fmtPhone(raw: string): string {
  // Remove DDI 55 se presente (armazenado como "5547999999999")
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  // Fallback: retorna o valor bruto
  return raw;
}

interface CustomerCardProps {
  customer: CustomerRow;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const count = customer._count.appointments;

  return (
    <Link
      href={`/admin/clientes/${customer.id}`}
      className="press flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left"
    >
      <CustomerAvatar name={customer.name} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium tracking-tight">{customer.name}</div>
        <div className="truncate text-[12px] text-[var(--muted-foreground)]">
          {fmtPhone(customer.phone)}
          {customer.socialMedia && ` · ${customer.socialMedia}`}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-mono text-[13px] font-medium tracking-tight">{count}</div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
          {count === 1 ? "visita" : "visitas"}
        </div>
      </div>
    </Link>
  );
}
