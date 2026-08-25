import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parse, luminance, ratio, over, stack, contrastOn, AA_BODY, AA_NON_TEXT,
} from '../lib/color.ts';

/* The compositor, checked against known values.
 *
 * This file exists because the last version of this arithmetic lived inside a test, got one
 * `rgba()` parse wrong, and silently stopped measuring anything for as long as it existed.
 * A helper that decides whether the app is legible is not allowed to be the one thing nobody
 * verifies. Every expected number below comes from the WCAG 2.x definitions rather than from
 * running this code and writing down what it said. */

describe('parse understands every colour form the palette uses', () => {
  test('six-digit hex', () => {
    assert.deepEqual(parse('#FFFFFF'), { rgb: [255, 255, 255], alpha: 1 });
    assert.deepEqual(parse('#000000'), { rgb: [0, 0, 0], alpha: 1 });
    assert.deepEqual(parse('#1E241B'), { rgb: [30, 36, 27], alpha: 1 });
  });

  test('three-digit hex expands', () => {
    assert.deepEqual(parse('#FFF'), { rgb: [255, 255, 255], alpha: 1 });
    assert.deepEqual(parse('#08F'), { rgb: [0, 136, 255], alpha: 1 });
  });

  test('rgb() and rgba()', () => {
    assert.deepEqual(parse('rgb(10, 20, 30)'), { rgb: [10, 20, 30], alpha: 1 });
    assert.deepEqual(parse('rgba(226,238,212,0.10)'), { rgb: [226, 238, 212], alpha: 0.1 });
  });

  test('AND IT RETURNS THE ALPHA — which is the whole reason this is a shared function', () => {
    /* The bug: a parser that fell back to alpha 1 for anything it did not recognise, so a
       translucent layer composited as opaque and whatever was under it was discarded. */
    assert.equal(parse('rgba(8,11,6,0.40)').alpha, 0.4);
    assert.equal(parse('rgba(255,253,247,0.72)').alpha, 0.72);
    assert.equal(parse('#FDFCF6').alpha, 1);
  });

  test('it throws on nonsense rather than guessing', () => {
    /* Guessing is what produced a silent 15.44:1. */
    assert.throws(() => parse('sage'));
    assert.throws(() => parse('#12345'));
    assert.throws(() => parse(''));
  });
});

describe('luminance matches the WCAG definition at known points', () => {
  test('black is 0 and white is 1', () => {
    assert.equal(luminance([0, 0, 0]), 0);
    assert.ok(Math.abs(luminance([255, 255, 255]) - 1) < 1e-9);
  });

  test('the primaries carry their stated coefficients', () => {
    assert.ok(Math.abs(luminance([255, 0, 0]) - 0.2126) < 1e-9);
    assert.ok(Math.abs(luminance([0, 255, 0]) - 0.7152) < 1e-9);
    assert.ok(Math.abs(luminance([0, 0, 255]) - 0.0722) < 1e-9);
  });

  test('the linearisation knee is applied below 0.03928', () => {
    /* 8/255 = 0.0314, under the knee, so it uses the /12.92 branch. */
    const expected = (8 / 255) / 12.92;
    assert.ok(Math.abs(luminance([8, 8, 8]) - expected) < 1e-9);
  });
});

describe('ratio matches the WCAG definition', () => {
  test('black on white is 21:1', () => {
    assert.ok(Math.abs(ratio([0, 0, 0], [255, 255, 255]) - 21) < 1e-9);
  });

  test('a colour on itself is 1:1', () => {
    assert.equal(ratio([120, 130, 110], [120, 130, 110]), 1);
  });

  test('it is order-independent', () => {
    const a = [30, 36, 27];
    const b = [235, 221, 203];
    assert.equal(ratio(a, b), ratio(b, a));
  });
});

describe('compositing is source-over and actually uses the backdrop', () => {
  test('alpha 1 returns the foreground, alpha 0 returns the backdrop', () => {
    assert.deepEqual(over([255, 0, 0], 1, [0, 0, 255]), [255, 0, 0]);
    assert.deepEqual(over([255, 0, 0], 0, [0, 0, 255]), [0, 0, 255]);
  });

  test('half alpha is the midpoint', () => {
    assert.deepEqual(over([255, 255, 255], 0.5, [0, 0, 0]), [127.5, 127.5, 127.5]);
  });

  test('stack applies layers back to front', () => {
    /* White, then black at 50%, then white at 50% => 0.5*255 + 0.5*127.5. */
    const out = stack('#FFFFFF', [
      { color: '#000000', alpha: 0.5 },
      { color: '#FFFFFF', alpha: 0.5 },
    ]);
    assert.deepEqual(out, [191.25, 191.25, 191.25]);
  });

  test('a layer with its own alpha in the string is honoured', () => {
    const fromString = stack('#000000', ['rgba(255,255,255,0.5)']);
    const fromObject = stack('#000000', [{ color: '#FFFFFF', alpha: 0.5 }]);
    assert.deepEqual(fromString, fromObject);
  });

  test('AND AN OPAQUE LAYER STILL SEES WHAT IS UNDER IT IN THE CHAIN', () => {
    /* The precise shape of the old bug: an opaque card was composited last and returned
       itself, which was correct — but the caller then measured against that and concluded the
       layers beneath could not matter. They do, whenever the card is NOT opaque, and this is
       the case that proves the chain is real. */
    const opaqueOnTop = stack('#000000', [{ color: '#FFFFFF', alpha: 0.2 }, '#123456']);
    assert.deepEqual(opaqueOnTop, parse('#123456').rgb);
    const translucentOnTop = stack('#000000', [{ color: '#FFFFFF', alpha: 0.2 }, 'rgba(18,52,86,0.5)']);
    assert.notDeepEqual(translucentOnTop, parse('#123456').rgb);
  });
});

describe('contrastOn models what the renderer paints', () => {
  test('white text on black ground is 21:1', () => {
    assert.ok(Math.abs(contrastOn('#FFFFFF', '#000000') - 21) < 1e-9);
  });

  test('a layer between the text and the ground changes the answer', () => {
    const bare = contrastOn('#FFFFFF', '#000000');
    const layered = contrastOn('#FFFFFF', '#000000', [{ color: '#FFFFFF', alpha: 0.5 }]);
    assert.ok(layered < bare, 'the layer was ignored');
  });

  test('container opacity collapses text and card toward the ground', () => {
    /* React Native composites `opacity` over the whole subtree. Text at full strength on a
       card reads one way; the same pair dimmed together reads much worse, and modelling the
       text as opaque is what hid a 2.92:1 row. */
    const full = contrastOn('#000000', '#EBDDCB', ['#FDFCF6']);
    const dimmed = contrastOn('#000000', '#EBDDCB', [{ color: '#FDFCF6', alpha: 0.45 }], 0.45);
    assert.ok(full > 10, `expected a strong ratio undimmed, got ${full.toFixed(2)}`);
    assert.ok(dimmed < 4.5, `expected the dimmed pair to fail AA, got ${dimmed.toFixed(2)}`);
  });

  test('the thresholds are the WCAG ones', () => {
    assert.equal(AA_BODY, 4.5);
    assert.equal(AA_NON_TEXT, 3);
  });
});
