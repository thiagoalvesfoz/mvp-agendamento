/**
 * loading.tsx — /admin/servicos
 *
 * Exibido enquanto o ServiceList faz o fetch inicial.
 * Estrutura: header (título + botão +) + subtítulo + cards de serviço.
 */
export default function ServicosLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 pb-2 pt-6">
        <div>
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
          <div className="mt-1.5 h-7 w-24 animate-pulse rounded-md bg-[var(--muted)]" />
        </div>
        {/* Botão "+" circular placeholder */}
        <div className="size-10 animate-pulse rounded-full bg-[var(--muted)]" />
      </div>

      {/* ── Subtítulo ── */}
      <div className="px-5 pb-2">
        <div className="h-3.5 w-56 animate-pulse rounded bg-[var(--muted)]" />
      </div>

      {/* ── Service cards ── */}
      <div className="mt-3 flex-1 overflow-hidden px-5">
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-[80px] animate-pulse items-center gap-3 rounded-2xl bg-[var(--muted)] px-4"
            >
              <div className="flex flex-1 flex-col gap-2">
                {/* Nome do serviço */}
                <div className="h-4 w-2/3 rounded bg-[var(--border)]" />
                {/* Duração + buffer */}
                <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
              </div>
              {/* Chevron */}
              <div className="h-4 w-4 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
