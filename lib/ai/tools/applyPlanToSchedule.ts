import { tool, zodSchema } from "ai";
import { z } from "zod";
import { SPORTS, WORKOUT_TYPES, DAYS_OF_WEEK } from "@/types/workout";
import { createWorkout } from "@/lib/dal/workout";

const parametersSchema = z.object({
  workouts: z.array(
    z.object({
      sport: z.enum(SPORTS),
      workoutType: z.enum(WORKOUT_TYPES),
      heartRateZone: z.enum(["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"]),
      distance: z.number().positive(),
      duration: z.number().positive().optional(),
      dayOfWeek: z.enum(DAYS_OF_WEEK),
      title: z.string().optional(),
    }),
  ),
});

type Params = z.infer<typeof parametersSchema>;
type Result = { action: "planApplied"; count: number };

export function applyPlanToScheduleTool(userId: string, weekStartDate: string) {
  return tool<Params, Result>({
    description:
      "Apply a previously generated training plan to the schedule by creating all workouts. Use when the user confirms they want to apply the plan.",
    inputSchema: zodSchema(parametersSchema),
    execute: async ({ workouts }) => {
      let created = 0;

      for (const workout of workouts) {
        await createWorkout(userId, {
          ...workout,
          weekStartDate,
        });
        created++;
      }

      return { action: "planApplied", count: created };
    },
  });
}
