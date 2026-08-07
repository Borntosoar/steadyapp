/* Microcopy.
 *
 * Every string the user can be shown at an emotionally loaded moment lives here rather
 * than inline, so the whole tone surface can be asserted in one place. See
 * __tests__/copy.test.mjs — it checks the entire export for shaming language, appearance
 * references, and exclamation marks.
 *
 * The rule behind the missed-day and negative-week strings: this app never tells someone
 * they failed. Shame drives concealment, concealment drives dropout, and the people most
 * likely to have a bad week are the people this most needs to keep. */

/* ---------- streak ---------- */

export const STREAK_COPY = {
  missedWithFreeze: 'No practice logged yesterday. Freeze used — streak intact.',
  missedNoFreeze: 'No practice yesterday. Starting again today, same as anyone would.',
  milestones: {
    7: 'One week of showing up.',
    30: "Thirty days. This is the point where most people stop; you didn't.",
    100: "A hundred days of practice. Look at your first week's numbers.",
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
    sub: 'Check in for a few days and this becomes real. Nothing to calculate yet.',
  },
  gathering: (n: number) => ({
    headline: 'Still gathering',
    sub: `${n} check-in${n === 1 ? '' : 's'} so far. A few more and this number means something.`,
  }),
  /* `sub` deliberately carries no digits. Every screen that shows this also shows the
     figure itself in type four times the size, so repeating it in the sentence beneath
     put the same number in front of the reader three times in one glance. */
  positive: (hours: number) => ({
    headline: `${hours} ${hours === 1 ? 'hour' : 'hours'} back this week`,
    sub: 'Back this week, measured against the day you described when you started. What did they go to?',
  }),
  flat: {
    headline: 'Roughly level',
    sub: 'Roughly level with last week. Flat weeks are part of the shape.',
  },
  negative: {
    headline: 'A heavier week',
    sub: "Higher than last week. Worth checking what changed — sleep, stress, an event. That's information, not a setback.",
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
    `You're spending about ${v.minutesPerDay} fewer minutes a day on appearance worry than in week one.`,
    `Checking urges logged: ${v.urgesLogged}, resisted: ${v.urgesResisted}.`,
  ];
  if (v.mirrorBefore !== null && v.mirrorAfter !== null) {
    parts.push(
      `Average distress before mirror sessions: ${v.mirrorBefore}. After: ${v.mirrorAfter}.`
    );
  }
  return parts.join(' ');
};

/* ---------- paywall ---------- */

export const PAYWALL_COPY = {
  headline: "You've seen your number.",
  sub: 'Weeks 2 through 12 are how you change it.',
  freeLine: 'Grounding, check-ins, and support stay free, always.',
  /* Said out loud rather than left to be discovered. Removing time pressure converts a
     little worse on the day and a lot better over a year, and in this category it is the
     difference between a brand people recommend and one they warn each other about. */
  noUrgency: 'This price is the price. It is not going up if you wait, and there is no discount coming that you would be missing.',
  comparisonTitle: 'What you get either way',
  /* Visible, not buried. Someone who cannot pay is not a lower-value user, and making
     them ask twice is a bad trade for everyone. No form, no proof, no questions. */
  hardship: {
    link: "Can't afford this right now?",
    title: 'That is not a problem',
    body: 'Take three months on us. No form, no questions, and you do not have to explain anything. If it helps and you can pay later, you can. If not, that is fine too.',
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
    body: 'Weeks two to twelve are where the mirror work, the experiments and the rest of the protocol live. Two weeks free first, and the check-in, grounding and support you have been using stay free either way.',
    action: 'See what is in it',
    dismiss: 'Not now',
  },

  'trial-ending': {
    eyebrow: 'Your trial',
    title: 'Two days left on the free period',
    body: 'Telling you before it renews is the deal we made on the way in. Nothing changes if you stay, and cancelling takes fewer taps than starting did.',
    action: 'Manage my plan',
    dismiss: 'Got it',
  },

  winback: {
    eyebrow: 'Welcome back',
    title: 'Everything is where you left it',
    body: 'Your history, your records, your longest run — all still here, exactly as they were. Gaps are part of how this goes for almost everybody. There is nothing to make up and nowhere to start from except today.',
    action: 'Open today',
    dismiss: 'Close',
  },

  plateau: {
    eyebrow: 'Worth knowing now',
    title: 'The next few weeks are the flat bit',
    body: 'Around week five the quick early change usually stops and the numbers sit still for a while. It is the most common point to decide this is not working, and it is the point where the evidence says to keep going. Flat is the middle, not the end.',
    action: 'Read the module',
    dismiss: 'Close',
  },

  'month-two-proof': {
    eyebrow: 'Two months in',
    title: 'It held',
    body: 'The early change in this kind of work is easy to explain away as a good fortnight. Holding it for two months is a different thing, and it is the part of the record worth keeping.',
    action: 'See the whole run',
    dismiss: 'Close',
  },

  'rate-app': {
    eyebrow: 'One small thing',
    title: 'Would you say so publicly?',
    body: 'Steady has no ad budget, so people find it by being told about it. If it has been useful, a review is the whole of our marketing. If it has not been, the honest thing is to say that instead.',
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
    body: 'Steady found data on this device it could not read, so it has left it exactly where it is and paused saving. Nothing has been written over. Close the app completely and open it again — if it reads next time, everything will be there.',
  },
  locked: {
    title: 'Saving is paused',
    body: 'Steady could not read this device’s storage, so it has stopped writing rather than risk covering something up. Close the app completely and open it again.',
  },
  cannotSave: {
    title: 'This device is not accepting new writes',
    body: 'Storage is full or unavailable. Everything from this session is still here on screen, and it will still be here until you close the app. Saving a backup now is the one thing that keeps it.',
    action: 'Save a backup now',
  },
};

/* ---------- disclaimer ---------- */

export const DISCLAIMER =
  "Steady is an educational self-help tool. It isn't therapy, diagnosis, or medical advice. If things are severe or getting worse, please speak to a doctor or a qualified therapist — the Support tab has options.";

export const CONTENT_FOOTER =
  'All content is general and educational, not a substitute for professional assessment or care.';

/* ---------- urge counter ----------
   The running resisted count is the single most motivating object in the app: it is a
   tally of times the user did the hard thing, and unlike a symptom score it only ever
   goes up. */

export const urgesResistedLabel = (n: number) => `Urges resisted: ${n}`;
