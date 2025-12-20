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
const MIN_DOSE = 35;
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
 * Helper: Get time of day in minutes since midnight
 */
function getTimeOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Helper: Check if current time is within the wake-to-sleep window
 */
function isWithinWakeSleepWindow(
  now: Date,
  wakeTime: Date,
  sleepTime: Date
): boolean {
  const nowTime = getTimeOfDay(now);
  const wakeTimeMin = getTimeOfDay(wakeTime);
  const sleepTimeMin = getTimeOfDay(sleepTime);

  // Sleep window crosses midnight (e.g., wake 9 AM, sleep 1 AM)
  if (wakeTimeMin > sleepTimeMin) {
    return nowTime >= wakeTimeMin || nowTime < sleepTimeMin;
  }
  // Normal window (e.g., wake 9 AM, sleep 11 PM)
  return nowTime >= wakeTimeMin && nowTime < sleepTimeMin;
}

/**
 * Helper: Find most recent caffeine entry within the current sleep window
 */
function getLastDoseTimeInWindow(
  caffeineEntries: CaffeineEvent[],
  wakeTime: Date,
  sleepTime: Date
): Date {
  const windowEntries = caffeineEntries.filter((entry) => {
    const entryTime = Date.parse(entry.timestampISO);
    return entryTime >= wakeTime.getTime() && entryTime < sleepTime.getTime();
  });

  if (windowEntries.length === 0) {
    return wakeTime;
  }

  const sorted = [...windowEntries].sort(
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
  
  // RESET LOGIC: Check if we've passed sleep time (fresh day)
  const isInCurrentWindow = isWithinWakeSleepWindow(now, wakeTime, sleepTime);
  const hasPassed = !isInCurrentWindow && getTimeOfDay(now) >= getTimeOfDay(sleepTime);
  let effectiveEntries = caffeineEntries;
  let effectiveConsumed = totalConsumedCaffeine;
  let effectiveWakeTime = wakeTime;
  let effectiveSleepTime = sleepTime;
  
  if (hasPassed) {
    // Past sleep time - treat as fresh day starting tomorrow morning
    const nextWakeTime = new Date(wakeTime.getTime() + 24 * 3600000);
    const nextSleepTime = new Date(sleepTime.getTime() + 24 * 3600000);
    
    // Only count entries from NEXT wake time onwards (fresh cycle)
    // This ensures entries between sleep and wake are excluded
    effectiveEntries = caffeineEntries.filter(
      (entry) => Date.parse(entry.timestampISO) >= nextWakeTime.getTime()
    );
    effectiveConsumed = effectiveEntries.reduce((sum, e) => sum + e.mg, 0);
    effectiveWakeTime = nextWakeTime;
    effectiveSleepTime = nextSleepTime;
  }

  const cutoffTime = new Date(
    effectiveSleepTime.getTime() - 6 * 3600000
  );

  // Step 1: Find last relevant dose time within the sleep window
  const lastDoseTime = getLastDoseTimeInWindow(
    effectiveEntries,
    effectiveWakeTime,
    effectiveSleepTime
  );

  // Step 2: Recommendation window always starts 60 minutes after actual wake time
  const recommendationStartTime = addMinutes(effectiveWakeTime, 60);
  
  // Step 3: Enforce minimum spacing (only if there are previous doses)
  const hasPreviousDose = effectiveEntries.length > 0;
  const earliestCandidateTime = new Date(
    Math.max(
      now.getTime(),
      hasPreviousDose
        ? lastDoseTime.getTime() + MIN_GAP_BETWEEN_DOSES * 60 * 1000
        : recommendationStartTime.getTime()
    )
  );

  // Step 3: Hard stop conditions
  const remainingSafeMg = optimalDailyCaffeine - effectiveConsumed;

  if (
    earliestCandidateTime.getTime() > cutoffTime.getTime() ||
    remainingSafeMg < MIN_DOSE
  ) {
    return { status: 'NO_MORE_CAFFEINE_TODAY' };
  }

  // Step 4: Calculate dose distribution
  const X = lastDoseTime.getTime() > effectiveWakeTime.getTime()
    ? lastDoseTime
    : effectiveWakeTime;

  const availableHours = hoursBetween(X, cutoffTime);
  const doseSlots = Math.max(1, Math.floor(availableHours / 3));
  const nextDose = Math.max(
    MIN_DOSE,
    Math.min(
      remainingSafeMg / doseSlots,
      MAX_DOSE
    )
  );

  // Step 5: Find best time using peak-aware simulation
  for (let dose = nextDose; dose >= MIN_DOSE; dose -= 5) {
    const bestTime = findBestTime(
      effectiveEntries,
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
