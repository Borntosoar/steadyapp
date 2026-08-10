import { dayKey } from './streak.ts';

/* Dates a person can read.
 *
 * The urge log stores a full ISO timestamp and the Recent list rendered it verbatim, so
 * the screen literally read `2026-08-07T19:13:56.332Z`. That single string did more to make
 * this app feel like a database front-end than any colour choice in it. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Today · 19:13", "Yesterday · 08:02", "Tue 5 Aug". Accepts a full ISO timestamp or a
 *  bare YYYY-MM-DD; a bare date has no clock time, so none is shown. */
export function formatLogDate(iso: string, now: Date = new Date()): string {
  const hasTime = iso.includes('T');
  const d = new Date(hasTime ? iso : iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';

  const clock = hasTime
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : '';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let day: string;
  if (dayKey(d) === dayKey(now)) day = 'Today';
  else if (dayKey(d) === dayKey(yesterday)) day = 'Yesterday';
  else day = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  return clock ? `${day} · ${clock}` : day;
}
