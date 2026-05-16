/**
 * Cliente Prisma singleton.
 *
 * Em dev, o Next.js faz hot reload e cada reload criaria uma nova
 * conexão — esgotaria o pool em minutos. Usamos um global para
 * evitar isso. Em prod, é uma instância única por processo.
 *
 * Uso:
 *   import { db } from "@/lib/db";
 *   const user = await db.user.findUnique(...);
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
