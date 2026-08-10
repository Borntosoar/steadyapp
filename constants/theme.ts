import { Platform } from 'react-native';

/* Design tokens.
 *
 * THE BRIEF THIS ANSWERS: make it elegant, make somebody want to open it, and stop the
 * palette lying about its own contrast.
 *
 * The direction is unchanged — sage and moss, frosted panels over soft light, nothing that
 * reads as a medical device — but three things were wrong and one of them was shipping as
 * an accessibility failure.
 *
 * 1. THE CONTRAST FIGURES IN THIS FILE WERE MEASURED AGAINST A SURFACE NOBODY SEES.
 *    `bg` is painted, and then `Atmosphere` is drawn across `StyleSheet.absoluteFill` on
 *    top of it on every screen. The real ground is the atmosphere ramp, which is far darker
 *    in light mode and far lighter in dark mode. Measured properly, the old `inkFaint` was
 *    2.05:1 on the dusk ramp and the old dark `inkSoft` was 2.94:1 — both unreadable, both
 *    documented as passing. Every ratio below is measured against LIGHT_GROUND_FLOOR and
 *    DARK_GROUND_CEILING, which are the worst case each palette can actually land on, and
 *    __tests__/contrast.test.mjs recomputes all of them. Comments cannot be trusted to hold
 *    a guarantee for eighteen months. A test can.
 *
 * 2. IT WAS MONOCHROME IN THE WORST THIRD OF THE HUE. Ground, cards, accent and ink all sat
 *    within about thirty degrees of hue 95, at mid value and mid chroma. That specific
 *    region reads as institutional. Premium sage lives at the extremes — near-white with a
 *    green cast, or genuinely deep — and the middle is where it looks accidental. The
 *    grounds have moved to the light end and the ink to the dark end, so the range between
 *    them roughly doubled, and the ramps now travel green to warm sand so the screen has a
 *    temperature axis rather than one hue at four brightnesses.
 *
 * 3. THERE WERE NO SHADOW TOKENS AT ALL. Not one. That is why every screen read as outlined
 *    rectangles on a coloured field rather than objects sitting in a space. `elevation`
 *    below is the fix, and the shadow is green-black rather than black: a black shadow on a
 *    green ground goes grey and dirty. */

export {
  palette,
  ATMOSPHERES,
  DEEP_RAMPS,
  LIGHT_GROUND_FLOOR,
  DARK_GROUND_CEILING,
  type Palette,
  type AtmosphereKey,
} from './palette';

import { TYPE_SCALE, type AtmosphereKey } from './palette';

/* ---------- elevation ----------
 *
 * The thing this file was missing entirely. Without it a card is an outline, and an outline
 * does not sit anywhere — it is drawn on the same plane as the background, so the frosted
 * glass has nothing to be in front of.
 *
 * Green-black, never pure black: black over a green ground desaturates into grey and reads
 * as dirt. On the dark palette shadows do nothing at all, so depth there comes from
 * `surfaceStrong` plus the `TopEdge` hairline instead. */
export const elevation = {
  rest: {
    shadowColor: '#2A3524',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#2A3524',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  lift: {
    shadowColor: '#2A3524',
    shadowOpacity: 0.16,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
};

/* Type.
 *
 * The old scale had ten steps and six of them lived inside a 4.5pt band — 12.5, 13, 14, 16,
 * 16, 17. All the resolution was at the bottom where nobody can see it, and `h3` and `body`
 * were the same size, which is precisely why the list screens read as walls. The ratios now
 * step cleanly and the top of the scale got bigger, because the one genuinely distinctive
 * number in this product deserves to be the largest thing on its screen.
 *
 * System fonts on every platform, so nothing is fetched at runtime and nothing can fall
 * back silently to something that ruins the layout. SF Pro Display at 64/-2.6 is an
 * excellent grotesque and it is what the reference is imitating. */
const display = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
});

const sans = display;

export const fonts = { display, sans };

/* Composed from TYPE_SCALE in ./palette, which holds the sizes with no platform import so
   they can be tested. Only the families are added here. */
const step = (k: keyof typeof TYPE_SCALE, family: string | undefined, tabular = false) => ({
  fontFamily: family,
  fontSize: TYPE_SCALE[k].fontSize,
  lineHeight: TYPE_SCALE[k].lineHeight,
  letterSpacing: TYPE_SCALE[k].letterSpacing,
  fontWeight: TYPE_SCALE[k].weight as '300' | '400' | '500' | '600' | '700',
  ...(tabular ? { fontVariant: ['tabular-nums'] as ['tabular-nums'] } : {}),
});

export const type = {
  /* tabular-nums lives in the token rather than at the call site, or the figure shimmies
     the moment it counts up. */
  hero: step('hero', display, true),
  display: step('display', display),
  h1: step('h1', display),
  h2: step('h2', display),
  h3: step('h3', sans),
  body: step('body', sans),
  /** Long-form module prose only. */
  read: step('read', sans),
  bodySm: step('bodySm', sans),
  label: step('label', sans),
  caption: step('caption', sans),
  timer: step('timer', display, true),
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

/* Rounder than before, because the reference is round and roundness is most of what makes
   an interface read as soft rather than instrumental. */
export const radius = { sm: 10, md: 16, card: 24, scene: 28, sheet: 32, pill: 999 };

export const motion = { fast: 180, base: 260, slow: 420 };

export const LAYOUT_MAX_WIDTH = 460;
/** Reading measure for module prose. Narrower than the app's column on purpose. */
export const READ_MAX_WIDTH = 380;
export const TAB_BAR_HEIGHT = 64;

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
