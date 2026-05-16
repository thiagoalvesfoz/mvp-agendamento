/**
 * /admin/clientes/[id] — detalhe de um cliente.
 *
 * Server Component. Busca os dados via DAL e passa para o CustomerDetail.
 * Em Next.js 15, `params` é uma Promise — precisa ser awaited.
 *
 * Retorna 404 se o cliente não existir ou já estiver anonimizado.
 */
import { notFound } from "next/navigation";
import { getCustomerById } from "@/features/customers/queries";
import { CustomerDetail } from "@/features/customers/components/customer-detail";
import { idParamSchema } from "@/features/customers/schemas";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClienteDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Valida formato UUID antes de bater no banco — evita query desnecessária
  const parsed = idParamSchema.safeParse({ id });
  if (!parsed.success) notFound();

  const customer = await getCustomerById(parsed.data.id);
  if (!customer) notFound();

  return <CustomerDetail customer={customer} />;
}
