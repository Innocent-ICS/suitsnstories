// Seed default availability for all coaches/admins
// Run: npx tsx scripts/seed-availability.ts

import { PrismaClient } from "@prisma/client";
import { DEFAULT_BOOKING_TIMEZONE, getBookableStaffRoles } from "../src/lib/booking-roles";

const db = new PrismaClient();

async function main() {
  const coaches = await db.user.findMany({
    where: { role: { in: getBookableStaffRoles() } },
    select: { id: true, name: true },
  });

  console.log(`Found ${coaches.length} coaches/admins`);

  for (const coach of coaches) {
    // Check existing
    const existing = await db.availability.count({ where: { coachId: coach.id } });
    if (existing > 0) {
      console.log(`  ${coach.name} already has ${existing} slots — skipping`);
      continue;
    }

    // Mon-Fri, 9am-5pm
    const slots = [1, 2, 3, 4, 5].map((day) => ({
      coachId: coach.id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "17:00",
      timezone: DEFAULT_BOOKING_TIMEZONE,
      isActive: true,
    }));

    await db.availability.createMany({ data: slots });
    console.log(`  ${coach.name} — added Mon-Fri 9am-5pm availability`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
