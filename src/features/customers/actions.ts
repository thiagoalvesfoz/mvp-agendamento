"use server";

/**
 * Server Actions — domínio de clientes.
 *
 * anonymizeCustomer: implementa o direito à exclusão da LGPD (art. 18).
 * Não deleta o registro; aplica soft delete via anonymizedAt + zeragem de PII.
 * Snapshots dos agendamentos também são anonimizados (mesma transaction) para
 * preservar integridade fiscal sem expor dados pessoais.
 */
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { idParamSchema } from "@/features/customers/schemas";

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function requireAuth(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Não autorizado" };
  return { ok: true };
}

/**
 * Anonimiza um cliente e todos os snapshots dos seus agendamentos
 * em uma única transaction. Registra a operação no CustomerHistory.
 *
 * Regra de negócio (LGPD):
 * - O registro Customer permanece (soft delete via anonymizedAt).
 * - Nome, email, telefone e redes sociais do Customer são substituídos.
 * - Os snapshots nos Appointments têm os campos de PII zerados/substituídos,
 *   mas as datas, serviços e status são preservados para fins fiscais.
 */
export async function anonymizeCustomer(id: string): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const idParsed = idParamSchema.safeParse({ id });
  if (!idParsed.success) return { ok: false, error: "ID inválido" };

  // Verifica existência e evita re-anonimização
  const customer = await db.customer.findUnique({
    where: { id },
    select: { anonymizedAt: true, name: true },
  });

  if (!customer) return { ok: false, error: "Cliente não encontrado" };
  if (customer.anonymizedAt) return { ok: false, error: "Cliente já foi anonimizado" };

  const now = new Date();

  await db.$transaction([
    // 1. Anonimiza o registro do Cliente
    db.customer.update({
      where: { id },
      data: {
        anonymizedAt: now,
        name: "Cliente anônimo",
        email: null,
        socialMedia: null,
        // Mantém unicidade no campo unique sem expor o ID real na UI
        phone: `anonimizado-${id}`,
      },
    }),

    // 2. Anonimiza snapshots de todos os agendamentos deste cliente.
    //    Preserva datas, serviço, status — necessários para relatórios fiscais.
    db.appointment.updateMany({
      where: { customerId: id },
      data: {
        anonymizedAt: now,
        customerNameSnapshot: "Cliente anônimo",
        customerContactSnapshot: "anonimizado",
        customerEmailSnapshot: null,
        customerSocialMediaSnapshot: null,
      },
    }),

    // 3. Registra a operação no histórico do cliente para auditoria
    db.customerHistory.create({
      data: {
        customerId: id,
        field: "anonymization",
        oldValue: customer.name,
        newValue: "Cliente anônimo",
        changedAt: now,
      },
    }),
  ]);

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);

  return { ok: true };
}
