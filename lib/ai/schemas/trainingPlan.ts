import { z } from "zod";
import { SPORTS, WORKOUT_TYPES, DAYS_OF_WEEK } from "@/types/workout";

export const plannedDaySchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  isRest: z.boolean(),
  sport: z.enum(SPORTS).optional(),
  workoutType: z.enum(WORKOUT_TYPES).optional(),
  heartRateZone: z
    .enum(["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"])
    .optional(),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export const trainingPlanSchema = z.object({
  weekSummary: z.string(),
  totalDistance: z.number(),
  totalSessions: z.number(),
  days: z.array(plannedDaySchema).length(7),
  reasoning: z.string(),
});

export type TrainingPlan = z.infer<typeof trainingPlanSchema>;
export type PlannedDay = z.infer<typeof plannedDaySchema>;
