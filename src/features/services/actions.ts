"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createServiceSchema,
  updateServiceSchema,
  idParamSchema,
} from "@/features/services/schemas";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// Verifica sessão em todas as actions — não confiar só no middleware.
async function requireAuth(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Não autorizado" };
  return { ok: true };
}

export async function createService(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMinutes: Number(formData.get("durationMinutes")),
    bufferPreMinutes: Number(formData.get("bufferPreMinutes")),
    bufferPosMinutes: Number(formData.get("bufferPosMinutes")),
  };

  const parsed = createServiceSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { ok: false, error: first ?? "Dados inválidos" };
  }

  const service = await db.service.create({ data: parsed.data });
  revalidatePath("/admin/servicos");
  return { ok: true, data: { id: service.id } };
}

export async function updateService(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const idParsed = idParamSchema.safeParse({ id });
  if (!idParsed.success) return { ok: false, error: "ID inválido" };

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMinutes: Number(formData.get("durationMinutes")),
    bufferPreMinutes: Number(formData.get("bufferPreMinutes")),
    bufferPosMinutes: Number(formData.get("bufferPosMinutes")),
    // O formulário envia "true" ou "false" como string no FormData
    active: formData.get("active") === "true",
  };

  const parsed = updateServiceSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { ok: false, error: first ?? "Dados inválidos" };
  }

  await db.service.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/servicos");
  revalidatePath(`/admin/servicos/${id}`);
  return { ok: true };
}

/**
 * Soft delete: seta `active = false`.
 * Hard delete é proibido — agendamentos mantêm FK + snapshots (RN15).
 */
export async function deactivateService(id: string): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const idParsed = idParamSchema.safeParse({ id });
  if (!idParsed.success) return { ok: false, error: "ID inválido" };

  await db.service.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/servicos");
  revalidatePath(`/admin/servicos/${id}`);
  return { ok: true };
}
