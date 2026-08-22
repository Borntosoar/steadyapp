import { trackById, type Track, type TrackDay } from '../content/tracks.ts';

/* Where somebody is in a guided track.
 *
 * DAYS UNLOCK ON COMPLETION, NEVER ON ELAPSED TIME. The same rule the twelve-week protocol
 * uses, and here it matters more: a track that unlocks on the calendar tells somebody who
 * opened it three weeks after the breakup that they are on day one, and tells somebody who
 * missed four days that they are behind. Neither is true and both are the kind of thing that
 * gets an app deleted at midnight.
 *
 * AND THERE IS NO CAP. Doing three in an evening is allowed. A cap would be the app deciding
 * it knows the right pace for somebody's worst month, which it does not, and every other
 * refusal in this product points the same way — the skip in the games, the pass, the
 * no-clock mode. What the screen does instead is say plainly that there is no schedule.
 *
 * PROGRESS IS A SET OF DAY IDS, NOT AN INDEX. An index breaks the moment a day is inserted,
 * reordered or renamed, and silently moves everybody who was mid-track. Ids survive all
 * three.
 *
 * Pure, and lib/ stays loadable under bare Node. */

export interface TrackState {
  /** ISO, first time it was opened. Never used to compute what is unlocked — see above. */
  startedAt: string;
  /** Day ids finished, in no particular order. */
  done: string[];
}

export const emptyTrack = (startedAt: string): TrackState => ({ startedAt, done: [] });

/** A day is open if it is the first unfinished one, or already finished. Everything after
 *  the first unfinished day is closed — the sequence is the product. */
export function isOpen(track: Track, state: TrackState, dayId: string): boolean {
  if (state.done.includes(dayId)) return true;
  return nextDay(track, state)?.id === dayId;
}

/** The first day not yet finished, or null when the track is complete. */
export function nextDay(track: Track, state: TrackState): TrackDay | null {
  return track.days.find((d) => !state.done.includes(d.id)) ?? null;
}

export function isComplete(track: Track, state: TrackState): boolean {
  return nextDay(track, state) === null;
}

/** How many are done, for the seedling on the overview. Never rendered as a percentage. */
export function progressOf(track: Track, state: TrackState): { done: number; total: number } {
  /* Counts only ids the track still contains, so removing a day from the content cannot
     leave somebody at eight of seven. */
  const ids = new Set(track.days.map((d) => d.id));
  return { done: state.done.filter((id) => ids.has(id)).length, total: track.days.length };
}

/** Idempotent. Finishing a day twice is a double tap, not two days. */
export function markDone(state: TrackState, dayId: string): TrackState {
  return state.done.includes(dayId) ? state : { ...state, done: [...state.done, dayId] };
}

/** Resolve a track and its state together, tolerating anything that comes off disk. */
export function openTrack(
  id: string,
  states: Record<string, TrackState>,
): { track: Track; state: TrackState } | null {
  const track = trackById(id);
  if (!track) return null;
  return { track, state: states[id] ?? emptyTrack(new Date().toISOString()) };
}
