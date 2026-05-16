/**
 * /admin/ajustes/bloqueios — listagem e criação de bloqueios.
 *
 * Server Component: carrega datas bloqueadas e bloqueios recorrentes.
 * BlocksPageClient (Client) renderiza header, lista e sheet de criação.
 */
import { listBlockedDates, listRecurringBlocks } from "@/features/settings/queries";
import { BlocksPageClient } from "@/features/settings/components/blocks-page-client";

export default async function BloqueiosPage() {
  const [blockedDates, recurringBlocks] = await Promise.all([
    listBlockedDates(),
    listRecurringBlocks(),
  ]);

  return <BlocksPageClient blockedDates={blockedDates} recurringBlocks={recurringBlocks} />;
}
