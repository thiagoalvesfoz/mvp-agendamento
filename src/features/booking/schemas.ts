/**
 * Schemas Zod para o fluxo de agendamento.
 *
 * Servem dois papéis:
 *  1. Validação no Server Action (boundary entre client e backend)
 *  2. Tipos derivados para o cliente — usar `z.infer<typeof ...>`
 */
import { z } from "zod";

/** Telefone BR — aceita formato livre, normalização acontece no Server Action */
const phoneRegex = /^[\d\s()+\-.]{8,20}$/;

export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid("Serviço inválido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:mm)"),
  name: z.string().min(1, "Informe seu nome").max(120),
  phone: z.string().regex(phoneRegex, "Telefone inválido"),
  email: z.string().email("Email inválido").max(200).optional().or(z.literal("")),
  instagram: z.string().max(60).optional().or(z.literal("")),
  briefing: z.string().max(2000).optional().or(z.literal("")),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os termos" }),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
