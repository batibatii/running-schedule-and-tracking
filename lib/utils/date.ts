import { DayOfWeek } from "@/types/workout";

export function getWeekStartDate(weekOffset: number = 0): Date {
  const today = new Date();
  const currentDay = today.getDay();

  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday + weekOffset * 7);

  monday.setHours(0, 0, 0, 0);

  return monday;
}

export function getWeekDates(weekStartDate: Date): Date[] {
  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    dates.push(date);
  }

  return dates;
}

// Format a date to YYYY-MM-DD string (using local timezone)
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date for display (e.g., "Jan 8")
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

export function getDayName(dayOfWeek: DayOfWeek): string {
  const names: Record<DayOfWeek, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };
  return names[dayOfWeek];
}

/** Format total minutes into a compact string like "1h 30m", "45m", or "2h" */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}
