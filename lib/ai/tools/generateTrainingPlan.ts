import { tool, generateText, Output, zodSchema } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  trainingPlanSchema,
  type TrainingPlan,
} from "@/lib/ai/schemas/trainingPlan";
import { getStravaTokensByUserId } from "@/lib/dal/strava";
import { getRecentWorkoutHistory } from "@/lib/ai/context/trainingHistory";
import { buildPlanPrompt } from "@/lib/ai/prompts/trainingPlan";
import {
  validateWeekStartDate,
  MAX_WEEKS_AHEAD,
} from "@/lib/ai/tools/validateTargetWeek";
import { formatDateToISO } from "@/lib/utils/date";
import type { WeekContext } from "@/types/ai";

const parametersSchema = z.object({
  focus: z
    .enum(["endurance", "speed", "recovery", "balanced"])
    .optional()
    .describe("Training focus for the plan"),
  weeklyDistanceTarget: z
    .number()
    .positive()
    .optional()
    .describe("Target weekly distance in km"),
  maxDaysPerWeek: z
    .number()
    .int()
    .min(1)
    .max(7)
    .optional()
    .describe("Maximum training days per week"),
  startWeekDate: z
    .string()
    .optional()
    .describe(
      "ISO Monday date for the first week of the plan (e.g. 2026-06-15). Defaults to the current week.",
    ),
  numberOfWeeks: z
    .number()
    .int()
    .min(1)
    .max(MAX_WEEKS_AHEAD)
    .optional()
    .describe(
      `How many weeks the plan should cover (1–${MAX_WEEKS_AHEAD}). Defaults to 1 for single-week plans.`,
    ),
});

type Params = z.infer<typeof parametersSchema>;
type Result = { action: "showTrainingPlan"; plan: TrainingPlan };

export function generateTrainingPlanTool(
  userId: string,
  weekContext: WeekContext,
) {
  return tool<Params, Result>({
    description: `Generate a structured training plan (1–${MAX_WEEKS_AHEAD} weeks) based on the user's recent training history and preferences. Use when the user asks for a plan, weekly schedule, or multi-week training block.`,
    inputSchema: zodSchema(parametersSchema),
    execute: async ({
      focus,
      weeklyDistanceTarget,
      maxDaysPerWeek,
      startWeekDate,
      numberOfWeeks = 1,
    }) => {
      const resolvedStartDate = startWeekDate ?? weekContext.weekStartDate;
      validateWeekStartDate(resolvedStartDate);

      // Validate end week is also within the window
      if (numberOfWeeks > 1) {
        const endWeek = new Date(resolvedStartDate + "T00:00:00");
        endWeek.setDate(endWeek.getDate() + (numberOfWeeks - 1) * 7);
        validateWeekStartDate(formatDateToISO(endWeek));
      }

      const recentWorkouts = await getRecentWorkoutHistory(userId);
      const stravaConnected = !!(await getStravaTokensByUserId(userId));

      const result = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        output: Output.object({ schema: zodSchema(trainingPlanSchema) }),
        prompt: buildPlanPrompt({
          recentWorkouts,
          stravaConnected,
          weekContext,
          focus,
          weeklyDistanceTarget,
          maxDaysPerWeek,
          startWeekDate: resolvedStartDate,
          numberOfWeeks,
        }),
      });

      return { action: "showTrainingPlan", plan: result.output! };
    },
  });
}
