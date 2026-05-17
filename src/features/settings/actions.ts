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
  uploadCoverSchema,
} from "@/features/settings/schemas";

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

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

  await db.settings.update({ where: { id: 1 }, data: parsed.data });

  revalidatePath("/admin/ajustes/landing");
  revalidatePath("/");
  return { ok: true };
}

// ── Landing — upload de capa ─────────────────────────────────────────────────

/**
 * Detecta o formato real a partir dos primeiros bytes do arquivo.
 * Defesa contra renomeação de extensão / mime forjado pelo cliente.
 */
function detectImageFormat(buf: Buffer): "jpeg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "png";
  // WebP: "RIFF"....."WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "webp";
  return null;
}

export async function uploadLandingCover(formData: FormData): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const file = formData.get("file");
  const parsed = uploadCoverSchema.safeParse({ file });
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Arquivo inválido";
    return { ok: false, error: first };
  }

  const raw = Buffer.from(await parsed.data.file.arrayBuffer());

  const format = detectImageFormat(raw);
  if (!format) {
    return { ok: false, error: "Arquivo não é uma imagem JPG, PNG ou WebP válida" };
  }

  // Import dinâmico para isolar o binário nativo do bundling do server bundle inicial.
  const sharp = (await import("sharp")).default;

  let optimized: Buffer;
  try {
    optimized = await sharp(raw)
      .rotate() // respeita EXIF
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { ok: false, error: "Falha ao processar a imagem" };
  }

  // Prisma tipa Bytes como Uint8Array<ArrayBuffer>; Buffer do Node é
  // Uint8Array<ArrayBufferLike>. Conversão é zero-copy.
  const bytes = new Uint8Array(optimized);

  await db.landingCover.upsert({
    where: { id: 1 },
    create: { id: 1, data: bytes, mimeType: "image/webp" },
    update: { data: bytes, mimeType: "image/webp" },
  });

  revalidatePath("/admin/ajustes/landing");
  revalidatePath("/");
  return { ok: true };
}

export async function removeLandingCover(): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  await db.landingCover.deleteMany({ where: { id: 1 } });

  revalidatePath("/admin/ajustes/landing");
  revalidatePath("/");
  return { ok: true };
}

// ── Email — teste de envio ────────────────────────────────────────────────────

export async function sendTestEmail(): Promise<ActionResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;

  const { sendEmail } = await import("@/lib/email/send");
  const { isEmailEnabled } = await import("@/lib/email/client");

  if (!isEmailEnabled) {
    return { ok: false, error: "Email não configurado. Verifique RESEND_API_KEY e EMAIL_FROM." };
  }

  const settings = await db.settings.findUniqueOrThrow({ where: { id: 1 } });
  const { EmailTest } = await import("@/lib/email/templates/email-test");

  await sendEmail({
    to: settings.notificationEmail,
    subject: "Teste de email — Agenda",
    react: EmailTest({ adminEmail: settings.notificationEmail }),
    tag: "settings.test",
  });

  return { ok: true };
}
