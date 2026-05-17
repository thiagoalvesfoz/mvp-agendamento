import { I } from "@/components/shared/icons";
import Link from "next/link";

export default function AgendaLoading() {
  return (
    <div className="relative flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-3 pt-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Agenda
            </p>
            <h1 className="mt-0.5 text-[22px] font-semibold leading-tight tracking-tight">
              Atendimentos
            </h1>
          </div>
        </div>

        {/* Stats pills */}
        <div className="grid grid-cols-3 gap-2">
          {["Pendentes", "Hoje", "Esta semana"].map((label) => (
            <div
              key={label}
              className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5"
            >
              <div className="h-2.5 w-10 rounded bg-[var(--border)]" />
              <div className="mt-1.5 h-5 w-6 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Segmented selector ── */}
      <div className="px-5 pb-3">
        <div className="flex gap-2">
          {[64, 72, 52, 80].map((w, i) => (
            <div
              key={i}
              className="h-8 flex-1 animate-pulse rounded-full bg-[var(--muted)]"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* ── Date navigation row ── */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--muted)]" />
        <div className="h-5 w-36 animate-pulse rounded-md bg-[var(--muted)]" />
        <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--muted)]" />
      </div>

      {/* ── Appointment cards ── */}
      <div className="flex-1 overflow-hidden px-5">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-[70px] animate-pulse items-center gap-3 rounded-2xl bg-[var(--muted)] px-4"
            >
              <div className="h-4 w-10 rounded bg-[var(--border)]" />
              <div className="h-10 w-px bg-[var(--border)]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3.5 w-3/4 rounded bg-[var(--border)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>

      {/* ── FAB ── */}
      <Link
        href="/admin/agenda/novo"
        aria-label="Novo agendamento"
        className="press absolute bottom-5 right-5 z-10 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
      >
        <I.Plus size={22} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
