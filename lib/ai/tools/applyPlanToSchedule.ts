import { tool, zodSchema } from "ai";
import { z } from "zod";
import { SPORTS, WORKOUT_TYPES, DAYS_OF_WEEK } from "@/types/workout";
import { createWorkout } from "@/lib/dal/workout";
import { validateWeekStartDate } from "@/lib/ai/tools/validateTargetWeek";

const workoutSchema = z.object({
  sport: z.enum(SPORTS),
  workoutType: z.enum(WORKOUT_TYPES),
  heartRateZone: z.enum(["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"]),
  distance: z.number().positive(),
  duration: z.number().positive().optional(),
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  title: z.string().optional(),
});

const parametersSchema = z.object({
  weeks: z.array(
    z.object({
      weekStartDate: z
        .string()
        .describe("ISO Monday date for this week (e.g. 2026-06-15)"),
      workouts: z.array(workoutSchema),
    }),
  ),
});

type Params = z.infer<typeof parametersSchema>;
type Result = { action: "planApplied"; count: number; workoutIds: string[] };

export function applyPlanToScheduleTool(userId: string) {
  return tool<Params, Result>({
    description:
      "Apply a previously generated training plan to the schedule by creating all workouts across one or more weeks. Use when the user confirms they want to apply the plan.",
    inputSchema: zodSchema(parametersSchema),
    execute: async ({ weeks }) => {
      const workoutIds: string[] = [];

      for (const week of weeks) {
        validateWeekStartDate(week.weekStartDate);

        for (const workout of week.workouts) {
          const created = await createWorkout(userId, {
            ...workout,
            weekStartDate: week.weekStartDate,
          });
          workoutIds.push(created.id);
        }
      }

      return { action: "planApplied", count: workoutIds.length, workoutIds };
    },
  });
}
