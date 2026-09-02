import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EnrollButton } from "./enroll-button";
import {
  DocumentTextIcon,
  PlayCircleIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from "@/components/icons/app-icons";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const session = await auth();

  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();

  // Check enrollment & progress
  let enrollment = null;
  let completedLessonIds = new Set<string>();

  if (session?.user?.id) {
    enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId: session.user.id, courseId: course.id },
      },
      include: { progress: true },
    });

    if (enrollment) {
      completedLessonIds = new Set(
        enrollment.progress
          .filter((p) => p.completed)
          .map((p) => p.lessonId)
      );
    }
  }

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const completedCount = completedLessonIds.size;
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const nextLesson = enrollment
    ? allLessons.find((lesson) => !completedLessonIds.has(lesson.id))
    : allLessons.find((lesson) => lesson.isFree);
  const progressPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const lessonIcons = {
    TEXT: DocumentTextIcon,
    VIDEO: PlayCircleIcon,
    QUIZ: PuzzlePieceIcon,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* Course header */}
      <div className="space-y-4">
        <Link href="/learn" className="text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground sm:text-sm">
          ← Back to courses
        </Link>
        <h1 className="text-[2rem] font-serif leading-tight text-foreground sm:text-3xl">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-[15px] leading-7 text-muted-foreground sm:text-base">
            {course.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.9375rem] text-muted-foreground sm:text-sm">
          <span>{course.modules.length} modules</span>
          <span>{totalLessons} lessons</span>
          {enrollment && (
            <span className="text-primary font-medium">
              {completedCount}/{totalLessons} completed
            </span>
          )}
        </div>

        {/* Enrollment CTA */}
        {!enrollment && (
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-[1.05rem] font-semibold leading-7 text-foreground sm:text-base">
                {course.price === 0
                  ? "This course is free — enroll to track your progress."
                  : `Enroll for GH₵${(course.price / 100).toFixed(0)} to access all lessons.`}
              </p>
            </div>
            <EnrollButton courseId={course.id} price={course.price} />
          </div>
        )}

        {/* Progress bar */}
        {enrollment && totalLessons > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedCount}/{totalLessons} lessons complete</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                }}
              />
            </div>
          </div>
        )}

        {nextLesson && (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {enrollment ? "Next up" : "Free preview"}
              </p>
              <p className="mt-1 text-lg font-semibold leading-snug text-foreground sm:text-base">
                {nextLesson.title}
              </p>
            </div>
            <Link
              href={`/learn/${slug}/${nextLesson.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {enrollment ? "Continue learning" : "Preview lesson"}
            </Link>
          </div>
        )}
      </div>

      {/* Module/Lesson list */}
      <div className="space-y-6">
        {course.modules.map((mod, modIndex) => (
          <div key={mod.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-muted/20 px-5 py-4">
              <h2 className="text-[1.45rem] font-semibold leading-tight text-foreground sm:text-2xl">
                Module {modIndex + 1}: {mod.title}
              </h2>
              {mod.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {mod.description}
                </p>
              )}
            </div>
            <ul>
              {mod.lessons.map((lesson) => {
                const Icon = lessonIcons[lesson.type];
                const isCompleted = completedLessonIds.has(lesson.id);
                const canAccess = !!enrollment || lesson.isFree;

                return (
                  <li key={lesson.id} className="border-b border-border last:border-0">
                    {canAccess ? (
                      <Link
                        href={`/learn/${slug}/${lesson.id}`}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-3.5 transition-colors hover:bg-muted/30 sm:flex"
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className={`min-w-0 text-[0.9375rem] leading-5 sm:text-sm ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                          {lesson.title}
                        </span>
                        {lesson.isFree && !enrollment && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 sm:ml-auto">
                            Free preview
                          </span>
                        )}
                        <span className="col-start-3 text-xs capitalize text-muted-foreground sm:ml-auto">
                          {lesson.type.toLowerCase()}
                        </span>
                      </Link>
                    ) : (
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 opacity-50 sm:flex">
                        <LockClosedIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="min-w-0 text-[0.9375rem] leading-5 text-muted-foreground sm:text-sm">
                          {lesson.title}
                        </span>
                        <span className="text-xs capitalize text-muted-foreground sm:ml-auto">
                          {lesson.type.toLowerCase()}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
