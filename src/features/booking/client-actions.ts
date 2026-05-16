"use server";

import { getAvailableSlotsForDate } from "./queries";

/**
 * Wrapper Server Action para o stepper pedir slots de uma data quando o
 * cliente escolhe um dia diferente. Mantém a lógica pesada no servidor.
 */
export async function getSlotsAction(serviceId: string, dateIso: string): Promise<string[]> {
  return getAvailableSlotsForDate(serviceId, dateIso);
}
