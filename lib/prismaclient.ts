import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const datasourceUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("pgbouncer=false", "pgbouncer=true")
  : undefined;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : undefined
  );

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

void prisma.$connect();
// lib/prismaclient.ts
// import { PrismaClient } from '@prisma/client';

// // Augment the global scope so TS knows about __PRISMA__
// declare global {
//   // eslint-disable-next-line no-var
//   var __PRISMA__: PrismaClient | undefined;
// }

// // Build datasource URL (swap pgbouncer=false → true if present)
// const datasourceUrl = process.env.DATABASE_URL
//   ? process.env.DATABASE_URL.replace('pgbouncer=false', 'pgbouncer=true')
//   : undefined;


//   const prismaAny = (globalThis as any).__PRISMA__ as PrismaClient | undefined;

// // Create or reuse the client
// export const prisma: PrismaClient =
// prismaAny ??
//   new PrismaClient(
//     datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : undefined,
//   );

// // Cache in dev
// if (process.env.NODE_ENV !== 'production') {
//   globalThis.__PRISMA__ = prisma;
// }

// // Optional: eager connect (good for scripts)
// void prisma.$connect();