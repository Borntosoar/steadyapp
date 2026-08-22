import { DEEP_RAMPS, type AtmosphereKey } from '../constants/palette.ts';

/* Per-scene ground for the games.
 *
 * WHAT THIS IS FOR. A Curveball scene is a situation, and the situation is the thing the
 * player has to be inside before any of the thoughts mean anything. Reading "your partner
 * has been short with you since this morning" off a neutral grey field asks somebody to
 * build the room themselves in the second before the first thought arrives. Giving each
 * scene its own ground — a warm one for the relationship scene, first light for the
 * morning one, small hours for the midnight one — does that work for them.
 *
 * THE RULE THIS MUST NOT BREAK, and it is already written down in components/Atmosphere.tsx:
 * the ground must never key off how somebody is doing. A background that responds to a
 * score is a mood ring, and a mood ring is a rating with better manners. Everything here
 * keys off WHICH SCENE IT IS and nothing else — the same scene looks the same whether it is
 * played perfectly or not at all. If a future change makes a mood depend on a tally, that
 * is the line being crossed.
 *
 * WHY THE MOTIF NEVER MOVES. Curveball's entire tell is motion: distorted thoughts sway and
 * tilt, balanced ones travel straight. Anything else on screen that moves is competing for
 * the one channel the game teaches you to read. So the motif is drawn once and sits still,
 * and that is a game-design constraint rather than a performance one.
 *
 * WHY A MOOD RATHER THAN AN ATMOSPHERE KEY. Half the atmosphere ramps are deep ones meant
 * for scenes that set white type directly on the artwork; the rest are pale. Letting a
 * scene name a ramp directly means one day a scene names `emberDeep` while the light
 * palette is drawing dark ink on it, and the result is unreadable. A mood names a pair —
 * one pale, one deep — and `groundFor` picks by palette. The test asserts the pairing.
 *
 * Pure, and lib/ stays loadable under bare Node. */

export type SceneMood =
  /** Somebody you love, and the temperature that comes with it. */
  | 'tender'
  /** Flat working daylight. Offices, feedback, competence. */
  | 'daylight'
  /** Late afternoon into evening. Rooms with other people in them. */
  | 'evening'
  /** The hours where things get replayed. */
  | 'smallHours'
  /** Before the day has had a chance to be anything. */
  | 'morning';

/** Each mood's pale ramp and its deep counterpart.
 *
 *  WHY MIDNIGHT IS NOT DARK ON THE LIGHT PALETTE. This note previously blamed the Support
 *  pill, which the root layout draws in palette colours over every screen and which would
 *  indeed be dark-on-dark over a deep ramp. That is true and it is not the binding
 *  constraint, so it was the wrong thing to record — measured, the first thing to break is
 *  the type. `inkFaint` (#5B6552, the "The situation" caption) sits at 4.59:1 on
 *  LIGHT_GROUND_FLOOR, about 2% of headroom over AA, and every pale ramp is bounded by that
 *  floor for exactly this reason. Dimming `smallHours` below it breaks the caption before it
 *  troubles the Support pill.
 *
 *  So the real precondition for a darker midnight is darkening `inkFaint` first — somewhere
 *  around #4A5343 buys room down to roughly #CDD5C9, which is a materially different hour.
 *  That is a smaller change than teaching the root layout about per-screen inversion, and
 *  __tests__/contrast.test.mjs already computes everything needed to check it. Until then the
 *  light palette stays on pale ramps and the hour is carried by the motif and the copy.
 *
 *  `evening` and `smallHours` were briefly the same pair, which meant two moods that looked
 *  identical on both palettes — a distinction the content declared and the screen could not
 *  show. Warm sand for a room with people in it, cool sage for three in the morning. */
export const MOODS: Record<SceneMood, { light: AtmosphereKey; deep: AtmosphereKey }> = {
  tender: { light: 'ember', deep: 'emberDeep' },
  daylight: { light: 'day', deep: 'grove' },
  evening: { light: 'dusk', deep: 'grove' },
  smallHours: { light: 'jade', deep: 'night' },
  morning: { light: 'dawn', deep: 'night' },
};

export function groundFor(mood: SceneMood, isDark: boolean): AtmosphereKey {
  const pair = MOODS[mood];
  return isDark ? pair.deep : pair.light;
}

/** True when a ramp is one of the deep ones. Re-exported as a function so the test can
 *  check the pairing above without importing the palette itself. */
export const isDeep = (k: AtmosphereKey): boolean => DEEP_RAMPS.includes(k);

/* ---------- the motif scatter ---------- */

export type MotifKind =
  /** Speech bubbles. A message sent, or not answered. */
  | 'messages'
  /** Hearts. Somebody you are with. */
  | 'hearts'
  /** Sheets of paper. Work, feedback, being assessed. */
  | 'papers'
  /** Crescents. Rest, and cancelling things in order to get it. */
  | 'moons'
  /** Overlapping rings. A room with other people in it. */
  | 'rings'
  /** Closed loops. The same three seconds, again. */
  | 'loops'
  /** Low rays. Morning, before anything has happened. */
  | 'rays';

/** The ceiling the motif's opacity may not cross, per palette.
 *
 *  ONE NUMBER WAS THE WRONG SHAPE, and the design review caught it. A fixed alpha over a
 *  variable-luminance ground does not produce a fixed perceived weight: dark ink at 10% on
 *  the pale `ember` ramp lands about 0.21 above the ground in relative luminance, while
 *  light ink at 10% on `grove` lands about 0.32 above it. Same constant, roughly half again
 *  the weight in dark. So it is a pair, and the component picks.
 *
 *  These live in a tested file rather than as literals in a stylesheet because raising them
 *  is exactly what somebody will do the first time the wallpaper is called too subtle, and
 *  the thought pills sitting on top are the thing this app has to keep readable. */
export const MOTIF_MAX_OPACITY = { light: 0.1, dark: 0.065 } as const;

/** Roughly square cell, in points. The caller divides its measured box by this to get the
 *  grid, rather than passing a fixed 4×7 — which on a 393×852 frame produced 98×122 cells,
 *  a row pitch bigger than the jitter could bridge, and therefore visible horizontal bands
 *  of glyphs. Square cells and jitter near the full cell width is what makes a scatter look
 *  scattered. */
export const MOTIF_CELL = 74;

/** Per-kind stroke width, normalised so every motif lands roughly the same ink on screen.
 *
 *  `rings` is two complete circles — about 70 units of stroke in the 24×24 box. `moons` is
 *  a single crescent, about 34. Drawn at one width they differ by roughly 2x in weight, so
 *  two of the seven scenes read as busy and two as bare at an identical opacity. Widths are
 *  tuned against total stroke length rather than by eye; the ordering is the arithmetic, the
 *  exact values are rounded to something that renders cleanly at small sizes. */
export const STROKE: Record<MotifKind, number> = {
  rings: 1.0,
  papers: 1.15,
  messages: 1.25,
  loops: 1.35,
  hearts: 1.4,
  rays: 1.45,
  moons: 1.6,
};

export interface MotifDot {
  /** 0–1 across the field. Multiply by the measured width. */
  x: number;
  /** 0–1 down the field. */
  y: number;
  /** Relative size, roughly 0.7–1.3. */
  scale: number;
  /** Degrees. */
  rotate: number;
}

/** A stable hash of the scene id. Same scene, same wallpaper, every time it is played —
 *  a ground that reshuffles between renders reads as the screen flickering. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A jittered grid rather than free random placement. Free placement clumps — three motifs
 *  land on top of each other and leave a bare quarter, which reads as a mistake rather than
 *  as texture. One per cell with jitter inside the cell keeps the coverage even and keeps
 *  it from looking like a grid.
 *
 *  `cols` and `rows` are the caller's job now, derived from its measured box over
 *  MOTIF_CELL, because a fixed grid on a variable frame gives non-square cells and the row
 *  banding that comes with them.
 *
 *  ROTATION IS ZERO AND THAT IS NOT AN OVERSIGHT. This used to spread each mark over ±25°.
 *  Curveball's distortion tell is a 2.4° tilt, and a field of randomly tilted marks is a
 *  rod-and-frame illusion pointed straight at the thing the player is being trained to see —
 *  a tilted surround biases perceived vertical by several degrees, worst exactly in the
 *  small-angle range the game works in. Upright marks give the field a true vertical instead,
 *  which makes the tilt easier to spot rather than harder. It also fixes two glyphs that
 *  simply stop reading when rotated: a sunrise has an implied horizon, and a sheet of paper
 *  at 25° is a scribble. The field keeps its `rotate` so a future kind that genuinely wants
 *  a spin can have one deliberately. */
export function scatter(seed: string, cols: number, rows: number): MotifDot[] {
  let s = hash(seed) || 1;
  const rnd = () => {
    /* xorshift32. Small, fast, and does not have the low-bit periodicity that a bare LCG
       shows when you only take a few values per cell. */
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };

  const dots: MotifDot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        /* Jitter across 0.9 of the cell rather than 0.7. At 0.7 the reachable range within a
           row was narrower than the row pitch, so no mark could ever sit level with one from
           the row above and the grid stayed legible as bands. */
        x: (c + 0.05 + rnd() * 0.9) / cols,
        y: (r + 0.05 + rnd() * 0.9) / rows,
        scale: 0.78 + rnd() * 0.44,
        rotate: 0,
      });
    }
  }
  return dots;
}
