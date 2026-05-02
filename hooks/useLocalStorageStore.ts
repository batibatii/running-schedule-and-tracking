import { useSyncExternalStore } from "react";
import type { LocalStorageStore } from "@/lib/factories/createLocalStorageStore";

export function useLocalStorageStore<T>(store: LocalStorageStore<T>) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
