"use client";

import { CalendarIcon } from "@heroicons/react/24/outline";

interface CalendarButtonProps {
  title: string;
  coachName: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
}

function generateIcs({ title, coachName, startTime, endTime, notes }: CalendarButtonProps) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Suits & Stories//Booking//EN",
    "BEGIN:VEVENT",
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
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${title} — ${coachName}`)}&dates=${start}/${end}&details=${encodeURIComponent(notes || "Session")}`;
}

export function CalendarButtons(props: CalendarButtonProps) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => generateIcs(props)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs hover:bg-muted transition-colors"
        title="Download .ics file"
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        .ics
      </button>
      <a
        href={getGoogleCalUrl(props)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs hover:bg-muted transition-colors"
        title="Add to Google Calendar"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8.25h15v11.25z"/>
        </svg>
        GCal
      </a>
    </div>
  );
}
