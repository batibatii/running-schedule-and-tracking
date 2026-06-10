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
  currentDay: DayOfWeek;
  existingWorkouts: WorkoutSummary[];
}

export type { TrainingPlan, PlannedDay } from "@/lib/ai/schemas/trainingPlan";
