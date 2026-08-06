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
    focus: 'Daily check-in only. No exposure work yet — first we find out where you actually are.',
  },
  {
    id: 2,
    name: 'Interrupt the loop',
    weeks: [4, 5, 6],
    goal: 'The first measurable drop in checking.',
    focus: 'Checking log, urge surfing, thought records, and the first short mirror sessions.',
  },
  {
    id: 3,
    name: 'Widen the lens',
    weeks: [7, 8, 9],
    goal: 'Avoidance drops.',
    focus: 'Attention training, longer mirror sessions, and behavioural experiments — do the avoided thing, predict what happens, record what actually happened.',
  },
  {
    id: 4,
    name: 'Live in the hours',
    weeks: [10, 11, 12],
    goal: 'You leave with a written plan and a number.',
    focus: 'Values work, spending the reclaimed time deliberately, and building your own relapse plan.',
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

export function weekProgress(state: ProtocolState): {
  done: number;
  required: number;
  complete: boolean;
  remaining: number;
} {
  const done = new Set(state.weekPracticeDates).size;
  return {
    done,
    required: PRACTICE_DAYS_PER_WEEK,
    complete: done >= PRACTICE_DAYS_PER_WEEK,
    remaining: Math.max(0, PRACTICE_DAYS_PER_WEEK - done),
  };
}

/** Record a practice day against the current week and advance when the minimum is met.
 *  Pure: returns the next state rather than mutating. */
export function recordPracticeDay(state: ProtocolState, dayKey: string): ProtocolState {
  if (state.weekPracticeDates.includes(dayKey)) return state;

  const weekPracticeDates = [...state.weekPracticeDates, dayKey];
  const done = new Set(weekPracticeDates).size;

  if (done < PRACTICE_DAYS_PER_WEEK || state.currentWeek >= WEEKS_TOTAL) {
    return { ...state, weekPracticeDates };
  }

  return {
    ...state,
    completedWeeks: state.completedWeeks.includes(state.currentWeek)
      ? state.completedWeeks
      : [...state.completedWeeks, state.currentWeek],
    currentWeek: state.currentWeek + 1,
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
  | { route: '/learn'; label: string; why: string }
  | { route: '/grounding'; label: string; why: string };

export function recommendedAction(opts: {
  week: number;
  checkedInToday: boolean;
  modulesReadThisWeek: number;
  mirrorThisWeek: number;
  recordsThisWeek: number;
}): RecommendedAction {
  const { week, checkedInToday, modulesReadThisWeek, mirrorThisWeek, recordsThisWeek } = opts;

  if (!checkedInToday) {
    return {
      route: '/checkin',
      label: 'Daily check-in',
      why: 'Under thirty seconds. This is what the whole number is built from.',
    };
  }

  const phase = phaseForWeek(week);

  if (phase.id === 1) {
    if (modulesReadThisWeek < 1) {
      return {
        route: '/learn',
        label: 'Read this week’s module',
        why: 'Phase one is about understanding the pattern before changing it.',
      };
    }
    return {
      route: '/urges',
      label: 'Log a checking urge',
      why: 'Noticing the urge without acting on it is the skill everything else rests on.',
    };
  }

  if (phase.id === 2) {
    if (mirrorThisWeek < 2) {
      return {
        route: '/mirror',
        label: 'Mirror practice',
        why: 'Short and structured. Staying to the end is what makes it work.',
      };
    }
    if (recordsThisWeek < 1) {
      return {
        route: '/journal',
        label: 'Write a thought record',
        why: 'Catch one thought and take it apart.',
      };
    }
    return {
      route: '/urges',
      label: 'Log a checking urge',
      why: 'The checking count is the number that moves first.',
    };
  }

  if (phase.id === 3) {
    if (mirrorThisWeek < 2) {
      return {
        route: '/mirror',
        label: 'Mirror practice',
        why: 'Longer session this phase, with a condition you normally avoid.',
      };
    }
    return {
      route: '/journal',
      label: 'Run a behavioural experiment',
      why: 'Predict what will happen, do the avoided thing, then write what actually happened.',
    };
  }

  return {
    route: '/journal',
    label: 'Values and the hours',
    why: 'You have time back now. This phase is about deciding where it goes.',
  };
}
