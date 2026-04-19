import { useSyncExternalStore } from "react";
import { Preset, PartialWorkoutFields } from "@/types/playground";

const STORAGE_KEY = "playground-presets";

let cachedRaw: string | null = null;
let cachedPresets: Preset[] = [];

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

function getSnapshot(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedPresets = raw ? JSON.parse(raw) : [];
    }
    return cachedPresets;
  } catch {
    return cachedPresets;
  }
}

const emptyPresets: Preset[] = [];
function getServerSnapshot(): Preset[] {
  return emptyPresets;
}

function writePresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  emitChange();
}

export function usePresets() {
  const presets = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function addPreset(label: string, fields: PartialWorkoutFields) {
    const preset: Preset = {
      id: crypto.randomUUID(),
      label,
      fields,
      isCustom: true,
    };
    writePresets([...getSnapshot(), preset]);
  }

  function removePreset(id: string) {
    writePresets(getSnapshot().filter((p) => p.id !== id));
  }

  return { presets, addPreset, removePreset };
}
