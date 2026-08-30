import { shuffle, type Rand } from '../lib/shuffle.ts';
import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* Toward — the ACT game.
 *
 * THE NAME IS THE CLINICAL TERM. ACT calls them toward moves and away moves. Using the
 * field's own vocabulary for the game's title means the one word a player remembers is the
 * one their therapist would use, if they ever get one.
 *
 * WHAT IT TRAINS, AND WHY IT IS NOT CURVEBALL AGAIN. Curveball asks whether a thought is
 * accurate. This game never asks that, and the difference is the whole point of ACT: the
 * thought here is pinned above the choices, is never argued with, is never disproved, and
 * is still there when the scene ends. You choose with it in the room. That is defusion —
 * the thought becomes something you are having rather than something you are obeying — and
 * it is a genuinely different skill from restructuring, not a softer version of it.
 *
 * The two games can look like they contradict each other, so the app says out loud that
 * they do not: sometimes checking a thought is the move, and sometimes the checking IS the
 * trap and the move is to go anyway. Knowing which is which is the thing worth having.
 *
 * THE MECHANIC IS THE MECHANISM. Every scene offers relief and offers movement, and never
 * both in the same option. Avoidance is scored as what it actually is — effective, cheap,
 * immediate — because a game in which avoidance is obviously the wrong button is a game
 * about nothing. The cost is not applied at the moment of choosing. It compounds: two or
 * more away moves and the later scenes arrive in their bigger form, because the thing you
 * stepped around did not leave. That is the experiential-avoidance claim, and it is the one
 * claim in this game strong enough to build a mechanic on.
 *
 * WHAT THIS GAME MUST NEVER DO. It must not score somebody's life choices. There is no
 * percentage at the end, no accuracy, no "you avoided 4 times" leaderboard. There is a
 * plain account of where the moves went and one small thing to actually do, which is
 * committed action, which is the point of the whole model.
 *
 * NO REACT-NATIVE IMPORTS — the suite loads this under bare Node. */

export interface Value {
  key: string;
  /** How it appears in the picker. First person, plain, no abstract nouns. */
  label: string;
  /** The committed action offered at the end when this value went unserved. Small enough
   *  to do this week, specific enough to know whether you did it. */
  committed: string;
}

export interface TowardOption {
  text: string;
  move: 'toward' | 'away';
  /** Which value this move serves. `null` on away moves, which serve comfort. */
  value: string | null;
  /** Immediate relief, 0–3. Away moves are required to be above zero — see the note above.
   *  Toward moves may carry relief too; some are partial, and pretending otherwise would
   *  make the game a morality play. */
  relief: number;
  /** Shown after the pick. What it bought and what it cost, in that order, and never a
   *  verdict on the person. */
  after: string;
}

export interface TowardScene {
  id: string;
  situation: string;
  /* Same per-scene ground the CBT game uses — see lib/motif.ts. It keys off which scene it
     is and never off how the run is going, which matters more here than in Curveball: this
     game deliberately has no score, and a background that warmed up on toward moves and
     cooled on away ones would put one back in through the wall. */
  mood: SceneMood;
  motif: MotifKind;
  /** The same situation later, after it was stepped around. Used once the player is at or
   *  past ESCALATE_AT away moves. */
  escalated: string;
  /** Pinned above the options for the whole scene. Never resolved, never argued with. */
  thought: string;
  options: TowardOption[];
}

/** How many away moves before the later scenes arrive in their bigger form. */
export const ESCALATE_AT = 2;

/* PASSING ON A SCENE IS NOT A MOVE, AND THAT IS THE POINT.
 *
 * Some of these land very close. "Your partner has been short with you and has not said
 * why" is an ordinary Tuesday for one person and the worst month of somebody else's life,
 * and the appointment scene is written for a person who has been avoiding a result. Until
 * this existed the only way past a scene was to play it — which means an app about not
 * avoiding things was itself leaving somebody nowhere to go.
 *
 * A pass counts as nothing at all: not an away move, so it never escalates the later
 * scenes; not a toward move, so it never inflates the ending. It gets one line and no
 * follow-up question. Anything else — asking why, offering a gentler version of the same
 * scene, keeping a tally of passes — turns an exit into a smaller room, and somebody who
 * needed the exit once will not reach for it again.
 *
 * The ending may notice, once, in plain words, that some were passed. It may not comment. */
export const PASS_LABEL = 'Not this one';
export const PASS_ACKNOWLEDGEMENT = 'Left where it was. That is allowed.';

/** How many values the player picks at the start. Two, not one: the interesting choices in
 *  this game are between two things that both matter, not between a value and nothing. */
export const VALUES_TO_PICK = 2;

/* Every value here must be served by at least one option in SCENES, and every option's
   value must appear here. A value nobody can move toward is a value the ending has nothing
   to say about, which is the one place this game could leave somebody worse off than it
   found them. __tests__/toward.test.mjs checks the two lists against each other. */
export const VALUES: Value[] = [
  {
    key: 'connection',
    label: 'Being there for people',
    committed: 'Send one message this week that you have been putting off. It does not have to explain anything.',
  },
  {
    key: 'honesty',
    label: 'Saying the true thing',
    committed: 'Say one true, small, awkward sentence out loud this week. Not the big one. A small one.',
  },
  {
    key: 'health',
    label: 'Looking after my body',
    committed: 'Book or do one thing for your body this week that you have been leaving. Pick the smallest one.',
  },
  {
    key: 'adventure',
    label: 'Trying things I have not tried',
    committed: 'Do one thing this week you would be visibly bad at, in front of at least one person.',
  },
  {
    key: 'making',
    label: 'Making things',
    committed: 'Open the unfinished thing this week and work on it badly for twenty minutes. Badly is the instruction.',
  },
  {
    key: 'growth',
    label: 'Getting better at something',
    committed: 'Pick one thing you are bad at and do the boring beginner version of it once this week.',
  },
];

export const SCENES: TowardScene[] = [
  {
    id: 'four-days-quiet',
    situation: 'A friend asked how you were. It has been four days. Every day you leave it, answering gets heavier.',
    escalated: 'It has been three weeks now. The message is still sitting there, and the silence has become the thing you would have to explain.',
    mood: 'evening',
    motif: 'messages',
    thought: 'They will think I do not care.',
    options: [
      {
        text: 'Leave it. Answer properly when you have something good to report.',
        move: 'away',
        value: null,
        relief: 3,
        after: 'That works, and it is the reason anyone does it. The evening got easier. The message did not go anywhere, and tomorrow it weighs slightly more.',
      },
      {
        text: 'Reply now, with nothing good to report.',
        move: 'toward',
        value: 'connection',
        relief: 0,
        after: 'There is no reward built into that one. The thought was still in the room while you typed, and the message went anyway. That is the whole move.',
      },
      {
        text: 'Tell them you went quiet, and do not explain why.',
        move: 'toward',
        value: 'honesty',
        relief: 0,
        after: 'You did not build a reason first. Most of the weight in that message was the explanation you thought you owed.',
      },
    ],
  },
  {
    id: 'first-session',
    situation: 'The thing you signed up for starts in an hour. You will be the least experienced person in the room and it will show.',
    escalated: 'You have skipped it twice. Walking in now means being the new person who is also three weeks behind, in front of people who have watched you not come.',
    mood: 'daylight',
    motif: 'paths',
    thought: 'You are going to look like an idiot.',
    options: [
      {
        text: 'Skip it. Go next week, once you have practised a bit.',
        move: 'away',
        value: null,
        relief: 3,
        after: 'Immediate and complete relief. It also worked last time, which is how the gap between you and the room got bigger.',
      },
      {
        text: 'Go, and be the worst one there.',
        move: 'toward',
        value: 'adventure',
        relief: 0,
        after: 'Being visibly bad at something in front of people is the actual skill. Not the activity — that part.',
      },
      {
        text: 'Go for twenty minutes and leave whenever you want.',
        move: 'toward',
        value: 'health',
        relief: 1,
        after: 'A real move, with the door left open behind you. That is not cheating. Most people need the door the first few times and stop needing it later.',
      },
    ],
  },
  {
    id: 'landed-badly',
    situation: 'Someone said something that landed badly. They are still in the room and the moment is still open.',
    escalated: 'It has happened three more times since. Saying something now means explaining why you said nothing the first three.',
    mood: 'evening',
    motif: 'rings',
    thought: 'It is not worth the argument.',
    options: [
      {
        text: 'Let it go. It is not worth it.',
        move: 'away',
        value: null,
        relief: 2,
        after: 'The room stays comfortable, and that is worth something. Worth noticing too: the thought said an argument was not worth it, and an argument was never what was on offer.',
      },
      {
        text: 'Say what you heard, and ask if that is what they meant.',
        move: 'toward',
        value: 'honesty',
        relief: 0,
        after: 'That is a question, not an argument. It costs about the same to say, which is how the thought passed itself off as caution.',
      },
      {
        text: 'Not now. Tell them tonight, properly.',
        move: 'toward',
        value: 'connection',
        relief: 1,
        after: 'A real plan, and the relief is real too. The only thing that decides which of those it was is whether tonight happens.',
      },
    ],
  },
  {
    id: 'unfinished-thing',
    situation: 'The thing you were making has sat untouched for three weeks. Opening it means seeing how far off it is.',
    escalated: 'Three months now. The distance between what it is and what you wanted grew the entire time you were not looking at it.',
    mood: 'smallHours',
    motif: 'papers',
    thought: 'It is not good, and opening it will prove it.',
    options: [
      {
        text: 'Start something new instead. That one was not working.',
        move: 'away',
        value: null,
        relief: 3,
        after: 'A new thing is genuinely exciting, and this is genuinely how people end up with nine of them. The new one reaches week three eventually.',
      },
      {
        text: 'Open it and work on it badly for twenty minutes.',
        move: 'toward',
        value: 'making',
        relief: 0,
        after: 'Badly was the instruction, and you took it. The thought probably did not get quieter while you worked. It did not have to.',
      },
      {
        text: 'Open it, only read it, and write down one thing to fix.',
        move: 'toward',
        value: 'growth',
        relief: 1,
        after: 'Looking without having to fix it is a smaller ask, and it is the one that makes the next twenty minutes possible.',
      },
    ],
  },
  {
    id: 'the-appointment',
    situation: 'You have been putting off booking it. Booking it means finding out.',
    escalated: 'Another two months have gone. The thing you did not want to know is still the thing you do not know, and now there is a number attached to how long you have not known it.',
    mood: 'morning',
    motif: 'rays',
    thought: 'If I do not know, it is not happening.',
    options: [
      {
        text: 'Leave it. Book it when things are calmer.',
        move: 'away',
        value: null,
        relief: 3,
        after: 'The relief is immediate and it is real. Things being calmer has not been the deciding factor so far.',
      },
      {
        text: 'Book it now, for the earliest they have.',
        move: 'toward',
        value: 'health',
        relief: 0,
        after: 'Nothing is resolved. You still do not know. What changed is that you stopped paying rent on not knowing.',
      },
      {
        text: 'Ask someone to sit with you while you book it.',
        move: 'toward',
        value: 'connection',
        relief: 1,
        after: 'Using a person as the thing that makes it possible is not weakness, it is what people are for. It also gets it booked.',
      },
    ],
  },
];

/* ---------- pure helpers ---------- */

/** How many scenes one run of Toward plays.
 *
 *  Three of five rather than all five, which is a change and not a tuning.
 *
 *  `app/game/toward.tsx` walked `SCENES` by index, in order, to the end — so the second run
 *  anybody ever played was the first run again, in the same sequence, one hundred per cent of
 *  it. Curveball has drawn 4 of 7 at random since it shipped; this game never got the same
 *  treatment because it was built as a single arc and nobody revisited the assumption when it
 *  became something people would open repeatedly.
 *
 *  Three is the number because of what the run has to hold. Every scene offers relief and
 *  offers movement, the away moves compound, and `ESCALATE_AT` turns the later scenes over at
 *  two — so a run needs at least three slots for that mechanic to be visible inside one
 *  sitting. Below three the escalation can only ever land on the final scene, which is where
 *  a player is least able to do anything with it. */
export const SCENES_PER_RUN = 3;

/** The scenes for one run, in a shuffled order.
 *
 *  Same contract as Curveball's `sessionScenes`: randomness is injected rather than reached
 *  for, and asking for more scenes than exist returns what exists rather than repeating one.
 *  Replaying a scene inside a single run would let a player answer from memory instead of
 *  from the choice, which is the whole thing this game is for. */
export function runScenes(
  n = SCENES_PER_RUN,
  rand: Rand = Math.random,
  from: readonly TowardScene[] = SCENES,
): TowardScene[] {
  return shuffle(from, rand).slice(0, Math.min(n, from.length));
}

/** The situation as it arrives, given how much has already been stepped around. */
export function situationFor(scene: TowardScene, awayCount: number): string {
  return awayCount >= ESCALATE_AT ? scene.escalated : scene.situation;
}

/** Options in a shuffled order. Fixed order would put the away move in the same slot every
 *  scene, and a player learns a slot far faster than they learn a distinction. */
export function optionsFor(scene: TowardScene, rand: Rand = Math.random): TowardOption[] {
  return shuffle(scene.options, rand);
}

/** Toward moves per value key, counting only the values the player actually chose. */
export function tallyByValue(picks: readonly TowardOption[], chosen: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of chosen) out[key] = 0;
  for (const p of picks) {
    if (p.move === 'toward' && p.value !== null && p.value in out) out[p.value] += 1;
  }
  return out;
}

/** The value to offer a committed action for at the end.
 *
 *  A chosen value with no toward moves comes first — that is the one the session actually
 *  found something out about. Otherwise the least-served of the chosen values. Never the
 *  best-served one: telling somebody to keep doing the thing they already did is the kind
 *  of ending that makes a game feel like it was not paying attention. */
export function actionFor(
  tally: Record<string, number>,
  chosen: readonly string[],
  values: readonly Value[] = VALUES,
): Value | null {
  if (chosen.length === 0) return null;
  const ranked = [...chosen].sort((a, b) => (tally[a] ?? 0) - (tally[b] ?? 0));
  return values.find((v) => v.key === ranked[0]) ?? null;
}

/** Label for a value key, or the key itself if it has somehow gone missing. Never throws:
 *  this is called while rendering an ending somebody has just spent three minutes earning,
 *  and the test below makes the fallback unreachable in practice. */
export function labelFor(key: string, values: readonly Value[] = VALUES): string {
  return values.find((v) => v.key === key)?.label ?? key;
}
