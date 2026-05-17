import Link from "next/link";
import { I } from "@/components/shared/icons";

export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/admin/ajustes"
            className="press flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label="Voltar"
          >
            <I.ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase leading-none tracking-widest text-[var(--muted-foreground)]">
              Ajustes
            </p>
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight">Bloqueios</h1>
          </div>
        </div>
        <div className="size-10 animate-pulse rounded-full bg-[var(--muted)]" />
      </div>

      <div className="flex-1 overflow-hidden px-5 pt-1">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-[64px] animate-pulse items-center rounded-xl bg-[var(--muted)] px-4"
            >
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3.5 w-1/2 rounded bg-[var(--border)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
