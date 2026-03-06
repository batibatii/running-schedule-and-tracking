import {
  paceToMinutes,
  calculateDuration,
  minutesToPace,
  formatDuration,
  calculatePaceFromDuration,
} from "../pace";

describe("pace utilities", () => {
  describe("paceToMinutes", () => {
    it("should convert pace string to decimal minutes", () => {
      expect(paceToMinutes("5:00")).toBe(5);
      expect(paceToMinutes("5:30")).toBe(5.5);
      expect(paceToMinutes("6:15")).toBe(6.25);
      expect(paceToMinutes("4:45")).toBe(4.75);
    });

    it("should handle single digit minutes", () => {
      expect(paceToMinutes("3:30")).toBe(3.5);
      expect(paceToMinutes("1:15")).toBe(1.25);
    });

    it("should handle double digit minutes", () => {
      expect(paceToMinutes("12:45")).toBe(12.75);
      expect(paceToMinutes("15:30")).toBe(15.5);
    });

    it("should handle edge case of 59 seconds", () => {
      expect(paceToMinutes("5:59")).toBeCloseTo(5.983, 2);
    });
  });

  describe("calculateDuration", () => {
    it("should calculate duration correctly for whole number pace", () => {
      expect(calculateDuration(5, "5:00")).toBe(25);
      expect(calculateDuration(10, "6:00")).toBe(60);
    });

    it("should calculate duration with decimal precision", () => {
      expect(calculateDuration(5, "5:30")).toBe(27.5);
      expect(calculateDuration(10, "4:45")).toBe(47.5);
    });

    it("should preserve exact decimal values", () => {
      expect(calculateDuration(5, "5:20")).toBeCloseTo(26.667, 2);
      expect(calculateDuration(3, "4:50")).toBe(14.5);
    });

    it("should handle zero distance", () => {
      expect(calculateDuration(0, "5:00")).toBe(0);
    });
  });

  describe("minutesToPace", () => {
    it("should convert decimal minutes to pace string", () => {
      expect(minutesToPace(5)).toBe("5:00");
      expect(minutesToPace(5.5)).toBe("5:30");
      expect(minutesToPace(6.25)).toBe("6:15");
      expect(minutesToPace(4.75)).toBe("4:45");
    });

    it("should pad seconds with leading zero", () => {
      expect(minutesToPace(5.083)).toBe("5:05");
      expect(minutesToPace(6.017)).toBe("6:01");
    });

    it("should handle zero minutes", () => {
      expect(minutesToPace(0)).toBe("0:00");
    });

    it("should handle very small fractions", () => {
      expect(minutesToPace(0.5)).toBe("0:30");
      expect(minutesToPace(0.25)).toBe("0:15");
    });

    it("should round seconds correctly", () => {
      expect(minutesToPace(5.999)).toBe("6:00");
      expect(minutesToPace(5.991)).toBe("5:59");
    });

    it("should handle double digit minutes", () => {
      expect(minutesToPace(12.5)).toBe("12:30");
      expect(minutesToPace(15.75)).toBe("15:45");
    });
  });

  describe("formatDuration", () => {
    it("should format duration under 60 minutes as MM:SS", () => {
      expect(formatDuration(45)).toBe("45:00");
      expect(formatDuration(30.5)).toBe("30:30");
      expect(formatDuration(58.3)).toBe("58:18");
      expect(formatDuration(23.75)).toBe("23:45");
    });

    it("should format duration 60 minutes or more as H:MM:SS", () => {
      expect(formatDuration(60)).toBe("1:00:00");
      expect(formatDuration(72)).toBe("1:12:00");
      expect(formatDuration(120)).toBe("2:00:00");
      expect(formatDuration(120.33)).toBe("2:00:20");
    });

    it("should handle zero duration", () => {
      expect(formatDuration(0)).toBe("0:00");
    });

    it("should round to nearest second", () => {
      // 72.999 minutes = 4379.94 seconds = 1:12:60 -> should round to 1:13:00
      expect(formatDuration(72.999)).toBe("1:13:00");
      expect(formatDuration(58.999)).toBe("59:00");
    });
  });

  describe("calculatePaceFromDuration", () => {
    it("should calculate pace from distance and duration", () => {
      expect(calculatePaceFromDuration(5, 25)).toBe("5:00");
      expect(calculatePaceFromDuration(10, 60)).toBe("6:00");
    });

    it("should calculate pace for fractional distances", () => {
      expect(calculatePaceFromDuration(5.5, 30)).toBe("5:27");
      expect(calculatePaceFromDuration(3.2, 16)).toBe("5:00");
    });

    it("should return empty string for zero distance", () => {
      expect(calculatePaceFromDuration(0, 30)).toBe("");
    });

    it("should round pace correctly", () => {
      // 5km in 26 minutes = 5.2 min/km = 5:12
      expect(calculatePaceFromDuration(5, 26)).toBe("5:12");
    });
  });

  describe("integration tests", () => {
    it("should convert pace to duration and back", () => {
      const originalPace = "5:30";
      const distance = 10;
      const duration = calculateDuration(distance, originalPace);
      const recalculatedPace = calculatePaceFromDuration(distance, duration);

      // Should be close to original (may have minor rounding differences)
      expect(recalculatedPace).toBe("5:30");
    });

    it("should handle full workout calculation cycle", () => {
      const distance = 8;
      const targetPace = "4:45";
      const expectedDuration = calculateDuration(distance, targetPace);
      const actualPace = calculatePaceFromDuration(distance, expectedDuration);

      expect(actualPace).toBe("4:45");
      expect(expectedDuration).toBe(38);
    });
  });
});
