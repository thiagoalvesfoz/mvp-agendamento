"use client";

/**
 * BlocksPageClient — Client Component wrapper para a página de bloqueios.
 *
 * Renderiza header (com botão "+" alinhado à direita), lista e sheet de criação.
 * Mantém o estado de abertura do sheet e refresha o Server Component pai após criação.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { BlocksList } from "@/features/settings/components/blocks-list";
import { BlockCreateSheet } from "@/features/settings/components/block-create-sheet";
import type { BlockedDateRow, RecurringBlockRow } from "@/features/settings/queries";

interface BlocksPageClientProps {
  blockedDates: BlockedDateRow[];
  recurringBlocks: RecurringBlockRow[];
}

export function BlocksPageClient({ blockedDates, recurringBlocks }: BlocksPageClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();

  const handleCreated = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/admin/ajustes"
            className="press size-9 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label="Voltar"
          >
            <I.ChevronLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)] leading-none">
              Ajustes
            </p>
            <h1 className="text-[20px] font-semibold tracking-tight leading-tight">Bloqueios</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Adicionar bloqueio"
          className="press size-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shrink-0"
        >
          <I.Plus size={18} strokeWidth={2.2} />
        </button>
      </div>

      {/* Subtítulo */}
      <p className="px-5 text-[13px] text-[var(--muted-foreground)] mb-3">
        Bloqueie datas pontuais (férias, feriados) ou recorrentes que se repetem toda semana ou
        todo ano.
      </p>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        <BlocksList blockedDates={blockedDates} recurringBlocks={recurringBlocks} />
      </div>

      <BlockCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
