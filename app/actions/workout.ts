"use server";

import { requireAuth } from "@/lib/auth";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from "@/lib/dal/workout";
import { Workout } from "@/types/workout";
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

export async function updateWorkoutDayAction(
  workoutId: string,
  newDayOfWeek: DayOfWeek,
) {
  const user = await requireAuth();

  const updatedWorkout = await updateWorkout(workoutId, user.id, {
    dayOfWeek: newDayOfWeek,
  });

  return updatedWorkout;
}

export async function updateWorkoutAction(
  workoutId: string,
  data: WorkoutFormData,
  dayOfWeek: DayOfWeek,
  weekStartDate: string,
) {
  const user = await requireAuth();

  const updatedWorkout = await updateWorkout(workoutId, user.id, {
    ...data,
    dayOfWeek,
    weekStartDate,
  });
  return updatedWorkout;
}

export async function deleteWorkoutAction(workoutId: string) {
  const user = await requireAuth();

  await deleteWorkout(workoutId, user.id);
}
