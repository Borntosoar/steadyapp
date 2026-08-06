/* Design tokens. Calm, premium, non-clinical.
 *
 * Dark mode exists from day one deliberately: appearance distress peaks at night, and a
 * blinding white screen at 2am is a small cruelty. */

export const palette = {
  light: {
    bg: '#FAF8F4',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F0EA',
    ink: '#232220',
    inkSoft: '#635E56',
    inkFaint: '#8E887E',
    line: '#E8E2D8',
    accent: '#6F8F7A',
    accentDeep: '#54705F',
    accentPale: '#EBF1EC',
    warn: '#B87A5C',
    positive: '#4B8161',
  },
  dark: {
    bg: '#16171A',
    surface: '#1E2024',
    surfaceAlt: '#25282D',
    ink: '#ECEAE5',
    inkSoft: '#A8A49C',
    inkFaint: '#7C7871',
    line: '#2E3238',
    accent: '#89AC96',
    accentDeep: '#A5C4B0',
    accentPale: '#232B26',
    warn: '#D09374',
    positive: '#7FB795',
  },
};

export type Palette = typeof palette.light;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
};

export const type = {
  display: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.2, lineHeight: 46 },
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 23 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 25 },
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 17 },
  /** The reclaimed-hours number. Deliberately the largest text in the app. */
  hero: { fontSize: 64, fontWeight: '700' as const, letterSpacing: -2.5, lineHeight: 68 },
};

/** Motion: 200–300ms ease-out, no bounce. Springy UI reads as playful, which is the
 *  wrong register for someone opening this while distressed. */
export const motion = {
  fast: 200,
  base: 260,
  slow: 300,
};

/** Phone-width column, centred on desktop. */
export const LAYOUT_MAX_WIDTH = 460;
