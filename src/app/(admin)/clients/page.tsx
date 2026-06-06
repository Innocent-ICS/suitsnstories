import { db } from "@/lib/db";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleChanger } from "./role-changer";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminClientsPage() {
  const now = new Date();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
      _count: {
        select: {
          enrollments: true,
          clientBookings: true,
          ownedProjects: true,
        },
      },
      clientBookings: {
        where: {
          startTime: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        orderBy: { startTime: "asc" },
        take: 1,
        include: { service: { select: { title: true } } },
      },
      ownedProjects: {
        where: {
          status: { in: ["BRIEF", "IN_PROGRESS", "REVIEW", "REVISION"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, title: true, status: true, updatedAt: true },
      },
      enrollments: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          completedAt: true,
          course: { select: { title: true } },
        },
      },
    },
  });

  const roleCounts = {
    total: users.length,
    clients: users.filter((u) => u.role === "CLIENT").length,
    coaches: users.filter((u) => u.role === "COACH").length,
    engineers: users.filter((u) => u.role === "PERCEPTION_ENGINEER").length,
    programManagers: users.filter((u) => u.role === "PROGRAM_MANAGER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  };
  const clientUsers = users.filter((u) => u.role === "CLIENT");
  const attentionClients = clientUsers.filter((user) => {
    const hasOpenProject = user.ownedProjects.length > 0;
    const hasUpcomingBooking = user.clientBookings.length > 0;
    return !user.profile || (hasOpenProject && !hasUpcomingBooking);
  }).length;
  const activeProjects = clientUsers.reduce(
    (sum, user) => sum + user.ownedProjects.length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and their roles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total" value={roleCounts.total} />
        <StatCard label="Clients" value={roleCounts.clients} />
        <StatCard label="Coaches" value={roleCounts.coaches} />
        <StatCard label="Engineers" value={roleCounts.engineers} />
        <StatCard label="Program Managers" value={roleCounts.programManagers} />
        <StatCard label="Admins" value={roleCounts.admins} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RelationshipCard
          label="Needs Attention"
          value={attentionClients}
          description="Clients missing a profile or carrying an active project without a booked session."
          accent="amber"
        />
        <RelationshipCard
          label="Active Client Projects"
          value={activeProjects}
          description="Open briefs, in-progress work, reviews, and revisions across client accounts."
          accent="blue"
        />
        <RelationshipCard
          label="Booked Next"
          value={clientUsers.filter((user) => user.clientBookings.length > 0).length}
          description="Clients with a pending or confirmed future session on the calendar."
          accent="green"
        />
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Engagement</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Next Touch</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Health</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={user.image} name={user.name} />
                        <span className="font-medium text-foreground">{user.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleChanger userId={user.id} currentRole={user.role} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.profile?.company || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <MiniMetric value={user._count.enrollments} label="courses" />
                        <MiniMetric value={user._count.clientBookings} label="sessions" />
                        <MiniMetric value={user._count.ownedProjects} label="projects" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <NextTouch user={user} />
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge user={user} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.name}
                        userEmail={user.email}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

function RelationshipCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: number;
  description: string;
  accent: "amber" | "blue" | "green";
}) {
  const styles = {
    amber: "border-amber-500/20",
    blue: "border-blue-500/20",
    green: "border-emerald-500/20",
  };

  return (
    <div className={`rounded-xl border bg-card p-4 ${styles[accent]}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function MiniMetric({ value, label }: { value: number; label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {value} {label}
    </span>
  );
}

function NextTouch({
  user,
}: {
  user: Awaited<ReturnType<typeof db.user.findMany>>[number] & {
    clientBookings: { startTime: Date; service: { title: string } }[];
    ownedProjects: { title: string; status: string; updatedAt: Date }[];
    enrollments: { completedAt: Date | null; course: { title: string } }[];
  };
}) {
  const nextBooking = user.clientBookings[0];
  const activeProject = user.ownedProjects[0];
  const latestEnrollment = user.enrollments[0];

  if (nextBooking) {
    return (
      <div>
        <p className="text-sm text-foreground">{nextBooking.service.title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(nextBooking.startTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  }

  if (activeProject) {
    return (
      <div>
        <p className="text-sm text-foreground">Follow up on project</p>
        <p className="text-xs text-muted-foreground">
          {activeProject.title}
        </p>
      </div>
    );
  }

  if (latestEnrollment) {
    return (
      <div>
        <p className="text-sm text-foreground">
          {latestEnrollment.completedAt ? "Course completed" : "Learning in progress"}
        </p>
        <p className="text-xs text-muted-foreground">
          {latestEnrollment.course.title}
        </p>
      </div>
    );
  }

  return <span className="text-sm text-muted-foreground">No activity yet</span>;
}

function HealthBadge({
  user,
}: {
  user: Awaited<ReturnType<typeof db.user.findMany>>[number] & {
    profile: { company: string | null } | null;
    clientBookings: unknown[];
    ownedProjects: unknown[];
  };
}) {
  const hasOpenProject = user.ownedProjects.length > 0;
  const hasUpcomingBooking = user.clientBookings.length > 0;

  if (!user.profile) {
    return <Badge tone="amber" label="Profile missing" />;
  }

  if (hasOpenProject && !hasUpcomingBooking) {
    return <Badge tone="amber" label="Needs session" />;
  }

  if (hasUpcomingBooking) {
    return <Badge tone="green" label="On calendar" />;
  }

  return <Badge tone="muted" label="Monitor" />;
}

function Badge({ tone, label }: { tone: "amber" | "green" | "muted"; label: string }) {
  const styles = {
    amber: "bg-amber-500/10 text-amber-600",
    green: "bg-emerald-500/10 text-emerald-600",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  );
}
