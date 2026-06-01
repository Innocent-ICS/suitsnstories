import type { UserRole } from "@/types/auth";

export const BOOKABLE_STAFF_ROLES = [
  "COACH",
  "PERCEPTION_ENGINEER",
  "PROGRAM_MANAGER",
  "ADMIN",
] as const satisfies readonly UserRole[];

export const DEFAULT_BOOKING_TIMEZONE = "Africa/Accra";

export type BookableStaffRole = (typeof BOOKABLE_STAFF_ROLES)[number];

export function getBookableStaffRoles(): UserRole[] {
  return [...BOOKABLE_STAFF_ROLES];
}

export function isBookableStaffRole(role: string | null | undefined): role is BookableStaffRole {
  return BOOKABLE_STAFF_ROLES.includes(role as BookableStaffRole);
}
