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

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET deve ter no mínimo 32 caracteres"),
  AUTH_TRUST_HOST: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_NOTIFICATION_TO: z.string().email().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_NOTIFICATION_TO: process.env.EMAIL_NOTIFICATION_TO,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
};

const isServer = typeof window === "undefined";

const merged = serverSchema.merge(clientSchema);
const parsed = isServer ? merged.safeParse(processEnv) : clientSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Variáveis de ambiente inválidas — confira .env");
}

export const env = parsed.data as z.infer<typeof merged>;
