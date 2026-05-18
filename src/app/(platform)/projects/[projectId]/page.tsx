import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { ProjectDetail } from "./project-detail";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { id: true, name: true, image: true, email: true } },
      coach: { select: { id: true, name: true, image: true } },
      collaborators: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              profile: { select: { company: true } },
            },
          },
        },
      },
      invitations: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          scope: true,
          expiresAt: true,
          createdAt: true,
        },
      },
      deliverables: { orderBy: { createdAt: "desc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true, role: true } } },
      },
    },
  });

  if (!project) notFound();

  // Access check
  const isOwner = project.clientId === session.user.id;
  const isCoach = project.coachId === session.user.id;
  const isAdmin = user?.role === "ADMIN";
  const isCollaborator = project.collaborators.some((c) => c.userId === session.user.id);
  if (!isOwner && !isCoach && !isAdmin && !isCollaborator) notFound();

  // Get coaches for admin assignment
  const coaches = isAdmin
    ? await db.user.findMany({
        where: { role: { in: ["COACH", "ADMIN"] } },
        select: { id: true, name: true },
      })
    : [];

  return (
    <ProjectDetail
      project={{
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        brief: project.brief,
        feedback: project.feedback,
        dueDate: project.dueDate?.toISOString() || null,
        client: project.client,
        coach: project.coach,
        collaborators: project.collaborators.map((c) => ({
          id: c.id,
          role: c.role,
          user: c.user,
        })),
        invitations: project.invitations.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          scope: invite.scope,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
        })),
        deliverables: project.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          fileUrl: d.fileUrl,
          fileType: d.fileType,
          version: d.version,
          approved: d.approved,
          createdAt: d.createdAt.toISOString(),
        })),
        comments: project.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
          author: c.author,
        })),
      }}
      currentUserId={session.user.id}
      userRole={user?.role || "CLIENT"}
      coaches={coaches}
    />
  );
}
