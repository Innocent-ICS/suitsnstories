import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface CheckoutPageProps {
  params: Promise<{ reference: string }>;
}

type PaymentMeta = {
  type?: string;
  courseTitle?: string;
  serviceTitle?: string;
  coachId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string | null;
  authorizationUrl?: string;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { reference } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/auth/signin");

  const payment = await db.payment.findFirst({
    where: { providerRef: reference, userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!payment) notFound();

  if (payment.status === "SUCCESS") {
    redirect(`/checkout/confirmation?ref=${encodeURIComponent(reference)}&status=success`);
  }

  const meta = payment.providerData as PaymentMeta | null;
  if (!meta?.authorizationUrl) notFound();

  const isBooking = meta.type === "booking";
  const coach = isBooking && meta.coachId
    ? await db.user.findUnique({
        where: { id: meta.coachId },
        select: { name: true },
      })
    : null;

  const title = isBooking
    ? meta.serviceTitle || "Coaching session"
    : meta.courseTitle || "Course enrollment";
  const eyebrow = isBooking ? "Session Checkout" : "Course Checkout";
  const summaryHref = isBooking ? "/bookings" : "/learn";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link href={summaryHref} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Back
        </Link>
        <p className="text-xs font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h1 className="text-3xl font-serif text-foreground">Review and pay</h1>
        <p className="text-muted-foreground">
          Confirm the details below before completing payment.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
              {isBooking ? (
                <CalendarIcon className="h-6 w-6" />
              ) : (
                <CheckCircleIcon className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-medium text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isBooking ? "Your selected coaching session" : "Lifetime access for this account"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Detail label="Account" value={payment.user.email || payment.user.name || "Signed-in user"} />
            <Detail label="Reference" value={reference} />
            {isBooking && meta.startTime && meta.endTime && (
              <>
                <Detail
                  label="Date"
                  value={new Date(meta.startTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <Detail
                  label="Time"
                  value={`${new Date(meta.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })} - ${new Date(meta.endTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`}
                />
              </>
            )}
            {coach?.name && <Detail label="Coach" value={coach.name} />}
          </div>

          {isBooking && meta.notes && (
            <div className="mt-5 rounded-xl border border-border bg-background/60 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Session notes
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {meta.notes}
              </p>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Amount due</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {formatMoney(payment.amount, payment.currency)}
          </p>

          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
              Encrypted payment session
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCardIcon className="h-4 w-4 text-primary" />
              Card, bank, or mobile money
            </div>
          </div>

          <a
            href={meta.authorizationUrl}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Pay securely
          </a>

          <Link
            href={summaryHref}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
