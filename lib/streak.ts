/* Streak logic.
 *
 * A streak in a mental-health app is a loaded object. Done wrong it becomes another
 * thing to fail at, and for this population — where shame drives concealment and
 * dropout — that is actively harmful. So:
 *
 *   - It increments on ANY engagement, including tapping "hard day". Showing up while
 *     struggling counts the same as a full session, because clinically it is worth more.
 *   - Freezes are applied SILENTLY. The user is never told they nearly lost it.
 *   - There is no red state, no broken-flame iconography, no "you lost your streak".
 *   - Milestones celebrate attendance, never appearance and never improvement.
 *
 * Every string this module can produce is asserted against a shaming-language regex in
 * __tests__/streak.test.mjs. */

import type { StreakState } from '../types';

export const MAX_FREEZES = 5;
export const STARTING_FREEZES = 2;
export const DAYS_PER_EARNED_FREEZE = 7;

export const initialStreak = (): StreakState => ({
  current: 0,
  longest: 0,
  freezesRemaining: STARTING_FREEZES,
  lastPracticeDate: null,
  frozenDates: [],
});

const DAY = 86400000;

/** Local calendar day, `YYYY-MM-DD`. Local, not UTC, and that is the whole point: this is
 *  the definition of "today" every stored date uses, so anything comparing against a
 *  stored date must come through here. */
export function dayKey(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / DAY);
}

/**
 * Register engagement on `today`.
 *
 * Gap handling:
 *   gap === 0  already counted today, no change
 *   gap === 1  consecutive, increment
 *   gap  >  1  missed days — spend freezes to cover them if we have enough,
 *              otherwise the streak restarts at 1. Restarting is silent.
 */
export function registerPractice(state: StreakState, today = dayKey(new Date())): StreakState {
  if (!state.lastPracticeDate) {
    return bumpLongest({
      ...state,
      current: 1,
      lastPracticeDate: today,
    });
  }

  const gap = daysBetween(state.lastPracticeDate, today);

  if (gap === 0) return state;

  /* A STORED DATE AHEAD OF TODAY CAN ONLY BE CLOCK SKEW, AND IT USED TO BE ABSORBING.
     This was `if (gap <= 0) return state`, which returns the state UNTOUCHED — so
     `lastPracticeDate` never repaired itself and every later day was negative too. One
     practice logged while the device clock read a future date froze the streak for good: 440
     honest consecutive days afterwards still displayed "1 days in a row", `longest` never
     moved again, the 7/30/100-day milestones were dead, and the winback moment could never
     fire because its gap stayed negative. Note the asymmetry — a garbage date self-heals
     through the restart branch below; only a future one was permanent.
     A real timezone move can only put the key one day ahead, and that recovers on its own.
     The permanent case needs a genuinely wrong clock: a manual change, an Android device
     booting with a bad RTC and no network, a backup restored from one. Uncommon, silent,
     irreversible — in an app whose streak is explicitly designed never to punish anybody.
     lib/moments.ts already guards the hard-day dates against exactly this. Re-anchor on today
     and keep the run, silently, like every other repair in this module. */
  if (gap < 0) return bumpLongest({ ...state, lastPracticeDate: today });

  if (gap === 1) {
    const current = state.current + 1;
    return bumpLongest(grantFreeze({ ...state, current, lastPracticeDate: today }, current));
  }

  const missed = gap - 1;

  if (missed <= state.freezesRemaining) {
    const frozen: string[] = [];
    for (let i = 1; i <= missed; i++) {
      const d = new Date(state.lastPracticeDate + 'T00:00:00');
      d.setDate(d.getDate() + i);
      frozen.push(dayKey(d));
    }
    const current = state.current + 1;
    return bumpLongest(
      grantFreeze(
        {
          ...state,
          current,
          freezesRemaining: state.freezesRemaining - missed,
          frozenDates: [...state.frozenDates, ...frozen],
          lastPracticeDate: today,
        },
        current
      )
    );
  }

  // Not enough freezes. Restart quietly at 1 — the longest run is preserved so nothing
  // the user achieved is erased.
  return bumpLongest({
    ...state,
    current: 1,
    freezesRemaining: state.freezesRemaining,
    lastPracticeDate: today,
  });
}

function grantFreeze(state: StreakState, current: number): StreakState {
  if (current > 0 && current % DAYS_PER_EARNED_FREEZE === 0) {
    return { ...state, freezesRemaining: Math.min(MAX_FREEZES, state.freezesRemaining + 1) };
  }
  return state;
}

function bumpLongest(state: StreakState): StreakState {
  return { ...state, longest: Math.max(state.longest, state.current) };
}

export const MILESTONES = [7, 30, 100];

export function milestoneReached(previous: number, next: number): number | null {
  for (const m of MILESTONES) {
    if (previous < m && next >= m) return m;
  }
  return null;
}

export function milestoneCopy(days: number): { title: string; body: string } {
  if (days >= 100) {
    return {
      title: '100 days of showing up',
      body: 'A hundred days of turning toward this instead of away from it. That is the whole skill, and you have been practising it for over three months.',
    };
  }
  if (days >= 30) {
    return {
      title: '30 days of showing up',
      body: 'A month of consistent practice. This is roughly the point where most people start noticing the hours coming back.',
    };
  }
  return {
    title: 'A week of showing up',
    body: 'Seven days. The hardest part of this is the turning up, and you have done it seven times.',
  };
}

/** Copy for a returning user who has been away. Forward-looking only — no accounting of
 *  what was missed, no guilt, no "welcome back, you were gone for 9 days". */
export function returningCopy(): string {
  return 'Good to have you here. Today is the only day this needs to be about.';
}

export function freezeCopy(remaining: number): string {
  if (remaining <= 0) return 'Streak freezes: none banked right now';
  return `${remaining} streak freeze${remaining === 1 ? '' : 's'} banked`;
}
