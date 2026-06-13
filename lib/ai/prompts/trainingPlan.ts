import { formatDateToISO } from "@/lib/utils/date";
import type { WeekContext } from "@/types/ai";
import type { WeekHistory } from "@/lib/ai/context/trainingHistory";

interface PlanPromptContext {
  recentWorkouts: WeekHistory[];
  stravaConnected: boolean;
  weekContext: WeekContext;
  focus?: string;
  weeklyDistanceTarget?: number;
  maxDaysPerWeek?: number;
  startWeekDate: string;
  numberOfWeeks: number;
}

/** Compute an array of ISO Monday dates for consecutive weeks. */
function getConsecutiveMondays(startDate: string, count: number): string[] {
  const mondays: string[] = [];
  const currentMonday = new Date(startDate + "T00:00:00");
  for (let i = 0; i < count; i++) {
    mondays.push(formatDateToISO(currentMonday));
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  return mondays;
}

export function buildPlanPrompt(context: PlanPromptContext): string {
  const {
    recentWorkouts,
    stravaConnected,
    weekContext,
    focus,
    weeklyDistanceTarget,
    maxDaysPerWeek,
    startWeekDate,
    numberOfWeeks,
  } = context;

  const targetMondays = getConsecutiveMondays(startWeekDate, numberOfWeeks);
  const isMultiWeek = numberOfWeeks > 1;

  const historySummary =
    recentWorkouts.length > 0
      ? recentWorkouts
          .map(
            (week) =>
              `  ${week.weekStartDate}: ${week.totalDistance.toFixed(1)}km over ${week.sessionCount} sessions (${week.workoutTypes.join(", ")})`,
          )
          .join("\n")
      : "  No recent training data available.";

  // Only show existing workouts if the plan overlaps with the current viewed week
  const overlapsCurrentWeek = targetMondays.includes(weekContext.weekStartDate);
  const existingSection = overlapsCurrentWeek
    ? weekContext.existingWorkouts.length > 0
      ? `\n## Existing Workouts (week of ${weekContext.weekStartDate})\nThese are already planned — avoid conflicts on these days:\n${weekContext.existingWorkouts
          .map(
            (workout) =>
              `  ${workout.day}: ${workout.sport} ${workout.workoutType} ${workout.distance ?? "?"}km`,
          )
          .join("\n")}\n`
      : ""
    : "";

  const dataReliability = stravaConnected
    ? "The user has Strava connected — training history reflects real activity data."
    : "The user does NOT have Strava connected — training history may be sparse or only include manually created workouts. Use conservative assumptions about fitness level.";

  const preferences = [
    focus && `Training focus: ${focus}`,
    weeklyDistanceTarget != null &&
      `Target weekly distance: ${weeklyDistanceTarget}km`,
    maxDaysPerWeek != null && `Maximum training days: ${maxDaysPerWeek}`,
  ]
    .filter(Boolean)
    .join("\n");

  const targetWeeksList = targetMondays
    .map((date, index) => `  Week ${index + 1}: ${date}`)
    .join("\n");

  const periodizationGuidelines = isMultiWeek
    ? `
- Apply progressive overload: increase weekly distance by ~5-10% each week
- Include a recovery/deload week every 3-4 weeks (reduce volume by 30-40%)
- Build toward peak volume in the penultimate week, then taper in the final week if it's a race plan
- Maintain consistent workout types across weeks but vary intensity and volume`
    : "";

  return `Generate a ${numberOfWeeks}-week training plan.

## Plan Structure
Your output must contain a "weeks" array with exactly ${numberOfWeeks} entries.
Each week must have a "weekStartDate" field set to the corresponding Monday date below:
${targetWeeksList}

Each week must have a "days" array with exactly 7 entries (Monday through Sunday).

## Data Reliability
${dataReliability}

## Recent Training History (past month)
${historySummary}
${existingSection}
${preferences ? `## User Preferences\n${preferences}\n` : ""}
## Guidelines
- Plan all 7 days per week (Monday through Sunday), marking rest days with isRest: true
- Alternate hard and easy days — never place two intense sessions back-to-back
- Place the long run on Saturday or Sunday
- Include at least 1-2 rest days per week
- Base weekly volume on recent history: increase by no more than 10% per week
- If no history is available, start with a conservative plan (3-4 sessions, 20-30km total for week 1)
- For race distances: zone-5 for 5K, zone-3/4 for 10K and half marathon, zone-2/3/4 for marathon${periodizationGuidelines}
- Provide a brief reasoning explaining why you chose this plan structure`;
}
