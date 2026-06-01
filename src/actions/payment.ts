"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import {
  initializeTransaction,
  verifyTransaction,
  generateReference,
} from "@/lib/paystack";
import { fulfillAcceleratorProgramPayment } from "@/actions/program";
import { auditSecurityEvent } from "@/lib/security/audit-log";
import {
  assertSameOriginRequest,
  getServerActionSecurityContext,
} from "@/lib/security/request";
import { DEFAULT_BOOKING_TIMEZONE, isBookableStaffRole } from "@/lib/booking-roles";

type CoursePaymentData = {
  type: "course_enrollment";
  courseId: string;
  courseTitle: string;
  authorizationUrl?: string;
  accessCode?: string;
};

type BookingPaymentData = {
  type: "booking";
  serviceId: string;
  serviceTitle: string;
  coachId: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  authorizationUrl?: string;
  accessCode?: string;
};

type ProgramPaymentData = {
  type: "accelerator_program";
  programId: string;
  programName: string;
  courseId: string;
  courseTitle: string;
  seatCount: number;
  authorizationUrl?: string;
  accessCode?: string;
};

// ── Auth ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const requestContext = await getServerActionSecurityContext();
  assertSameOriginRequest(requestContext);

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Payment init failed";
}

function toJsonObject(data: Record<string, unknown>): Prisma.InputJsonObject {
  return data as Prisma.InputJsonObject;
}

function withVerification(
  providerData: unknown,
  verification: unknown
): Prisma.InputJsonObject {
  const data =
    typeof providerData === "object" && providerData !== null
      ? (providerData as Record<string, unknown>)
      : {};

  return toJsonObject({
    ...data,
    verification,
  });
}

function isCoursePaymentData(meta: unknown): meta is CoursePaymentData {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "type" in meta &&
    meta.type === "course_enrollment" &&
    "courseId" in meta &&
    typeof meta.courseId === "string"
  );
}

function isBookingPaymentData(meta: unknown): meta is BookingPaymentData {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "type" in meta &&
    meta.type === "booking" &&
    "serviceId" in meta &&
    typeof meta.serviceId === "string" &&
    "coachId" in meta &&
    typeof meta.coachId === "string" &&
    "startTime" in meta &&
    typeof meta.startTime === "string" &&
    "endTime" in meta &&
    typeof meta.endTime === "string"
  );
}

function isProgramPaymentData(meta: unknown): meta is ProgramPaymentData {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "type" in meta &&
    meta.type === "accelerator_program" &&
    "programId" in meta &&
    typeof meta.programId === "string" &&
    "courseId" in meta &&
    typeof meta.courseId === "string"
  );
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
  const providerData: CoursePaymentData = {
    type: "course_enrollment",
    courseId: course.id,
    courseTitle: course.title,
  };

  // Create pending payment record
  const payment = await db.payment.create({
    data: {
      userId,
      amount: course.price,
      currency: course.currency,
      provider: "paystack",
      providerRef: reference,
      providerData: toJsonObject(providerData),
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

    await db.payment.update({
      where: { id: payment.id },
      data: {
        providerData: toJsonObject({
          ...providerData,
          authorizationUrl: tx.authorization_url,
          accessCode: tx.access_code,
        }),
      },
    });

    return {
      success: true,
      checkoutUrl: `/checkout/${reference}`,
      paymentUrl: tx.authorization_url,
    };
  } catch (error: unknown) {
    // Clean up the pending payment
    await db.payment.delete({ where: { id: payment.id } });
    return { success: false, error: getErrorMessage(error) };
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

  const [user, service, coach] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
    db.serviceOffering.findUnique({ where: { id: serviceId } }),
    db.user.findUnique({ where: { id: coachId }, select: { role: true } }),
  ]);

  if (!user?.email) return { success: false, error: "Email required" };
  if (!service || !service.isActive) return { success: false, error: "Service not available" };
  if (!isBookableStaffRole(coach?.role)) return { success: false, error: "Coach not available" };
  if (service.price === 0) return { success: false, error: "Service is free" };

  const reference = generateReference("booking");
  const start = new Date(startTime);
  const end = new Date(start.getTime() + service.duration * 60 * 1000);
  const providerData: BookingPaymentData = {
    type: "booking",
    serviceId: service.id,
    serviceTitle: service.title,
    coachId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    notes: notes || null,
  };

  const payment = await db.payment.create({
    data: {
      userId,
      amount: service.price,
      currency: service.currency,
      provider: "paystack",
      providerRef: reference,
      providerData: toJsonObject(providerData),
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

    await db.payment.update({
      where: { id: payment.id },
      data: {
        providerData: toJsonObject({
          ...providerData,
          authorizationUrl: tx.authorization_url,
          accessCode: tx.access_code,
        }),
      },
    });

    return {
      success: true,
      checkoutUrl: `/checkout/${reference}`,
      paymentUrl: tx.authorization_url,
    };
  } catch (error: unknown) {
    await db.payment.delete({ where: { id: payment.id } });
    return { success: false, error: getErrorMessage(error) };
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
      data: {
        status: "FAILED",
        providerData: withVerification(payment.providerData, tx),
      },
    });
    await auditSecurityEvent({
      actorId: payment.userId,
      action: "PAYMENT_FULFILLMENT_FAILED",
      targetType: "Payment",
      targetId: payment.id,
      outcome: "FAILED",
      metadata: {
        provider: payment.provider,
        providerRef: reference,
        providerStatus: tx.status,
      },
    });
    return { success: false, error: "Payment not successful" };
  }

  // Mark payment as complete
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      providerData: withVerification(payment.providerData, tx),
    },
  });

  // Fulfill based on type
  const meta = payment.providerData;

  if (isCoursePaymentData(meta)) {
    await db.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId: meta.courseId,
        },
      },
      create: {
        userId: payment.userId,
        courseId: meta.courseId,
        paymentId: payment.id,
      },
      update: {},
    });
    revalidatePath("/learn");
  }

  if (isBookingPaymentData(meta)) {
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
      await auditSecurityEvent({
        actorId: payment.userId,
        action: "PAYMENT_FULFILLMENT_FAILED",
        targetType: "Payment",
        targetId: payment.id,
        outcome: "FAILED",
        metadata: {
          provider: payment.provider,
          providerRef: reference,
          type: "booking",
          reason: "booking_conflict",
        },
      });
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
        timezone: DEFAULT_BOOKING_TIMEZONE,
      },
    });
    revalidatePath("/bookings");
  }

  if (isProgramPaymentData(meta)) {
    await fulfillAcceleratorProgramPayment(meta.programId, payment.id);
    revalidatePath("/programs");
  }

  await auditSecurityEvent({
    actorId: payment.userId,
    action: "PAYMENT_FULFILLED",
    targetType: "Payment",
    targetId: payment.id,
    metadata: {
      provider: payment.provider,
      providerRef: reference,
      type: typeof meta === "object" && meta !== null && "type" in meta ? meta.type : "unknown",
    },
  });

  return { success: true };
}
