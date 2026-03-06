import {
  getWeekStartDate,
  getWeekDates,
  formatDateToISO,
  formatDateDisplay,
  getDayOfWeek,
  getDayName,
} from "../date";
import { DayOfWeek } from "@/types/workout";

describe("date utilities", () => {
  describe("getWeekStartDate", () => {
    it("should return Monday of current week when offset is 0", () => {
      const monday = getWeekStartDate(0);
      const dayOfWeek = monday.getDay();

      expect(dayOfWeek).toBe(1); // Monday is 1
      expect(monday.getHours()).toBe(0);
      expect(monday.getMinutes()).toBe(0);
      expect(monday.getSeconds()).toBe(0);
      expect(monday.getMilliseconds()).toBe(0);
    });

    it("should return Monday of next week when offset is 1", () => {
      const currentWeekMonday = getWeekStartDate(0);
      const nextWeekMonday = getWeekStartDate(1);

      const diffInDays = Math.round(
        (nextWeekMonday.getTime() - currentWeekMonday.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      expect(diffInDays).toBe(7);
      expect(nextWeekMonday.getDay()).toBe(1);
    });

    it("should return Monday of previous week when offset is -1", () => {
      const currentWeekMonday = getWeekStartDate(0);
      const previousWeekMonday = getWeekStartDate(-1);

      const diffInDays = Math.round(
        (currentWeekMonday.getTime() - previousWeekMonday.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      expect(diffInDays).toBe(7);
      expect(previousWeekMonday.getDay()).toBe(1);
    });

    it("should handle offset of multiple weeks", () => {
      const currentWeekMonday = getWeekStartDate(0);
      const futureMonday = getWeekStartDate(4);

      const diffInDays = Math.round(
        (futureMonday.getTime() - currentWeekMonday.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      expect(diffInDays).toBe(28);
      expect(futureMonday.getDay()).toBe(1);
    });
  });

  describe("getWeekDates", () => {
    it("should return 7 dates starting from the provided date", () => {
      const weekStart = new Date("2024-01-01"); // Monday
      const weekDates = getWeekDates(weekStart);

      expect(weekDates).toHaveLength(7);
      expect(weekDates[0].getDate()).toBe(1);
      expect(weekDates[6].getDate()).toBe(7);
    });

    it("should return consecutive dates", () => {
      const weekStart = new Date("2025-01-01");
      const weekDates = getWeekDates(weekStart);

      for (let i = 1; i < weekDates.length; i++) {
        const prevDate = weekDates[i - 1];
        const currentDate = weekDates[i];

        const diffInMs = currentDate.getTime() - prevDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        expect(diffInDays).toBe(1);
      }
    });

    it("should handle month boundaries", () => {
      const weekStart = new Date("2025-01-29"); // Monday
      const weekDates = getWeekDates(weekStart);

      expect(weekDates[0].getMonth()).toBe(0); // January
      expect(weekDates[6].getMonth()).toBe(1); // February
    });

    it("should not mutate the original date", () => {
      const weekStart = new Date("2024-01-01");
      const originalTime = weekStart.getTime();

      getWeekDates(weekStart);

      expect(weekStart.getTime()).toBe(originalTime);
    });

    it("should return dates in the correct order Monday to Sunday", () => {
      const weekStart = new Date("2024-01-01"); // Monday
      const weekDates = getWeekDates(weekStart);

      expect(weekDates[0].getDay()).toBe(1);
      expect(weekDates[1].getDay()).toBe(2);
      expect(weekDates[2].getDay()).toBe(3);
      expect(weekDates[3].getDay()).toBe(4);
      expect(weekDates[4].getDay()).toBe(5);
      expect(weekDates[5].getDay()).toBe(6);
      expect(weekDates[6].getDay()).toBe(0);
    });
  });

  describe("formatDateToISO", () => {
    it("should format date to YYYY-MM-DD string", () => {
      const date = new Date("2024-01-15");
      expect(formatDateToISO(date)).toBe("2024-01-15");
    });

    it("should handle leap year dates", () => {
      const date = new Date("2024-02-29");
      expect(formatDateToISO(date)).toBe("2024-02-29");
    });
  });

  describe("formatDateDisplay", () => {
    it("should format date with short month and day", () => {
      const date = new Date("2024-01-15");
      const formatted = formatDateDisplay(date);

      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
    });

    it("should not pad single digit days", () => {
      const date = new Date("2024-01-05");
      const formatted = formatDateDisplay(date);

      expect(formatted).toMatch(/5/);
      expect(formatted).not.toMatch(/05/); // Jan 05
    });
  });

  describe("getDayOfWeek", () => {
    it("should handle different years", () => {
      expect(getDayOfWeek(new Date("2023-01-01"))).toBe("sunday");
      expect(getDayOfWeek(new Date("2024-01-01"))).toBe("monday");
      expect(getDayOfWeek(new Date("2025-01-01"))).toBe("wednesday");
    });
  });

  describe("getDayName", () => {
    it("should handle all valid DayOfWeek values", () => {
      const days: DayOfWeek[] = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      days.forEach((day) => {
        const name = getDayName(day);
        expect(name).toBeTruthy();
        expect(name.charAt(0)).toBe(name.charAt(0).toUpperCase());
      });
    });
  });

  describe("integration tests", () => {
    it("should create a full week schedule", () => {
      const weekStart = getWeekStartDate(0);
      const weekDates = getWeekDates(weekStart);

      weekDates.forEach((date) => {
        const dayOfWeek = getDayOfWeek(date);
        const dayName = getDayName(dayOfWeek);
        const isoDate = formatDateToISO(date);
        const displayDate = formatDateDisplay(date);

        expect(dayOfWeek).toBeTruthy();
        expect(dayName).toBeTruthy();
        expect(isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(displayDate).toBeTruthy();
      });
    });

    it("should navigate between weeks correctly", () => {
      const currentWeek = getWeekStartDate(0);
      const previousWeek = getWeekStartDate(-1);
      const nextWeek = getWeekStartDate(1);

      const currentDates = getWeekDates(currentWeek);
      const previousDates = getWeekDates(previousWeek);
      const nextDates = getWeekDates(nextWeek);

      expect(currentDates).toHaveLength(7);
      expect(previousDates).toHaveLength(7);
      expect(nextDates).toHaveLength(7);

      // Check that weeks don't overlap
      expect(previousDates[6].getTime()).toBeLessThan(
        currentDates[0].getTime(),
      );
      expect(currentDates[6].getTime()).toBeLessThan(nextDates[0].getTime());
    });
  });
});
