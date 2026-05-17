"use client";

/**
 * BlocksList — Client Component.
 *
 * Exibe datas pontuais bloqueadas e bloqueios recorrentes.
 * Remoção via Server Actions com useTransition para feedback visual.
 */
import { useTransition } from "react";
import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { weekdayName, monthShort } from "@/lib/time";
import { deleteBlockedDate, deleteRecurringBlock } from "@/features/settings/actions";
import type { BlockedDateRow, RecurringBlockRow } from "@/features/settings/queries";

// ── Helpers de label ──────────────────────────────────────────────────────────

function formatBlockedDateLabel(date: Date): {
  month: string;
  day: number;
  weekday: string;
  full: string;
} {
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
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
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

function RemoveButton({ onRemove, label }: { onRemove: () => void; label: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isPending}
      onClick={() => startTransition(onRemove)}
      className={cn(
        "press flex size-8 items-center justify-center rounded-lg",
        "text-[var(--muted-foreground)] disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {isPending ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
  const handleDeleteDate = async (id: string) => {
    await deleteBlockedDate(id);
  };

  const handleDeleteRecurring = async (id: string) => {
    await deleteRecurringBlock(id);
  };

  return (
    <div className="space-y-6 px-5 pb-6">
      {/* ── Datas pontuais ── */}
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Próximas datas bloqueadas
        </div>

        {blockedDates.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[var(--muted-foreground)]">
            Nenhuma data bloqueada.
          </p>
        ) : (
          <div className="space-y-1.5">
            {blockedDates.map((b) => {
              const { month, day, weekday, full } = formatBlockedDateLabel(b.date);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
                >
                  {/* Mini calendário */}
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--muted)]">
                    <span className="text-[8px] uppercase leading-none tracking-wide text-[var(--muted-foreground)]">
                      {month}
                    </span>
                    <span className="mt-0.5 text-[14px] font-semibold leading-none">{day}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium tracking-tight">
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
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Bloqueios recorrentes
        </div>

        {recurringBlocks.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[var(--muted-foreground)]">
            Nenhum bloqueio recorrente.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recurringBlocks.map((r) => {
              const { title, subtitle } = recurringLabel(r);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3"
                >
                  <div className="bg-[var(--primary)]/10 flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)]">
                    <I.Repeat size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
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
