import { ServiceSkeleton } from "@/features/services/components/service-skeleton";

export default function ServicosLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 pb-2 pt-6">
        <div>
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
          <div className="mt-1.5 h-7 w-24 animate-pulse rounded-md bg-[var(--muted)]" />
        </div>
        <div className="size-10 animate-pulse rounded-full bg-[var(--muted)]" />
      </div>

      {/* ── Subtítulo ── */}
      <div className="px-5 pb-2">
        <div className="h-3.5 w-56 animate-pulse rounded bg-[var(--muted)]" />
      </div>

      {/* ── Service cards ── */}
      <div className="mt-3 flex-1 overflow-hidden px-5">
        <ServiceSkeleton />
      </div>
    </div>
  );
}
