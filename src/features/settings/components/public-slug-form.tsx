"use client";

/**
 * PublicSlugForm — endereço público da agenda.
 */
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePublicSlug } from "@/features/settings/actions";
import type { SettingsRow } from "@/features/settings/queries";

interface PublicSlugFormProps {
  settings: SettingsRow;
}

export function PublicSlugForm({ settings }: PublicSlugFormProps) {
  const [slug, setSlug] = useState(settings.publicSlug);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updatePublicSlug({ publicSlug: slug });
      if (!result.ok) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="mb-5 text-[13px] text-[var(--muted-foreground)]">
          Link que você compartilha com clientes para acessar sua agenda pública.
        </p>

        <Card className="p-4">
          <Label>Endereço da agenda</Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSuccess(false);
            }}
            placeholder="seu-estudio"
            autoComplete="off"
          />
          <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
            Somente letras minúsculas, números, hífens e underscores.
          </p>
        </Card>

        {error && <p className="mt-4 text-center text-[13px] text-[var(--destructive)]">{error}</p>}
        {success && (
          <p className="mt-4 text-center text-[13px] text-green-600">Endereço atualizado.</p>
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-3.5">
        <Button size="lg" className="w-full" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
