"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  initializeTransaction,
  verifyTransaction,
  generateReference,
} from "@/lib/paystack";

// ── Auth ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// ── Initialize Payment for Course ──────────────────────────────────────

export async function initCoursePayment(courseId: string) {
  const userId = await requireAuth();

  const [user, course] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
    db.course.findUnique({ where: { id: courseId, status: "PUBLISHED" } }),
  ]);

  if (!user?.email) return { success: false, error: "Email required" };
  if (!course) return { success: false, error: "Course not found" };
  if (course.price === 0) return { success: false, error: "Course is free" };

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return { success: false, error: "Already enrolled" };

  const reference = generateReference("course");

  // Create pending payment record
  const payment = await db.payment.create({
    data: {
      userId,
      amount: course.price,
      currency: course.currency,
      provider: "paystack",
      providerRef: reference,
      providerData: {
        type: "course_enrollment",
        courseId: course.id,
        courseTitle: course.title,
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const tx = await initializeTransaction({
      email: user.email,
      amount: course.price, // already in cents
      reference,
      callbackUrl: `${baseUrl}/api/payment/verify?ref=${reference}`,
      metadata: {
        payment_id: payment.id,
        type: "course_enrollment",
        course_id: courseId,
        user_id: userId,
      },
    });

    return { success: true, paymentUrl: tx.authorization_url };
  } catch (error: any) {
    // Clean up the pending payment
    await db.payment.delete({ where: { id: payment.id } });
    return { success: false, error: error.message || "Payment init failed" };
  }
}

// ── Initialize Payment for Booking ─────────────────────────────────────

export async function initBookingPayment(
  serviceId: string,
  coachId: string,
  startTime: string,
  notes?: string
) {
  const userId = await requireAuth();

  const [user, service] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
    db.serviceOffering.findUnique({ where: { id: serviceId } }),
  ]);

  if (!user?.email) return { success: false, error: "Email required" };
  if (!service || !service.isActive) return { success: false, error: "Service not available" };
  if (service.price === 0) return { success: false, error: "Service is free" };

  const reference = generateReference("booking");
  const start = new Date(startTime);
  const end = new Date(start.getTime() + service.duration * 60 * 1000);

  const payment = await db.payment.create({
    data: {
      userId,
      amount: service.price,
      currency: service.currency,
      provider: "paystack",
      providerRef: reference,
      providerData: {
        type: "booking",
        serviceId: service.id,
        serviceTitle: service.title,
        coachId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: notes || null,
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const tx = await initializeTransaction({
      email: user.email,
      amount: service.price,
      reference,
      callbackUrl: `${baseUrl}/api/payment/verify?ref=${reference}`,
      metadata: {
        payment_id: payment.id,
        type: "booking",
        service_id: serviceId,
        coach_id: coachId,
        user_id: userId,
      },
    });

    return { success: true, paymentUrl: tx.authorization_url };
  } catch (error: any) {
    await db.payment.delete({ where: { id: payment.id } });
    return { success: false, error: error.message || "Payment init failed" };
  }
}

// ── Fulfill Payment (called after verification) ────────────────────────

export async function fulfillPayment(reference: string) {
  const payment = await db.payment.findFirst({
    where: { providerRef: reference },
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.status === "SUCCESS") return { success: true, alreadyFulfilled: true };

  // Verify with PayStack
  const tx = await verifyTransaction(reference);

  if (tx.status !== "success") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", providerData: tx as any },
    });
    return { success: false, error: "Payment not successful" };
  }

  // Mark payment as complete
  await db.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", providerData: tx as any },
  });

  // Fulfill based on type
  const meta = payment.providerData as any;

  if (meta?.type === "course_enrollment") {
    await db.enrollment.create({
      data: {
        userId: payment.userId,
        courseId: meta.courseId,
        paymentId: payment.id,
      },
    });
    revalidatePath("/learn");
  }

  if (meta?.type === "booking") {
    // Check for conflicts first
    const conflict = await db.booking.findFirst({
      where: {
        coachId: meta.coachId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: new Date(meta.endTime) },
        endTime: { gt: new Date(meta.startTime) },
      },
    });

    if (conflict) {
      // Refund would go here — for now mark as needs attention
      return { success: false, error: "Time slot no longer available — refund pending" };
    }

    await db.booking.create({
      data: {
        clientId: payment.userId,
        coachId: meta.coachId,
        serviceId: meta.serviceId,
        startTime: new Date(meta.startTime),
        endTime: new Date(meta.endTime),
        notes: meta.notes,
        status: "CONFIRMED",
        paymentId: payment.id,
      },
    });
    revalidatePath("/bookings");
  }

  return { success: true };
}
