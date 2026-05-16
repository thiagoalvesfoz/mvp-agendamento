"use client";

/**
 * NotificationEmailForm — email para notificações administrativas.
 */
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateNotificationEmail } from "@/features/settings/actions";
import type { SettingsRow } from "@/features/settings/queries";

interface NotificationEmailFormProps {
  settings: SettingsRow;
}

export function NotificationEmailForm({ settings }: NotificationEmailFormProps) {
  const [email, setEmail] = useState(settings.notificationEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateNotificationEmail({ notificationEmail: email });
      if (!result.ok) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[13px] text-[var(--muted-foreground)] mb-5">
          Endereço que recebe avisos a cada novo pedido de agendamento.
        </p>

        <Card className="p-4">
          <Label>Email para notificações</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSuccess(false);
            }}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
        </Card>

        {error && (
          <p className="mt-4 text-[13px] text-[var(--destructive)] text-center">{error}</p>
        )}
        {success && (
          <p className="mt-4 text-[13px] text-green-600 text-center">Email atualizado.</p>
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
