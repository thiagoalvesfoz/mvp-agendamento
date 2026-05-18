import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/features/settings/queries";
import { combineDateAndTimeInTZ } from "@/lib/time";
import { log } from "@/lib/logger";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Valida o token do cron — rejeita chamadas não autorizadas
  const auth = request.headers.get("authorization");
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  const expirationHours = settings.pendingExpirationHours ?? 24;

  // Busca PENDING cujo horário de início + janela de expiração já passou
  const pending = await db.appointment.findMany({
    where: { status: "PENDING" },
    select: { id: true, date: true, startTime: true },
  });

  const now = new Date();
  const toExpire = pending.filter((appt) => {
    const slotStart = combineDateAndTimeInTZ(appt.date.toISOString().slice(0, 10), appt.startTime);
    const expiresAt = new Date(slotStart.getTime() + expirationHours * 60 * 60 * 1000);
    return now >= expiresAt;
  });

  if (toExpire.length === 0) {
    log.info({ checked: pending.length }, "Nenhum agendamento pendente para expirar");
    return NextResponse.json({ expired: 0 });
  }

  const ids = toExpire.map((a) => a.id);

  try {
    await db.$transaction([
      db.appointment.updateMany({
        where: { id: { in: ids } },
        data: { status: "EXPIRED" },
      }),
      db.appointmentHistory.createMany({
        data: ids.map((appointmentId) => ({
          appointmentId,
          eventType: "status_change",
          statusFrom: "PENDING",
          statusTo: "EXPIRED",
          changedBy: "system",
          reason: `Expirado automaticamente após ${expirationHours}h`,
        })),
      }),
    ]);
  } catch (err) {
    log.error({ err, ids }, "Falha ao expirar agendamentos pendentes");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  log.info({ expired: ids.length, ids }, `${ids.length} agendamento(s) expirado(s) com sucesso`);

  return NextResponse.json({ expired: ids.length });
}
