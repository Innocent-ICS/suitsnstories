"use client";

import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface CalendarButtonProps {
  title: string;
  coachName: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  variant?: "compact" | "full";
}

function generateIcs({ title, coachName, startTime, endTime, notes }: CalendarButtonProps) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Suits & Stories//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${start.getTime()}-${title.replace(/\s+/g, "-").toLowerCase()}@suitsandstories`,
    `DTSTART:${start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTEND:${end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `SUMMARY:${title} — ${coachName}`,
    `DESCRIPTION:${notes || "Session booked via Suits & Stories"}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "suits-stories-session.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function getGoogleCalUrl({ title, coachName, startTime, endTime, notes }: CalendarButtonProps) {
  const start = new Date(startTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(endTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${title} — ${coachName}`)}&dates=${start}/${end}&details=${encodeURIComponent(notes || "Session booked via Suits & Stories")}`;
}

export function CalendarButtons(props: CalendarButtonProps) {
  const isFull = props.variant === "full";

  return (
    <div className={`flex flex-wrap gap-2 ${isFull ? "" : "justify-start"}`}>
      <button
        onClick={() => generateIcs(props)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 font-medium text-foreground transition-colors hover:bg-muted ${
          isFull ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
        }`}
        title="Download a calendar file for Apple Calendar, Outlook, or other calendar apps"
      >
        <ArrowDownTrayIcon className={isFull ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {isFull ? "Apple / Outlook" : "Calendar file"}
      </button>
      <a
        href={getGoogleCalUrl(props)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 font-medium text-foreground transition-colors hover:bg-muted ${
          isFull ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
        }`}
        title="Add to Google Calendar"
      >
        <CalendarDaysIcon className={isFull ? "h-4 w-4" : "h-3.5 w-3.5"} />
        Google
      </a>
    </div>
  );
}
