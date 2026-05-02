import { createLocalStorageStore } from "@/lib/factories/createLocalStorageStore";
import { useLocalStorageStore } from "@/hooks/useLocalStorageStore";
import {
  Pill,
  PillGroup,
  PillFieldType,
  PlaygroundItem,
  PartialWorkoutFields,
} from "@/types/playground";
import { Sport, WorkoutType, HeartRateZone } from "@/types/workout";

const WORKOUT_DEFAULTS = {
  sport: "running" as Sport,
  workoutType: "easy" as WorkoutType,
  heartRateZone: "zone-2" as HeartRateZone,
};

const store = createLocalStorageStore<PlaygroundItem>("playground-items");

export function usePlayground() {
  const items = useLocalStorageStore(store);

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
    store.write([...store.read(), pill]);
  }

  function addExistingPill(pill: Pill) {
    store.write([...store.read(), pill]);
  }

  function removePill(id: string) {
    store.write(store.read().filter((item) => item.id !== id));
  }

  function addGroup(group: PillGroup) {
    store.write([...store.read(), group]);
  }

  function updateGroup(id: string, updates: Partial<PillGroup>) {
    store.write(
      store
        .read()
        .map((item) =>
          item.id === id && item.kind === "group"
            ? { ...item, ...updates }
            : item,
        ),
    );
  }

  function removeItem(id: string) {
    store.write(store.read().filter((item) => item.id !== id));
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
