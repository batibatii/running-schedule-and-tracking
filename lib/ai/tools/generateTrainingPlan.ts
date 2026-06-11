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
import type { WeekContext } from "@/types/ai";

const parametersSchema = z.object({
  focus: z
    .enum(["endurance", "speed", "recovery", "balanced"])
    .optional()
    .describe("Training focus for the week"),
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
});

type Params = z.infer<typeof parametersSchema>;
type Result = { action: "showTrainingPlan"; plan: TrainingPlan };

export function generateTrainingPlanTool(
  userId: string,
  weekContext: WeekContext,
) {
  return tool<Params, Result>({
    description:
      "Generate a structured 7-day training plan based on the user's recent training history and preferences. Use when the user asks for a plan or weekly schedule.",
    inputSchema: zodSchema(parametersSchema),
    execute: async ({ focus, weeklyDistanceTarget, maxDaysPerWeek }) => {
      console.log("[generateTrainingPlan] starting...");
      try {
        const recentWorkouts = await getRecentWorkoutHistory(userId);
        const stravaConnected = !!(await getStravaTokensByUserId(userId));

        console.log("[generateTrainingPlan] calling inner model...");
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
          }),
        });

        console.log("[generateTrainingPlan] success:", !!result.output);
        return { action: "showTrainingPlan", plan: result.output! };
      } catch (error) {
        console.error("[generateTrainingPlan] error:", error);
        throw error;
      }
    },
  });
}
