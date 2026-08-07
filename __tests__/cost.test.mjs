import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { costMirror } from '../lib/cost.ts';
import { PREOCCUPATION_MINUTES } from '../types/index.ts';

/* The cost mirror is the first true thing the app says to anybody, roughly ninety seconds
 * after first open, and it is the whole activation strategy. If the arithmetic is wrong the
 * app opens by getting a fact about the customer's life wrong, to their face. */

const base = (minutes) => ({
  capturedAt: new Date().toISOString(),
  preoccupationMinutes: minutes,
  urge: 5,
  avoidance: 'small',
  suds: 5,
});

describe('cost mirror arithmetic', () => {
  test('two hours a day is fourteen hours a week', () => {
    const m = costMirror(base(120));
    assert.equal(m.hoursPerWeek, 14);
  });

  test('waking days a year, not calendar days', () => {
    // 120 min/day * 365 = 43,800 min = 730 h. At 16 waking hours: ~46 days.
    const m = costMirror(base(120));
    assert.equal(m.daysPerYear, 46);
    // Calendar-day maths would say ~30. Overstating it would be the easiest possible way
    // to make this number untrue, and untrue is the one thing it cannot be.
    assert.notEqual(m.daysPerYear, 30);
  });

  test('rounds hours to one decimal rather than showing false precision', () => {
    const m = costMirror(base(38));
    assert.equal(m.hoursPerWeek, 4.4);
  });

  test('every survey bucket produces a finite, non-negative figure', () => {
    for (const minutes of Object.values(PREOCCUPATION_MINUTES)) {
      const m = costMirror(base(minutes));
      assert.ok(Number.isFinite(m.hoursPerWeek) && m.hoursPerWeek >= 0);
      assert.ok(Number.isFinite(m.daysPerYear) && m.daysPerYear >= 0);
      assert.ok(m.headline.length > 0 && m.sub.length > 0);
    }
  });

  test('no baseline yields zeros and no claim', () => {
    const m = costMirror(null);
    assert.equal(m.minutesPerDay, 0);
    assert.equal(m.hoursPerWeek, 0);
    assert.equal(m.worthShowing, false);
  });
});

describe('cost mirror thresholds', () => {
  test('under fifteen minutes a day is not presented as a cost', () => {
    assert.equal(costMirror(base(8)).worthShowing, false);
    assert.equal(costMirror(base(14)).worthShowing, false);
  });

  test('fifteen minutes and over is', () => {
    assert.equal(costMirror(base(15)).worthShowing, true);
    assert.equal(costMirror(base(240)).worthShowing, true);
  });

  test('the headline carries the figure once the figure is worth carrying', () => {
    const m = costMirror(base(PREOCCUPATION_MINUTES['3-5h']));
    assert.match(m.headline, /\d/, 'the headline should be the number');
    assert.match(m.headline, /hours a week/);
  });

  test('the days-a-year line only appears when it is a meaningful span', () => {
    // 15 min/day is ~5.7 waking days a year — real, but not a sentence worth building on.
    const small = costMirror(base(15));
    assert.doesNotMatch(small.sub, /waking days/);
    const large = costMirror(base(240));
    assert.match(large.sub, /waking days/);
  });
});

describe('cost mirror language', () => {
  const all = [8, 38, 120, 240, 360].flatMap((n) => {
    const m = costMirror(base(n));
    return [m.headline, m.sub];
  });

  test('present tense throughout — nothing about what happens next', () => {
    for (const s of all) {
      assert.doesNotMatch(s, /will be|you'?ll|going to|expect to|after (twelve|12) weeks/i,
        `forward-looking claim: "${s}"`);
    }
  });

  test('the phrase that keeps it honest is present on real figures', () => {
    const m = costMirror(base(240));
    assert.match(m.sub, /as things stand/,
      'the present-tense qualifier is what stops this reading as a projection');
  });
});
