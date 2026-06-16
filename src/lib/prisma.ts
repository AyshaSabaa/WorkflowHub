import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    console.error("[prisma] DATABASE_URL is not set at runtime");
  } else if (!process.env.DATABASE_URL.startsWith("mongodb")) {
    console.error("[prisma] DATABASE_URL is not MongoDB — got protocol:", process.env.DATABASE_URL.split(":")[0]);
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse client across hot reloads (dev) and warm serverless invocations (Vercel).
globalForPrisma.prisma = prisma;
