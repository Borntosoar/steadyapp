import { BREATHE, RESET, MODES, MODE_BY_NAME, type StillMode } from '../content/still.ts';

/* The arithmetic behind Still.
 *
 * Pure, and lib/ stays loadable under bare Node, so the pacing can be exercised without a
 * phone. That matters more here than usual: every bug in this file is a bug in how long
 * somebody is asked to hold their breath.
 *
 * The one rule worth stating up front — NOTHING HERE ROUNDS UP. A cycle count that rounds up
 * makes a "two minute" session longer than two minutes, and the person it is longest for is
 * the person who chose the shortest option, which is the person least able to sit through it. */

/** One full breath, in seconds. */
export const CYCLE_SECONDS = BREATHE.inhale + BREATHE.exhale;

/** How many whole breaths fit in the chosen length.
 *
 *  Floored, never rounded — see above — and never below one, because a zero-cycle breathing
 *  exercise is a screen that ends the instant it starts. */
export function cyclesFor(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 1;
  /* Clamped at both ends. The upper clamp is not decoration: `Math.floor(1e308 * 60 / 10)`
     is Infinity, and `Math.max(1, Infinity)` is Infinity — so a absurd length produced an
     infinite cycle count from a function whose contract is "a whole number of breaths".
     Found by fuzzing, not reachable from the picker today, and exactly the kind of hole that
     stops being unreachable the first time a length comes from somewhere else. An hour is
     already far past anything this screen should offer. */
  const MAX_CYCLES = Math.floor((60 * 60) / CYCLE_SECONDS);
  return Math.min(MAX_CYCLES, Math.max(1, Math.floor((minutes * 60) / CYCLE_SECONDS)));
}

/** What the session will actually take, which is not what was asked for.
 *
 *  Shown to nobody, and used by the tests: five minutes of ten-second cycles is thirty
 *  cycles and exactly five minutes, but two minutes is twelve cycles and exactly two, and
 *  the moment either number changes those stop coinciding. A screen promising "two minutes"
 *  while running two minutes twenty is a small lie told to somebody who is counting. */
export const actualSeconds = (minutes: number): number => cyclesFor(minutes) * CYCLE_SECONDS;

/** Whether the pattern has a hold phase.
 *
 *  Exists so a test can assert it does not. `content/exercises.ts` BREATH is 4-7-8 with a
 *  seven-second hold and its own copy says four cycles is enough; sustaining that for the
 *  minutes this mode asks for would contradict the app's own safety line. If a hold is ever
 *  added here, that copy has to be revisited first. */
export const hasHold = (): boolean => 'hold' in BREATHE;

/** Which script line is showing at `elapsed` seconds of a session `total` seconds long.
 *
 *  RESET.steps carry `at` as a FRACTION of the session rather than a second count, so ten
 *  and twenty minutes run one script at two speeds instead of needing two scripts that would
 *  then drift apart. Returns the last step whose position has passed, or null before the
 *  first — null rather than the first step, because a body scan should open on a moment of
 *  nothing rather than on an instruction. */
export function resetStepAt(elapsed: number, total: number): string | null {
  if (!Number.isFinite(elapsed) || !Number.isFinite(total) || total <= 0) return null;
  const frac = elapsed / total;
  let out: string | null = null;
  for (const s of RESET.steps) {
    /* `at` is optional on ScriptStep because other scripts in content/exercises.ts leave it
       off. A step with no position cannot be placed on a timeline, so it is skipped rather
       than treated as position zero — which would pin it to the top of every session. */
    if (typeof s.at === 'number' && frac >= s.at) out = s.text;
  }
  return out;
}

/** The survey names a mode in the user's language — "Float" — and the router needs a key.
 *
 *  Anything unrecognised falls to 'breathe' rather than throwing: this is reached from a
 *  stored survey answer and from a deep link, and neither is trusted. The same defensive
 *  reasoning as carryingOf in lib/plan.ts, and for the same reason — a person arriving from
 *  a stale link should land somewhere calm, not on a crash. */
export function modeFromName(name: string | null | undefined): StillMode {
  if (typeof name !== 'string') return 'breathe';
  return Object.prototype.hasOwnProperty.call(MODE_BY_NAME, name) ? MODE_BY_NAME[name] : 'breathe';
}

/** Validate a mode key arriving as a query param, against the closed set. */
export function modeFromParam(v: string | null | undefined): StillMode | null {
  return MODES.some((m) => m.key === v) ? (v as StillMode) : null;
}
