/* Rotating prompts for guided mirror sessions.
 *
 * One appears every 20–30 seconds. The design intent behind every line: pull attention
 * from the zoomed-in evaluative mode toward whole-image, factual description. Nothing
 * here asks the user to judge, rate, like, or accept how they look — the exercise works
 * by changing HOW attention moves, not by installing a nicer opinion. */

export interface MirrorPrompt {
  text: string;
  /** Lowest phase at which this prompt appears. */
  minPhase: 1 | 2 | 3;
}

export const MIRROR_PROMPTS: MirrorPrompt[] = [
  // Phase 1 — orientation and neutral description
  { text: 'Start at the top. What colour is your hair, and how does it fall today?', minPhase: 1 },
  { text: 'Describe the shape of your face the way you’d describe a shape in a painting.', minPhase: 1 },
  { text: 'What colour are your eyes? Not what you think of them — just the colour.', minPhase: 1 },
  { text: 'Describe what you’re wearing. Fabric, colour, how it sits.', minPhase: 1 },
  { text: 'Notice the light in the room. Where is it coming from?', minPhase: 1 },
  { text: 'If a stranger described you to someone else in one neutral sentence, what would they say?', minPhase: 1 },
  { text: 'Name one thing in this reflection that has nothing to do with how you look.', minPhase: 1 },
  {
    text: 'You may notice the urge to zoom in on one thing. Let that be there. Come back to the whole picture.',
    minPhase: 1,
  },

  // Phase 2 — whole body, proportion, distress tolerance
  { text: 'Describe your posture. Not judging it — just where your shoulders and spine are.', minPhase: 2 },
  { text: 'Describe your hands. Then your arms. Then move on.', minPhase: 2 },
  { text: 'Describe the proportions the way a tailor would — length, width, line.', minPhase: 2 },
  { text: 'Whatever number your distress is right now, say it silently and keep looking.', minPhase: 2 },

  // Phase 3–4 — perspective, attentional control, earned evidence
  { text: 'This is the version of you that other people see every day. Nothing here is new to them.', minPhase: 3 },
  { text: 'Notice what your attention wants to do. Notice that you don’t have to follow it.', minPhase: 3 },
  { text: 'Describe the room behind you. Three things.', minPhase: 3 },
  { text: 'You’ve been here before and the distress came down. It’s coming down now.', minPhase: 3 },
];

export function promptsForPhase(phase: number): MirrorPrompt[] {
  return MIRROR_PROMPTS.filter((p) => p.minPhase <= Math.min(phase, 3));
}

/* Rules shown before every session. These are the protocol, not decoration — leaving at
 * peak distress is what makes exposure fail, and adjusting/hunting for a better angle
 * converts the exercise back into checking. */
export const MIRROR_RULES = [
  'Stand at conversational distance. Not close.',
  'Describe what you see the way a stranger would describe a photograph — factually, no judgment words.',
  'Describe the whole image, top to bottom. Never zoom in on one feature.',
  'Do not touch, adjust, fix, or hunt for a better angle.',
  'Stay until the timer ends. Leaving at peak distress is what makes it stick.',
];

/* Why the distance rule exists, shown once before the first session. A front-facing phone
 * camera at close range is optically misleading — short focal length enlarges whatever is
 * nearest the lens — and it is also the surface most people already check on. Naming both
 * makes the rule followable instead of arbitrary. */
export const DISTANCE_RATIONALE =
  'Distance matters more than it sounds. A phone camera held close enlarges whatever is nearest the lens, so a close-up is a distorted image before you have judged anything. It is also the surface most people already check on — holding it at conversational distance is what makes this practice rather than another check.';

export const NEUTRAL_SWAPS: [string, string][] = [
  ['huge', 'large'],
  ['tiny', 'small'],
  ['disgusting', 'a texture I don’t prefer'],
  ['deformed', 'asymmetric'],
  ['hideous', 'not to my taste'],
  ['gross', 'shiny'],
  ['fat', 'wide'],
  ['ugly', 'not what I’d choose'],
];

/** Suggested conditions for the phase 3 hierarchy. The user picks from their own list —
 *  these exist so a blank screen isn't the first thing they meet. */
export const CONDITION_SUGGESTIONS = [
  'Unstyled hair',
  'No makeup',
  'Bright overhead light',
  'Daylight by a window',
  'Straight after waking up',
  'Without the clothing I use to cover up',
  'Glasses off',
  'After exercise',
];
