/**
 * Validação de variáveis de ambiente com Zod.
 *
 * Princípio: falhe RÁPIDO no boot — variáveis erradas/ausentes
 * devem quebrar o build, não causar bug em runtime.
 *
 * Uso:
 *   import { env } from "@/lib/env";
 *   const url = env.DATABASE_URL;
 */
import { z } from "zod";

const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET deve ter no mínimo 32 caracteres"),
    AUTH_TRUST_HOST: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    // Quando "true", redireciona TODO email para o notificationEmail configurado no painel.
    // Use em desenvolvimento para não spammar clientes reais. Em prod, deixe "false".
    EMAIL_DEV_MODE: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    CRON_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Contrato de email: ou tudo está vazio (no-op em dev), ou ambos
    // RESEND_API_KEY e EMAIL_FROM estão setados. Não deixe meio-termo —
    // habilita o serviço e depois descobre que falta o remetente.
    if (data.RESEND_API_KEY && !data.EMAIL_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EMAIL_FROM é obrigatório quando RESEND_API_KEY está definido",
        path: ["EMAIL_FROM"],
      });
    }
  });

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_DEV_MODE: process.env.EMAIL_DEV_MODE,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
};

const isServer = typeof window === "undefined";

// No client, só validamos o subset público — server vars seriam undefined no bundle.
const parsed = isServer
  ? z
      .object({
        ...clientSchema.shape,
      })
      .and(serverSchema)
      .safeParse(processEnv)
  : clientSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Variáveis de ambiente inválidas — confira .env");
}

type ServerEnv = z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

export const env = parsed.data as ServerEnv & ClientEnv;
