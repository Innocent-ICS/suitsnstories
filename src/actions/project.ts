"use server";

import { createHash, randomBytes } from "node:crypto";
import * as z from "zod";
import type { Prisma, ProjectCollaboratorRole, ProjectInvitationScope, ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/resend";
import { projectInvitationEmail } from "@/lib/email/templates";
import { auditSecurityEvent } from "@/lib/security/audit-log";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { cleanupProjectInvitations } from "@/lib/security/project-invitations";
import {
  assertSameOriginRequest,
  getServerActionSecurityContext,
} from "@/lib/security/request";

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

const InviteCollaboratorSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).default("COMMENTER"),
  scope: z.enum(["ANYONE", "COMPANY"]).default("ANYONE"),
});

const CreateInviteLinkSchema = z.object({
  projectId: z.string().min(1),
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).default("COMMENTER"),
  scope: z.enum(["ANYONE", "COMPANY"]).default("ANYONE"),
});

const MAX_ACTIVE_INVITES_PER_PROJECT = 25;
const MAX_INVITES_PER_USER_PER_DAY = 40;

// ── Auth ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const requestContext = await getServerActionSecurityContext();
  assertSameOriginRequest(requestContext);

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function normalizeCompany(company?: string | null) {
  return company?.trim().replace(/\s+/g, " ").toLowerCase() || "";
}

function emailDomain(email?: string | null) {
  return email?.split("@")[1]?.trim().toLowerCase() || "";
}

function inviteTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

function roleLabel(role: ProjectCollaboratorRole) {
  const labels: Record<ProjectCollaboratorRole, string> = {
    VIEWER: "View",
    COMMENTER: "Comment",
    EDITOR: "Edit",
  };
  return labels[role];
}

async function getProjectAccess(projectId: string, userId: string) {
  const [project, user] = await Promise.all([
    db.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: {
          where: { userId },
          select: { role: true },
        },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  if (!project) throw new Error("Not found");

  const collaborator = project.collaborators[0] || null;
  const isOwner = project.clientId === userId;
  const isCoach = project.coachId === userId;
  const isAdmin = user?.role === "ADMIN";
  const isEditorCollaborator = collaborator?.role === "EDITOR";
  const isCommenterCollaborator = collaborator?.role === "COMMENTER";

  return {
    project,
    isOwner,
    isCoach,
    isAdmin,
    isCollaborator: Boolean(collaborator),
    isEditorCollaborator,
    isCommenterCollaborator,
  };
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
  const {
    isOwner,
    isCoach,
    isAdmin,
    isEditorCollaborator,
  } = await getProjectAccess(projectId, userId);

  if (!isOwner && !isCoach && !isAdmin && !isEditorCollaborator) {
    throw new Error("Unauthorized");
  }

  // Clients can only update brief, coaches can update feedback/status
  const updateData: Prisma.ProjectUncheckedUpdateInput = {};
  if (isOwner || isAdmin || isEditorCollaborator) {
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.brief !== undefined) updateData.brief = data.brief;
  }
  if (isCoach || isAdmin) {
    if (data.feedback !== undefined) updateData.feedback = data.feedback;
    if (data.status) updateData.status = data.status as ProjectStatus;
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

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, clientId: true },
  });

  await db.project.delete({ where: { id: projectId } });
  await auditSecurityEvent({
    actorId: userId,
    action: "PROJECT_DELETED",
    targetType: "Project",
    targetId: projectId,
    metadata: {
      title: project?.title,
      clientId: project?.clientId,
    },
  });
  revalidatePath("/projects");
  return { success: true };
}

// ── Deliverables ───────────────────────────────────────────────────────

export async function addDeliverable(projectId: string, title: string, fileUrl?: string, fileType?: string, fileSize?: number) {
  const userId = await requireAuth();
  const { isOwner, isAdmin, isEditorCollaborator } = await getProjectAccess(projectId, userId);
  if (!isOwner && !isAdmin && !isEditorCollaborator) throw new Error("Unauthorized");

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
  const { isOwner, isCoach, isAdmin, isEditorCollaborator, isCommenterCollaborator } =
    await getProjectAccess(validated.projectId, userId);
  const hasAccess = isOwner || isCoach || isAdmin || isEditorCollaborator || isCommenterCollaborator;

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

// ── Collaborators ──────────────────────────────────────────────────────

export async function inviteProjectCollaborator(data: z.input<typeof InviteCollaboratorSchema>) {
  const userId = await requireAuth();
  const requestContext = await getServerActionSecurityContext();
  const validated = InviteCollaboratorSchema.parse(data);
  const inviteRateLimit = await checkRateLimit({
    scope: "project-invite-create",
    identifier: userId,
    limit: MAX_INVITES_PER_USER_PER_DAY,
    windowMs: 24 * 60 * 60 * 1000,
  });

  if (!inviteRateLimit.allowed) {
    return { success: false, error: "Too many invitations created today. Please try again later." };
  }

  const [project, inviter] = await Promise.all([
    db.project.findUnique({
      where: { id: validated.projectId },
      include: {
        client: { include: { profile: true } },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true },
    }),
  ]);

  if (!project) return { success: false, error: "Project not found" };
  const access = await getProjectAccess(project.id, userId);
  const isAdmin = inviter?.role === "ADMIN";
  if (!access.isOwner && !isAdmin && !access.isEditorCollaborator) {
    return { success: false, error: "Only project owners, editors, and admins can invite collaborators" };
  }

  const collaborator = await db.user.findFirst({
    where: { email: { equals: validated.email, mode: "insensitive" } },
    include: { profile: true },
  });

  if (collaborator?.id === project.clientId) {
    return { success: false, error: "The project creator already has access" };
  }

  if (
    validated.scope === "COMPANY" &&
    !isCompanyInviteAllowed({
      projectOwnerCompany: project.client.profile?.company,
      projectOwnerEmail: project.client.email,
      inviteeEmail: validated.email,
      inviteeCompany: collaborator?.profile?.company,
    })
  ) {
    return { success: false, error: "Company-only invites must match the project creator's company or email domain" };
  }

  const inviteLimit = await enforceProjectInvitationLimits(project.id, userId);
  if (!inviteLimit.success) return inviteLimit;

  if (collaborator) {
    await upsertProjectCollaborator(project.id, collaborator.id, userId, validated.role);
  }

  const invitation = await createProjectInvitation({
    projectId: project.id,
    invitedById: userId,
    email: validated.email,
    role: validated.role,
    scope: validated.scope,
  });

  const template = projectInvitationEmail({
    inviterName: inviter?.name || inviter?.email || "A collaborator",
    projectTitle: project.title,
    inviteUrl: invitation.url,
    role: roleLabel(validated.role),
  });
  await sendEmail({ to: validated.email, ...template });

  await auditSecurityEvent({
    actorId: userId,
    action: "PROJECT_INVITATION_CREATED",
    targetType: "ProjectInvitation",
    targetId: invitation.id,
    request: requestContext,
    metadata: {
      projectId: project.id,
      role: validated.role,
      scope: validated.scope,
      email: validated.email,
      directCollaboratorAdded: Boolean(collaborator),
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  return {
    success: true,
    inviteUrl: invitation.url,
    message: collaborator ? "Collaborator added and invitation email sent" : "Invitation email sent",
  };
}

export async function createProjectInviteLink(data: z.input<typeof CreateInviteLinkSchema>) {
  const userId = await requireAuth();
  const requestContext = await getServerActionSecurityContext();
  const validated = CreateInviteLinkSchema.parse(data);
  const inviteRateLimit = await checkRateLimit({
    scope: "project-invite-link-create",
    identifier: userId,
    limit: MAX_INVITES_PER_USER_PER_DAY,
    windowMs: 24 * 60 * 60 * 1000,
  });

  if (!inviteRateLimit.allowed) {
    return { success: false, error: "Too many invitation links created today. Please try again later." };
  }

  const access = await getProjectAccess(validated.projectId, userId);

  if (!access.isOwner && !access.isAdmin && !access.isEditorCollaborator) {
    return { success: false, error: "Only project owners, editors, and admins can create invite links" };
  }

  if (validated.scope === "COMPANY" && !access.project.clientId) {
    return { success: false, error: "Company-only links need a project owner" };
  }

  const inviteLimit = await enforceProjectInvitationLimits(validated.projectId, userId);
  if (!inviteLimit.success) return inviteLimit;

  const invitation = await createProjectInvitation({
    projectId: validated.projectId,
    invitedById: userId,
    email: null,
    role: validated.role,
    scope: validated.scope,
  });

  await auditSecurityEvent({
    actorId: userId,
    action: "PROJECT_INVITATION_CREATED",
    targetType: "ProjectInvitation",
    targetId: invitation.id,
    request: requestContext,
    metadata: {
      projectId: validated.projectId,
      role: validated.role,
      scope: validated.scope,
      linkOnly: true,
    },
  });

  revalidatePath(`/projects/${validated.projectId}`);
  return { success: true, inviteUrl: invitation.url };
}

export async function revokeProjectInvitation(projectId: string, invitationId: string) {
  const userId = await requireAuth();
  const requestContext = await getServerActionSecurityContext();
  const access = await getProjectAccess(projectId, userId);
  if (!access.isOwner && !access.isAdmin && !access.isEditorCollaborator) {
    throw new Error("Only project owners, editors, and admins can revoke invitations");
  }

  await db.projectInvitation.updateMany({
    where: { id: invitationId, projectId },
    data: { status: "REVOKED" },
  });

  await auditSecurityEvent({
    actorId: userId,
    action: "PROJECT_INVITATION_REVOKED",
    targetType: "ProjectInvitation",
    targetId: invitationId,
    request: requestContext,
    metadata: { projectId },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function acceptProjectInvitationToken(token: string) {
  const userId = await requireAuth();
  const requestContext = await getServerActionSecurityContext();
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user?.email) return { success: false, error: "Add an email address to your account before accepting this invite" };

  const invitation = await db.projectInvitation.findUnique({
    where: { tokenHash: inviteTokenHash(token) },
    include: {
      project: {
        include: {
          client: { include: { profile: true } },
        },
      },
    },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return { success: false, error: "This invitation is invalid or expired" };
  }

  if (!invitation.email && invitation.scope === "ANYONE" && !user.emailVerified) {
    return { success: false, error: "Verify your email before accepting broad project invite links" };
  }

  if (invitation.email && invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, error: "Sign in with the email address that was invited" };
  }

  if (
    invitation.scope === "COMPANY" &&
    !isCompanyInviteAllowed({
      projectOwnerCompany: invitation.project.client.profile?.company,
      projectOwnerEmail: invitation.project.client.email,
      inviteeEmail: user.email,
      inviteeCompany: user.profile?.company,
    })
  ) {
    return { success: false, error: "This link is restricted to the project creator's company" };
  }

  await upsertProjectCollaborator(invitation.projectId, userId, invitation.invitedById, invitation.role);
  await db.projectInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      acceptedById: userId,
      acceptedAt: new Date(),
    },
  });

  await auditSecurityEvent({
    actorId: userId,
    action: "PROJECT_INVITATION_ACCEPTED",
    targetType: "ProjectInvitation",
    targetId: invitation.id,
    request: requestContext,
    metadata: {
      projectId: invitation.projectId,
      role: invitation.role,
      scope: invitation.scope,
      invitedById: invitation.invitedById,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${invitation.projectId}`);
  return { success: true, projectId: invitation.projectId };
}

async function upsertProjectCollaborator(
  projectId: string,
  collaboratorId: string,
  invitedById: string,
  role: ProjectCollaboratorRole
) {
  const existing = await db.projectCollaborator.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: collaboratorId,
      },
    },
    select: { id: true, role: true },
  });

  const collaborator = await db.projectCollaborator.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: collaboratorId,
      },
    },
    create: {
      projectId,
      userId: collaboratorId,
      invitedById,
      role,
    },
    update: {
      role,
      invitedById,
    },
  });

  if (!existing) {
    await auditSecurityEvent({
      actorId: invitedById,
      action: "PROJECT_COLLABORATOR_ADDED",
      targetType: "ProjectCollaborator",
      targetId: collaborator.id,
      metadata: {
        projectId,
        collaboratorId,
        role,
      },
    });
  } else if (existing.role !== role) {
    await auditSecurityEvent({
      actorId: invitedById,
      action: "PROJECT_COLLABORATOR_ROLE_CHANGED",
      targetType: "ProjectCollaborator",
      targetId: collaborator.id,
      metadata: {
        projectId,
        collaboratorId,
        previousRole: existing.role,
        nextRole: role,
      },
    });
  }
}

async function enforceProjectInvitationLimits(projectId: string, userId: string) {
  await cleanupProjectInvitations();

  const now = new Date();
  const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [activeProjectInvites, userDailyInvites] = await Promise.all([
    db.projectInvitation.count({
      where: {
        projectId,
        status: "PENDING",
        expiresAt: { gt: now },
      },
    }),
    db.projectInvitation.count({
      where: {
        invitedById: userId,
        createdAt: { gte: dayStart },
      },
    }),
  ]);

  if (activeProjectInvites >= MAX_ACTIVE_INVITES_PER_PROJECT) {
    return {
      success: false as const,
      error: "This project already has the maximum number of active invitations.",
    };
  }

  if (userDailyInvites >= MAX_INVITES_PER_USER_PER_DAY) {
    return {
      success: false as const,
      error: "Too many invitations created today. Please try again later.",
    };
  }

  return { success: true as const };
}

async function createProjectInvitation({
  projectId,
  invitedById,
  email,
  role,
  scope,
}: {
  projectId: string;
  invitedById: string;
  email: string | null;
  role: ProjectCollaboratorRole;
  scope: ProjectInvitationScope;
}) {
  const token = createInviteToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const invitation = await db.projectInvitation.create({
    data: {
      projectId,
      invitedById,
      email,
      tokenHash: inviteTokenHash(token),
      role,
      scope,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });

  return { id: invitation.id, token, url: `${appUrl}/project-invite/${token}` };
}

function isCompanyInviteAllowed({
  projectOwnerCompany,
  projectOwnerEmail,
  inviteeEmail,
  inviteeCompany,
}: {
  projectOwnerCompany?: string | null;
  projectOwnerEmail?: string | null;
  inviteeEmail?: string | null;
  inviteeCompany?: string | null;
}) {
  const ownerCompany = normalizeCompany(projectOwnerCompany);
  const collaboratorCompany = normalizeCompany(inviteeCompany);
  if (ownerCompany && collaboratorCompany && ownerCompany === collaboratorCompany) return true;

  const ownerDomain = emailDomain(projectOwnerEmail);
  const inviteeDomain = emailDomain(inviteeEmail);
  return Boolean(ownerDomain && inviteeDomain && ownerDomain === inviteeDomain);
}

export async function removeProjectCollaborator(projectId: string, collaboratorId: string) {
  const userId = await requireAuth();
  const requestContext = await getServerActionSecurityContext();
  const access = await getProjectAccess(projectId, userId);
  if (!access.isOwner && !access.isAdmin) {
    throw new Error("Only the project creator can remove collaborators");
  }

  await db.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  });

  await auditSecurityEvent({
    actorId: userId,
    action: "PROJECT_COLLABORATOR_REMOVED",
    targetType: "ProjectCollaborator",
    targetId: collaboratorId,
    request: requestContext,
    metadata: { projectId },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
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
