/* Exercise scripts.
 *
 * Timings in seconds. Copy is second person, calm, and contains no exclamation marks —
 * enforced by __tests__/copy.test.mjs, because an exclamation mark reads as brightness
 * and brightness is the wrong register for someone opening this at 2am.
 *
 * Nothing here instructs the user to evaluate their appearance. The mirror scripts live
 * in constants/mirrorPrompts.ts; everything in this file is attention, breath, urge, and
 * belief work. */

export interface ScriptStep {
  /** Seconds into the exercise at which this line appears. Omitted for tap-to-advance. */
  at?: number;
  text: string;
}

/* ---------- 5-4-3-2-1 senses ---------- */

export interface SensesStep {
  count: number | null;
  title: string;
  text: string;
}

export const SENSES_STEPS: SensesStep[] = [
  {
    count: null,
    title: 'Grounding',
    text: "This pulls your attention out of your head and into the room. It doesn't fix anything. It just gives you somewhere else to stand for a few minutes.",
  },
  {
    count: 5,
    title: 'things you can see',
    text: "Look around and name five. Say them silently or out loud. Ordinary things count — a door handle, a crack in the paint. Don't rush to the next one.",
  },
  {
    count: 4,
    title: 'things you can feel',
    text: 'Your feet on the floor. Fabric on your arms. The temperature of the air. Something under your hand.',
  },
  {
    count: 3,
    title: 'things you can hear',
    text: 'Include the boring ones. Traffic. A fridge. Your own breathing.',
  },
  {
    count: 2,
    title: 'things you can smell',
    text: "If nothing's obvious, that's fine — notice that instead.",
  },
  {
    count: 1,
    title: 'thing you can taste',
    text: 'Or just notice the inside of your mouth.',
  },
  {
    count: null,
    title: 'Done',
    text: "Notice where your attention is now compared to a couple of minutes ago. That's the skill. It's moveable.",
  },
];

/* ---------- 4-7-8 breathing ---------- */

export const BREATH = {
  inhale: 4,
  hold: 7,
  exhale: 8,
  cycles: 4,
  intro:
    "Breathe in through your nose for four. Hold for seven. Out through your mouth for eight. The long exhale is the part that does the work — it's what tells your nervous system the emergency is over.",
  /** One per cycle, in order. */
  during: ['In.', "Hold. It's meant to feel long.", 'Out, slowly.', 'Again.'],
  phaseLabels: { inhale: 'In', hold: 'Hold', exhale: 'Out' },
  outro:
    "If you feel lightheaded, that's normal and it passes. Four cycles is enough. More isn't better.",
};

/* ---------- attention widening ----------
   The direct counterweight to detail-focused processing: narrow, then deliberately wide. */

export const WIDENING = {
  totalSeconds: 60,
  intervalSeconds: 15,
  steps: [
    { at: 0, text: 'Pick something across the room and look at it. Not at yourself. Not at a screen.' },
    { at: 15, text: 'Describe it in detail — colour, edges, texture, how the light hits it.' },
    { at: 30, text: 'Now widen. Take in everything around it without moving your eyes. The whole scene at once.' },
    { at: 45, text: 'Hold the wide view. Notice how different this feels from looking closely at one thing.' },
  ] as ScriptStep[],
  outro:
    'That switch — narrow to wide — is the same muscle you use on yourself. This is where it gets trained.',
};

/* ---------- values anchor ---------- */

export const VALUES_ANCHOR = {
  totalSeconds: 90,
  steps: [
    'Name one thing that matters to you that has nothing to do with how you look.',
    'Name one small thing you could do in the next hour that moves toward it.',
    "You don't have to feel better first.",
  ],
};

/* ---------- urge surfing ----------
   The response-prevention core. Exiting early takes two taps on purpose: one tap is the
   urge acting through the interface, and the confirm is a beat of deliberation. */

export const URGE_SURF = {
  totalSeconds: 180,
  entry:
    "You're going to sit with the urge without acting on it for three minutes. Not forever. Three minutes.",
  steps: [
    { at: 0, text: 'Where do you feel it in your body? Chest, stomach, hands, jaw. Find it.' },
    { at: 30, text: "Don't argue with it. Don't try to make it go away. Just watch it, the way you'd watch weather." },
    { at: 60, text: "Urges rise, peak, and fall. That happens whether or not you obey them. You're watching that happen right now." },
    { at: 90, text: "It may be climbing. That's the peak coming. Stay." },
    { at: 120, text: "Notice if it's already turning. It usually starts to before you expect." },
    { at: 150, text: "Almost there. Whatever the number is, you didn't act on it." },
  ] as ScriptStep[],
  complete:
    'You just proved something to yourself that arguing never proves: the urge came down without you doing anything. Log the number.',
  exitConfirm: {
    title: 'Leave early?',
    body: "Leaving before the timer ends is the escape the urge is asking for. You can do it — but the learning comes from staying. There is no penalty either way.",
    stay: 'Stay',
    leave: 'Leave anyway',
  },
};

/* ---------- hard day ----------
   Free, always, and reachable in two taps. Preserves the streak silently. There is no
   make-up task and no "you failed today" state anywhere in this flow. */

export const HARD_DAY = {
  opening: 'Okay. Nothing is required of you today.',
  options: [
    { key: 'breathe', label: 'Breathe' },
    { key: 'ground', label: 'Ground' },
    { key: 'sit', label: 'Just sit here' },
    { key: 'talk', label: 'Talk to someone' },
  ],
  sit: {
    totalSeconds: 120,
    /** The only text shown during the sit. Silence is the feature. */
    midpoint: { at: 60, text: 'Still here.' } as ScriptStep,
  },
  close: 'Your streak is intact. Hard days count as showing up.',
};

/* ---------- behavioural experiment ----------
   The belief-testing engine. Prediction is captured BEFORE the event, because memory
   quietly rewrites predictions to match outcomes once the outcome is known. */

export interface ExperimentField {
  key: string;
  question: string;
  hint?: string;
  kind: 'text' | 'percent';
  /** Fields after the event, hidden until the user marks it done. */
  afterEvent?: boolean;
}

export const EXPERIMENT_FIELDS: ExperimentField[] = [
  {
    key: 'avoiding',
    question: 'What am I avoiding?',
    hint: 'Be specific and small enough to actually do this week.',
    kind: 'text',
  },
  {
    key: 'prediction',
    question: 'What do I predict will happen?',
    hint: 'The real prediction, not the reasonable one. Write what you actually fear.',
    kind: 'text',
  },
  {
    key: 'likelihoodBefore',
    question: 'How likely does that feel?',
    kind: 'percent',
  },
  {
    key: 'safetyBehavioursDropped',
    question: 'What safety behaviours will I drop?',
    hint: 'Hair over the face, avoiding eye contact, staying out of the light, keeping a phone up. Pick at least one to go without.',
    kind: 'text',
  },
  {
    key: 'outcome',
    question: 'What actually happened?',
    hint: 'Facts only. What did people do or say.',
    kind: 'text',
    afterEvent: true,
  },
  {
    key: 'comparison',
    question: 'How did that compare to the prediction?',
    kind: 'text',
    afterEvent: true,
  },
  {
    key: 'likelihoodAfter',
    question: 'Re-rate the likelihood.',
    kind: 'percent',
    afterEvent: true,
  },
  {
    key: 'conclusion',
    question: 'What does this tell me?',
    kind: 'text',
    afterEvent: true,
  },
];

export const EXPERIMENT_COPY = {
  doItNow: 'Now go and do it. Come back when it is done. The rest of the form is waiting.',
  archiveIntro:
    'Your past experiments. Reading these back is the point, not paperwork. This list is your evidence.',
};

/* ---------- thought record ---------- */

export interface ThoughtStep {
  key: string;
  question: string;
  kind: 'text' | 'emotion' | 'rating' | 'distortions';
}

export const THOUGHT_RECORD_STEPS: ThoughtStep[] = [
  {
    key: 'situation',
    question: 'What happened? Just the facts — where you were, who was there, what triggered it.',
    kind: 'text',
  },
  { key: 'emotion', question: 'What did you feel? Name the emotion, then rate it 0–100.', kind: 'emotion' },
  {
    key: 'automaticThought',
    question: 'What went through your mind? The exact words, not the polite version.',
    kind: 'text',
  },
  { key: 'distortions', question: 'Which patterns fit? Tap any that apply.', kind: 'distortions' },
  { key: 'evidenceFor', question: 'What makes that thought feel true? Real evidence only.', kind: 'text' },
  {
    key: 'evidenceAgainst',
    question: "What doesn't fit it? Things you're leaving out, times it wasn't true, what you'd tell a friend.",
    kind: 'text',
  },
  {
    key: 'balancedThought',
    question: "What's a more accurate version? Not a positive one — an accurate one.",
    kind: 'text',
  },
  { key: 'reRated', question: 'Re-rate the emotion, 0–100.', kind: 'rating' },
];

export const THOUGHT_RECORD_CLOSING =
  "It doesn't have to drop to zero. Movement is the point.";

/* ---------- cognitive distortions ---------- */

export interface Distortion {
  name: string;
  definition: string;
}

export const DISTORTIONS: Distortion[] = [
  {
    name: 'Mind reading',
    definition:
      "Deciding you know what someone thought about you. You have no access to it, and you'd have said something different in their position.",
  },
  {
    name: 'Fortune telling',
    definition:
      'Calling how it will go before it happens, and always calling it badly.',
  },
  {
    name: 'All-or-nothing',
    definition: 'No middle setting. The day is ruined or it is fine, the work is perfect or worthless.',
  },
  {
    /* Added when Curveball landed. Its absence is why the prototype quietly invented its
       own list rather than use this one — and two taxonomies is how a thought record ends
       up unable to record the pattern a game just taught somebody to spot. */
    name: 'Overgeneralisation',
    definition: 'One instance turned into a rule, usually with "always" or "never" welded onto it.',
  },
  {
    name: 'Mental filter',
    definition: 'Ten things happened; you kept the one that hurt.',
  },
  {
    name: 'Discounting the positive',
    definition: "Something goes well, and you find the reason it doesn't count.",
  },
  {
    name: 'Emotional reasoning',
    definition: 'Treating the feeling as the evidence. "I feel like a burden, so I must be one."',
  },
  {
    name: 'Should statements',
    definition: "Rules you'd never impose on anyone else, applied to yourself as law.",
  },
  {
    name: 'Labelling',
    definition: 'A whole identity built out of one moment. Not "that was awkward" but "I\'m a mess."',
  },
  {
    name: 'Personalisation',
    definition: 'Their mood, their glance, their silence — assumed to be about you.',
  },
  {
    name: 'Catastrophising',
    definition: 'Running the chain to the worst possible end and stopping there.',
  },
  {
    name: 'Comparison bias',
    definition:
      'Measuring everything you know about yourself against the two seconds they chose to show.',
  },
  {
    name: 'Spotlight effect',
    definition:
      "Assuming your attention on yourself is matched by everyone else's. It isn't, and it's been measured.",
  },
];

/* ---------- the relapse plan ----------
 *
 * Week eleven. content/modules.ts walks somebody through six sections in prose; this is the
 * same six as fields they fill in. The headings are copied from the module deliberately —
 * a reader who has just finished "Your fire exit" should recognise every one of them, and a
 * screen that renames them makes the reading feel like it was about something else.
 *
 * WRITTEN IN ADVANCE, FOR A DAY WHEN JUDGEMENT IS NOT AVAILABLE. That is the whole premise,
 * and it sets the rules for the copy here: every prompt asks for something observable rather
 * than something felt, because "I feel bad about myself" is not an early warning sign, and a
 * plan made of feelings cannot be followed by somebody who is not feeling well. */

export interface PlanSection {
  key: string;
  /** Matches the numbered heading in the module, so the two read as one thing. */
  title: string;
  /** What to write, in one line. */
  prompt: string;
  /** Shown in the empty field. Never a value — a shape. */
  placeholder: string;
  /** Longer guidance, folded away until asked for. */
  help: string;
  lines: number;
}

export const PLAN_INTRO =
  'Six sections. Write them now, while things are steady, so that later you can follow this '
  + 'instead of deciding. Nothing here is sent anywhere. You can change any of it whenever you like.';

export const PLAN_SECTION_COPY: PlanSection[] = [
  {
    key: 'earlyWarnings',
    title: 'My early warning signs',
    prompt: 'What shows up first, days before the worst of it?',
    placeholder: 'Checking after I leave the house. Changing clothes more than twice.',
    help:
      'Observable things, not feelings. "I feel bad about myself" is where this ends up, not '
      + 'where it starts. You want the signs that turn up three days earlier.',
    lines: 4,
  },
  {
    key: 'triggers',
    title: 'My triggers',
    prompt: 'What tends to set it off?',
    placeholder: 'Short sleep. Photos from an event. The week before my period.',
    help: 'Sleep, stress, events, cycles, people, platforms. The ones you listed in week ten.',
    lines: 4,
  },
  {
    key: 'firstMoves',
    title: 'My first three moves',
    prompt: 'The first three things you will do, in order, no deciding required.',
    placeholder: '1. One check-in.\n2. Slow my breathing.\n3. Text Dani.',
    help:
      'Exactly three, ranked. Keep them small enough that you would still do them on your '
      + 'worst day — a plan you cannot follow at fifteen percent is not a plan.',
    lines: 5,
  },
  {
    key: 'notDoing',
    title: 'What I will not do',
    prompt: 'What makes it worse, that you will want to do anyway?',
    placeholder: 'Cancel plans. Delete photos. Look up procedures.',
    help:
      'Write them down now. Later, doing one of them means breaking a promise you made — '
      + 'not making a fresh choice on a bad day. That is much harder to talk yourself into.',
    lines: 4,
  },
  {
    key: 'whoToTell',
    title: 'Who I tell',
    prompt: 'One person, one way to reach them, and the first line you will send.',
    placeholder:
      'Dani, by text. "Having a rough one with the body image stuff. Don’t need advice, '
      + 'just wanted someone to know."',
    help:
      'Write the opening sentence out in full. Composing one while you are struggling is the '
      + 'step where people stop.',
    lines: 5,
  },
  {
    key: 'myLine',
    title: 'My line',
    prompt: 'When does this stop being the right tool, and who do you contact then?',
    placeholder:
      'If I miss work two days running. If I stop leaving the house for a week.\nDr Okafor — 0000 000 0000',
    help:
      'Set it as things you do, not things you feel. Put the real contact details in — a '
      + 'doctor, a service, a helpline. Fill them in now, so there is nothing to look up '
      + 'later. This section is not pessimism. It is knowing where the fire exit is in a '
      + 'building you expect not to burn down.',
    lines: 6,
  },
];
