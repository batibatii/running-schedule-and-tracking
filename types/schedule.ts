import type { Sport, WorkoutType, HeartRateZone, DayOfWeek } from "./workout";

export type SyncStatus = "strava" | "manual" | null;
export interface ScheduleWorkout {
  kind: "planned";

  id: string;
  userId: string;

  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  dayOfWeek: DayOfWeek;
  weekStartDate: string;

  distance?: number; // km
  duration?: number; // minutes
  pace?: string; // "MM:SS"

  title?: string;
  notes?: string;

  completed: boolean;
  sortOrder: number;
  syncStatus: SyncStatus;

  linkedActivityId?: string;
  actualDistance?: number; // km
  actualDuration?: number; // minutes

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A standalone Strava activity that didn't match any planned workout.
 * Shown as its own card in the schedule day column.
 */
export interface StandaloneActivity {
  kind: "activity";

  id: string; // activities.id
  userId: string;

  sport: Sport;
  title?: string;

  distance?: number; // km
  duration?: number; // minutes (converted from seconds at the action layer)
  pace?: number; // decimal min/km

  dayOfWeek: DayOfWeek;
  weekStartDate: string;

  activityDate: Date;
  stravaActivityId?: string;
}

/**
 * Union type for anything displayed in the schedule day columns.
 * Use `item.kind` to discriminate between planned workouts and standalone activities.
 */
export type ScheduleItem = ScheduleWorkout | StandaloneActivity;

export type WorkoutStatus = "planned" | "completed" | "missed";

export interface EditWorkoutData {
  id: string;
  sport: Sport;
  heartRateZone: string;
  workoutType: WorkoutType;
  distance: number;
  duration?: number;
  pace?: string;
  title?: string;
  notes?: string;
  // Strava sync fields
  syncStatus?: SyncStatus;
  linkedActivityId?: string;
  actualDistance?: number;
  actualDuration?: number;
  completed?: boolean;
}
