import "server-only";
import type { ReactElement } from "react";
import { resend, isEmailEnabled, EMAIL_FROM } from "./client";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
  /**
   * Tag livre pra correlacionar logs (ex.: "booking.pending.admin").
   * Aparece tanto no console quanto nos headers do Resend.
   */
  tag: string;
}

/**
 * Envia email via Resend.
 *
 * Contrato: NUNCA rejeita. Email é efeito colateral — falha apenas loga
 * e segue. Quem chama não precisa (e não deve) tratar erros aqui.
 *
 * Modos:
 *  - Habilitado (RESEND_API_KEY + EMAIL_FROM): envia de verdade.
 *  - EMAIL_DEV_MODE=true: redireciona TODO email para EMAIL_DEV_TO,
 *    mantendo subject/body. Útil pra testar com sandbox do Resend.
 *  - Desabilitado: loga e retorna. Dev local funciona sem chave.
 */
export async function sendEmail({ to, subject, react, tag }: SendEmailParams): Promise<void> {
  if (!isEmailEnabled || !resend) {
    log.info({ tag, to, subject }, "email.skipped");
    return;
  }

  let effectiveTo = to;
  if (env.EMAIL_DEV_MODE) {
    const { db } = await import("@/lib/db");
    const settings = await db.settings.findUnique({
      where: { id: 1 },
      select: { notificationEmail: true },
    });
    effectiveTo = settings?.notificationEmail ?? to;
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: effectiveTo,
      subject,
      react,
      headers: { "X-Email-Tag": tag },
    });

    if (result.error) {
      log.warn({ tag, to: effectiveTo, subject, error: result.error }, "email.resend_error");
      return;
    }

    log.info({ tag, to: effectiveTo, id: result.data?.id }, "email.sent");
  } catch (err) {
    log.error({ err, tag, to: effectiveTo, subject }, "email.exception");
  }
}
