import type { Entitlement } from '../lib/entitlement';

/* Anneal — domain types.
 *
 * Note what is absent and must stay absent: there is no field anywhere in this file
 * for weight, measurements, calories, body-part ratings, photo URIs, or any appearance
 * value. See SAFETY.md. If a future type needs one of those, the feature is wrong,
 * not the type. */

/** Bucketed daily preoccupation. Buckets rather than free entry because asking someone
 *  with appearance preoccupation to precisely quantify it invites rumination. */
export type PreoccupationBucket = '<15m' | '15-60m' | '1-3h' | '3-5h' | '5h+';

export const PREOCCUPATION_MINUTES: Record<PreoccupationBucket, number> = {
  '<15m': 8,
  '15-60m': 38,
  '1-3h': 120,
  '3-5h': 240,
  '5h+': 360,
};

export const PREOCCUPATION_BUCKETS: PreoccupationBucket[] = [
  '<15m',
  '15-60m',
  '1-3h',
  '3-5h',
  '5h+',
];

export type AvoidanceLevel = 'none' | 'small' | 'significant';

export interface CheckIn {
  id: string;
  /** ISO date, day-resolution key (yyyy-MM-dd) */
  date: string;
  preoccupationMinutes: number;
  /** 0–10 */
  urge: number;
  avoidance: AvoidanceLevel;
  /** Subjective Units of Distress, 0–10 */
  suds: number;
  note?: string;
}

/** Captured once during onboarding. The "before" number the whole app measures against. */
export interface Baseline {
  capturedAt: string;
  preoccupationMinutes: number;
  urge: number;
  avoidance: AvoidanceLevel;
  suds: number;
}

export interface UrgeLog {
  id: string;
  date: string;
  trigger: string;
  wantedTo: string;
  intensityBefore: number;
  resisted: boolean;
  intensityAfter?: number;
}

export interface ThoughtRecord {
  id: string;
  date: string;
  situation: string;
  emotion: string;
  emotionIntensity: number;
  automaticThought: string;
  distortions: string[];
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  reRatedIntensity: number;
}

export interface MirrorSession {
  id: string;
  date: string;
  /** Protocol phase 1–4 */
  phase: number;
  durationSeconds: number;
  sudsBefore: number;
  sudsAfter: number;
  /** Whether the user stayed for the full duration. Leaving early is logged without
   *  judgment — it is clinically informative, not a failure. */
  completed: boolean;
  /** Phase 3+ only: the previously avoided condition the user chose to add. */
  condition?: string;
}

export interface Experiment {
  id: string;
  date: string;
  avoiding: string;
  /** Captured BEFORE the event and never editable afterwards — memory rewrites
   *  predictions to match outcomes once the outcome is known. */
  prediction: string;
  likelihoodBefore: number;
  safetyBehavioursDropped: string;
  outcome?: string;
  comparison?: string;
  likelihoodAfter?: number;
  conclusion?: string;
  completedAt?: string;
}

export type PracticeKind =
  | 'checkin'
  | 'thought-record'
  | 'grounding'
  | 'mirror'
  | 'urge'
  | 'experiment'
  | 'hard-day'
  /** Games. One kind per game, so the practice record can say what was actually played
   *  rather than collapsing every game into a single undifferentiated tally. */
  | 'curveball'
  | 'toward'
  | 'groundwork'
  | 'ballast';

export interface PracticeEvent {
  id: string;
  date: string;
  kind: PracticeKind;
}

export interface StreakState {
  current: number;
  longest: number;
  freezesRemaining: number;
  lastPracticeDate: string | null;
  /** Days a freeze was silently applied. Never surfaced as a failure. */
  frozenDates: string[];
}

export interface ProtocolState {
  /** 1–12 */
  currentWeek: number;
  /** yyyy-MM-dd of days that counted toward the current week's minimum */
  weekPracticeDates: string[];
  completedWeeks: number[];
  /** User's own hierarchy of avoided conditions, for phase 3 mirror sessions. */
  avoidedConditions: string[];
  relapsePlan?: RelapsePlan;
}

/** The plan written in week eleven, for a bad stretch later.
 *
 *  SIX FIELDS, BECAUSE THE MODULE TEACHES SIX SECTIONS. This carried four — earlyWarnings,
 *  whatHelps, whoToTell, firstStep — while content/modules.ts walks the reader through six
 *  numbered ones, NAMES.plan.sub says "Six sections, written now for later", and that module's
 *  takeaway reads "Finish all six sections." Nothing wrote any of them: `setRelapsePlan` had
 *  zero call sites, both modules whose action button reads "Write your plan" navigated to the
 *  journal and to another article, and the export guarded on a field that could never be set.
 *  The App Store description sold it too.
 *
 *  The field names match the module's own headings so the screen and the reading agree word
 *  for word. `triggers` and `notDoing` are the two the old shape had no room for, and
 *  `whatHelps` becomes `firstMoves`: the module asks for exactly three ranked actions, which
 *  is a more useful and more answerable thing than "what helps". */
export interface RelapsePlan {
  /** 1. The observable things that show up days before the spiral. */
  earlyWarnings: string;
  /** 2. Sleep, stress, events, cycles, people, platforms. */
  triggers: string;
  /** 3. Exactly three, ranked, small enough to do on the worst day. */
  firstMoves: string;
  /** 4. The behaviours they will be pulled toward, decided against in advance. */
  notDoing: string;
  /** 5. One name, one method, and the opening sentence written out. */
  whoToTell: string;
  /** 6. The point where this stops being the right tool, plus real contact details. */
  myLine: string;
  updatedAt: string;
}

/** The six, in the order the module teaches them. Single source for the screen, the export
 *  and the tests — a seventh section added here appears in all three without further edits. */
export const PLAN_SECTIONS = [
  'earlyWarnings', 'triggers', 'firstMoves', 'notDoing', 'whoToTell', 'myLine',
] as const satisfies readonly (keyof Omit<RelapsePlan, 'updatedAt'>)[];

export interface Profile {
  firstName?: string;
  /** Days a week this person said they could practise, chosen at onboarding.
   *
   *  Onboarding asks for it, says "The first sets your week", and used to throw it away —
   *  `completeOnboarding` took only a baseline and a name, so picking "Two days a week" changed
   *  nothing and `PRACTICE_DAYS_PER_WEEK = 4` decided for everybody. The screen also says
   *  "Pick the number you can hit on a bad week, not a good one", which is advice that only
   *  makes sense if the number is load-bearing.
   *  Optional, so anybody who onboarded before this falls back to the protocol default. */
  practiceDaysPerWeek?: number;
  /** Their own answer to "if you got an hour a day back, what would you do with it?"
   *
   *  Onboarding promises this is "what you will see on the days it is hard to start". It was
   *  stored nowhere and rendered nowhere. See app/grounding.tsx for where it now appears. */
  wantBack?: string;
  onboardedAt: string | null;
  disclaimerAcceptedAt: string | null;
  /** Region key for support lines. */
  supportRegion: string;
  /** When this person last declined the PHQ-8/GAD-7 baseline.
   *
   *  A skip is a real answer and has to survive a restart, or the app asks again on every
   *  launch — which is the behaviour that gets a mental-health app deleted. `baselineOwed()`
   *  in lib/measure.ts re-offers exactly once, three days later, and never again. */
  measureSkippedAt?: string | null;
  /* THE OPENING SURVEY.
     Three answers and the shape they resolve to. Stored on the device like everything else
     — this is the most sensitive thing anybody hands this app, and it never leaves.
     `carrying` is a shape of experience, not a diagnosis, and it is never rendered as a word
     to the user: it picks a tone, a featured calm-down mode and an order. Nothing here is a
     condition, and it must never become one. */
  survey?: SurveyAnswers | null;
  /** Resolved from `survey`. Cached rather than recomputed so a content change cannot
   *  silently reassign somebody's stone months later. */
  carrying?: string | null;
  surveyedAt?: string | null;
}

/** One small action Groundwork kept for tomorrow, and what became of it.
 *
 *  Persisted because the second half of behavioural activation happens the NEXT day: the
 *  plan is half the intervention and finding out what actually happened is the other half.
 *  A game that forgets what it asked for is a game that only ever does the easy half. */
export interface Commitment {
  id: string;
  /** Day it was made. */
  date: string;
  action: string;
  /** 'small' | 'medium' | 'large' — what the plan bet on. A miss is information about this
   *  number and never about the person. */
  size: string;
  /** 'happened' | 'did-not' | 'something-else', once answered. */
  kept?: string;
  answeredAt?: string;
}

export interface SurveyAnswers {
  brought?: string;
  tried?: string;
  worst?: string;
}

export interface AppState {
  profile: Profile;
  baseline: Baseline | null;
  checkIns: CheckIn[];
  urgeLogs: UrgeLog[];
  thoughtRecords: ThoughtRecord[];
  mirrorSessions: MirrorSession[];
  experiments: Experiment[];
  practice: PracticeEvent[];
  commitments: Commitment[];
  /** Guided-track progress, keyed by track id. See lib/track.ts — progress is a set of day
   *  ids rather than an index, so inserting or reordering a day cannot silently move
   *  everybody who is mid-track. */
  tracks: Record<string, { startedAt: string; done: string[] }>;
  streak: StreakState;
  protocol: ProtocolState;
  readModules: string[];
  /** A CACHE of the last thing a provider told us about this person's access, not a
   *  fact the app owns. Project it with `isEntitled()`; never store the result. See the
   *  long comment in lib/entitlement.ts for why this stopped being a boolean. */
  entitlement: Entitlement;
  /** Impression and dismissal history for every unprompted message the app can show,
   *  keyed by MomentId. See lib/moments.ts. Persisted so a "no" survives a restart — a
   *  dismissal the app forgets overnight is not a dismissal, it is a delay. */
  moments: Record<string, MomentRecord>;

  /** Sittings of PHQ-8 and GAD-7. Do NOT trust insertion order — sort with `completed()` in
   *  lib/measure.ts, because an imported backup can arrive in any order.
   *
   *  This is the only clinical instrument in the app, and it exists for one reason:
   *  DIRECTION.md defines winning as measurable PHQ and GAD improvement at 30, 60 and 90
   *  days, and the daily check-in cannot produce that number. */
  measures: Measure[];
}

/** One sitting of both questionnaires.
 *
 *  Answers are stored RAW, per item, rather than as a total. Three reasons, and the third is
 *  the one that matters: a total cannot be re-scored when a scoring bug is found; a total
 *  cannot be exported in a form a clinician can check; and a total silently survives the
 *  instrument changing length, which is exactly how a PHQ-8 of 24 and a PHQ-9 of 24 end up
 *  plotted on the same line. */
export interface Measure {
  id: string;
  takenAt: string;
  /** Eight integers 0–3, in published item order. */
  phq8: number[];
  /** Seven integers 0–3, in published item order. */
  gad7: number[];
  /** Which scheduled point this was: null for the baseline, then 30, 60 or 90. A repeat
   *  somebody chose to take on their own is also null, so a voluntary retake cannot silently
   *  satisfy the day-30 ask. */
  milestone: number | null;
}

export interface MomentRecord {
  shows: number;
  lastShownDate: string | null;
  dismissals: number;
  lastDismissedDate: string | null;
  /** Tapped through rather than dismissed. Retires the moment for good. */
  acted: boolean;
}

export interface LearnModule {
  slug: string;
  title: string;
  week: number;
  minutes: number;
  free: boolean;
  /** Paragraphs. Rendered as-is; no markdown parser needed. */
  body: string[];
}

/* `Distortion` used to live here, alongside a second copy of the taxonomy in
   constants/distortions.ts that nothing imported — a body-image-specific list that had
   quietly diverged from the live one in content/exercises.ts. Both are gone. The type and
   the data now have one home each, in content/exercises.ts, and Curveball reads that. */

export interface SupportRegion {
  key: string;
  label: string;
  lines: SupportLine[];
}

interface SupportLineBase {
  name: string;
  contact: string;
  /** Anything else worth knowing before dialling: who it is for, what it costs, what
   *  language it answers in. Never opening hours — those have their own field, below. */
  note?: string;
}

/** A staffed line somebody rings and a person answers.
 *
 *  `hours` is REQUIRED, and that is the entire point of splitting this type up.
 *
 *  Checking all 31 regions against their providers found the numbers were almost all
 *  correct and the AVAILABILITY was not: Denmark's Livslinien closes at 05:00, Germany's
 *  116 111 only answers Monday to Saturday afternoons, Portugal's Voz de Apoio runs for
 *  three hours a night, Italy's Telefono Amico stops at midnight, Japan's いのちの電話 at
 *  22:00. Every one of those was listed here with no hours at all.
 *
 *  A line with nothing said about its hours does not read as "hours unknown". It reads as
 *  "open now", because that is what a crisis number is assumed to be. Somebody at 3am gets
 *  a ringing phone and the conclusion that nobody came. Making the field optional is what
 *  made that silence possible, so it is not optional: the compiler now refuses a staffed
 *  line that has not said when it answers. */
export interface StaffedLine extends SupportLineBase {
  hours: string;
  emergency?: never;
  directory?: never;
}

/** The national emergency service. Flagged structurally rather than detected from the
 *  name, because the name is in the local language — "Noodgeval", "Notruf", "救急" — and a
 *  test that pattern-matches those is a test that silently stops covering a region the
 *  moment somebody adds one in a language nobody thought of. Which is precisely what
 *  happened the first time this was checked.
 *
 *  Carries no `hours`: an emergency number that closed would not be one. */
export interface EmergencyLine extends SupportLineBase {
  emergency: true;
  hours?: never;
  directory?: never;
}

/** The maintained international directory, and the reason a stale number above is a
 *  degradation rather than a dead end. A website, so hours do not apply. */
export interface DirectoryLine extends SupportLineBase {
  directory: true;
  hours?: never;
  emergency?: never;
}

export type SupportLine = StaffedLine | EmergencyLine | DirectoryLine;
