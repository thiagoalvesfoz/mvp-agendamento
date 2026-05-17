import { Input } from "@/components/ui/input";
import { I } from "@/components/shared/icons";
import { CustomerSkeleton } from "@/features/customers/components/customer-skeleton";

export default function ClientesLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-2 pt-6">
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-1.5 h-7 w-32 animate-pulse rounded-md bg-[var(--muted)]" />
      </div>

      {/* ── Search bar ── */}
      <div className="px-5 pb-3">
        <div className="relative">
          <I.Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <Input placeholder="Buscar por nome ou telefone" disabled className="pl-10" />
        </div>
      </div>

      {/* ── Customer rows ── */}
      <div className="flex-1 overflow-hidden px-5">
        <CustomerSkeleton />
      </div>
    </div>
  );
}
