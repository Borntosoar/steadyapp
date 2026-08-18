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
  | 'hard-day';

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

export interface RelapsePlan {
  earlyWarnings: string;
  whatHelps: string;
  whoToTell: string;
  firstStep: string;
  updatedAt: string;
}

export interface Profile {
  firstName?: string;
  onboardedAt: string | null;
  disclaimerAcceptedAt: string | null;
  /** Region key for support lines. */
  supportRegion: string;
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

export interface Distortion {
  name: string;
  definition: string;
}

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
