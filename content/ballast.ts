import { shuffle, type Rand } from '../lib/shuffle.ts';
import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* Ballast — the positive data log, built around the thing that actually stops it working.
 *
 * WHY THIS ONE. "I am hard on myself" is the shape the survey can currently do least for,
 * the audience is 18–30, and the brief is right that low self-esteem is a large market with
 * very little good in it. It is also the positive-psychology slot from the eight-game brief,
 * built as something with a mechanism rather than as a gratitude list.
 *
 * WHAT A POSITIVE DATA LOG IS. A global belief — "I am useless", "I let people down" — is
 * held in place by a filter that discards everything inconsistent with it. The intervention
 * is to collect the specific small counter-instances the filter throws away. It is old,
 * ordinary CBT and it is genuinely useful.
 *
 * AND WHY MOST APPS' VERSION OF IT DOES NOTHING. They ask you to list good things. You list
 * them, your mind discounts each one on the way past — anyone could do that, it was small, I
 * should have done it sooner — and the belief is untouched, because the discounting is where
 * the belief actually lives. Collecting evidence in front of a filter that deletes it is a
 * bucket with no bottom.
 *
 * SO THE DISCOUNT IS THE GAME. You pick out the small things that happened. Then each one
 * comes back with the sentence your mind would use to throw it out — already written, because
 * everybody's are the same four or five and seeing yours in print is most of the effect — and
 * the only move available is to let it stand or strike it out. Striking it out is one tap.
 * What survives goes in the ballast.
 *
 * The distortion being trained has a name in the app's taxonomy already: Discounting the
 * positive. It is never said out loud here. The player does it rather than learns it.
 *
 * NO REACT-NATIVE IMPORTS. The suite loads this under bare Node. */

/** The global sentence somebody is carrying. Chosen from a short list rather than typed —
 *  typing at the start of a session about self-criticism is a wall, and these five cover
 *  most of what people actually say. */
export interface Belief {
  id: string;
  /** First person, because this is quoted rather than described. */
  text: string;
  mood: SceneMood;
  motif: MotifKind;
}

export const BELIEFS: Belief[] = [
  { id: 'useless', text: 'I am useless', mood: 'smallHours', motif: 'loops' },
  { id: 'letdown', text: 'I let people down', mood: 'tender', motif: 'hearts' },
  { id: 'behind', text: 'I am behind everybody else', mood: 'daylight', motif: 'papers' },
  { id: 'toomuch', text: 'I am too much', mood: 'evening', motif: 'rings' },
  { id: 'boring', text: 'There is nothing interesting about me', mood: 'evening', motif: 'messages' },
];

/** The five sentences a mind uses to throw evidence away. Everybody's are the same, which is
 *  why they can be pre-written — and seeing your own in somebody else's words is most of the
 *  point. Each maps to a real pattern in content/exercises.ts, and none of them says so. */
export type DiscountId = 'anyone' | 'small' | 'late' | 'undo' | 'luck';

export const DISCOUNTS: Record<DiscountId, string> = {
  anyone: 'Anyone could have done that.',
  small: 'That is too small to count.',
  late: 'I should have done it a long time ago.',
  undo: 'That does not undo the rest of it.',
  luck: 'That was circumstances, not me.',
};

/** What the app says when a discount is struck out. Never praise for the deed — praise moves
 *  the authority for what counts back outside the person, which is the exact thing this game
 *  is trying to return to them. It answers the DISCOUNT, not the action. */
export const STRUCK: Record<DiscountId, string> = {
  anyone:
    'Maybe. Anyone could have, and on that day the person who did was you. The word "anyone" is doing a lot of quiet work in that sentence.',
  small:
    'It is small. Small is the size real evidence comes in — the large kind almost never arrives, which is convenient for a belief that needs it to.',
  late:
    'Perhaps it should have been sooner. That is a separate argument, and it is being used here to settle this one.',
  undo:
    'It does not undo anything. Nothing was asked to. It sits next to the rest instead of cancelling it, which is how evidence works.',
  luck:
    'Some of it was circumstance. You were still the part of the circumstance that acted, and that part does not get subtracted.',
};

export interface Fact {
  id: string;
  /** Something ordinary that happened. Second person, past tense, and small on purpose. */
  text: string;
  /** Which beliefs this actually bears on. A fact offered against a belief it has nothing to
   *  do with is the thing that makes these exercises feel like a form. */
  against: string[];
  /** The sentence this one would most likely be thrown out with. */
  discount: DiscountId;
}

export const FACTS: Fact[] = [
  { id: 'answered', text: 'You answered a message you had been avoiding', against: ['letdown', 'useless'], discount: 'late' },
  { id: 'got-up', text: 'You got up on a day you did not want to', against: ['useless', 'behind'], discount: 'small' },
  { id: 'asked', text: 'You asked somebody for something', against: ['toomuch', 'letdown'], discount: 'anyone' },
  { id: 'finished', text: 'You finished something small', against: ['useless', 'behind'], discount: 'small' },
  { id: 'listened', text: 'You listened to somebody who needed it', against: ['boring', 'letdown'], discount: 'anyone' },
  { id: 'said-no', text: 'You said no to something', against: ['toomuch', 'letdown'], discount: 'undo' },
  { id: 'showed-up', text: 'You turned up somewhere you could have skipped', against: ['letdown', 'behind'], discount: 'anyone' },
  { id: 'made', text: 'You made something, even badly', against: ['boring', 'useless'], discount: 'small' },
  { id: 'kind', text: 'You were kind with nothing spare to give', against: ['toomuch', 'letdown'], discount: 'undo' },
  { id: 'noticed', text: 'You noticed something nobody else did', against: ['boring'], discount: 'luck' },
  { id: 'kept-on', text: 'You kept going on a week that was not working', against: ['useless', 'behind'], discount: 'luck' },
  { id: 'told', text: 'You told somebody the true version', against: ['boring', 'letdown'], discount: 'late' },
];

/** How many are offered. Enough to find two or three that are true, few enough to read. */
export const OFFERED = 6;

/** Facts that actually bear on this belief, shuffled.
 *
 *  Falls back to the whole set rather than returning an empty screen — a belief with no
 *  facts against it would render a page that says nothing, and the test below makes that
 *  fallback unreachable by requiring every belief to have enough of its own. */
export function factsFor(
  belief: string,
  rand: Rand = Math.random,
  from: readonly Fact[] = FACTS,
): Fact[] {
  const mine = from.filter((f) => f.against.includes(belief));
  return shuffle(mine.length >= 3 ? mine : from, rand).slice(0, OFFERED);
}

/* ---------- the ending ----------
 *
 * What survives is counted and nothing else is. No percentage, no streak of days evidenced,
 * and above all no claim that the belief has moved — it has not, one session does not do
 * that, and saying so would be the single most damaging sentence this game could produce. */

export function ballastLine(kept: number, offered: number): string {
  if (kept === 0) {
    return 'Every one of them got thrown out. That is worth seeing on its own — the filter is fast, and it is very rarely questioned.';
  }
  if (kept === 1) return 'One survived the sorting. It goes in as it is.';
  return `${kept} of them survived the sorting. They go in as they are.`;
}

export const BALLAST_CLOSE =
  'None of this argues with the sentence at the top. It just stops the other side of the ledger being emptied every time it fills.';
