import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CourseEditor } from "./course-editor";

interface CourseEditorPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseEditorPage({ params }: CourseEditorPageProps) {
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/content"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to courses
        </Link>
      </div>

      <CourseEditor
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          status: course.status,
          price: course.price,
          currency: course.currency,
          enrollmentCount: course._count.enrollments,
          modules: course.modules.map((mod) => ({
            id: mod.id,
            title: mod.title,
            description: mod.description,
            order: mod.order,
            lessons: mod.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              type: l.type,
              content: l.content,
              videoUrl: l.videoUrl,
              quizData: l.quizData,
              order: l.order,
              isFree: l.isFree,
            })),
          })),
        }}
      />
    </div>
  );
}
