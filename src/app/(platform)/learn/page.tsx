import { db } from "@/lib/db";
import { auth } from "@/auth";
import Link from "next/link";
import {
  AcademicCapIcon,
  BookOpenIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

export default async function LearnPage() {
  const session = await auth();

  // Get published courses
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    include: {
      modules: {
        include: { _count: { select: { lessons: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  // Get user's enrollments
  const enrollments = session?.user?.id
    ? await db.enrollment.findMany({
        where: { userId: session.user.id },
        include: {
          _count: { select: { progress: true } },
        },
      })
    : [];

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Learn</h1>
        <p className="text-muted-foreground mt-2">
          Self-paced pitch coaching curriculum. Master the art of narrative strategy.
        </p>
      </div>

      {/* My enrolled courses */}
      {enrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-primary" />
            My Courses
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const course = courses.find((c) => c.id === enrollment.courseId);
              if (!course) return null;
              const totalLessons = course.modules.reduce(
                (sum, m) => sum + m._count.lessons,
                0
              );
              const completedLessons = enrollment._count.progress;
              const progressPct =
                totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

              return (
                <Link
                  key={enrollment.id}
                  href={`/learn/${course.slug}`}
                  className="group block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video rounded-lg overflow-hidden mb-4">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <AcademicCapIcon className="h-10 w-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground">{course.title}</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completedLessons}/{totalLessons} lessons</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {enrollment.completedAt && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckBadgeIcon className="h-4 w-4" />
                        Completed
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Course catalog */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-foreground">
          {enrollments.length > 0 ? "All Courses" : "Course Catalog"}
        </h2>
        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <AcademicCapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No courses available yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const totalLessons = course.modules.reduce(
                (sum, m) => sum + m._count.lessons,
                0
              );
              const isEnrolled = enrolledCourseIds.has(course.id);

              return (
                <Link
                  key={course.id}
                  href={`/learn/${course.slug}`}
                  className="group block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
                >
                  <div className="aspect-video rounded-lg overflow-hidden mb-4">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <AcademicCapIcon className="h-10 w-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {course.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-muted-foreground">
                      {course.modules.length} modules · {totalLessons} lessons
                    </span>
                    <span className="font-medium">
                      {isEnrolled ? (
                        <span className="text-primary">Enrolled</span>
                      ) : course.price === 0 ? (
                        <span className="text-emerald-600">Free</span>
                      ) : (
                        <span className="text-foreground">
                          GH₵{(course.price / 100).toFixed(0)}
                        </span>
                      )}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
