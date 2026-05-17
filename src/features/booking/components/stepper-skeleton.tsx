export function BookingStepperSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* header */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--muted)]" />
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1 flex-1 animate-pulse rounded-full bg-[var(--muted)]" />
          ))}
        </div>
      </div>
      {/* content */}
      <div className="flex-1 space-y-3 px-5 pt-2">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-[var(--muted)]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-[14px] bg-[var(--muted)]" />
        ))}
      </div>
    </div>
  );
}
