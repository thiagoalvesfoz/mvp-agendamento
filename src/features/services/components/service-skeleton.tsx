export function ServiceSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-[80px] animate-pulse items-center gap-3 rounded-2xl bg-[var(--muted)] px-4"
        >
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-2/3 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
          </div>
          <div className="h-4 w-4 rounded bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}
