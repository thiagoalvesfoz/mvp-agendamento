"use client";

/**
 * ServiceList — Client Component.
 *
 * Precisa ser Client porque o toggle "mostrar desativados" exige estado local.
 * Os dados já chegam pré-carregados do Server Component pai (page.tsx),
 * evitando fetch desnecessário no cliente.
 */
import { useState } from "react";
import { ServiceCard } from "@/features/services/components/service-card";
import { I } from "@/components/shared/icons";
import type { ServiceRow } from "@/features/services/queries";

interface ServiceListProps {
  active: ServiceRow[];
  inactive: ServiceRow[];
}

export function ServiceList({ active, inactive }: ServiceListProps) {
  const [showInactive, setShowInactive] = useState(false);

  const hasInactive = inactive.length > 0;
  const visibleInactive = showInactive ? inactive : [];

  if (active.length === 0 && inactive.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="size-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
          <I.Camera size={24} className="text-[var(--muted-foreground)]" />
        </div>
        <p className="text-[15px] font-medium tracking-tight">Nenhum serviço cadastrado</p>
        <p className="text-[13px] text-[var(--muted-foreground)] max-w-[240px] leading-snug">
          Crie seu primeiro serviço usando o botão + no topo da tela.
        </p>
      </div>
    );
  }

  return (
    <div>
      {active.length === 0 && (
        <p className="text-[13px] text-[var(--muted-foreground)] py-4 text-center">
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
          className="press mt-5 w-full text-[12px] text-[var(--muted-foreground)] py-2"
        >
          {showInactive
            ? `– ocultar desativados`
            : `+ mostrar serviços desativados (${inactive.length})`}
        </button>
      )}
    </div>
  );
}
