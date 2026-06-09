import { getWorkouts } from "@/lib/dal/workout";
import { formatDateToISO } from "@/lib/utils/date";

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
  const history: WeekHistory[] = [];

  for (let i = 1; i <= HISTORY_WEEKS; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    // Rewind to Monday of that week
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    date.setDate(date.getDate() + mondayOffset);

    const weekStart = formatDateToISO(date);
    const workouts = await getWorkouts(userId, weekStart);

    if (workouts.length === 0) continue;

    history.push({
      weekStartDate: weekStart,
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
    });
  }

  return history;
}
