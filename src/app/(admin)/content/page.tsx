import { db } from "@/lib/db";
import Link from "next/link";
import { CreateCourseButton } from "./create-course";

export default async function AdminContentPage() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { modules: true, enrollments: true } },
      modules: {
        include: { _count: { select: { lessons: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Content</h1>
          <p className="text-muted-foreground mt-1">
            Manage courses, modules, and lessons.
          </p>
        </div>
        <CreateCourseButton />
      </div>

      {/* Course list */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No courses yet. Create your first one.</p>
            <CreateCourseButton />
          </div>
        ) : (
          courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc, mod) => acc + mod._count.lessons,
              0
            );
            return (
              <Link
                key={course.id}
                href={`/content/${course.id}`}
                className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{course.title}</h3>
                      <StatusBadge status={course.status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                      <span>{course._count.modules} modules</span>
                      <span>{totalLessons} lessons</span>
                      <span>{course._count.enrollments} enrolled</span>
                      <span>
                        {course.price === 0
                          ? "Free"
                          : `${course.currency} ${(course.price / 100).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-amber-500/10 text-amber-600",
    PUBLISHED: "bg-emerald-500/10 text-emerald-600",
    ARCHIVED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-muted"}`}>
      {status.toLowerCase()}
    </span>
  );
}
