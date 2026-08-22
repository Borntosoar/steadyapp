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
 *  WHY MIDNIGHT IS NOT DARK ON THE LIGHT PALETTE, since that is the obvious objection. The
 *  app does have a pattern for a deep ramp under light ink — the full-frame exercise scenes
 *  use it — but the Support pill is drawn by the root layout in palette colours over every
 *  screen in the app, and on a deep ground under the light palette it would be dark ink on
 *  a dark field. Fixing that means teaching the root layout about a per-screen inversion,
 *  which is a lot of new surface for one scene. So the light palette stays on pale ramps and
 *  `smallHours` gets the coolest, dimmest one available; the hour is carried by the motif
 *  and the copy instead. If the Support pill ever learns to invert, this is the line to
 *  revisit.
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

/** The ceiling the motif's opacity may not cross.
 *
 *  This is a number in a tested file rather than a literal in a stylesheet for one reason:
 *  it is the difference between a ground and a distraction, it will be tempting to raise it
 *  the first time somebody says the wallpaper is too subtle, and the thought pills that sit
 *  on top of it are the thing this app actually has to keep readable. Raising it is allowed;
 *  raising it past here is a decision the test makes somebody make on purpose. */
export const MOTIF_MAX_OPACITY = 0.1;

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
 *  it from looking like a grid. */
export function scatter(seed: string, cols = 4, rows = 7): MotifDot[] {
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
        x: (c + 0.15 + rnd() * 0.7) / cols,
        y: (r + 0.15 + rnd() * 0.7) / rows,
        scale: 0.7 + rnd() * 0.6,
        rotate: (rnd() - 0.5) * 50,
      });
    }
  }
  return dots;
}
