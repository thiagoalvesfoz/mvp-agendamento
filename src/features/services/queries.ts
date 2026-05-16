/**
 * DAL (Data Access Layer) — serviços.
 *
 * Só leitura. Importar somente em Server Components / Server Actions.
 * Nunca re-exportar daqui instâncias do Prisma ou tipos não-serializáveis.
 */
import { db } from "@/lib/db";
import type { Service } from "@prisma/client";

export type ServiceRow = Pick<
  Service,
  | "id"
  | "name"
  | "description"
  | "durationMinutes"
  | "bufferPreMinutes"
  | "bufferPosMinutes"
  | "active"
  | "createdAt"
>;

interface ListServicesOptions {
  includeInactive?: boolean;
}

export async function listServices({ includeInactive = false }: ListServicesOptions = {}): Promise<
  ServiceRow[]
> {
  return db.service.findMany({
    where: includeInactive ? undefined : { active: true },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      bufferPreMinutes: true,
      bufferPosMinutes: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getServiceById(id: string): Promise<ServiceRow | null> {
  return db.service.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      bufferPreMinutes: true,
      bufferPosMinutes: true,
      active: true,
      createdAt: true,
    },
  });
}
