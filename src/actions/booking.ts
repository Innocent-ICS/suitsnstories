"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/resend";
import {
  DEFAULT_BOOKING_TIMEZONE,
  isBookableStaffRole,
} from "@/lib/booking-roles";
import { getDefaultAvailabilityForDay } from "@/lib/booking-availability";

// ── Schemas ────────────────────────────────────────────────────────────

const ServiceSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(200).trim().regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).trim().optional(),
  duration: z.number().min(15).max(480),
  price: z.number().min(0).default(0),
  currency: z.string().default("GHS"),
  isActive: z.boolean().default(true),
});

const AvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().default(DEFAULT_BOOKING_TIMEZONE),
});

const BookingSchema = z.object({
  serviceId: z.string().min(1),
  coachId: z.string().min(1),
  startTime: z.string().datetime(),
  notes: z.string().max(1000).trim().optional(),
});

// ── Auth Helpers ───────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function requireAdmin() {
  const userId = await requireAuth();
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") throw new Error("Unauthorized");
  return userId;
}

// ── Service Actions (Admin) ────────────────────────────────────────────

export async function createService(data: z.input<typeof ServiceSchema>) {
  await requireAdmin();
  const validated = ServiceSchema.parse(data);
  const service = await db.serviceOffering.create({ data: validated });
  revalidatePath("/services-admin");
  revalidatePath("/bookings");
  return { success: true, serviceId: service.id };
}

export async function updateService(id: string, data: Partial<z.input<typeof ServiceSchema>>) {
  await requireAdmin();
  await db.serviceOffering.update({ where: { id }, data });
  revalidatePath("/services-admin");
  revalidatePath("/bookings");
  return { success: true };
}

export async function deleteService(id: string) {
  await requireAdmin();
  await db.serviceOffering.delete({ where: { id } });
  revalidatePath("/services-admin");
  return { success: true };
}

// ── Availability Actions (Bookable Staff) ──────────────────────────────

export async function setAvailability(slots: z.input<typeof AvailabilitySchema>[]) {
  const userId = await requireAuth();
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isBookableStaffRole(user?.role)) throw new Error("Unauthorized");

  // Delete existing and replace
  await db.availability.deleteMany({ where: { coachId: userId } });

  const validated = slots.map((s) => AvailabilitySchema.parse(s));
  await db.availability.createMany({
    data: validated.map((s) => ({ ...s, coachId: userId })),
  });

  revalidatePath("/bookings");
  return { success: true };
}

export async function getAvailableSlots(coachId: string, serviceId: string, date: string) {
  const [service, coach] = await Promise.all([
    db.serviceOffering.findUnique({ where: { id: serviceId } }),
    db.user.findUnique({ where: { id: coachId }, select: { role: true } }),
  ]);
  if (!service || !service.isActive || !isBookableStaffRole(coach?.role)) return [];

  const targetDate = new Date(date);
  if (Number.isNaN(targetDate.getTime())) return [];

  const dayOfWeek = targetDate.getUTCDay();

  const [availability, activeAvailabilityCount] = await Promise.all([
    db.availability.findMany({
      where: { coachId, dayOfWeek, isActive: true },
    }),
    db.availability.count({
      where: { coachId, isActive: true },
    }),
  ]);

  const availabilityWindows =
    activeAvailabilityCount > 0 ? availability : getDefaultAvailabilityForDay(dayOfWeek);

  if (availabilityWindows.length === 0) return [];

  // Get existing bookings for this day
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const existingBookings = await db.booking.findMany({
    where: {
      coachId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  // Generate slots
  const slots: { time: string; available: boolean }[] = [];
  for (const avail of availabilityWindows) {
    const [startH, startM] = avail.startTime.split(":").map(Number);
    const [endH, endM] = avail.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let t = startMinutes; t + service.duration <= endMinutes; t += 30) {
      const slotStart = new Date(date);
      slotStart.setUTCHours(Math.floor(t / 60), t % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + service.duration * 60 * 1000);

      const isBooked = existingBookings.some((b) => {
        return slotStart < b.endTime && slotEnd > b.startTime;
      });

      slots.push({
        time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
        available: !isBooked,
      });
    }
  }

  return slots;
}

// ── Booking Actions ────────────────────────────────────────────────────

export async function createBooking(data: z.input<typeof BookingSchema>) {
  const userId = await requireAuth();
  const validated = BookingSchema.parse(data);

  const [service, coach] = await Promise.all([
    db.serviceOffering.findUnique({ where: { id: validated.serviceId } }),
    db.user.findUnique({ where: { id: validated.coachId }, select: { role: true } }),
  ]);
  if (!service || !service.isActive) return { success: false, error: "Service not available" };
  if (!isBookableStaffRole(coach?.role)) return { success: false, error: "Coach not available" };

  const startTime = new Date(validated.startTime);
  const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

  // Check for conflicts
  const conflict = await db.booking.findFirst({
    where: {
      coachId: validated.coachId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) return { success: false, error: "Time slot no longer available" };

  // For free services, book directly
  if (service.price === 0) {
    const booking = await db.booking.create({
      data: {
        clientId: userId,
        coachId: validated.coachId,
        serviceId: validated.serviceId,
        startTime,
        endTime,
        notes: validated.notes || null,
        status: "CONFIRMED",
        timezone: DEFAULT_BOOKING_TIMEZONE,
      },
    });

    // Send confirmation emails
    const client = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    const coach = await db.user.findUnique({ where: { id: validated.coachId }, select: { name: true, email: true } });

    if (client?.email) {
      sendEmail({
        to: client.email,
        subject: `Booking confirmed — ${service.title}`,
        html: `<p>Hi ${client.name?.split(" ")[0]},</p><p>Your ${service.title} session is confirmed for ${startTime.toLocaleString()}.</p><p>— Suits & Stories</p>`,
      }).catch(console.error);
    }

    if (coach?.email) {
      sendEmail({
        to: coach.email,
        subject: `New booking — ${service.title}`,
        html: `<p>Hi ${coach.name?.split(" ")[0]},</p><p>${client?.name} has booked a ${service.title} session for ${startTime.toLocaleString()}.</p>`,
      }).catch(console.error);
    }

    revalidatePath("/bookings");
    return { success: true, bookingId: booking.id };
  }

  // Paid service — placeholder for PayStack flow
  return { success: false, error: "Payment required", requiresPayment: true };
}

export async function updateBookingStatus(
  bookingId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
  reason?: string
) {
  const userId = await requireAuth();

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { success: false, error: "Booking not found" };

  // Only the coach, client (for cancellation), or admin can update
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isCoach = booking.coachId === userId;
  const isClient = booking.clientId === userId;
  const isAdmin = user?.role === "ADMIN";

  if (!isCoach && !isClient && !isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  // Clients can only cancel
  if (isClient && !isAdmin && status !== "CANCELLED") {
    return { success: false, error: "Clients can only cancel bookings" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status,
      ...(status === "CANCELLED" ? { cancelledAt: new Date(), cancelReason: reason } : {}),
    },
  });

  revalidatePath("/bookings");
  return { success: true };
}
