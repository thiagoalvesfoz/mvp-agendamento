import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Cliente Resend singleton.
 *
 * `isEmailEnabled` é true apenas quando RESEND_API_KEY + EMAIL_FROM estão setados.
 * Em dev local sem essas variáveis, o sistema continua funcionando — apenas
 * loga no console em vez de enviar (ver `send.ts`).
 */

export const isEmailEnabled = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const EMAIL_FROM = env.EMAIL_FROM ?? "";
