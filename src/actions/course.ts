"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isValidVideoInput, normalizeVideoUrlInput } from "@/lib/video-embed";

// ── Schemas ────────────────────────────────────────────────────────────

const CourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  slug: z.string().min(1).max(200).trim().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().max(2000).trim().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().default("GHS"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

const ModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  order: z.number().min(0).default(0),
});

const VideoUrlSchema = z
  .string()
  .trim()
  .refine(isValidVideoInput, "Enter a valid YouTube, Vimeo, or video URL")
  .optional()
  .or(z.literal(""));

const LessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200).trim(),
  type: z.enum(["TEXT", "VIDEO", "QUIZ"]).default("TEXT"),
  content: z.string().optional(),
  videoUrl: VideoUrlSchema,
  videoDuration: z.number().optional(),
  quizData: z.any().optional(),
  order: z.number().min(0).default(0),
  isFree: z.boolean().default(false),
});

const LessonUpdateSchema = z.object({
  moduleId: z.string().min(1).optional(),
  title: z.string().min(1, "Title is required").max(200).trim().optional(),
  type: z.enum(["TEXT", "VIDEO", "QUIZ"]).optional(),
  content: z.string().optional(),
  videoUrl: VideoUrlSchema,
  videoDuration: z.number().optional(),
  quizData: z.any().optional(),
  order: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
});

function getVideoUrlForStorage(videoUrl: string | null | undefined) {
  const normalized = normalizeVideoUrlInput(videoUrl);
  return normalized || null;
}

// ── Auth Check ─────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Unauthorized");
  return session.user.id;
}

// ── Course Actions ─────────────────────────────────────────────────────

export async function createCourse(data: z.input<typeof CourseSchema>) {
  await requireAdmin();
  const validated = CourseSchema.parse(data);

  const course = await db.course.create({
    data: validated,
  });

  revalidatePath("/content");
  return { success: true, courseId: course.id };
}

export async function updateCourse(courseId: string, data: Partial<z.infer<typeof CourseSchema>>) {
  await requireAdmin();

  await db.course.update({
    where: { id: courseId },
    data,
  });

  revalidatePath("/content");
  revalidatePath(`/content/${courseId}`);
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();
  await db.course.delete({ where: { id: courseId } });
  revalidatePath("/content");
  return { success: true };
}

// ── Module Actions ─────────────────────────────────────────────────────

export async function createModule(data: z.input<typeof ModuleSchema>) {
  await requireAdmin();
  const validated = ModuleSchema.parse(data);

  // Auto-set order to next available
  const lastModule = await db.module.findFirst({
    where: { courseId: validated.courseId },
    orderBy: { order: "desc" },
  });

  const createdModule = await db.module.create({
    data: { ...validated, order: validated.order || (lastModule?.order ?? -1) + 1 },
  });

  revalidatePath(`/content/${validated.courseId}`);
  return { success: true, moduleId: createdModule.id };
}

export async function updateModule(moduleId: string, data: Partial<z.infer<typeof ModuleSchema>>) {
  await requireAdmin();
  const mod = await db.module.update({
    where: { id: moduleId },
    data,
  });
  revalidatePath(`/content/${mod.courseId}`);
  return { success: true };
}

export async function deleteModule(moduleId: string) {
  await requireAdmin();
  const mod = await db.module.findUnique({ where: { id: moduleId } });
  await db.module.delete({ where: { id: moduleId } });
  if (mod) revalidatePath(`/content/${mod.courseId}`);
  return { success: true };
}

// ── Lesson Actions ─────────────────────────────────────────────────────

export async function createLesson(data: z.input<typeof LessonSchema>) {
  await requireAdmin();
  const validated = LessonSchema.parse(data);

  const lastLesson = await db.lesson.findFirst({
    where: { moduleId: validated.moduleId },
    orderBy: { order: "desc" },
  });

  const lesson = await db.lesson.create({
    data: {
      ...validated,
      videoUrl: getVideoUrlForStorage(validated.videoUrl),
      order: validated.order || (lastLesson?.order ?? -1) + 1,
    },
  });

  const mod = await db.module.findUnique({ where: { id: validated.moduleId } });
  if (mod) revalidatePath(`/content/${mod.courseId}`);
  return { success: true, lessonId: lesson.id };
}

export async function updateLesson(lessonId: string, data: Partial<z.infer<typeof LessonSchema>>) {
  await requireAdmin();
  const validated = LessonUpdateSchema.parse(data);
  const updateData = {
    ...validated,
    ...("videoUrl" in validated ? { videoUrl: getVideoUrlForStorage(validated.videoUrl) } : {}),
  };

  const lesson = await db.lesson.update({
    where: { id: lessonId },
    data: updateData,
    include: { module: true },
  });
  revalidatePath(`/content/${lesson.module.courseId}`);
  return { success: true };
}

export async function deleteLesson(lessonId: string) {
  await requireAdmin();
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  await db.lesson.delete({ where: { id: lessonId } });
  if (lesson) revalidatePath(`/content/${lesson.module.courseId}`);
  return { success: true };
}
