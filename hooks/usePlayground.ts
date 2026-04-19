import { useSyncExternalStore } from "react";
import {
  Pill,
  PillGroup,
  PillFieldType,
  PlaygroundItem,
  PartialWorkoutFields,
} from "@/types/playground";
import { Sport, WorkoutType, HeartRateZone } from "@/types/workout";

const STORAGE_KEY = "playground-items";

const WORKOUT_DEFAULTS = {
  sport: "running" as Sport,
  workoutType: "easy" as WorkoutType,
  heartRateZone: "zone-2" as HeartRateZone,
};

// Cached snapshot to ensure referential stability between calls
let cachedRaw: string | null = null;
let cachedItems: PlaygroundItem[] = [];

let listeners: Array<() => void> = [];

function emitChange() {
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

function getSnapshot(): PlaygroundItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = raw ? JSON.parse(raw) : [];
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

const emptyItems: PlaygroundItem[] = [];
function getServerSnapshot(): PlaygroundItem[] {
  return emptyItems;
}

function writeItems(items: PlaygroundItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitChange();
}

export function usePlayground() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Derived filtered arrays
  const pills = items.filter((item): item is Pill => item.kind === "pill");
  const groups = items.filter(
    (item): item is PillGroup => item.kind === "group",
  );

  function addPill(
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ) {
    const pill: Pill = {
      id: crypto.randomUUID(),
      kind: "pill",
      fieldType,
      value,
      label,
    };
    writeItems([...getSnapshot(), pill]);
  }

  function addExistingPill(pill: Pill) {
    writeItems([...getSnapshot(), pill]);
  }

  function removePill(id: string) {
    writeItems(getSnapshot().filter((item) => item.id !== id));
  }

  function addGroup(group: PillGroup) {
    writeItems([...getSnapshot(), group]);
  }

  function updateGroup(id: string, updates: Partial<PillGroup>) {
    writeItems(
      getSnapshot().map((item) =>
        item.id === id && item.kind === "group"
          ? { ...item, ...updates }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    writeItems(getSnapshot().filter((item) => item.id !== id));
  }

  function resolvePillToFields(pill: Pill): PartialWorkoutFields {
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
  }

  function getWorkoutDefaults(fields: PartialWorkoutFields) {
    return {
      sport: fields.sport ?? WORKOUT_DEFAULTS.sport,
      workoutType: fields.workoutType ?? WORKOUT_DEFAULTS.workoutType,
      heartRateZone: fields.heartRateZone ?? WORKOUT_DEFAULTS.heartRateZone,
      distance: fields.distance,
      pace: fields.pace,
    };
  }

  return {
    items,
    pills,
    groups,
    addPill,
    addExistingPill,
    removePill,
    addGroup,
    updateGroup,
    removeItem,
    resolvePillToFields,
    getWorkoutDefaults,
  };
}
