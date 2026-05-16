"use client";

/**
 * AppointmentActions — botões de transição de status do agendamento.
 *
 * Client Component porque dispara Server Action via useTransition e
 * abre um bottom-sheet de confirmação para o cancelamento (destrutivo).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { I } from "@/components/shared/icons";
import { updateAppointmentStatus } from "@/features/appointments/actions";
import type { AppointmentStatus } from "@prisma/client";

interface AppointmentActionsProps {
  appointmentId: string;
  status: AppointmentStatus;
}

export function AppointmentActions({
  appointmentId,
  status,
}: AppointmentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(next: AppointmentStatus, reason?: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateAppointmentStatus({
        appointmentId,
        status: next,
        reason: reason ?? "",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (status === "PENDING") {
    return (
      <>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmCancel(true)}
            disabled={isPending}
          >
            <I.Close size={16} /> Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => update("CONFIRMED")}
            disabled={isPending}
          >
            <I.Check size={16} strokeWidth={2.2} /> Confirmar
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-[12px] text-[var(--destructive)]">{error}</p>
        )}
        {confirmCancel && (
          <CancelConfirmSheet
            onCancel={() => setConfirmCancel(false)}
            onConfirm={() => {
              update("CANCELED", "cancelado pelo admin");
              setConfirmCancel(false);
            }}
          />
        )}
      </>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => update("NO_SHOW", "marcado como falta")}
            disabled={isPending}
          >
            <I.Ban size={16} /> Falta
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => update("COMPLETED", "marcado como concluído")}
            disabled={isPending}
          >
            <I.Check size={16} strokeWidth={2.2} /> Concluído
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-[12px] text-[var(--destructive)]">{error}</p>
        )}
      </>
    );
  }

  // Estados finais — sem ação
  return null;
}

function CancelConfirmSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute left-0 right-0 bottom-0 mx-auto max-w-[440px] rounded-t-[20px] bg-[var(--background)] p-5 border-t border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-1 pb-3 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>
        <h3 className="text-[17px] font-semibold tracking-tight">
          Cancelar este agendamento?
        </h3>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-2 leading-snug">
          O horário voltará a ficar disponível. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Voltar
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            Sim, cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
