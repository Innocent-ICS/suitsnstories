import { describe, expect, it } from "vitest";
import { getDefaultAvailabilityForDay } from "@/lib/booking-availability";
import { isBookableStaffRole } from "@/lib/booking-roles";

describe("booking availability defaults", () => {
  it("provides weekday default availability for bookable staff without seeded rows", () => {
    expect(getDefaultAvailabilityForDay(1)).toEqual([
      {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "Africa/Accra",
        isActive: true,
      },
    ]);
  });

  it("does not provide weekend fallback slots", () => {
    expect(getDefaultAvailabilityForDay(0)).toEqual([]);
    expect(getDefaultAvailabilityForDay(6)).toEqual([]);
  });

  it("treats staff roles with booking navigation as session leads", () => {
    expect(isBookableStaffRole("COACH")).toBe(true);
    expect(isBookableStaffRole("PERCEPTION_ENGINEER")).toBe(true);
    expect(isBookableStaffRole("PROGRAM_MANAGER")).toBe(true);
    expect(isBookableStaffRole("ADMIN")).toBe(true);
    expect(isBookableStaffRole("CLIENT")).toBe(false);
  });
});
