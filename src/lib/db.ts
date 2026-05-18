import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  return prisma.$extends({
    query: {
      customer: {
        // Injeta anonymizedAt: null em todas as listagens.
        // Caller pode sobrescrever explicitamente passando anonymizedAt no where.
        async findMany({ args, query }) {
          args.where = { anonymizedAt: null, ...args.where };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { anonymizedAt: null, ...args.where };
          return query(args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
