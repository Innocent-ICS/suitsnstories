/**
 * Shared auth types for the Suits & Stories platform.
 * These extend NextAuth types and mirror the Prisma UserRole enum.
 */

/** Mirrors the Prisma UserRole enum */
export type UserRole = "CLIENT" | "COACH" | "PERCEPTION_ENGINEER" | "PROGRAM_MANAGER" | "ADMIN";

/** User profile data (mirrors Prisma Profile model) */
export interface UserProfile {
  id: string;
  userId: string;
  bio: string | null;
  company: string | null;
  industry: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  timezone: string | null;
}

/** Extended user type used across the platform */
export interface PlatformUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  image: string | null;
  profile: UserProfile | null;
}

/** Route access configuration */
export const ROLE_ACCESS = {
  platform: ["CLIENT", "COACH", "PERCEPTION_ENGINEER", "PROGRAM_MANAGER", "ADMIN"] as UserRole[],
  admin: ["ADMIN"] as UserRole[],
  coaching: ["COACH", "ADMIN"] as UserRole[],
  engineering: ["PERCEPTION_ENGINEER", "ADMIN"] as UserRole[],
  programs: ["PROGRAM_MANAGER", "ADMIN"] as UserRole[],
} as const;

/** Check if a user has access to a specific area */
export function hasAccess(userRole: UserRole, area: keyof typeof ROLE_ACCESS): boolean {
  return ROLE_ACCESS[area].includes(userRole);
}
