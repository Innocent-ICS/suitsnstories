/**
 * Production Database Cleanup Script
 *
 * Removes all users EXCEPT ifchikwanda@gmail.com, promotes that user to ADMIN,
 * and resets their password to a known value. Also clears stale sessions.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." npx tsx scripts/cleanup-users.ts
 *
 * Or if your .env.local already points at production:
 *   npx tsx scripts/cleanup-users.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const KEEP_EMAIL = "ifchikwanda@gmail.com";
const DEFAULT_PASSWORD = "rossAn-tofkoj-qoqne8";

async function main() {
  const db = new PrismaClient();

  try {
    console.log("Connecting to database...");
    console.log(`Database: ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@") || "(from env)"}\n`);

    // 1. Find or create the admin user
    let admin = await db.user.findUnique({ where: { email: KEEP_EMAIL } });

    if (!admin) {
      console.log(`User ${KEEP_EMAIL} not found. Creating...`);
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      admin = await db.user.create({
        data: {
          name: "Innocent Chikwanda",
          email: KEEP_EMAIL,
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log(`✅ Created admin user ${KEEP_EMAIL} (id: ${admin.id})\n`);
    } else {
      console.log(`✅ Found admin user: ${admin.email} (id: ${admin.id})\n`);
    }

    // 2. List users to remove
    const usersToRemove = await db.user.findMany({
      where: { email: { not: KEEP_EMAIL } },
      select: { id: true, email: true, name: true },
    });

    console.log(`Users to remove: ${usersToRemove.length}`);
    for (const user of usersToRemove) {
      console.log(`  - ${user.email || "(no email)"} — ${user.name || "(no name)"}`);
    }

    // 3. Delete non-admin users one-by-one (Prisma cascade handles related records)
    for (const user of usersToRemove) {
      await db.user.delete({ where: { id: user.id } });
    }
    if (usersToRemove.length > 0) {
      console.log(`✅ Deleted ${usersToRemove.length} user(s) and their related data.\n`);
    }

    // 4. Reset admin password and ensure ADMIN role
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await db.user.update({
      where: { email: KEEP_EMAIL },
      data: {
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log(`✅ Admin user updated:`);
    console.log(`  - Role: ADMIN`);
    console.log(`  - Password: reset to provided default\n`);

    // 5. Clear ALL sessions (stale JWTs signed with old AUTH_SECRET cause "Server error")
    const deletedSessions = await db.session.deleteMany({});
    console.log(`✅ Cleared ${deletedSessions.count} stale session(s).`);

    // 6. Clear orphaned accounts (OAuth accounts linked from dev environment)
    const adminAccounts = await db.account.findMany({ where: { userId: admin.id } });
    const orphanedAccounts = await db.account.deleteMany({
      where: { userId: { not: admin.id } },
    });
    if (orphanedAccounts.count > 0) {
      console.log(`✅ Cleared ${orphanedAccounts.count} orphaned OAuth account(s).`);
    }
    console.log(`  Admin has ${adminAccounts.length} linked OAuth account(s).\n`);

    // 7. Summary
    const remaining = await db.user.findMany({
      select: { id: true, email: true, role: true, name: true },
    });
    console.log("--- Remaining users ---");
    for (const user of remaining) {
      console.log(`  ${user.email} — ${user.role} — ${user.name || "(no name)"}`);
    }
    console.log(`\n✅ Cleanup complete! You can now sign in at your production URL.`);
    console.log(`   Email: ${KEEP_EMAIL}`);
    console.log(`   Password: (the one you provided)`);
    console.log(`\n⚠️  Remember to change this password after first login!`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
