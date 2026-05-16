"use client";

/**
 * RetentionForm — retenção de dados (LGPD).
 */
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DurationStepper } from "@/features/services/components/duration-stepper";
import { updateRetention } from "@/features/settings/actions";
import type { SettingsRow } from "@/features/settings/queries";

interface RetentionFormProps {
  settings: SettingsRow;
}

export function RetentionForm({ settings }: RetentionFormProps) {
  const [retentionMonths, setRetentionMonths] = useState(settings.retentionMonths);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateRetention({ retentionMonths });
      if (!result.ok) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[13px] text-[var(--muted-foreground)] mb-5">
          Período após o qual dados pessoais de clientes inativos ficam elegíveis para
          anonimização automática.
        </p>

        <Card className="p-4">
          <Label hint="meses">Retenção de dados (LGPD)</Label>
          <DurationStepper
            value={retentionMonths}
            onChange={setRetentionMonths}
            step={1}
            min={1}
          />
          <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
            Dados de clientes são elegíveis para anonimização após {retentionMonths} meses sem
            agendamento.
          </p>
        </Card>

        {error && (
          <p className="mt-4 text-[13px] text-[var(--destructive)] text-center">{error}</p>
        )}
        {success && (
          <p className="mt-4 text-[13px] text-green-600 text-center">Retenção atualizada.</p>
        )}
      </div>

      <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--background)]">
        <Button size="lg" className="w-full" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
