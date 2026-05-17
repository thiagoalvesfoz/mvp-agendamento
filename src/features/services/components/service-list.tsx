"use client";

import useSWR from "swr";
import { useState } from "react";
import { ServiceCard } from "@/features/services/components/service-card";
import { ServiceSkeleton } from "@/features/services/components/service-skeleton";
import { I } from "@/components/shared/icons";
import type { ServiceRow } from "@/features/services/queries";

type ServiceData = {
  active: ServiceRow[];
  inactive: ServiceRow[];
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch failed");
    return r.json() as Promise<ServiceData>;
  });

export function ServiceList() {
  const { data, error, mutate } = useSWR("/api/admin/servicos", fetcher, {
    revalidateOnFocus: false,
  });
  const [showInactive, setShowInactive] = useState(false);

  if (!data && !error) return <ServiceSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-[14px] font-medium">Erro ao carregar serviços</p>
        <button
          type="button"
          onClick={() => void mutate()}
          className="press text-[13px] text-[var(--primary)]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const active = data?.active ?? [];
  const inactive = data?.inactive ?? [];
  const hasInactive = inactive.length > 0;
  const visibleInactive = showInactive ? inactive : [];

  if (active.length === 0 && inactive.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
          <I.Camera size={24} className="text-[var(--muted-foreground)]" />
        </div>
        <p className="text-[15px] font-medium tracking-tight">Nenhum serviço cadastrado</p>
        <p className="max-w-[240px] text-[13px] leading-snug text-[var(--muted-foreground)]">
          Crie seu primeiro serviço usando o botão + no topo da tela.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Subtítulo dinâmico (movido para cá porque depende dos dados) ── */}
      <p className="mb-3 text-[13px] text-[var(--muted-foreground)]">
        {active.length} {active.length === 1 ? "serviço ativo" : "serviços ativos"}. Cadastre nome,
        duração e intervalo entre atendimentos.
      </p>

      {active.length === 0 && (
        <p className="py-4 text-center text-[13px] text-[var(--muted-foreground)]">
          Nenhum serviço ativo no momento.
        </p>
      )}

      <div className="space-y-2.5">
        {active.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>

      {visibleInactive.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Desativados
          </p>
          {visibleInactive.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}

      {hasInactive && (
        <button
          type="button"
          onClick={() => setShowInactive((v) => !v)}
          className="press mt-5 w-full py-2 text-[12px] text-[var(--muted-foreground)]"
        >
          {showInactive
            ? `– ocultar desativados`
            : `+ mostrar serviços desativados (${inactive.length})`}
        </button>
      )}
    </div>
  );
}
