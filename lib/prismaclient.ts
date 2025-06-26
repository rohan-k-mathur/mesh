import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const datasourceUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("pgbouncer=false", "pgbouncer=true")
  : undefined;

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ datasourceUrl });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

