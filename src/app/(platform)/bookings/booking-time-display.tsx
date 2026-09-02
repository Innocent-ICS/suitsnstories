"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ClockIcon } from "@/components/icons/app-icons";

interface BookingTimeDisplayProps {
  startTime: string;
  endTime: string;
  variant?: "full" | "compact";
}

/**
 * Client component that renders booking times in the user's local timezone.
 * Server-rendered times would use the server's timezone (UTC on Vercel),
 * so we must detect and display the user's local timezone on the client.
 */
export function BookingTimeDisplay({ startTime, endTime, variant = "full" }: BookingTimeDisplayProps) {
  const timeZone = useClientTimeZone();
  const { timeRange, timezone, tzAbbr } = useMemo(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone,
      });

    const abbr = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    })
      .formatToParts(start)
      .find((p) => p.type === "timeZoneName")?.value || timeZone;

    return {
      timeRange: `${fmt(start)} – ${fmt(end)}`,
      timezone: timeZone,
      tzAbbr: abbr,
    };
  }, [startTime, endTime, timeZone]);

  const timezoneLabel = timezone === "UTC" ? tzAbbr : `${tzAbbr} · ${timezone}`;

  if (variant === "compact") {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground">
        {timeRange}
        <span className="truncate text-xs opacity-70">({tzAbbr})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm text-muted-foreground">
      <ClockIcon className="h-4 w-4" />
      <span className="shrink-0">{timeRange}</span>
      <span className="truncate text-xs font-medium opacity-70">({timezoneLabel})</span>
    </span>
  );
}

/**
 * Client-side date tile that renders in the user's local timezone.
 */
export function DateTileClient({ dateIso }: { dateIso: string }) {
  const timeZone = useClientTimeZone();
  const { weekday, day, month } = useMemo(() => {
    const d = new Date(dateIso);
    return {
      weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone }),
      day: d.toLocaleDateString("en-US", { day: "2-digit", timeZone }),
      month: d.toLocaleDateString("en-US", { month: "short", timeZone }),
    };
  }, [dateIso, timeZone]);

  return (
    <div className="flex h-24 w-full shrink-0 items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 sm:w-24 sm:flex-col sm:justify-center sm:px-3">
      <span className="text-xs font-medium uppercase tracking-wider text-primary">
        {weekday}
      </span>
      <span className="font-serif text-3xl text-foreground">
        {day}
      </span>
      <span className="text-xs text-muted-foreground">
        {month}
      </span>
    </div>
  );
}

/**
 * Client-side compact date display for past bookings.
 */
export function BookingDateCompact({ dateIso }: { dateIso: string }) {
  const timeZone = useClientTimeZone();
  const formatted = useMemo(() => {
    return new Date(dateIso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone,
    });
  }, [dateIso, timeZone]);

  return <>{formatted}</>;
}

export function BookingDateDisplay({ dateIso }: { dateIso: string }) {
  const timeZone = useClientTimeZone();
  const formatted = useMemo(() => {
    return new Date(dateIso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone,
    });
  }, [dateIso, timeZone]);

  return <>{formatted}</>;
}

function useClientTimeZone() {
  return useSyncExternalStore(
    subscribeToTimeZone,
    getClientTimeZoneSnapshot,
    getServerTimeZoneSnapshot
  );
}

function subscribeToTimeZone() {
  return () => undefined;
}

function getClientTimeZoneSnapshot() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function getServerTimeZoneSnapshot() {
  return "UTC";
}
