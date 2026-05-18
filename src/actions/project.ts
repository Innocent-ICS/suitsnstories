"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ── Schemas ────────────────────────────────────────────────────────────

const ProjectSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  brief: z.string().max(5000).trim().optional(),
  dueDate: z.string().optional(),
  coachId: z.string().optional(),
});

const CommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(2000).trim(),
});

// ── Auth ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// ── Project CRUD ───────────────────────────────────────────────────────

export async function createProject(data: z.input<typeof ProjectSchema>) {
  const userId = await requireAuth();
  const validated = ProjectSchema.parse(data);

  const project = await db.project.create({
    data: {
      title: validated.title,
      description: validated.description,
      brief: validated.brief,
      clientId: userId,
      coachId: validated.coachId || null,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
    },
  });

  revalidatePath("/projects");
  return { success: true, projectId: project.id };
}

export async function updateProject(
  projectId: string,
  data: Partial<{
    title: string;
    description: string;
    brief: string;
    feedback: string;
    status: string;
    coachId: string;
    dueDate: string;
  }>
) {
  const userId = await requireAuth();

  // Verify access
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Not found");

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isOwner = project.clientId === userId;
  const isCoach = project.coachId === userId;
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isCoach && !isAdmin) throw new Error("Unauthorized");

  // Clients can only update brief, coaches can update feedback/status
  const updateData: any = {};
  if (isOwner || isAdmin) {
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.brief !== undefined) updateData.brief = data.brief;
  }
  if (isCoach || isAdmin) {
    if (data.feedback !== undefined) updateData.feedback = data.feedback;
    if (data.status) updateData.status = data.status;
    if (data.coachId) updateData.coachId = data.coachId;
  }
  if (isAdmin && data.dueDate) {
    updateData.dueDate = new Date(data.dueDate);
  }

  await db.project.update({ where: { id: projectId }, data: updateData });
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const userId = await requireAuth();
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") throw new Error("Only admins can delete projects");

  await db.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
  return { success: true };
}

// ── Deliverables ───────────────────────────────────────────────────────

export async function addDeliverable(projectId: string, title: string, fileUrl?: string, fileType?: string, fileSize?: number) {
  const userId = await requireAuth();
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.clientId !== userId) throw new Error("Unauthorized");

  await db.deliverable.create({
    data: { projectId, title, fileUrl, fileType, fileSize },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function approveDeliverable(deliverableId: string) {
  const userId = await requireAuth();
  const deliverable = await db.deliverable.findUnique({
    where: { id: deliverableId },
    include: { project: true },
  });
  if (!deliverable) throw new Error("Not found");

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isCoach = deliverable.project.coachId === userId;
  const isAdmin = user?.role === "ADMIN";
  if (!isCoach && !isAdmin) throw new Error("Only coaches/admins can approve");

  await db.deliverable.update({
    where: { id: deliverableId },
    data: { approved: true, approvedAt: new Date() },
  });

  revalidatePath(`/projects/${deliverable.projectId}`);
  return { success: true };
}

// ── Comments ───────────────────────────────────────────────────────────

export async function addComment(data: z.input<typeof CommentSchema>) {
  const userId = await requireAuth();
  const validated = CommentSchema.parse(data);

  // Verify access to project
  const project = await db.project.findUnique({ where: { id: validated.projectId } });
  if (!project) throw new Error("Not found");

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const hasAccess =
    project.clientId === userId ||
    project.coachId === userId ||
    user?.role === "ADMIN";

  if (!hasAccess) throw new Error("Unauthorized");

  await db.projectComment.create({
    data: {
      projectId: validated.projectId,
      authorId: userId,
      content: validated.content,
    },
  });

  revalidatePath(`/projects/${validated.projectId}`);
  return { success: true };
}

// ── Admin: Assign coach ────────────────────────────────────────────────

export async function assignCoach(projectId: string, coachId: string) {
  const userId = await requireAuth();
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") throw new Error("Unauthorized");

  await db.project.update({
    where: { id: projectId },
    data: { coachId, status: "IN_PROGRESS" },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}
