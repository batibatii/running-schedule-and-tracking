import { Sport, WorkoutType, HeartRateZone } from "./workout";

export type PillFieldType =
  | "sport"
  | "workoutType"
  | "heartRateZone"
  | "distance"
  | "pace";

export type ComposeType = "pill" | "group";

export interface Pill {
  id: string;
  kind: ComposeType & "pill";
  fieldType: PillFieldType;
  value: string | number;
  label: string;
}

export interface PillGroup {
  id: string;
  kind: ComposeType & "group";
  fields: PartialWorkoutFields;
  pills: Pill[];
  createdAt: number;
}

export type PlaygroundItem = Pill | PillGroup;

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
  fields: PartialWorkoutFields;
  isCustom: boolean;
}

export type DragItemType = "workout" | "pill" | "group" | "preset";
