"use server";

/**
 * Server Actions chamadas a partir do cliente (autocomplete, busca).
 * Separadas de `actions.ts` para deixar claro que retornam dados
 * (não fazem mutações + revalidate).
 */
import { auth } from "@/lib/auth";
import { searchCustomersByName, type CustomerSuggestion } from "./queries";

/**
 * Busca clientes por nome (autocomplete do "Novo agendamento").
 *
 * Restrita a admin autenticado — não expõe lista de clientes publicamente.
 * Retorna lista vazia em caso de não-autenticado para não vazar o motivo.
 */
export async function searchCustomersAction(query: string): Promise<CustomerSuggestion[]> {
  const session = await auth();
  if (!session?.user?.email) return [];
  return searchCustomersByName(query);
}
