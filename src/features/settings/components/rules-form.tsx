"use client";

/**
 * RulesForm — Client Component.
 *
 * Regras gerais (antecedência, expiração, limite no futuro).
 * Slug público, email e retenção LGPD ficam em `account-form.tsx`.
 */
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DurationStepper } from "@/features/services/components/duration-stepper";
import { updateRules } from "@/features/settings/actions";
import type { SettingsRow } from "@/features/settings/queries";

interface RulesFormProps {
  settings: SettingsRow;
}

export function RulesForm({ settings }: RulesFormProps) {
  const [minNoticeHours, setMinNoticeHours] = useState(settings.minimumScheduleNoticeHours);
  const [maxDaysAhead, setMaxDaysAhead] = useState(settings.maximumScheduleDaysAhead);
  const [expirationHours, setExpirationHours] = useState(settings.pendingExpirationHours);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateRules({
        minimumScheduleNoticeHours: minNoticeHours,
        maximumScheduleDaysAhead: maxDaysAhead,
        pendingExpirationHours: expirationHours,
      });

      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[13px] text-[var(--muted-foreground)] mb-5">
          Defina como os clientes podem agendar e quanto tempo um pedido fica esperando
          confirmação.
        </p>

        <div className="space-y-4">
          <Card className="p-4">
            <Label hint="horas">Antecedência mínima</Label>
            <DurationStepper
              value={minNoticeHours}
              onChange={setMinNoticeHours}
              step={1}
              min={1}
            />
            <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
              Cliente só consegue agendar com pelo menos {minNoticeHours}h de antecedência.
            </p>
          </Card>

          <Card className="p-4">
            <Label hint="dias">Limite máximo no futuro</Label>
            <DurationStepper
              value={maxDaysAhead}
              onChange={setMaxDaysAhead}
              step={5}
              min={1}
            />
            <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
              Não aceitar pedidos com mais de {maxDaysAhead} dias à frente.
            </p>
          </Card>

          <Card className="p-4">
            <Label hint="horas">Expiração de pedidos pendentes</Label>
            <DurationStepper
              value={expirationHours}
              onChange={setExpirationHours}
              step={6}
              min={1}
            />
            <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
              Se você não confirmar em {expirationHours}h, o pedido expira e o horário fica livre
              de novo.
            </p>
          </Card>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-[var(--destructive)] text-center">{error}</p>
        )}
        {success && (
          <p className="mt-4 text-[13px] text-green-600 text-center">Configurações salvas.</p>
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
