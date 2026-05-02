import { Sport, WorkoutType, HeartRateZone } from "@/types/workout";
import { PartialWorkoutFields } from "@/types/playground";

export const SPORT_WORKOUT_TYPES: Record<Sport, WorkoutType[]> = {
  running: ["easy", "tempo", "long", "recovery", "race", "interval"],
  cycling: ["easy", "tempo", "interval", "recovery", "race"],
  swimming: ["easy", "interval", "recovery"],
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy Run",
  tempo: "Tempo",
  interval: "Intervals",
  long: "Long Run",
  recovery: "Recovery Run",
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
    running: "Running",
    cycling: "Cycling",
    swimming: "Swimming",
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
    "zone-1": "bg-cyan-100 text-cyan-800",
    "zone-2": "bg-green-100 text-green-800",
    "zone-3": "bg-yellow-100 text-yellow-800",
    "zone-4": "bg-orange-100 text-orange-800",
    "zone-5": "bg-red-100 text-red-800",
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
