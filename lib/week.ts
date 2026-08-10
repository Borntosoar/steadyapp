import { dayKey } from './streak.ts';

/* The last seven days as something you can look at.
 *
 * This is the only object in the app that accumulates. Nothing else on any screen shows
 * more than a single day, which is why yesterday's work left no trace and why opening the
 * app tomorrow felt identical to opening it today.
 *
 * A day that was missed is drawn as nothing at all — no red, no gap in a chain, no icon.
 * SAFETY.md §3: the person most likely to miss a week is the person having the worst week,
 * and they are exactly who this has to keep. Only presence is ever drawn. */

export interface WeekDay {
  /** Local day key, YYYY-MM-DD. */
  key: string;
  /** Single letter for the column head. */
  label: string;
  done: boolean;
  today: boolean;
}

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Oldest first, today rightmost — the direction every calendar the user has ever opened
 *  runs, which beats any argument for putting today on the left. */
export function lastSevenDays(doneDates: Iterable<string>, now: Date = new Date()): WeekDay[] {
  const done = new Set(doneDates);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    return { key, label: LETTERS[d.getDay()], done: done.has(key), today: i === 6 };
  });
}

/** How many of the last seven days have something on them. */
export function daysThisWeek(days: WeekDay[]): number {
  return days.filter((d) => d.done).length;
}
