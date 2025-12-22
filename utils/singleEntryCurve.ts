import { remainingAfterHours } from "@/utils/graphUtils";
import type { DrinkEntry } from "@/store/caffeineStore";

export interface CurvePoint {
  t: number;
  mg: number;
}

// Calculate decay curve for a single caffeine entry from its time to +12 hours
export function calculateSingleEntryCurve(
  entry: DrinkEntry,
  sampleResolutionMinutes: number = 5,
  halfLifeHours: number = 5
): CurvePoint[] {
  const entryMs = new Date(entry.timestamp).getTime();
  const endMs = entryMs + 12 * 3600000; // +12 hours
  const stepMs = sampleResolutionMinutes * 60 * 1000;

  const samples: CurvePoint[] = [];
  for (let t = entryMs; t <= endMs; t += stepMs) {
    const hoursElapsed = (t - entryMs) / 3600000;
    const mg = remainingAfterHours(entry.caffeineAmount, hoursElapsed, halfLifeHours);
    samples.push({ t, mg });
  }

  return samples;
}
