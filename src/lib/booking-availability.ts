import { DEFAULT_BOOKING_TIMEZONE } from "@/lib/booking-roles";

export type AvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
};

export const DEFAULT_WEEKDAY_AVAILABILITY = {
  startTime: "09:00",
  endTime: "17:00",
  timezone: DEFAULT_BOOKING_TIMEZONE,
  isActive: true,
} as const;

export function getDefaultAvailabilityForDay(dayOfWeek: number): AvailabilityWindow[] {
  if (dayOfWeek < 1 || dayOfWeek > 5) return [];

  return [
    {
      dayOfWeek,
      ...DEFAULT_WEEKDAY_AVAILABILITY,
    },
  ];
}
