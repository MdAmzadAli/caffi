export interface CaffeineEvent {
  id: string;
  name: string;
  mg: number;
  timestampISO: string;
  iconUrl?: string;
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

export function remainingAfterHours(
  doseMg: number,
  hoursSinceDose: number,
  halfLifeHours: number
): number {
  if (hoursSinceDose < 0) return 0;
  return doseMg * Math.pow(0.5, hoursSinceDose / halfLifeHours);
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
