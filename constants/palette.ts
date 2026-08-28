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
  /* Darkened from #5B6552. That value cleared AA on the pale ramps with about 2% of
     headroom — and the motif is drawn ON TOP of the ramp at up to 0.10 of ink, which was
     never in that budget. Every caption on a game or track screen sits on ramp-plus-motif
     and measured 3.81-4.46:1. This clears 4.57:1 at the worst stop with the motif in the
     stack, which is the number that matters because it is what gets rendered. */
  inkFaint: '#505948',

  accent: '#46573B',
  accentDeep: '#35452C',
  accentDim: 'rgba(70,87,59,0.13)',
  onAccent: '#FBFCF8',

  /* Terracotta, not milky caramel. The old clay measured 2.30:1 on the day ramp, which made
     every chip and every completion check a decorative smudge. */
  cool: '#8A5535',
  coolDim: 'rgba(138,85,53,0.13)',

  /* Dusk rose — the fourth colour in the brief's system, and the only one this palette was
     missing. It is not a second terracotta: `cool` is earth, this is the colour a face
     goes. It carries EMOTION STATES, meaning the places the app reports something felt
     rather than something achieved — the relief a person took in Toward, a mood tag, warmth
     that is not progress.
     It is deliberately never used for correctness. Green means a move toward what matters
     and rose means comfort taken; the day those two start reading as right and wrong is the
     day the ACT game stops being an ACT game. */
  rose: '#8A4B54',
  roseDim: 'rgba(138,75,84,0.13)',

  warn: '#8C4232',
  scrim: 'rgba(244,245,240,0.74)',
};

/* ---------- dark: night, moss and low light ---------- */
export const dark = {
  isDark: true as boolean,

  bg: '#12170F',
  bgDeep: '#0D110C',
  /* DARKENS. It used to be a near-white at 0.10, mirrored from the light palette without
     re-deciding which way "raised" points in a dark room — so a Frost panel composited
     BRIGHTER than its own ground and the component that exists to make text readable made
     it worse: inkFaint on a panel over grove measured 2.37:1 against 3.00:1 bare. Worse
     still, `surfaceSolid` darkens, so one screen had two surfaces with opposite elevation
     polarity. Depth in dark comes from the TopEdge hairline, which constants/theme.ts
     already says; the fill just has to get out of the way. */
  surface: 'rgba(8,11,6,0.40)',
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

  rose: '#DDA6AB',
  roseDim: 'rgba(221,166,171,0.15)',

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
  /* Scaled with the other two. `night` was the closest to right and still was not: a motif
     stroke in DARK is LIGHT ink, so it raises the ground's luminance and costs contrast
     rather than adding it — inkFaint over night[2] measured 4.44:1 with the motif in the
     stack. All three deep ramps now top out at the same luminance, 0.023. */
  night: ['#10150F', '#161D13', '#1C2518', '#222D1D'],
  /* SCALED INTO NIGHT'S LUMINANCE BAND, and that is the whole of the correction.
     `groundFor` hands these to every track and game screen, and those screens set palette
     ink directly on them — so they are reading surfaces, whatever the comment above says
     about immersive scenes. They were far too bright for that: emberDeep reached #7A4823,
     where dark inkFaint measured 2.83:1 and inkSoft 4.18:1.
     Scaled proportionally rather than clamped at the top, so the gradient keeps its shape
     and both ramps keep their hue. The factors (0.67 and 0.64) were chosen to land their
     luminance spread on `night`'s — 0.009 to 0.035 — because `night` was the one deep ramp
     that was always correct, and the honest fix is to bring the other two into the band it
     already defines rather than to invent a new one. */
  grove: ['#0C110D', '#121B10', '#182415', '#212D1C'],
  emberDeep: ['#120905', '#1F1009', '#2E190D', '#3E2411'],
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
/* ⚠ THE HEADING WEIGHTS CAME DOWN, AND THAT IS A TONE FIX RATHER THAN A TASTE ONE.
 *
 * `display` and `h1` were 700 with -0.8 and -0.7 tracking, in near-black. Heavy, tight,
 * near-black headlines are assertive typography — the voice of a dashboard telling you a
 * number. "Where you are starting from", set that way above fifteen questions about somebody's
 * worst fortnight, is tonally the opposite of the brief's "nothing competes".
 *
 * 500 and -0.2 is the same scale and the same hierarchy at a lower temperature. `hero` keeps
 * its weight: it is the hours-back figure, the one number the product is actually about, and
 * it is meant to land.
 *
 * The real answer is still the brief's warm humanist serif, which needs a bundled face and a
 * font loader — neither is in package.json, so that stays a decision rather than a change. */
export const TYPE_SCALE = {
  hero: { fontSize: 64, lineHeight: 66, letterSpacing: -2.6, weight: '700' },
  display: { fontSize: 34, lineHeight: 38, letterSpacing: -0.2, weight: '500' },
  h1: { fontSize: 27, lineHeight: 33, letterSpacing: -0.2, weight: '500' },
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
