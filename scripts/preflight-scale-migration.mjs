#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const databaseUrl = withScaleSafeConnectionSettings(process.env.DATABASE_URL);
const prisma = new PrismaClient(
  databaseUrl
    ? {
        datasources: {
          db: { url: databaseUrl },
        },
      }
    : undefined,
);

function withScaleSafeConnectionSettings(databaseUrl) {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);

    if (
      url.hostname.endsWith(".pooler.supabase.com") &&
      url.port === "5432" &&
      process.env.DATABASE_POOLING_MODE !== "session"
    ) {
      url.port = "6543";
    }

    if (
      url.hostname.endsWith(".pooler.supabase.com") &&
      url.port === "6543" &&
      !url.searchParams.has("pgbouncer")
    ) {
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

function printRows(title, rows) {
  if (rows.length === 0) {
    console.log(`PASS ${title}`);
    return false;
  }

  console.error(`FAIL ${title}`);
  console.table(
    rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          value instanceof Date ? value.toISOString() : value,
        ]),
      ),
    ),
  );
  return true;
}

async function main() {
  const [
    duplicateProviderReferences,
    duplicateBookingPayments,
    invalidBookingRanges,
    overlappingActiveBookings,
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        provider,
        "providerRef",
        COUNT(*)::integer AS count
      FROM "Payment"
      WHERE "providerRef" IS NOT NULL
      GROUP BY provider, "providerRef"
      HAVING COUNT(*) > 1
      ORDER BY count DESC, provider ASC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT
        "paymentId",
        COUNT(*)::integer AS count
      FROM "Booking"
      WHERE "paymentId" IS NOT NULL
      GROUP BY "paymentId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT
        id,
        "coachId",
        "startTime",
        "endTime",
        status
      FROM "Booking"
      WHERE "endTime" <= "startTime"
      ORDER BY "startTime" ASC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT
        b1.id AS "bookingAId",
        b2.id AS "bookingBId",
        b1."coachId",
        b1."startTime" AS "bookingAStartTime",
        b1."endTime" AS "bookingAEndTime",
        b2."startTime" AS "bookingBStartTime",
        b2."endTime" AS "bookingBEndTime"
      FROM "Booking" b1
      INNER JOIN "Booking" b2
        ON b1.id < b2.id
        AND b1."coachId" = b2."coachId"
        AND b1.status IN ('PENDING', 'CONFIRMED')
        AND b2.status IN ('PENDING', 'CONFIRMED')
        AND b1."startTime" < b2."endTime"
        AND b1."endTime" > b2."startTime"
      ORDER BY b1."startTime" ASC
      LIMIT 20
    `,
  ]);

  const failed = [
    printRows("unique Payment(provider, providerRef)", duplicateProviderReferences),
    printRows("unique Booking(paymentId)", duplicateBookingPayments),
    printRows("valid Booking time ranges", invalidBookingRanges),
    printRows("no active overlapping Booking ranges per coach", overlappingActiveBookings),
  ].some(Boolean);

  if (failed) {
    console.error(
      "Scale migration preflight failed. Resolve the rows above before applying or relying on prisma/migrations/20260901000000_scale_safety_indexes.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Scale migration preflight passed. Scale safety invariants are clean.");
}

try {
  await main();
} catch (error) {
  console.error("Scale migration preflight errored.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
