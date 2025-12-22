import { useState, useEffect } from "react";

// Shared real-time state for synchronized updates across components
let globalRealTimeNow = Date.now();
const listeners: Set<(time: number) => void> = new Set();

export function useRealTimeNow(): number {
  const [realTimeNow, setRealTimeNow] = useState(globalRealTimeNow);

  useEffect(() => {
    const handleUpdate = (time: number) => {
      setRealTimeNow(time);
    };
    listeners.add(handleUpdate);

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      globalRealTimeNow = Date.now();
      listeners.forEach((listener) => listener(globalRealTimeNow));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return realTimeNow;
}
