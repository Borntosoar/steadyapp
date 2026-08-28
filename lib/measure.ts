import { INSTRUMENTS, PHQ8, GAD7, type Instrument, type MeasureKey } from '../content/measure.ts';
import type { Measure } from '../types';

/* Scoring, scheduling, and what the app is allowed to say about a number.
 *
 * Pure. No React, no store, no storage — lib/ stays loadable under bare Node so the suite
 * can exercise the arithmetic without a phone.
 *
 * THE THREE RULES THIS FILE ENFORCES, because they are the ones that would otherwise be
 * enforced by somebody remembering:
 *
 *   1. A partial instrument does not produce a score. PHQ-8 answered seven times out of
 *      eight is not a PHQ-8 of anything — it is an incomplete form, and summing it anyway
 *      produces a number that looks comparable to a complete one and is not. `score()`
 *      returns null rather than a plausible lie.
 *   2. No severity band is ever derived. There is no function here that turns 14 into
 *      "moderately severe", because the moment one exists somebody will render it.
 *   3. Direction is only claimed when it clears the instrument's reliable change threshold.
 *      A PHQ-8 that moves from 11 to 10 has not improved; it has been answered twice. See
 *      RELIABLE_CHANGE. */

export const MAX: Record<MeasureKey, number> = {
  phq8: PHQ8.items.length * 3,
  gad7: GAD7.items.length * 3,
};

/** The smallest change that is more likely real than noise.
 *
 *  Both figures come from the published minimal-clinically-important-difference work: 5
 *  points on PHQ and 4 on GAD are the conventional thresholds. They are here so that the
 *  app's language about a person's own numbers is bounded by something other than
 *  enthusiasm — "down 5" may be said as movement, "down 1" may not. */
export const RELIABLE_CHANGE: Record<MeasureKey, number> = { phq8: 5, gad7: 4 };

export const instrumentFor = (key: MeasureKey): Instrument =>
  INSTRUMENTS.find((i) => i.key === key) ?? PHQ8;

/** Total for one instrument, or null if it is not completely and validly answered.
 *
 *  Every guard here has been a real bug in this repository at least once in another shape:
 *  a wrong-length array, a non-finite number reaching a headline figure, a value outside the
 *  response set arriving from an imported backup somebody hand-edited. */
export function score(key: MeasureKey, answers: readonly number[] | undefined): number | null {
  if (!Array.isArray(answers)) return null;
  const expected = instrumentFor(key).items.length;
  if (answers.length !== expected) return null;
  let total = 0;
  for (const a of answers) {
    if (typeof a !== 'number' || !Number.isInteger(a) || a < 0 || a > 3) return null;
    total += a;
  }
  return total;
}

/** Both totals for one sitting, or null where that instrument is incomplete. */
export function scores(m: Measure): { phq8: number | null; gad7: number | null } {
  return { phq8: score('phq8', m.phq8), gad7: score('gad7', m.gad7) };
}

/** A sitting counts as taken only if BOTH instruments scored. A half-finished sitting is
 *  kept (the answers are the person's) but never becomes the baseline or a comparison
 *  point, because comparing a complete sitting to a partial one is the same error as
 *  scoring a partial one. */
export const isComplete = (m: Measure): boolean => {
  const s = scores(m);
  return s.phq8 !== null && s.gad7 !== null;
};

/** Completed sittings, in the order they were taken. The one source for every ordering
 *  question below — a second sort somewhere else is how two screens end up disagreeing about
 *  which was first.
 *
 *  ⚠ ORDER COMES FROM THE ARRAY, NOT FROM THE TIMESTAMPS, and that is a correction.
 *
 *  This used to sort by `Date.parse(takenAt)`, which trusts a clock the user controls and
 *  which is wrong on more phones than one would like. The failure it caused was not subtle:
 *  take the baseline while the phone's clock is a year fast, let the clock correct itself,
 *  and the FIRST sitting somebody ever took sorts to the END. `progressSoFar` then compares
 *  a later real sitting against it backwards and reports the direction inverted — the app
 *  telling somebody who is getting better, on a depression measure, that they are getting
 *  worse. Found by an adversarial clock-skew probe, not by any example test.
 *
 *  Append order is the more trustworthy signal and always was: `saveMeasure` appends,
 *  `normalise` rebuilds row by row without reordering, and an import is normalise over a file
 *  written in that same order. A hand-scrambled backup defeats both signals equally, so
 *  nothing is lost by preferring the one the device clock cannot corrupt. */
export const completed = (all: readonly Measure[]): Measure[] => all.filter(isComplete);

export const baselineOf = (all: readonly Measure[]): Measure | null => completed(all)[0] ?? null;

export const latestOf = (all: readonly Measure[]): Measure | null => {
  const c = completed(all);
  return c[c.length - 1] ?? null;
};

/* ---------- when to ask again ---------- */

/** Days after the baseline at which a repeat is due. DIRECTION.md's win condition names
 *  exactly these three, so they are here once and read from here everywhere. */
export const DUE_DAYS = [30, 60, 90] as const;

const DAY = 86_400_000;

/** Whole days between two ISO timestamps, or null if either is unreadable. Floor rather
 *  than round: "30 days" must mean at least thirty have passed, not twenty-nine and a half. */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.floor((b - a) / DAY);
}

/** Which milestone, if any, is owed right now.
 *
 *  Returns the LARGEST milestone that has come due and has not been answered — so somebody
 *  who ignores the app for four months is asked once, for day 90, rather than being handed
 *  three questionnaires in a row for having been away. */
export function dueMilestone(all: readonly Measure[], nowIso: string): number | null {
  const base = baselineOf(all);
  if (!base) return null;

  /* A future-dated baseline makes `elapsed` negative and no milestone is ever owed. The
     repair is NOT here — clamping the anchor to `now` at read time was tried and is wrong,
     because the anchor then moves with the clock and elapsed stays pinned at zero forever.
     A stable anchor has to be a stored value, so `normalise` in lib/storage.ts pulls an
     implausible `takenAt` back to load time and this stays a plain guard. */
  const elapsed = daysBetween(base.takenAt, nowIso);
  if (elapsed === null || elapsed < 0) return null;

  const done = new Set(completed(all).map((m) => m.milestone).filter((d): d is number => typeof d === 'number'));
  let owed: number | null = null;
  for (const d of DUE_DAYS) {
    if (elapsed >= d && !done.has(d)) owed = d;
  }
  return owed;
}

/** Has this person been offered the baseline and said no?
 *
 *  Skipping is a real answer and it has to survive a restart, or the app asks again on
 *  every launch — which is the behaviour that makes people delete a mental-health app. */
export function baselineOwed(
  all: readonly Measure[],
  skippedAt: string | null | undefined,
  nowIso: string,
): boolean {
  if (baselineOf(all)) return false;
  if (!skippedAt) return true;
  /* Clamped for the same reason as the milestone anchor above: a skip stamped by a fast
     clock is in the future forever, `since` stays negative, and the one follow-up offer
     never comes. A future stamp is treated as "just now", so the three-day wait starts from
     the first launch with a sane clock rather than never. */
  const skipMs = Date.parse(skippedAt);
  const nowMs = Date.parse(nowIso);
  const since = Number.isFinite(skipMs) && Number.isFinite(nowMs) && skipMs > nowMs
    ? 0
    : daysBetween(skippedAt, nowIso);
  /* Asked once at the end of onboarding, and once more three days later if that was a no.
     Never a third time. Two asks is a reminder; three is nagging somebody who already
     answered the question. */
  return since !== null && since >= 3;
}

/* ---------- what may be said about a change ---------- */

export interface Change {
  key: MeasureKey;
  from: number;
  to: number;
  /** Negative is fewer symptoms. Kept signed and raw — the caller decides the words. */
  delta: number;
  /** True only when |delta| clears the instrument's reliable-change threshold. */
  meaningful: boolean;
  /** 'down' is fewer symptoms, 'up' is more, 'flat' is neither by the threshold above. */
  direction: 'down' | 'up' | 'flat';
}

export function changeSince(
  from: Measure,
  to: Measure,
  key: MeasureKey,
): Change | null {
  const a = score(key, key === 'phq8' ? from.phq8 : from.gad7);
  const b = score(key, key === 'phq8' ? to.phq8 : to.gad7);
  if (a === null || b === null) return null;
  const delta = b - a;
  const meaningful = Math.abs(delta) >= RELIABLE_CHANGE[key];
  return {
    key,
    from: a,
    to: b,
    delta,
    meaningful,
    direction: !meaningful ? 'flat' : delta < 0 ? 'down' : 'up',
  };
}

/** Baseline → latest, for both instruments. Null when there is nothing to compare yet. */
export function progressSoFar(all: readonly Measure[]): { phq8: Change | null; gad7: Change | null } | null {
  const base = baselineOf(all);
  const last = latestOf(all);
  if (!base || !last || base === last) return null;
  return { phq8: changeSince(base, last, 'phq8'), gad7: changeSince(base, last, 'gad7') };
}

/** The sentence the app is allowed to say about one change.
 *
 *  Deliberately dull, and deliberately refuses to congratulate. An app that celebrates a
 *  falling depression score is an app that has told somebody their rising one is a failure,
 *  and it will do that on the worst fortnight they have had — which is exactly when the
 *  number goes up and exactly when they are reading it. */
export function changeSentence(c: Change | null): string {
  if (!c) return 'Not enough answers yet to compare.';
  if (c.direction === 'flat') {
    return `${c.from} to ${c.to}. That is close enough to the same that it is better read as no change.`;
  }
  const word = c.direction === 'down' ? 'lower' : 'higher';
  return `${c.from} to ${c.to}. That is ${Math.abs(c.delta)} points ${word} than when you started.`;
}
