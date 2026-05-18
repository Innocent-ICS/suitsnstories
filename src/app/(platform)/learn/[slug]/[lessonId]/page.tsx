import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { LessonContent } from "./lesson-content";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/auth/signin");

  // Load lesson with context
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: { orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson || lesson.module.course.slug !== slug) notFound();

  // Verify access
  const course = lesson.module.course;
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
    include: { progress: true },
  });

  if (!enrollment && !lesson.isFree) redirect(`/learn/${slug}`);

  // Get completed lesson IDs
  const completedLessonIds = new Set(
    enrollment?.progress.filter((p) => p.completed).map((p) => p.lessonId) || []
  );
  const isCompleted = completedLessonIds.has(lessonId);

  // Build flat lesson list for prev/next navigation
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/learn" className="hover:text-foreground transition-colors">Learn</Link>
        <span>/</span>
        <Link href={`/learn/${slug}`} className="hover:text-foreground transition-colors">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      {/* Lesson header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          {lesson.module.title}
        </p>
        <h1 className="text-2xl font-serif text-foreground">{lesson.title}</h1>
      </div>

      {/* Lesson content */}
      <LessonContent
        lesson={{
          id: lesson.id,
          type: lesson.type,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          quizData: lesson.quizData as any,
        }}
        isCompleted={isCompleted}
        isEnrolled={!!enrollment}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        {prevLesson ? (
          <Link
            href={`/learn/${slug}/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {prevLesson.title}
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/learn/${slug}/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {nextLesson.title}
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/learn/${slug}`}
            className="text-sm text-primary hover:underline"
          >
            Back to course overview →
          </Link>
        )}
      </div>
    </div>
  );
}
