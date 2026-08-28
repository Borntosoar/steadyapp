import type { ScriptStep } from './exercises.ts';

/* Still — the meditation layer.
 *
 * WHY IT EXISTS NOW, AND WHY IT IS A BUG FIX AS MUCH AS A FEATURE. `content/survey.ts`
 * already maps every "when is it worst" answer to one of Breathe, Reset and Float, and
 * `app/onboarding/survey.tsx` prints it to every single person who finishes the survey:
 * "Float — free, always, and never behind a week". None of the three existed. That is the
 * same shape as the relapse plan six places sold and nothing implemented, and as the
 * commitment answer onboarding collected and threw away. A survey that names a thing on the
 * screen where somebody decides whether to trust the app is the worst possible place to be
 * naming a thing that is not there.
 *
 * IT IS NOT "CALM DOWN" AND MUST NOT ABSORB IT. `app/grounding.tsx` is four short grounding
 * tools plus the hard-day path, it is load-bearing for the free-forever guarantee in
 * SAFETY.md §4, and __tests__/safety.test.mjs greps that file specifically. Still is the
 * longer, quieter thing next to it: three modes, no scoring, nothing to finish. The brief is
 * explicit that this section exists but does not dominate.
 *
 * ⚠ EVERY MECHANISM CLAIM FROM THE BRIEF IS DELIBERATELY ABSENT — see docs/DIRECTION.md §9.2
 * and §9.3, which say NSDR and yoga nidra stay as PRACTICES and that the claims attached to
 * them come out. The brief asks for "Stanford-backed yoga nidra for dopamine restoration".
 * The dopamine story traces to an n=8 uncontrolled 2002 study that never measured what it is
 * cited for. So Reset below says what it is and what it is for, and says nothing whatever
 * about dopamine, and __tests__/still.test.mjs fails if that word appears.
 *
 * THERE IS NO SOUND, AND THAT IS A GAP RATHER THAN A DECISION. The brief asks for score and
 * sound design "like a modern ambient record". The app has no audio dependency, and adding
 * one is a change to the manifest the import allowlist governs plus real audio assets. It is
 * a separate piece of work, not something to slip in here.
 *
 * NO REACT-NATIVE IMPORTS — the suite loads this under bare Node. */

export type StillMode = 'breathe' | 'reset' | 'float';

/** The keys `content/survey.ts` FEATURED_CALM produces, mapped to modes. Kept here rather
 *  than in the survey so the survey keeps naming things in the user's language and this file
 *  owns what those names resolve to. */
export const MODE_BY_NAME: Record<string, StillMode> = {
  Breathe: 'breathe',
  Reset: 'reset',
  Float: 'float',
};

export interface Mode {
  key: StillMode;
  /** What it is called. One word, always. */
  title: string;
  /** The length, in the words somebody would use. */
  length: string;
  /** One line, on the menu. */
  blurb: string;
  /** Shown before it starts. Says what it is for, and never why it works. */
  intro: string;
}

/* ---------- Breathe ----------
 *
 * ⚠ THIS IS NOT 4-7-8, AND THE DIFFERENCE IS A SAFETY ONE RATHER THAN A PREFERENCE.
 * `content/exercises.ts` BREATH is 4-7-8 for four cycles — about eighty seconds — and its
 * own outro says "If you feel lightheaded, that's normal and it passes. Four cycles is
 * enough. More isn't better." Running that pattern for the two-to-five minutes the brief
 * asks of this mode would contradict the app's own safety copy, out loud, in the same build.
 *
 * A long hold and a forced long exhale are a short intervention. What is safe to sustain is
 * a slow, even pace with no hold — in for four, out for six, which lands near six breaths a
 * minute. Same family, different job, and both stay: 4-7-8 remains the eighty-second tool on
 * Calm down for a spike, and this is the one somebody can sit in.
 *
 * `__tests__/still.test.mjs` asserts there is no hold phase here. */
export const BREATHE = {
  /** Seconds. No hold phase — see above. */
  inhale: 4,
  exhale: 6,
  /** Offered lengths, in minutes. The brief asks for two to five. */
  minutes: [2, 3, 5] as const,
  /** Shown once, under the length picker. */
  pace: 'In for four, out for six. No holding.',
  during: [
    'In.',
    'Out, slower than the in.',
    'Let the out take its time.',
    'Nothing to get right.',
  ],
  outro: 'That is the pace. You can do it anywhere, and nobody can tell you are doing it.',
} as const;

/* ---------- Reset ----------
 *
 * Non-sleep deep rest: a scripted body scan done lying down and awake. It is offered at ten
 * and twenty minutes because that is the range the practice is normally taught in.
 *
 * The script is deliberately plain and slow. It names body parts and asks for attention,
 * and it does not tell anybody what they will feel, what it is doing to them, or what they
 * should get out of it — see the tone rule in content/copy.ts and §9.2 above. */
export const RESET = {
  minutes: [10, 20] as const,
  /** Position matters enough to say once. */
  setup: 'Lie down if you can. On your back, arms a little away from your body. Eyes closed '
    + 'or nearly. You are staying awake — if you fall asleep, that is fine too.',
  /** Fractions of the chosen length rather than fixed seconds, so ten and twenty minutes run
   *  the same script at different speeds instead of needing two scripts. `at` is 0–1. */
  steps: [
    { at: 0, text: 'Let the floor take your weight. You do not have to hold yourself up.' },
    { at: 0.08, text: 'Notice your breath without changing it. Just where it is right now.' },
    { at: 0.18, text: 'Bring your attention to your feet. Both of them. Nothing to do about it.' },
    { at: 0.28, text: 'Up through your legs. Slowly. There is no hurry anywhere in this.' },
    { at: 0.38, text: 'Your hips, your lower back, wherever it is resting.' },
    { at: 0.48, text: 'Your stomach, rising and falling on its own.' },
    { at: 0.58, text: 'Your chest. Your shoulders — let them be heavier than you were holding them.' },
    { at: 0.68, text: 'Your arms, all the way to your fingers.' },
    { at: 0.78, text: 'Your jaw. Your tongue. Behind your eyes.' },
    { at: 0.88, text: 'All of it at once now. The whole body, resting.' },
    { at: 0.96, text: 'Stay here.' },
  ] as ScriptStep[],
  outro: 'Take your time getting up. Nothing needs to happen next.',
} as const;

/* ---------- Float ----------
 *
 * Open-ended. No script, no timer, no end. The brief asks for the app to get out of the way,
 * and the honest version of that is a screen with one moving thing and no text after the
 * first line — including no elapsed-time readout, which turns an open session into a
 * performance somebody can be behind on. */
export const FLOAT = {
  opening: 'No timer. Nothing to finish. Leave whenever you like.',
  outro: 'That is it. Nothing was measured.',
} as const;

export const MODES: readonly Mode[] = [
  {
    key: 'breathe',
    title: 'Breathe',
    length: 'Two to five minutes',
    blurb: 'A slow, even pace to sit inside',
    intro: 'A steady pace, held for a few minutes. Not the quick one for a spike — this is '
      + 'the one you can stay in. Follow the shape and let the out breath be the longer half.',
  },
  {
    key: 'reset',
    title: 'Reset',
    length: 'Ten or twenty minutes',
    blurb: 'Lie down and rest without sleeping',
    intro: 'Deep rest, awake, lying down. Somebody talks you slowly through your own body '
      + 'while you do nothing at all. It is rest rather than sleep, and it asks nothing of you.',
  },
  {
    key: 'float',
    title: 'Float',
    length: 'As long as you like',
    blurb: 'One moving thing, and no instructions',
    intro: 'Nothing guided. One thing moving slowly, and the app out of the way. There is no '
      + 'timer and no end — stay for ten seconds or twenty minutes.',
  },
] as const;

export const modeByKey = (k: string): Mode => MODES.find((m) => m.key === k) ?? MODES[0];

/* ---------- the words around the section ---------- */

export const STILL_TITLE = 'Still';

export const STILL_INTRO =
  'Three ways to stop for a minute. None of them is scored, none of them can be done wrong, '
  + 'and none of them is behind the subscription.';

/** Under the menu. The one thing worth saying about what this section is not. */
export const STILL_NOT_THE_POINT =
  'This is not the main part of the app, and it is not meant to be. It is here for the days '
  + 'when the rest of it is too much.';
