"use server";

import * as z from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";

const RecommendationSchema = z.object({
  text: z
    .string()
    .trim()
    .min(40, "Please share at least 40 characters so the recommendation has useful context.")
    .max(1000, "Recommendations must stay under 1,000 characters."),
  stars: z.coerce.number().int().min(1).max(5),
  role: z.string().trim().max(120, "Role must stay under 120 characters.").optional(),
});

const ReviewSchema = z.object({
  recommendationId: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export type RecommendationFormData = z.infer<typeof RecommendationSchema>;

export interface RecommendationActionResult {
  success: boolean;
  error?: string;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" as const };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Unauthorized" as const };
  }

  return { userId: session.user.id };
}

export async function submitRecommendation(
  data: RecommendationFormData
): Promise<RecommendationActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Please sign in before submitting a recommendation." };
    }

    const validated = RecommendationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((issue) => issue.message).join(" "),
      };
    }

    await db.recommendation.create({
      data: {
        userId: session.user.id,
        text: validated.data.text,
        stars: validated.data.stars,
        role: validated.data.role || null,
      },
    });

    revalidatePath("/recommendations");
    revalidatePath("/recommendations-admin");

    return { success: true };
  } catch (error) {
    console.error("Error submitting recommendation:", error);
    return { success: false, error: "Could not submit your recommendation. Please try again." };
  }
}

export async function reviewRecommendation(
  recommendationId: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
): Promise<RecommendationActionResult> {
  try {
    const admin = await requireAdmin();
    if ("error" in admin) {
      return { success: false, error: admin.error };
    }

    const validated = ReviewSchema.safeParse({ recommendationId, status });
    if (!validated.success) {
      return { success: false, error: "Invalid recommendation review action." };
    }

    await db.recommendation.update({
      where: { id: validated.data.recommendationId },
      data: {
        status: validated.data.status,
        reviewedAt: validated.data.status === "PENDING" ? null : new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/recommendations");
    revalidatePath("/recommendations-admin");
    revalidateTag("marketing-recommendations", "max");

    return { success: true };
  } catch (error) {
    console.error("Error reviewing recommendation:", error);
    return { success: false, error: "Could not update recommendation review state." };
  }
}

export async function toggleRecommendationFeatured(
  recommendationId: string,
  featured: boolean
): Promise<RecommendationActionResult> {
  try {
    const admin = await requireAdmin();
    if ("error" in admin) {
      return { success: false, error: admin.error };
    }

    await db.recommendation.update({
      where: { id: recommendationId },
      data: { featured },
    });

    revalidatePath("/");
    revalidatePath("/recommendations-admin");
    revalidateTag("marketing-recommendations", "max");

    return { success: true };
  } catch (error) {
    console.error("Error featuring recommendation:", error);
    return { success: false, error: "Could not update featured state." };
  }
}
