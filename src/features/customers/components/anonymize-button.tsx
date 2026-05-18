"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/shared/icons";
import { ConfirmSheet } from "@/components/shared/confirm-sheet";
import { anonymizeCustomer } from "@/features/customers/actions";

interface AnonymizeButtonProps {
  customerId: string;
  customerName: string;
}

export function AnonymizeButton({ customerId, customerName }: AnonymizeButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await anonymizeCustomer(customerId);
      if (result.ok) {
        setOpen(false);
        router.push("/admin/clientes");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press border-[var(--destructive)]/30 mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-[var(--background)] py-2.5 text-[13px] text-[var(--destructive)]"
      >
        <I.Trash size={14} />
        Excluir dados deste cliente
      </button>

      <ConfirmSheet
        open={open}
        title="Excluir dados de cliente?"
        description={
          <>
            Anonimizaremos o nome, telefone, email e redes sociais de{" "}
            <strong className="text-[var(--foreground)]">{customerName}</strong> nos agendamentos
            existentes. O histórico de datas e serviços permanece para fins fiscais. Esta ação não
            pode ser desfeita.
          </>
        }
        confirmLabel="Sim, excluir"
        pendingLabel="Excluindo…"
        cancelLabel="Voltar"
        variant="danger"
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
