"use server";

import { requireAuth } from "@/lib/auth";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from "@/lib/dal/workout";
import { Workout, DayOfWeek } from "@/types/workout";
import {
  WorkoutFormData,
  PartialWorkoutUpdate,
} from "@/types/workoutValidation";
import { extractErrorMessage } from "@/lib/utils/error";

// Workout actions use log-and-rethrow instead of safeAction (which returns
// ActionResult). This is because these actions are consumed by useAsyncData.execute()
// in WeeklySchedule and AddWorkoutDialog, which expects thrown errors to set its
// error state. Client-side callers in useDragDropManager wrap these with
// withToastError() for user-facing error toasts.

export async function fetchWorkoutsAction(
  weekStartDate: string,
): Promise<Workout[]> {
  try {
    const user = await requireAuth();

    const workouts = await getWorkouts(user.id, weekStartDate);

    return workouts.map((w) => ({
      ...w,
      distance: Number(w.distance) || 0,
      duration: w.duration ? Number(w.duration) : undefined,
      pace: w.pace || undefined,
    })) as Workout[];
  } catch (error) {
    console.error("[fetchWorkoutsAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function createWorkoutAction(
  data: WorkoutFormData,
  dayOfWeek: DayOfWeek,
  weekStartDate: string,
) {
  try {
    const user = await requireAuth();

    const workout = await createWorkout(user.id, {
      ...data,
      dayOfWeek,
      weekStartDate,
    });

    return workout;
  } catch (error) {
    console.error("[createWorkoutAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function updateWorkoutDayAction(
  workoutId: string,
  newDayOfWeek: DayOfWeek,
) {
  try {
    const user = await requireAuth();

    const updatedWorkout = await updateWorkout(workoutId, user.id, {
      dayOfWeek: newDayOfWeek,
    });

    return updatedWorkout;
  } catch (error) {
    console.error("[updateWorkoutDayAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function updateWorkoutAction(
  workoutId: string,
  data: WorkoutFormData,
  dayOfWeek: DayOfWeek,
  weekStartDate: string,
) {
  try {
    const user = await requireAuth();

    const updatedWorkout = await updateWorkout(workoutId, user.id, {
      ...data,
      dayOfWeek,
      weekStartDate,
    });
    return updatedWorkout;
  } catch (error) {
    console.error("[updateWorkoutAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function updateWorkoutFieldAction(
  workoutId: string,
  fields: PartialWorkoutUpdate,
) {
  try {
    const user = await requireAuth();

    const updatedWorkout = await updateWorkout(workoutId, user.id, fields);
    return updatedWorkout;
  } catch (error) {
    console.error("[updateWorkoutFieldAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function deleteWorkoutAction(workoutId: string) {
  try {
    const user = await requireAuth();

    await deleteWorkout(workoutId, user.id);
  } catch (error) {
    console.error("[deleteWorkoutAction]", extractErrorMessage(error));
    throw error;
  }
}
