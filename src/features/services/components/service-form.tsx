"use client";

/**
 * ServiceForm — formulário de criação e edição de serviços.
 *
 * Usa estado local para os steppers (não são inputs nativos) e constrói
 * um FormData manual antes de invocar a Server Action — padrão que
 * mantém validação Zod no servidor sem depender de hidden inputs frágeis.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { I } from "@/components/shared/icons";
import { DurationStepper } from "@/features/services/components/duration-stepper";
import { createService, updateService, deactivateService } from "@/features/services/actions";
import type { ServiceRow } from "@/features/services/queries";

interface ServiceFormProps {
  /** Undefined = modo criação; definido = modo edição */
  service?: ServiceRow;
}

export function ServiceForm({ service }: ServiceFormProps) {
  const isNew = !service;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(service?.durationMinutes ?? 60);
  const [bufferPreMinutes, setBufferPreMinutes] = useState(service?.bufferPreMinutes ?? 0);
  const [bufferPosMinutes, setBufPosMinutes] = useState(service?.bufferPosMinutes ?? 0);
  const [active, setActive] = useState(service?.active ?? true);

  const [error, setError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const totalMinutes = durationMinutes + bufferPreMinutes + bufferPosMinutes;
  const canSave = name.trim().length > 0 && durationMinutes >= 15;

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("description", description.trim());
    fd.set("durationMinutes", String(durationMinutes));
    fd.set("bufferPreMinutes", String(bufferPreMinutes));
    fd.set("bufferPosMinutes", String(bufferPosMinutes));
    fd.set("active", String(active));
    return fd;
  }

  function handleSave() {
    if (!canSave) return;
    setError(null);

    startTransition(async () => {
      const fd = buildFormData();
      const result = isNew ? await createService(fd) : await updateService(service!.id, fd);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Redireciona para a listagem em ambos os casos
      router.push("/admin/servicos");
    });
  }

  function handleDeactivate() {
    if (!service) return;
    setDeactivating(true);
    setError(null);

    startTransition(async () => {
      const result = await deactivateService(service.id);
      setDeactivating(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/servicos");
    });
  }

  return (
    <div className="flex flex-col">
      {/* ── Campos ── */}
      <div className="space-y-4 px-5 pb-4">
        {/* Nome */}
        <div>
          <Label htmlFor="service-name">Nome</Label>
          <Input
            id="service-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex.: Ensaio gestante"
            maxLength={100}
            autoFocus={isNew}
          />
        </div>

        {/* Descrição */}
        <div>
          <Label htmlFor="service-desc" hint="o cliente lê isto antes de escolher">
            Descrição
          </Label>
          <Textarea
            id="service-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que está incluído, formato da entrega, número de fotos…"
            maxLength={500}
          />
        </div>

        {/* Duração e buffers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label hint="minutos">Duração</Label>
            <DurationStepper value={durationMinutes} onChange={setDurationMinutes} min={15} />
          </div>
          <div>
            <Label hint="antes do atendimento">Buffer pré</Label>
            <DurationStepper value={bufferPreMinutes} onChange={setBufferPreMinutes} min={0} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label hint="depois do atendimento">Buffer pós</Label>
            <DurationStepper value={bufferPosMinutes} onChange={setBufPosMinutes} min={0} />
          </div>
        </div>

        {/* Card informativo de reserva total */}
        <Card className="bg-[var(--muted)]/40 border-[var(--border)] p-3.5">
          <div className="flex gap-2.5">
            <I.Info size={15} className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
            <p className="text-[12px] leading-snug text-[var(--muted-foreground)]">
              O sistema reserva{" "}
              <span className="font-medium text-[var(--foreground)]">{totalMinutes} min</span> ao
              todo no calendário (atendimento + buffers), evitando agendamentos colados.
            </p>
          </div>
        </Card>

        {/* Toggle ativo — só no modo edição */}
        {!isNew && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
            <div>
              <p className="text-[14px] font-medium">Serviço ativo</p>
              <p className="text-[12px] text-[var(--muted-foreground)]">
                Serviços inativos não aparecem no agendamento público
              </p>
            </div>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label="Ativar ou desativar serviço"
            />
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <p className="rounded-lg bg-[color-mix(in_oklch,var(--destructive)_10%,transparent)] px-3 py-2 text-[13px] text-[var(--destructive)]">
            {error}
          </p>
        )}

        {/* Botão de desativar — só no modo edição de serviço ativo */}
        {!isNew && service?.active && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={isPending}
              className="press flex w-full items-center justify-center gap-2 py-3 text-[13px] text-[var(--destructive)] disabled:opacity-50"
            >
              <I.Ban size={15} /> Desativar serviço
            </button>
            <p className="mt-1 text-center text-[11.5px] text-[var(--muted-foreground)]">
              agendamentos existentes não são afetados
            </p>
          </div>
        )}
      </div>

      {/* ── Footer fixo com ações ── */}
      <div className="sticky bottom-0 flex gap-2 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3.5">
        {isNew && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!canSave || isPending} onClick={handleSave}>
          {isPending ? "Salvando…" : isNew ? "Criar serviço" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
