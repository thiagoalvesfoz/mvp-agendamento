/**
 * loading.tsx — Agenda (dashboard).
 *
 * Exibido pelo Next.js enquanto o Server Component page.tsx carrega dados.
 * Estrutura espelha o layout real: header com título + tabs + date row + cards.
 */
export default function AgendaLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-2 pt-6">
        {/* Título */}
        <div className="h-7 w-28 animate-pulse rounded-md bg-[var(--muted)]" />

        {/* Tabs dia/semana/mês/pendentes */}
        <div className="mt-3 flex gap-2">
          {[64, 72, 52, 80].map((w, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-full bg-[var(--muted)]"
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
              {/* Hora */}
              <div className="h-4 w-10 rounded bg-[var(--border)]" />
              {/* Divider */}
              <div className="h-10 w-px bg-[var(--border)]" />
              {/* Conteúdo */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3.5 w-3/4 rounded bg-[var(--border)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
              </div>
              {/* Badge status */}
              <div className="h-6 w-16 rounded-full bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
