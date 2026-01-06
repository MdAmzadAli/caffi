import { CaffeineEvent, getActiveAtTime, getMaxCaffeineInSleepWindow } from './graphUtils';

export interface InfoCardResult {
  status: 'RECOMMENDED' | 'NO_MORE_CAFFEINE_TODAY';
  focusDose?: number;
  bestTimeStartMs?: number; // Changed to milliseconds
  bestTimeEndMs?: number;   // Changed to milliseconds
}

interface InfoCardInputs {
  nowMs: number;              // Changed to milliseconds
  wakeTimeMs: number;         // Changed to milliseconds
  sleepTimeMs: number;        // Changed to milliseconds
  optimalDailyCaffeine: number;
  totalConsumedCaffeine: number;
  caffeineEntries: CaffeineEvent[];
  halfLifeHours?: number;
}

// Constants
const MIN_DOSE = 30;
const MAX_DOSE = 75;
const MIN_GAP_BETWEEN_DOSES_MS = 90 * 60 * 1000; // 90 minutes in ms
const SIMULATION_STEP_MS = 15 * 60 * 1000; // 15 minutes in ms
const SLEEP_UNDISRUPTED_THRESHOLD = 30; // mg
const MAX_SAFE_MULTIPLIER = 0.6;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Helper: Convert hours to milliseconds
 */
function hoursToMs(hours: number): number {
  return hours * ONE_HOUR_MS;
}

/**
 * Helper: Get hours between two timestamps (in ms)
 */
function hoursBetween(startMs: number, endMs: number): number {
  return (endMs - startMs) / ONE_HOUR_MS;
}

/**
 * Helper: Add minutes to a timestamp
 */
function addMinutes(timestampMs: number, minutes: number): number {
  return timestampMs + minutes * 60 * 1000;
}

/**
 * Helper: Find most recent caffeine entry within the 24-hour sleep window
 */
function getLastDoseTimeInWindow(
  caffeineEntries: CaffeineEvent[],
  wakeTimeMs: number,
  sleepTimeMs: number
): number | null {
  // Window is 24-hour cycle from last sleep to next sleep
  const lastSleepTimeMs = sleepTimeMs - ONE_DAY_MS;

  const windowEntries = caffeineEntries.filter((entry) => {
    const entryTimeMs = Date.parse(entry.timestampISO);
    return entryTimeMs >= lastSleepTimeMs && entryTimeMs < sleepTimeMs;
  });

  if (windowEntries.length === 0) {
    return null;
  }

  const sorted = [...windowEntries].sort(
    (a, b) => Date.parse(b.timestampISO) - Date.parse(a.timestampISO)
  );

  return Date.parse(sorted[0].timestampISO);
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
  // Simulate peak with new dose
  const tempEvent: CaffeineEvent = {
    id: 'temp',
    name: 'temp',
    mg: dose,
    timestampISO: new Date(doseTimeMs).toISOString(),
  };

  const allEvents = [...caffeineEntries, tempEvent];
  const endMs = doseTimeMs + ONE_DAY_MS;
  let peak = 0;

  for (let t = doseTimeMs; t <= endMs; t += SIMULATION_STEP_MS) {
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
  earliestCandidateTimeMs: number,
  cutoffTimeMs: number,
  targetDose: number,
  maxSafeCaffeineCap: number,
  halfLifeHours: number
): number | null {
  for (
    let t = earliestCandidateTimeMs;
    t <= cutoffTimeMs;
    t += SIMULATION_STEP_MS
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
      cutoffTimeMs + SIX_HOURS_MS,
      halfLifeHours
    );

    if (isPeakOk && isSleepOk) {
      return t;
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
    nowMs,
    wakeTimeMs,
    sleepTimeMs,
    optimalDailyCaffeine,
    totalConsumedCaffeine,
    caffeineEntries,
    halfLifeHours = 5.5,
  } = inputs;

  const maxSafeCaffeineCap = MAX_SAFE_MULTIPLIER * optimalDailyCaffeine;

  console.log('sleepTimeMs', sleepTimeMs);

  let effectiveEntries = caffeineEntries;
  let effectiveConsumed = totalConsumedCaffeine;
  let effectiveWakeTimeMs = wakeTimeMs;

  console.log('effectiveWakeTimeMs (initial)', effectiveWakeTimeMs);

  // Adjust wake time if it's after sleep time (crosses midnight)
  if (sleepTimeMs < wakeTimeMs) {
    effectiveWakeTimeMs = wakeTimeMs - ONE_DAY_MS;
  }

  console.log('effectiveWakeTimeMs (adjusted)', effectiveWakeTimeMs);

  let effectiveSleepTimeMs = sleepTimeMs;

  // Calculate cutoff time (6 hours before sleep)
  const cutoffTimeMs = sleepTimeMs - SIX_HOURS_MS;

  // Step 1: Find last relevant dose time within the sleep window
  const lastDoseTimeMs = getLastDoseTimeInWindow(
    effectiveEntries,
    effectiveWakeTimeMs,
    effectiveSleepTimeMs
  );

  // Step 2: Recommendation window always starts 60 minutes after wake time
  const recommendationStartTimeMs = addMinutes(effectiveWakeTimeMs, 60);

  // Step 3: Enforce minimum spacing (only if there are previous doses)
  const hasPreviousDose = effectiveEntries.length > 0;
  console.log('hasPreviousDose', hasPreviousDose, 'lastDoseTimeMs', lastDoseTimeMs, 'nowMs', nowMs);

  const earliestCandidateTimeMs = Math.max(
    nowMs,
    lastDoseTimeMs !== null
      ? lastDoseTimeMs + MIN_GAP_BETWEEN_DOSES_MS
      : recommendationStartTimeMs
  );

  console.log('earliestCandidateTimeMs', earliestCandidateTimeMs);

  // Step 4: Hard stop conditions
  const remainingSafeMg = optimalDailyCaffeine - effectiveConsumed;

  if (
    earliestCandidateTimeMs > cutoffTimeMs ||
    remainingSafeMg < MIN_DOSE
  ) {
    return { status: 'NO_MORE_CAFFEINE_TODAY' };
  }

  // Step 5: Calculate dose distribution
  const X = lastDoseTimeMs !== null
    ? lastDoseTimeMs
    : Math.max(nowMs, effectiveWakeTimeMs);

  console.log('X', X);

  const availableHours = hoursBetween(X, cutoffTimeMs);
  const doseSlots = Math.max(1, Math.floor(availableHours / 3));

  console.log('doseSlots', doseSlots);
  console.log('remainingSafeMg', remainingSafeMg);

  const nextDose = Math.max(
    MIN_DOSE,
    Math.min(
      remainingSafeMg / doseSlots,
      MAX_DOSE
    )
  );

  // Step 6: Find best time using peak-aware simulation
  for (let dose = nextDose; dose >= MIN_DOSE; dose -= 5) {
    const bestTimeMs = findBestTime(
      effectiveEntries,
      earliestCandidateTimeMs,
      cutoffTimeMs,
      dose,
      maxSafeCaffeineCap,
      halfLifeHours
    );

    if (bestTimeMs !== null) {
      return {
        status: 'RECOMMENDED',
        focusDose: Math.round(dose),
        bestTimeStartMs: bestTimeMs,
        bestTimeEndMs: cutoffTimeMs,
      };
    }
  }

  // Step 7: Final fallback
  return { status: 'NO_MORE_CAFFEINE_TODAY' };
}