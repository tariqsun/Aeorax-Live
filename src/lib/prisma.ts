import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let _schemaEnsured = false;

/**
 * Self-healing production schema synchronizer.
 * Ensures newly added columns exist in PostgreSQL without downtime.
 */
export async function ensureDatabaseSchema() {
  if (_schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "ramUsedGb" DOUBLE PRECISION DEFAULT 0');
    await prisma.$executeRawUnsafe('ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "diskUsedGb" DOUBLE PRECISION DEFAULT 0');
    await prisma.$executeRawUnsafe('ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "ramUsagePercent" DOUBLE PRECISION DEFAULT 0');
    await prisma.$executeRawUnsafe('ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "diskUsagePercent" DOUBLE PRECISION DEFAULT 0');
    await prisma.$executeRawUnsafe('ALTER TABLE "College" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT \'Standard College (8 Rooms)\'');
    await prisma.$executeRawUnsafe('ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "sharedSecret" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "sshPassword" TEXT');
    _schemaEnsured = true;
  } catch (err) {
    console.warn("Schema auto-heal warning:", err);
  }
}

