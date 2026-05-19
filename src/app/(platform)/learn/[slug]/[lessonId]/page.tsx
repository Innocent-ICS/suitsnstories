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

type QuizData = {
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
  passingScore: number;
} | null;

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
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted-foreground sm:text-sm">
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
        <p className="mb-1 text-[0.9375rem] text-muted-foreground sm:text-sm">
          {lesson.module.title}
        </p>
        <h1 className="text-[1.7rem] font-serif leading-tight text-foreground sm:text-2xl">
          {lesson.title}
        </h1>
      </div>

      {/* Lesson content */}
      <LessonContent
        lesson={{
          id: lesson.id,
          type: lesson.type,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          quizData: lesson.quizData as QuizData,
        }}
        isCompleted={isCompleted}
        isEnrolled={!!enrollment}
        nextLessonHref={nextLesson ? `/learn/${slug}/${nextLesson.id}` : `/learn/${slug}`}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 border-t border-border pt-5 sm:pt-6">
        {prevLesson ? (
          <Link
            href={`/learn/${slug}/${prevLesson.id}`}
            className="flex min-w-0 items-center gap-2 text-[0.9375rem] leading-5 text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="line-clamp-2">{prevLesson.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/learn/${slug}/${nextLesson.id}`}
            className="flex min-w-0 items-center gap-2 text-right text-[0.9375rem] leading-5 text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
          >
            <span className="line-clamp-2">{nextLesson.title}</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/learn/${slug}`}
            className="text-[0.9375rem] font-medium text-primary hover:underline sm:text-sm"
          >
            Back to course overview →
          </Link>
        )}
      </div>
    </div>
  );
}
