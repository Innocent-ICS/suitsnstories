"use client";

import { useRouter } from "next/navigation";
import { updateBookingStatus } from "@/actions/booking";
import { Button } from "@/components/ui/button";

type BookingAction = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

const labels: Record<BookingAction, string> = {
  CONFIRMED: "Confirm",
  CANCELLED: "Cancel",
  COMPLETED: "Complete",
  NO_SHOW: "No-show",
};

const variants: Record<BookingAction, "default" | "outline" | "destructive"> = {
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "outline",
  NO_SHOW: "outline",
};

function isBookingAction(action: string): action is BookingAction {
  return action in labels;
}

export function BookingActions({
  bookingId,
  actions,
}: {
  bookingId: string;
  actions: string[];
}) {
  const router = useRouter();

  async function handle(status: BookingAction) {
    if (status === "CANCELLED" && !confirm("Cancel this booking?")) return;
    await updateBookingStatus(bookingId, status);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        if (!isBookingAction(action)) return null;

        return (
          <Button
            key={action}
            size="sm"
            variant={variants[action]}
            onClick={() => handle(action)}
            className="text-xs"
          >
            {labels[action]}
          </Button>
        );
      })}
    </div>
  );
}
