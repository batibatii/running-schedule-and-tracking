import type { PillFieldType } from "@/types/playground";
import type { Sport, WorkoutType } from "@/types/workout";

export const PILL_COLORS: Record<PillFieldType, string> = {
  sport: "bg-[#E5F2FB] text-[#2A5573] border-[#C9DFEF]",
  workoutType: "bg-[#EDE3FB] text-[#48356E] border-[#D9C7F0]",
  heartRateZone: "bg-[#FFE5D6] text-[#7A4525] border-[#F7CFB4]",
  distance: "bg-[#DCF1E5] text-[#2D5840] border-[#BEE2CC]",
  pace: "bg-[#FFEFC8] text-[#705220] border-[#F2DDA0]",
};

/** Sport-tinted icon-pill backgrounds (mint=Run, peach=Bike, sky=Swim) */
export const SPORT_ICON_BACKGROUND: Record<Sport, string> = {
  running: "bg-sport-running",
  cycling: "bg-sport-cycling",
  swimming: "bg-sport-swimming",
};

export const WORKOUT_TYPE_ICON_BACKGROUND: Record<WorkoutType, string> = {
  easy: "bg-workout-easy",
  tempo: "bg-workout-tempo",
  long: "bg-workout-long",
  recovery: "bg-workout-recovery",
  race: "bg-workout-race",
  interval: "bg-workout-interval",
};

/** Deep-tone foreground color for italic display workout-type names (Grind&Track DS) */
export const WORKOUT_TYPE_FOREGROUND: Record<WorkoutType, string> = {
  easy: "text-workout-easy-fg",
  tempo: "text-workout-tempo-fg",
  long: "text-workout-long-fg",
  recovery: "text-workout-recovery-fg",
  race: "text-workout-race-fg",
  interval: "text-workout-interval-fg",
};
