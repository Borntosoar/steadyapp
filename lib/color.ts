/* Colour arithmetic, in one place, because the app has now had the same class of bug twice.
 *
 * WHY THIS FILE EXISTS. constants/palette.ts opens by saying that the contrast guarantees
 * "were asserted in comments instead, and they were wrong, by a factor of four in places, for
 * months". The fix was to compute them in a test — and then the computation itself drifted:
 * __tests__/motif.test.mjs composited a decorative layer under a pill, got one `rgba()` parse
 * wrong, and the whole motif term fell out of the arithmetic. It asserted 15.44 >= 4.5 twenty
 * times per run, green, for as long as it has existed, while the screens it was written to
 * protect moved onto brighter grounds.
 *
 * Two test files needed the same four functions and each had its own copy. Now there is one,
 * and it is exercised by its own unit tests rather than only by its callers.
 *
 * WCAG 2.x relative luminance and contrast ratio, and sRGB source-over compositing. No React
 * Native imports — the suite loads this under bare Node, and nothing here needs a renderer. */

export type RGB = [number, number, number];

/** sRGB channel (0–255) to linear light. */
const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** Parse `#rgb`, `#rrggbb`, `rgb(r,g,b)` or `rgba(r,g,b,a)`.
 *
 *  Returns the colour AND its alpha, because separating those is exactly what went wrong
 *  last time: a caller that assumes hex gets alpha 1 and silently discards whatever it was
 *  compositing over. */
export function parse(input: string): { rgb: RGB; alpha: number } {
  const s = input.trim();

  const fn = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)$/i);
  if (fn) {
    return {
      rgb: [Number(fn[1]), Number(fn[2]), Number(fn[3])],
      alpha: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }

  const h = s.replace('#', '');
  if (h.length === 3) {
    const [r, g, b] = [...h].map((c) => parseInt(c + c, 16));
    return { rgb: [r, g, b], alpha: 1 };
  }
  if (h.length === 6 || h.length === 8) {
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
    const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { rgb, alpha };
  }

  throw new Error(`colour not understood: ${input}`);
}

export const luminance = (rgb: RGB): number =>
  0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

/** WCAG contrast ratio, 1–21. Order-independent. */
export function ratio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Source-over: `fg` at `alpha` composited onto opaque `bg`. */
export const over = (fg: RGB, alpha: number, bg: RGB): RGB =>
  fg.map((ch, i) => ch * alpha + bg[i] * (1 - alpha)) as RGB;

/** Composite a stack of layers, back to front, onto an opaque base.
 *
 *  This is the function the tests actually need: a screen is a ground, then maybe a motif,
 *  then maybe a card, then maybe a container opacity — and every bug so far has come from
 *  modelling three of those four. */
export function stack(base: string, layers: Array<string | { color: string; alpha?: number }>): RGB {
  let out = parse(base).rgb;
  for (const layer of layers) {
    const spec = typeof layer === 'string' ? { color: layer } : layer;
    const { rgb, alpha } = parse(spec.color);
    const a = spec.alpha === undefined ? alpha : alpha * spec.alpha;
    out = over(rgb, a, out);
  }
  return out;
}

/** Contrast of `fg` (drawn at `fgAlpha`) against a composited stack.
 *
 *  `fgAlpha` matters because React Native's `opacity` on a CONTAINER composites the text and
 *  its own card together against what is behind — which collapses the two toward each other.
 *  Modelling text alpha as 1 is what made a 0.45-opacity row measure as if it were opaque. */
export function contrastOn(
  fg: string,
  base: string,
  layers: Array<string | { color: string; alpha?: number }> = [],
  fgAlpha = 1,
): number {
  const bg = stack(base, layers);
  const ink = parse(fg);
  return ratio(over(ink.rgb, ink.alpha * fgAlpha, bg), bg);
}

/** WCAG thresholds, named so call sites read as requirements rather than as magic numbers. */
export const AA_BODY = 4.5;
export const AA_LARGE = 3;
/** 1.4.11: borders, focus rings, chart strokes — anything that carries meaning as a shape. */
export const AA_NON_TEXT = 3;
