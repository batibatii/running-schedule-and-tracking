import { useState, useCallback } from "react";
import { Pill, PillFieldType, PartialWorkoutFields } from "@/types/playground";
import { Sport, WorkoutType, HeartRateZone } from "@/types/workout";

const WORKOUT_DEFAULTS = {
  sport: "running" as Sport,
  workoutType: "easy" as WorkoutType,
  heartRateZone: "zone-2" as HeartRateZone,
};

export function usePlayground() {
  const [pills, setPills] = useState<Pill[]>([]);

  const addPill = useCallback(
    (fieldType: PillFieldType, value: string | number, label: string) => {
      const pill: Pill = {
        id: crypto.randomUUID(),
        fieldType,
        value,
        label,
      };
      setPills((prev) => [...prev, pill]);
    },
    [],
  );

  const removePill = useCallback((id: string) => {
    setPills((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resolvePillToFields = useCallback(
    (pill: Pill): PartialWorkoutFields => {
      switch (pill.fieldType) {
        case "sport":
          return { sport: pill.value as Sport };
        case "workoutType":
          return { workoutType: pill.value as WorkoutType };
        case "heartRateZone":
          return { heartRateZone: pill.value as HeartRateZone };
        case "distance":
          return { distance: pill.value as number };
        case "pace":
          return { pace: pill.value as string };
      }
    },
    [],
  );

  const getWorkoutDefaults = useCallback(
    (fields: PartialWorkoutFields) => ({
      sport: fields.sport ?? WORKOUT_DEFAULTS.sport,
      workoutType: fields.workoutType ?? WORKOUT_DEFAULTS.workoutType,
      heartRateZone: fields.heartRateZone ?? WORKOUT_DEFAULTS.heartRateZone,
      distance: fields.distance,
      pace: fields.pace,
    }),
    [],
  );

  return {
    pills,
    addPill,
    removePill,
    resolvePillToFields,
    getWorkoutDefaults,
  };
}
