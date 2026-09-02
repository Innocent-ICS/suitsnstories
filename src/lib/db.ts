import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = withPrismaConnectionSettings(process.env.DATABASE_URL);

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

export function withPrismaConnectionSettings(databaseUrl?: string) {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);

    if (isSupabasePooler(url) && url.port === "5432" && process.env.DATABASE_POOLING_MODE !== "session") {
      url.port = "6543";
    }

    if (isSupabasePooler(url) && url.port === "6543" && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }

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

function isSupabasePooler(url: URL) {
  return url.hostname.endsWith(".pooler.supabase.com");
}
