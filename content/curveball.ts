import { DISTORTIONS } from './exercises.ts';
import { shuffle, type Rand } from '../lib/shuffle.ts';
import type { MotifKind, SceneMood } from '../lib/motif.ts';

/* Curveball — the CBT game.
 *
 * WHAT IT IS. Thoughts rise up the screen. Some are distorted, some are balanced. You
 * intercept the distorted ones and let the balanced ones through. Then you name the
 * distortion, then you pick the reframe. Three phases, one loop, about ninety seconds.
 *
 * WHY IT IS SHAPED THIS WAY, AND THE ONE RULE THAT MATTERS MOST. Every scene carries at
 * least two thoughts that must be LET THROUGH. Without them the correct strategy is "tap
 * everything", the score goes up, and the player has practised nothing — worse than
 * nothing, because they have spent ninety seconds rehearsing that every thought they have
 * is suspect. Discrimination is the entire skill being trained; the distorted thoughts are
 * only half the material. `__tests__/curveball.test.mjs` fails the build if any scene drops
 * below two balanced thoughts, and that test is the most important one in the file.
 *
 * THE REFRAME OPTIONS ARE NOT ONE RIGHT AND TWO RANDOM. Each scene's wrong answers are the
 * two specific failure modes people actually produce when told to "think positively":
 *
 *   · TOXIC POSITIVITY — cheerfulness pasted over the thought without checking it.
 *   · DISMISSAL — pretending not to care, which is only credible if the thought never hurt.
 *
 * Both feel like reframes. Neither is one. A reframe is smaller than the thought it
 * replaces and closer to the evidence, and that is what the `why` text on each option is
 * for: the player has to be told why the plausible wrong answer is wrong, or they leave
 * with the plausible wrong answer.
 *
 * VOCABULARY. Distortion names are the live taxonomy in `content/exercises.ts` and nowhere
 * else. A name that drifts out of that list is a name the thought record cannot record.
 *
 * NO REACT-NATIVE IMPORTS. The suite imports this file directly under bare Node — see the
 * rule enforced by `__tests__/safety.test.mjs`. */

export interface CurveballThought {
  text: string;
  /** The distortion this is an instance of, or `null` when the thought is balanced and
   *  must be let through. */
  distortion: string | null;
}

export interface ReframeOption {
  text: string;
  /** Exactly one option per scene is accurate. */
  accurate: boolean;
  /** Shown after the pick, for the wrong answers as much as the right one. */
  why: string;
}

export interface CurveballScene {
  id: string;
  /** The situation, in one line, before any thought about it. */
  scene: string;
  /* THE GROUND AND THE MARK ON IT.
     A situation is a room, and the thoughts only mean anything to somebody who is already
     standing in it. Reading "your partner has been short with you since this morning" off
     a neutral field asks the player to build that room themselves in the second before the
     first thought arrives; a warm ground and a scatter of hearts does it for them. See
     lib/motif.ts for the rules — chiefly that these key off WHICH SCENE IT IS and never off
     how the player is doing, because a background that reacts to a score is a rating with
     better manners. */
  mood: SceneMood;
  motif: MotifKind;
  thoughts: CurveballThought[];
  reframe: {
    /** Must match one of the distorted `thoughts` in this scene, verbatim. */
    quote: string;
    options: ReframeOption[];
  };
}

/** How many scenes one session plays. Four is roughly ninety seconds, which is the length
 *  somebody will do daily and the length they will not put off. */
export const SCENES_PER_SESSION = 4;

/** Balanced thoughts required per scene. See the note above — this is the rule. */
export const MIN_BALANCED_PER_SCENE = 2;

export const SCENES: CurveballScene[] = [
  {
    id: 'unanswered-text',
    scene: 'You texted a friend three hours ago. Still nothing back.',
    mood: 'evening',
    motif: 'messages',
    thoughts: [
      { text: 'They are ignoring me on purpose.', distortion: 'Mind reading' },
      { text: 'They might just be busy.', distortion: null },
      { text: 'I always say the wrong thing.', distortion: 'Overgeneralisation' },
      { text: 'This friendship is over.', distortion: 'Catastrophising' },
      { text: 'I do not know why yet.', distortion: null },
      { text: 'I should not have texted first.', distortion: 'Should statements' },
    ],
    reframe: {
      quote: 'They are ignoring me on purpose.',
      options: [
        {
          text: 'Everything happens for a reason. Stay positive!',
          accurate: false,
          why: 'That is not a reframe, it is a mute button. It skips past the worry instead of checking it.',
        },
        {
          text: 'I do not know why they have not replied. Most reasons have nothing to do with me.',
          accurate: true,
          why: 'A reframe is not cheerfulness. It is accuracy. This one is smaller than the thought and truer.',
        },
        {
          text: 'It does not matter what they think anyway.',
          accurate: false,
          why: 'This one pretends not to care. Something that truly did not matter would not have needed a reframe.',
        },
      ],
    },
  },
  {
    id: 'one-piece-of-feedback',
    scene: 'You got one piece of critical feedback at work. The rest was good.',
    mood: 'daylight',
    motif: 'papers',
    thoughts: [
      { text: 'I am bad at this job.', distortion: 'Labelling' },
      { text: 'One thing needs work.', distortion: null },
      { text: 'They only said the good parts to be kind.', distortion: 'Discounting the positive' },
      { text: 'I am going to get fired.', distortion: 'Catastrophising' },
      { text: 'The rest of it went well.', distortion: null },
      { text: 'If it is not perfect it is a failure.', distortion: 'All-or-nothing' },
    ],
    reframe: {
      quote: 'They only said the good parts to be kind.',
      options: [
        {
          text: 'I am great at my job and they are lucky to have me.',
          accurate: false,
          why: 'This just swings the bat the other way. A thought you cannot check is still a thought you cannot check.',
        },
        {
          text: 'They said several things. I kept one and threw the rest away.',
          accurate: true,
          why: 'It names what actually happened to the evidence. That is the move.',
        },
        {
          text: 'Feedback is meaningless anyway.',
          accurate: false,
          why: 'Throwing out all of it is the same error as keeping only the bad part.',
        },
      ],
    },
  },
  {
    id: 'cancelled-plans',
    scene: 'You cancelled plans because you were worn out.',
    mood: 'evening',
    motif: 'moons',
    thoughts: [
      { text: 'I am letting everyone down.', distortion: 'Labelling' },
      { text: 'I was tired and I rested.', distortion: null },
      { text: 'I should be able to handle this.', distortion: 'Should statements' },
      { text: 'Everyone else copes fine.', distortion: 'Mind reading' },
      { text: 'I can see them another day.', distortion: null },
      { text: 'I ruin everything.', distortion: 'Overgeneralisation' },
    ],
    reframe: {
      quote: 'Everyone else copes fine.',
      options: [
        {
          text: 'Nobody copes. Everyone is faking it.',
          accurate: false,
          why: 'Another guess about other people, just a gloomier one. Still a guess.',
        },
        {
          text: 'I can see how other people look. I cannot see how they feel.',
          accurate: true,
          why: 'It puts the line back where the evidence actually stops.',
        },
        {
          text: 'I need to try harder than they do.',
          accurate: false,
          why: 'This keeps the comparison and adds a job to it.',
        },
      ],
    },
  },
  {
    id: 'room-goes-quiet',
    scene: 'You walk into a room and two people stop talking.',
    mood: 'evening',
    motif: 'rings',
    thoughts: [
      { text: 'They were talking about me.', distortion: 'Mind reading' },
      { text: 'They finished their sentence.', distortion: null },
      { text: 'It feels like judgement, so it was.', distortion: 'Emotional reasoning' },
      { text: 'This will happen every time now.', distortion: 'Fortune telling' },
      { text: 'I do not have enough to go on.', distortion: null },
      { text: 'People always notice the worst of me.', distortion: 'Overgeneralisation' },
    ],
    reframe: {
      quote: 'It feels like judgement, so it was.',
      options: [
        {
          text: 'My gut is usually right about people.',
          accurate: false,
          why: 'This makes the feeling the proof. That is the exact move that got you here.',
        },
        {
          text: 'A feeling is information about me. It is not information about them.',
          accurate: true,
          why: 'A feeling can be completely real and still not be evidence about somebody else. Both of those are true at once.',
        },
        {
          text: 'I should stop being so sensitive.',
          accurate: false,
          why: 'That is a should statement dressed up as a solution. It adds a job instead of answering anything.',
        },
      ],
    },
  },
  {
    id: 'replaying-the-mistake',
    scene: 'It is midnight and you are replaying something you said on Tuesday.',
    mood: 'smallHours',
    motif: 'loops',
    thoughts: [
      { text: 'Everyone there is still thinking about it.', distortion: 'Spotlight effect' },
      { text: 'It was a small thing and it is over.', distortion: null },
      { text: 'Going over it again has not changed it once.', distortion: null },
      { text: 'I am the kind of person who ruins rooms.', distortion: 'Labelling' },
      { text: 'They will bring it up next time.', distortion: 'Fortune telling' },
      { text: 'I should have caught myself before I said it.', distortion: 'Should statements' },
    ],
    reframe: {
      quote: 'Everyone there is still thinking about it.',
      options: [
        {
          text: 'Nobody cares about me at all.',
          accurate: false,
          why: 'That is the same overestimate with a minus sign. It still puts you at the centre.',
        },
        {
          text: 'They each went home to their own Tuesday. Mine is the only one I am still in.',
          accurate: true,
          why: 'It stops guessing at their attention and describes where yours actually is.',
        },
        {
          text: 'It does not matter, nothing does at midnight.',
          accurate: false,
          why: 'Shrugging is not the same as checking. The thought is still standing there behind it.',
        },
      ],
    },
  },
  {
    /* The scene the wallpaper idea came from. Worth saying why it is worth having beyond
       the hearts: the distortions that fire hardest about a partner are the ones a person
       is least likely to catch, because in a relationship mind reading feels like intimacy
       and catastrophising feels like taking it seriously. Two of the balanced thoughts here
       are deliberately unsatisfying — "they have not said anything is wrong" resolves
       nothing, which is exactly why it is the fair one. */
    id: 'partner-gone-quiet',
    scene: 'Your partner has been short with you since this morning and has not said why.',
    mood: 'tender',
    motif: 'hearts',
    thoughts: [
      { text: 'They are done with me.', distortion: 'Catastrophising' },
      { text: 'They have not said anything is wrong.', distortion: null },
      { text: 'It is my fault. I did something.', distortion: 'Personalisation' },
      { text: 'People have bad days that are not about me.', distortion: null },
      { text: 'If I ask, I will make it worse.', distortion: 'Fortune telling' },
      { text: 'I can feel they are angry, so they are.', distortion: 'Emotional reasoning' },
    ],
    reframe: {
      quote: 'They are done with me.',
      options: [
        {
          text: 'We are fine. We are always fine. There is nothing to worry about here.',
          accurate: false,
          why: 'That is a promise you cannot check, made so you do not have to ask. It is the same guess with a nicer ending.',
        },
        {
          text: 'Something is off and I do not know what. Those are two separate sentences.',
          accurate: true,
          why: 'It keeps what you actually noticed and drops the story you put on the end of it. Only one of the two has evidence.',
        },
        {
          text: 'If they have a problem they can bring it up themselves.',
          accurate: false,
          why: 'That swaps the worry for distance. The worry was there because they matter to you, and this does not touch it.',
        },
      ],
    },
  },
  {
    id: 'morning-dread',
    scene: 'You wake up already dreading the day, before anything has happened.',
    mood: 'morning',
    motif: 'rays',
    thoughts: [
      { text: 'Today is going to be awful.', distortion: 'Fortune telling' },
      { text: 'I feel heavy, so it must be a bad day.', distortion: 'Emotional reasoning' },
      { text: 'Mornings are often the hardest part.', distortion: null },
      { text: 'Nothing has actually happened yet.', distortion: null },
      { text: 'If I cannot do all of it I may as well do none.', distortion: 'All-or-nothing' },
      /* Was "Everyone else gets up fine." — the same sentence as cancelled-plans'
         "Everyone else copes fine.", which this file labels Mind reading. A player who
         learned the first and answered the second consistently was told, in the app's
         confident voice, that they were wrong. A game that marks a defensible answer wrong
         is not experienced as clinical, it is experienced as unfair. Rewritten so it is
         unambiguously the comparison one: what you can see of somebody against what you
         know of yourself. */
      { text: 'Their mornings look easier than mine.', distortion: 'Comparison bias' },
    ],
    reframe: {
      quote: 'I feel heavy, so it must be a bad day.',
      options: [
        {
          text: 'I will decide it is a great day and it will be.',
          accurate: false,
          why: 'You cannot vote on the day. Declaring the opposite is the same error pointed the other way.',
        },
        {
          text: 'This is how the morning feels. It is not yet how the day went.',
          accurate: true,
          why: 'It keeps the feeling, which is real, and takes away the prediction, which is not evidence.',
        },
        {
          text: 'Feelings in the morning are meaningless.',
          accurate: false,
          why: 'Dismissing a feeling tends to be how it comes back louder later on.',
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

/* `shuffle` moved to lib/shuffle.ts when the second game needed it, and is re-exported here
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

/** Three names to choose from when naming a distortion: the true one and two others drawn
 *  from the live taxonomy. The distractors are drawn from distortions used elsewhere in the
 *  app so that a wrong answer is still a term the player will meet again. */
export function nameOptions(
  correct: string,
  rand: Rand = Math.random,
  taxonomy: readonly string[] = DISTORTIONS.map((d) => d.name),
): string[] {
  const others = shuffle(taxonomy.filter((n) => n !== correct), rand).slice(0, 2);
  return shuffle([correct, ...others], rand);
}

/** The thought a scene's reframe phase is about. Resolved rather than stored twice, so the
 *  quote and the thought cannot drift apart. */
export function reframeTarget(scene: CurveballScene): CurveballThought {
  const t = scene.thoughts.find((x) => x.text === scene.reframe.quote);
  if (!t) throw new Error(`curveball: scene "${scene.id}" quotes a thought it does not contain`);
  return t;
}
