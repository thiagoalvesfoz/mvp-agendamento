/**
 * loading.tsx — /admin/clientes
 *
 * Exibido enquanto o CustomerList faz o fetch inicial.
 * Estrutura: header + barra de busca + linhas de cliente (avatar + nome + telefone).
 */
export default function ClientesLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-2 pt-6">
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-1.5 h-7 w-32 animate-pulse rounded-md bg-[var(--muted)]" />
      </div>

      {/* ── Search bar skeleton ── */}
      <div className="px-5 pb-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--muted)]" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-[var(--muted)]" />
      </div>

      {/* ── Customer rows ── */}
      <div className="flex-1 overflow-hidden px-5">
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex h-[56px] animate-pulse items-center gap-3 rounded-xl bg-[var(--muted)] px-3"
            >
              {/* Avatar */}
              <div className="size-9 shrink-0 rounded-full bg-[var(--border)]" />
              {/* Nome + telefone */}
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3.5 w-1/2 rounded bg-[var(--border)]" />
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
