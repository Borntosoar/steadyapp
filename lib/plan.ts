import { REFLECTION, FEATURED_CALM, CRISIS_TILE, type Carrying } from '../content/survey.ts';

/* What the survey produces.
 *
 * Three answers in, one small configuration out. Every field here is something the app can
 * act on TODAY without claiming anything it has not built — the founder chose "survey now,
 * routing later" precisely so this file would not have to lie.
 *
 * WHAT IT SETS
 *   · tone — how direct the app's voice is. Softer for loss, plainer for burnout, and
 *     considerably less reassuring for somebody who has already been through four apps.
 *   · calm — which of Breathe, Reset and Float is featured.
 *   · order — which game leads on the home screen. Only the ORDER, per the founder's
 *     choice: usage reshuffles it over the first fortnight, nothing appears or disappears.
 *   · stone — see below.
 *
 * WHAT IT DELIBERATELY DOES NOT SET. Which games EXIST. No condition. No score. No label
 * stored anywhere. `Carrying` is a shape of experience, not a diagnosis, and the word is
 * never shown to the user.
 *
 * Pure, and lib/ stays loadable under bare Node. */

export type Tone =
  /** Loss, and the first weeks of anything. Fewer words, longer pauses, no encouragement. */
  | 'quiet'
  /** The default. Plain and warm. */
  | 'plain'
  /** Burnout and the already-tried. Direct, unsentimental, gets to the point. Reassurance
   *  reads as condescension to somebody who has heard all of it. */
  | 'direct';

export interface Stone {
  key: string;
  /** What it is called. A mineral, never a level name — "Obsidian", not "Tier 3". */
  name: string;
  /** How rare this starting point is among people who open this app, roughly. Rarity is
   *  attached to WHERE SOMEBODY STARTED, never to how well they are doing. A stone you get
   *  for being less unwell would be a scoreboard with better manners. */
  rarity: 'common' | 'uncommon' | 'rare';
  /** One line, shown once, when it is given. */
  line: string;
}

/* THE STONES, AND THE ONE THING THAT MAKES THEM SAFE TO BUILD.
 *
 * The founder asked for tokens, levels and achievements by rarity. Two findings already in
 * docs/DIRECTION.md §10 sit against the token half of that: Deci, Koestner & Ryan 1999 —
 * 128 studies — found completion- and engagement-contingent rewards reduce free-choice
 * intrinsic motivation, and Six et al. 2021 found gamification moved neither outcome nor
 * adherence across 38 RCTs. Curveball's score was deleted two commits ago for the same
 * reason.
 *
 * But the stone is not that mechanic, and the distinction is worth being exact about:
 *
 *   · A CONTINGENT REWARD is a payment for performing the therapeutic act. "Meditate ten
 *     minutes, receive a token." That is what the evidence is against, and it is against it
 *     specifically because it replaces the reason you were doing the thing.
 *   · A MEMENTO is an artefact that records that you were here. It is not earned by doing
 *     the exercise correctly and cannot be lost by doing it badly.
 *
 * So the stone is given at the END of the survey, for arriving — not for completing
 * anything — and what changes about it afterwards is a record of days rather than a payment
 * for acts. Rarity is decided by the answer somebody gave on their worst night, which is
 * why nobody can farm it. Anyone who wants strict per-action tokens instead: that is a
 * change to `progress()` below and nothing else. */
export const STONES: Record<Carrying, Stone> = {
  spirals: {
    key: 'spirals',
    name: 'Quartz',
    rarity: 'common',
    line: 'Clear, and full of internal fractures you can only see in the light.',
  },
  flat: {
    key: 'flat',
    name: 'Slate',
    rarity: 'common',
    line: 'Grey the whole way through, and it splits into sheets that are good to build with.',
  },
  loss: {
    key: 'loss',
    name: 'Obsidian',
    rarity: 'rare',
    line: 'Made in one event, cooled too fast to form crystals. It keeps the sharpest edge of any stone.',
  },
  spent: {
    key: 'spent',
    name: 'Sandstone',
    rarity: 'uncommon',
    line: 'Built up one grain at a time, by something that never stopped moving.',
  },
  harsh: {
    key: 'harsh',
    name: 'Flint',
    rarity: 'uncommon',
    line: 'Hard, and it strikes sparks off itself before it strikes them off anything else.',
  },
  unmoored: {
    key: 'unmoored',
    name: 'Moonstone',
    rarity: 'rare',
    line: 'Two minerals that separated while cooling. The shifting light is the seam between them.',
  },
  looking: {
    key: 'looking',
    name: 'River pebble',
    rarity: 'common',
    line: 'Picked up on the way past. No particular reason, and it is yours now.',
  },
};

export interface Plan {
  carrying: Carrying;
  tone: Tone;
  /** 'Breathe' | 'Reset' | 'Float' */
  calm: string;
  /** Game routes, most relevant first. Order only — nothing is hidden. */
  order: string[];
  reflection: string;
  stone: Stone;
}

export interface Answers {
  /** Question one. */
  brought?: string;
  /** Question two. */
  tried?: string;
  /** Question three. */
  worst?: string;
}

/** True when the survey must stop and hand over to the support screen. Explicit answer only
 *  — never inferred from anything else. */
export const isCrisis = (a: Answers): boolean => a.brought === CRISIS_TILE;

const CARRYING = new Set<string>(Object.keys(REFLECTION));

export function carryingOf(a: Answers): Carrying {
  return (a.brought && CARRYING.has(a.brought) ? a.brought : 'looking') as Carrying;
}

/** How direct to be.
 *
 *  The second question decides most of this, and it is the whole reason that question is
 *  worth one of only three slots: somebody who answers "most of it, nothing held" has heard
 *  every gentle sentence this app knows, and producing them anyway is how it loses them
 *  before the first screen. Loss overrides in the other direction — there is no version of
 *  brisk that is right in the first weeks after somebody dies. */
export function toneOf(a: Answers): Tone {
  const carrying = carryingOf(a);
  if (carrying === 'loss') return 'quiet';
  if (a.tried === 'lots' || a.tried === 'apps') return 'direct';
  if (carrying === 'spent') return 'direct';
  if (a.tried === 'first') return 'plain';
  return 'plain';
}

/** Which game leads. Order only — every game stays reachable from Practice, because hiding
 *  one behind a survey answer means somebody who answered quickly at 2am has a smaller app
 *  forever. */
export function orderOf(a: Answers): string[] {
  const carrying = carryingOf(a);
  const curveball = '/game/curveball';
  const toward = '/game/toward';
  /* Curveball leads where the trouble is the thinking itself; Toward leads where the trouble
     is that life has narrowed around it. Both are always present. */
  const towardFirst = carrying === 'spent' || carrying === 'unmoored' || carrying === 'loss';
  return towardFirst ? [toward, curveball] : [curveball, toward];
}

export function planFor(a: Answers): Plan {
  const carrying = carryingOf(a);
  return {
    carrying,
    tone: toneOf(a),
    calm: FEATURED_CALM[a.worst ?? ''] ?? 'Breathe',
    order: orderOf(a),
    reflection: REFLECTION[carrying],
    stone: STONES[carrying],
  };
}

/* ---------- progression ----------
 *
 * A record of days, not a currency. `days` is the number of distinct days on which anything
 * at all was done — the same number the streak already counts — and the stone's state is a
 * pure function of it. Nothing is spent, nothing is lost, and doing two things in a day is
 * worth exactly what doing one is, because the alternative is an app that rewards somebody
 * for staying in it longer.
 *
 * The stages are named for what happens to a stone rather than for a level, and there is no
 * final one: `stageOf` keeps returning the last stage forever. A progression that completes
 * tells somebody there is a point at which they are done, and there is not. */
export const STAGES = ['Rough', 'Worked', 'Polished', 'Set'] as const;
export type Stage = (typeof STAGES)[number];

/** Days needed to reach each stage after the first. Widely spaced on purpose: the gap
 *  between them should be long enough that nobody is opening the app to close one. */
export const STAGE_AT = [0, 7, 30, 90];

export function stageOf(days: number): Stage {
  let i = 0;
  while (i + 1 < STAGE_AT.length && days >= STAGE_AT[i + 1]) i += 1;
  return STAGES[i];
}

/** What the stone looks like now. Pure, so the screen has no state of its own. */
export function progress(stone: Stone, days: number): { stone: Stone; stage: Stage; days: number } {
  return { stone, stage: stageOf(days), days };
}
