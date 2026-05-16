/**
 * /admin/servicos/novo — criação de serviço.
 *
 * Server Component leve: apenas renderiza o header e entrega o formulário
 * Client Component sem dados pré-carregados.
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { ServiceForm } from "@/features/services/components/service-form";

export default function AdminServicosNovoPage() {
  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <Link
          href="/admin/servicos"
          className="press flex size-9 items-center justify-center rounded-xl text-[var(--muted-foreground)]"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={20} />
        </Link>
        <div>
          <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
            Novo serviço
          </p>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">Criar serviço</h1>
        </div>
      </div>

      <ServiceForm />
    </div>
  );
}
