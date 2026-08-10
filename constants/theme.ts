import { Platform } from 'react-native';

/* Design tokens.
 *
 * THE BRIEF THIS ANSWERS: "no flow to it, it does not feel rewarding, lacks engagement,
 * too clinical." The previous palette was near-black with an ochre accent. It was
 * defensible and it was cold — it looked like an instrument, and somebody opening it after
 * a bad evening does not want an instrument.
 *
 * The direction is organic and frosted: sage and moss, warm sand, translucent cards
 * floating over soft botanical light. Nothing here reads as a medical device.
 *
 * LIGHT IS NOW THE DEFAULT, and that is a reversal worth explaining. The old argument was
 * that a bright white screen at 11pm is a small cruelty, and that is still true — which is
 * why the dark palette below is genuinely designed rather than an inversion, and why it
 * arrives automatically with the system theme at night. But most opens are not at 11pm.
 * Most are in the morning, deciding whether to leave the house, and meeting that moment
 * with a dark clinical slab was the actual mistake.
 *
 * Both palettes are sage. Neither is a tint of the other. */

/* ---------- light: morning, sage and sand ---------- */
const light = {
  /* Which way the glass tints, which tint BlurView gets, which artwork reads.
     Components branch on this rather than sniffing a hex value. */
  isDark: false as boolean,
  bg: '#EDF0E8',          // pale sage, warmer than any grey
  bgDeep: '#E2E7DB',
  /* Cards are translucent so the background reads through them. This is the frosted-glass
     look, and it is why the ground below has to be interesting rather than flat. */
  surface: 'rgba(255,255,255,0.58)',
  surfaceStrong: 'rgba(255,255,255,0.78)',
  surfaceSolid: '#F7F9F4',
  line: 'rgba(47,58,42,0.10)',
  lineStrong: 'rgba(47,58,42,0.20)',

  ink: '#242B20',         // deep moss, not black. 13.6:1 on bg
  inkSoft: '#4C5745',     // 7.3:1
  inkFaint: '#6B7663',    // 4.6:1 — still clears AA for small text

  /* Moss green carries every action. It is the colour of the reference and it is the one
     hue nobody reads as an alert. */
  accent: '#5A6E4A',
  accentDeep: '#435336',
  accentDim: 'rgba(90,110,74,0.14)',
  onAccent: '#F4F7F0',

  /* Warm clay for the things that went well. Complementary to the moss without shouting. */
  cool: '#A8734E',
  coolDim: 'rgba(168,115,78,0.14)',

  warn: '#A2503F',
  scrim: 'rgba(237,240,232,0.72)',
};

/* ---------- dark: night, moss and low light ---------- */
const dark = {
  isDark: true as boolean,
  bg: '#171C16',          // deep moss, not near-black
  bgDeep: '#101410',
  surface: 'rgba(255,255,255,0.07)',
  surfaceStrong: 'rgba(255,255,255,0.12)',
  surfaceSolid: '#1F261D',
  line: 'rgba(255,255,255,0.12)',
  lineStrong: 'rgba(255,255,255,0.22)',

  ink: '#EDF0E6',         // 14.5:1
  inkSoft: '#B4BEAA',     // 8.4:1
  inkFaint: '#8B9683',    // 5.1:1

  accent: '#A3C088',      // sage, lifted so it reads on the dark ground
  accentDeep: '#BFD6A8',
  accentDim: 'rgba(163,192,136,0.16)',
  onAccent: '#182015',

  cool: '#D9A277',
  coolDim: 'rgba(217,162,119,0.16)',

  warn: '#D2735E',
  scrim: 'rgba(16,20,16,0.72)',
};

export const palette = { light, dark };
export type Palette = typeof light;

/* Type.
 *
 * The reference sets its headlines in a heavy grotesque, not a serif. That is the single
 * biggest reason it reads friendly rather than editorial: a serif in a health app looks
 * like a pamphlet, a heavy sans looks like something made this decade. The serif is gone.
 *
 * System fonts on every platform, so nothing is fetched at runtime and nothing can fall
 * back silently to something that ruins the layout. */
const display = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
});

const sans = display;

export const fonts = { display, sans };

export const type = {
  /* The reclaimed-hours figure and the cost mirror. */
  hero: { fontFamily: display, fontSize: 60, fontWeight: '700' as const, letterSpacing: -2.2, lineHeight: 64 },
  /* "How are you feeling today?" — the reference's signature move is a big soft question
     that fills the top of the screen. */
  display: { fontFamily: display, fontSize: 38, fontWeight: '700' as const, letterSpacing: -1.2, lineHeight: 43 },
  h1: { fontFamily: display, fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.7, lineHeight: 34 },
  h2: { fontFamily: display, fontSize: 21, fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 27 },
  h3: { fontFamily: sans, fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 22 },
  body: { fontFamily: sans, fontSize: 16, fontWeight: '400' as const, lineHeight: 25 },
  bodySm: { fontFamily: sans, fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontFamily: sans, fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 18 },
  caption: { fontFamily: sans, fontSize: 12.5, fontWeight: '500' as const, lineHeight: 17 },
  timer: { fontFamily: display, fontSize: 56, fontWeight: '300' as const, letterSpacing: -1, lineHeight: 62 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

/* Rounder than before, because the reference is round and roundness is most of what makes
   an interface read as soft rather than instrumental. Cards at 24, the big frosted panels
   at 28, and anything tappable that is not a card is a full pill or a circle. */
export const radius = { sm: 10, md: 16, card: 24, scene: 28, sheet: 32, pill: 999 };

export const motion = { fast: 180, base: 260, slow: 420 };

export const LAYOUT_MAX_WIDTH = 460;
export const TAB_BAR_HEIGHT = 64;

/* Atmosphere presets — the light the frosted cards sit on.
 *
 * Keyed to time of day, never to the user's numbers. Tying the mood of the screen to how
 * well somebody is doing would turn the background into a score, and a score is the one
 * thing this app does not do.
 *
 * Botanical rather than mineral now: these read as light through leaves. */
export type AtmosphereKey = 'dawn' | 'day' | 'dusk' | 'night' | 'ember' | 'jade' | 'grove' | 'emberDeep';

export const ATMOSPHERES: Record<AtmosphereKey, string[]> = {
  /* Pale ramps. Ground for frosted cards and for screens that set type in ink. */
  dawn: ['#C9CFB4', '#DCD9BD', '#E8D9C0', '#F0E4CB'],
  day: ['#B9C9AE', '#CBD9BC', '#DDE7CD', '#EDF1DC'],
  dusk: ['#9FAE9A', '#B9B9A6', '#D0B79E', '#E0C7A9'],
  ember: ['#A8734E', '#C08D5F', '#D2A878', '#E3C39A'],
  jade: ['#7E9A78', '#94AC88', '#AFC29C', '#C9D6B4'],

  /* Deep ramps, for the full-frame exercise scenes only.
   *
   * Those scenes set white type directly on the artwork, so the ramp underneath it is a
   * contrast requirement rather than a mood choice — white on the pale ramps above lands
   * around 1.6:1 and is simply unreadable. Keeping the immersive scenes dark is also right
   * on its own terms: grounding and urge surfing are the two things somebody opens when
   * they are least able to cope with a bright screen. */
  night: ['#2A3328', '#39432F', '#4C563A', '#616B49'],
  grove: ['#16211A', '#22331F', '#2F4529', '#3E5735'],
  emberDeep: ['#241209', '#3D2011', '#5A3219', '#7A4823'],
};

export function atmosphereForHour(h = new Date().getHours()): AtmosphereKey {
  if (h < 5) return 'night';
  if (h < 10) return 'dawn';
  if (h < 17) return 'day';
  if (h < 21) return 'dusk';
  return 'night';
}

/* The same choice, clamped so the palette's ink can actually be read on it.
 *
 * `atmosphereForHour` alone is not safe wherever text sits directly on the atmosphere
 * rather than on a frosted card: dark ink on the `night` ramp at 11pm, or light ink on the
 * `day` ramp at 2pm, are both unreadable. On the dark palette the ground is always night;
 * on the light palette a night-time open gets `dusk`, which is the darkest of the pale
 * ramps and still clears contrast. */
export function atmosphereForScheme(isDark: boolean, h = new Date().getHours()): AtmosphereKey {
  if (isDark) return 'night';
  const k = atmosphereForHour(h);
  return k === 'night' ? 'dusk' : k;
}
