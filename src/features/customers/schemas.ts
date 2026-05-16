import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
