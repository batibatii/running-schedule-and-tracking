import { streamText, stepCountIs, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireAuth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { createWorkoutTool } from "@/lib/ai/tools/createWorkout";
import { createPillTool } from "@/lib/ai/tools/createPill";
import { generateTrainingPlanTool } from "@/lib/ai/tools/generateTrainingPlan";
import { applyPlanToScheduleTool } from "@/lib/ai/tools/applyPlanToSchedule";
import { extractErrorMessage } from "@/lib/utils/error";
import type { WeekContext } from "@/types/ai";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { messages, weekContext } = (await req.json()) as {
      messages: ModelMessage[];
      weekContext: WeekContext;
    };

    const result = streamText({
      model: anthropic("claude-sonnet-4-5-20250514"),
      system: buildSystemPrompt(weekContext),
      messages,
      tools: {
        createWorkout: createWorkoutTool(user.id, weekContext.weekStartDate),
        createPill: createPillTool(),
        generateTrainingPlan: generateTrainingPlanTool(user.id, weekContext),
        applyPlanToSchedule: applyPlanToScheduleTool(
          user.id,
          weekContext.weekStartDate,
        ),
      },
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[ai/chat]", extractErrorMessage(error));
    return new Response("Internal server error", { status: 500 });
  }
}
