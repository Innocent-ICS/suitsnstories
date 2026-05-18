"use client";

import { useRouter } from "next/navigation";
import { updateBookingStatus } from "@/actions/booking";
import { Button } from "@/components/ui/button";

const labels: Record<string, string> = {
  CONFIRMED: "Confirm",
  CANCELLED: "Cancel",
  COMPLETED: "Complete",
  NO_SHOW: "No-show",
};

const variants: Record<string, "default" | "outline" | "destructive"> = {
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "outline",
  NO_SHOW: "outline",
};

export function BookingActions({
  bookingId,
  actions,
}: {
  bookingId: string;
  actions: string[];
}) {
  const router = useRouter();

  async function handle(status: string) {
    if (status === "CANCELLED" && !confirm("Cancel this booking?")) return;
    await updateBookingStatus(bookingId, status as any);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      {actions.map((action) => (
        <Button
          key={action}
          size="sm"
          variant={variants[action] || "outline"}
          onClick={() => handle(action)}
          className="text-xs"
        >
          {labels[action] || action}
        </Button>
      ))}
    </div>
  );
}
