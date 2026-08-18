/* Did this navigation come from inside the app, or from a link?
 *
 * The app registers the `anneal://` scheme, so every route is addressable by any other app
 * on the device, by Safari, and by a link in a message. Almost all of those routes are inert
 * — they render something and read nothing. `/grounding?mode=hard` was the exception: it
 * logged a hard-day practice entry on mount, with no interaction at all.
 *
 * That is the right behaviour when the person tapped "Today is a hard day" in the app. It is
 * the single most valuable thing somebody can do on a bad day and it must not depend on them
 * finishing anything afterwards. It is the wrong behaviour when a link did it, because then
 * `anneal://grounding?mode=hard` writes into somebody's record that they had a bad day —
 * a record that later gets exported to a clinician — and nudges the protocol's practice-day
 * count, which is what unlocks the exposure work. SAFETY.md §9 says that hierarchy is
 * enforced by the app rather than by the user's judgement; a link should not move it.
 *
 * A URL parameter cannot carry this distinction, because anything the app can put in a URL,
 * a link can put in the same URL. So the signal lives in memory instead: set by the screen
 * doing the navigating, in the same tick, and unreachable from outside the process. A cold
 * start from a link finds it false. It is deliberately not persisted — a flag that survived
 * a restart would be a flag that could be stale.
 */

let hardDayFromApp = false;

/** Call immediately before navigating to the hard-day path from inside the app. */
export function markHardDayIntent(): void {
  hardDayFromApp = true;
}

/** True only if this navigation was started by the app. Reading it clears it, so one
 *  intent covers exactly one arrival. */
export function consumeHardDayIntent(): boolean {
  const v = hardDayFromApp;
  hardDayFromApp = false;
  return v;
}
