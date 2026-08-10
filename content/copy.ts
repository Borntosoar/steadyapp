/* Microcopy.
 *
 * Every string the user can be shown at an emotionally loaded moment lives here rather
 * than inline, so the whole tone surface can be asserted in one place. See
 * __tests__/copy.test.mjs — it checks the entire export for shaming language, appearance
 * references, and exclamation marks — and __tests__/readability.test.mjs, which holds every
 * group below to an eighth-grade reading level.
 *
 * The rule behind the missed-day and negative-week strings: this app never tells someone
 * they failed. Shame drives concealment, concealment drives dropout, and the people most
 * likely to have a bad week are the people this most needs to keep.
 *
 * READING LEVEL. This file was rewritten down to eighth grade, and the edit that did most
 * of the work was cutting sentences in half rather than swapping long words for short ones.
 * A lot of it read like a well-written pamphlet: subordinate clauses, dashes carrying the
 * turn in an argument, sentences of thirty-odd words. That register is fine on a page
 * somebody reads in a chair, and wrong on a phone held by somebody who has just had a bad
 * evening. Nothing here is dumbed down; it is just said in the order a person says it. */

import { NAMES } from './names.ts';

/* ---------- streak ---------- */

export const STREAK_COPY = {
  missedWithFreeze: 'Nothing logged yesterday. A freeze covered it, so your run is intact.',
  missedNoFreeze: 'Nothing logged yesterday. Starting again today, same as anyone would.',
  milestones: {
    7: 'One week of showing up.',
    30: 'Thirty days. Most people stop before this point. You did not.',
    100: 'A hundred days of practice. Go and look at your first week.',
  } as Record<number, string>,
  freezesBanked: (n: number) =>
    n <= 0 ? 'No streak freezes banked' : `${n} streak freeze${n === 1 ? '' : 's'} banked`,
};

/* ---------- reclaimed hours ----------
   Positive compares to baseline; flat and negative compare to last week. Both
   comparisons are computed for real in lib/reclaimed.ts — the copy says "last week"
   only where a genuine week-over-week number exists behind it. */

export const RECLAIMED_COPY = {
  empty: {
    headline: 'Your number starts here',
    sub: 'Check in for a few days and this turns into a real number.',
  },
  gathering: (n: number) => ({
    headline: 'Still adding this up',
    sub: `${n} check-in${n === 1 ? '' : 's'} so far. A few more and this number will mean something.`,
  }),
  /* `sub` deliberately carries no digits, and no longer opens by repeating the headline.
     Every screen that shows this also shows the figure itself in type four times the size,
     so the old wording put the same words in front of the reader twice in one glance. */
  positive: (hours: number) => ({
    headline: `${hours} ${hours === 1 ? 'hour' : 'hours'} back this week`,
    sub: 'Measured against the day you described when you started. What did you do instead?',
  }),
  flat: {
    headline: 'About level',
    sub: 'About the same as last week. Flat weeks are part of the shape.',
  },
  negative: {
    headline: 'A heavier week',
    sub: 'Higher than last week. It is worth asking what changed. Sleep, stress, one bad day. That is information, not a setback.',
  },
};

/* ---------- insights ---------- */

export const insightsSummary = (v: {
  minutesPerDay: number;
  urgesLogged: number;
  urgesResisted: number;
  mirrorBefore: number | null;
  mirrorAfter: number | null;
}): string => {
  const parts = [
    `You spend about ${v.minutesPerDay} fewer minutes a day on this than in week one.`,
    `Urges written down: ${v.urgesLogged}. Urges you sat through: ${v.urgesResisted}.`,
  ];
  if (v.mirrorBefore !== null && v.mirrorAfter !== null) {
    parts.push(`Distress before mirror work: ${v.mirrorBefore}. After: ${v.mirrorAfter}.`);
  }
  return parts.join(' ');
};

/* ---------- paywall ---------- */

export const PAYWALL_COPY = {
  headline: 'You have seen your number.',
  sub: 'Weeks 2 to 12 are how you change it.',
  freeLine: 'Calming down, check-ins and support stay free, always.',
  /* Said out loud rather than left to be discovered. Removing time pressure converts a
     little worse on the day and a lot better over a year, and in this category it is the
     difference between a brand people recommend and one they warn each other about. */
  noUrgency: 'This price is the price. It will not go up if you wait. There is no discount coming that you would miss.',
  comparisonTitle: 'What you get either way',
  /* Visible, not buried. Someone who cannot pay is not a lower-value user, and making
     them ask twice is a bad trade for everyone. No form, no proof, no questions. */
  hardship: {
    link: 'Cannot afford this right now?',
    title: 'That is not a problem',
    body: 'Take three months on us. No form, no questions, nothing to explain. If it helps and you can pay later, you can. If not, that is fine too.',
    confirm: 'Give me three months',
    granted: 'Done. Three months of Steady+, starting now.',
  },
};

/* ---------- moments ----------
 *
 * Everything the app says unprompted. Scheduled by lib/moments.ts, worded here so the
 * copy-safety tests in this repo cover every line of it — these are the sentences most
 * likely to be rewritten later by somebody chasing a number, and the ones where a wrong
 * word does the most damage.
 *
 * Each has a `dismiss` label that says what it does. None of them shames, none implies
 * loss, and the two that ask for something say plainly what they are asking for. */

export const MOMENT_COPY = {
  'week-one-ask': {
    eyebrow: 'Week one, done',
    title: 'That is week one',
    body: 'Weeks two to twelve hold the mirror work, the experiments and the rest of the plan. You get two weeks free first. Check-ins, calming down and support stay free either way.',
    action: 'See what is in it',
    dismiss: 'Not now',
  },

  'trial-ending': {
    eyebrow: 'Your trial',
    title: 'Two days left on the free period',
    body: 'We said we would tell you before it renews. Nothing changes if you stay. Cancelling takes fewer taps than signing up did.',
    action: 'Manage my plan',
    dismiss: 'Got it',
  },

  winback: {
    eyebrow: 'Welcome back',
    title: 'Everything is where you left it',
    body: 'Your history, your notes and your longest run are all still here. Gaps happen to almost everyone. There is nothing to make up and nowhere to start but today.',
    action: 'Open today',
    dismiss: 'Close',
  },

  plateau: {
    eyebrow: 'Worth knowing now',
    title: 'The next few weeks are the flat bit',
    body: 'Around week five the quick early change usually stops. The numbers sit still for a while. This is the most common point to decide it is not working. It is also the point where the evidence says keep going. Flat is the middle, not the end.',
    action: 'Read the module',
    dismiss: 'Close',
  },

  'month-two-proof': {
    eyebrow: 'Two months in',
    title: 'It held',
    body: 'Two good weeks are easy to write off as a good fortnight. Holding it for two months is a different thing. That is the part of the record worth keeping.',
    action: 'See the whole run',
    dismiss: 'Close',
  },

  'rate-app': {
    eyebrow: 'One small thing',
    title: 'Would you say so publicly?',
    body: 'Steady has no ad budget. People find it by being told about it. If it has helped, a review is all of our marketing. If it has not, saying that is the honest thing.',
    action: 'Write a review',
    dismiss: 'No thanks',
  },
};

/* ---------- storage health ----------
 *
 * The app holds the only copy of everything the user has written and there is no server to
 * re-fetch from, so when persistence stops working the user is the only one who can do
 * anything about it. Saying nothing was the old behaviour and it is indefensible: somebody
 * journals for weeks, every entry looks saved because it is in memory, and it is all gone
 * on the next cold start with no explanation.
 *
 * Tone rules that apply here as much as anywhere: state the fact, name the one useful
 * action, blame nobody. The user did not cause this and is not being asked to fix a
 * mistake. Never rendered on a safety surface. */

export const STORAGE_COPY = {
  unreadable: {
    title: 'Something is already saved here',
    body: 'Steady found data on this phone it could not read. It has left that data alone and paused saving, so nothing has been written over. Close the app all the way and open it again. If it reads next time, everything will be there.',
  },
  locked: {
    title: 'Saving is paused',
    body: 'Steady could not read this phone. It has stopped writing rather than risk covering something up. Close the app all the way and open it again.',
  },
  cannotSave: {
    title: 'This phone is not taking new writes',
    body: 'Storage is full, or it is not working. Everything from this session is still on screen, and it stays there until you close the app. Saving a backup now is the one thing that keeps it.',
    action: 'Save a backup now',
  },
};

/* ---------- disclaimer ---------- */

export const DISCLAIMER =
  "Steady is a self-help tool for learning. It isn't therapy, a diagnosis, or medical advice. If things are severe, or getting worse, please talk to a doctor or a therapist. The Support tab has options.";

export const CONTENT_FOOTER =
  'General information for learning. It does not replace care from a doctor.';

/* ---------- urge counter ----------
   The running resisted count is the single most motivating object in the app: it is a
   tally of times the user did the hard thing, and unlike a symptom score it only ever
   goes up.

   The noun comes from content/names.ts so this cannot drift away from what the buttons
   leading to it are called. That drift is exactly what made the app hard to follow. */

export const urgesResistedLabel = (n: number) =>
  `${n} ${n === 1 ? NAMES.urge.unit : NAMES.urge.unitPlural}`;
