import { useCallback, useSyncExternalStore } from "react";
import { Pill, PillFieldType, PartialWorkoutFields } from "@/types/playground";
import { Sport, WorkoutType, HeartRateZone } from "@/types/workout";

const STORAGE_KEY = "playground-pills";

const WORKOUT_DEFAULTS = {
  sport: "running" as Sport,
  workoutType: "easy" as WorkoutType,
  heartRateZone: "zone-2" as HeartRateZone,
};

// Cached snapshot to ensure referential stability between calls
let cachedRaw: string | null = null;
let cachedPills: Pill[] = [];

let listeners: Array<() => void> = [];

function emitChange() {
  // Invalidate cache so next getSnapshot reads fresh data
  cachedRaw = null;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void) {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): Pill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedPills = raw ? JSON.parse(raw) : [];
    }
    return cachedPills;
  } catch {
    return cachedPills;
  }
}

const emptyPills: Pill[] = [];
function getServerSnapshot(): Pill[] {
  return emptyPills;
}

function writePills(pills: Pill[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pills));
  emitChange();
}

export function usePlayground() {
  const pills = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addPill = useCallback(
    (fieldType: PillFieldType, value: string | number, label: string) => {
      const pill: Pill = {
        id: crypto.randomUUID(),
        fieldType,
        value,
        label,
      };
      const current = getSnapshot();
      writePills([...current, pill]);
    },
    [],
  );

  const removePill = useCallback((id: string) => {
    const current = getSnapshot();
    writePills(current.filter((p) => p.id !== id));
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
