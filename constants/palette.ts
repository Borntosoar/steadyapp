/* Colour and scale, with no platform dependency.
 *
 * Split out of constants/theme.ts for one reason: theme.ts imports `Platform` from
 * react-native to pick a font family, which means bare Node cannot load it, which means the
 * contrast figures could not be tested. They were therefore asserted in comments instead —
 * and they were wrong, by a factor of four in places, for months.
 *
 * Anything a test needs to check lives here. theme.ts composes this with the font families
 * and re-exports, so nothing else in the app needs to know about the split. */

/* The darkest colour any LIGHT atmosphere ramp is permitted to contain, and the lightest
 * any DEEP ramp may contain.
 *
 * These exist because the ratios in this file are not measured against `bg`. `bg` is
 * painted and then Atmosphere is drawn across StyleSheet.absoluteFill on top of it on every
 * screen, so the ground a person actually sees is the ramp. Measured against the ramp, the
 * old palette's secondary ink was 2.05:1 in light and 1.83:1 in dark. Pinning the worst
 * case is what makes every number below a guarantee rather than a hope. */
export const LIGHT_GROUND_FLOOR = '#EBDDCB';
export const DARK_GROUND_CEILING = '#2B3824';

/* ---------- light: morning, sage and warm white ---------- */
export const light = {
  /** Which way the glass tints, which tint BlurView gets, which artwork reads. */
  isDark: false as boolean,

  bg: '#F4F5F0',
  bgDeep: '#E9EBE2',

  /* Warm white, not neutral. Neutral white over a green ground reads as a grey card; warm
     white reads as paper, and that is most of the difference between the reference's glass
     and a translucent rectangle. */
  surface: 'rgba(255,253,247,0.72)',
  surfaceStrong: 'rgba(255,253,247,0.90)',
  surfaceSolid: '#FDFCF6',
  line: 'rgba(30,36,27,0.09)',
  lineStrong: 'rgba(30,36,27,0.18)',

  ink: '#1E241B',
  inkSoft: '#414A3B',
  inkFaint: '#5B6552',

  accent: '#46573B',
  accentDeep: '#35452C',
  accentDim: 'rgba(70,87,59,0.13)',
  onAccent: '#FBFCF8',

  /* Terracotta, not milky caramel. The old clay measured 2.30:1 on the day ramp, which made
     every chip and every completion check a decorative smudge. */
  cool: '#8A5535',
  coolDim: 'rgba(138,85,53,0.13)',

  warn: '#8C4232',
  scrim: 'rgba(244,245,240,0.74)',
};

/* ---------- dark: night, moss and low light ---------- */
export const dark = {
  isDark: true as boolean,

  bg: '#12170F',
  bgDeep: '#0D110C',
  surface: 'rgba(226,238,212,0.10)',
  surfaceStrong: 'rgba(226,238,212,0.17)',
  surfaceSolid: '#232D20',
  line: 'rgba(226,238,212,0.14)',
  lineStrong: 'rgba(226,238,212,0.26)',

  ink: '#E8ECE0',
  inkSoft: '#BAC4B0',
  inkFaint: '#97A28D',

  accent: '#AFD08E',
  accentDeep: '#C6DEA6',
  accentDim: 'rgba(175,208,142,0.15)',
  onAccent: '#14200E',

  cool: '#D9A277',
  coolDim: 'rgba(217,162,119,0.15)',

  warn: '#E08A72',
  scrim: 'rgba(18,23,15,0.74)',
};

export const palette = { light, dark };
export type Palette = typeof light;

/* ---------- atmosphere ramps ----------
 *
 * Keyed to time of day, never to the user's numbers. Tying the mood of the screen to how
 * well somebody is doing would turn the background into a score.
 *
 * The pale ramps travel green to warm sand rather than sitting in one hue at four
 * brightnesses, which is what gives a screen a direction rather than a wash. */
export type AtmosphereKey = 'dawn' | 'day' | 'dusk' | 'night' | 'ember' | 'jade' | 'grove' | 'emberDeep';

export const ATMOSPHERES: Record<AtmosphereKey, string[]> = {
  dawn: ['#EDE9DE', '#F3EBDE', '#F7EEE2', '#FBF4EA'],
  day: ['#E9EDE2', '#F1F1E7', '#F5F0E6', '#FAF6EE'],
  dusk: ['#DFE1D6', '#E7E0D2', '#EEDDCB', '#F5E9D8'],
  ember: ['#EBDDCB', '#F1E4D2', '#F6EBDC', '#FBF3E7'],
  jade: ['#DAE3D2', '#E3EADA', '#EDF0E2', '#F5F4EA'],

  /* Deep ramps, for the full-frame exercise scenes only. Those set white type directly on
     the artwork, so the ramp under it is a contrast requirement rather than a mood choice.
     `night` used to end at #616B49 — a mid olive lighter than the dark palette's own
     secondary ink, which is why every caption on a dark screen was invisible. */
  night: ['#141A13', '#1B2418', '#232E1E', '#2B3824'],
  grove: ['#16211A', '#22331F', '#2F4529', '#3E5735'],
  emberDeep: ['#241209', '#3D2011', '#5A3219', '#7A4823'],
};

/** Ramps whose type is set in WHITE, not in palette ink.
 *
 *  That distinction matters and the first version of the contrast test got it wrong: it
 *  measured the dark palette's ink against `emberDeep`, failed, and looked like a palette
 *  bug. Nothing renders palette ink on a deep ramp — the immersive scenes set white
 *  directly. So deep ramps are checked for white contrast, and the dark palette's ink is
 *  checked against `night`, which is the only ramp `atmosphereForScheme` returns for it. */
export const DEEP_RAMPS: AtmosphereKey[] = ['night', 'grove', 'emberDeep'];

/** The lightest ground the DARK palette's ink is ever set on. `atmosphereForScheme` returns
 *  `night` and nothing else when the palette is dark, so this is night's final stop. */
export const DARK_INK_GROUND = '#2B3824';

/* ---------- the type ladder ----------
 *
 * Sizes only; theme.ts adds the families. The old scale had ten steps with six of them
 * inside a 4.5pt band, and `h3` and `body` were both 16 — which is exactly why the list
 * screens read as undifferentiated walls of text. */
export const TYPE_SCALE = {
  hero: { fontSize: 64, lineHeight: 66, letterSpacing: -2.6, weight: '700' },
  display: { fontSize: 34, lineHeight: 38, letterSpacing: -0.8, weight: '700' },
  h1: { fontSize: 27, lineHeight: 33, letterSpacing: -0.7, weight: '700' },
  h2: { fontSize: 21, lineHeight: 27, letterSpacing: -0.4, weight: '600' },
  h3: { fontSize: 17, lineHeight: 23, letterSpacing: -0.1, weight: '600' },
  body: { fontSize: 16, lineHeight: 25, letterSpacing: 0, weight: '400' },
  read: { fontSize: 17, lineHeight: 28, letterSpacing: 0, weight: '400' },
  bodySm: { fontSize: 15, lineHeight: 22, letterSpacing: 0, weight: '400' },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: 0.1, weight: '600' },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0, weight: '500' },
  timer: { fontSize: 56, lineHeight: 60, letterSpacing: -1, weight: '300' },
} as const;

/** Steps that must each be meaningfully larger than the next. `read` sits beside `h3` on
 *  purpose and is excluded — it is a parallel scale for prose, not a rung. */
export const TYPE_LADDER = ['hero', 'display', 'h1', 'h2', 'h3', 'body', 'bodySm', 'caption'] as const;

/** Figures that animate a count-up, and therefore must be tabular or they shimmy. */
export const COUNTING_TYPE = ['hero', 'timer'] as const;
