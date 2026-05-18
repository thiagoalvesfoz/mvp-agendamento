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
import { ConfirmSheet } from "@/components/shared/confirm-sheet";
import type { AppointmentStatus } from "@prisma/client";

interface AppointmentActionsProps {
  appointmentId: string;
  status: AppointmentStatus;
}

export function AppointmentActions({ appointmentId, status }: AppointmentActionsProps) {
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
        {error && <p className="mt-2 text-[12px] text-[var(--destructive)]">{error}</p>}
        <ConfirmSheet
          open={confirmCancel}
          title="Cancelar este agendamento?"
          description="O horário voltará a ficar disponível. Esta ação não pode ser desfeita."
          confirmLabel="Sim, cancelar"
          cancelLabel="Voltar"
          variant="danger"
          onConfirm={() => {
            update("CANCELED", "cancelado pelo admin");
            setConfirmCancel(false);
          }}
          onCancel={() => setConfirmCancel(false)}
        />
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
        {error && <p className="mt-2 text-[12px] text-[var(--destructive)]">{error}</p>}
      </>
    );
  }

  // Estados finais — sem ação
  return null;
}
