import { tool, zodSchema } from "ai";
import { z } from "zod";
import {
  SPORTS,
  WORKOUT_TYPES,
  DAYS_OF_WEEK,
  type Sport,
  type WorkoutType,
  type HeartRateZone,
  type DayOfWeek,
} from "@/types/workout";
import { createWorkout } from "@/lib/dal/workout";

const parametersSchema = z.object({
  sport: z.enum(SPORTS).default("running"),
  workoutType: z.enum(WORKOUT_TYPES),
  heartRateZone: z.enum(["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"]),
  distance: z.number().positive().describe("Distance in kilometers"),
  duration: z.number().positive().optional().describe("Duration in minutes"),
  pace: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional()
    .describe("Pace in MM:SS format"),
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  title: z.string().optional(),
  notes: z.string().optional(),
});

type Params = z.infer<typeof parametersSchema>;

interface WorkoutCreatedResult {
  action: "workoutCreated";
  workout: {
    id: string;
    sport: Sport;
    workoutType: WorkoutType;
    heartRateZone: HeartRateZone;
    distance: number;
    duration?: number;
    pace?: string;
    dayOfWeek: DayOfWeek;
    title?: string;
    notes?: string;
  };
}

export function createWorkoutTool(userId: string, weekStartDate: string) {
  return tool<Params, WorkoutCreatedResult>({
    description:
      "Create a workout on a specific day of the week. Use when the user mentions a day.",
    inputSchema: zodSchema(parametersSchema),
    execute: async (params) => {
      const workout = await createWorkout(userId, {
        ...params,
        weekStartDate,
      });

      return {
        action: "workoutCreated",
        workout: {
          id: workout.id,
          sport: params.sport,
          workoutType: params.workoutType,
          heartRateZone: params.heartRateZone,
          distance: params.distance,
          duration: params.duration,
          pace: params.pace,
          dayOfWeek: params.dayOfWeek,
          title: params.title,
          notes: params.notes,
        },
      };
    },
  });
}
