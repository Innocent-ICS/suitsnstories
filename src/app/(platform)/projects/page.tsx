import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NewProjectButton } from "./new-project";
import {
  FolderIcon,
  ClockIcon,
  UserIcon,
} from "@/components/icons/app-icons";

const PROJECT_LIST_LIMIT = 50;

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const role = user?.role || "CLIENT";

  // Role-aware query
  let projects;
  if (role === "ADMIN") {
    projects = await db.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: PROJECT_LIST_LIMIT,
      include: {
        client: { select: { id: true, name: true, image: true } },
        coach: { select: { id: true, name: true, image: true } },
        collaborators: { where: { userId: session.user.id }, select: { role: true } },
        _count: { select: { deliverables: true, comments: true, collaborators: true } },
      },
    });
  } else if (role === "COACH") {
    projects = await db.project.findMany({
      where: { coachId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: PROJECT_LIST_LIMIT,
      include: {
        client: { select: { id: true, name: true, image: true } },
        coach: { select: { id: true, name: true, image: true } },
        collaborators: { where: { userId: session.user.id }, select: { role: true } },
        _count: { select: { deliverables: true, comments: true, collaborators: true } },
      },
    });
  } else {
    projects = await db.project.findMany({
      where: {
        OR: [
          { clientId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PROJECT_LIST_LIMIT,
      include: {
        client: { select: { id: true, name: true, image: true } },
        coach: { select: { id: true, name: true, image: true } },
        collaborators: { where: { userId: session.user.id }, select: { role: true } },
        _count: { select: { deliverables: true, comments: true, collaborators: true } },
      },
    });
  }

  const statusStyles: Record<string, string> = {
    BRIEF: "bg-blue-500/10 text-blue-600",
    IN_PROGRESS: "bg-amber-500/10 text-amber-600",
    REVIEW: "bg-purple-500/10 text-purple-600",
    REVISION: "bg-orange-500/10 text-orange-600",
    COMPLETED: "bg-emerald-500/10 text-emerald-600",
    ARCHIVED: "bg-muted text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    BRIEF: "Brief",
    IN_PROGRESS: "In Progress",
    REVIEW: "In Review",
    REVISION: "Revision",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {role === "COACH"
              ? "Pitch projects assigned to you."
              : role === "ADMIN"
              ? "All platform projects."
              : role === "PROGRAM_MANAGER"
              ? "Your program and company pitch projects."
              : "Your pitch projects and deliverables."}
          </p>
        </div>
        {(role === "CLIENT" || role === "PROGRAM_MANAGER") && <NewProjectButton />}
      </div>

      {projects.length === PROJECT_LIST_LIMIT && (
        <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          Showing the {PROJECT_LIST_LIMIT} most recently updated projects.
        </p>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {role === "CLIENT" || role === "PROGRAM_MANAGER"
              ? "No projects yet. Create one to start your pitch journey."
              : "No projects assigned to you yet."}
          </p>
          {(role === "CLIENT" || role === "PROGRAM_MANAGER") && (
            <div className="mt-4">
              <NewProjectButton />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{project.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusStyles[project.status] || "bg-muted"
                      }`}
                    >
                      {statusLabels[project.status] || project.status}
                    </span>
                    {project.collaborators.length > 0 && (
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-600">
                        Shared
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {project.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    {/* Show client name for coaches/admins */}
                    {role !== "CLIENT" && (
                      <span className="flex items-center gap-1">
                        <UserAvatar src={project.client.image} name={project.client.name} size="sm" className="!h-4 !w-4" />
                        {project.client.name}
                      </span>
                    )}
                    {/* Show coach for clients/admins */}
                    {project.coach && role !== "COACH" && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5" />
                        Coach: {project.coach.name}
                      </span>
                    )}
                    <span>{project._count.deliverables} deliverables</span>
                    <span>{project._count.comments} comments</span>
                    {project._count.collaborators > 0 && (
                      <span>{project._count.collaborators} collaborators</span>
                    )}
                    {project.dueDate && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        Due {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
