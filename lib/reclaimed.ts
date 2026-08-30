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
import { daysBetween, dayKey } from './streak.ts';
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

/* THESE TWO COMPARE DAY KEYS, NOT DATES, AND THAT IS THE WHOLE POINT.
 *
 * They were the only two places in the app that built a boundary with `setHours(0,0,0,0)`
 * and then compared `Date` objects — everywhere else compares `dayKey` strings. On a day
 * whose LOCAL MIDNIGHT DOES NOT EXIST, `setHours(0,0,0,0)` resolves forward to 01:00, and
 * that hour survives the following `setDate()`. The boundary then sits an hour after the
 * oldest day's midnight and that day is silently dropped from the window.
 *
 * Most of the world moves its clocks at 02:00 or 03:00, which is why this hid: Chile, Cuba,
 * Lebanon, Egypt and Paraguay move theirs at midnight. __tests__/timezone.test.mjs covers
 * seven zones and every one of them transitions at 02:00 or later, so it could not see it.
 *
 * The cost was not cosmetic. It landed on `currentAvgDailyMinutes`, the hero number on the
 * home screen: on 2026-09-06 a Santiago user saw 21 hours where a New York user with
 * identical data saw 18.7 — and an account with exactly three check-ins dropped below the
 * "enough data" threshold and was told "Still adding this up" after doing the work.
 *
 * Reordering setHours and setDate is NOT a fix. It repairs the case where today is the
 * transition day and leaves the case where the far end of the window is. Comparing
 * YYYY-MM-DD strings is lexicographic and immune to the whole class. */

/** Check-ins for the seven days immediately BEFORE the current window. */
export function previousWeekCheckIns(checkIns: CheckIn[], now = new Date()): CheckIn[] {
  const end = new Date(now);
  end.setDate(end.getDate() - 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const lo = dayKey(start);
  const hi = dayKey(end);
  return checkIns.filter((c) => c.date >= lo && c.date <= hi);
}

/** Filter check-ins to the N days ending today (inclusive). */
export function checkInsInLastDays(checkIns: CheckIn[], days: number, now = new Date()): CheckIn[] {
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  const lo = dayKey(from);
  const hi = dayKey(now);
  return checkIns.filter((c) => c.date >= lo && c.date <= hi);
}

/** The fewest check-ins in a window before this file will state a figure at all.
 *
 *  It was the bare number 3, in `reclaimedCopy` only. `lifetimeReclaimed` needs the same
 *  threshold for the same reason — a lifetime total built partly out of weeks the app
 *  refuses to name individually is a number it has declined to say, said louder — and two
 *  copies of a rule is how the two answers drift. Three because two points is a line and a
 *  line is not a week. */
export const MIN_SAMPLE = 3;

/** Hours reclaimed PER WEEK across the whole history.
 *
 *  ⚠ NOT CUMULATIVE, and this line used to say it was. Each entry is that week's own figure,
 *  and every consumer treats it that way — the chart plots one bar per week. The word was
 *  wrong for long enough that a council seat read it, went looking for the running total it
 *  promised, and found the function did not exist. `lifetimeReclaimed` below is that
 *  function, written because the docstring had already committed the app to it.
 *
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

/** Hours already got back, across the whole history. The one number here that cannot fall.
 *
 *  WHY THIS EXISTS. Every figure this app puts in front of somebody is a rolling window or
 *  resets. `computeReclaimed` is seven days and disappears below three check-ins, so a
 *  fortnight away deletes the product from the home screen; the running streak went back to
 *  1 and was removed from Today for that reason. So there was no answer to "why open this on
 *  day 200", because nothing in it accumulated. Daylio and Bearable both retain on exactly
 *  this — the record is yours and it has 199 entries in it — and this app had the engine for
 *  it and no function.
 *
 *  ⚠ POSITIVE WEEKS ONLY, AND THAT IS A CLAIM ABOUT ENGLISH RATHER THAN ARITHMETIC. A heavy
 *  week has a negative figure, and netting it off would mean the app taking back hours
 *  somebody genuinely did get back in March because April was worse. "Hours you have already
 *  got back" is a statement about the past, and the past does not un-happen. The heavier
 *  weeks are not hidden: the signed week-by-week chart ships alongside this on Progress and
 *  includes every one of them. Two different questions, two different numbers, both true.
 *
 *  Only weeks with enough check-ins to state a figure at all are counted — `reclaimedCopy`
 *  already refuses to name a number below three, and a lifetime total built partly from
 *  thin weeks would be a number the app declines to say, said louder. */
export function lifetimeReclaimed(
  baseline: Baseline | null,
  checkIns: CheckIn[],
): { hours: number; weeks: number } {
  const weekly = reclaimedByWeek(baseline, checkIns).filter(
    (w) => w.sampleSize >= MIN_SAMPLE && w.hours > 0,
  );
  const hours = weekly.reduce((n, w) => n + w.hours, 0);
  return {
    /* Rounded once, at the end. Summing pre-rounded weekly figures drifts by up to half an
       hour per week, which on a year of data is a headline number wrong by a working day. */
    hours: Math.round(hours * 10) / 10,
    weeks: weekly.length,
  };
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
  if (r.sampleSize < MIN_SAMPLE) return RECLAIMED_COPY.gathering(r.sampleSize);

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
