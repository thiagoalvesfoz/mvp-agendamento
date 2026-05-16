"use client";

/**
 * StatusSection — exibe o status atual em destaque e permite override total
 * (admin pode mover para qualquer um dos 6 estados via bottom-sheet).
 *
 * Distinto de AppointmentActions: aquele cobre transições "golden path"
 * (PENDING → CONFIRMED, CONFIRMED → COMPLETED/NO_SHOW). Este aceita
 * qualquer transição — útil para corrigir lançamentos errados (ex: reabrir
 * um cancelado).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { I } from "@/components/shared/icons";
import { StatusDot } from "@/components/shared/status-badge";
import { updateAppointmentStatus } from "@/features/appointments/actions";

interface StatusSectionProps {
  appointmentId: string;
  status: AppointmentStatus;
}

const STATUS_META: Record<AppointmentStatus, { label: string; hint: string }> = {
  PENDING: { label: "Pendente", hint: "Aguardando confirmação" },
  CONFIRMED: { label: "Confirmado", hint: "Agendado e ocupando o slot" },
  COMPLETED: { label: "Concluído", hint: "Atendimento finalizado" },
  NO_SHOW: { label: "Não compareceu", hint: "Cliente faltou" },
  CANCELED: { label: "Cancelado", hint: "Slot liberado" },
  EXPIRED: { label: "Expirado", hint: "Pedido expirou sem confirmação" },
};

const ORDER: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELED",
  "EXPIRED",
];

export function StatusSection({ appointmentId, status }: StatusSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[status];

  function change(next: AppointmentStatus) {
    if (next === status) {
      setOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateAppointmentStatus({
        appointmentId,
        status: next,
        reason: "alteração manual de status",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="mt-3 p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Status
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <StatusDot status={status} />
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-semibold leading-tight tracking-tight">
              {meta.label}
            </div>
            <div className="mt-0.5 text-[12.5px] text-[var(--muted-foreground)]">{meta.hint}</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3.5 w-full"
          onClick={() => setOpen(true)}
          disabled={isPending}
        >
          <I.Edit size={14} /> Alterar status
        </Button>
        {error && <p className="mt-2 text-[12px] text-[var(--destructive)]">{error}</p>}
      </Card>

      {open && (
        <StatusPickerSheet
          current={status}
          isPending={isPending}
          onCancel={() => setOpen(false)}
          onPick={change}
        />
      )}
    </>
  );
}

function StatusPickerSheet({
  current,
  isPending,
  onCancel,
  onPick,
}: {
  current: AppointmentStatus;
  isPending: boolean;
  onCancel: () => void;
  onPick: (s: AppointmentStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-[440px] rounded-t-[20px] border-t border-[var(--border)] bg-[var(--background)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-3 pt-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>
        <h3 className="text-[17px] font-semibold tracking-tight">Alterar status</h3>
        <p className="mt-1 text-[12.5px] text-[var(--muted-foreground)]">
          Selecione o novo status. Toda mudança fica registrada no histórico.
        </p>
        <div className="mt-4 space-y-1.5">
          {ORDER.map((s) => {
            const meta = STATUS_META[s];
            const isCurrent = s === current;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onPick(s)}
                disabled={isPending || isCurrent}
                className="press flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-left hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-50"
              >
                <StatusDot status={s} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium tracking-tight">{meta.label}</div>
                  <div className="text-[11.5px] text-[var(--muted-foreground)]">{meta.hint}</div>
                </div>
                {isCurrent && (
                  <span className="text-[11px] text-[var(--muted-foreground)]">atual</span>
                )}
              </button>
            );
          })}
        </div>
        <Button variant="outline" className="mt-4 w-full" onClick={onCancel} disabled={isPending}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
