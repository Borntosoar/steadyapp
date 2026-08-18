/* The cost mirror.
 *
 * The first true thing Anneal shows anybody about their own life, roughly ninety seconds
 * after first open. Four answers in, one multiplication out.
 *
 * Day-one retention in health apps runs 20–30%: most people who install this are never
 * coming back, and whatever is going to reach them has to reach them in the first session.
 * A feature tour does not. Their own arithmetic does.
 *
 * THREE THINGS THIS MUST NEVER DO, and the tests enforce all three:
 *
 *   1. Promise a gain. "You could get 45 days back" is a treatment claim. The honest form
 *      is "that is 45 days a year, as things stand" — present tense, no outcome asserted.
 *   2. Compare the customer to anyone. No percentiles, no averages, no "more than most".
 *      Ranking yourself against other people is the behaviour this app exists to interrupt,
 *      and doing it on the welcome screen would be an unusually stupid way to start.
 *   3. Editorialise. No "that's a lot", no "shocking", no exclamation marks. Somebody who
 *      has just typed "four hours a day" does not need it underlined. The multiplication
 *      is the whole argument.
 *
 * The customer supplied every input, which is what makes it land — and also what makes it
 * defensible to a clinician reading over their shoulder. */

import type { Baseline } from '../types';

export interface CostMirror {
  minutesPerDay: number;
  hoursPerWeek: number;
  /** Waking days per year, at 16 waking hours. Calendar days would overstate it. */
  daysPerYear: number;
  /** Split so the figure can be set at hero size and the unit beside it at display size,
   *  the way every other number in the app is rendered. Set as one string it wraps to two
   *  lines of 68px serif and shoves everything below it off a small phone. */
  figure: string;
  unit: string;
  headline: string;
  sub: string;
  /** True once there is enough to be worth stating. Below ~15 min/day, saying "this is
   *  what it costs you" would be manufacturing a problem to sell against. */
  worthShowing: boolean;
}

const WAKING_HOURS_PER_DAY = 16;

export function costMirror(baseline: Baseline | null): CostMirror {
  const minutesPerDay = baseline?.preoccupationMinutes ?? 0;
  const hoursPerWeek = round1((minutesPerDay * 7) / 60);
  const daysPerYear = Math.round((minutesPerDay * 365) / 60 / WAKING_HOURS_PER_DAY);
  const worthShowing = minutesPerDay >= 15;

  if (!worthShowing) {
    return {
      minutesPerDay,
      hoursPerWeek,
      daysPerYear,
      worthShowing,
      figure: '',
      unit: '',
      headline: 'Not much, on a typical day',
      sub: 'Which is a good place to start from. Anneal is here to keep it there, and to give you somewhere to go on the days it climbs.',
    };
  }

  return {
    minutesPerDay,
    hoursPerWeek,
    daysPerYear,
    worthShowing,
    figure: String(hoursPerWeek),
    unit: hoursPerWeek === 1 ? 'hour a week' : 'hours a week',
    headline: `${hoursPerWeek} hours a week`,
    sub:
      daysPerYear >= 7
        ? `That is what you just described, multiplied out. Around ${daysPerYear} waking days a year, as things stand.`
        : 'That is what you just described, multiplied out over a week, as things stand.',
  };
}

/** The line under the mirror. Names the target without promising to hit it. */
export const COST_MIRROR_FOOTER =
  'Anneal measures one thing and it is this number. Not how you look, and not how you feel about how you look. Hours.';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
