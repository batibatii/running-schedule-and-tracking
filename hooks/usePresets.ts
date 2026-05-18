import { createLocalStorageStore } from "@/lib/factories/createLocalStorageStore";
import { useLocalStorageStore } from "@/hooks/useLocalStorageStore";
import { Preset, PartialWorkoutFields } from "@/types/playground";

const store = createLocalStorageStore<Preset>("playground-presets");

export function usePresets() {
  const presets = useLocalStorageStore(store);

  function addPreset(label: string, fields: PartialWorkoutFields) {
    const preset: Preset = {
      id: crypto.randomUUID(),
      label,
      fields,
      isCustom: true,
    };
    store.write([...store.read(), preset]);
  }

  function removePreset(id: string) {
    store.write(store.read().filter((p) => p.id !== id));
  }

  function restorePreset(preset: Preset) {
    store.write([...store.read(), preset]);
  }

  return { presets, addPreset, removePreset, restorePreset };
}
