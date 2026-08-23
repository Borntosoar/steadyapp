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
  /** Shown when every day is done. Optional — `TRACK_CLOSE` below is the fallback, and it is
   *  deliberately number-free so a track of a different length cannot inherit a sentence
   *  claiming the wrong count. A track that names its own number states it here. */
  close?: string;
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
  close:
    'That is the seven. None of it is finished — that is not how this works — but the week has a shape now that it did not have at the start, and you built it rather than waited for it.',
};

/* ════════════════════════════════════════════════════════════════════════════════════════
 * THE SECOND TRACK — flat, grey, nothing landing.
 *
 * WHY THIS ONE NEXT. It is the shape with the strongest evidence behind it in the app's own
 * review. docs/DIRECTION.md §10.2 records what the component literature says: behavioural
 * activation is the piece to keep, cognitive restructuring probably is not additive
 * (Furukawa 2021, and Jacobson 1996 and Dimidjian 2006 from the dismantling side). Groundwork
 * already IS behavioural activation, so this track is the one place where the mechanism with
 * the best support and the mechanic already built are the same thing. It is also maximally
 * unlike the breakup track — acute loss against absent reward — which is the honest way to
 * find out whether the format generalises or whether it was one good week of writing.
 *
 * THE FACT THE WHOLE TRACK TURNS ON. Flatness is not mainly an absence of pleasure. What goes
 * is ANTICIPATION and the registering of reward afterwards — wanting and learning — while
 * in-the-moment liking is often much more intact than anybody expects. That dissociation is
 * why "do things you enjoy" fails as advice and why "do it before you want to" does not, and
 * it is the single most useful sentence this track has. Day two is entirely about it.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────
 * WHAT THIS TRACK REFUSES, AND THESE ARE NOT THE BREAKUP ONES
 *
 * The five in the header above still apply to every track. These are on top, and each one is
 * a way this specific track could be actively harmful rather than merely useless.
 *
 * 6. IT NEVER SAYS "DO THINGS YOU ENJOY." That is the presenting problem restated as the
 *    cure, and hearing it again from an app is a reason to close the app. Every instruction
 *    here is about doing regardless of wanting to, and about SIZE.
 *
 * 7. NO SLEEP, DIET OR EXERCISE ADVICE. Not one line about eight hours, daylight, or going
 *    for a run. It is what everybody has already said, being unable to do it is part of what
 *    flat IS, and repeating it converts the app into one more voice on that list. Groundwork's
 *    action deck already contains ordinary physical things without any of them being
 *    prescribed as a remedy, which is the correct amount.
 *
 * 8. NO GRATITUDE AND NO BRIGHT SIDE. A gratitude prompt handed to somebody flat reads as an
 *    accusation — the implication is that the problem is insufficient noticing. Day four does
 *    work on registering, but it works on the DISCOUNTING of things that already happened,
 *    which is the opposite operation and is Ballast's existing mechanic.
 *
 * 9. A MISSED PLAN IS INFORMATION ABOUT THE SIZE OF THE STEP, NEVER ABOUT THE PERSON. This is
 *    behavioural activation orthodoxy and it is what decides whether the track is still
 *    openable in week two. Groundwork already encodes it in KEPT_REPLY and in the fact that a
 *    miss is answered with a smaller next size rather than with anything at all about effort.
 *
 * 10. IT DOES NOT PROMISE THE FEELING COMES BACK. The honest statement is that action goes
 *     first and feeling follows unreliably and late, and any version of "you will start
 *     enjoying things again by day five" sets up a failed prediction on day three that the
 *     person will read as being about them. The close says so outright.
 *
 * WHY GROUNDWORK THREE TIMES. Because behavioural activation is the intervention and one
 * exposure to it is a demonstration rather than a method. Days one, three and seven are the
 * same mechanic pointed at the smallest possible step, at a whole day, and then at the same
 * smallest step again on purpose. Padding those slots with two more games would look more
 * varied and teach less. */

export const FLAT: Track = {
  id: 'flat',
  title: 'When nothing lands',
  blurb:
    'Seven of them, built on the one thing that holds up best: the doing comes first and the wanting turns up afterwards. Nothing in here asks you to enjoy anything.',
  /* Offered to `spent` as well as `flat`. Running on empty and going grey are not the same
     thing, and the copy is written for the second — but the method is right for both, and
     `spent` currently has nothing else pointed at it. Better an honest fit than an empty
     shelf; the survey result offers it rather than assigning it. */
  forCarrying: ['flat', 'spent'],
  days: [
    {
      id: 'the-first-move',
      title: 'The first move',
      about:
        'Almost everything tells you to wait until you feel like it. That order is backwards: the doing comes first, and the wanting turns up later, or late, or not at all.',
      game: {
        route: '/game/groundwork',
        label: 'Groundwork',
        focus: 'Keep the smallest one on the list. Small is not a compromise here, it is the method.',
      },
      practice: { route: '/grounding?tool=breath', label: 'Breathing, about eighty seconds' },
      hold: 'What is the smallest possible version of something you have stopped doing?',
      mood: 'morning',
      motif: 'rays',
    },
    {
      id: 'the-wanting',
      title: 'Wanting comes later',
      about:
        'Flat is usually not an absence of pleasure. It is an absence of looking forward, and the two come apart: a thing can land perfectly well once you are in it and still have looked like nothing from outside.',
      game: {
        route: '/game/curveball',
        label: 'Curveball',
        focus: 'Watch for the ones that are certain how something is going to feel. None of those has happened yet.',
      },
      practice: { route: '/grounding?tool=senses', label: 'Five senses, about two minutes' },
      hold: 'What did you decide was pointless before you had tried it?',
      mood: 'daylight',
      motif: 'loops',
    },
    {
      id: 'what-fell-off',
      title: 'What fell off',
      about:
        'This does not take the big things first. It takes the shower, the reply, the meal that is not eaten standing up, and it is the small missing ones that make a day feel like nothing happened.',
      game: {
        route: '/game/groundwork',
        label: 'Groundwork',
        focus: 'Lay out a whole day this time. Notice which sizes you reach for and which you leave alone.',
      },
      practice: { route: '/grounding?tool=widen', label: 'Widening attention, one minute' },
      hold: 'What went quietly, without you ever deciding to stop?',
      mood: 'evening',
      motif: 'papers',
    },
    {
      id: 'not-landing',
      title: 'Not landing',
      about:
        'Things do happen and then fail to register. An hour later it is gone, or it gets filed as luck, or as not counting, and that filing is doing more of the work here than the flatness is.',
      game: {
        route: '/game/ballast',
        label: 'Ballast',
        focus: 'The striking out is the part to watch. Each one you strike is a thing that happened and did not count.',
      },
      practice: { route: '/grounding?tool=senses', label: 'Five senses, about two minutes' },
      hold: 'What got filed as luck?',
      mood: 'evening',
      motif: 'rings',
    },
    {
      id: 'the-first-hour',
      title: 'The first hour',
      about:
        'The hour after waking decides more of the day than it has any right to, and it is the hour with the least in it. It is also when the forecast for the rest gets made, usually out of nothing.',
      /* No clock. This is the hour the day is worst in for a lot of people who are here, and
         a stopwatch is the wrong instrument for it — same reason as day one of the breakup
         track. The toggle on the intro still wins. */
      game: {
        route: '/game/curveball?clock=off',
        label: 'Curveball',
        focus: 'The forecast for the whole day is the one to catch. It gets made before anything has happened.',
      },
      practice: { route: '/grounding?tool=breath', label: 'Breathing, about eighty seconds' },
      hold: 'What does the first hour usually decide about the rest of it?',
      mood: 'morning',
      motif: 'messages',
    },
    {
      id: 'other-people',
      title: 'Other people',
      about:
        'Company is the most reliable source of anything on this list. It is also the first thing to go, because it costs the most at the point where there is nothing spare — and what to do about that is yours.',
      game: {
        route: '/game/toward',
        label: 'Toward',
        focus: 'Watch what relief costs here. Most of what shrinks a week got picked because it was cheap.',
      },
      practice: { route: '/grounding?tool=values', label: 'Values anchor, two minutes' },
      hold: 'What is the smallest amount of company you could stand?',
      mood: 'tender',
      motif: 'hearts',
    },
    {
      id: 'when-it-dips',
      title: 'When it dips',
      about:
        'This comes back. Not as a setback and not as evidence about you — it comes back the way weather does, and the thing that carries across is the method rather than the mood.',
      game: {
        route: '/game/groundwork',
        label: 'Groundwork',
        focus: 'One small thing, the same as the very first one. That it is the same is the point.',
      },
      practice: { route: '/grounding?tool=widen', label: 'Widening attention, one minute' },
      hold: 'Which one would you keep if everything else went?',
      mood: 'smallHours',
      motif: 'moons',
    },
  ],
  close:
    'That is the seven. None of it is finished — the flat part comes back, and solving it was never the plan. What you have instead is a method that runs without wanting to, which is the only kind that is any use on a week like this.',
};

export const TRACKS: Track[] = [BREAKUP, FLAT];

export const trackById = (id: string): Track | null => TRACKS.find((t) => t.id === id) ?? null;

/** Tracks offered to somebody whose survey landed on this shape. */
export const tracksFor = (carrying: string): Track[] =>
  TRACKS.filter((t) => t.forCarrying.includes(carrying));

/** Said once, on the overview, before anybody starts. The honest version of what this is. */
export const TRACK_CAVEAT =
  'This is not a treatment and it is not on a timetable. Some of it will land and some of it will not, and going slowly through it is not falling behind.';

/** The fallback close, for a track that has not written its own.
 *
 *  Deliberately not a celebration: finishing a track is not finishing the thing the track is
 *  about, and implying otherwise is the cruellest available version of this screen.
 *
 *  Also deliberately NUMBER-FREE. It used to open "That is the seven", which was true of the
 *  only track that existed and would have quietly become a lie the first time a track was
 *  five days long or nine. A track that wants to name its own count sets `close` — both of
 *  them currently do — and __tests__/tracks.test.mjs checks any number named against the
 *  actual day count. */
export const TRACK_CLOSE =
  'That is all of them. None of it is finished — that is not how this works — but the week has a shape now that it did not have at the start, and you built it rather than waited for it.';

/** What the overview shows when a track is done: its own close, or the fallback. */
export const closeFor = (track: Track): string => track.close ?? TRACK_CLOSE;

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** How many days, as a word. Derived, not a literal — three screens said "seven" because
 *  both tracks happen to have seven days, and all three would have been quietly wrong the
 *  first time one was five days long. Spelled out because "a set of 7 for this" reads like a
 *  quantity and the rest of the app spells its small numbers. Falls back to the digit past
 *  ten, where spelling stops helping. */
export const daysWord = (track: Track): string =>
  NUMBERS[track.days.length] ?? String(track.days.length);
