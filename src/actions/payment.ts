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

type FulfillmentResult = {
  success: boolean;
  error?: string;
  alreadyFulfilled?: boolean;
  revalidatePaths: string[];
  audit?: {
    action: string;
    outcome?: "SUCCESS" | "FAILED" | "PARTIAL";
    metadata?: Record<string, unknown>;
  };
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

  const fulfillment = await db.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Payment" WHERE id = ${payment.id} FOR UPDATE
    `;

    const lockedPayment = await transaction.payment.findUnique({
      where: { id: payment.id },
    });

    if (!lockedPayment) {
      throw new Error("Payment not found");
    }

    if (lockedPayment.status === "SUCCESS") {
      return {
        success: true,
        alreadyFulfilled: true,
        revalidatePaths: [],
      } satisfies FulfillmentResult;
    }

    if (lockedPayment.status === "FAILED") {
      return {
        success: false,
        error: "Payment not successful",
        alreadyFulfilled: true,
        revalidatePaths: [],
      } satisfies FulfillmentResult;
    }

    if (tx.status !== "success") {
      await transaction.payment.update({
        where: { id: lockedPayment.id },
        data: {
          status: "FAILED",
          providerData: withVerification(lockedPayment.providerData, tx),
        },
      });

      return {
        success: false,
        error: "Payment not successful",
        revalidatePaths: [],
        audit: {
          action: "PAYMENT_FULFILLMENT_FAILED",
          outcome: "FAILED",
          metadata: {
            providerStatus: tx.status,
          },
        },
      } satisfies FulfillmentResult;
    }

    const meta = lockedPayment.providerData;
    const revalidatePaths: string[] = [];

    if (isCoursePaymentData(meta)) {
      await transaction.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: lockedPayment.userId,
            courseId: meta.courseId,
          },
        },
        create: {
          userId: lockedPayment.userId,
          courseId: meta.courseId,
          paymentId: lockedPayment.id,
        },
        update: {},
      });
      revalidatePaths.push("/learn");
    }

    if (isBookingPaymentData(meta)) {
      const conflict = await transaction.booking.findFirst({
        where: {
          coachId: meta.coachId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { lt: new Date(meta.endTime) },
          endTime: { gt: new Date(meta.startTime) },
        },
      });

      if (conflict) {
        await transaction.payment.update({
          where: { id: lockedPayment.id },
          data: {
            status: "FAILED",
            providerData: withVerification(lockedPayment.providerData, {
              ...tx,
              fulfillmentError: "booking_conflict",
            }),
          },
        });

        return {
          success: false,
          error: "Time slot no longer available — refund pending",
          revalidatePaths: [],
          audit: {
            action: "PAYMENT_FULFILLMENT_FAILED",
            outcome: "FAILED",
            metadata: {
              type: "booking",
              reason: "booking_conflict",
            },
          },
        } satisfies FulfillmentResult;
      }

      await transaction.booking.create({
        data: {
          clientId: lockedPayment.userId,
          coachId: meta.coachId,
          serviceId: meta.serviceId,
          startTime: new Date(meta.startTime),
          endTime: new Date(meta.endTime),
          notes: meta.notes,
          status: "CONFIRMED",
          paymentId: lockedPayment.id,
          timezone: DEFAULT_BOOKING_TIMEZONE,
        },
      });
      revalidatePaths.push("/bookings");
    }

    if (isProgramPaymentData(meta)) {
      await fulfillAcceleratorProgramPaymentInTransaction(transaction, meta.programId, lockedPayment.id);
      revalidatePaths.push("/programs", "/learn");
    }

    await transaction.payment.update({
      where: { id: lockedPayment.id },
      data: {
        status: "SUCCESS",
        providerData: withVerification(lockedPayment.providerData, tx),
      },
    });

    return {
      success: true,
      revalidatePaths,
      audit: {
        action: "PAYMENT_FULFILLED",
        metadata: {
          type: typeof meta === "object" && meta !== null && "type" in meta ? meta.type : "unknown",
        },
      },
    } satisfies FulfillmentResult;
  });

  for (const path of fulfillment.revalidatePaths) {
    revalidatePath(path);
  }

  if (fulfillment.audit) {
    await auditSecurityEvent({
      actorId: payment.userId,
      action: fulfillment.audit.action,
      targetType: "Payment",
      targetId: payment.id,
      outcome: fulfillment.audit.outcome,
      metadata: {
        provider: payment.provider,
        providerRef: reference,
        ...fulfillment.audit.metadata,
      },
    });
  }

  return fulfillment.success
    ? { success: true, alreadyFulfilled: fulfillment.alreadyFulfilled }
    : { success: false, error: fulfillment.error };
}

async function fulfillAcceleratorProgramPaymentInTransaction(
  transaction: Prisma.TransactionClient,
  programId: string,
  paymentId: string | null
) {
  const program = await transaction.acceleratorProgram.update({
    where: { id: programId },
    data: {
      status: "ACTIVE",
      paymentId,
    },
    include: {
      members: {
        where: { status: { not: "REMOVED" } },
      },
    },
  });

  for (const member of program.members) {
    const user = await transaction.user.findFirst({
      where: { email: { equals: member.email, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      await transaction.programMember.update({
        where: { id: member.id },
        data: { status: "INVITED", userId: null, enrollmentId: null },
      });
      continue;
    }

    const enrollment = await transaction.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: program.courseId,
        },
      },
      create: {
        userId: user.id,
        courseId: program.courseId,
        paymentId: paymentId || program.paymentId || null,
      },
      update: {},
    });

    await transaction.programMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        enrollmentId: enrollment.id,
        status: "ACTIVE",
      },
    });
  }
}
