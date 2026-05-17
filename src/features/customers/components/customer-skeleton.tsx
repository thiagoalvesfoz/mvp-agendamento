export function CustomerSkeleton() {
  return (
    <div className="space-y-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex h-[56px] animate-pulse items-center gap-3 rounded-xl bg-[var(--muted)] px-3"
        >
          <div className="size-9 shrink-0 rounded-full bg-[var(--border)]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3.5 w-1/2 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
          </div>
          <div className="h-4 w-4 rounded bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}
