import { getWorkouts } from "@/lib/dal/workout";
import { getWeekStartDate, formatDateToISO } from "@/lib/utils/date";

const HISTORY_WEEKS = 4;

export interface WeekHistory {
  weekStartDate: string;
  totalDistance: number;
  totalDuration: number;
  sessionCount: number;
  workoutTypes: string[];
}

export async function getRecentWorkoutHistory(
  userId: string,
): Promise<WeekHistory[]> {
  const weekMondays = Array.from({ length: HISTORY_WEEKS }, (_, i) =>
    formatDateToISO(getWeekStartDate(-(i + 1))),
  );

  const results = await Promise.all(
    weekMondays.map((weekStart) => getWorkouts(userId, weekStart)),
  );

  return results
    .map((workouts, index) => {
      if (workouts.length === 0) return null;
      return {
        weekStartDate: weekMondays[index],
        totalDistance: workouts.reduce(
          (sum, workout) => sum + (Number(workout.distance) || 0),
          0,
        ),
        totalDuration: workouts.reduce(
          (sum, workout) => sum + (Number(workout.duration) || 0),
          0,
        ),
        sessionCount: workouts.length,
        workoutTypes: [
          ...new Set(workouts.map((workout) => workout.workoutType)),
        ],
      };
    })
    .filter((week): week is WeekHistory => week !== null);
}
