import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* Guided tracks. The first one is breakup recovery.
 *
 * WHAT A TRACK IS, PER THE BRIEF: a sequenced experience, not a content library. Each day
 * pairs one game, one short practice and one thing to hold in mind, and the sequence follows
 * what is actually happening rather than a release schedule.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────
 * WHAT THIS TRACK REFUSES TO DO, AND WHY EACH REFUSAL IS LOAD-BEARING
 *
 * 1. NO TIMELINE, EVER. Not "you will feel better in six weeks", not "most people are
 *    through this by day 30", not "week two is when it lifts". Recovery from a relationship
 *    ending is genuinely variable and the single most quoted figure in this space — eleven
 *    weeks — comes from a survey of undergraduates about their worst breakup, which is not
 *    a prognosis for anybody. A promised date that passes is worse than no date at all: it
 *    converts an ordinary bad month into evidence that something is wrong with you.
 *
 * 2. NO DAILY WRITING ABOUT THE BREAKUP. This is the one most guided tracks get wrong. The
 *    reliable finding in the dissolution literature is that RUMINATION maintains distress,
 *    and repeated structured reflection has been found to make things worse for people who
 *    are already high in it — which is exactly the person who downloads a breakup app. So
 *    every day carries one question to hold, and none of them requires an entry. The app
 *    cannot screen for who ruminates, so it does not hand anybody a daily reprocessing task
 *    and hope.
 *
 * 3. NO ADVICE ABOUT THEIR LIFE. Nothing here tells anybody to block a number, delete
 *    photographs, go no-contact or stop replying. Those are decisions with consequences the
 *    app cannot see — shared housing, children, work, a person who is still a friend. Day
 *    six DESCRIBES what tends to restart the clock and leaves the decision where it belongs.
 *
 * 4. NO ASSUMPTIONS ABOUT THE SHAPE OF IT. Not who left, not how long it lasted, not
 *    whether they were married, not whether it was even a romantic partner in the sense the
 *    word usually implies. The copy is checked for this — see __tests__/tracks.test.mjs.
 *
 * 5. DAYS ARE NOT DATES. "Day three" is the third one you did, not the third day since it
 *    happened. Somebody who opens this six months later is not behind.
 *
 * WHERE THE SEQUENCE COMES FROM. The arc is built on the mechanisms with the best support
 * rather than on stages-of-grief, which was written about dying and was never validated for
 * this. In order: getting through the acute part; the life that narrowed; memory editing
 * toward the good parts; self-concept, which is the specific damage a long relationship
 * does; the self-blame voice; what restarts the clock; and what the next week is for.
 *
 * REPEATS ARE HONEST. Four games over seven days means three of them appear twice, each
 * time pointed at something different. A track is a sequence, not a catalogue, and padding
 * it out to seven unique games would be the catalogue answer.
 *
 * NO REACT-NATIVE IMPORTS. The suite loads this under bare Node. */

export interface TrackDay {
  /** Stable id. Never a number, so days can be reordered without stranding progress. */
  id: string;
  /** Two or three words. Never "Day 3". */
  title: string;
  /** What is going on, in the app's voice. Two sentences at most. */
  about: string;
  /** One game. Route plus what to look for THIS time, since games recur. */
  game: { route: string; label: string; focus: string };
  /** One short practice, deep-linked so nobody lands on a menu of five choices. */
  practice: { route: string; label: string };
  /** One question to hold. Never a field to fill in — see refusal 2 above. */
  hold: string;
  mood: SceneMood;
  motif: MotifKind;
}

export interface Track {
  id: string;
  title: string;
  /** Shown before starting. Says what it is and what it is not. */
  blurb: string;
  /** Which survey shapes this is offered to. */
  forCarrying: string[];
  days: TrackDay[];
}

export const BREAKUP: Track = {
  id: 'breakup',
  title: 'After it ended',
  blurb:
    'Seven of them, in an order that follows what usually happens rather than a calendar. Nothing here is on a schedule, nothing expires, and you can stop at any one of them.',
  forCarrying: ['loss', 'unmoored', 'harsh'],
  days: [
    {
      id: 'getting-through',
      title: 'The acute part',
      about:
        'The early part of this is closer to withdrawal than to sadness, which is why it comes in waves and why reasoning with it does not touch it. Today is about getting through an hour, not understanding anything.',
      game: {
        route: '/game/curveball?clock=off',
        label: 'Curveball',
        focus: 'Most of what arrives now is a forecast. Notice how few of them are about something that has happened.',
      },
      practice: { route: '/grounding?tool=breath', label: 'Breathing, about eighty seconds' },
      hold: 'Nothing today has to be decided.',
      mood: 'smallHours',
      motif: 'loops',
    },
    {
      id: 'what-narrowed',
      title: 'What narrowed',
      about:
        'A long relationship takes a lot of your week with it — the things you did together, and the things you quietly stopped doing on your own. The second list is the one worth looking at.',
      game: {
        route: '/game/groundwork',
        label: 'Groundwork',
        focus: 'Keep something small. The size is the whole point on a week like this.',
      },
      practice: { route: '/grounding?tool=senses', label: 'Five senses, about two minutes' },
      hold: 'What did you stop doing that had nothing to do with them?',
      mood: 'evening',
      motif: 'moons',
    },
    {
      id: 'the-edit',
      title: 'The edit',
      about:
        'Memory does not store a relationship evenly. It keeps the best evenings and quietly loses the ordinary Tuesdays and the arguments, and then hands you the edited version as though it were the whole thing.',
      game: {
        route: '/game/curveball',
        label: 'Curveball',
        focus: 'This time watch for the ones that are certain about somebody else — what they thought, what they felt, what they are doing now.',
      },
      practice: { route: '/grounding?tool=widen', label: 'Widening attention, one minute' },
      hold: 'What would you have said about it in a bad week, back when it was still going?',
      mood: 'daylight',
      motif: 'papers',
    },
    {
      id: 'who-now',
      title: 'Who you are now',
      about:
        'The specific damage a long relationship does when it ends is to the answer to "who am I" — the sense of yourself gets less clear, not just sadder. That is a real and well-described effect, and it comes back.',
      game: {
        route: '/game/toward',
        label: 'Toward',
        focus: 'Pick the two that were yours before any of this. Not the ones you shared.',
      },
      practice: { route: '/grounding?tool=values', label: 'Values anchor, two minutes' },
      hold: 'Which of these was yours first?',
      mood: 'tender',
      motif: 'paths',
    },
    {
      id: 'the-voice',
      title: 'The voice',
      about:
        'Somewhere in here is a sentence about what this says about you. It is usually short, usually absolute, and it usually arrived long before this relationship did.',
      game: {
        route: '/game/ballast',
        label: 'Ballast',
        focus: 'Pick the sentence that sounds most like the one you have been using.',
      },
      practice: { route: '/grounding?tool=breath', label: 'Breathing, about eighty seconds' },
      hold: 'Whose sentence is that, and how long have you had it?',
      mood: 'smallHours',
      motif: 'rings',
    },
    {
      id: 'what-restarts-it',
      title: 'What restarts it',
      about:
        'Certain things put you back at the beginning — a photograph, a route, a message, a Sunday. Knowing which ones is useful. What you then do about any of them is not something an app can sensibly have an opinion on.',
      game: {
        route: '/game/toward',
        label: 'Toward',
        focus: 'Watch what relief costs this time. Most of what restarts it was chosen for comfort.',
      },
      practice: { route: '/grounding?tool=senses', label: 'Five senses, about two minutes' },
      hold: 'What reliably puts you back at the start?',
      mood: 'evening',
      motif: 'hearts',
    },
    {
      id: 'the-next-week',
      title: 'The next week',
      about:
        'Not a plan for your life. One week, with something in it that you chose, which is the only unit that has been any use so far.',
      game: {
        route: '/game/groundwork',
        label: 'Groundwork',
        focus: 'Lay out one day properly. It is the same method as day two and it is meant to be.',
      },
      practice: { route: '/grounding?tool=widen', label: 'Widening attention, one minute' },
      hold: 'What is next week actually for?',
      mood: 'morning',
      motif: 'rays',
    },
  ],
};

export const TRACKS: Track[] = [BREAKUP];

export const trackById = (id: string): Track | null => TRACKS.find((t) => t.id === id) ?? null;

/** Tracks offered to somebody whose survey landed on this shape. */
export const tracksFor = (carrying: string): Track[] =>
  TRACKS.filter((t) => t.forCarrying.includes(carrying));

/** Said once, on the overview, before anybody starts. The honest version of what this is. */
export const TRACK_CAVEAT =
  'This is not a treatment and it is not on a timetable. Some of it will land and some of it will not, and going slowly through it is not falling behind.';

/** Shown when all seven are done. Deliberately not a celebration: finishing a track is not
 *  finishing the thing the track is about, and implying otherwise is the cruellest available
 *  version of this screen. */
export const TRACK_CLOSE =
  'That is the seven. None of it is finished — that is not how this works — but the week has a shape now that it did not have at the start, and you built it rather than waited for it.';
