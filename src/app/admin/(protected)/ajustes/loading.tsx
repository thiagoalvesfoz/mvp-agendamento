/**
 * loading.tsx — /admin/ajustes
 *
 * Exibido enquanto o Server Component carrega session + settings.
 * Estrutura: header + card de perfil + grupos de itens com ícone e label.
 */
export default function AjustesLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-4 pt-6">
        <div className="h-3 w-12 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-1.5 h-7 w-20 animate-pulse rounded-md bg-[var(--muted)]" />
      </div>

      {/* ── Card de perfil ── */}
      <div className="px-5 pb-4">
        <div className="flex h-[60px] animate-pulse items-center gap-3 rounded-2xl bg-[var(--muted)] px-3.5">
          <div className="size-9 shrink-0 rounded-full bg-[var(--border)]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3.5 w-3/5 rounded bg-[var(--border)]" />
            <div className="h-3 w-2/5 rounded bg-[var(--border)]" />
          </div>
          <div className="h-4 w-4 rounded bg-[var(--border)]" />
        </div>
      </div>

      {/* ── Skeleton rows (simulando grupos de configuração) ── */}
      <div className="flex-1 overflow-hidden px-5">
        {/* Group label */}
        <div className="mb-2 h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />

        {/* 6 rows */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`flex h-[52px] animate-pulse items-center gap-3 bg-[var(--muted)] px-3.5 ${
                i < 6 ? "border-b border-[var(--border)]" : ""
              }`}
            >
              {/* Ícone */}
              <div className="size-8 shrink-0 rounded-lg bg-[var(--border)]" />
              {/* Label */}
              <div
                className="h-3.5 flex-1 rounded bg-[var(--border)]"
                style={{ maxWidth: `${50 + ((i * 13) % 40)}%` }}
              />
              {/* Valor ou chevron */}
              <div className="h-3 w-12 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
