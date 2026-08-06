/* Steady — domain types.
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
  /** Local entitlement flag. Replaced by RevenueCat in production. */
  entitled: boolean;
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
  lines: { name: string; contact: string; note?: string }[];
}
