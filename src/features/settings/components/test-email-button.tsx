"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/shared/confirm-sheet";
import { sendTestEmail } from "@/features/settings/actions";

interface TestEmailButtonProps {
  isDirty?: boolean;
  onSaveFirst?: () => Promise<boolean>;
}

export function TestEmailButton({ isDirty = false, onSaveFirst }: TestEmailButtonProps) {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const runTest = () => {
    setStatus("idle");
    setErrorMsg(null);
    startTransition(async () => {
      const result = await sendTestEmail();
      if (result.ok) setStatus("ok");
      else {
        setStatus("error");
        setErrorMsg(result.error);
      }
    });
  };

  const handleClick = () => {
    setStatus("idle");
    if (isDirty) {
      setShowConfirm(true);
    } else {
      runTest();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    startTransition(async () => {
      const saved = onSaveFirst ? await onSaveFirst() : false;
      if (!saved) {
        setStatus("error");
        setErrorMsg("Falha ao salvar. Corrija o email e tente novamente.");
        return;
      }
      runTest();
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Enviando..." : "Enviar email de teste"}
      </Button>

      {status === "ok" && (
        <p className="mt-3 text-center text-[13px] text-green-600">
          Email enviado. Verifique sua caixa de entrada.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-center text-[13px] text-[var(--destructive)]">
          {errorMsg ?? "Falha ao enviar. Verifique as configurações."}
        </p>
      )}

      <ConfirmSheet
        open={showConfirm}
        title="Alterações não salvas"
        description="Você alterou o email mas ainda não salvou. Salvar agora e enviar o teste para o novo endereço?"
        confirmLabel="Salvar e enviar"
        pendingLabel="Salvando..."
        cancelLabel="Cancelar"
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
