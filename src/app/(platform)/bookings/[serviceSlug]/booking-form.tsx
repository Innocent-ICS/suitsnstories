"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getAvailableSlots, createBooking } from "@/actions/booking";
import { initBookingPayment } from "@/actions/payment";
import { CalendarButtons } from "../calendar-buttons";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface Coach {
  id: string;
  name: string;
  image: string | null;
}

interface BookingFormProps {
  serviceId: string;
  serviceDuration: number;
  servicePrice: number;
  coaches: Coach[];
}

export function BookingForm({ serviceId, serviceDuration, servicePrice, coaches }: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"coach" | "date" | "time" | "confirm" | "done">("coach");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTimeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "your local timezone"
  );

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start from tomorrow
    return d.toISOString().split("T")[0];
  });

  async function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime("");
    setLoading(true);

    try {
      const available = await getAvailableSlots(selectedCoach!.id, serviceId, date);
      setSlots(available);
      setStep("time");
    } catch {
      setError("Failed to load available times");
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    setLoading(true);
    setError(null);

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00.000Z`).toISOString();

      if (servicePrice > 0) {
        // Paid booking — open the native checkout first.
        const result = await initBookingPayment(
          serviceId,
          selectedCoach!.id,
          startTime,
          notes || undefined
        );
        if (result.success && result.checkoutUrl) {
          router.push(result.checkoutUrl);
          return;
        } else {
          setError(result.error || "Payment init failed");
        }
      } else {
        // Free booking — book directly
        const result = await createBooking({
          serviceId,
          coachId: selectedCoach!.id,
          startTime,
          notes: notes || undefined,
        });

        if (result.success) {
          setStep("done");
        } else {
          setError(result.error || "Failed to create booking");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function getSlotDate(time = selectedTime) {
    return new Date(`${selectedDate}T${time}:00.000Z`);
  }

  function formatLocalRange(time = selectedTime) {
    const start = getSlotDate(time);
    const end = new Date(start.getTime() + serviceDuration * 60 * 1000);
    return `${start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  if (step === "done") {
    const startDt = new Date(`${selectedDate}T${selectedTime}:00.000Z`);
    const endDt = new Date(startDt.getTime() + serviceDuration * 60 * 1000);
    const dateStr = startDt.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const timeStr = `${selectedTime} – ${endDt.toISOString().slice(11, 16)} (UTC)`;
    const localTimeStr = `${formatLocalRange()} (${localTimeZone})`;

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-3">
          <CheckCircleIcon className="h-14 w-14 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-serif text-foreground">Booking Confirmed!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A confirmation email has been sent. Add this session to your calendar below.
          </p>
        </div>

        {/* Session summary */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-medium text-foreground">Session Details</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Coach</p>
              <p className="font-medium text-foreground">{selectedCoach?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium text-foreground">{serviceDuration} minutes</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{dateStr}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-medium text-foreground">{timeStr}</p>
              <p className="text-xs text-muted-foreground">{localTimeStr}</p>
            </div>
          </div>
          {notes && (
            <div className="border-t border-border pt-3">
              <p className="text-muted-foreground text-sm">Your Notes</p>
              <p className="text-sm text-foreground mt-1">{notes}</p>
            </div>
          )}
        </div>

        {/* Calendar actions */}
        <div className="flex flex-wrap gap-3">
          <CalendarButtons
            title="Suits & Stories Session"
            coachName={selectedCoach?.name || "Coach"}
            startTime={startDt.toISOString()}
            endTime={endDt.toISOString()}
            notes={notes || undefined}
            variant="full"
          />
          <Button onClick={() => router.push("/bookings")} variant="outline">
            View All Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {["Coach", "Date", "Time", "Confirm"].map((label, i) => {
          const stepNames = ["coach", "date", "time", "confirm"];
          const current = stepNames.indexOf(step);
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="hidden h-px w-8 bg-border sm:block" />}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  i <= current
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Select coach */}
      {step === "coach" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Select a Coach</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose who should guide the session. You can add context before confirming.
            </p>
          </div>
          {coaches.length === 0 ? (
            <p className="text-muted-foreground">No coaches available at this time.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {coaches.map((coach) => (
                <button
                  key={coach.id}
                  onClick={() => { setSelectedCoach(coach); setStep("date"); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left"
                >
                  <UserAvatar src={coach.image} name={coach.name} size="md" />
                  <div>
                    <p className="font-medium text-foreground">{coach.name}</p>
                    <p className="text-xs text-muted-foreground">Available for booking</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select date */}
      {step === "date" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">
            Select a Date
            <span className="text-sm text-muted-foreground font-normal ml-2">
              with {selectedCoach?.name}
            </span>
          </h2>
          <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            Times are shown from Suits & Stories availability in UTC, with your local equivalent shown before you confirm.
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
            {dates.map((date) => {
              const d = new Date(date + "T12:00:00");
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  disabled={isWeekend}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isWeekend
                      ? "border-border bg-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className="text-lg font-medium">{d.getDate()}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep("coach")}>
            ← Back
          </Button>
        </div>
      )}

      {/* Step 3: Select time */}
      {step === "time" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">
            Select a Time
            <span className="text-sm text-muted-foreground font-normal ml-2">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Your device timezone: {localTimeZone}
          </p>
          {loading ? (
            <p className="text-muted-foreground">Loading available times...</p>
          ) : slots.length === 0 ? (
            <div className="rounded-lg border border-border p-6 text-center">
              <p className="text-muted-foreground">No available times on this date. Try another date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => { setSelectedTime(slot.time); setStep("confirm"); }}
                  disabled={!slot.available}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                    !slot.available
                      ? "border-border bg-muted/30 text-muted-foreground line-through cursor-not-allowed"
                      : selectedTime === slot.time
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="block">{slot.time} UTC</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground no-underline">
                    {formatLocalRange(slot.time)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setStep("date")}>
            ← Back
          </Button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <div className="space-y-5">
          <h2 className="text-lg font-medium">Confirm Booking</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coach</span>
              <span className="text-foreground font-medium">{selectedCoach?.name}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Time</span>
              <span className="text-right text-foreground">
                {selectedTime} UTC
                <span className="block text-xs text-muted-foreground">
                  {formatLocalRange()} ({localTimeZone})
                </span>
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-foreground">{serviceDuration} minutes</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Goal for the session, current challenge, or link to a pitch draft..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Good prep notes help the coach arrive with a sharper first response.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <Button onClick={handleBook} disabled={loading}>
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
            <Button variant="outline" onClick={() => setStep("time")}>
              ← Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
