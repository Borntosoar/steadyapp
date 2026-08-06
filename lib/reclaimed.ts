/* The reclaimed-hours engine.
 *
 * This is the only headline metric in Steady. It answers one question:
 *   "How many hours did you get back this week, compared to where you started?"
 *
 * Why time and not distress: distress is the clinical variable but it is abstract, and
 * a falling SUDS score is easy to disbelieve on a bad day. Hours are concrete, they are
 * the thing appearance preoccupation actually steals, and — critically — the metric
 * cannot be reinterpreted as a statement about how someone looks. There is no way to
 * game "hours reclaimed" into appearance monitoring, which is exactly why it is safe to
 * make it the number people chase.
 *
 * Pure functions only. No imports from the store, no side effects — so the whole thing
 * is unit-testable without mounting React. */

import type { CheckIn, Baseline } from '../types';

export interface ReclaimedResult {
  /** Hours reclaimed across the window, vs baseline. Negative means more time lost. */
  hours: number;
  /** Minutes/day difference. Positive = fewer minutes lost than baseline. */
  minutesPerDayDelta: number;
  /** Mean daily preoccupation minutes across the window. */
  currentAvgDailyMinutes: number;
  baselineDailyMinutes: number;
  /** How many check-ins the window actually contains. */
  sampleSize: number;
  /** False when there is not enough data to say anything honest. */
  hasData: boolean;
  /** 'up' | 'flat' | 'down' — drives copy tone, never a value judgment. */
  direction: 'up' | 'flat' | 'down';
}

const EMPTY: ReclaimedResult = {
  hours: 0,
  minutesPerDayDelta: 0,
  currentAvgDailyMinutes: 0,
  baselineDailyMinutes: 0,
  sampleSize: 0,
  hasData: false,
  direction: 'flat',
};

/** Anything inside ±0.25h/week is noise, not signal. Reporting a 6-minute "gain" as
 *  progress would be dishonest, and dishonest numbers are how a tool like this loses
 *  the user the first time they notice. */
const FLAT_BAND_HOURS = 0.25;

export function meanDailyMinutes(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const total = checkIns.reduce((sum, c) => sum + c.preoccupationMinutes, 0);
  return total / checkIns.length;
}

/**
 * Core calculation.
 *
 * hours = (baselineDailyMinutes − currentAvgDailyMinutes) × days / 60
 *
 * `days` defaults to 7 (a week) but is passed explicitly so the same function serves
 * the home card, the insights chart, and the tests without a second implementation.
 */
export function computeReclaimed(
  baseline: Baseline | null,
  windowCheckIns: CheckIn[],
  days = 7
): ReclaimedResult {
  if (!baseline || windowCheckIns.length === 0) return EMPTY;

  const baselineDailyMinutes = baseline.preoccupationMinutes;
  const currentAvgDailyMinutes = meanDailyMinutes(windowCheckIns);
  const minutesPerDayDelta = baselineDailyMinutes - currentAvgDailyMinutes;
  const hours = (minutesPerDayDelta * days) / 60;

  let direction: ReclaimedResult['direction'] = 'flat';
  if (hours > FLAT_BAND_HOURS) direction = 'up';
  else if (hours < -FLAT_BAND_HOURS) direction = 'down';

  return {
    hours: round1(hours),
    minutesPerDayDelta: Math.round(minutesPerDayDelta),
    currentAvgDailyMinutes: Math.round(currentAvgDailyMinutes),
    baselineDailyMinutes,
    sampleSize: windowCheckIns.length,
    hasData: true,
    direction,
  };
}

/** Filter check-ins to the N days ending today (inclusive). */
export function checkInsInLastDays(checkIns: CheckIn[], days: number, now = new Date()): CheckIn[] {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return checkIns.filter((c) => {
    const d = new Date(c.date + 'T00:00:00');
    return d >= cutoff && d <= now;
  });
}

/** Cumulative hours reclaimed across the whole history, week by week.
 *  Used by the hero chart on /insights. */
export function reclaimedByWeek(
  baseline: Baseline | null,
  checkIns: CheckIn[]
): { week: number; hours: number }[] {
  if (!baseline || checkIns.length === 0) return [];

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(sorted[0].date + 'T00:00:00');
  const buckets = new Map<number, CheckIn[]>();

  for (const c of sorted) {
    const d = new Date(c.date + 'T00:00:00');
    const weekIndex = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
    const arr = buckets.get(weekIndex) ?? [];
    arr.push(c);
    buckets.set(weekIndex, arr);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekIndex, group]) => ({
      week: weekIndex + 1,
      hours: computeReclaimed(baseline, group, 7).hours,
    }));
}

/**
 * Copy for the home card.
 *
 * The rule that governs every branch here: a flat or negative week is reported
 * neutrally and curiously, never with disappointment. Someone whose week went badly is
 * exactly the person most at risk, and the last thing they need from an app is to be
 * told they underperformed. There is no "you slipped" string anywhere in this function,
 * and there must never be one.
 */
export function reclaimedCopy(r: ReclaimedResult, firstName?: string): {
  headline: string;
  sub: string;
} {
  const who = firstName ? `${firstName}, ` : '';

  if (!r.hasData) {
    return {
      headline: 'Your number starts here',
      sub: 'Check in for a few days and this becomes real. Nothing to calculate yet.',
    };
  }

  if (r.sampleSize < 3) {
    return {
      headline: 'Still gathering',
      sub: `${r.sampleSize} check-in${r.sampleSize === 1 ? '' : 's'} so far. A few more and this number means something.`,
    };
  }

  if (r.direction === 'up') {
    const h = Math.abs(r.hours);
    return {
      headline: `${h} ${h === 1 ? 'hour' : 'hours'} back this week`,
      sub: `About ${Math.abs(r.minutesPerDayDelta)} fewer minutes a day than when you started. That time went somewhere — what did you do with it?`,
    };
  }

  if (r.direction === 'flat') {
    return {
      headline: 'This week held steady',
      sub: `${who}holding is its own result, and most weeks are like this one. The line moves over months, not days.`,
    };
  }

  // Negation is avoided here on purpose: telling someone "this isn't a failure" puts the
  // word in front of them anyway. The copy simply never introduces the idea.
  return {
    headline: 'A heavier week',
    sub: 'More time went to it than at baseline. Weeks like this are ordinary, and they carry information — worth noticing what was different about this one.',
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
