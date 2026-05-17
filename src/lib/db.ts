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
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
