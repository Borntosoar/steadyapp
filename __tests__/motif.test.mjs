import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MOODS, groundFor, isDeep, scatter, MOTIF_MAX_OPACITY } from '../lib/motif.ts';
import { SCENES } from '../content/curveball.ts';

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
  test('the same scene lays out identically every time', () => {
    assert.deepEqual(scatter('partner-gone-quiet'), scatter('partner-gone-quiet'));
  });

  test('different scenes lay out differently', () => {
    assert.notDeepEqual(scatter('partner-gone-quiet'), scatter('morning-dread'));
  });

  test('nothing lands outside the field', () => {
    for (const s of SCENES) {
      for (const d of scatter(s.id)) {
        assert.ok(d.x >= 0 && d.x <= 1, `x out of bounds: ${d.x}`);
        assert.ok(d.y >= 0 && d.y <= 1, `y out of bounds: ${d.y}`);
        assert.ok(d.scale > 0.5 && d.scale < 1.5, `implausible scale: ${d.scale}`);
      }
    }
  });

  test('coverage is even rather than clumped', () => {
    /* The jittered grid exists so the motif does not pile three marks in one corner and
       leave a bare quarter. Checking the quadrant counts is the cheapest way to notice if
       someone swaps it back for free placement. */
    const dots = scatter('one-piece-of-feedback');
    const q = [0, 0, 0, 0];
    for (const d of dots) q[(d.x < 0.5 ? 0 : 1) + (d.y < 0.5 ? 0 : 2)] += 1;
    for (const n of q) {
      assert.ok(n >= dots.length / 8, `a quadrant holds only ${n} of ${dots.length} marks`);
    }
  });
});

describe('the wallpaper stays wallpaper', () => {
  test('the opacity ceiling is low enough to read a thought through', () => {
    assert.ok(MOTIF_MAX_OPACITY <= 0.12,
      'above about 12% the motif stops being a ground and starts competing with the pills ' +
      'that sit on it');
  });

  test('the component clamps rather than trusting its caller', () => {
    assert.match(read('components/Motif.tsx'), /Math\.min\(\s*opacity,\s*MOTIF_MAX_OPACITY\s*\)/);
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
    assert.match(src, /translate\(\$\{\(d\.x \* box\.w\)/);
  });
});
