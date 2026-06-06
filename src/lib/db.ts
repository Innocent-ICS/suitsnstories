import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = withConnectionLimit(process.env.DATABASE_URL);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined
  );

globalForPrisma.prisma = db;

function withConnectionLimit(databaseUrl?: string) {
  if (!databaseUrl || process.env.NODE_ENV !== "production") return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", process.env.DATABASE_CONNECTION_LIMIT || "1");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", process.env.DATABASE_POOL_TIMEOUT || "10");
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
}
