import { CustomerSkeleton } from "@/features/customers/components/customer-skeleton";

export default function ClientesLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-2 pt-6">
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-1.5 h-7 w-32 animate-pulse rounded-md bg-[var(--muted)]" />
      </div>

      {/* ── Search bar skeleton ── */}
      <div className="px-5 pb-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--muted)]" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-[var(--muted)]" />
      </div>

      {/* ── Customer rows ── */}
      <div className="flex-1 overflow-hidden px-5">
        <CustomerSkeleton />
      </div>
    </div>
  );
}
