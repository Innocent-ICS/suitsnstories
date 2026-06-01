import { db } from "@/lib/db";
import { auth } from "@/auth";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BookingActions } from "./booking-actions";
import { CalendarButtons } from "./calendar-buttons";
import { isBookableStaffRole } from "@/lib/booking-roles";
import {
  ClockIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default async function BookingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;
  const role = user?.role || "CLIENT";
  const isSessionLead = isBookableStaffRole(role);

  // Get active services
  const services = await db.serviceOffering.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // Get bookings based on role
  const bookings = userId
    ? await db.booking.findMany({
        where: isSessionLead
          ? { coachId: userId }  // Session leads see incoming bookings
          : { clientId: userId }, // Clients see their own bookings
        orderBy: { startTime: "desc" },
        include: {
          service: true,
          coach: { select: { name: true, image: true } },
          client: { select: { name: true, image: true, email: true } },
        },
        take: 20,
      })
    : [];

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => b.startTime > now && b.status !== "CANCELLED"
  );
  const pastBookings = bookings.filter(
    (b) => b.startTime <= now || b.status === "CANCELLED"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-2">
          {isSessionLead
            ? "Your upcoming client sessions and booking requests."
            : "Book a consultation, diagnostic session, or workshop."}
        </p>
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {isSessionLead ? "Upcoming Client Sessions" : "Upcoming Sessions"}
          </h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
                    <DateTile date={booking.startTime} />

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-medium text-foreground">
                            {booking.service.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                              <ClockIcon className="h-4 w-4" />
                              {new Date(booking.startTime).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {new Date(booking.endTime).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                              <UserIcon className="h-4 w-4" />
                              {isSessionLead
                                ? `${booking.client.name || "Client"} · ${booking.client.email || "No email"}`
                                : `with ${booking.coach.name || "Coach"}`}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="flex items-center gap-3">
                        {isSessionLead ? (
                          <UserAvatar src={booking.client.image} name={booking.client.name} size="md" />
                        ) : (
                          <UserAvatar src={booking.coach.image} name={booking.coach.name} size="md" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {isSessionLead ? booking.client.name || "Client" : booking.coach.name || "Coach"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isSessionLead ? "Client session" : "Your session lead"}
                          </p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                          <p className="text-sm italic leading-relaxed text-muted-foreground">
                            &ldquo;{booking.notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 border-t border-border pt-4 lg:w-64 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Add to calendar
                      </p>
                      <CalendarButtons
                        title={booking.service.title}
                        coachName={booking.coach.name || "Coach"}
                        startTime={booking.startTime.toISOString()}
                        endTime={booking.endTime.toISOString()}
                        notes={booking.notes}
                        variant="full"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {/* Coach actions: confirm, complete, no-show */}
                    {isSessionLead && booking.status === "PENDING" && (
                      <BookingActions bookingId={booking.id} actions={["CONFIRMED", "CANCELLED"]} />
                    )}
                    {isSessionLead && booking.status === "CONFIRMED" && (
                      <BookingActions bookingId={booking.id} actions={["COMPLETED", "NO_SHOW"]} />
                    )}
                    {/* Client can cancel */}
                    {!isSessionLead && booking.status !== "CANCELLED" && (
                      <BookingActions bookingId={booking.id} actions={["CANCELLED"]} />
                    )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available services — only for clients */}
      {!isSessionLead && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-foreground">Available Services</h2>
          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No services available yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/bookings/${service.slug}`}
                  className="group block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {service.description || "Book a session"}
                  </p>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      {service.duration} min
                    </span>
                    <span className="font-medium">
                      {service.price === 0 ? (
                        <span className="text-emerald-600">Free</span>
                      ) : (
                        <span>GH₵{(service.price / 100).toFixed(0)}</span>
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-muted-foreground">Past Sessions</h2>
          <div className="space-y-2">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={isSessionLead ? booking.client.image : booking.coach.image}
                    name={isSessionLead ? booking.client.name : booking.coach.name}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{booking.service.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.startTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {isSessionLead ? booking.client.name : `with ${booking.coach.name}`}
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DateTile({ date }: { date: Date }) {
  return (
    <div className="flex h-24 w-full shrink-0 items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 sm:w-24 sm:flex-col sm:justify-center sm:px-3">
      <span className="text-xs font-medium uppercase tracking-wider text-primary">
        {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
      </span>
      <span className="font-serif text-3xl text-foreground">
        {new Date(date).toLocaleDateString("en-US", { day: "2-digit" })}
      </span>
      <span className="text-xs text-muted-foreground">
        {new Date(date).toLocaleDateString("en-US", { month: "short" })}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
    CONFIRMED: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
    CANCELLED: "bg-red-500/10 text-red-500",
    COMPLETED: "bg-blue-500/10 text-blue-600",
    NO_SHOW: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || "bg-muted"}`}>
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}
