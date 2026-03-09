import { z } from "zod";
import { SPORTS } from "./workout";

export const workoutFormSchema = z.object({
  sport: z.enum(SPORTS).default("running"),
  workoutType: z
    .string()
    .min(1, "Please select a workout type")
    .refine(
      (
        val,
      ): val is "easy" | "tempo" | "long" | "recovery" | "race" | "interval" =>
        ["easy", "tempo", "long", "recovery", "race", "interval"].includes(val),
      { message: "Invalid workout type" },
    ),

  heartRateZone: z
    .string()
    .min(1, "Please select a heart rate zone")
    .refine(
      (val): val is "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5" =>
        ["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"].includes(val),
      { message: "Invalid heart rate zone" },
    ),

  distance: z
    .string()
    .min(1, "Distance is required")
    .transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("Distance must be a positive number");
      }
      return num;
    }),

  duration: z
    .string()
    .transform((val) => {
      if (!val || val === "") return undefined;
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("Duration must be a positive number");
      }
      return num;
    })
    .optional(),

  pace: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{1,2}:\d{2}$/.test(val), {
      message: "Pace must be in MM:SS format (e.g., 5:30)",
    }),

  title: z.string().optional(),

  notes: z.string().optional(),
});

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
  sport: z.enum(SPORTS),
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
  sport: z.enum(SPORTS).optional(),
  completed: z.boolean().optional(),
});

export type UpdateWorkoutInputType = z.infer<typeof updateWorkoutSchema>;
export type CreateWorkoutInputType = z.infer<typeof createWorkoutSchema>;

export type WorkoutFormData = z.infer<typeof workoutFormSchema>;
