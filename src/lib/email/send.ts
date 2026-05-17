import "server-only";
import type { ReactElement } from "react";
import { resend, isEmailEnabled, EMAIL_FROM } from "./client";
import { env } from "@/lib/env";

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
    console.info(`[email:${tag}] skipped (disabled) → to=${to} subject="${subject}"`);
    return;
  }

  const effectiveTo = env.EMAIL_DEV_MODE && env.EMAIL_DEV_TO ? env.EMAIL_DEV_TO : to;

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: effectiveTo,
      subject,
      react,
      headers: { "X-Email-Tag": tag },
    });

    if (result.error) {
      console.error(`[email:${tag}] resend error`, {
        to: effectiveTo,
        subject,
        error: result.error,
      });
      return;
    }

    console.info(`[email:${tag}] sent`, { to: effectiveTo, id: result.data?.id });
  } catch (err) {
    console.error(`[email:${tag}] exception`, {
      to: effectiveTo,
      subject,
      error: err instanceof Error ? err.message : err,
    });
  }
}
