import { shuffle, deal, type Rand } from '../lib/shuffle.ts';
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
  /** Whose evening this is. Five people recur across thirty scenes, so a second session is
   *  somebody already met rather than a fresh stranger — and by the fourth time somebody
   *  meets Theo they know he treats one piece of feedback as a verdict, which is the thing
   *  the game is teaching them to notice in themselves. */
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
  /* ────────────────────────────────────────────────────────────────────────────────────
   * TWENTY-THREE MORE, AND THE REASON IS ARITHMETIC RATHER THAN APPETITE.
   *
   * There were seven scenes and `SCENES_PER_SESSION` is four, so by the pigeonhole principle
   * the SECOND session anybody played repeated at least one — and by the third they had seen
   * everything the game contained. About three minutes of material, in the surface
   * docs/DIRECTION.md §9 calls the product. No shuffle, no scheduler and no retention
   * mechanic fixes seven scenes; this is the only item on §16.7 that is writing rather than
   * code, and it is the cheapest of them per unit of retention.
   *
   * TWO NEW PEOPLE, NOT TWENTY-THREE. Owen and Priya join Nadia, Theo and June, so five
   * characters carry thirty scenes at roughly six each. A fresh stranger every round is a
   * sketch show; the point of a recurring cast is that the fourth time somebody meets Theo
   * they already know he treats one piece of feedback as a verdict, which is the thing the
   * game is teaching them to notice in themselves. `app/onboarding/survey.tsx` names the
   * count out loud and __tests__/survey.test.mjs pins it, so that line moved with this.
   *
   * WHAT THE NEW SCENES ARE ABOUT. The seven originals were mostly work and messages, which
   * was right when this app was a body-dysmorphia programme with a games layer and is too
   * narrow now that the survey routes seven different shapes into it. These span money,
   * illness, family, grief, starting something, being new in a room, being late, being
   * looked at, and having a week with nothing in it — because the person playing arrived by
   * answering "I lost someone" or "everything feels flat" at least as often as anything
   * else.
   *
   * EVERY ONE IS STILL PROSPECTIVE AND STILL THIRD PERSON. Schertz et al. 2025: distanced
   * self-talk works when somebody is preparing for a thing and does not work when they are
   * reprocessing one. Every scene below is the minutes before.
   * ──────────────────────────────────────────────────────────────────────────────────── */
  {
    id: 'before-the-callback',
    who: 'Priya',
    scene: 'Priya has a missed call from a number she applied to work at. She is deciding when to ring back.',
    mood: 'daylight',
    motif: 'papers',
    thoughts: [
      { text: 'They only ring to say no.', distortion: 'Fortune telling' },
      { text: 'A missed call is a missed call.', distortion: null },
      { text: 'If I ring back now I sound desperate.', distortion: 'Mind reading' },
      { text: 'They rang me, which is information.', distortion: null },
      { text: 'I never get past this bit.', distortion: 'Overgeneralisation' },
      { text: 'Getting it wrong here ends the whole thing.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Wait until tomorrow, when there is more time to prepare.',
          checks: false,
          outcome: 'The preparing takes the evening. The call happens a day later and goes much the same as it would have gone today.',
        },
        {
          text: 'Ring back now and find out what they wanted.',
          checks: true,
          outcome: 'It takes four minutes. Whatever they say, the version she spent the afternoon arguing with is no longer the one she is dealing with.',
        },
        {
          text: 'Email instead, so there is a record and no talking.',
          checks: false,
          outcome: 'The email is careful and takes an hour. It also moves her to the bottom of a pile she was at the top of this morning.',
        },
      ],
    },
  },
  {
    id: 'before-the-doctor',
    who: 'June',
    scene: 'June has an appointment in an hour about something she first noticed in spring.',
    mood: 'morning',
    motif: 'rays',
    thoughts: [
      { text: 'Leaving it this long makes me an idiot.', distortion: 'Labelling' },
      { text: 'Waiting is common and they know that.', distortion: null },
      { text: 'They will not take it seriously.', distortion: 'Mind reading' },
      { text: 'An hour is enough time to get there.', distortion: null },
      { text: 'Whatever it is, it is too late now.', distortion: 'Catastrophising' },
      { text: 'Being nervous means it is something bad.', distortion: 'Emotional reasoning' },
    ],
    next: {
      options: [
        {
          text: 'Go, and say when she first noticed it.',
          checks: true,
          outcome: 'The date matters to them and she gives it. She leaves knowing one more thing than she did, which is what the appointment was for.',
        },
        {
          text: 'Go, and say it started a few weeks ago.',
          checks: false,
          outcome: 'It is easier to say out loud. It also removes the one detail they asked for twice, and the advice she gets is built on the shorter version.',
        },
        {
          text: 'Move it to a week when things are calmer.',
          checks: false,
          outcome: 'The relief lasts the afternoon. The next slot is in five weeks, and it will be the same conversation with more spring behind it.',
        },
      ],
    },
  },
  {
    id: 'before-the-group-chat',
    who: 'Owen',
    scene: 'Owen is reading a group chat organising a weekend away. Nobody has said his name.',
    mood: 'evening',
    motif: 'messages',
    thoughts: [
      { text: 'They are working out how to not invite me.', distortion: 'Mind reading' },
      { text: 'Nobody has said anybody else’s name either.', distortion: null },
      { text: 'I am the one people forget.', distortion: 'Labelling' },
      { text: 'I could just say I am up for it.', distortion: null },
      { text: 'Asking makes it worse.', distortion: 'Fortune telling' },
      { text: 'This is what the rest of the year looks like.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Say he is in, and ask what he can bring.',
          checks: true,
          outcome: 'Two people react to it within the minute. He is on the list because he put himself on it, which is how most people got there.',
        },
        {
          text: 'Wait to be asked directly.',
          checks: false,
          outcome: 'The plan firms up over three days without him in it. By Friday the numbers are settled and adding one is a conversation nobody starts.',
        },
        {
          text: 'Leave the chat quietly.',
          checks: false,
          outcome: 'The notifications stop that evening. So does the part where somebody might have said his name on Thursday.',
        },
      ],
    },
  },
  {
    id: 'before-the-photo',
    who: 'Nadia',
    scene: 'Somebody at the table is lining up a photo and Nadia is on the end of the row.',
    mood: 'evening',
    motif: 'rings',
    thoughts: [
      { text: 'Everyone will look at this later.', distortion: 'Spotlight effect' },
      { text: 'People look at themselves in group photos.', distortion: null },
      { text: 'One picture decides how they think of me.', distortion: 'Catastrophising' },
      { text: 'It will be on a phone nobody opens again.', distortion: null },
      { text: 'If I duck out now it is less awkward.', distortion: 'Fortune telling' },
      { text: 'Being uncomfortable means I look wrong.', distortion: 'Emotional reasoning' },
    ],
    next: {
      options: [
        {
          text: 'Stay in it and let them take the picture.',
          checks: true,
          outcome: 'It takes six seconds. The rest of the evening carries on from where it was rather than from the exit she did not make.',
        },
        {
          text: 'Step out and offer to take the photo instead.',
          checks: false,
          outcome: 'Everybody accepts it easily, and she does the same thing at the next four gatherings. The photos from this year have other people in them.',
        },
        {
          text: 'Stay in, then ask to see it and check.',
          checks: false,
          outcome: 'She looks for about a minute. The looking is the part she takes home, and it starts again on the train.',
        },
      ],
    },
  },
  {
    id: 'before-owning-up',
    who: 'Theo',
    scene: 'Theo has found an error in something he sent out on Tuesday. Nobody else has noticed yet.',
    mood: 'daylight',
    motif: 'papers',
    thoughts: [
      { text: 'Saying it now undoes four years of work.', distortion: 'Catastrophising' },
      { text: 'It is small and it is fixable today.', distortion: null },
      { text: 'They will decide I cannot be trusted.', distortion: 'Mind reading' },
      { text: 'People find errors in things weekly.', distortion: null },
      { text: 'One slip and the rest counted for nothing.', distortion: 'Discounting the positive' },
      { text: 'A good one would not have let it through.', distortion: 'Should statements' },
    ],
    next: {
      options: [
        {
          text: 'Flag it now, with the fix attached.',
          checks: true,
          outcome: 'It is dealt with before lunch. The version of him they have is somebody who found it, which is not the version he spent the morning with.',
        },
        {
          text: 'Fix it quietly and say nothing.',
          checks: false,
          outcome: 'The file is repaired by ten. He then spends six weeks being the only person who knows, and checking whether anybody has noticed.',
        },
        {
          text: 'Wait and see whether it actually matters.',
          checks: false,
          outcome: 'Nothing happens for nine days. It surfaces in a meeting on the tenth, where the question is why it took until then.',
        },
      ],
    },
  },
  {
    id: 'before-the-party',
    who: 'Owen',
    scene: 'Owen is outside a flat where he knows one person, deciding whether to press the buzzer.',
    mood: 'evening',
    motif: 'rings',
    thoughts: [
      { text: 'Everyone in there already knows each other.', distortion: 'Mind reading' },
      { text: 'Somebody in there knows one person too.', distortion: null },
      { text: 'I will have nothing to say.', distortion: 'Fortune telling' },
      { text: 'An hour is a normal length to stay.', distortion: null },
      { text: 'I am bad at this and always have been.', distortion: 'Overgeneralisation' },
      { text: 'They will all notice me standing on my own.', distortion: 'Spotlight effect' },
    ],
    next: {
      options: [
        {
          text: 'Go in, and plan to leave at ten.',
          checks: true,
          outcome: 'He talks to four people, two of them briefly. He leaves at ten past, which is a decision he made rather than one that happened to him.',
        },
        {
          text: 'Go home and message that something came up.',
          checks: false,
          outcome: 'The walk back is a relief. The next one is easier to skip, because the last one was skipped and nothing bad came of it.',
        },
        {
          text: 'Go in and stay beside the one person he knows.',
          checks: false,
          outcome: 'The evening passes without difficulty. He leaves having met nobody, and the room is exactly as unfamiliar next time.',
        },
      ],
    },
  },
  {
    id: 'before-the-call-home',
    who: 'Priya',
    scene: 'Priya has her father’s number open. Their last call ended badly and that was in March.',
    mood: 'tender',
    motif: 'hearts',
    thoughts: [
      { text: 'He is still angry about it.', distortion: 'Mind reading' },
      { text: 'March was a long time ago for both of us.', distortion: null },
      { text: 'If I ring, we do the whole thing again.', distortion: 'Fortune telling' },
      { text: 'A phone call can be ten minutes.', distortion: null },
      { text: 'One bad call means we are finished.', distortion: 'All-or-nothing' },
      { text: 'A better daughter would have rung by now.', distortion: 'Should statements' },
    ],
    next: {
      options: [
        {
          text: 'Ring, and talk about something ordinary.',
          checks: true,
          outcome: 'They speak for eleven minutes about a hedge. Nothing from March is resolved, and the next call is now a smaller thing to make.',
        },
        {
          text: 'Ring, and start by settling what happened in March.',
          checks: false,
          outcome: 'They are both prepared for that conversation and have been since March. It goes the way it went, and the gap resets.',
        },
        {
          text: 'Text instead, to see whether he answers.',
          checks: false,
          outcome: 'He replies with two words the next morning. She reads them fifteen times looking for the tone, and finds every tone in them.',
        },
      ],
    },
  },
  {
    id: 'before-the-first-date',
    who: 'Nadia',
    scene: 'Nadia is twenty minutes early for a first date and sitting in a car park.',
    mood: 'evening',
    motif: 'hearts',
    thoughts: [
      { text: 'They will take one look and know.', distortion: 'Mind reading' },
      { text: 'They are probably nervous as well.', distortion: null },
      { text: 'If this goes badly I stop trying.', distortion: 'All-or-nothing' },
      { text: 'It is a drink, and it lasts an hour.', distortion: null },
      { text: 'Being this nervous means it is doomed.', distortion: 'Emotional reasoning' },
      { text: 'Everyone else finds this part easy.', distortion: 'Comparison bias' },
    ],
    next: {
      options: [
        {
          text: 'Go in at the time they agreed.',
          checks: true,
          outcome: 'The first four minutes are awkward and then they are not. She finds out something about a person, which is the only thing tonight could do.',
        },
        {
          text: 'Sit in the car and rehearse three openers.',
          checks: false,
          outcome: 'She arrives ten minutes late with three lines ready. None of them fits what he actually opens with, and she is half a beat behind for an hour.',
        },
        {
          text: 'Message to move it to next week.',
          checks: false,
          outcome: 'The evening frees up immediately. Next week arrives carrying everything this week had, plus a rearrangement to explain.',
        },
      ],
    },
  },
  {
    id: 'before-the-room-again',
    who: 'June',
    scene: 'June is at the door of a room she has not opened since her mother died in February.',
    mood: 'smallHours',
    motif: 'moons',
    thoughts: [
      { text: 'Going in means it is really over.', distortion: 'Emotional reasoning' },
      { text: 'The room is a room, whether I open it or not.', distortion: null },
      { text: 'I will not be able to stop once I start.', distortion: 'Fortune telling' },
      { text: 'I can open the door and go no further.', distortion: null },
      { text: 'Wanting to leave it shut makes me a coward.', distortion: 'Labelling' },
      { text: 'If I cry now I will not stop for days.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Open the door, stand in it, and leave it open.',
          checks: true,
          outcome: 'She is there for two minutes and then makes tea. The door stays open, and walking past it on Thursday is a smaller thing than today was.',
        },
        {
          text: 'Wait until her sister can be there too.',
          checks: false,
          outcome: 'Her sister can do the second week of next month. The date is real and the room is shut for another five weeks.',
        },
        {
          text: 'Go in and clear the whole room today.',
          checks: false,
          outcome: 'It is done by four and she cannot remember most of it. Several things she meant to keep went into bags she will not open.',
        },
      ],
    },
  },
  {
    id: 'before-asking-for-more',
    who: 'Theo',
    scene: 'Theo has a meeting booked to ask about his salary. It is on Thursday.',
    mood: 'daylight',
    motif: 'papers',
    thoughts: [
      { text: 'Asking makes them think I am difficult.', distortion: 'Mind reading' },
      { text: 'People ask about pay every year.', distortion: null },
      { text: 'A no would mean I have no future here.', distortion: 'Catastrophising' },
      { text: 'The meeting is booked and it is thirty minutes.', distortion: null },
      { text: 'If I have to ask, I have not earned it.', distortion: 'Should statements' },
      { text: 'They kept me on, so they must think enough.', distortion: null },
    ],
    next: {
      options: [
        {
          text: 'Ask, with the two things he did this year.',
          checks: true,
          outcome: 'They say they will come back to him, and they do, eight days later. He now knows the answer instead of estimating it.',
        },
        {
          text: 'Cancel it and wait for the review cycle.',
          checks: false,
          outcome: 'The cycle is in November. By then the two things he would have named are last year and belong to a different conversation.',
        },
        {
          text: 'Go, and open by saying it is not a big deal.',
          checks: false,
          outcome: 'The room agrees with him that it is not a big deal. The meeting ends early and pleasantly and nothing about the number changes.',
        },
      ],
    },
  },
  {
    id: 'before-the-reply',
    who: 'Priya',
    scene: 'Priya can see that a friend read her message on Sunday. It is Wednesday.',
    mood: 'smallHours',
    motif: 'loops',
    thoughts: [
      { text: 'Three days is an answer in itself.', distortion: 'Mind reading' },
      { text: 'People leave messages open and forget.', distortion: null },
      { text: 'I said too much and she is backing away.', distortion: 'Personalisation' },
      { text: 'She has been busy every other September.', distortion: null },
      { text: 'This is how every friendship of mine ends.', distortion: 'Overgeneralisation' },
      { text: 'Sending another one would be humiliating.', distortion: 'Fortune telling' },
    ],
    next: {
      options: [
        {
          text: 'Send a short one about something else.',
          checks: true,
          outcome: 'She replies that evening about the other thing, and then about the first one. Three days turns out to have been three days.',
        },
        {
          text: 'Wait, and match however long she takes.',
          checks: false,
          outcome: 'The gap doubles each round. By November they are two people who each think the other one stopped.',
        },
        {
          text: 'Reread the original and work out what was wrong with it.',
          checks: false,
          outcome: 'She finds four things in it that could be read badly. All four were invisible on Sunday and all four are now unforgettable.',
        },
      ],
    },
  },
  {
    id: 'before-the-class',
    who: 'Owen',
    scene: 'Owen is in the car park of a class he signed up to in January. It starts in ten minutes.',
    mood: 'evening',
    motif: 'paths',
    thoughts: [
      { text: 'Everybody there will have done it for years.', distortion: 'Comparison bias' },
      { text: 'A beginners class is full of beginners.', distortion: null },
      { text: 'Being the worst there is unbearable.', distortion: 'Catastrophising' },
      { text: 'The first one is the one nobody is good at.', distortion: null },
      { text: 'They will all see me not knowing what to do.', distortion: 'Spotlight effect' },
      { text: 'If I am bad at week one I should stop.', distortion: 'Should statements' },
    ],
    next: {
      options: [
        {
          text: 'Go in and say it is his first time.',
          checks: true,
          outcome: 'Two other people say the same thing in the first minute. He is bad at it for an hour, alongside them, which is what week one is.',
        },
        {
          text: 'Watch this one from the side and start next week.',
          checks: false,
          outcome: 'Watching is comfortable and teaches him the moves he will still not be able to do. Next week he is a week behind rather than level.',
        },
        {
          text: 'Drive home and look for a better class.',
          checks: false,
          outcome: 'There are eleven other classes and he reads about all of them. None of them has started by March, and the car park is the same car park.',
        },
      ],
    },
  },
  {
    id: 'before-the-anniversary',
    who: 'June',
    scene: 'The date June has been counting toward all month is on Saturday. Nobody has mentioned it.',
    mood: 'smallHours',
    motif: 'moons',
    thoughts: [
      { text: 'Everybody else has moved on from it.', distortion: 'Mind reading' },
      { text: 'People forget dates and still remember him.', distortion: null },
      { text: 'Bringing it up would make them uncomfortable.', distortion: 'Fortune telling' },
      { text: 'My sister has never once forgotten it.', distortion: null },
      { text: 'Still counting means I am not coping.', distortion: 'Emotional reasoning' },
      { text: 'A year on I should be past this.', distortion: 'Should statements' },
    ],
    next: {
      options: [
        {
          text: 'Tell her sister the date is Saturday, and ask for the morning.',
          checks: true,
          outcome: 'Her sister had it in her calendar and had not raised it either. They spend the morning together, which neither would have asked for alone.',
        },
        {
          text: 'Say nothing and see who remembers.',
          checks: false,
          outcome: 'Two people remember and one of them is late. The waiting takes the whole of Saturday, and the day itself gets what is left of it.',
        },
        {
          text: 'Fill the day with things so it passes quickly.',
          checks: false,
          outcome: 'The day is busy from eight until seven. It arrives anyway at ten past seven, with less of the day left to meet it.',
        },
      ],
    },
  },
  {
    id: 'before-saying-no',
    who: 'Nadia',
    scene: 'Nadia has been asked to cover a shift on the one evening she had kept free.',
    mood: 'daylight',
    motif: 'paths',
    thoughts: [
      { text: 'Saying no means they stop asking me anything.', distortion: 'Catastrophising' },
      { text: 'I have covered three shifts this month.', distortion: null },
      { text: 'They will think I am not a team player.', distortion: 'Mind reading' },
      { text: 'Somebody else can be asked after me.', distortion: null },
      { text: 'A no now cancels every yes I have given.', distortion: 'Discounting the positive' },
      { text: 'Wanting the evening off is selfish.', distortion: 'Labelling' },
    ],
    next: {
      options: [
        {
          text: 'Say she cannot do Thursday, without a reason.',
          checks: true,
          outcome: 'They ask somebody else within the hour. She keeps the evening, and nothing about how she is treated on Friday is different.',
        },
        {
          text: 'Say yes and move the evening to next week.',
          checks: false,
          outcome: 'Next week the same request arrives, and the evening moves again. By the fourth move it has stopped being a thing she is protecting.',
        },
        {
          text: 'Say no, with a long explanation of why.',
          checks: false,
          outcome: 'The explanation invites a discussion of each reason. Two of them turn out to be negotiable, and Thursday is gone by the end of it.',
        },
      ],
    },
  },
  {
    id: 'before-the-presentation',
    who: 'Theo',
    scene: 'Theo is on in fifteen minutes, in front of about thirty people.',
    mood: 'daylight',
    motif: 'rings',
    thoughts: [
      { text: 'They will all see my hands shaking.', distortion: 'Spotlight effect' },
      { text: 'Rooms this size look at the screen, not me.', distortion: null },
      { text: 'One stumble and the whole thing is a write-off.', distortion: 'All-or-nothing' },
      { text: 'I know this material better than they do.', distortion: null },
      { text: 'Feeling sick means I am not ready.', distortion: 'Emotional reasoning' },
      { text: 'The good ones never get nervous.', distortion: 'Comparison bias' },
    ],
    next: {
      options: [
        {
          text: 'Go up and start with the first slide.',
          checks: true,
          outcome: 'The first two minutes are shaky and the next eighteen are not. Three people ask questions, none of them about how he seemed.',
        },
        {
          text: 'Ask a colleague to take the first half.',
          checks: false,
          outcome: 'She covers it well. He is now the person who did not do his own slot, and the next one carries this one as well as itself.',
        },
        {
          text: 'Read the notes once more instead of getting water.',
          checks: false,
          outcome: 'He knows slide four even better. His mouth is dry by slide two and the shake he was worried about is now in his voice.',
        },
      ],
    },
  },
  {
    id: 'before-the-envelope',
    who: 'Owen',
    scene: 'Owen has three unopened letters on the side. Two are from the same sender.',
    mood: 'morning',
    motif: 'papers',
    thoughts: [
      { text: 'It will be a number I cannot deal with.', distortion: 'Fortune telling' },
      { text: 'The number is the same either way.', distortion: null },
      { text: 'People who manage money do not do this.', distortion: 'Comparison bias' },
      { text: 'Most of these have a phone line on them.', distortion: null },
      { text: 'Opening it makes it real.', distortion: 'Emotional reasoning' },
      { text: 'I have ruined this beyond fixing.', distortion: 'Catastrophising' },
    ],
    next: {
      options: [
        {
          text: 'Open all three now and write the totals down.',
          checks: true,
          outcome: 'It takes four minutes and one of them is an advert. The number he has been carrying since Tuesday turns out to be a different number.',
        },
        {
          text: 'Open them at the weekend when there is time.',
          checks: false,
          outcome: 'The weekend comes and the pile is four. The unopened ones cost nothing to leave and about an hour a day to not think about.',
        },
        {
          text: 'Open the newest one only, to see how bad it is.',
          checks: false,
          outcome: 'The newest one refers to the first, which is still shut. He now has half the picture and a reason to keep the other half closed.',
        },
      ],
    },
  },
  {
    id: 'before-the-visit',
    who: 'Priya',
    scene: 'Priya’s aunt arrives on Friday for four days. She has the spare room ready.',
    mood: 'tender',
    motif: 'hearts',
    thoughts: [
      { text: 'She will comment on everything in here.', distortion: 'Fortune telling' },
      { text: 'She came last year and it was fine.', distortion: null },
      { text: 'Four days of that and I will crack.', distortion: 'Catastrophising' },
      { text: 'I can go to work on two of the days.', distortion: null },
      { text: 'Needing space from family makes me cold.', distortion: 'Labelling' },
      { text: 'One remark will set the tone for all of it.', distortion: 'Mental filter' },
    ],
    next: {
      options: [
        {
          text: 'Say on Friday which evenings she is out.',
          checks: true,
          outcome: 'Her aunt makes her own plan for Saturday. The visit has a shape they both know, instead of one Priya defends silently for four days.',
        },
        {
          text: 'Keep the days open and see how it goes.',
          checks: false,
          outcome: 'By Sunday every hour is spoken for. Saying she needs an evening now sounds like a reaction to something rather than a plan.',
        },
        {
          text: 'Tidy the whole flat before Friday.',
          checks: false,
          outcome: 'The flat is immaculate by Thursday night. The first remark is about something she did not think to move, and it lands the same.',
        },
      ],
    },
  },
  {
    id: 'before-going-out',
    who: 'Nadia',
    scene: 'Nadia is dressed and due to leave in ten minutes for a friend’s birthday.',
    mood: 'evening',
    motif: 'rings',
    thoughts: [
      { text: 'Everyone there will be looking.', distortion: 'Spotlight effect' },
      { text: 'It is her night and people came for her.', distortion: null },
      { text: 'If I keep changing I will be late.', distortion: null },
      { text: 'I can tell how tonight goes already.', distortion: 'Fortune telling' },
      { text: 'Not wanting to go means I should not.', distortion: 'Emotional reasoning' },
      { text: 'Turning up like this would let her down.', distortion: 'Mind reading' },
    ],
    next: {
      options: [
        {
          text: 'Leave now, in what she has on.',
          checks: true,
          outcome: 'She arrives eight minutes early and helps carry chairs. The ten minutes she did not spend on the mirror are the ten she is inside for.',
        },
        {
          text: 'Change once more, then go.',
          checks: false,
          outcome: 'Once becomes three times and she leaves at twenty past. Arriving late means walking into a full room, which was the part she was avoiding.',
        },
        {
          text: 'Go, and ask her friend how she looks when she gets there.',
          checks: false,
          outcome: 'Her friend says she looks great, warmly, within a second. The reassurance holds for about twenty minutes and then needs asking again.',
        },
      ],
    },
  },
  {
    id: 'before-the-apology',
    who: 'Theo',
    scene: 'Theo said something short to a friend on Sunday. They are meeting for coffee at eleven.',
    mood: 'morning',
    motif: 'messages',
    thoughts: [
      { text: 'He has decided what kind of person I am.', distortion: 'Mind reading' },
      { text: 'He still turned up to coffee.', distortion: null },
      { text: 'Bringing it up drags it out.', distortion: 'Fortune telling' },
      { text: 'It was one sentence in eight years.', distortion: null },
      { text: 'This is the beginning of the end of it.', distortion: 'Catastrophising' },
      { text: 'People who snap are just unpleasant people.', distortion: 'Labelling' },
    ],
    next: {
      options: [
        {
          text: 'Say early on that Sunday was out of order, and leave it there.',
          checks: true,
          outcome: 'It takes about fifteen seconds and he says it was fine. The rest of the hour is coffee rather than a careful conversation about coffee.',
        },
        {
          text: 'Wait to see whether he brings it up.',
          checks: false,
          outcome: 'He does not, and neither does anything else. They talk about work for an hour with one subject sitting on the table between them.',
        },
        {
          text: 'Apologise at length, and explain what the week had been like.',
          checks: false,
          outcome: 'The explanation takes twenty minutes and asks him to manage it. He ends up reassuring Theo about a thing that happened to him.',
        },
      ],
    },
  },
  {
    id: 'before-the-table',
    who: 'June',
    scene: 'June has been asked to join the table at work. She has eaten at her desk since April.',
    mood: 'daylight',
    motif: 'rings',
    thoughts: [
      { text: 'They asked to be polite, not because they meant it.', distortion: 'Mind reading' },
      { text: 'Somebody walked over here to ask.', distortion: null },
      { text: 'I have forgotten how to do this.', distortion: 'Overgeneralisation' },
      { text: 'Lunch is forty minutes.', distortion: null },
      { text: 'If it is awkward I can never sit there again.', distortion: 'All-or-nothing' },
      { text: 'Sitting alone this long says something about me.', distortion: 'Labelling' },
    ],
    next: {
      options: [
        {
          text: 'Take the chair and sit down.',
          checks: true,
          outcome: 'She says very little for the first ten minutes and more after that. Tomorrow the question is whether to sit there, not whether she can.',
        },
        {
          text: 'Say she has a call, and go tomorrow instead.',
          checks: false,
          outcome: 'Tomorrow nobody walks over, because she was asked and said no. The desk is still there and the asking has stopped.',
        },
        {
          text: 'Go, but leave as soon as the first pause comes.',
          checks: false,
          outcome: 'She is out by twenty past. The pause she left on happens at every table and is generally somebody chewing.',
        },
      ],
    },
  },
  {
    id: 'before-the-first-session',
    who: 'Owen',
    scene: 'Owen has a first appointment with a therapist at four. He has cancelled one before.',
    mood: 'daylight',
    motif: 'paths',
    thoughts: [
      { text: 'I will not know what to say.', distortion: 'Fortune telling' },
      { text: 'Their job is largely asking the questions.', distortion: null },
      { text: 'My problems are not big enough for this.', distortion: 'Comparison bias' },
      { text: 'It is fifty minutes and then it is done.', distortion: null },
      { text: 'They will think I am wasting their time.', distortion: 'Mind reading' },
      { text: 'Cancelling once means I never go.', distortion: 'Overgeneralisation' },
    ],
    next: {
      options: [
        {
          text: 'Go, and say he cancelled the last one.',
          checks: true,
          outcome: 'They spend ten minutes on that and it turns out to be useful. He has been once, which is the only thing that makes twice possible.',
        },
        {
          text: 'Go, and stick to the version that sounds reasonable.',
          checks: false,
          outcome: 'The hour is comfortable and they work on the reasonable version. The thing he booked the appointment about does not come up.',
        },
        {
          text: 'Cancel, and rebook for when work is quieter.',
          checks: false,
          outcome: 'The next free slot is in three weeks. Work is not quieter in three weeks, and cancelling has now happened twice rather than once.',
        },
      ],
    },
  },
  {
    id: 'before-correcting-them',
    who: 'Priya',
    scene: 'Someone at Priya’s new job has called her the wrong name twice in one meeting.',
    mood: 'daylight',
    motif: 'papers',
    thoughts: [
      { text: 'Correcting him now embarrasses him.', distortion: 'Fortune telling' },
      { text: 'He would want to know, most people do.', distortion: null },
      { text: 'Making a thing of it marks me as difficult.', distortion: 'Mind reading' },
      { text: 'It is my name and it is two syllables.', distortion: null },
      { text: 'Letting it go twice means it is too late.', distortion: 'All-or-nothing' },
      { text: 'Minding about this is oversensitive.', distortion: 'Labelling' },
    ],
    next: {
      options: [
        {
          text: 'Say her name once, lightly, next time he uses the other one.',
          checks: true,
          outcome: 'He apologises for about two seconds and uses her name from then on. Nobody else in the room appears to register that it happened.',
        },
        {
          text: 'Let it go and hope somebody else says it.',
          checks: false,
          outcome: 'Two more people pick it up from him by Thursday. Correcting four people is a different task from correcting one.',
        },
        {
          text: 'Send him a message afterwards explaining.',
          checks: false,
          outcome: 'The message takes three drafts and lands as something serious. He replies at length, and the next meeting is careful on both sides.',
        },
      ],
    },
  },
  {
    id: 'before-the-empty-week',
    who: 'June',
    scene: 'June is looking at next week in her calendar. There is nothing in it after Tuesday.',
    mood: 'morning',
    motif: 'rays',
    thoughts: [
      { text: 'An empty week proves nobody thinks of me.', distortion: 'Mind reading' },
      { text: 'I have not asked anybody for anything.', distortion: null },
      { text: 'This is what the rest of it looks like.', distortion: 'Fortune telling' },
      { text: 'Two people said to say when I am free.', distortion: null },
      { text: 'Feeling this alone means I am.', distortion: 'Emotional reasoning' },
      { text: 'By my age this should be sorted.', distortion: 'Should statements' },
    ],
    next: {
      options: [
        {
          text: 'Message one of the two and offer Thursday.',
          checks: true,
          outcome: 'Thursday does not work and the week after does. There is one thing in the calendar and she is the reason it is there.',
        },
        {
          text: 'Wait for somebody to suggest something.',
          checks: false,
          outcome: 'One thing arrives on Wednesday from somebody she barely knows. The week fills up with the plans other people happened to have.',
        },
        {
          text: 'Fill it with jobs so it does not look empty.',
          checks: false,
          outcome: 'The week is full by Sunday night and every item is a job. She is busy from Monday and has still spoken to nobody by Friday.',
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

/** The scenes for session number `index`, dealing the whole pool before repeating any of it.
 *
 *  ⚠ THIS REPLACES `sessionScenes` AT THE CALL SITE, and the reason is measured rather than
 *  argued. `sessionScenes` shuffles the whole pool afresh every time, with no memory of what
 *  came before. At seven scenes that repeated on session two by the pigeonhole principle,
 *  which is why the pool went to thirty — and the mean first repeat moved from 2.0 sessions
 *  to 2.72. Twenty-three scenes bought seven tenths of a session.
 *
 *  That is the birthday problem rather than a shortage: two independent draws of four from
 *  thirty miss each other only about 55% of the time, and no pool size fixes it. `deal` in
 *  lib/shuffle.ts permutes once per cycle and hands out consecutive blocks instead, so
 *  everything is seen once before anything is seen twice — thirty scenes at four a session
 *  is about seven fresh sessions.
 *
 *  `sessionScenes` stays because it is the right function for a random hand with no history
 *  — the tests use it, and so would any future surface that wants one sample. */
export function sessionRound(
  index: number,
  n = SCENES_PER_SESSION,
  from: readonly CurveballScene[] = SCENES,
): CurveballScene[] {
  return deal(from, n, index);
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
