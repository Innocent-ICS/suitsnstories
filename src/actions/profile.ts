"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  bio: z.string().max(500).trim().optional(),
  company: z.string().max(100).trim().optional(),
  industry: z.string().max(100).trim().optional(),
  linkedinUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  timezone: z.string().max(50).trim().optional(),
});

export type ProfileFormData = z.infer<typeof ProfileSchema>;

export interface ProfileResult {
  success: boolean;
  error?: string;
}

export async function updateProfile(data: ProfileFormData): Promise<ProfileResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const validated = ProfileSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.issues.map((e) => e.message).join(", ");
      return { success: false, error: errors };
    }

    const { name, bio, company, industry, linkedinUrl, timezone } = validated.data;

    // Update user name
    await db.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    // Upsert profile
    await db.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bio: bio || null,
        company: company || null,
        industry: industry || null,
        linkedinUrl: linkedinUrl || null,
        timezone: timezone || null,
      },
      update: {
        bio: bio || null,
        company: company || null,
        industry: industry || null,
        linkedinUrl: linkedinUrl || null,
        timezone: timezone || null,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile. Please try again." };
  }
}
