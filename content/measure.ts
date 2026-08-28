/* The two validated measures, and the one rule that governs this file.
 *
 * WHAT THIS IS FOR. DIRECTION.md's win condition is measurable PHQ and GAD improvement at
 * 30, 60 and 90 days. Nothing else in the app can produce that number: the daily check-in
 * tracks appearance preoccupation in minutes, which is the right thing for the person and
 * the wrong thing for the claim. These two instruments are the claim.
 *
 * ⚠ THE ITEM TEXT BELOW IS VERBATIM AND MUST NOT BE EDITED. Not for reading level, not for
 * tone, not for house style, not to make a line fit. PHQ-8 and GAD-7 are validated against
 * these exact words, and rewording an item to sound more like the rest of the app converts a
 * measurement into an opinion that resembles one. `__tests__/measure.test.mjs` holds a
 * checksum of every item string and fails if any character changes — including the
 * newspaper-and-television line in PHQ item 7, which reads as dated precisely because it is
 * the wording the validation studies used.
 *
 * This is the one place in the repository where `__tests__/copy.test.mjs` does not apply,
 * and the exemption is registered there by name rather than by silence.
 *
 * WHY PHQ-8 AND NOT PHQ-9. PHQ-9's ninth item asks how often somebody has had thoughts of
 * being better off dead, on a four-point frequency scale. PHQ-8 is the validated eight-item
 * form that omits it, and it is the right choice here for a reason specific to this app:
 * `content/survey.ts` already asks that question, once, in plain words, as an explicit tile
 * that ends the survey on the spot and opens Support. A 0–3 Likert scale is a strictly worse
 * way to ask it, and asking twice with the worse method second is not more safety, it is
 * less. PHQ-8 is validated for severity and for change over time, which is what this is for.
 *
 * NO SCORE IS EVER SHOWN AS A SEVERITY LABEL. There is no "moderately severe" in this file
 * and there must not be one anywhere else. The app does not diagnose — the disclaimer on the
 * last onboarding step says so, `legal/ai-policy.md` says so, and a band name printed under
 * a number is a diagnosis in everything but liability. What the app shows is the number and
 * its direction since last time. See lib/measure.ts.
 *
 * LICENSING. Both instruments are free to use, reproduce and distribute without permission.
 * PHQ was developed by Spitzer, Kroenke and Williams with a Pfizer educational grant and
 * released without copyright restriction; GAD-7 the same. No attribution is required, and
 * ATTRIBUTION IS GIVEN ANYWAY on the measure screen, because somebody deciding whether to
 * answer fifteen questions about their worst fortnight is owed the provenance.
 *
 * NO REACT-NATIVE IMPORTS — the suite loads this under bare Node. */

export type MeasureKey = 'phq8' | 'gad7';

export interface Instrument {
  key: MeasureKey;
  /** What it is called in the literature. Shown as provenance, not as a screen title. */
  formalName: string;
  /** What the app calls it out loud. Plain, and about experience rather than condition. */
  plainName: string;
  /** The stem every item completes. Verbatim. */
  stem: string;
  /** The items, verbatim, in their published order. Order matters: scores are only
   *  comparable to the literature if the instrument is administered whole and in sequence. */
  items: readonly string[];
  /** Highest possible total — items × 3. Derived in lib/measure.ts, never hardcoded twice. */
  attribution: string;
}

/** The shared response set. Verbatim, and the same four for both instruments. */
export const CHOICES: readonly { value: 0 | 1 | 2 | 3; label: string }[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
] as const;

export const PHQ8: Instrument = {
  key: 'phq8',
  formalName: 'PHQ-8',
  plainName: 'How the last two weeks have gone',
  stem: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  items: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  ],
  attribution: 'PHQ-8, from the Patient Health Questionnaire by Spitzer, Kroenke and Williams. Free to use.',
};

export const GAD7: Instrument = {
  key: 'gad7',
  formalName: 'GAD-7',
  plainName: 'How worry has been',
  stem: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
  items: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
  ],
  attribution: 'GAD-7, by Spitzer, Kroenke, Williams and Löwe. Free to use.',
};

/** Both, in the order they are asked. PHQ first because it is the longer one and the
 *  drop-off is at the end, not the start — a person who quits after eight items has given a
 *  complete PHQ-8 rather than two thirds of each. */
export const INSTRUMENTS: readonly Instrument[] = [PHQ8, GAD7] as const;

/* ---------- the words around the instrument ----------
 *
 * These ARE house copy and ARE under the tone and reading-level rules. Only the items above
 * are frozen. */

/** Shown before the first item. Three jobs: say what it is for, say it is optional, and say
 *  where the answers go. In that order, because the third is the one that decides whether
 *  somebody in this position answers honestly. */
export const MEASURE_INTRO = [
  'These are two standard questionnaires, used in clinics and in research. Answering them now gives you a starting point to compare against later.',
  'You can skip this and still use every part of the app. Your answers stay on this phone, this is not a test, and nothing here is a diagnosis.',
] as const;

/** The skip control. Says what happens, not "maybe later". */
export const MEASURE_SKIP = 'Skip this — I will do it another time';

/** Shown once the last item is answered, above the number. */
export const MEASURE_DONE_TITLE = 'That is your starting point';

export const MEASURE_DONE_BODY =
  'Two numbers, saved on this phone. They mean nothing on their own — what they are for is '
  + 'the comparison in a month. The app will ask you again then.';

/** Under the numbers, every single time they are shown. Not a footnote and not dismissible:
 *  a number this shape, in an app about mental health, invites exactly the reading this
 *  sentence refuses. */
export const MEASURE_NOT_A_DIAGNOSIS =
  'These are not a diagnosis and not a score out of anything you should be aiming for. '
  + 'They are a way to see which direction things are moving.';

/** Shown when a repeat is due. */
export const MEASURE_DUE_TITLE = 'Same fifteen questions as when you started';

export const MEASURE_DUE_BODY =
  'It has been long enough to be worth asking again. Answer them the same way you did the '
  + 'first time — about the last two weeks, not about today.';
