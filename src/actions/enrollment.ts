"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ── Auth Helper ────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// ── Enrollment ─────────────────────────────────────────────────────────

export async function enrollInCourse(courseId: string) {
  const userId = await requireAuth();

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
  });

  if (!course) return { success: false, error: "Course not found" };

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) return { success: false, error: "Already enrolled" };

  // Free course — enroll directly
  if (course.price === 0) {
    await db.enrollment.create({
      data: { userId, courseId },
    });

    revalidatePath("/learn");
    revalidatePath(`/learn/${course.slug}`);
    return { success: true };
  }

  // Paid course — return payment URL (handled by PayStack action)
  return { success: false, error: "Payment required", requiresPayment: true };
}

// ── Progress Tracking ──────────────────────────────────────────────────

export async function markLessonComplete(lessonId: string) {
  const userId = await requireAuth();

  // Find the enrollment for this lesson's course
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  if (!lesson) return { success: false, error: "Lesson not found" };

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: lesson.module.course.id,
      },
    },
  });

  if (!enrollment) return { success: false, error: "Not enrolled" };

  // Upsert progress
  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
  });

  // Check if all lessons in course are complete
  const totalLessons = await db.lesson.count({
    where: { module: { courseId: lesson.module.course.id } },
  });

  const completedLessons = await db.lessonProgress.count({
    where: { enrollmentId: enrollment.id, completed: true },
  });

  if (completedLessons >= totalLessons) {
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { completedAt: new Date() },
    });
  }

  revalidatePath(`/learn/${lesson.module.course.slug}`);
  return { success: true, courseComplete: completedLessons >= totalLessons };
}

// ── Quiz Submission ────────────────────────────────────────────────────

export async function submitQuiz(
  lessonId: string,
  answers: Record<string, string>
) {
  const userId = await requireAuth();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  if (!lesson || lesson.type !== "QUIZ" || !lesson.quizData) {
    return { success: false, error: "Invalid quiz" };
  }

  // Verify enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: lesson.module.course.id,
      },
    },
  });

  if (!enrollment) return { success: false, error: "Not enrolled" };

  // Score the quiz
  const quizData = lesson.quizData as {
    questions: { id: string; correctAnswer: string }[];
    passingScore: number;
  };

  let correct = 0;
  for (const q of quizData.questions) {
    if (answers[q.id] === q.correctAnswer) correct++;
  }

  const score = quizData.questions.length > 0
    ? (correct / quizData.questions.length) * 100
    : 0;
  const passed = score >= (quizData.passingScore || 70);

  // Save attempt
  await db.quizAttempt.create({
    data: {
      userId,
      lessonId,
      answers,
      score,
      passed,
    },
  });

  // If passed, mark lesson complete
  if (passed) {
    await markLessonComplete(lessonId);
  }

  return { success: true, score, passed };
}
