import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* The opening survey.
 *
 * WHAT IT IS AND WHAT IT IS DELIBERATELY NOT. Three questions, asked once, on first launch.
 * It is not an intake form and it does not produce a diagnosis, a score, or a label. It ends
 * with a sentence in plain language naming what somebody said they are carrying, and then
 * three things that already exist in the app.
 *
 * THE ONE RULE THAT DECIDED THE SHAPE. The founder chose "survey now, routing later", and
 * that choice is the reason this file can be honest. Two games exist. A survey that promised
 * a version of the app "built for grief" and then handed over the same two games would fail
 * at the exact moment the person decides whether to trust it — which the brief correctly
 * identifies as the most important moment in the product. So the survey sets the app's TONE
 * and its featured calm-down mode and the order of what is on the home screen, and it claims
 * nothing else. When there are eight games it can claim more. Not before.
 *
 * WHY THE ANSWERS ARE LANDSCAPES. The brief asks for texture tiles rather than text buttons
 * or emoji, and the app already has the machinery: every tile is an atmosphere ramp with a
 * motif scattered on it, the same pair the games use for their scenes. A tile therefore reads
 * as a time of day and a weather rather than as a category with a name, which is closer to
 * how the thing being asked about actually feels.
 *
 * CRISIS IS AN EXPLICIT ANSWER, NEVER AN INFERENCE. There is one option, in the first
 * question, in plain words. Choosing it ends the survey immediately and opens the support
 * screen — no games, no reflection, no "and here are three things for you". The app must
 * never try to detect this from anything else: risk classification from survey wording or
 * play patterns is unvalidated, and a false positive throws a crisis screen at somebody who
 * is fine and teaches them the app is watching them. The 31 regions of real numbers already
 * shipped in constants/support.ts are the answer, and they are one tap from every screen
 * anyway.
 *
 * NO REACT-NATIVE IMPORTS — the suite loads this under bare Node. */

/** What somebody said they are carrying. Never shown as a word to the user, never stored as
 *  a diagnosis, and deliberately smaller than the fourteen categories in the brief: these are
 *  the shapes the app currently has a different answer for. */
export type Carrying =
  | 'spirals'
  | 'flat'
  | 'loss'
  | 'spent'
  | 'harsh'
  | 'unmoored'
  | 'looking';

export interface Tile {
  key: string;
  /** Plain, first person, and about experience rather than condition. */
  label: string;
  /** The ground this tile is drawn on. */
  mood: SceneMood;
  motif: MotifKind;
}

export interface Question {
  id: string;
  /** Asked in the app's voice. Warm, and never clinical. */
  ask: string;
  /** One line under it, or nothing. */
  note?: string;
  tiles: Tile[];
}

/* ---------- question one: what brought you here ----------
 *
 * Open and warm, per the brief. Every option describes a experience rather than naming a
 * condition — "I cannot stop thinking" rather than "anxiety" — because somebody who has
 * never been given a word for what is happening should not have to pick one to get in. */

export const CRISIS_TILE = 'crisis';

const Q1: Question = {
  id: 'brought-you',
  ask: 'What brought you here?',
  note: 'Whatever is closest. Nothing here is a diagnosis.',
  tiles: [
    { key: 'spirals', label: 'I cannot stop thinking', mood: 'smallHours', motif: 'loops' },
    { key: 'flat', label: 'Everything feels flat', mood: 'morning', motif: 'rays' },
    { key: 'loss', label: 'I lost someone, or something', mood: 'evening', motif: 'moons' },
    { key: 'spent', label: 'I am running on empty', mood: 'daylight', motif: 'papers' },
    { key: 'harsh', label: 'I am hard on myself', mood: 'evening', motif: 'rings' },
    { key: 'unmoored', label: 'Everything changed at once', mood: 'tender', motif: 'paths' },
    { key: 'looking', label: 'Just looking around', mood: 'daylight', motif: 'messages' },
    /* Last, in plain words, and not dressed as a landscape. It is the one answer that must
       not look like a mood to be browsed past. */
    { key: CRISIS_TILE, label: 'I am thinking about hurting myself', mood: 'evening', motif: 'rings' },
  ],
};

/* ---------- question two: what you have already tried ----------
 *
 * The brief is right that this is the most useful question in the survey, and the reason is
 * not content — it is TONE. Somebody who has been through therapy and three apps and is
 * still here has heard every reassuring sentence this app could produce, and producing them
 * anyway is how it loses them on the first screen. Somebody for whom this is the first thing
 * they have ever opened needs the opposite. */

const Q2: Question = {
  id: 'already-tried',
  ask: 'Have you tried anything for this before?',
  note: 'This only changes how the app talks to you.',
  tiles: [
    { key: 'first', label: 'This is the first thing', mood: 'morning', motif: 'rays' },
    { key: 'some', label: 'A few things, on and off', mood: 'daylight', motif: 'paths' },
    { key: 'apps', label: 'Apps. They did not stick', mood: 'evening', motif: 'messages' },
    { key: 'therapy', label: 'Therapy, now or before', mood: 'tender', motif: 'hearts' },
    { key: 'lots', label: 'Most of it. Nothing held', mood: 'smallHours', motif: 'loops' },
  ],
};

/* ---------- question three: when it is worst ----------
 *
 * Two jobs. It picks the featured calm-down mode, and it is the one answer the home screen
 * can act on immediately without claiming anything — somebody whose worst hour is 2am should
 * not open to the same screen as somebody whose worst hour is Monday morning. */

const Q3: Question = {
  id: 'when-worst',
  ask: 'When is it worst?',
  tiles: [
    { key: 'night', label: 'At night, when it is quiet', mood: 'smallHours', motif: 'loops' },
    { key: 'waking', label: 'The moment I wake up', mood: 'morning', motif: 'rays' },
    { key: 'people', label: 'Around other people', mood: 'evening', motif: 'rings' },
    { key: 'anytime', label: 'It does not really stop', mood: 'daylight', motif: 'papers' },
  ],
};

export const QUESTIONS: Question[] = [Q1, Q2, Q3];

/** Hard ceiling from the brief, enforced by test. A fourth question is a form. */
export const MAX_QUESTIONS = 5;

/* ---------- the reflection ----------
 *
 * One or two sentences that name what somebody said, in their own register, and claim
 * nothing beyond it. The brief calls this the moment the user decides whether to trust the
 * app, and the way to lose that moment is to over-reach: no promise about outcomes, no
 * "we understand you", no condition named. Describe, then get out of the way. */

export const REFLECTION: Record<Carrying, string> = {
  spirals:
    'The thinking is doing most of the damage, and it does it hardest when there is nothing else in the room.',
  flat:
    'Not sharp pain — the other thing, where it all goes grey and getting started is the hard part.',
  loss:
    'Something is gone, and the rest of it has carried on as though that were a normal thing to happen.',
  spent:
    'You are still doing all of it. That is usually what makes this one so hard to say out loud.',
  harsh:
    'The voice doing the running commentary is yours, and it would never speak to anybody else that way.',
  unmoored:
    'The ground moved, and the version of you that knew what to do lived on the old ground.',
  looking:
    'No particular reason to be here, or none you want to write down yet. That is a fine way to arrive.',
};

/** Which calm-down mode is featured, by when it is worst. The one immediate, honest use of
 *  an answer: it changes what is on the home screen, and nothing about that is a claim. */
export const FEATURED_CALM: Record<string, string> = {
  night: 'Float',
  waking: 'Breathe',
  people: 'Breathe',
  anytime: 'Reset',
};
