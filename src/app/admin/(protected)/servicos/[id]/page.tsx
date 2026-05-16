/**
 * /admin/servicos/[id] — editor de serviço existente.
 *
 * Server Component: busca o serviço via DAL e o passa para ServiceForm.
 * Retorna 404 se não encontrado (incluindo IDs de serviços deletados/inválidos).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { getServiceById } from "@/features/services/queries";
import { ServiceForm } from "@/features/services/components/service-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminServicoEditarPage({ params }: PageProps) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) notFound();

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
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
            Editar serviço
          </p>
          <h1 className="truncate text-[20px] font-semibold leading-tight tracking-tight">
            {service.name}
          </h1>
        </div>
      </div>

      <ServiceForm service={service} />
    </div>
  );
}
