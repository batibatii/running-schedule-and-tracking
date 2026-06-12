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
