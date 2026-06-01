import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@/types/auth";
import { isBookableStaffRole } from "@/lib/booking-roles";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PaymentBanner } from "./payment-banner";

export default async function DashboardPage() {
  const session = await auth();
  
  // Redirect if no valid session
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, profile: true },
  });

  // Redirect if user not found in database
  if (!user) {
    redirect("/auth/signin");
  }

  const role = (user.role ?? "CLIENT") as UserRole;

  // Fetch real stats for admin
  let adminStats = { users: 0, courses: 0, inquiries: 0, bookings: 0 };
  if (role === "ADMIN") {
    try {
      const [users, courses, inquiries, bookings] = await Promise.all([
        db.user.count(),
        db.course.count({ where: { status: "PUBLISHED" } }),
        db.inquiry.count({ where: { status: "new" } }),
        db.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      ]);
      adminStats = { users, courses, inquiries, bookings };
    } catch (err) {
      console.error("[DASHBOARD] Failed to fetch admin stats:", err);
    }
  }

  // Fetch upcoming bookings count for bookable staff
  let upcomingCount = 0;
  if (isBookableStaffRole(role) && session?.user?.id) {
    try {
      upcomingCount = await db.booking.count({
        where: { coachId: session.user.id, status: { in: ["PENDING", "CONFIRMED"] }, startTime: { gte: new Date() } },
      });
    } catch (err) {
      console.error("[DASHBOARD] Failed to fetch upcoming bookings:", err);
    }
  }

  let programStats = { programs: 0, seats: 0, pending: 0 };
  if (role === "PROGRAM_MANAGER" && session?.user?.id) {
    try {
      const programs = await db.acceleratorProgram.findMany({
        where: { managerId: session.user.id },
        select: { seatsPurchased: true, status: true },
      });
      programStats = {
        programs: programs.length,
        seats: programs.reduce((sum, program) => sum + program.seatsPurchased, 0),
        pending: programs.filter((program) => program.status === "PENDING_PAYMENT").length,
      };
    } catch (err) {
      console.error("[DASHBOARD] Failed to fetch program stats:", err);
    }
  }

  // Fetch project count for clients
  let projectCount = 0;
  let enrollmentCount = 0;
  let nextAction: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    cta: string;
  } | null = null;
  if (role === "CLIENT" && session?.user?.id) {
    try {
      const [projects, enrollments, upcomingBooking] = await Promise.all([
        db.project.count({ where: { clientId: session.user.id } }),
        db.enrollment.findMany({
          where: { userId: session.user.id },
          orderBy: { updatedAt: "desc" },
          include: {
            progress: {
              where: { completed: true },
              select: { lessonId: true },
            },
            course: {
              include: {
                modules: {
                  orderBy: { order: "asc" },
                  include: { lessons: { orderBy: { order: "asc" } } },
                },
              },
            },
          },
        }),
        db.booking.findFirst({
          where: {
            clientId: session.user.id,
            status: { in: ["PENDING", "CONFIRMED"] },
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          include: {
            service: { select: { title: true } },
            coach: { select: { name: true } },
          },
        }),
      ]);
      projectCount = projects;
      enrollmentCount = enrollments.length;

      const courseToResume = enrollments
        .map((enrollment) => {
          const completedLessonIds = new Set(enrollment.progress.map((p) => p.lessonId));
          const nextLesson = enrollment.course.modules
            .flatMap((module) => module.lessons)
            .find((lesson) => !completedLessonIds.has(lesson.id));
          return nextLesson
            ? {
                title: enrollment.course.title,
                lessonTitle: nextLesson.title,
                href: `/learn/${enrollment.course.slug}/${nextLesson.id}`,
              }
            : null;
        })
        .find(Boolean);

      if (courseToResume) {
        nextAction = {
          eyebrow: "Continue learning",
          title: courseToResume.lessonTitle,
          description: `Resume ${courseToResume.title} from your next incomplete lesson.`,
          href: courseToResume.href,
          cta: "Open lesson",
        };
      } else if (upcomingBooking) {
        nextAction = {
          eyebrow: "Next session",
          title: upcomingBooking.service?.title ?? "Upcoming session",
          description: `${new Date(upcomingBooking.startTime).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })} with ${upcomingBooking.coach?.name || "your coach"}. Add notes or calendar details from bookings.`,
          href: "/bookings",
          cta: "View session",
        };
      } else if (projectCount === 0) {
        nextAction = {
          eyebrow: "Start your workspace",
          title: "Create your first pitch project",
          description: "Give the team one place to track your brief, deliverables, and feedback.",
          href: "/projects",
          cta: "Create project",
        };
      } else {
        nextAction = {
          eyebrow: "Keep momentum",
          title: "Book your next strategy session",
          description: "Pair your self-paced work with a focused coach review.",
          href: "/bookings",
          cta: "Find a time",
        };
      }
    } catch (err) {
      console.error("[DASHBOARD] Failed to fetch client data:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Payment status banner */}
      <Suspense>
        <PaymentBanner />
      </Suspense>

      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-serif text-foreground">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-muted-foreground mt-2">
          {role === "ADMIN"
            ? "Here's an overview of your platform."
            : role === "COACH"
              ? "Here are your upcoming coaching sessions."
            : role === "PERCEPTION_ENGINEER"
                ? "Here are your assigned projects."
                : role === "PROGRAM_MANAGER"
                  ? "Here are your accelerator programs and cohorts."
                : "Here's your pitch optimization journey."}
        </p>
      </div>

      {/* Quick actions — role specific */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === "CLIENT" && (
          <>
            <QuickAction
              title="Courses"
              description={`${enrollmentCount} enrolled — browse the pitch curriculum`}
              href="/learn"
              accent="blue"
            />
            <QuickAction
              title="Book a Session"
              description="Schedule a consultation or workshop"
              href="/bookings"
              accent="green"
            />
            <QuickAction
              title="My Projects"
              description={`${projectCount} active — manage your pitch deliverables`}
              href="/projects"
              accent="amber"
            />
            <QuickAction
              title="Perceptoscope"
              description="Diagnose story, design, and investor readiness"
              href="/diagnostic"
              accent="purple"
            />
          </>
        )}
        {role === "COACH" && (
          <>
            <QuickAction
              title="Upcoming Sessions"
              description={`${upcomingCount} sessions scheduled`}
              href="/bookings"
              accent="green"
            />
            <QuickAction
              title="Client Projects"
              description="View assigned pitch projects"
              href="/projects"
              accent="amber"
            />
          </>
        )}
        {role === "PERCEPTION_ENGINEER" && (
          <>
            <QuickAction
              title="Assigned Projects"
              description="Projects needing your expertise"
              href="/projects"
              accent="amber"
            />
            <QuickAction
              title="Upcoming Sessions"
              description={`${upcomingCount} sessions scheduled`}
              href="/bookings"
              accent="green"
            />
          </>
        )}
        {role === "PROGRAM_MANAGER" && (
          <>
            <QuickAction
              title="Programs"
              description={`${programStats.programs} cohorts · ${programStats.seats} seats`}
              href="/programs"
              accent="blue"
            />
            <QuickAction
              title="Pending Packages"
              description={`${programStats.pending} awaiting payment`}
              href="/programs"
              accent="amber"
            />
            <QuickAction
              title="Projects"
              description="Track founder pitch projects"
              href="/projects"
              accent="green"
            />
            <QuickAction
              title="Courses"
              description="Review available pitch curriculum"
              href="/learn"
              accent="purple"
            />
            <QuickAction
              title="Upcoming Sessions"
              description={`${upcomingCount} sessions scheduled`}
              href="/bookings"
              accent="green"
            />
          </>
        )}
        {role === "ADMIN" && (
          <>
            <StatCard title="Total Users" value={adminStats.users} subtitle="Platform users" />
            <StatCard title="Active Courses" value={adminStats.courses} subtitle="Published" />
            <StatCard title="Open Inquiries" value={adminStats.inquiries} subtitle="Awaiting response" />
            <StatCard title="Active Bookings" value={adminStats.bookings} subtitle="Upcoming sessions" />
          </>
        )}
      </div>

      {nextAction && <NextActionCard action={nextAction} />}

      {/* Admin quick links */}
      {role === "ADMIN" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <QuickAction title="Manage Content" description="Courses & lessons" href="/content" accent="blue" />
          <QuickAction title="Programs" description="Cohorts & bulk seats" href="/programs" accent="green" />
          <QuickAction title="Manage Services" description="Bookable offerings" href="/services-admin" accent="green" />
          <QuickAction title="Manage Users" description="Roles & profiles" href="/clients" accent="purple" />
          <QuickAction title="View Inquiries" description="Contact form submissions" href="/inquiries" accent="amber" />
        </div>
      )}

      {/* Profile completion prompt */}
      {!user?.profile && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-foreground">Complete your profile</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your company and industry so we can personalize your experience.
              </p>
            </div>
            <a
              href="/settings"
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Set up profile
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  accent: string;
}) {
  const accentColors: Record<string, string> = {
    purple: "border-purple-500/20 hover:border-purple-500/40",
    blue: "border-blue-500/20 hover:border-blue-500/40",
    green: "border-emerald-500/20 hover:border-emerald-500/40",
    amber: "border-amber-500/20 hover:border-amber-500/40",
  };

  return (
    <a
      href={href}
      className={`block p-5 rounded-xl border bg-card transition-all duration-200 hover:shadow-md ${accentColors[accent] || "border-border"}`}
    >
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </a>
  );
}

function NextActionCard({
  action,
}: {
  action: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    cta: string;
  };
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {action.eyebrow}
          </p>
          <h2 className="mt-1 font-medium text-foreground">{action.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {action.description}
          </p>
        </div>
        <a
          href={action.href}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {action.cta}
        </a>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-semibold text-foreground mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
    </div>
  );
}
