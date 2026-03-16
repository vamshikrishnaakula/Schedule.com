import { Prisma } from "./client";
import { prisma } from "./index";

export async function isPrismaAvailableCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw<unknown[]>(Prisma.sql`SELECT 1`);
    await prisma.$disconnect();
    return true;
  } catch (_e: unknown) {
    // If Prisma can't establish a connection we treat it as unavailable.
    // This is useful in CI and build pipelines where a database may not be reachable.
    return false;
  }
}
