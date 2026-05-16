/**
 * /admin/clientes — listagem de clientes ativos.
 *
 * Server Component: busca via DAL e passa dados serializáveis para o
 * CustomerList (Client Component que gerencia a busca local).
 *
 * Clientes anonimizados são excluídos da listagem — eles permanecem no banco
 * como soft delete (anonymizedAt não nulo) e aparecem apenas no histórico
 * de agendamentos antigos.
 */
import { listActiveCustomers } from "@/features/customers/queries";
import { CustomerList } from "@/features/customers/components/customer-list";

export default async function AdminClientesPage() {
  const customers = await listActiveCustomers();

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          Clientes
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Lista única</h1>
      </div>

      {/* ── Busca + Lista (Client Component, gerencia filtro) ── */}
      <CustomerList customers={customers} />
    </div>
  );
}
