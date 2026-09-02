import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  RocketLaunchIcon,
  UserGroupIcon,
} from "@/components/icons/app-icons";
import {
  AddProgramMemberForm,
  NewProgramButton,
  ProgramPaymentButton,
  RemoveProgramMemberButton,
} from "./program-actions";

const statusStyles: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
  ARCHIVED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Payment pending",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";
  const isProgramManager = user?.role === "PROGRAM_MANAGER";
  if (!isAdmin && !isProgramManager) redirect("/dashboard");

  const [courses, programs] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, price: true, currency: true },
    }),
    db.acceleratorProgram.findMany({
      where: isAdmin ? {} : { managerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        course: { select: { title: true } },
        manager: { select: { name: true, email: true } },
        members: {
          where: { status: { not: "REMOVED" } },
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true, email: true } } },
        },
        payment: { select: { status: true } },
      },
    }),
  ]);

  const totalSeats = programs.reduce((sum, program) => sum + program.seatsPurchased, 0);
  const assignedSeats = programs.reduce((sum, program) => sum + program.members.length, 0);
  const activePrograms = programs.filter((program) => program.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Programs</h1>
          <p className="mt-1 text-muted-foreground">
            Manage accelerator cohorts, course seats, and entrepreneur access.
          </p>
        </div>
        <NewProgramButton courses={courses} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<RocketLaunchIcon />} label="Programs" value={programs.length} />
        <StatCard icon={<CheckCircleIcon />} label="Active" value={activePrograms} />
        <StatCard icon={<UserGroupIcon />} label="Seats Assigned" value={`${assignedSeats}/${totalSeats}`} />
      </div>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
          <RocketLaunchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            No accelerator programs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => {
            const assigned = program.members.length;
            const activeMembers = program.members.filter((member) => member.status === "ACTIVE").length;
            const seatPct = program.seatsPurchased > 0
              ? Math.round((assigned / program.seatsPurchased) * 100)
              : 0;

            return (
              <section
                key={program.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
                  <div className="min-w-0 space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-medium text-foreground">
                            {program.name}
                          </h2>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[program.status]}`}>
                            {statusLabels[program.status]}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                            <AcademicCapIcon className="h-4 w-4" />
                            {program.course.title}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                            <UserGroupIcon className="h-4 w-4" />
                            {assigned}/{program.seatsPurchased} seats
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                            <ClockIcon className="h-4 w-4" />
                            {new Date(program.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <p className="text-sm text-muted-foreground">
                          {program.manager.name || program.manager.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{activeMembers} active enrollments</span>
                        <span>{seatPct}% assigned</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(seatPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Entrepreneurs</h3>
                      {program.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No seats assigned yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-border rounded-lg border border-border">
                          {program.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {member.user?.name || member.name || member.email}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {member.user?.email || member.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <MemberBadge status={member.status} />
                                <RemoveProgramMemberButton programId={program.id} memberId={member.id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <AddProgramMemberForm programId={program.id} />
                    </div>
                  </div>

                  <aside className="space-y-4 rounded-lg border border-border bg-background/60 p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Package
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {formatMoney(program.packagePrice, program.currency)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {program.seatsPurchased} seats · {program.company}
                      </p>
                    </div>

                    {program.status === "PENDING_PAYMENT" && (
                      <ProgramPaymentButton programId={program.id} />
                    )}

                    {program.payment?.status && (
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Payment
                        </p>
                        <p className="mt-1 text-sm text-foreground capitalize">
                          {program.payment.status.toLowerCase()}
                        </p>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <div className="h-5 w-5">{icon}</div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MemberBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600",
    INVITED: "bg-amber-500/10 text-amber-600",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status.toLowerCase()}
    </span>
  );
}

function formatMoney(amount: number, currency: string) {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
