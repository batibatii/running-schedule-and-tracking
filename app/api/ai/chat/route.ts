import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireAuth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { createWorkoutTool } from "@/lib/ai/tools/createWorkout";
import { createPillTool } from "@/lib/ai/tools/createPill";
import { generateTrainingPlanTool } from "@/lib/ai/tools/generateTrainingPlan";
import { applyPlanToScheduleTool } from "@/lib/ai/tools/applyPlanToSchedule";
import { removeWorkoutTool } from "@/lib/ai/tools/removeWorkout";
import { createPlaygroundWorkoutTool } from "@/lib/ai/tools/createPlaygroundWorkout";
import { extractErrorMessage } from "@/lib/utils/error";
import type { WeekContext } from "@/types/ai";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { messages, weekContext, recentActions } = (await req.json()) as {
      messages: UIMessage[];
      weekContext: WeekContext;
      recentActions?: string[];
    };

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: buildSystemPrompt(weekContext, recentActions),
      messages: await convertToModelMessages(messages),
      tools: {
        createWorkout: createWorkoutTool(user.id, weekContext.weekStartDate),
        createPill: createPillTool(),
        generateTrainingPlan: generateTrainingPlanTool(user.id, weekContext),
        applyPlanToSchedule: applyPlanToScheduleTool(
          user.id,
          weekContext.weekStartDate,
        ),
        removeWorkout: removeWorkoutTool(user.id),
        createPlaygroundWorkout: createPlaygroundWorkoutTool(),
      },
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[ai/chat]", extractErrorMessage(error));
    return new Response("Internal server error", { status: 500 });
  }
}
