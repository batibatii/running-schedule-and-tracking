import { Sport, WorkoutType, HeartRateZone } from "./workout";

export type PillFieldType =
  | "sport"
  | "workoutType"
  | "heartRateZone"
  | "distance"
  | "pace";

export interface Pill {
  id: string;
  fieldType: PillFieldType;
  value: string | number; // e.g., "running", "easy", 5, "5:45"
  label: string; // display text: "Run", "Easy Run", "5 KM", "5:45"
}

export interface PartialWorkoutFields {
  sport?: Sport;
  workoutType?: WorkoutType;
  heartRateZone?: HeartRateZone;
  distance?: number;
  pace?: string;
}

export interface Preset {
  id: string;
  label: string;
  pills: Pill[];
  isCustom: boolean;
}

export type DragItemType = "workout" | "pill" | "preset";
