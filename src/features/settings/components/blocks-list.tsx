"use client";

/**
 * BlocksList — Client Component.
 *
 * Exibe datas pontuais bloqueadas e bloqueios recorrentes.
 * Remoção via Server Actions com useTransition para feedback visual.
 */
import { useTransition, useState } from "react";
import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { weekdayName, monthShort } from "@/lib/time";
import { deleteBlockedDate, deleteRecurringBlock } from "@/features/settings/actions";
import type { BlockedDateRow, RecurringBlockRow } from "@/features/settings/queries";

// ── Helpers de label ──────────────────────────────────────────────────────────

function formatBlockedDateLabel(date: Date): { month: string; day: number; weekday: string; full: string } {
  const d = new Date(date);
  // date chega como Date às 00:00 UTC; parseamos via UTC para não deslocar um dia
  const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60_000);
  return {
    month: monthShort(utc.getMonth()).toUpperCase(),
    day: utc.getDate(),
    weekday: weekdayName(utc.getDay()),
    full: `${String(utc.getDate()).padStart(2, "0")}/${String(utc.getMonth() + 1).padStart(2, "0")}/${utc.getFullYear()}`,
  };
}

function recurringLabel(block: RecurringBlockRow): { title: string; subtitle: string } {
  if (block.pattern === "weekly" && block.weekDay != null) {
    return {
      title: `Toda ${weekdayName(block.weekDay)}`,
      subtitle: block.reason ?? "Bloqueio semanal",
    };
  }
  if (block.pattern === "yearly" && block.month != null && block.dayOfMonth != null) {
    const MONTHS = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    const monthName = MONTHS[block.month - 1] ?? String(block.month);
    return {
      title: `${block.dayOfMonth} de ${monthName} todo ano`,
      subtitle: block.reason ?? "Bloqueio anual",
    };
  }
  return { title: "Bloqueio recorrente", subtitle: block.reason ?? "" };
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function RemoveButton({
  onRemove,
  label,
}: {
  onRemove: () => void;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isPending}
      onClick={() => startTransition(onRemove)}
      className={cn(
        "press size-8 rounded-lg flex items-center justify-center",
        "text-[var(--muted-foreground)] disabled:opacity-40 disabled:pointer-events-none",
      )}
    >
      {isPending ? (
        <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <I.Trash size={14} />
      )}
    </button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface BlocksListProps {
  blockedDates: BlockedDateRow[];
  recurringBlocks: RecurringBlockRow[];
}

export function BlocksList({ blockedDates, recurringBlocks }: BlocksListProps) {
  const [localDates, setLocalDates] = useState(blockedDates);
  const [localRecurring, setLocalRecurring] = useState(recurringBlocks);

  const handleDeleteDate = async (id: string) => {
    const result = await deleteBlockedDate(id);
    if (result.ok) {
      setLocalDates((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    const result = await deleteRecurringBlock(id);
    if (result.ok) {
      setLocalRecurring((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="px-5 pb-6 space-y-6">
      {/* ── Datas pontuais ── */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
          Próximas datas bloqueadas
        </div>

        {localDates.length === 0 ? (
          <p className="text-[13px] text-[var(--muted-foreground)] text-center py-8">
            Nenhuma data bloqueada.
          </p>
        ) : (
          <div className="space-y-1.5">
            {localDates.map((b) => {
              const { month, day, weekday, full } = formatBlockedDateLabel(b.date);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 py-2.5"
                >
                  {/* Mini calendário */}
                  <div className="size-10 rounded-lg bg-[var(--muted)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] uppercase tracking-wide text-[var(--muted-foreground)] leading-none">
                      {month}
                    </span>
                    <span className="text-[14px] font-semibold leading-none mt-0.5">{day}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium tracking-tight truncate">
                      {b.reason ?? "Bloqueio"}
                    </div>
                    <div className="text-[11.5px] text-[var(--muted-foreground)]">
                      {weekday} · {full}
                      {b.startTime && b.endTime && ` · ${b.startTime}–${b.endTime}`}
                    </div>
                  </div>

                  <RemoveButton
                    label={`Remover bloqueio de ${full}`}
                    onRemove={() => handleDeleteDate(b.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bloqueios recorrentes ── */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
          Bloqueios recorrentes
        </div>

        {localRecurring.length === 0 ? (
          <p className="text-[13px] text-[var(--muted-foreground)] text-center py-8">
            Nenhum bloqueio recorrente.
          </p>
        ) : (
          <div className="space-y-1.5">
            {localRecurring.map((r) => {
              const { title, subtitle } = recurringLabel(r);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 py-3"
                >
                  <div className="size-9 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                    <I.Repeat size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium tracking-tight">{title}</div>
                    <div className="text-[11.5px] text-[var(--muted-foreground)]">{subtitle}</div>
                  </div>

                  <RemoveButton
                    label={`Remover bloqueio recorrente ${title}`}
                    onRemove={() => handleDeleteRecurring(r.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
