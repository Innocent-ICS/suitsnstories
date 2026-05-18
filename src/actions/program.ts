"use server";

import * as z from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateReference,
  initializeTransaction,
} from "@/lib/paystack";

const ProgramSchema = z.object({
  name: z.string().min(1).max(160).trim(),
  company: z.string().min(1).max(160).trim(),
  courseId: z.string().min(1),
  seatsPurchased: z.coerce.number().int().min(1).max(500),
  participants: z.string().max(20000).optional(),
  notes: z.string().max(2000).trim().optional(),
});

const ProgramMemberSchema = z.object({
  programId: z.string().min(1),
  name: z.string().max(120).trim().optional(),
  email: z.string().email().trim().toLowerCase(),
});

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

async function requireProgramManager() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!user || (user.role !== "PROGRAM_MANAGER" && user.role !== "ADMIN")) {
    throw new Error("Program manager access required");
  }

  return user;
}

function toJsonObject(data: Record<string, unknown>): Prisma.InputJsonObject {
  return data as Prisma.InputJsonObject;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Program action failed";
}

function parseParticipantRows(input?: string) {
  if (!input) return [];

  const byEmail = new Map<string, { email: string; name: string | null }>();
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (!emailMatch) continue;

    const email = emailMatch[0].toLowerCase();
    const name = line
      .replace(emailMatch[0], "")
      .replace(/[<>,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    byEmail.set(email, { email, name: name || null });
  }

  return Array.from(byEmail.values());
}

async function getProgramAccess(programId: string, userId: string) {
  const [program, user] = await Promise.all([
    db.acceleratorProgram.findUnique({ where: { id: programId } }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);

  if (!program) throw new Error("Program not found");

  const isAdmin = user?.role === "ADMIN";
  const isManager = program.managerId === userId;
  if (!isAdmin && !isManager) throw new Error("Unauthorized");

  return program;
}

async function syncProgramMembers(programId: string, paymentId?: string | null) {
  const program = await db.acceleratorProgram.findUnique({
    where: { id: programId },
    include: {
      members: {
        where: { status: { not: "REMOVED" } },
      },
    },
  });

  if (!program) throw new Error("Program not found");

  for (const member of program.members) {
    const user = await db.user.findFirst({
      where: { email: { equals: member.email, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      await db.programMember.update({
        where: { id: member.id },
        data: { status: "INVITED", userId: null, enrollmentId: null },
      });
      continue;
    }

    const enrollment = await db.enrollment.upsert({
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

    await db.programMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        enrollmentId: enrollment.id,
        status: "ACTIVE",
      },
    });
  }
}

export async function createAcceleratorProgram(data: z.input<typeof ProgramSchema>) {
  try {
    const manager = await requireProgramManager();
    const validated = ProgramSchema.parse(data);
    const participants = parseParticipantRows(validated.participants);

    if (participants.length > validated.seatsPurchased) {
      return { success: false, error: "Participant list exceeds purchased seats" };
    }

    const course = await db.course.findUnique({
      where: { id: validated.courseId, status: "PUBLISHED" },
      select: { id: true, title: true, price: true, currency: true },
    });

    if (!course) return { success: false, error: "Course not found" };

    const packagePrice = course.price * validated.seatsPurchased;
    const program = await db.acceleratorProgram.create({
      data: {
        name: validated.name,
        company: validated.company,
        courseId: course.id,
        managerId: manager.id,
        seatsPurchased: validated.seatsPurchased,
        packagePrice,
        currency: course.currency,
        notes: validated.notes || null,
        status: packagePrice === 0 ? "ACTIVE" : "PENDING_PAYMENT",
        members: {
          create: participants.map((participant) => ({
            name: participant.name,
            email: participant.email,
          })),
        },
      },
    });

    if (packagePrice === 0) {
      await syncProgramMembers(program.id, null);
    }

    revalidatePath("/programs");
    return { success: true, programId: program.id };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function initAcceleratorProgramPayment(programId: string) {
  try {
    const manager = await requireProgramManager();
    const program = await getProgramAccess(programId, manager.id);

    const [freshProgram, managerWithEmail] = await Promise.all([
      db.acceleratorProgram.findUnique({
        where: { id: program.id },
        include: {
          course: { select: { title: true } },
          payment: true,
        },
      }),
      db.user.findUnique({
        where: { id: manager.id },
        select: { email: true },
      }),
    ]);

    if (!freshProgram) return { success: false, error: "Program not found" };
    if (!managerWithEmail?.email) return { success: false, error: "Email required" };
    if (freshProgram.status !== "PENDING_PAYMENT") {
      return { success: false, error: "Program package is already active" };
    }

    if (freshProgram.packagePrice === 0) {
      await fulfillAcceleratorProgramPayment(freshProgram.id, null);
      return { success: true, checkoutUrl: "/programs" };
    }

    const existingMeta = freshProgram.payment?.providerData as ProgramPaymentData | null;
    if (
      freshProgram.payment?.status === "PENDING" &&
      existingMeta?.authorizationUrl &&
      freshProgram.payment.providerRef
    ) {
      return {
        success: true,
        checkoutUrl: `/checkout/${freshProgram.payment.providerRef}`,
        paymentUrl: existingMeta.authorizationUrl,
      };
    }

    const reference = generateReference("program");
    const providerData: ProgramPaymentData = {
      type: "accelerator_program",
      programId: freshProgram.id,
      programName: freshProgram.name,
      courseId: freshProgram.courseId,
      courseTitle: freshProgram.course.title,
      seatCount: freshProgram.seatsPurchased,
    };

    const payment = await db.payment.create({
      data: {
        userId: manager.id,
        amount: freshProgram.packagePrice,
        currency: freshProgram.currency,
        provider: "paystack",
        providerRef: reference,
        providerData: toJsonObject(providerData),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const tx = await initializeTransaction({
        email: managerWithEmail.email,
        amount: freshProgram.packagePrice,
        reference,
        callbackUrl: `${baseUrl}/api/payment/verify?ref=${reference}`,
        metadata: {
          payment_id: payment.id,
          type: "accelerator_program",
          program_id: freshProgram.id,
          course_id: freshProgram.courseId,
          user_id: manager.id,
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

      await db.acceleratorProgram.update({
        where: { id: freshProgram.id },
        data: { paymentId: payment.id },
      });

      revalidatePath("/programs");
      return {
        success: true,
        checkoutUrl: `/checkout/${reference}`,
        paymentUrl: tx.authorization_url,
      };
    } catch (error) {
      await db.payment.delete({ where: { id: payment.id } });
      return { success: false, error: getErrorMessage(error) };
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function addProgramMember(data: z.input<typeof ProgramMemberSchema>) {
  try {
    const manager = await requireProgramManager();
    const validated = ProgramMemberSchema.parse(data);
    const program = await getProgramAccess(validated.programId, manager.id);

    const memberCount = await db.programMember.count({
      where: {
        programId: program.id,
        status: { not: "REMOVED" },
      },
    });

    const existing = await db.programMember.findUnique({
      where: {
        programId_email: {
          programId: program.id,
          email: validated.email,
        },
      },
    });

    if ((!existing || existing.status === "REMOVED") && memberCount >= program.seatsPurchased) {
      return { success: false, error: "All purchased seats are already assigned" };
    }

    await db.programMember.upsert({
      where: {
        programId_email: {
          programId: program.id,
          email: validated.email,
        },
      },
      create: {
        programId: program.id,
        email: validated.email,
        name: validated.name || null,
      },
      update: {
        name: validated.name || null,
        status: "INVITED",
      },
    });

    if (program.status === "ACTIVE") {
      await syncProgramMembers(program.id, program.paymentId);
    }

    revalidatePath("/programs");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function removeProgramMember(programId: string, memberId: string) {
  const manager = await requireProgramManager();
  await getProgramAccess(programId, manager.id);

  await db.programMember.updateMany({
    where: { id: memberId, programId },
    data: {
      status: "REMOVED",
      enrollmentId: null,
    },
  });

  revalidatePath("/programs");
  return { success: true };
}

export async function fulfillAcceleratorProgramPayment(
  programId: string,
  paymentId: string | null
) {
  await db.acceleratorProgram.update({
    where: { id: programId },
    data: {
      status: "ACTIVE",
      paymentId,
    },
  });

  await syncProgramMembers(programId, paymentId);
  revalidatePath("/programs");
  revalidatePath("/learn");
  return { success: true };
}
