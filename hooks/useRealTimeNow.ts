import { useState, useEffect } from "react";

let globalTime = Date.now();
const listeners = new Set<(time: number) => void>();
let interval: ReturnType<typeof setInterval> | null = null;

export function useRealTimeNow(): number {
  const [time, setTime] = useState(globalTime);

  useEffect(() => {
    // Register listener
    const listener = (newTime: number) => setTime(newTime);
    listeners.add(listener);

    // Create global interval only if it doesn't exist
    if (!interval) {
      interval = setInterval(() => {
        globalTime = Date.now();
        listeners.forEach((l) => l(globalTime));
      }, 1000);
    }

    // Cleanup: remove listener and stop interval if no listeners remain
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, []);

  return time;
}
