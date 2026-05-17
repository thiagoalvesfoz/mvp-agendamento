"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateNotificationEmail } from "@/features/settings/actions";
import { TestEmailButton } from "@/features/settings/components/test-email-button";
import type { SettingsRow } from "@/features/settings/queries";

interface NotificationEmailFormProps {
  settings: SettingsRow;
}

export function NotificationEmailForm({ settings }: NotificationEmailFormProps) {
  const [email, setEmail] = useState(settings.notificationEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = email !== settings.notificationEmail;

  const handleSave = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateNotificationEmail({ notificationEmail: email });
      if (!result.ok) setError(result.error);
      else setSuccess(true);
    });
  };

  const saveFirst = (): Promise<boolean> =>
    new Promise((resolve) => {
      startTransition(async () => {
        const result = await updateNotificationEmail({ notificationEmail: email });
        if (!result.ok) {
          setError(result.error);
          resolve(false);
        } else {
          setSuccess(true);
          resolve(true);
        }
      });
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="mb-5 text-[13px] text-[var(--muted-foreground)]">
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

        {error && <p className="mt-3 text-center text-[13px] text-[var(--destructive)]">{error}</p>}
        {success && (
          <p className="mt-3 text-center text-[13px] text-green-600">Email atualizado.</p>
        )}

        <Card className="mt-4 p-4">
          <p className="mb-1 text-[13px] font-medium">Testar configuração</p>
          <p className="mb-4 text-[13px] text-[var(--muted-foreground)]">
            Envia um email de teste para <strong>{settings.notificationEmail}</strong>.
          </p>
          <TestEmailButton isDirty={isDirty} onSaveFirst={saveFirst} />
        </Card>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-3.5">
        <Button size="lg" className="w-full" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
