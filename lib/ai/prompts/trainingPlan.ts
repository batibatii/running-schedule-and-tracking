import type { WeekContext } from "@/types/ai";
import type { WeekHistory } from "@/lib/ai/context/trainingHistory";

interface PlanPromptContext {
  recentWorkouts: WeekHistory[];
  stravaConnected: boolean;
  weekContext: WeekContext;
  focus?: string;
  weeklyDistanceTarget?: number;
  maxDaysPerWeek?: number;
}

export function buildPlanPrompt(context: PlanPromptContext): string {
  const {
    recentWorkouts,
    stravaConnected,
    weekContext,
    focus,
    weeklyDistanceTarget,
    maxDaysPerWeek,
  } = context;

  const historySummary =
    recentWorkouts.length > 0
      ? recentWorkouts
          .map(
            (week) =>
              `  ${week.weekStartDate}: ${week.totalDistance.toFixed(1)}km over ${week.sessionCount} sessions (${week.workoutTypes.join(", ")})`,
          )
          .join("\n")
      : "  No recent training data available.";

  const existingSummary =
    weekContext.existingWorkouts.length > 0
      ? weekContext.existingWorkouts
          .map(
            (workout) =>
              `  ${workout.day}: ${workout.sport} ${workout.workoutType} ${workout.distance ?? "?"}km`,
          )
          .join("\n")
      : "  No workouts planned yet for this week.";

  const dataReliability = stravaConnected
    ? "The user has Strava connected — training history reflects real activity data."
    : "The user does NOT have Strava connected — training history may be sparse or only include manually created workouts. Use conservative assumptions about fitness level.";

  const preferences = [
    focus && `Training focus: ${focus}`,
    weeklyDistanceTarget && `Target weekly distance: ${weeklyDistanceTarget}km`,
    maxDaysPerWeek && `Maximum training days: ${maxDaysPerWeek}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Generate a 7-day training plan for the upcoming week.

## Data Reliability
${dataReliability}

## Recent Training History (past month)
${historySummary}

## Current Week (${weekContext.weekStartDate})
Today is ${weekContext.currentDay}. Already planned:
${existingSummary}

${preferences ? `## User Preferences\n${preferences}\n` : ""}
## Guidelines
- Plan all 7 days (Monday through Sunday), marking rest days with isRest: true
- Alternate hard and easy days — never place two intense sessions back-to-back
- Place the long run on Saturday or Sunday
- Include at least 1-2 rest days per week
- Respect existing workouts — don't schedule conflicting sessions on days that already have workouts
- Base weekly volume on recent history: increase by no more than 10% per week
- If no history is available, start with a conservative plan (3-4 sessions, 20-30km total)
- For race distances: zone-5 for 5K, zone-3/4 for 10K and half marathon, zone-2/3/4 for marathon
- Provide a brief reasoning explaining why you chose this plan structure`;
}
