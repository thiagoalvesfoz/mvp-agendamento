"use client";

/**
 * BlockCreateSheet — Client Component.
 *
 * Sheet (modal bottom-sheet) para criação de bloqueio pontual ou recorrente.
 * Fecha ao salvar com sucesso e dispara onCreated para o pai atualizar o estado.
 */
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { weekdayName } from "@/lib/time";
import { createBlockedDate, createRecurringBlock } from "@/features/settings/actions";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface BlockCreateSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function BlockCreateSheet({ open, onClose, onCreated }: BlockCreateSheetProps) {
  const [type, setType] = useState<"single" | "recurring">("single");
  const [pattern, setPattern] = useState<"weekly" | "yearly">("weekly");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Campos formulário
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [weekDay, setWeekDay] = useState<number>(1); // segunda
  const [month, setMonth] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  const resetForm = () => {
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    setWeekDay(1);
    setMonth(1);
    setDayOfMonth(1);
    setError(null);
    setType("single");
    setPattern("weekly");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      let result;

      if (type === "single") {
        result = await createBlockedDate({
          date,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          reason: reason || undefined,
        });
      } else {
        result = await createRecurringBlock({
          pattern,
          weekDay: pattern === "weekly" ? weekDay : undefined,
          month: pattern === "yearly" ? month : undefined,
          dayOfMonth: pattern === "yearly" ? dayOfMonth : undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          reason: reason || undefined,
        });
      }

      if (!result.ok) {
        setError(result.error);
      } else {
        resetForm();
        onCreated();
        onClose();
      }
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={handleClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar bloqueio"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[440px]",
          "rounded-t-[20px] border-t border-[var(--border)] bg-[var(--background)]",
          "flex max-h-[85dvh] flex-col",
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-[17px] font-semibold tracking-tight">Adicionar bloqueio</h2>
          <button
            type="button"
            onClick={handleClose}
            className="press flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)]"
          >
            <I.Close size={18} />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {/* Tipo */}
          <div>
            <Label>Tipo de bloqueio</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("single")}
                className={cn(
                  "press h-10 rounded-lg border text-[13.5px] font-medium transition-colors",
                  type === "single"
                    ? "bg-[var(--primary)]/8 border-[var(--primary)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)]",
                )}
              >
                Data única
              </button>
              <button
                type="button"
                onClick={() => setType("recurring")}
                className={cn(
                  "press h-10 rounded-lg border text-[13.5px] font-medium transition-colors",
                  type === "recurring"
                    ? "bg-[var(--primary)]/8 border-[var(--primary)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)]",
                )}
              >
                Recorrente
              </button>
            </div>
          </div>

          {/* Campos condicionais por tipo */}
          {type === "single" ? (
            <div className="min-w-0">
              <Label htmlFor="block-date">Data</Label>
              <Input
                id="block-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          ) : (
            <>
              {/* Pattern (weekly/yearly) */}
              <div>
                <Label>Padrão</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPattern("weekly")}
                    className={cn(
                      "press h-10 rounded-lg border text-[13.5px] font-medium transition-colors",
                      pattern === "weekly"
                        ? "bg-[var(--primary)]/8 border-[var(--primary)] text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)]",
                    )}
                  >
                    Semanal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPattern("yearly")}
                    className={cn(
                      "press h-10 rounded-lg border text-[13.5px] font-medium transition-colors",
                      pattern === "yearly"
                        ? "bg-[var(--primary)]/8 border-[var(--primary)] text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)]",
                    )}
                  >
                    Anual
                  </button>
                </div>
              </div>

              {pattern === "weekly" && (
                <div>
                  <Label htmlFor="block-weekday">Dia da semana</Label>
                  <select
                    id="block-weekday"
                    value={weekDay}
                    onChange={(e) => setWeekDay(Number(e.target.value))}
                    className={cn(
                      "h-9 w-full rounded-[8px] border border-[var(--input)] bg-[var(--background)]",
                      "px-3 text-[16px] text-[var(--foreground)]",
                      "focus:outline-none focus-visible:border-[var(--ring)]",
                    )}
                  >
                    {Array.from({ length: 7 }, (_, i) => (
                      <option key={i} value={i}>
                        {weekdayName(i)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pattern === "yearly" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="block-month">Mês</Label>
                    <select
                      id="block-month"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className={cn(
                        "h-9 w-full rounded-[8px] border border-[var(--input)] bg-[var(--background)]",
                        "px-3 text-[16px] text-[var(--foreground)]",
                        "focus:outline-none focus-visible:border-[var(--ring)]",
                      )}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="block-day">Dia do mês</Label>
                    <Input
                      id="block-day"
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Horários (opcionais) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="block-start"
                  className="text-[13px] font-medium text-[var(--foreground)]"
                >
                  Das
                </label>
                {startTime ? (
                  <button
                    type="button"
                    onClick={() => setStartTime("")}
                    className="press text-[12px] text-[var(--primary)]"
                  >
                    Limpar
                  </button>
                ) : (
                  <span className="text-[12px] text-[var(--muted-foreground)]">opcional</span>
                )}
              </div>
              <Input
                id="block-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="block-end"
                  className="text-[13px] font-medium text-[var(--foreground)]"
                >
                  Até
                </label>
                {endTime ? (
                  <button
                    type="button"
                    onClick={() => setEndTime("")}
                    className="press text-[12px] text-[var(--primary)]"
                  >
                    Limpar
                  </button>
                ) : (
                  <span className="text-[12px] text-[var(--muted-foreground)]">opcional</span>
                )}
              </div>
              <Input
                id="block-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <p className="-mt-2 text-[11.5px] text-[var(--muted-foreground)]">
            Deixe em branco para bloquear o dia inteiro.
          </p>

          {/* Motivo */}
          <div>
            <Label htmlFor="block-reason" hint="opcional">
              Motivo
            </Label>
            <Input
              id="block-reason"
              placeholder="Férias, feriado, evento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && <p className="text-[13px] text-[var(--destructive)]">{error}</p>}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-5 py-3.5">
          <Button size="lg" className="w-full" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar bloqueio"}
          </Button>
        </div>
      </div>
    </>
  );
}
