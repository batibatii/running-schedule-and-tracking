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
import { PLAYGROUND_CAPACITY } from "@/lib/constants/playground";
import { toast } from "sonner";

const WORKOUT_DEFAULTS = {
  sport: "running" as Sport,
  workoutType: "easy" as WorkoutType,
  heartRateZone: "zone-2" as HeartRateZone,
};

const store = createLocalStorageStore<PlaygroundItem>("playground-items");

export function usePlayground() {
  const items = useLocalStorageStore(store);
  const remainingSlots = PLAYGROUND_CAPACITY - items.length;

  const pills = items.filter((item): item is Pill => item.kind === "pill");
  const groups = items.filter(
    (item): item is PillGroup => item.kind === "group",
  );

  function addPill(
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ): boolean {
    const current = store.read();
    if (current.length >= PLAYGROUND_CAPACITY) {
      toast.warning(
        `Playground is full (${PLAYGROUND_CAPACITY}/${PLAYGROUND_CAPACITY})`,
        {
          description: "Drag items to your schedule or trash to free space",
        },
      );
      return false;
    }
    const pill: Pill = {
      id: crypto.randomUUID(),
      kind: "pill",
      fieldType,
      value,
      label,
    };
    store.write([...current, pill]);
    return true;
  }

  function addExistingPill(pill: Pill): boolean {
    const current = store.read();
    if (current.length >= PLAYGROUND_CAPACITY) {
      toast.warning(
        `Playground is full (${PLAYGROUND_CAPACITY}/${PLAYGROUND_CAPACITY})`,
        {
          description: "Drag items to your schedule or trash to free space",
        },
      );
      return false;
    }
    store.write([...current, pill]);
    return true;
  }

  function addGroup(group: PillGroup): boolean {
    const current = store.read();
    if (current.length >= PLAYGROUND_CAPACITY) {
      toast.warning(
        `Playground is full (${PLAYGROUND_CAPACITY}/${PLAYGROUND_CAPACITY})`,
        {
          description: "Drag items to your schedule or trash to free space",
        },
      );
      return false;
    }
    store.write([...current, group]);
    return true;
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
    remainingSlots,
    addPill,
    addExistingPill,
    addGroup,
    updateGroup,
    removeItem,
    resolvePillToFields,
    getWorkoutDefaults,
  };
}
