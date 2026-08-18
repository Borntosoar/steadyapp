/* The reclaimed-hours engine.
 *
 * This is the only headline metric in Anneal. It answers one question:
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
import { daysBetween } from './streak.ts';
import { RECLAIMED_COPY } from '../content/copy.ts';

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
  /**
   * Mean daily minutes in the seven days BEFORE this window, when that exists.
   *
   * The hero number compares to baseline, but the flat and negative copy speak about
   * "last week" — so a real week-over-week figure has to exist behind those strings.
   * Null when there is no prior week to compare against, in which case the copy falls
   * back to baseline phrasing rather than asserting something unmeasured.
   */
  previousAvgDailyMinutes: number | null;
  /** Positive = this week used fewer minutes than last week. Null when unknown. */
  weekOverWeekDelta: number | null;
}

const EMPTY: ReclaimedResult = {
  hours: 0,
  minutesPerDayDelta: 0,
  currentAvgDailyMinutes: 0,
  baselineDailyMinutes: 0,
  sampleSize: 0,
  hasData: false,
  direction: 'flat',
  previousAvgDailyMinutes: null,
  weekOverWeekDelta: null,
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
  days = 7,
  previousWindowCheckIns: CheckIn[] = []
): ReclaimedResult {
  if (!baseline || windowCheckIns.length === 0) return EMPTY;

  const baselineDailyMinutes = baseline.preoccupationMinutes;
  const currentAvgDailyMinutes = meanDailyMinutes(windowCheckIns);
  const minutesPerDayDelta = baselineDailyMinutes - currentAvgDailyMinutes;
  const hours = (minutesPerDayDelta * days) / 60;

  let direction: ReclaimedResult['direction'] = 'flat';
  if (hours > FLAT_BAND_HOURS) direction = 'up';
  else if (hours < -FLAT_BAND_HOURS) direction = 'down';

  const previousAvgDailyMinutes = previousWindowCheckIns.length
    ? Math.round(meanDailyMinutes(previousWindowCheckIns))
    : null;

  return {
    hours: round1(hours),
    minutesPerDayDelta: Math.round(minutesPerDayDelta),
    currentAvgDailyMinutes: Math.round(currentAvgDailyMinutes),
    baselineDailyMinutes,
    sampleSize: windowCheckIns.length,
    hasData: true,
    direction,
    previousAvgDailyMinutes,
    weekOverWeekDelta:
      previousAvgDailyMinutes === null
        ? null
        : Math.round(previousAvgDailyMinutes - currentAvgDailyMinutes),
  };
}

/** Check-ins for the seven days immediately BEFORE the current window. */
export function previousWeekCheckIns(checkIns: CheckIn[], now = new Date()): CheckIn[] {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return checkIns.filter((c) => {
    const d = new Date(c.date + 'T00:00:00');
    return d >= start && d <= end;
  });
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
): { week: number; hours: number; sampleSize: number }[] {
  if (!baseline || checkIns.length === 0) return [];

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const buckets = new Map<number, CheckIn[]>();

  for (const c of sorted) {
    /* Calendar days, not raw milliseconds. Dividing timestamps put eight days in one
       bucket and six in the next across the spring-forward, because a "7 day" span that
       crosses a DST boundary measures 6.958 days and floors into the week before.
       `daysBetween` rounds, so it stays exact through both transitions. */
    const weekIndex = Math.floor(daysBetween(sorted[0].date, c.date) / 7);
    const arr = buckets.get(weekIndex) ?? [];
    arr.push(c);
    buckets.set(weekIndex, arr);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekIndex, group]) => ({
      week: weekIndex + 1,
      hours: computeReclaimed(baseline, group, 7).hours,
      /* Carried out so the caller can refuse to plot a bucket built from one or two days.
         `reclaimedCopy` already declines to state a number below three check-ins, and a
         chart that draws the same thin data as a full-height bar contradicts it. */
      sampleSize: group.length,
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
export function reclaimedCopy(r: ReclaimedResult, _firstName?: string): {
  headline: string;
  sub: string;
} {
  if (!r.hasData) return RECLAIMED_COPY.empty;
  if (r.sampleSize < 3) return RECLAIMED_COPY.gathering(r.sampleSize);

  if (r.direction === 'up') return RECLAIMED_COPY.positive(Math.abs(r.hours));

  // The flat and negative strings speak about "last week". Only use them when a real
  // week-over-week figure exists; otherwise say the baseline-true thing instead of
  // asserting a comparison that was never computed.
  const hasPriorWeek = r.previousAvgDailyMinutes !== null;

  if (r.direction === 'flat') {
    return hasPriorWeek
      ? RECLAIMED_COPY.flat
      : {
          headline: 'Roughly level',
          sub: 'About where you started. Flat weeks are part of the shape.',
        };
  }

  return hasPriorWeek
    ? RECLAIMED_COPY.negative
    : {
        headline: 'A heavier week',
        sub: "More time went to it than at your starting point. Worth checking what changed — sleep, stress, an event. That's information.",
      };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
