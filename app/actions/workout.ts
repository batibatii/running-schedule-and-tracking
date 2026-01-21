"use server";

import { requireAuth } from "@/lib/auth";
import { getWorkouts, createWorkout } from "@/lib/dal/workout";
import { createWorkoutSchema, Workout } from "@/types/workout";
import { DayOfWeek } from "@/types/workout";
import { WorkoutFormData } from "@/types/workoutValidation";

export async function fetchWorkoutsAction(
  weekStartDate: string,
): Promise<Workout[]> {
  const user = await requireAuth();

  const workouts = await getWorkouts(user.id, weekStartDate);

  return workouts.map((w) => ({
    ...w,
    distance: Number(w.distance) || 0,
  })) as Workout[];
}

export async function createWorkoutAction(
  data: WorkoutFormData,
  dayOfWeek: DayOfWeek,
  weekStartDate: string,
) {
  const user = await requireAuth();

  const workout = await createWorkout(user.id, {
    ...data,
    dayOfWeek,
    weekStartDate,
  });

  return workout;
}
