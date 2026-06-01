import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";
import { getBookableStaffRoles } from "@/lib/booking-roles";
import Link from "next/link";

interface ServiceBookingPageProps {
  params: Promise<{ serviceSlug: string }>;
}

export default async function ServiceBookingPage({ params }: ServiceBookingPageProps) {
  const { serviceSlug } = await params;

  const service = await db.serviceOffering.findUnique({
    where: { slug: serviceSlug, isActive: true },
  });

  if (!service) notFound();

  // Get all bookable staff (availability is checked at slot selection step)
  const coaches = await db.user.findMany({
    where: {
      role: { in: getBookableStaffRoles() },
    },
    select: { id: true, name: true, image: true },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href="/bookings"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to services
        </Link>
        <h1 className="text-3xl font-serif text-foreground mt-4">{service.title}</h1>
        {service.description && (
          <p className="text-muted-foreground mt-2">{service.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
          <span>{service.duration} minutes</span>
          <span>
            {service.price === 0 ? "Free" : `GH₵${(service.price / 100).toFixed(0)}`}
          </span>
        </div>
      </div>

      <BookingForm
        serviceId={service.id}
        serviceDuration={service.duration}
        servicePrice={service.price}
        coaches={coaches.map((c) => ({
          id: c.id,
          name: c.name || "Coach",
          image: c.image,
        }))}
      />
    </div>
  );
}
