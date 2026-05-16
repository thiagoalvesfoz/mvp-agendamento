import { z } from "zod";

// Mínimo de 15 min; steppers trabalham em múltiplos de 15.
const durationField = z
  .number({ invalid_type_error: "Informe um número" })
  .int()
  .min(15, "Mínimo 15 minutos")
  .multipleOf(15, "Deve ser múltiplo de 15");

const bufferField = z
  .number({ invalid_type_error: "Informe um número" })
  .int()
  .min(0, "Não pode ser negativo")
  .multipleOf(15, "Deve ser múltiplo de 15");

export const createServiceSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  durationMinutes: durationField,
  bufferPreMinutes: bufferField,
  bufferPosMinutes: bufferField,
});

export const updateServiceSchema = createServiceSchema.extend({
  active: z.boolean(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
