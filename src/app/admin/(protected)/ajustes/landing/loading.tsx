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
            Página pública
          </p>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">Página inicial</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-5 pt-2">
        <div className="h-40 w-full animate-pulse rounded-2xl bg-[var(--muted)]" />
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-[var(--muted)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
