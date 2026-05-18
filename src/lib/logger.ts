import "server-only";
import pino from "pino";
import * as Sentry from "@sentry/nextjs";

const pinoLogger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: { env: process.env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});

type LogContext = Record<string, unknown>;

/**
 * Logger estruturado (pino) com integração ao Sentry.
 *
 * - info / warn: só loga em stdout (JSON estruturado → capturado pelo Vercel Logs)
 * - error: loga em stdout + envia exceção ao Sentry automaticamente
 *
 * Uso:
 *   log.info({ appointmentId, protocol }, "appointment.created");
 *   log.error({ err, serviceId }, "createAppointment failed");
 */
export const log = {
  debug: (ctx: LogContext, msg: string) => pinoLogger.debug(ctx, msg),
  info: (ctx: LogContext, msg: string) => pinoLogger.info(ctx, msg),
  warn: (ctx: LogContext, msg: string) => pinoLogger.warn(ctx, msg),
  error: (ctx: LogContext & { err?: unknown }, msg: string) => {
    pinoLogger.error(ctx, msg);
    if (ctx.err) {
      Sentry.captureException(ctx.err, { extra: { msg, ...ctx } });
    }
  },
};
