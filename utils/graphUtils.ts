export interface CaffeineEvent {
  id: string;
  name: string;
  mg: number;
  timestampISO: string;
  iconUrl?: string;
  category?: string;
  imageUri?: string;
}

export interface SamplePoint {
  t: number;
  mg: number;
}

export interface GraphSampleData {
  samples: SamplePoint[];
  startMs: number;
  endMs: number;
  sampleTimesMs: number[];
}

export function buildSampleTimes(
  centerTimeISO: string,
  viewWindowHours: number,
  resolutionMinutes: number
): { samples: number[]; startMs: number; endMs: number } {
  const centerMs = Date.parse(centerTimeISO);
  const halfWindowMs = (viewWindowHours / 2) * 3600000;
  const startMs = centerMs - halfWindowMs;
  const endMs = centerMs + halfWindowMs;
  const stepMs = resolutionMinutes * 60 * 1000;
  const samples: number[] = [];
  for (let t = startMs; t <= endMs; t += stepMs) {
    samples.push(t);
  }
  return { samples, startMs, endMs };
}

const K_ELIM = 0.00231;
const K_ABS = 0.045;

export function remainingAfterHours(
  doseMg: number,
  hoursSinceDose: number,
  halfLifeHours: number
): number {
  if (hoursSinceDose < 0) return 0;
  const dtMinutes = hoursSinceDose * 60;
  return doseMg * (1 - Math.exp(-K_ABS * dtMinutes)) * Math.exp(-K_ELIM * dtMinutes);
}

export function computeActiveCurve(
  events: CaffeineEvent[],
  samplesMs: number[],
  halfLifeHours: number
): SamplePoint[] {
  return samplesMs.map((s) => {
    let total = 0;
    for (const e of events) {
      const eventMs = Date.parse(e.timestampISO);
      const dtHours = (s - eventMs) / 3600000;
      if (dtHours >= 0) {
        total += remainingAfterHours(e.mg, dtHours, halfLifeHours);
      }
    }
    return { t: s, mg: total };
  });
}

export function getActiveAtTime(
  events: CaffeineEvent[],
  timeMs: number,
  halfLifeHours: number
): number {
  let total = 0;
  for (const e of events) {
    const eventMs = Date.parse(e.timestampISO);
    const dtHours = (timeMs - eventMs) / 3600000;
    if (dtHours >= 0) {
      total += remainingAfterHours(e.mg, dtHours, halfLifeHours);
    }
  }
  return total;
}

export function formatTimeLabel(ms: number): string {
  const date = new Date(ms);
  const hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}${ampm}`;
}

export function formatCurrentTime(ms: number): string {
  const date = new Date(ms);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minStr = minutes.toString().padStart(2, "0");
  return `${hour12}:${minStr}${ampm}`;
}

export function parseBedtimeToMs(bedtimeStr: string, referenceDate: Date): number {
  const [hours, minutes] = bedtimeStr.split(":").map(Number);
  const result = new Date(referenceDate);
  result.setHours(hours, minutes, 0, 0);
  if (result.getTime() < referenceDate.getTime()) {
    result.setDate(result.getDate() + 1);
  }
  return result.getTime();
}

export function getMaxCaffeineInSleepWindowForDisplay(
  events: CaffeineEvent[],
  bedtimeStr: string,
  nowMs: number,
  halfLifeHours: number,
  windowHours: number = 6
): number {
  const nowDate = new Date(nowMs);
  const sleepTimeMs = parseBedtimeToMs(bedtimeStr, nowDate);
  const stepMs = 15 * 60 * 1000;
  const endMs = sleepTimeMs + windowHours * 3600000;
  let maxCaffeine = 0;
  for (let t = sleepTimeMs; t <= endMs; t += stepMs) {
    const mg = getActiveAtTime(events, t, halfLifeHours);
    if (mg > maxCaffeine) maxCaffeine = mg;
  }
  return maxCaffeine;
}

export function getSleepWindowStatusMessage(
  maxCaffeineInWindow: number
): { message: string; color: "green" | "brown" | "red" } {
  if (maxCaffeineInWindow < 30) {
    return { message: "sleep undisrupted.", color: "green" };
  } else if (maxCaffeineInWindow <= 40) {
    return { message: "May disrupt sleep for some people.", color: "brown" };
  } else {
    return { message: "More likely to disrupt sleep.", color: "red" };
  }
}

export function generateSmoothPath(
  points: { x: number; y: number }[],
  tension: number = 0.3
): string {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

export function getEventMarkersWithCollision(
  events: CaffeineEvent[],
  timeToX: (ms: number) => number,
  collisionThreshold: number = 28
): { event: CaffeineEvent; x: number; clustered: CaffeineEvent[] }[] {
  const sorted = [...events].sort(
    (a, b) => Date.parse(a.timestampISO) - Date.parse(b.timestampISO)
  );

  const markers: { event: CaffeineEvent; x: number; clustered: CaffeineEvent[] }[] = [];
  let i = 0;

  while (i < sorted.length) {
    const current = sorted[i];
    const currentX = timeToX(Date.parse(current.timestampISO));
    const clustered: CaffeineEvent[] = [current];

    let j = i + 1;
    while (j < sorted.length) {
      const nextX = timeToX(Date.parse(sorted[j].timestampISO));
      if (Math.abs(nextX - currentX) < collisionThreshold) {
        clustered.push(sorted[j]);
        j++;
      } else {
        break;
      }
    }

    markers.push({ event: current, x: currentX, clustered });
    i = j;
  }

  return markers;
}

export function getSleepStatusMessage(
  currentMg: number,
  sleepThresholdMg: number
): { message: string; color: "green" | "brown" | "red" } {
  if (currentMg <= sleepThresholdMg) {
    return { message: "Your sleep should be unaffected.", color: "green" };
  } else if (currentMg <= sleepThresholdMg * 1.4) {
    return { message: "Your sleep might be disrupted.", color: "brown" };
  } else {
    return { message: "High caffeine — might cause major disruption.", color: "red" };
  }
}

export function getPeakCaffeineWithNewEntry(
  events: CaffeineEvent[],
  newEntryMg: number,
  newEntryTimeMs: number,
  halfLifeHours: number,
  lookAheadHours: number = 24
): number {
  const tempEvent: CaffeineEvent = {
    id: "temp",
    name: "temp",
    mg: newEntryMg,
    timestampISO: new Date(newEntryTimeMs).toISOString(),
  };
  const allEvents = [...events, tempEvent];
  
  const stepMs = 15 * 60 * 1000;
  const endMs = newEntryTimeMs + lookAheadHours * 3600000;
  let peak = 0;
  
  for (let t = newEntryTimeMs; t <= endMs; t += stepMs) {
    const mg = getActiveAtTime(allEvents, t, halfLifeHours);
    if (mg > peak) peak = mg;
  }
  
  return peak;
}

export function getCaffeineAtSleepTimeWithNewEntry(
  events: CaffeineEvent[],
  newEntryMg: number,
  newEntryTimeMs: number,
  sleepTimeMs: number,
  halfLifeHours: number
): number {
  const tempEvent: CaffeineEvent = {
    id: "temp",
    name: "temp",
    mg: newEntryMg,
    timestampISO: new Date(newEntryTimeMs).toISOString(),
  };
  const allEvents = [...events, tempEvent];
  
  return getActiveAtTime(allEvents, sleepTimeMs, halfLifeHours);
}

export function getMaxCaffeineInSleepWindow(
  events: CaffeineEvent[],
  newEntryMg: number,
  newEntryTimeMs: number,
  sleepTimeMs: number,
  halfLifeHours: number,
  windowHours: number = 6
): number {
  const tempEvent: CaffeineEvent = {
    id: "temp",
    name: "temp",
    mg: newEntryMg,
    timestampISO: new Date(newEntryTimeMs).toISOString(),
  };
  const allEvents = [...events, tempEvent];
  
  const stepMs = 15 * 60 * 1000;
  const endMs = sleepTimeMs + windowHours * 3600000;
  let maxCaffeine = 0;
  
  for (let t = sleepTimeMs; t <= endMs; t += stepMs) {
    const mg = getActiveAtTime(allEvents, t, halfLifeHours);
    if (mg > maxCaffeine) maxCaffeine = mg;
  }
  
  return maxCaffeine;
}

export function getCaffeineLimitStatus(
  peakMg: number,
  optimalLimit: number
): "safe" | "warning" | "danger" {
  const percentage = (peakMg / optimalLimit) * 100;
  if (percentage > 100) return "danger";
  if (percentage >= 90) return "warning";
  return "safe";
}

export function getSleepImpactStatus(
  caffeineAtSleepMg: number
): "safe" | "warning" | "danger" {
  if (caffeineAtSleepMg > 40) return "danger";
  if (caffeineAtSleepMg >= 30) return "warning";
  return "safe";
}
