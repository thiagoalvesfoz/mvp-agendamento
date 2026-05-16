/**
 * /admin/servicos — listagem de serviços.
 *
 * Server Component: busca todos os serviços (ativos + inativos) via DAL
 * e passa dados serializáveis para o ServiceList (Client Component que
 * gerencia o toggle "mostrar desativados").
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { listServices } from "@/features/services/queries";
import { ServiceList } from "@/features/services/components/service-list";

export default async function AdminServicosPage() {
  // Carrega tudo de uma vez — o toggle no client apenas filtra o que já veio
  const allServices = await listServices({ includeInactive: true });

  const active = allServices.filter((s) => s.active);
  const inactive = allServices.filter((s) => !s.active);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 pb-2 pt-6">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
            Serviços
          </p>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Catálogo</h1>
        </div>
        <Link
          href="/admin/servicos/novo"
          className="press flex size-10 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
          aria-label="Novo serviço"
        >
          <I.Plus size={18} strokeWidth={2.2} />
        </Link>
      </div>

      {/* ── Subtítulo ── */}
      <div className="px-5 pb-2">
        <p className="text-[13px] text-[var(--muted-foreground)]">
          {active.length} {active.length === 1 ? "serviço ativo" : "serviços ativos"}. Cadastre
          nome, duração e intervalo entre atendimentos.
        </p>
      </div>

      {/* ── Lista (Client Component, gerencia toggle) ── */}
      <div className="mt-3 flex-1 overflow-y-auto px-5 pb-4">
        <ServiceList active={active} inactive={inactive} />
      </div>
    </div>
  );
}
