import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MOODS, groundFor, isDeep, scatter, MOTIF_MAX_OPACITY, STROKE } from '../lib/motif.ts';
import { SCENES } from '../content/curveball.ts';
import { palette, ATMOSPHERES } from '../constants/palette.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/* The per-scene ground.
 *
 * Most of what is checked here is contrast, dressed up as design. An atmosphere ramp is not
 * decoration in this app — text sits directly on it, and half the ramps are deep ones meant
 * for screens that set white type on the artwork. Handing the LIGHT palette a deep ramp
 * gives you near-black ink on a near-black ground, which no amount of taste recovers. */

describe('every mood is safe on both palettes', () => {
  for (const [mood, pair] of Object.entries(MOODS)) {
    test(`${mood} pairs a pale ramp with a deep one`, () => {
      assert.equal(isDeep(pair.light), false,
        `"${mood}" gives the light palette "${pair.light}", which is a deep ramp — dark ink ` +
        `on it is unreadable`);
      assert.equal(isDeep(pair.deep), true,
        `"${mood}" gives the dark palette "${pair.deep}", which is a pale ramp — light ink ` +
        `on it is unreadable`);
    });
  }

  test('groundFor picks by palette and never crosses over', () => {
    for (const mood of Object.keys(MOODS)) {
      assert.equal(isDeep(groundFor(mood, false)), false);
      assert.equal(isDeep(groundFor(mood, true)), true);
    }
  });

  test('no two moods resolve to the same ground on the light palette', () => {
    /* A mood that looks identical to another mood is a distinction the content declares and
       the screen cannot show. `evening` and `smallHours` were exactly that until midnight
       got its own ramp. The light palette is checked rather than the dark one because there
       are only three deep ramps for five moods, so collisions there are unavoidable and
       collisions here are a mistake. */
    const grounds = Object.keys(MOODS).map((m) => groundFor(m, false));
    assert.equal(new Set(grounds).size, grounds.length,
      `two moods share a light ground: ${grounds.join(', ')}`);
  });
});

describe('the ground is keyed to the scene and to nothing else', () => {
  test('every scene declares a mood and a motif', () => {
    for (const s of SCENES) {
      assert.ok(s.mood in MOODS, `scene "${s.id}" has mood "${s.mood}", which is not defined`);
      assert.ok(typeof s.motif === 'string' && s.motif, `scene "${s.id}" has no motif`);
    }
  });

  test('every motif a scene asks for is actually drawable', () => {
    /* The failure this prevents is silent: an unknown kind falls through the switch in
       components/Motif.tsx, returns undefined, and the scene renders with no wallpaper at
       all — which looks like a design choice rather than a bug. */
    const src = read('components/Motif.tsx');
    for (const s of SCENES) {
      assert.ok(src.includes(`case '${s.motif}':`),
        `scene "${s.id}" asks for the "${s.motif}" motif and Motif.tsx cannot draw it`);
    }
  });

  test('no motif kind is declared and then left undrawn', () => {
    /* Parsed from the MotifKind block specifically, not from every `| 'x'` line in the
       file — SceneMood is declared the same way a few lines above, and a pattern loose
       enough to catch both would also have missed the last member of each, which carries
       the terminating semicolon. That is exactly how this test failed the first time. */
    const src = read('lib/motif.ts');
    const block = src.slice(src.indexOf('export type MotifKind ='));
    const kinds = [...block.slice(0, block.indexOf(';')).matchAll(/'(\w+)'/g)].map((m) => m[1]);
    assert.ok(kinds.length >= 5, 'the MotifKind union is no longer readable by this test');
    const drawable = [...read('components/Motif.tsx').matchAll(/case '(\w+)':/g)].map((m) => m[1]);
    for (const k of drawable) {
      assert.ok(kinds.includes(k), `Motif.tsx draws "${k}", which lib/motif.ts does not declare`);
    }
  });

  test('the ground never reads anything about how the player is doing', () => {
    /* components/Atmosphere.tsx states the rule: a background that changes with a score is
       a mood ring, and a mood ring is a rating with better manners. The scene's ground is
       chosen from the scene, so the only argument `groundFor` may ever take from the game
       screen is `scene.mood`. */
    const src = read('app/game/curveball.tsx');
    const calls = [...src.matchAll(/groundFor\(([^)]*)\)/g)].map((m) => m[1]);
    assert.ok(calls.length > 0, 'the game no longer sets a ground');
    for (const args of calls) {
      assert.match(args, /^scene\.mood,\s*c\.isDark$/,
        `groundFor is called with "${args}" — it may only be given the scene's own mood`);
    }
    assert.doesNotMatch(src, /motif=\{[^}]*tally/,
      'the wallpaper is being chosen from the score');
  });
});

describe('the scatter is stable, spread and in bounds', () => {
  const GRID = [5, 10];

  test('the same scene lays out identically every time', () => {
    assert.deepEqual(scatter('partner-gone-quiet', ...GRID), scatter('partner-gone-quiet', ...GRID));
  });

  test('different scenes lay out differently', () => {
    assert.notDeepEqual(scatter('partner-gone-quiet', ...GRID), scatter('morning-dread', ...GRID));
  });

  test('nothing lands outside the field', () => {
    for (const s of SCENES) {
      for (const d of scatter(s.id, ...GRID)) {
        assert.ok(d.x >= 0 && d.x <= 1, `x out of bounds: ${d.x}`);
        assert.ok(d.y >= 0 && d.y <= 1, `y out of bounds: ${d.y}`);
        assert.ok(d.scale > 0.5 && d.scale < 1.5, `implausible scale: ${d.scale}`);
      }
    }
  });

  test('nothing is tilted, because the game\'s tell is a 2.4 degree tilt', () => {
    /* The scatter used to spread each mark over ±25°, which is a rod-and-frame illusion
       aimed at the exact discrimination Curveball trains. This is the guard on the fix. */
    for (const s of SCENES) {
      for (const d of scatter(s.id, ...GRID)) {
        assert.equal(d.rotate, 0,
          'a tilted wallpaper biases perceived vertical against the distortion tell');
      }
    }
  });

  test('coverage is even rather than clumped', () => {
    /* The jittered grid exists so the motif does not pile three marks in one corner and
       leave a bare quarter. Checking the quadrant counts is the cheapest way to notice if
       someone swaps it back for free placement. */
    const dots = scatter('one-piece-of-feedback', ...GRID);
    const q = [0, 0, 0, 0];
    for (const d of dots) q[(d.x < 0.5 ? 0 : 1) + (d.y < 0.5 ? 0 : 2)] += 1;
    for (const n of q) {
      assert.ok(n >= dots.length / 8, `a quadrant holds only ${n} of ${dots.length} marks`);
    }
  });

  test('jitter is wide enough that rows can overlap', () => {
    /* Banding, stated as arithmetic. If a mark can only move across less than the full cell,
       no mark in one row can ever sit level with one from the row above, and the grid stays
       visible as horizontal stripes of glyphs. */
    const dots = scatter('room-goes-quiet', ...GRID);
    const rows = new Map();
    for (const d of dots) {
      const band = Math.floor(d.y * GRID[1]);
      const r = rows.get(band) ?? [1, 0];
      rows.set(band, [Math.min(r[0], d.y), Math.max(r[1], d.y)]);
    }
    const spans = [...rows.values()];
    const reach = Math.max(...spans.map(([lo, hi]) => hi - lo));
    assert.ok(reach > 0.6 / GRID[1],
      'jitter is narrower than the row pitch, so the scatter will read as bands');
  });
});

/* ---------- contrast, computed ----------
 *
 * The reason this arithmetic is here rather than in a comment is the same reason
 * __tests__/contrast.test.mjs exists: this exact figure was wrong and looked fine. Adding a
 * per-scene ground put the game on the `emberDeep` and `grove` ramps, which reach far
 * brighter than the `night` ramp it used before — and the thought pill's fill was
 * `surfaceStrong`, 0.17 alpha on the dark palette. Body ink over that pill measured 4.36:1
 * on the brightest tender stop, and 3.65:1 where a motif stroke crossed it. */

const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const hex = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const rgba = (s) => {
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  return m ? [[+m[1], +m[2], +m[3]], m[4] === undefined ? 1 : +m[4]] : [hex(s), 1];
};
const over = (fg, a, bg) => fg.map((ch, i) => ch * a + bg[i] * (1 - a));

describe('a thought is readable on every ground the game can put it on', () => {
  /** AA for body text. `t.body` is 16px/400, so the large-text allowance does not apply. */
  const AA = 4.5;

  for (const isDark of [false, true]) {
    const p = isDark ? palette.dark : palette.light;
    const [pillRGB, pillA] = rgba(p.surfaceSolid);
    const ink = hex(p.ink);
    const ceiling = isDark ? MOTIF_MAX_OPACITY.dark : MOTIF_MAX_OPACITY.light;

    for (const mood of Object.keys(MOODS)) {
      const ramp = groundFor(mood, isDark);
      test(`${isDark ? 'dark' : 'light'} · ${mood} · ${ramp}`, () => {
        for (const stop of ATMOSPHERES[ramp]) {
          const bg = hex(stop);
          /* Worst case: a motif stroke at full ceiling directly under the pill. */
          const painted = over(ink, ceiling, bg);
          const pill = over(pillRGB, pillA, painted);
          const r = ratio(ink, pill);
          assert.ok(r >= AA,
            `body ink on a thought pill over ${ramp} ${stop} is ${r.toFixed(2)}:1, under ${AA}`);
        }
      });
    }
  }
});

describe('the wallpaper stays wallpaper', () => {
  test('the opacity ceilings are low enough to read a thought through', () => {
    for (const [k, v] of Object.entries(MOTIF_MAX_OPACITY)) {
      assert.ok(v <= 0.12, `${k} ceiling ${v} stops being a ground and competes with the pills`);
      assert.ok(v > 0, `${k} ceiling is zero, so there is no wallpaper at all`);
    }
  });

  test('dark is quieter than light, because a fixed alpha is not a fixed weight', () => {
    /* Ink at a given alpha lands further from a dark ground than from a pale one, so the
       same constant reads roughly half again as heavy in dark mode. */
    assert.ok(MOTIF_MAX_OPACITY.dark < MOTIF_MAX_OPACITY.light);
  });

  test('every motif kind has a normalised stroke weight', () => {
    const src = read('lib/motif.ts');
    const block = src.slice(src.indexOf('export type MotifKind ='));
    const kinds = [...block.slice(0, block.indexOf(';')).matchAll(/'(\w+)'/g)].map((m) => m[1]);
    for (const k of kinds) {
      assert.ok(typeof STROKE[k] === 'number', `"${k}" has no stroke weight`);
    }
    /* `rings` is two full circles and `moons` is one crescent — roughly twice the ink at a
       shared width, which made two scenes visibly busier than two others at one opacity. */
    assert.ok(STROKE.rings < STROKE.moons,
      'the heaviest glyph is not drawn thinner than the lightest, so weights are unequal');
  });

  test('the component clamps rather than trusting its caller', () => {
    assert.match(read('components/Motif.tsx'), /Math\.min\(opacity \?\? ceiling, ceiling\)/);
  });

  test('the marks are smaller than the type they sit behind', () => {
    /* Texture reads as ground when the mark is at or under the x-height of the type in front
       of it. At SIZE 34 the marks were up to 44pt against a body cap height near 11 — icons
       scattered on a screen rather than a wallpaper. */
    const size = Number(read('components/Motif.tsx').match(/const SIZE = (\d+)/)[1]);
    assert.ok(size <= 24, `SIZE ${size} draws marks larger than the sentences they sit behind`);
  });

  test('the motif is hidden from screen readers', () => {
    const src = read('components/Motif.tsx');
    assert.match(src, /accessibilityElementsHidden/);
    assert.match(src, /importantForAccessibility="no-hide-descendants"/);
  });

  test('the wallpaper does not move', () => {
    /* Curveball's whole tell is motion. A drifting background competes for the one channel
       the game teaches you to read, so the motif is static and this is the guard on it. */
    const src = read('components/Motif.tsx');
    assert.doesNotMatch(src, /Animated|requestAnimationFrame|setInterval/,
      'the motif animates, which steals the channel carrying the distortion tell');
  });

  test('the game draws its own ground rather than an opaque Screen over it', () => {
    /* The defect this locks out shipped once already: `Screen` paints backgroundColor over
       the full frame, so an Atmosphere behind it was built, rasterised and then completely
       covered on every frame. The game uses a transparent Stage instead. */
    const src = read('app/game/curveball.tsx');
    assert.doesNotMatch(src, /<Screen\b/,
      'Screen paints an opaque background and will hide the scene ground');
    assert.match(src, /<Atmosphere[\s\S]{0,200}variant=\{ground\}/);
  });

  test('the atmosphere is positioned, or it collapses to nothing', () => {
    /* Also shipped once. Atmosphere does not position itself — as a plain flex child at the
       top of a column it takes no height and the ground silently does not exist. Ground in
       components/frost.tsx passes the same two props for the same two reasons. */
    const src = read('app/game/curveball.tsx');
    const tag = src.slice(src.indexOf('<Atmosphere'), src.indexOf('<Motif'));
    assert.match(tag, /absoluteFill/, 'the atmosphere has no fill and will render at zero height');
    assert.match(tag, /scrim=\{false\}/, 'the scrim will darken a ramp this screen sets ink on');
  });

  test('the motif places its marks in measured pixels, not percentages', () => {
    /* react-native-svg's `G` takes numbers for a transform. Percentage strings resolve to
       zero, which stacked all twenty-eight marks in the top-left corner and rendered as one
       heart in the margin — the kind of wrong that looks intentional. */
    const src = read('components/Motif.tsx');
    assert.doesNotMatch(src, /<G[^>]*\bx=\{`\$\{[^}]*\}%`\}/,
      'the motif is positioning a group with percentages, which silently resolves to zero');
    assert.match(src, /translate\(\$\{\([^)]*d\.x[^)]*\)\.toFixed/,
      'marks are no longer placed from the measured box');
  });

  test('whole marks stay inside the frame', () => {
    /* Half a glyph sliced off by the screen edge reads as a bug; a pattern bleeding
       deliberately off all four edges would read as a pattern. This picks the first, so the
       placement is inset on both axes rather than spanning the raw width. */
    const src = read('components/Motif.tsx');
    assert.match(src, /const spanX = Math\.max\(0, box\.w - inset \* 2\)/);
    assert.match(src, /inset \+ d\.x \* spanX/);
  });

  test('the header strip is reserved so nothing crosses the step pips', () => {
    assert.match(read('app/game/curveball.tsx'), /<Motif[\s\S]{0,240}insetTop=\{\d+\}/,
      'the motif runs under the back button and the pips, which are the only state on screen');
  });
});
