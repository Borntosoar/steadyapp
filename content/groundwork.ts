import { shuffle, type Rand } from '../lib/shuffle.ts';
import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* Groundwork — the behavioural activation game.
 *
 * WHY THIS ONE IS THIRD AND NOT SIXTH. Of everything in the eight-game brief, this is the
 * component with the strongest case for actually adding something. Jacobson 1996 found
 * behavioural activation alone matched full cognitive therapy; Dimidjian 2006 found it
 * matched antidepressants in more severely depressed patients and beat cognitive therapy;
 * and Furukawa 2021's component analysis of internet CBT concluded that packages "might
 * include behavioural activation" while probably not including cognitive restructuring.
 * Curveball and Toward are both built on the components that analysis is lukewarm about.
 * This is the one it is not.
 *
 * WHAT THE GAME IS. You are laying out tomorrow. Three slots — morning, afternoon, evening —
 * and a hand of small ordinary actions, each with a size. You place what you think fits.
 *
 * WHERE THE MECHANISM LIVES, AND IT IS NOT THE PLANNING. Everybody knows they should do
 * things. The error that actually keeps people stuck is SIZE: the day gets planned at the
 * scale of the person you were before, one enormous item goes in, none of it happens, and
 * the failure becomes more evidence. Graded task assignment is the clinical answer, and here
 * it is the mechanic — the ground holds three small things and gives way under one large
 * one, visibly, before anything has been committed to. Nobody is told they overreached. They
 * watch it not hold.
 *
 * THE SECOND HALF IS THE PART THAT MATTERS AND IT HAPPENS TOMORROW. One action is kept, and
 * the next time the game opens it asks whether it happened. Not to score it — the answers
 * are "it happened", "it did not", and "something else did instead", and the last of those
 * is a real outcome rather than a consolation. What a "no" gets is a question about the
 * SIZE, never about the person, because the prediction is the thing that was wrong.
 *
 * NO REACT-NATIVE IMPORTS. The suite loads this under bare Node. */

/** How heavy an action is to actually start. Not how long it takes — how much it costs to
 *  begin, which is the number depression distorts. */
export type Size = 'small' | 'medium' | 'large';

/** What the ground can hold in a day before it gives. Three smalls fit; one large plus
 *  anything does not. The numbers are the lesson, so they live here rather than in a screen:
 *  a day that holds everything teaches nothing, and a day that holds nothing is a scold. */
export const WEIGHT: Record<Size, number> = { small: 1, medium: 2, large: 4 };
export const CAPACITY = 4;

export interface Action {
  id: string;
  /** Second person, plain, and specific enough to know whether you did it. */
  text: string;
  size: Size;
  /** Which of the things a narrowed life loses first. Used to spread the hand rather than
   *  offering five versions of "go outside". */
  kind: 'moving' | 'people' | 'care' | 'making' | 'outside' | 'admin';
}

export interface Slot {
  id: string;
  label: string;
  mood: SceneMood;
  motif: MotifKind;
}

export const SLOTS: Slot[] = [
  { id: 'morning', label: 'Morning', mood: 'morning', motif: 'rays' },
  { id: 'afternoon', label: 'Afternoon', mood: 'daylight', motif: 'papers' },
  { id: 'evening', label: 'Evening', mood: 'evening', motif: 'moons' },
];

/* The hand.
 *
 * Every one of these is deliberately unimpressive. That is the design, not a lack of
 * ambition: an action list somebody reads and thinks "not today" is an action list that
 * produces another failed day, and the whole point of graded assignment is that the first
 * rung has to be low enough to be insulting. A few large ones exist so the trap is
 * available — a game where you cannot overload has nothing to show you. */
export const ACTIONS: Action[] = [
  { id: 'window', text: 'Open a window and stand at it for a minute', size: 'small', kind: 'outside' },
  { id: 'kettle', text: 'Make a drink and finish it sitting down', size: 'small', kind: 'care' },
  { id: 'shoes', text: 'Put shoes on, even if you go nowhere', size: 'small', kind: 'moving' },
  { id: 'reply', text: 'Reply to one message', size: 'small', kind: 'people' },
  { id: 'plate', text: 'Wash one thing, not everything', size: 'small', kind: 'admin' },
  { id: 'song', text: 'Play one song you used to like', size: 'small', kind: 'making' },
  { id: 'block', text: 'Walk to the end of the road and back', size: 'medium', kind: 'moving' },
  { id: 'shower', text: 'Shower, whatever time it is', size: 'medium', kind: 'care' },
  { id: 'shop', text: 'Buy one thing you need from a shop', size: 'medium', kind: 'admin' },
  { id: 'call', text: 'Ring somebody for five minutes', size: 'medium', kind: 'people' },
  { id: 'draft', text: 'Work badly on the unfinished thing for ten minutes', size: 'medium', kind: 'making' },
  { id: 'sit-out', text: 'Sit outside for ten minutes', size: 'medium', kind: 'outside' },
  { id: 'clean', text: 'Clean the whole kitchen', size: 'large', kind: 'admin' },
  { id: 'gym', text: 'Go and train properly', size: 'large', kind: 'moving' },
  { id: 'see', text: 'See a friend, in person, for the evening', size: 'large', kind: 'people' },
  { id: 'catchup', text: 'Get on top of everything you are behind on', size: 'large', kind: 'admin' },
];

/** How many are offered at once. Six is enough to have a choice and few enough to read. */
export const HAND_SIZE = 6;

/** A hand that always contains at least one large one, so the trap is reachable, and at
 *  least three small ones, so the day is always completable. A hand of six larges is a game
 *  that cannot be won, which for this audience is worse than no game. */
export function deal(rand: Rand = Math.random, from: readonly Action[] = ACTIONS): Action[] {
  const by = (s: Size) => shuffle(from.filter((a) => a.size === s), rand);
  const picked = [...by('small').slice(0, 3), ...by('medium').slice(0, 2), ...by('large').slice(0, 1)];
  return shuffle(picked, rand);
}

export const loadOf = (placed: readonly Action[]): number =>
  placed.reduce((n, a) => n + WEIGHT[a.size], 0);

export const holds = (placed: readonly Action[]): boolean => loadOf(placed) <= CAPACITY;

/* ---------- what the ground says ----------
 *
 * Never about the person. The subject of every one of these sentences is the day. */

export function groundLine(placed: readonly Action[]): string {
  const load = loadOf(placed);
  if (placed.length === 0) return 'Nothing on it yet.';
  if (load > CAPACITY) {
    return 'That is more than a bad day holds. Something here will be the reason none of it happens.';
  }
  if (load === CAPACITY) return 'Full, and it holds.';
  return 'It holds. There is room for more if you want it.';
}

/* ---------- tomorrow ---------- */

export type Kept = 'happened' | 'did-not' | 'something-else';

export const KEPT_LABELS: Record<Kept, string> = {
  happened: 'It happened',
  'did-not': 'It did not',
  'something-else': 'Something else did instead',
};

/** What the game says when it asks about yesterday. No congratulation for a yes and no
 *  consolation for a no — a "no" is information about the size of the thing, which is a fact
 *  about the plan rather than about the person who made it. */
export const KEPT_REPLY: Record<Kept, string> = {
  happened:
    'Then that is one more day with something in it. The size was right, which is worth knowing for tomorrow.',
  'did-not':
    'Then it was too big, or the day was. Both are facts about the plan. The next one can be smaller — that is the whole method, not a fallback.',
  'something-else':
    'That counts, and it counts the same. The point was never that specific thing; it was that the day had something in it that you chose.',
};

/** The suggested next size after an answer. Down on a miss, held otherwise — graded task
 *  assignment, which only works if the grading actually moves. */
export function nextSize(previous: Size, kept: Kept): Size {
  if (kept !== 'did-not') return previous;
  return previous === 'large' ? 'medium' : 'small';
}
