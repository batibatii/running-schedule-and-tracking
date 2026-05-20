export interface LocalStorageStore<T> {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => T[];
  getServerSnapshot: () => T[];
  write: (items: T[]) => void;
  read: () => T[];
}

export function createLocalStorageStore<T>(key: string): LocalStorageStore<T> {
  let cachedRaw: string | null = null;
  let cachedItems: T[] = [];
  let listeners: Array<() => void> = [];
  const emptyItems: T[] = [];

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

  function getSnapshot(): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedItems = raw ? JSON.parse(raw) : [];
      }
      return cachedItems;
    } catch (error) {
      console.warn(`[localStorage] Failed to read "${key}":`, error);
      return cachedItems;
    }
  }

  function getServerSnapshot(): T[] {
    return emptyItems;
  }

  function write(items: T[]) {
    localStorage.setItem(key, JSON.stringify(items));
    emitChange();
  }

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot,
    write,
    read: getSnapshot,
  };
}
