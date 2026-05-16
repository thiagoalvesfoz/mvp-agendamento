"use server";

/**
 * Server Actions — domínio de settings.
 *
 * Todas as actions verificam a sessão via auth() antes de qualquer mutação.
 * Retorno: { ok: true } | { ok: false; error: string }
 */
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  saveAvailabilitySchema,
  createBlockedDateSchema,
  createRecurringBlockSchema,
  updateRulesSchema,
  updatePublicSlugSchema,
  updateNotificationEmailSchema,
  updateRetentionSchema,
  updateLandingSchema,
} from "@/features/settings/schemas";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireAuth(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Não autorizado" };
  return { ok: true };
}

// ── Disponibilidade ───────────────────────────────────────────────────────────

/**
 * Substitui toda a disponibilidade semanal em uma transaction atômica.
 * Estratégia: deleteMany (todos os registros) + createMany (novos).
 * Dias com `open=false` não geram nenhum registro.
 */
export async function saveAvailability(payload: unknown): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = saveAvailabilitySchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const toCreate = parsed.data
    .filter((day) => day.open && day.intervals.length > 0)
    .flatMap((day) =>
      day.intervals.map((interval) => ({
        weekDay: day.weekDay,
        startTime: interval.startTime,
        endTime: interval.endTime,
      })),
    );

  await db.$transaction([
    db.availability.deleteMany({}),
    db.availability.createMany({ data: toCreate }),
  ]);

  revalidatePath("/admin/ajustes/disponibilidade");
  revalidatePath("/agendar");
  return { ok: true };
}

// ── BlockedDate ───────────────────────────────────────────────────────────────

export async function createBlockedDate(payload: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = createBlockedDateSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const { date, startTime, endTime, reason } = parsed.data;

  const record = await db.blockedDate.create({
    data: {
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    },
  });

  revalidatePath("/admin/ajustes/bloqueios");
  revalidatePath("/agendar");
  return { ok: true, data: { id: record.id } };
}

export async function deleteBlockedDate(id: string): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  if (!id) return { ok: false, error: "ID inválido" };

  await db.blockedDate.delete({ where: { id } });

  revalidatePath("/admin/ajustes/bloqueios");
  revalidatePath("/agendar");
  return { ok: true };
}

// ── RecurringBlock ────────────────────────────────────────────────────────────

export async function createRecurringBlock(
  payload: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = createRecurringBlockSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  const { pattern, weekDay, month, dayOfMonth, startTime, endTime, reason } = parsed.data;

  const record = await db.recurringBlock.create({
    data: {
      pattern,
      weekDay: weekDay ?? null,
      month: month ?? null,
      dayOfMonth: dayOfMonth ?? null,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    },
  });

  revalidatePath("/admin/ajustes/bloqueios");
  revalidatePath("/agendar");
  return { ok: true, data: { id: record.id } };
}

export async function deleteRecurringBlock(id: string): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  if (!id) return { ok: false, error: "ID inválido" };

  await db.recurringBlock.delete({ where: { id } });

  revalidatePath("/admin/ajustes/bloqueios");
  revalidatePath("/agendar");
  return { ok: true };
}

// ── Settings — regras gerais ─────────────────────────────────────────────────

export async function updateRules(payload: unknown): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateRulesSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  await db.settings.update({ where: { id: 1 }, data: parsed.data });

  revalidatePath("/admin/ajustes");
  revalidatePath("/admin/ajustes/regras");
  return { ok: true };
}

// ── Settings — endereço público (slug) ───────────────────────────────────────

export async function updatePublicSlug(payload: unknown): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updatePublicSlugSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  await db.settings.update({ where: { id: 1 }, data: parsed.data });

  revalidatePath("/admin/ajustes");
  revalidatePath("/admin/ajustes/endereco");
  // slug público afeta a landing
  revalidatePath("/");
  return { ok: true };
}

// ── Settings — email de notificações ─────────────────────────────────────────

export async function updateNotificationEmail(payload: unknown): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateNotificationEmailSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  await db.settings.update({ where: { id: 1 }, data: parsed.data });

  revalidatePath("/admin/ajustes");
  revalidatePath("/admin/ajustes/email");
  return { ok: true };
}

// ── Settings — retenção LGPD ─────────────────────────────────────────────────

export async function updateRetention(payload: unknown): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateRetentionSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  await db.settings.update({ where: { id: 1 }, data: parsed.data });

  revalidatePath("/admin/ajustes");
  revalidatePath("/admin/ajustes/retencao");
  return { ok: true };
}

// ── Landing ───────────────────────────────────────────────────────────────────

export async function updateLanding(payload: unknown): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const parsed = updateLandingSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return { ok: false, error: first };
  }

  // Cast necessário até o Prisma client ser regenerado após a migration landing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.settings.update as any)({ where: { id: 1 }, data: parsed.data });

  revalidatePath("/admin/ajustes/landing");
  revalidatePath("/");
  return { ok: true };
}
