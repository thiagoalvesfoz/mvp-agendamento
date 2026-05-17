"use server";

import { getAvailableSlotsForDate } from "./queries";
import { getSettings } from "@/features/settings/queries";

/**
 * Versão sem regras — usada no fluxo admin, que pode criar agendamentos
 * manualmente sem respeitar antecedência mínima / limite máximo.
 */
export async function getSlotsAction(serviceId: string, dateIso: string): Promise<string[]> {
  return getAvailableSlotsForDate(serviceId, dateIso);
}

/**
 * Versão pública — aplica as regras configuradas em Settings (antecedência
 * mínima e limite máximo no futuro). Settings é fonte da verdade no servidor:
 * o cliente nunca envia esses valores.
 */
export async function getPublicSlotsAction(serviceId: string, dateIso: string): Promise<string[]> {
  const settings = await getSettings();
  return getAvailableSlotsForDate(serviceId, dateIso, {
    minNoticeHours: settings.minimumScheduleNoticeHours,
    maxDaysAhead: settings.maximumScheduleDaysAhead,
  });
}
