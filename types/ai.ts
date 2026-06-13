import type { DayOfWeek, Sport, WorkoutType } from "./workout";

// ── Context sent from client on each AI chat request ──

export interface WorkoutSummary {
  id: string;
  day: DayOfWeek;
  sport: Sport;
  workoutType: WorkoutType;
  distance?: number;
  completed: boolean;
}

export interface WeekContext {
  weekStartDate: string; // ISO "2026-06-08"
  todayDate: string; // ISO "2026-06-12" — actual today for LLM date math
  currentDay: DayOfWeek;
  existingWorkouts: WorkoutSummary[];
}

export type {
  TrainingPlan,
  WeekPlan,
  PlannedDay,
} from "@/lib/ai/schemas/trainingPlan";

// ── Tool part type for AI SDK UIMessage.parts ──

export interface ResolvedToolPart {
  toolCallId: string;
  state: string;
  output?: Record<string, unknown>;
}

/** Narrow a UIMessage part to a resolved tool invocation with output available. */
export function asResolvedToolPart(
  part: { type: string } & Record<string, unknown>,
): ResolvedToolPart | null {
  if (!part.type.startsWith("tool-")) return null;
  const toolPart = part as unknown as ResolvedToolPart;
  if (
    typeof toolPart.toolCallId !== "string" ||
    typeof toolPart.state !== "string"
  ) {
    return null;
  }
  if (toolPart.output !== undefined && typeof toolPart.output !== "object") {
    return null;
  }
  return toolPart;
}
