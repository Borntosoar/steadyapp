/* What things are called.
 *
 * ONE NAME PER THING, and this file is the only place any of them is written down.
 *
 * Before this existed the app called the same activity three different things depending on
 * which screen you were standing on. Tapping "Ride out an urge" on the home screen opened a
 * screen titled "Urges", whose finish screen talked about surfing. "Take a thought apart"
 * on Practice opened "Write it out", which saved a "thought record" into "Recent records".
 * Nothing was wrong with any individual word. The problem is that a person cannot build a
 * map of an app whose landmarks are renamed between glances — they end up unsure whether
 * they have found a new feature or the same one again, and that uncertainty reads as the
 * app being complicated.
 *
 * The rule for choosing each name: a verb and an object, in words somebody would use out
 * loud. "Ride out an urge", not "urge surfing". "Take a thought apart", not "thought
 * record". Where the clinical term is worth knowing, the module teaches it; the button
 * never assumes it.
 *
 * __tests__/names.test.mjs asserts that the retired terms do not reappear in any screen. */

export const NAMES = {
  urge: {
    /** Screen title and every entry point. */
    title: 'Ride out an urge',
    /** What one completed thing is called, e.g. "3 this week". */
    unit: 'urge you sat through',
    unitPlural: 'urges you sat through',
    sub: 'Three minutes with it, without acting on it',
  },
  mirror: {
    title: 'Mirror practice',
    unit: 'mirror session',
    unitPlural: 'mirror sessions',
    sub: 'Look, on purpose, for a set time',
  },
  thought: {
    title: 'Take a thought apart',
    unit: 'thought you took apart',
    unitPlural: 'thoughts you took apart',
    sub: 'Seven questions, about five minutes',
  },
  experiment: {
    title: 'Test a prediction',
    unit: 'prediction you tested',
    unitPlural: 'predictions you tested',
    sub: 'Guess what will happen, do it, write down what did',
  },
  calm: {
    title: 'Calm down',
    unit: 'time you calmed yourself down',
    unitPlural: 'times you calmed yourself down',
    sub: 'Breathing, senses, widening your attention',
  },
  checkin: {
    title: 'Daily check-in',
    unit: 'check-in',
    unitPlural: 'check-ins',
    sub: 'Four questions, under thirty seconds',
  },
  /* The first game. The rule at the top of this file applies to games too — the row, the
     screen title and the finish line all read from here — but the name itself breaks the
     verb-and-object pattern on purpose. A practice is described; a game is named. */
  curveball: {
    title: 'Curveball',
    unit: 'round of Curveball',
    unitPlural: 'rounds of Curveball',
    sub: 'Catch the thoughts that bend, let the fair ones past',
  },
  /* Two destinations that are not practices but are things a module sends you to. They
     live here for one reason: every call to action in the app takes its label from this
     file, so twelve hand-written module buttons cannot drift away from what the rest of
     the app calls the same places. */
  hours: {
    title: 'Your hours',
    unit: 'hour back',
    unitPlural: 'hours back',
    sub: 'Where the time went, and where it is going',
  },
  plan: {
    title: 'Write your plan',
    unit: 'plan',
    unitPlural: 'plans',
    sub: 'Six sections, written now for later',
  },
} as const;

export type ThingKey = keyof typeof NAMES;

/** "1 check-in" / "3 check-ins". */
export function countOf(key: ThingKey, n: number): string {
  const t = NAMES[key];
  return `${n} ${n === 1 ? t.unit : t.unitPlural}`;
}

/* ---------- what the numbers mean ----------
 *
 * Every figure this app puts on a screen gets a plain sentence here, reachable from the
 * figure itself. The reclaimed-hours number is the headline of the whole product and it was
 * genuinely opaque: "15.8 hours back this week" begs the question "back from what?", and
 * there was nowhere to find out. Somebody who cannot answer that cannot tell whether the
 * app is working, which is the only question they actually have. */

export const EXPLAIN = {
  hours: {
    q: 'What does this number mean?',
    a: 'When you started, you told us roughly how long a day you spent thinking about how you look. Every check-in since then asks the same thing. This is the difference, added up over the last seven days. It is time that used to go to worrying and now goes somewhere else.',
  },
  urgesResisted: {
    q: 'What counts as sitting through one?',
    a: 'Any time you felt the pull to check and did not act on it. It counts whether you used the timer or not, and it counts if you left early. The only thing that matters is that you did not check.',
  },
  week: {
    q: 'What are the twelve weeks?',
    a: 'Anneal is a twelve-week plan. Each week adds one thing and gives you a short read explaining why it works. You can go slower than a week if you want to. Nothing expires and nothing is taken away if you fall behind.',
  },
  distress: {
    q: 'What does this chart show?',
    a: 'How hard each day was, from your check-ins. It is about how much the worry hurt, not about how you looked. It is meant to fall over weeks, not every day.',
  },
  avoidance: {
    q: 'What does this chart show?',
    a: 'How often worry about your looks stopped you doing something. Nothing skipped is 0. Changing your plans a bit is 1. Skipping it altogether is 2. This one usually moves last, and it is the one worth waiting for.',
  },
  plus: {
    q: 'What is Anneal+?',
    a: 'It is the paid part: weeks 2 to 12, the full picture on the Progress tab, and unlimited writing. Checking in, calming down and crisis support are free forever and are not part of it.',
  },
} as const;

export type ExplainKey = keyof typeof EXPLAIN;
