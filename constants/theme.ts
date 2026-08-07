import { Platform } from 'react-native';

/* Design tokens.
 *
 * Dark-first, on purpose. The scene: someone opens this at 11pm with the lights off after
 * a bad evening in front of the mirror, or at 7am deciding whether to leave the house.
 * A bright white screen at either of those moments is a small cruelty.
 *
 * Colour strategy is COMMITTED rather than restrained: a cool night ground carries most
 * of the surface, and a single warm amber accent carries every action. Two hues on a real
 * contrast axis, so the interface has a point of view instead of the tinted-neutral-plus-
 * one-accent arrangement that every wellness app arrives at by default.
 *
 * The accent is ochre, not peach, and that is a deliberate correction. Roughly as many
 * men as women live with this, and a pale salmon accent on a soft dark ground is read
 * instantly as an app for women — which would quietly tell half the people who need it
 * that it isn't for them. Ochre is an earth pigment: warm without being cosmetic. The
 * ground stays cool and the second hue stays jade, so the axis survives the change.
 *
 * Contrast was checked against the darkest ground, not the lightest: body text clears
 * 4.5:1 and captions clear 4.5:1 too, rather than being let off as "large text". */

const dark = {
  /* Ground */
  bg: '#0A0E11',
  bgDeep: '#05080A',
  /* Elevation by transparency, not by a lighter slab — slabs read as boxes stacked on
     boxes, which is the card-soup look. */
  surface: 'rgba(255,255,255,0.045)',
  surfaceStrong: 'rgba(255,255,255,0.075)',
  surfaceSolid: '#121A1F',
  line: 'rgba(255,255,255,0.10)',
  lineStrong: 'rgba(255,255,255,0.18)',

  /* Ink — warm off-white against the cool ground */
  ink: '#F4F1EC',        // 17:1
  inkSoft: '#AEB6BA',    // 9.5:1
  inkFaint: '#838C91',   // 5.9:1 — safe for captions

  /* Ochre: every action, every affordance. 7.1:1 on the ground. */
  accent: '#D98A4E',
  accentDeep: '#EDAE74',
  accentDim: 'rgba(217,138,78,0.15)',

  /* Jade: progress and the things that go the right way */
  cool: '#7FC0A4',
  coolDim: 'rgba(127,192,164,0.14)',

  /* Held well away from the accent hue so "hard day" never reads as another button. */
  warn: '#C9605A',
  onAccent: '#1B0E04',
  scrim: 'rgba(5,8,10,0.72)',
};

const light = {
  bg: '#F7F5F1',
  bgDeep: '#EFEBE4',
  surface: 'rgba(20,26,30,0.04)',
  surfaceStrong: 'rgba(20,26,30,0.07)',
  surfaceSolid: '#FFFFFF',
  line: 'rgba(20,26,30,0.10)',
  lineStrong: 'rgba(20,26,30,0.18)',

  ink: '#1A1D1F',        // 15:1
  inkSoft: '#565E62',    // 7:1
  inkFaint: '#6E777B',   // 5.1:1

  accent: '#96551F',
  accentDeep: '#7A4517',
  accentDim: 'rgba(150,85,31,0.10)',

  cool: '#33705A',
  coolDim: 'rgba(51,112,90,0.10)',

  warn: '#9C3A36',
  onAccent: '#FFFFFF',
  scrim: 'rgba(247,245,241,0.72)',
};

export const palette = { dark, light };
export type Palette = typeof dark;

/* Type — serif display against system sans body.
 *
 * Two families, paired on a genuine contrast axis rather than two sans-serifs that are
 * almost-but-not-quite the same. Georgia ships on every target platform, so there is no
 * font file to load and nothing to fetch at runtime. */
const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: "Georgia, 'Times New Roman', serif",
});

const sans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
});

export const fonts = { serif, sans };

/* Letter-spacing on display sizes stays at or above -0.03em. Tighter than that and the
   letterforms touch, which reads as cramped rather than designed. */
export const type = {
  /* The reclaimed-hours number. The largest thing in the app, and well under the
     shouting threshold. */
  hero: { fontFamily: serif, fontSize: 68, fontWeight: '400' as const, letterSpacing: -1.6, lineHeight: 72 },
  display: { fontFamily: serif, fontSize: 40, fontWeight: '400' as const, letterSpacing: -0.9, lineHeight: 46 },
  h1: { fontFamily: serif, fontSize: 30, fontWeight: '400' as const, letterSpacing: -0.6, lineHeight: 37 },
  h2: { fontFamily: serif, fontSize: 22, fontWeight: '400' as const, letterSpacing: -0.3, lineHeight: 29 },

  h3: { fontFamily: sans, fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 22 },
  body: { fontFamily: sans, fontSize: 16, fontWeight: '400' as const, lineHeight: 25 },
  bodySm: { fontFamily: sans, fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontFamily: sans, fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 18 },
  caption: { fontFamily: sans, fontSize: 12.5, fontWeight: '400' as const, lineHeight: 17 },
  /* Tabular figures for timers so digits do not jitter as they count. */
  timer: { fontFamily: serif, fontSize: 56, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 62 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

/* Cards top out at 16. The hero canvas is a full-bleed scene rather than a card, so it
   carries slightly more. Anything above that starts to read as a toy. */
export const radius = { sm: 8, md: 12, card: 16, scene: 20, sheet: 24, pill: 999 };

export const motion = { fast: 180, base: 260, slow: 380 };

export const LAYOUT_MAX_WIDTH = 460;
export const TAB_BAR_HEIGHT = 62;

/* Atmosphere presets.
 *
 * Keyed to time of day, never to the user's numbers. Tying the visual mood to how well
 * someone is doing would turn the background into a score, and a score is the one thing
 * this app does not do.
 *
 * Every ramp runs mineral — slate, rust, ochre, teal, pine. The rose and mauve midtones
 * an earlier pass had in dawn and dusk were doing the same gendering work the peach
 * accent was: pretty, and pointed at one half of the people who need this. */
export type AtmosphereKey = 'dawn' | 'day' | 'dusk' | 'night' | 'ember' | 'jade';

export const ATMOSPHERES: Record<AtmosphereKey, string[]> = {
  dawn: ['#1E2833', '#33404E', '#6F6047', '#C29051'],
  day: ['#1B2A33', '#2E4753', '#4E7A80', '#86AFA6'],
  dusk: ['#161A24', '#2C2E3C', '#5A3F38', '#A86A4C'],
  night: ['#070A0E', '#101822', '#1B2A38', '#2D4152'],
  ember: ['#140D0A', '#33190F', '#6B3520', '#C86A3C'],
  jade: ['#08110E', '#12251C', '#1F4433', '#3E7C5C'],
};

export function atmosphereForHour(h = new Date().getHours()): AtmosphereKey {
  if (h < 5) return 'night';
  if (h < 9) return 'dawn';
  if (h < 17) return 'day';
  if (h < 21) return 'dusk';
  return 'night';
}
