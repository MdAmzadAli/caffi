import { CaffeineEvent, getActiveAtTime, getMaxCaffeineInSleepWindow } from './graphUtils';

export interface InfoCardResult {
  status: 'RECOMMENDED' | 'NO_MORE_CAFFEINE_TODAY';
  focusDose?: number;
  bestTimeStart?: Date;
  bestTimeEnd?: Date;
}

interface InfoCardInputs {
  now: Date;
  wakeTime: Date;
  sleepTime: Date;
  optimalDailyCaffeine: number;
  totalConsumedCaffeine: number;
  caffeineEntries: CaffeineEvent[];
  halfLifeHours?: number;
}

// Constants
const MIN_DOSE = 25;
const MAX_DOSE = 75;
const MIN_GAP_BETWEEN_DOSES = 90; // minutes
const SIMULATION_STEP = 15; // minutes
const SLEEP_UNDISRUPTED_THRESHOLD = 30; // mg
const MAX_SAFE_MULTIPLIER = 0.6;

/**
 * Helper: Convert hours to milliseconds
 */
function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * Helper: Get hours between two dates
 */
function hoursBetween(startDate: Date, endDate: Date): number {
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Helper: Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Helper: Find last caffeine entry at or before a given time
 */
function getLastDoseTimeBeforeNow(
  caffeineEntries: CaffeineEvent[],
  wakeTime: Date,
  now: Date
): Date {
  const relevantEntries = caffeineEntries.filter(
    (entry) => Date.parse(entry.timestampISO) <= now.getTime()
  );

  if (relevantEntries.length === 0) {
    return wakeTime;
  }

  const sorted = [...relevantEntries].sort(
    (a, b) => Date.parse(b.timestampISO) - Date.parse(a.timestampISO)
  );

  return new Date(Date.parse(sorted[0].timestampISO));
}

/**
 * Helper: Check if adding a dose at a specific time keeps sleep undisrupted
 */
function isSleepSafe(
  caffeineEntries: CaffeineEvent[],
  dose: number,
  doseTimeMs: number,
  sleepTimeMs: number,
  halfLifeHours: number
): boolean {
  const maxCaffeineInWindow = getMaxCaffeineInSleepWindow(
    caffeineEntries,
    dose,
    doseTimeMs,
    sleepTimeMs,
    halfLifeHours,
    6 // windowHours
  );

  return maxCaffeineInWindow < SLEEP_UNDISRUPTED_THRESHOLD;
}

/**
 * Helper: Check if adding a dose at a specific time stays within safe peak
 */
function isPeakSafe(
  caffeineEntries: CaffeineEvent[],
  dose: number,
  doseTimeMs: number,
  maxSafeCaffeineCap: number,
  halfLifeHours: number
): boolean {
  // Simulate peak with new dose using the same logic as getPeakCaffeineWithNewEntry
  const tempEvent: CaffeineEvent = {
    id: 'temp',
    name: 'temp',
    mg: dose,
    timestampISO: new Date(doseTimeMs).toISOString(),
  };

  const allEvents = [...caffeineEntries, tempEvent];
  const stepMs = SIMULATION_STEP * 60 * 1000;
  const endMs = doseTimeMs + 24 * 3600000;
  let peak = 0;

  for (let t = doseTimeMs; t <= endMs; t += stepMs) {
    const mg = getActiveAtTime(allEvents, t, halfLifeHours);
    if (mg > peak) peak = mg;
  }

  return peak <= maxSafeCaffeineCap;
}

/**
 * Find the best time to take a dose
 */
function findBestTime(
  caffeineEntries: CaffeineEvent[],
  earliestCandidateTime: Date,
  cutoffTime: Date,
  targetDose: number,
  maxSafeCaffeineCap: number,
  halfLifeHours: number
): Date | null {
  const stepMs = SIMULATION_STEP * 60 * 1000;

  for (
    let t = earliestCandidateTime.getTime();
    t <= cutoffTime.getTime();
    t += stepMs
  ) {
    const isPeakOk = isPeakSafe(
      caffeineEntries,
      targetDose,
      t,
      maxSafeCaffeineCap,
      halfLifeHours
    );

    const isSleepOk = isSleepSafe(
      caffeineEntries,
      targetDose,
      t,
      cutoffTime.getTime() + 6 * 3600000,
      halfLifeHours
    );

    if (isPeakOk && isSleepOk) {
      return new Date(t);
    }
  }

  return null;
}

/**
 * Main function: Calculate info card recommendations
 */
export function calculateInfoCard(
  inputs: InfoCardInputs
): InfoCardResult {
  const {
    now,
    wakeTime,
    sleepTime,
    optimalDailyCaffeine,
    totalConsumedCaffeine,
    caffeineEntries,
    halfLifeHours = 5.5,
  } = inputs;

  const maxSafeCaffeineCap = MAX_SAFE_MULTIPLIER * optimalDailyCaffeine;
  const cutoffTime = new Date(
    sleepTime.getTime() - 6 * 3600000
  );

  // Step 1: Find last relevant dose time
  const lastDoseTime = getLastDoseTimeBeforeNow(
    caffeineEntries,
    wakeTime,
    now
  );

  // Step 2: Enforce minimum spacing
  const earliestCandidateTime = new Date(
    Math.max(
      now.getTime(),
      lastDoseTime.getTime() + MIN_GAP_BETWEEN_DOSES * 60 * 1000
    )
  );

  // Step 3: Hard stop conditions
  const remainingSafeMg = optimalDailyCaffeine - totalConsumedCaffeine;

  if (
    earliestCandidateTime.getTime() > cutoffTime.getTime() ||
    remainingSafeMg < MIN_DOSE
  ) {
    return { status: 'NO_MORE_CAFFEINE_TODAY' };
  }

  // Step 4: Calculate dose distribution
  const X = lastDoseTime.getTime() > wakeTime.getTime()
    ? lastDoseTime
    : wakeTime;

  const availableHours = hoursBetween(X, cutoffTime);
  const doseSlots = Math.max(1, Math.floor(availableHours / 3));
  const nextDose = Math.min(
    remainingSafeMg / doseSlots,
    MAX_DOSE
  );

  if (nextDose < MIN_DOSE) {
    return { status: 'NO_MORE_CAFFEINE_TODAY' };
  }

  // Step 5: Find best time using peak-aware simulation
  for (let dose = nextDose; dose >= MIN_DOSE; dose -= 5) {
    const bestTime = findBestTime(
      caffeineEntries,
      earliestCandidateTime,
      cutoffTime,
      dose,
      maxSafeCaffeineCap,
      halfLifeHours
    );

    if (bestTime) {
      return {
        status: 'RECOMMENDED',
        focusDose: Math.round(dose),
        bestTimeStart: bestTime,
        bestTimeEnd: addMinutes(bestTime, 30),
      };
    }
  }

  // Step 7: Final fallback
  return { status: 'NO_MORE_CAFFEINE_TODAY' };
}
