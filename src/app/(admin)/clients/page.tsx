import { db } from "@/lib/db";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleChanger } from "./role-changer";

export default async function AdminClientsPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { profile: true },
  });

  const roleCounts = {
    total: users.length,
    clients: users.filter((u) => u.role === "CLIENT").length,
    coaches: users.filter((u) => u.role === "COACH").length,
    engineers: users.filter((u) => u.role === "PERCEPTION_ENGINEER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and their roles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={roleCounts.total} />
        <StatCard label="Clients" value={roleCounts.clients} />
        <StatCard label="Coaches" value={roleCounts.coaches} />
        <StatCard label="Engineers" value={roleCounts.engineers} />
        <StatCard label="Admins" value={roleCounts.admins} />
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
