import { useSyncExternalStore } from "react";

// Holds the playback time for UI (ms) outside of React state so that
// updating it frequently re-renders only the components that read it.
export interface TimeStore {
  get: () => number;
  set: (t: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export const createTimeStore = (initial = 0): TimeStore => {
  let time = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => time,
    set: t => {
      if (t === time) return;
      time = t;
      listeners.forEach(l => l());
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
};

export const useTime = (store: TimeStore) =>
  useSyncExternalStore(store.subscribe, store.get);
