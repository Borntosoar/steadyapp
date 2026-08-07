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
