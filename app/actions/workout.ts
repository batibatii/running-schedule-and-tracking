"use server";

import { requireAuth } from "@/lib/auth";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  setWorkoutManualStatus,
  resetWorkoutToPlanned,
  reorderWorkoutsInDay,
  moveWorkoutToDay,
} from "@/lib/dal/workout";
import { getUnmatchedActivitiesForWeek } from "@/lib/dal/activities";
import { getDayOfWeek } from "@/lib/utils/date";
import type { Workout, DayOfWeek, Sport } from "@/types/workout";
import type {
  ScheduleItem,
  ScheduleWorkout,
  StandaloneActivity,
  SyncStatus,
} from "@/types/schedule";
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

/**
 * Fetch all schedule items for a given week: planned workouts (enriched with
 * Strava actual data when linked) + standalone activities (unmatched Strava
 * activities that have no corresponding planned workout).
 */
export async function fetchScheduleItemsAction(
  weekStartDate: string,
): Promise<ScheduleItem[]> {
  try {
    const user = await requireAuth();

    // Planned workouts (including Strava linking columns)
    const workoutRows = await getWorkouts(user.id, weekStartDate);
    const scheduleWorkouts: ScheduleWorkout[] = workoutRows.map((workout) => ({
      kind: "planned" as const,
      id: workout.id,
      userId: workout.userId,
      sport: workout.sport as Sport,
      workoutType: workout.workoutType as Workout["workoutType"],
      heartRateZone: workout.heartRateZone as Workout["heartRateZone"],
      dayOfWeek: workout.dayOfWeek as DayOfWeek,
      weekStartDate: workout.weekStartDate,
      distance: Number(workout.distance) || 0,
      duration: workout.duration ? Number(workout.duration) : undefined,
      pace: workout.pace ?? undefined,
      title: workout.title ?? undefined,
      notes: workout.notes ?? undefined,
      completed: workout.completed,
      sortOrder: workout.sortOrder,
      syncStatus: (workout.syncStatus as SyncStatus) ?? null,
      linkedActivityId: workout.linkedActivityId ?? undefined,
      actualDistance: workout.actualDistance
        ? Number(workout.actualDistance)
        : undefined,
      actualDuration: workout.actualDuration
        ? Number(workout.actualDuration)
        : undefined,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
    }));

    // Standalone Strava activities (not matched to any planned workout)
    const activityRows = await getUnmatchedActivitiesForWeek(
      user.id,
      weekStartDate,
    );
    const standaloneActivities: StandaloneActivity[] = activityRows.map(
      (activity) => ({
        kind: "activity" as const,
        id: activity.id,
        userId: activity.userId,
        sport: activity.sport as Sport,
        title: activity.title ?? undefined,
        distance: activity.distance ? Number(activity.distance) : undefined,
        duration: activity.duration ? activity.duration / 60 : undefined, // seconds → minutes
        pace: activity.pace ? Number(activity.pace) : undefined,
        dayOfWeek: getDayOfWeek(new Date(activity.activityDate)),
        weekStartDate,
        activityDate: new Date(activity.activityDate),
        stravaActivityId: activity.stravaActivityId ?? undefined,
      }),
    );

    return [...scheduleWorkouts, ...standaloneActivities];
  } catch (error) {
    console.error("[fetchScheduleItemsAction]", extractErrorMessage(error));
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

export async function moveWorkoutToDayAction(
  workoutId: string,
  newDay: DayOfWeek,
  insertAtIndex: number,
  weekStartDate: string,
) {
  try {
    const user = await requireAuth();
    await moveWorkoutToDay(
      workoutId,
      user.id,
      newDay,
      weekStartDate,
      insertAtIndex,
    );
  } catch (error) {
    console.error("[moveWorkoutToDayAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function reorderWorkoutsAction(orderedIds: string[]) {
  try {
    const user = await requireAuth();
    await reorderWorkoutsInDay(user.id, orderedIds);
  } catch (error) {
    console.error("[reorderWorkoutsAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function updateWorkoutSyncStatusAction(
  workoutId: string,
  status: "planned" | "completed" | "missed",
) {
  try {
    const user = await requireAuth();

    if (status === "planned") {
      await resetWorkoutToPlanned(workoutId, user.id);
    } else {
      await setWorkoutManualStatus(workoutId, user.id, status === "completed");
    }
  } catch (error) {
    console.error(
      "[updateWorkoutSyncStatusAction]",
      extractErrorMessage(error),
    );
    throw error;
  }
}
