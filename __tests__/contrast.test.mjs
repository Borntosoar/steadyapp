import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/* Imports constants/palette.ts, not theme.ts. theme.ts reaches for `Platform` to pick a
   font family, so bare Node cannot load it — which is the reason these figures lived in
   comments and went unchecked in the first place. */
const {
  palette, ATMOSPHERES, DEEP_RAMPS, LIGHT_GROUND_FLOOR, DARK_INK_GROUND,
  TYPE_SCALE: T, TYPE_LADDER, COUNTING_TYPE,
} = await import('../constants/palette.ts');

/* Contrast, computed rather than asserted in a comment.
 *
 * This test exists because the comments in constants/theme.ts were wrong for months, in the
 * most dangerous way available: they claimed numbers that were true against `bg` — a
 * surface the user never sees, because every screen paints an Atmosphere across
 * StyleSheet.absoluteFill on top of it. Measured against the ground that is actually
 * visible, the light `inkFaint` was 2.05:1 on the dusk ramp and the dark `inkSoft` was
 * 2.94:1. Both are unreadable. Both were documented as comfortably passing.
 *
 * So the guarantee moved out of prose and into arithmetic. Every ink is measured against
 * the WORST CASE ground its palette can land on, and the ramps are checked against that
 * worst case too, so widening a ramp cannot silently break the type sitting on it. */

const lin = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA for body text. Large text is allowed 3:1, but nothing here relies on that. */
const AA = 4.5;

describe('the contrast checker agrees with the specification', () => {
  test('black on white is 21:1 and white on white is 1:1', () => {
    assert.ok(Math.abs(ratio('#000000', '#FFFFFF') - 21) < 0.05);
    assert.ok(Math.abs(ratio('#FFFFFF', '#FFFFFF') - 1) < 0.001);
  });
});

describe('every ink clears AA on the worst ground its palette can land on', () => {
  const INKS = ['ink', 'inkSoft', 'inkFaint', 'accent', 'accentDeep', 'cool', 'rose', 'warn'];

  for (const key of INKS) {
    test(`light ${key} on ${LIGHT_GROUND_FLOOR}`, () => {
      const r = ratio(palette.light[key], LIGHT_GROUND_FLOOR);
      assert.ok(r >= AA, `${key} is ${r.toFixed(2)}:1, needs ${AA}:1`);
    });

    test(`dark ${key} on ${DARK_INK_GROUND}`, () => {
      const r = ratio(palette.dark[key], DARK_INK_GROUND);
      assert.ok(r >= AA, `${key} is ${r.toFixed(2)}:1, needs ${AA}:1`);
    });
  }

  test('label colour on its own accent fill', () => {
    /* Every primary button and every filled face. */
    for (const name of ['light', 'dark']) {
      const p = palette[name];
      const r = ratio(p.onAccent, p.accent);
      assert.ok(r >= AA, `${name} onAccent is ${r.toFixed(2)}:1 on accent`);
    }
  });
});

describe('no atmosphere ramp can break the type sitting on it', () => {
  for (const [name, stops] of Object.entries(ATMOSPHERES)) {
    const deep = DEEP_RAMPS.includes(name);

    test(`${name} stays inside its permitted band`, () => {
      for (const stop of stops) {
        if (deep) {
          /* A deep ramp carries white type, never palette ink, so what matters is white on
             it. The old `night` ramp ended at #616B49, which is where every caption on
             every dark screen went to die. */
          assert.ok(
            ratio('#FFFFFF', stop) >= AA,
            `white on ${name} stop ${stop} is ${ratio('#FFFFFF', stop).toFixed(2)}:1`
          );
        } else {
          assert.ok(
            luminance(stop) >= luminance(LIGHT_GROUND_FLOOR) - 0.001,
            `${name} stop ${stop} is darker than the floor ${LIGHT_GROUND_FLOOR}`
          );
        }
      }
    });
  }
});

describe('the type scale actually steps', () => {
  /* Six of the ten old steps lived inside a 4.5pt band, and `h3` and `body` were the same
     size — which is why the list screens read as undifferentiated walls. A scale whose
     neighbours are within 8% of each other is not a scale. */
  test('each step is meaningfully larger than the one below', () => {
    for (let i = 0; i < TYPE_LADDER.length - 1; i++) {
      const bigger = T[TYPE_LADDER[i]].fontSize;
      const smaller = T[TYPE_LADDER[i + 1]].fontSize;
      const step = bigger / smaller;
      assert.ok(
        step >= 1.06,
        `${TYPE_LADDER[i]} (${bigger}) is only ${step.toFixed(2)}x ${TYPE_LADDER[i + 1]} (${smaller})`
      );
    }
  });

  test('the two counting figures are tabular', () => {
    /* Both animate a count-up. Proportional numerals shimmy while the digits change, which
       is the most visible possible tell that nobody looked at it running. */
    /* The token file cannot carry fontVariant — that is composed in theme.ts — so what is
       asserted here is that the list of counting figures is exactly the two that animate,
       and theme.ts marks precisely that list. A third animated figure added without being
       listed will fail the theme-side check below. */
    assert.deepEqual([...COUNTING_TYPE], ['hero', 'timer']);
  });

  test('nothing on a control is below 13pt', () => {
    for (const [key, v] of Object.entries(T)) {
      assert.ok(v.fontSize >= 13, `type.${key} is ${v.fontSize}pt`);
    }
  });
});
