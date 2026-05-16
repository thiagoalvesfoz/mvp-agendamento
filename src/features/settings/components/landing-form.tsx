"use client";

/**
 * LandingForm — Client Component.
 *
 * Editor da landing page pública.
 * Preview ao vivo no topo reflete as alterações do draft antes de salvar.
 * Submit via Server Action updateLanding.
 */
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { I } from "@/components/shared/icons";
import { updateLanding } from "@/features/settings/actions";
import type { LandingConfigRow } from "@/features/settings/queries";

interface LandingFormProps {
  config: LandingConfigRow;
}

export function LandingForm({ config }: LandingFormProps) {
  const [draft, setDraft] = useState<LandingConfigRow>({ ...config });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const set = <K extends keyof LandingConfigRow>(key: K, value: LandingConfigRow[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateLanding(draft);

      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  const handleDiscard = () => {
    setDraft({ ...config });
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="mb-4 text-[13px] text-[var(--muted-foreground)]">
          O que o cliente vê ao abrir o link da agenda. Edite, salve e o card abaixo já reflete a
          mudança.
        </p>

        {/* ── Preview ── */}
        <Card className="bg-[var(--muted)]/40 mb-6 p-4">
          <div className="mb-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Pré-visualização
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {draft.landingHandle || "—"}
            </span>
            <span className="flex items-center gap-1 text-[10.5px] text-[var(--muted-foreground)]">
              <I.MapPin size={11} /> {draft.landingCity || "—"}
            </span>
          </div>
          <h2 className="mt-2 text-[22px] font-semibold leading-[1.05] tracking-tight">
            {draft.landingName || "Sem nome"}
          </h2>
          {draft.landingTagline && (
            <p className="mt-0.5 text-[13px] font-medium text-[var(--muted-foreground)]">
              {draft.landingTagline}.
            </p>
          )}
        </Card>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="press -mt-4 mb-6 inline-block text-[13px] font-medium text-[var(--primary)] hover:underline"
        >
          Ver página pública →
        </a>

        {/* ── Identidade ── */}
        <div className="mb-6 space-y-3.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Identidade
          </div>

          <div>
            <Label>Nome do estúdio</Label>
            <Input
              value={draft.landingName}
              onChange={(e) => set("landingName", e.target.value)}
              placeholder="Estúdio Lume"
            />
          </div>

          <div>
            <Label hint="frase curta, opcional">Tagline</Label>
            <Input
              value={draft.landingTagline}
              onChange={(e) => set("landingTagline", e.target.value)}
              placeholder="Fotografia autoral & storymaking"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label hint="@perfil">Handle</Label>
              <Input
                value={draft.landingHandle}
                onChange={(e) => set("landingHandle", e.target.value)}
                placeholder="@estudio.lume"
              />
            </div>
            <div>
              <Label hint="cidade · UF">Localização</Label>
              <Input
                value={draft.landingCity}
                onChange={(e) => set("landingCity", e.target.value)}
                placeholder="São Paulo · SP"
              />
            </div>
          </div>
        </div>

        {/* ── Capa ── */}
        <div className="mb-6 space-y-3.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Capa
          </div>

          <div>
            <Label hint="texto exibido sobre a capa">Legenda da capa</Label>
            <Input
              value={draft.landingCoverLabel}
              onChange={(e) => set("landingCoverLabel", e.target.value)}
              placeholder="capa do estúdio"
            />
          </div>

          <p className="text-[11.5px] text-[var(--muted-foreground)]">
            Upload de imagem de capa será liberado em versão futura.
          </p>
        </div>

        {/* ── Conteúdo ── */}
        <div className="mb-6 space-y-3.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Conteúdo
          </div>

          <div>
            <Label hint="parágrafo na seção Sobre">Sobre você</Label>
            <textarea
              value={draft.landingAbout}
              onChange={(e) => set("landingAbout", e.target.value)}
              placeholder="Conte em um parágrafo curto o que você faz, para quem e onde atende."
              rows={4}
              className="w-full resize-none rounded-[8px] border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[oklch(0.708_0_0_/_0.5)]"
            />
          </div>

          <div>
            <Label hint="aviso destacado abaixo do Sobre">Aviso ao cliente</Label>
            <textarea
              value={draft.landingCallout}
              onChange={(e) => set("landingCallout", e.target.value)}
              placeholder="Ex.: valores alinhados pelo WhatsApp após a solicitação."
              rows={3}
              className="w-full resize-none rounded-[8px] border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[oklch(0.708_0_0_/_0.5)]"
            />
            <p className="mt-1 text-[11.5px] text-[var(--muted-foreground)]">
              Deixe em branco para ocultar a caixa de aviso.
            </p>
          </div>

          <div>
            <Label>Texto do botão principal</Label>
            <Input
              value={draft.landingCtaLabel}
              onChange={(e) => set("landingCtaLabel", e.target.value)}
              placeholder="Ver horários disponíveis"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleDiscard}
          disabled={!dirty}
          className="press w-full py-3 text-[12.5px] text-[var(--muted-foreground)] disabled:opacity-40"
        >
          Descartar alterações
        </button>

        {error && <p className="mt-2 text-center text-[13px] text-[var(--destructive)]">{error}</p>}
        {success && (
          <p className="mt-2 text-center text-[13px] text-green-600">Página inicial salva.</p>
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-3.5">
        <Button size="lg" className="w-full" onClick={handleSave} disabled={isPending || !dirty}>
          {isPending ? "Salvando..." : dirty ? "Salvar página inicial" : "Sem alterações"}
        </Button>
      </div>
    </div>
  );
}
