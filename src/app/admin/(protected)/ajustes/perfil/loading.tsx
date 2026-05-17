import Link from "next/link";
import { I } from "@/components/shared/icons";

export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-3 pt-6">
        <Link
          href="/admin/ajustes"
          className="press flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={20} />
        </Link>
        <div>
          <p className="text-[12px] font-medium uppercase leading-none tracking-widest text-[var(--muted-foreground)]">
            Ajustes
          </p>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">Perfil</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-5 pt-2">
        <div className="space-y-3">
          {/* Avatar card */}
          <div className="flex h-[72px] animate-pulse items-center gap-3 rounded-2xl bg-[var(--muted)] px-4">
            <div className="size-10 shrink-0 rounded-full bg-[var(--border)]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3.5 w-2/5 rounded bg-[var(--border)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
            </div>
          </div>
          {/* Info rows */}
          <div className="overflow-hidden rounded-2xl bg-[var(--muted)]">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex h-[52px] animate-pulse items-center gap-3 px-4 ${i < 4 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="h-3 w-16 rounded bg-[var(--border)]" />
                <div className="h-3 w-28 rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
          {/* Login history */}
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
          <div className="overflow-hidden rounded-2xl bg-[var(--muted)]">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex h-[44px] animate-pulse items-center px-4 ${i < 3 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="h-3 w-40 rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
