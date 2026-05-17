import { z } from "zod";

// ── Helpers compartilhados ────────────────────────────────────────────────────

const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Formato HH:MM inválido")
  .refine((v) => {
    const parts = v.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, "Horário inválido");

const positiveInt = (msg = "Deve ser maior que zero") =>
  z.number({ invalid_type_error: "Informe um número" }).int().positive(msg);

// ── Disponibilidade ───────────────────────────────────────────────────────────

const intervalSchema = z
  .object({
    startTime: timeField,
    endTime: timeField,
  })
  .refine(({ startTime, endTime }) => startTime < endTime, {
    message: "Fim deve ser após o início",
    path: ["endTime"],
  });

const dayAvailabilitySchema = z.object({
  weekDay: z.number().int().min(0).max(6),
  /** open=false significa "fechado nesse dia" — nenhum intervalo salvo. */
  open: z.boolean(),
  intervals: z.array(intervalSchema),
});

/**
 * Valida a disponibilidade semanal inteira.
 * Superrefine garante que não há sobreposição de intervalos no mesmo dia.
 */
export const saveAvailabilitySchema = z.array(dayAvailabilitySchema).superRefine((days, ctx) => {
  days.forEach((day, dayIdx) => {
    if (!day.open || day.intervals.length <= 1) return;

    // Ordena por startTime e verifica sobreposição entre consecutivos
    const sorted = [...day.intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]!;
      const next = sorted[i + 1]!;
      if (current.endTime > next.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Intervalos sobrepostos no dia (${current.endTime} > ${next.startTime})`,
          path: [dayIdx, "intervals"],
        });
      }
    }
  });
});

export type SaveAvailabilityInput = z.infer<typeof saveAvailabilitySchema>;
export type DayAvailability = z.infer<typeof dayAvailabilitySchema>;
export type TimeInterval = z.infer<typeof intervalSchema>;

// ── BlockedDate ───────────────────────────────────────────────────────────────

export const createBlockedDateSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato YYYY-MM-DD"),
    startTime: timeField.optional().or(z.literal("")),
    endTime: timeField.optional().or(z.literal("")),
    reason: z.string().max(200, "Motivo muito longo").optional().or(z.literal("")),
  })
  .refine(
    ({ startTime, endTime }) => {
      if (!startTime || !endTime) return true;
      return startTime < endTime;
    },
    { message: "Fim deve ser após o início", path: ["endTime"] },
  );

export type CreateBlockedDateInput = z.infer<typeof createBlockedDateSchema>;

// ── RecurringBlock ────────────────────────────────────────────────────────────

const recurringBaseSchema = z.object({
  pattern: z.enum(["weekly", "yearly"]),
  startTime: timeField.optional().or(z.literal("")),
  endTime: timeField.optional().or(z.literal("")),
  reason: z.string().max(200, "Motivo muito longo").optional().or(z.literal("")),
});

export const createRecurringBlockSchema = recurringBaseSchema
  .extend({
    weekDay: z.number().int().min(0).max(6).optional(),
    month: z.number().int().min(1).max(12).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.pattern === "weekly" && val.weekDay == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dia da semana obrigatório para bloqueio semanal",
        path: ["weekDay"],
      });
    }
    if (val.pattern === "yearly") {
      if (val.month == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mês obrigatório para bloqueio anual",
          path: ["month"],
        });
      }
      if (val.dayOfMonth == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dia do mês obrigatório para bloqueio anual",
          path: ["dayOfMonth"],
        });
      }
    }
    if (val.startTime && val.endTime && val.startTime >= val.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fim deve ser após o início",
        path: ["endTime"],
      });
    }
  });

export type CreateRecurringBlockInput = z.infer<typeof createRecurringBlockSchema>;

// ── Settings — regras gerais (antecedência, expiração, limite no futuro) ─────

export const updateRulesSchema = z.object({
  minimumScheduleNoticeHours: positiveInt("Antecedência mínima deve ser maior que zero"),
  maximumScheduleDaysAhead: positiveInt("Limite máximo deve ser maior que zero"),
  pendingExpirationHours: positiveInt("Expiração deve ser maior que zero"),
});

export type UpdateRulesInput = z.infer<typeof updateRulesSchema>;

// ── Settings — endereço público (slug) ───────────────────────────────────────

export const updatePublicSlugSchema = z.object({
  publicSlug: z
    .string()
    .min(3, "Slug muito curto")
    .max(60, "Slug muito longo")
    .regex(
      /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
      "Slug deve conter apenas letras minúsculas, números, hífens e underscores",
    ),
});

export type UpdatePublicSlugInput = z.infer<typeof updatePublicSlugSchema>;

// ── Settings — email de notificações ─────────────────────────────────────────

export const updateNotificationEmailSchema = z.object({
  notificationEmail: z.string().email("Email inválido"),
});

export type UpdateNotificationEmailInput = z.infer<typeof updateNotificationEmailSchema>;

// ── Settings — retenção LGPD ─────────────────────────────────────────────────

export const updateRetentionSchema = z.object({
  retentionMonths: positiveInt("Retenção deve ser maior que zero"),
});

export type UpdateRetentionInput = z.infer<typeof updateRetentionSchema>;

// ── Landing ───────────────────────────────────────────────────────────────────

export const updateLandingSchema = z.object({
  landingName: z.string().max(100, "Nome muito longo").optional().or(z.literal("")),
  landingTagline: z.string().max(200, "Tagline muito longa").optional().or(z.literal("")),
  landingHandle: z.string().max(100, "Handle muito longo").optional().or(z.literal("")),
  landingCity: z.string().max(100, "Cidade muito longa").optional().or(z.literal("")),
  landingAbout: z.string().max(1000, "Sobre muito longo").optional().or(z.literal("")),
  landingCallout: z.string().max(500, "Aviso muito longo").optional().or(z.literal("")),
  landingCoverLabel: z.string().max(100, "Legenda muito longa").optional().or(z.literal("")),
  landingCtaLabel: z.string().max(100, "Texto do botão muito longo").optional().or(z.literal("")),
});

export type UpdateLandingInput = z.infer<typeof updateLandingSchema>;

// ── Landing — upload de capa ─────────────────────────────────────────────────

export const LANDING_COVER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const LANDING_COVER_ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Valida o `File` recebido via FormData no Server Action.
 * Magic bytes são validados separadamente em `uploadLandingCover`,
 * pois o `type` do browser pode ser forjado.
 */
export const uploadCoverSchema = z.object({
  file: z
    .instanceof(File, { message: "Arquivo obrigatório" })
    .refine((f) => f.size > 0, "Arquivo vazio")
    .refine((f) => f.size <= LANDING_COVER_MAX_BYTES, "Imagem maior que 5 MB")
    .refine(
      (f) => (LANDING_COVER_ACCEPTED_MIME as readonly string[]).includes(f.type),
      "Formato inválido. Use JPG, PNG ou WebP",
    ),
});

export type UploadCoverInput = z.infer<typeof uploadCoverSchema>;
