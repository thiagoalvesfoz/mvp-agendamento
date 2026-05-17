/**
 * /admin/servicos — listagem de serviços.
 *
 * Shell estático: renderiza imediatamente o layout fixo (header + área de lista).
 * Os dados são buscados pelo ServiceList internamente via fetch client-side,
 * o que elimina o atraso de navegação percebido pelo usuário.
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { ServiceList } from "@/features/services/components/service-list";

export default function AdminServicosPage() {
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

      {/* ── Lista (Client Component, busca e gerencia dados internamente) ── */}
      <div className="mt-3 flex-1 overflow-y-auto px-5 pb-4">
        <ServiceList />
      </div>
    </div>
  );
}
