import { Sport, WorkoutType, HeartRateZone } from "@/types/workout";
import { PartialWorkoutFields } from "@/types/playground";

export const SPORT_WORKOUT_TYPES: Record<Sport, WorkoutType[]> = {
  running: ["easy", "tempo", "long", "recovery", "race", "interval"],
  cycling: ["easy", "tempo", "interval", "recovery", "race"],
  swimming: ["easy", "interval", "recovery"],
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy",
  tempo: "Tempo",
  interval: "Intervals",
  long: "Long",
  recovery: "Recovery",
  race: "Race",
};

export function isCompatibleWorkoutType(
  sport: Sport,
  workoutType: WorkoutType,
): boolean {
  return SPORT_WORKOUT_TYPES[sport].includes(workoutType);
}

export function getSportLabel(sport: Sport): string {
  const labels: Record<Sport, string> = {
    running: "Run",
    cycling: "Cycle",
    swimming: "Swim",
  };
  return labels[sport];
}

export function getSportDisplayName(sport: Sport): string {
  const labels: Record<Sport, string> = {
    running: "Run",
    cycling: "Cycle",
    swimming: "Swim",
  };
  return labels[sport];
}

export function getWorkoutTypeLabel(type: WorkoutType): string {
  return WORKOUT_TYPE_LABELS[type];
}

export function getZoneLabel(zone: HeartRateZone): string {
  const labels: Record<HeartRateZone, string> = {
    "zone-1": "Z1",
    "zone-2": "Z2",
    "zone-3": "Z3",
    "zone-4": "Z4",
    "zone-5": "Z5",
  };
  return labels[zone];
}

export function getZoneColor(zone: HeartRateZone): string {
  const colors: Record<HeartRateZone, string> = {
    "zone-1": "bg-z1 text-foreground",
    "zone-2": "bg-z2 text-foreground",
    "zone-3": "bg-z3 text-foreground",
    "zone-4": "bg-z4 text-foreground",
    "zone-5": "bg-z5 text-foreground",
  };
  return colors[zone];
}

export function generatePresetLabel(fields: PartialWorkoutFields): string {
  const parts: string[] = [];
  if (fields.sport) parts.push(getSportLabel(fields.sport));
  if (fields.workoutType) parts.push(getWorkoutTypeLabel(fields.workoutType));
  if (fields.distance) parts.push(`${fields.distance} km`);
  if (fields.pace) parts.push(fields.pace);
  if (fields.heartRateZone) parts.push(getZoneLabel(fields.heartRateZone));
  return parts.join(" · ") || "Preset";
}
