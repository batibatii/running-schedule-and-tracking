export type HeartRateZone =
  | "zone-1"
  | "zone-2"
  | "zone-3"
  | "zone-4"
  | "zone-5";

export type WorkoutType = "easy" | "tempo" | "long" | "recovery" | "race";

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

  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;

  distance?: number; // in kilometers
  duration?: number; // in minutes

  dayOfWeek: DayOfWeek;
  weekStartDate: string; // ISO date string (YYYY-MM-DD) - Monday of the week

  title?: string;
  notes?: string;

  completed: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Helper type for creating new workouts (without auto-generated fields)
export type NewWorkout = Omit<Workout, "id" | "createdAt" | "updatedAt">;
