"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { I } from "@/components/shared/icons";
import { BottomSheet } from "@/components/shared/bottom-sheet";
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

      <BottomSheet
        open={open}
        onClose={() => !isPending && setOpen(false)}
        className="rounded-t-[28px] bg-[var(--background)] p-5"
      >
        <div className="flex justify-center pb-3 pt-1">
          <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
        </div>

        <h3 className="text-[17px] font-semibold tracking-tight">Excluir dados de cliente?</h3>
        <p className="mt-2 text-[13px] leading-snug text-[var(--muted-foreground)]">
          Anonimizaremos o nome, telefone, email e redes sociais de{" "}
          <strong className="text-[var(--foreground)]">{customerName}</strong> nos agendamentos
          existentes. O histórico de datas e serviços permanece para fins fiscais. Esta ação não
          pode ser desfeita.
        </p>

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Excluindo…" : "Sim, excluir"}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
