"use server";

import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateInquiryStatus(
  inquiryId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validStatuses = ["new", "reviewed", "contacted", "closed"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    await db.inquiry.update({
      where: { id: inquiryId },
      data: { status },
    });

    revalidatePath("/inquiries");
    return { success: true };
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return { success: false, error: "Failed to update inquiry" };
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin role
    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return { success: false, error: "You cannot delete your own account" };
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Delete user — all related records cascade via schema rules
    await db.user.delete({
      where: { id: userId },
    });

    console.log(
      `[ADMIN] User deleted by ${session.user.id}: ${targetUser.email} (${targetUser.name})`
    );

    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin role
    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return { success: false, error: "Invalid role" };
    }

    // Prevent self-demotion
    if (userId === session.user.id && role !== "ADMIN") {
      return { success: false, error: "Cannot change your own role" };
    }

    await db.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update role" };
  }
}
