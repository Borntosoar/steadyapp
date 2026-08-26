/* The 12-week protocol.
 *
 * Weeks unlock on COMPLETION, never on elapsed time. This is deliberate and it is the
 * single most important structural decision in the app: a date-gated programme punishes
 * the exact weeks when someone is struggling most, which is when they are least able to
 * absorb being told they fell behind. Here, falling behind is not representable. If you
 * do four practice days, the next week opens — whether that took seven days or forty. */

import type { ProtocolState } from '../types';

export const WEEKS_TOTAL = 12;
export const PRACTICE_DAYS_PER_WEEK = 4;

export type PhaseId = 1 | 2 | 3 | 4;

export interface Phase {
  id: PhaseId;
  name: string;
  weeks: number[];
  goal: string;
  /** What the user is asked to actually do during this phase. */
  focus: string;
}

export const PHASES: Phase[] = [
  {
    id: 1,
    name: 'See the pattern',
    weeks: [1, 2, 3],
    goal: 'You see your own numbers for the first time.',
    focus: 'Check in each day. Nothing hard yet. First we find out where you are.',
  },
  {
    id: 2,
    name: 'Interrupt the loop',
    weeks: [4, 5, 6],
    goal: 'The first measurable drop in checking.',
    focus: 'Log the urges, sit through them, take thoughts apart, and start short mirror work.',
  },
  {
    id: 3,
    name: 'Widen the lens',
    weeks: [7, 8, 9],
    goal: 'Avoidance drops.',
    focus: 'Train your attention, do longer mirror work, and test what you think will happen.',
  },
  {
    id: 4,
    name: 'Live in the hours',
    weeks: [10, 11, 12],
    goal: 'You leave with a written plan and a number.',
    focus: 'Work out what matters, spend the time you got back on it, and make a plan to keep it.',
  },
];

export function phaseForWeek(week: number): Phase {
  const clamped = Math.min(Math.max(week, 1), WEEKS_TOTAL);
  return PHASES.find((p) => p.weeks.includes(clamped)) ?? PHASES[0];
}

/** Mirror sessions are locked until phase 2. Exposure before someone has seen their own
 *  baseline is exposure without a rationale, and it drops people out. */
export const MIRROR_UNLOCK_WEEK = 4;

export interface MirrorSpec {
  phase: PhaseId;
  durationSeconds: number;
  distance: string;
  conditions: string;
  /** Phase 3+ asks the user to add one of their own avoided conditions. */
  requiresCondition: boolean;
}

export const MIRROR_SPECS: Record<PhaseId, MirrorSpec> = {
  1: {
    phase: 1,
    durationSeconds: 90,
    distance: "Arm's length or further",
    conditions: 'Fully clothed, neutral light, face and upper body only',
    requiresCondition: false,
  },
  2: {
    phase: 2,
    durationSeconds: 180,
    distance: "Arm's length",
    conditions: 'Whole body in frame',
    requiresCondition: false,
  },
  3: {
    phase: 3,
    durationSeconds: 300,
    distance: 'Conversational distance',
    conditions: 'Add one condition you normally avoid',
    requiresCondition: true,
  },
  4: {
    phase: 4,
    durationSeconds: 480,
    distance: 'Conversational distance',
    conditions: 'Free practice — maintenance',
    requiresCondition: false,
  },
};

/** Mirror phase runs one behind the protocol phase, because mirror work starts at week 4
 *  (protocol phase 2) with the gentlest spec. */
export function mirrorSpecForWeek(week: number): MirrorSpec | null {
  if (week < MIRROR_UNLOCK_WEEK) return null;
  if (week <= 5) return MIRROR_SPECS[1];
  if (week <= 7) return MIRROR_SPECS[2];
  if (week <= 9) return MIRROR_SPECS[3];
  return MIRROR_SPECS[4];
}

export function isWeekUnlocked(week: number, state: ProtocolState): boolean {
  if (week <= 1) return true;
  return state.completedWeeks.includes(week - 1);
}

export function weekProgress(state: ProtocolState, perWeek?: number): {
  done: number;
  required: number;
  complete: boolean;
  remaining: number;
} {
  const required = practiceTarget(perWeek);
  const done = new Set(state.weekPracticeDates).size;
  return {
    done,
    required,
    complete: done >= required,
    remaining: Math.max(0, required - done),
  };
}

/** How many practice days a week this person is working to.
 *
 *  Onboarding asks — "Pick the number you can hit on a bad week, not a good one" — and says
 *  the answer "sets your week". It set nothing: PRACTICE_DAYS_PER_WEEK was a hard 4 for
 *  everybody, so somebody who honestly answered "two days" was held to double it and would
 *  never see a week complete.
 *
 *  Clamped to the range the picker offers rather than trusted. This value arrives from stored
 *  JSON, and a corrupt or hand-edited 0 would make `done >= required` true on an empty week
 *  and advance the protocol on every render. */
export function practiceTarget(perWeek?: number): number {
  if (typeof perWeek !== 'number' || !Number.isFinite(perWeek)) return PRACTICE_DAYS_PER_WEEK;
  return Math.min(7, Math.max(1, Math.round(perWeek)));
}

/** Record a practice day against the current week and advance when the minimum is met.
 *  Pure: returns the next state rather than mutating. */
export function recordPracticeDay(state: ProtocolState, dayKey: string, perWeek?: number): ProtocolState {
  if (state.weekPracticeDates.includes(dayKey)) return state;

  const weekPracticeDates = [...state.weekPracticeDates, dayKey];
  const done = new Set(weekPracticeDates).size;

  if (done < practiceTarget(perWeek)) return { ...state, weekPracticeDates };

  /* Week 12 is recorded as completed like any other week, and only then does the counter
     stop. Testing the ceiling first — which is what this used to do — meant week 12 could
     never enter `completedWeeks`, so `isProtocolComplete` was unreachable and somebody who
     finished the entire programme was never told they had. It also left
     `weekPracticeDates` accumulating forever, so the home screen read "156/4 this week"
     and "Week complete" permanently. */
  const completedWeeks = state.completedWeeks.includes(state.currentWeek)
    ? state.completedWeeks
    : [...state.completedWeeks, state.currentWeek];

  return {
    ...state,
    completedWeeks,
    currentWeek: Math.min(state.currentWeek + 1, WEEKS_TOTAL),
    weekPracticeDates: [],
  };
}

/** Whether the user has finished the whole programme. */
export function isProtocolComplete(state: ProtocolState): boolean {
  return state.completedWeeks.length >= WEEKS_TOTAL;
}

/** The single recommended action for today. Home shows one card, not a menu of nine —
 *  choice paralysis is real, and it is worse when someone is already ruminating. */
export type RecommendedAction =
  | { route: '/checkin'; label: string; why: string }
  | { route: '/mirror'; label: string; why: string }
  | { route: '/journal'; label: string; why: string }
  | { route: '/urges'; label: string; why: string }
  | { route: '/learn' | `/module/${string}`; label: string; why: string }
  | { route: '/grounding'; label: string; why: string };

export function recommendedAction(opts: {
  week: number;
  checkedInToday: boolean;
  /** True when there is reading DUE for the week they are on that they have not done.
   *
   *  Was `modulesReadThisWeek: number`, passed `readModules.length` — an all-time count. So
   *  the moment anybody read one module ever, `modulesReadThisWeek < 1` was false forever and
   *  the "Read this week" card never came back, on a screen whose whole job is to say what to
   *  do next. `readModules` is a list of slugs with no timestamps, so "this week" was never
   *  computable from it; this is the question the data can actually answer. */
  hasUnreadForThisWeek: boolean;
  mirrorThisWeek: number;
  recordsThisWeek: number;
  /** Slug of the next unread module, when there is one. Passed in rather than looked up so
   *  this file stays free of content imports and keeps running under bare Node in tests.
   *
   *  Without it the card said "Read this week" and opened a list of twelve, which is one
   *  more decision at the exact moment the app has already decided for them. */
  nextUnreadModule?: string | null;
}): RecommendedAction {
  const { week, checkedInToday, hasUnreadForThisWeek, mirrorThisWeek, recordsThisWeek } = opts;

  if (!checkedInToday) {
    return {
      route: '/checkin',
      label: 'Daily check-in',
      why: 'Under thirty seconds. Your whole number is built from this.',
    };
  }

  const phase = phaseForWeek(week);

  if (phase.id === 1) {
    if (hasUnreadForThisWeek) {
      return {
        route: opts.nextUnreadModule ? `/module/${opts.nextUnreadModule}` : '/learn',
        label: 'Read this week',
        why: 'The first weeks are about seeing the pattern before you change it.',
      };
    }
    return {
      route: '/urges',
      label: 'Ride out an urge',
      why: 'Noticing an urge without acting on it is the skill the rest is built on.',
    };
  }

  if (phase.id === 2) {
    if (mirrorThisWeek < 2) {
      return {
        route: '/mirror',
        label: 'Mirror practice',
        why: 'Short and guided. Staying to the end is what makes it work.',
      };
    }
    if (recordsThisWeek < 1) {
      return {
        route: '/journal',
        label: 'Take a thought apart',
        why: 'Catch one thought and pull it apart.',
      };
    }
    return {
      route: '/urges',
      label: 'Ride out an urge',
      why: 'Sitting through one without checking is the skill the rest needs.',
    };
  }

  if (phase.id === 3) {
    if (mirrorThisWeek < 2) {
      return {
        route: '/mirror',
        label: 'Mirror practice',
        why: 'A longer session now, in a setting you normally avoid.',
      };
    }
    return {
      route: '/journal',
      label: 'Test a prediction',
      why: 'Guess what will happen, do it, then write down what did.',
    };
  }

  return {
    route: '/journal',
    label: 'Decide where the time goes',
    why: 'You have time back now. This part is about deciding where it goes.',
  };
}
