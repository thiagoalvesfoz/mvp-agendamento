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
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { I } from "@/components/shared/icons";
import { StatusDot } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateAppointmentStatus } from "@/features/appointments/actions";
import { STATUS_THEME } from "@/lib/status-theme";
import type { AppointmentStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mutate } from "swr";

interface StatusSectionProps {
  appointmentId: string;
  status: AppointmentStatus;
}

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

  const { label, hint } = STATUS_THEME[status];

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
      mutate("/api/admin/agendamentos/pending-count");
      router.refresh();
    });
  }

  return (
    <>
      <Card className="mt-3 p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Status</div>
        <div className="mt-2.5 flex items-center gap-3">
          <StatusDot status={status} />
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-semibold leading-tight tracking-tight">{label}</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</div>
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
        {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
      </Card>

      <StatusPickerSheet
        open={open}
        current={status}
        isPending={isPending}
        onCancel={() => setOpen(false)}
        onPick={change}
      />
    </>
  );
}

function StatusPickerSheet({
  open,
  current,
  isPending,
  onCancel,
  onPick,
}: {
  open: boolean;
  current: AppointmentStatus;
  isPending: boolean;
  onCancel: () => void;
  onPick: (s: AppointmentStatus) => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      className="rounded-t-[20px] border-t border-border bg-background p-5"
    >
      <div className="flex justify-center pb-3 pt-1">
        <div className="h-1 w-10 rounded-full bg-border" />
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight">Alterar status</h3>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Selecione o novo status. Toda mudança fica registrada no histórico.
      </p>
      <div className="mt-4 space-y-1.5">
        {ORDER.map((s) => {
          const { label, hint } = STATUS_THEME[s];
          const isCurrent = s === current;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              disabled={isPending || isCurrent}
              className="press flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <StatusDot status={s} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium tracking-tight">{label}</div>
                <div className="text-[11.5px] text-muted-foreground">{hint}</div>
              </div>
              {isCurrent && <span className="text-[11px] text-muted-foreground">atual</span>}
            </button>
          );
        })}
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={onCancel} disabled={isPending}>
        Fechar
      </Button>
    </BottomSheet>
  );
}
