import { getWeekStartDate, formatDateToISO } from "@/lib/utils/date";

export const MAX_WEEKS_AHEAD = 12;

export function validateWeekStartDate(targetDate: string): string {
  const target = new Date(targetDate + "T00:00:00");
  if (isNaN(target.getTime())) {
    throw new Error(`Invalid date: ${targetDate}`);
  }

  if (target.getDay() !== 1) {
    throw new Error(`targetWeekStartDate must be a Monday (got ${targetDate})`);
  }

  const currentWeekMonday = getWeekStartDate(0);
  if (target < currentWeekMonday) {
    throw new Error("Cannot create plans for past weeks");
  }

  const maxDate = new Date(currentWeekMonday);
  maxDate.setDate(maxDate.getDate() + MAX_WEEKS_AHEAD * 7);
  if (target > maxDate) {
    throw new Error(
      `Cannot create plans more than ${MAX_WEEKS_AHEAD} weeks ahead (max: ${formatDateToISO(maxDate)})`,
    );
  }

  return targetDate;
}
