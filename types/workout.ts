import z from "zod";
import { workoutFormSchema } from "./workoutValidation";

export type HeartRateZone =
  | "zone-1"
  | "zone-2"
  | "zone-3"
  | "zone-4"
  | "zone-5";

export type WorkoutType = "easy" | "tempo" | "long" | "recovery" | "race" | "interval";

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
  pace?: string;

  dayOfWeek: DayOfWeek;
  weekStartDate: string; // ISO date string (YYYY-MM-DD) - Monday of the week

  title?: string;
  notes?: string;

  completed: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const createWorkoutSchema = workoutFormSchema.extend({
  dayOfWeek: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const updateWorkoutSchema = workoutFormSchema.partial().extend({
  dayOfWeek: z
    .enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .optional(),
  weekStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  completed: z.boolean().optional(),
});

export type UpdateWorkoutInputType = z.infer<typeof updateWorkoutSchema>;
export type CreateWorkoutInputType = z.infer<typeof createWorkoutSchema>;
export type NewWorkout = Omit<Workout, "id" | "createdAt" | "updatedAt">;
