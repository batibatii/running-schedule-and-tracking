export type HeartRateZone =
  | "zone-1"
  | "zone-2"
  | "zone-3"
  | "zone-4"
  | "zone-5";

export const SPORTS = ["running", "cycling", "swimming"] as const;
export type Sport = (typeof SPORTS)[number];

export const WORKOUT_TYPES = [
  "easy",
  "tempo",
  "long",
  "recovery",
  "race",
  "interval",
] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Workout {
  id: string;
  userId: string;

  sport: Sport;

  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;

  distance?: number; // in kilometers
  duration?: number; // in minutes
  pace?: string;

  dayOfWeek: DayOfWeek;
  weekStartDate: string; // ISO date string (YYYY-MM-DD) - Monday of the week

  title?: string;
  notes?: string;

  completed: boolean;

  sortOrder: number;

  // Strava sync fields (populated by matching algorithm)
  linkedActivityId?: string | null;
  syncStatus?: "strava" | "manual" | null;
  actualDistance?: number | null; // km
  actualDuration?: number | null; // minutes

  createdAt: Date;
  updatedAt: Date;
}

export type NewWorkout = Omit<Workout, "id" | "createdAt" | "updatedAt">;
