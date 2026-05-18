import { db } from "@/lib/db";
import { ServiceManager } from "./service-manager";

export default async function AdminServicesPage() {
  const services = await db.serviceOffering.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Services</h1>
        <p className="text-muted-foreground mt-1">
          Manage bookable services, consultations, and workshops.
        </p>
      </div>

      <ServiceManager
        services={services.map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          description: s.description,
          duration: s.duration,
          price: s.price,
          currency: s.currency,
          isActive: s.isActive,
          bookingCount: s._count.bookings,
        }))}
      />
    </div>
  );
}
