import { shuffle, type Rand } from '../lib/shuffle.ts';
import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* Curveball — the CBT game, rebuilt against §10 of docs/DIRECTION.md.
 *
 * WHAT CHANGED AND WHY. The first version put the player's own thinking on trial, in the
 * second person, about something that had already happened, and then graded it. Three
 * advisors independently said the same three things, and the evidence supported all three.
 *
 *   1. THIRD PERSON, NOT SECOND. You watch someone else's thoughts arrive. Self-distanced
 *      reflection has a real literature behind it; being told "you are catastrophising" by
 *      software has none, and it is a status move besides. People are also reliably better
 *      at this on somebody else's material than on their own, which is why the thought
 *      record already asks what you would tell a friend.
 *
 *   2. BEFORE, NOT AFTER. Every situation here is about to happen. Schertz et al. 2025 —
 *      208 people, roughly 13,000 surveys — found distanced self-talk works when somebody is
 *      preparing for something and does NOT work when they are using it to feel better about
 *      something already done. The old scenes were all retrospective, which is the wrong
 *      side of that finding.
 *
 *   3. WHAT THEY DO, NOT WHICH REFRAME IS CORRECT. The naming quiz is gone: no dismantling
 *      study has ever isolated distortion-labelling, and the taxonomy is a teaching device
 *      from 1980 with overlapping categories. And "pick the most accurate reframe" trains
 *      cognitive restructuring, which Furukawa et al. 2021 found is probably NOT additive in
 *      internet CBT — while behavioural activation is. Same three-option screen; the options
 *      are now actions with consequences rather than answers with a verdict.
 *
 * WHAT DID NOT CHANGE, AND MUST NOT. Every scene still carries at least two thoughts that
 * have to be LET THROUGH. Without them the winning move is tapping everything, the player
 * spends ninety seconds rehearsing that every thought they have is suspect, and the game is
 * actively harmful rather than merely useless. That is the one rule in this file, and
 * __tests__/curveball.test.mjs fails the build over it.
 *
 * THE TAXONOMY STAYS IN THE DATA. The quiz is gone; the vocabulary is not. `distortion` is
 * still on every bent thought and still comes from content/exercises.ts, because the thought
 * record asks the user to tick which patterns applied and writes them into the export they
 * keep. Delete the vocabulary here and that screen becomes an unexplained wall of jargon
 * with nothing in the product that ever introduced it. The name is now SHOWN on a caught
 * thought rather than asked about — teaching without an exam.
 *
 * NO REACT-NATIVE IMPORTS. The suite loads this under bare Node. */

export interface CurveballThought {
  /** The character's own thought, in their words. */
  text: string;
  /** The pattern it is an instance of, or `null` when the thought holds up and must be let
   *  through. Shown after a catch, never asked about. */
  distortion: string | null;
}

export interface NextAction {
  text: string;
  /** True on the one action that proceeds on what the character actually knows.
   *  NEVER rendered as a verdict — no tick, no score, no "correct". It exists so the tests
   *  can guarantee one such action is always on offer. What the player sees is the
   *  consequence, and the consequence is what teaches. */
  checks: boolean;
  /** What happens. Plainly, without a moral, and never a claim about how anybody felt. */
  outcome: string;
}

export interface CurveballScene {
  id: string;
  /** Whose evening this is. Three people recur across the seven scenes, so a second session
   *  is somebody you have already met rather than a fresh stranger. */
  who: string;
  /** The situation, in one line, and always about to happen. */
  scene: string;
  /* THE GROUND AND THE MARK ON IT. See lib/motif.ts — chiefly that these key off WHICH SCENE
     IT IS and never off how the player is doing, because a background that reacts to a score
     is a rating with better manners. */
  mood: SceneMood;
  motif: MotifKind;
  thoughts: CurveballThought[];
  next: {
    options: NextAction[];
  };
}

/** How many scenes one session plays. Four is roughly ninety seconds, which is the length
 *  somebody will do daily and the length they will not put off. */
export const SCENES_PER_SESSION = 4;

/** Balanced thoughts required per scene. See the note above — this is the rule. */
export const MIN_BALANCED_PER_SCENE = 2;

export const SCENES: CurveballScene[] = [
  {
    id: 'before-the-message',
    who: 'Nadia',
    scene: 'Nadia has typed a message to a friend she has not spoken to in weeks. Her thumb is over send.',
    mood: 'evening',
    motif: 'messages',
    thoughts: [
      { text: 'They will think I only want something.', distortion: 'Mind reading' },
      { text: 'We have both been quiet, not just me.', distortion: null },
      { text: 'It is too late to be sending this.', distortion: 'Fortune telling' },
      { text: 'One message is one message.', distortion: null },
      { text: 'I always leave things too long.', distortion: 'Overgeneralisation' },
      { text: 'If they do not reply I have lost them.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Delete it, and write again when there is better news.',
          checks: false,
          outcome: 'The evening gets easier straight away. The message is still unsent on Thursday, and by then the gap is a week wider than it was.',
        },
        {
          text: 'Send it as it is.',
          checks: true,
          outcome: 'She will not know how it landed for a couple of hours. What changed is that she is no longer carrying the decision around with her.',
        },
        {
          text: 'Send it, with three paragraphs explaining the silence.',
          checks: false,
          outcome: 'The explanation runs longer than the message. Most of it answers a version of her friend that she assembled herself.',
        },
      ],
    },
  },
  {
    id: 'before-the-review',
    who: 'Theo',
    scene: 'Theo has a review in twenty minutes. He has seen the agenda and nothing else.',
    mood: 'daylight',
    motif: 'papers',
    thoughts: [
      { text: 'They have already decided something.', distortion: 'Mind reading' },
      { text: 'A review is a review.', distortion: null },
      { text: 'This is where they tell me I am done.', distortion: 'Catastrophising' },
      { text: 'I have had four of these and they were fine.', distortion: null },
      { text: 'One criticism means the rest was padding.', distortion: 'Discounting the positive' },
      { text: 'I am not good enough for this job.', distortion: 'Labelling' },
    ],
    next: {
      options: [
        {
          text: 'Move it to next week and say something came up.',
          checks: false,
          outcome: 'The twenty minutes stop being unbearable. The agenda item is the same one next week, with seven more days behind it.',
        },
        {
          text: 'Go in and ask what the agenda item is about.',
          checks: true,
          outcome: 'He has an answer inside the first minute. It is smaller than the one he brought in with him, and it is the actual one.',
        },
        {
          text: 'Go in with an answer ready for every possible criticism.',
          checks: false,
          outcome: 'He spends the meeting waiting for his turn to use them. Most of what is said does not need defending, and he half-hears it.',
        },
      ],
    },
  },
  {
    id: 'before-cancelling',
    who: 'June',
    scene: 'June is due somewhere in an hour and has not decided yet whether she is going.',
    mood: 'evening',
    motif: 'moons',
    thoughts: [
      { text: 'I will be the flat one in the corner.', distortion: 'Fortune telling' },
      { text: 'I am tired, and that is a real reason.', distortion: null },
      { text: 'Everyone else manages this without effort.', distortion: 'Comparison bias' },
      { text: 'People cancel. That is a normal thing.', distortion: null },
      { text: 'Cancelling means I gave up on all of it.', distortion: 'All-or-nothing' },
      { text: 'I ruin every plan I am part of.', distortion: 'Overgeneralisation' },
    ],
    next: {
      options: [
        {
          text: 'Cancel now, before she has to decide twice.',
          checks: false,
          outcome: 'The hour ahead opens up and the relief arrives at once. It was also the answer last time, and the time before that.',
        },
        {
          text: 'Go for an hour, and leave whenever she wants to.',
          checks: true,
          outcome: 'She finds out what an hour of it is actually like, which is the one thing she could not work out from her sofa.',
        },
        {
          text: 'Go, and stay to the end however it goes.',
          checks: false,
          outcome: 'She gets through it with her jaw set. Doing it that way is what makes the next invitation harder rather than easier.',
        },
      ],
    },
  },
  {
    id: 'before-the-room',
    who: 'Theo',
    scene: 'Theo is about to walk into a room where he knows exactly one person.',
    mood: 'evening',
    motif: 'rings',
    thoughts: [
      { text: 'They will all watch me come in.', distortion: 'Spotlight effect' },
      { text: 'Most people are looking at their phones.', distortion: null },
      { text: 'If I go quiet they will think I am rude.', distortion: 'Mind reading' },
      { text: 'I know one person, and that is a start.', distortion: null },
      { text: 'I always run out of things to say.', distortion: 'Overgeneralisation' },
      { text: 'One flat chat and the night is over.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Stand outside a while longer and see how he feels.',
          checks: false,
          outcome: 'The pavement is calmer than the room. Ten minutes on, the room is fuller, and walking in is a bigger entrance than it would have been.',
        },
        {
          text: 'Go in and find the one person he knows.',
          checks: true,
          outcome: 'It takes about forty seconds. Whether the night is any good is still open, which is the part he could not settle from outside.',
        },
        {
          text: 'Go in with three things prepared to say.',
          checks: false,
          outcome: 'All three are used inside two minutes. Prepared lines are the ones he half-listens through, waiting for a gap to put them in.',
        },
      ],
    },
  },
  {
    id: 'before-saying-it',
    who: 'Nadia',
    scene: 'Nadia is about to bring up something that has been bothering her for a week.',
    mood: 'smallHours',
    motif: 'loops',
    thoughts: [
      { text: 'I should have said it at the time.', distortion: 'Should statements' },
      { text: 'It has bothered me a week. That matters.', distortion: null },
      { text: 'They will think I have been stewing.', distortion: 'Mind reading' },
      { text: 'I do not know how they will take it.', distortion: null },
      { text: 'This will turn into a whole thing.', distortion: 'Catastrophising' },
      { text: 'I am too sensitive about everything.', distortion: 'Labelling' },
    ],
    next: {
      options: [
        {
          text: 'Leave it. It has waited a week already.',
          checks: false,
          outcome: 'Nothing has to happen tonight. It also waits another week, and then saying it means explaining the fortnight of not saying it.',
        },
        {
          text: 'Say the thing, and stop there.',
          checks: true,
          outcome: 'It takes about a sentence. What happens next belongs to somebody else, which is where it was always going to sit.',
        },
        {
          text: 'Say it, wrapped in an apology for bringing it up.',
          checks: false,
          outcome: 'The apology arrives first and takes up most of the room. The thing itself comes out smaller than a week of carrying it.',
        },
      ],
    },
  },
  {
    id: 'before-asking',
    who: 'Nadia',
    scene: "Nadia's partner has been quiet since this morning. She is about to ask why.",
    mood: 'tender',
    motif: 'hearts',
    thoughts: [
      { text: 'Asking will push them further away.', distortion: 'Fortune telling' },
      { text: 'They have not said anything is wrong.', distortion: null },
      { text: 'It is something I did.', distortion: 'Personalisation' },
      { text: 'People have quiet days. Not all of it is me.', distortion: null },
      { text: 'I can feel that they are angry.', distortion: 'Emotional reasoning' },
      { text: 'This is how it starts, and then it ends.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Say nothing, and watch them for the rest of the evening.',
          checks: false,
          outcome: 'Nothing has to be risked. The evening goes on reading a person instead of talking to one, and bedtime arrives knowing the same amount.',
        },
        {
          text: 'Ask what is going on, and leave room for a plain answer.',
          checks: true,
          outcome: 'The answer may be about her and it may not. Either way it takes a minute, and it is an answer rather than a fortnight of guessing.',
        },
        {
          text: 'Apologise for whatever it was.',
          checks: false,
          outcome: 'It moves the quiet along. It also settles that something was her fault, which is the one part nobody had established.',
        },
      ],
    },
  },
  {
    id: 'before-the-day',
    who: 'June',
    scene: 'June is awake before her alarm. The day has not started yet.',
    mood: 'morning',
    motif: 'rays',
    thoughts: [
      { text: 'Today is going to be awful.', distortion: 'Fortune telling' },
      { text: 'I feel heavy, so it must be a bad day.', distortion: 'Emotional reasoning' },
      { text: 'Mornings are often the hardest part.', distortion: null },
      { text: 'Nothing has actually happened yet.', distortion: null },
      { text: 'If I cannot do all of it, why start.', distortion: 'All-or-nothing' },
      { text: 'Their mornings look easier than mine.', distortion: 'Comparison bias' },
    ],
    next: {
      options: [
        {
          text: 'Stay put until the feeling shifts.',
          checks: false,
          outcome: 'The bed is warm and nothing is required. The feeling has not usually shifted by lunchtime, and by then the day has an angle on it.',
        },
        {
          text: 'Get up and do the first small thing.',
          checks: true,
          outcome: 'The heaviness comes along with her. It is a morning that has started, which is a different thing from a morning that was predicted.',
        },
        {
          text: 'Get up and do the whole list to make up for it.',
          checks: false,
          outcome: 'Most of it is done by two. The bar for tomorrow is now the whole list, set on the worst morning of the week.',
        },
      ],
    },
  },
];

/* ---------- pure selection helpers ----------
 *
 * Randomness is injected rather than reached for, so every one of these is deterministic
 * under test. A shuffle that is only ever exercised with a live `Math.random` is a shuffle
 * whose bias nobody ever measures. */

/* `shuffle` lives in lib/shuffle.ts since the second game needed it, and is re-exported here
   so this file's callers and tests keep one import. Two copies of a shuffle is how the
   biased one comes back. */
export { shuffle };
export type { Rand };

/** The scenes for one session. Fewer scenes than the session length is not an error — it
 *  returns what exists rather than repeating one, because playing the same scene twice in
 *  ninety seconds is how a player learns the answers instead of the skill. */
export function sessionScenes(
  n = SCENES_PER_SESSION,
  rand: Rand = Math.random,
  from: readonly CurveballScene[] = SCENES,
): CurveballScene[] {
  return shuffle(from, rand).slice(0, Math.min(n, from.length));
}

/** The three actions in a shuffled order. A fixed order would put the one that proceeds on
 *  what is known in the same slot every scene, and a player learns a slot far faster than
 *  they learn a distinction. */
export function actionsFor(scene: CurveballScene, rand: Rand = Math.random): NextAction[] {
  return shuffle(scene.next.options, rand);
}

/** Everyone who appears, in first-appearance order. The ending uses it to say who is up
 *  next by name — see the note there about the first-session-to-second drop. */
export function cast(from: readonly CurveballScene[] = SCENES): string[] {
  return [...new Set(from.map((s) => s.who))];
}
