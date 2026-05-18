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
} from "@heroicons/react/24/outline";

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
    <div className="max-w-4xl space-y-8">
      {/* Course header */}
      <div className="space-y-4">
        <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to courses
        </Link>
        <h1 className="text-3xl font-serif text-foreground">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground leading-relaxed">{course.description}</p>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
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
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {enrollment ? "Next up" : "Free preview"}
              </p>
              <p className="mt-1 font-medium text-foreground">{nextLesson.title}</p>
            </div>
            <Link
              href={`/learn/${slug}/${nextLesson.id}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {enrollment ? "Continue learning" : "Preview lesson"}
            </Link>
          </div>
        )}
      </div>

      {/* Module/Lesson list */}
      <div className="space-y-6">
        {course.modules.map((mod, modIndex) => (
          <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <h2 className="font-medium text-foreground">
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
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className={`text-sm ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                          {lesson.title}
                        </span>
                        {lesson.isFree && !enrollment && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                            Free preview
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground capitalize">
                          {lesson.type.toLowerCase()}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-3.5 opacity-50">
                        <LockClosedIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{lesson.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground capitalize">
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
