import type { Sport, WorkoutType, HeartRateZone, DayOfWeek } from "./workout";

/**
 * The sync status of a planned workout.
 * - 'strava'  — auto-matched by the sync engine
 * - 'manual'  — manually set by the user (sticky, sync won't override)
 * - null      — no match yet (planned)
 */
export type SyncStatus = "strava" | "manual" | null;

/**
 * A planned workout enriched with optional Strava actual data.
 * Used for rendering WorkoutCard in the schedule view.
 */
export interface ScheduleWorkout {
  kind: "planned";

  // Identity
  id: string;
  userId: string;

  // Plan fields
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  dayOfWeek: DayOfWeek;
  weekStartDate: string;

  // Planned metrics
  distance?: number; // km
  duration?: number; // minutes
  pace?: string; // "MM:SS"

  // Meta
  title?: string;
  notes?: string;

  // Status
  completed: boolean;
  syncStatus: SyncStatus;

  // Actual metrics (populated when linkedActivityId is set)
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

  // Identity
  id: string; // activities.id
  userId: string;

  // Display fields
  sport: Sport;
  title?: string;

  // Metrics
  distance?: number; // km
  duration?: number; // minutes (converted from seconds at the action layer)
  pace?: number; // decimal min/km

  // Calendar placement (derived from activityDate)
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
