export interface CaffeineEvent {
  id: string;
  name: string;
  mg: number;
  timestamp: string;
  iconUrl?: string;
}

export interface RecommendationInputs {
  consumedTodayMg: number;
  upcomingHoursUntilBed: number;
  currentCaffeineMg: number;
  userSensitivityFactor?: number;
  optimalDailyMg?: number;
  halfLifeHours?: number;
  sleepThresholdMg?: number;
}

export interface RecommendationResult {
  focusDoseMg: number;
  bestWindowStart: string;
  bestWindowEnd: string;
  cutoffTime: string;
  reasoning: string;
  focusDoseReasoning: string;
  bestTimeReasoning: string;
  cutoffReasoning: string;
  noSafeDose: boolean;
}

const roundTo5 = (n: number): number => Math.round(n / 5) * 5;

const roundTo15Minutes = (date: Date): Date => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const result = new Date(date);
  result.setMinutes(roundedMinutes, 0, 0);
  return result;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minuteStr = minutes.toString().padStart(2, "0");
  return `${hour12}:${minuteStr} ${ampm}`;
};

export const calculateCaffeineAtTime = (
  events: CaffeineEvent[],
  targetTime: Date,
  halfLifeHours: number = 5.5
): number => {
  let caffeine = 0;

  events.forEach((event) => {
    const eventTime = new Date(event.timestamp);
    if (eventTime <= targetTime) {
      const hoursElapsed =
        (targetTime.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
      const remainingFactor = Math.pow(0.5, hoursElapsed / halfLifeHours);
      caffeine += event.mg * remainingFactor;
    }
  });

  return Math.round(caffeine * 10) / 10;
};

export const calculateDecayCurvePoints = (
  events: CaffeineEvent[],
  startTime: Date,
  endTime: Date,
  halfLifeHours: number = 5.5,
  pointsPerHour: number = 4
): { time: Date; mg: number }[] => {
  const points: { time: Date; mg: number }[] = [];
  const totalHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const totalPoints = Math.ceil(totalHours * pointsPerHour);

  for (let i = 0; i <= totalPoints; i++) {
    const time = new Date(
      startTime.getTime() + (i / totalPoints) * (endTime.getTime() - startTime.getTime())
    );
    const mg = calculateCaffeineAtTime(events, time, halfLifeHours);
    points.push({ time, mg });
  }

  return points;
};

export const hoursNeededToDecay = (
  currentMg: number,
  targetMg: number,
  halfLifeHours: number = 5.5
): number => {
  if (currentMg <= targetMg) return 0;
  if (targetMg <= 0) targetMg = 1;
  return (halfLifeHours * Math.log(currentMg / targetMg)) / Math.log(2);
};

export const calculateRecommendations = (
  inputs: RecommendationInputs
): RecommendationResult => {
  const {
    consumedTodayMg,
    upcomingHoursUntilBed,
    currentCaffeineMg,
    userSensitivityFactor = 1.0,
    optimalDailyMg = 200,
    halfLifeHours = 5.5,
    sleepThresholdMg = 100,
  } = inputs;

  const now = new Date();

  const remainingSafeMg = Math.max(
    0,
    optimalDailyMg * userSensitivityFactor - consumedTodayMg
  );

  const noSafeDose = remainingSafeMg <= 0;

  let focusDoseMg = 0;
  let focusDoseReasoning = "";

  if (noSafeDose) {
    focusDoseMg = 0;
    focusDoseReasoning = "You've reached your daily limit. No additional caffeine recommended today.";
  } else {
    const conservativeReserveMg = Math.min(remainingSafeMg, 80);
    focusDoseMg = roundTo5(Math.min(40, conservativeReserveMg * 0.5));
    focusDoseReasoning = `Small boost for concentration. ${Math.round(remainingSafeMg)}mg remaining in your daily budget.`;
  }

  const bedtime = new Date(now.getTime() + upcomingHoursUntilBed * 60 * 60 * 1000);
  const adjustedSleepThreshold = sleepThresholdMg * userSensitivityFactor;

  const hoursToDecayCurrentToSafe = hoursNeededToDecay(
    currentCaffeineMg,
    adjustedSleepThreshold,
    halfLifeHours
  );
  const cutoffDate = roundTo15Minutes(
    new Date(bedtime.getTime() - hoursToDecayCurrentToSafe * 60 * 60 * 1000)
  );
  const cutoffTime = formatTime(cutoffDate);
  const cutoffReasoning = `Caffeine needs ${Math.round(hoursToDecayCurrentToSafe * 10) / 10} hours to reach safe sleep levels.`;

  let bestWindowEnd: Date;
  let bestWindowStart: Date;

  if (focusDoseMg > 0) {
    const hoursForDoseToDecay = hoursNeededToDecay(
      currentCaffeineMg + focusDoseMg,
      adjustedSleepThreshold,
      halfLifeHours
    );
    bestWindowEnd = roundTo15Minutes(
      new Date(bedtime.getTime() - hoursForDoseToDecay * 60 * 60 * 1000)
    );
    bestWindowStart = roundTo15Minutes(
      new Date(
        Math.max(
          now.getTime() + 30 * 60 * 1000,
          bestWindowEnd.getTime() - 2 * 60 * 60 * 1000
        )
      )
    );
  } else {
    bestWindowStart = now;
    bestWindowEnd = now;
  }

  const bestTimeReasoning =
    focusDoseMg > 0
      ? `Your ideal caffeine window for best sleep quality.`
      : `No safe window available today.`;

  return {
    focusDoseMg,
    bestWindowStart: formatTime(bestWindowStart),
    bestWindowEnd: formatTime(bestWindowEnd),
    cutoffTime,
    reasoning: noSafeDose
      ? "Daily limit reached. Focus on hydration and rest."
      : `Stay within ${Math.round(remainingSafeMg)}mg for optimal energy without sleep impact.`,
    focusDoseReasoning,
    bestTimeReasoning,
    cutoffReasoning,
    noSafeDose,
  };
};

export const getHoursUntilBedtime = (bedtimeString: string): number => {
  const now = new Date();
  const [hours, minutes] = bedtimeString.split(":").map(Number);
  const bedtime = new Date();
  bedtime.setHours(hours, minutes, 0, 0);
  if (bedtime <= now) {
    bedtime.setDate(bedtime.getDate() + 1);
  }
  return (bedtime.getTime() - now.getTime()) / (1000 * 60 * 60);
};
