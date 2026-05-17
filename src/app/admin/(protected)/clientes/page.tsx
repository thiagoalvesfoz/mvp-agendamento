/**
 * /admin/clientes — listagem de clientes ativos.
 *
 * Shell estático: renderiza imediatamente o layout fixo (header).
 * Os dados são buscados pelo CustomerList internamente via fetch client-side,
 * o que elimina o atraso de navegação percebido pelo usuário.
 *
 * Clientes anonimizados são excluídos pela query — permanecem no banco como
 * soft delete (anonymizedAt não nulo) e aparecem apenas no histórico de
 * agendamentos antigos.
 */
import { CustomerList } from "@/features/customers/components/customer-list";

export default function AdminClientesPage() {
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-2 pt-6">
        <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          Clientes
        </p>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Lista única</h1>
      </div>

      {/* ── Busca + Lista (Client Component, busca e gerencia dados internamente) ── */}
      <CustomerList />
    </div>
  );
}
