import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarButtons } from "../../bookings/calendar-buttons";
import { BookingDateDisplay, BookingTimeDisplay } from "../../bookings/booking-time-display";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons/app-icons";

interface ConfirmationPageProps {
  searchParams: Promise<{ ref?: string; status?: string; reason?: string }>;
}

type PaymentMeta = {
  type?: string;
  courseTitle?: string;
  programName?: string;
  seatCount?: number;
  serviceTitle?: string;
  coachId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string | null;
};

export default async function CheckoutConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { ref, status, reason } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) redirect("/auth/signin");

  const payment = ref
    ? await db.payment.findFirst({
        where: { providerRef: ref, userId: session.user.id },
      })
    : null;

  const meta = payment?.providerData as PaymentMeta | null;
  const success = status === "success" && payment?.status === "SUCCESS";
  const isBooking = meta?.type === "booking";
  const isProgram = meta?.type === "accelerator_program";
  const coach = isBooking && meta?.coachId
    ? await db.user.findUnique({
        where: { id: meta.coachId },
        select: { name: true },
      })
    : null;

  const title = success
    ? isProgram
      ? "Program package active"
      : isBooking
      ? "Session confirmed"
      : "Enrollment confirmed"
    : "Payment needs attention";
  const description = success
    ? isProgram
      ? "Your accelerator cohort can now access the course."
      : isBooking
      ? "Your coaching session is booked and ready."
      : "Your course access is ready."
    : reason || "We could not complete this payment.";
  const safeDescription = success ? description : publicPaymentDescription(reason);
  const primaryHref = success
    ? isProgram
      ? "/programs"
      : isBooking
      ? "/bookings"
      : "/learn"
    : ref
      ? `/checkout/${encodeURIComponent(ref)}`
      : "/dashboard";
  const primaryLabel = success
    ? isProgram
      ? "View programs"
      : isBooking
      ? "View bookings"
      : "Start learning"
    : "Return to checkout";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className={`rounded-2xl border p-8 text-center ${
        success
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-background">
          {success ? (
            <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
          ) : (
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-600" />
          )}
        </div>
        <h1 className="mt-4 text-3xl font-serif text-foreground">{title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{safeDescription}</p>
      </section>

      {payment && meta && (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 via-emerald-500/5 to-transparent" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </p>
              <h2 className="mt-1 text-xl font-medium text-foreground">
                {isProgram ? meta.programName : isBooking ? meta.serviceTitle : meta.courseTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatMoney(payment.amount, payment.currency)} · {ref}
              </p>
            </div>
            <StatusBadge success={success} />
          </div>

          {success && isProgram && (
            <div className="relative mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
              <Detail label="Course" value={meta.courseTitle || "Pitch course"} />
              <Detail label="Seats" value={`${meta.seatCount || 0} entrepreneurs`} />
            </div>
          )}

          {success && isBooking && meta.startTime && meta.endTime && (
            <div className="mt-5 border-t border-border pt-5">
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <Detail
                  label="Date"
                  value={<BookingDateDisplay dateIso={meta.startTime} />}
                />
                <Detail
                  label="Time"
                  value={
                    <BookingTimeDisplay
                      startTime={meta.startTime}
                      endTime={meta.endTime}
                      variant="compact"
                    />
                  }
                />
              </div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Add to calendar
              </p>
              <CalendarButtons
                title={meta.serviceTitle || "Suits & Stories Session"}
                coachName={coach?.name || "Coach"}
                startTime={meta.startTime}
                endTime={meta.endTime}
                notes={meta.notes || undefined}
                variant="full"
              />
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {primaryLabel}
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ success }: { success: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
      success
        ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
        : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
    }`}>
      {success ? "confirmed" : "pending"}
    </span>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function publicPaymentDescription(reason?: string) {
  if (!reason) return "We could not complete this payment.";
  if (/prisma|database|fatal|querying|connection|max clients|emaxconn/i.test(reason)) {
    return "We could not confirm the payment right now. Please try again in a few minutes.";
  }
  return reason.slice(0, 180);
}
