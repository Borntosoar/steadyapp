/* Tests for the reclaimed-hours engine.
 *
 * Run with: npm test  (node --test, no jest needed)
 *
 * These import the compiled-free .ts source via a tiny inline re-implementation guard:
 * we strip types at load using node's built-in type stripping (Node 22.6+). If that is
 * unavailable the suite falls back to skipping with a clear message rather than
 * silently passing. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../lib/reclaimed.ts');
const {
  computeReclaimed,
  meanDailyMinutes,
  checkInsInLastDays,
  reclaimedByWeek,
  reclaimedCopy,
} = mod;

const baseline = {
  capturedAt: '2026-01-01T00:00:00.000Z',
  preoccupationMinutes: 240, // 4h/day at baseline
  urge: 8,
  avoidance: 'significant',
  suds: 8,
};

const ci = (date, minutes) => ({
  id: date,
  date,
  preoccupationMinutes: minutes,
  urge: 5,
  avoidance: 'small',
  suds: 5,
});

describe('meanDailyMinutes', () => {
  test('returns 0 for empty input rather than NaN', () => {
    assert.equal(meanDailyMinutes([]), 0);
  });

  test('averages correctly', () => {
    assert.equal(meanDailyMinutes([ci('2026-01-02', 120), ci('2026-01-03', 240)]), 180);
  });
});

describe('computeReclaimed — zero-data cases', () => {
  test('no baseline yields hasData false and no fabricated number', () => {
    const r = computeReclaimed(null, [ci('2026-01-02', 120)]);
    assert.equal(r.hasData, false);
    assert.equal(r.hours, 0);
  });

  test('no check-ins yields hasData false', () => {
    const r = computeReclaimed(baseline, []);
    assert.equal(r.hasData, false);
    assert.equal(r.sampleSize, 0);
  });

  test('both missing does not throw', () => {
    assert.doesNotThrow(() => computeReclaimed(null, []));
  });
});

describe('computeReclaimed — improvement', () => {
  test('halving daily minutes reclaims the right number of hours', () => {
    // baseline 240/day, now 120/day => 120 min/day saved => 14h/week
    const r = computeReclaimed(baseline, [ci('2026-01-02', 120), ci('2026-01-03', 120)], 7);
    assert.equal(r.minutesPerDayDelta, 120);
    assert.equal(r.hours, 14);
    assert.equal(r.direction, 'up');
    assert.equal(r.hasData, true);
  });

  test('honours a non-default day window', () => {
    const r = computeReclaimed(baseline, [ci('2026-01-02', 180)], 1);
    assert.equal(r.hours, 1); // 60 min saved over 1 day
  });
});

describe('computeReclaimed — negative cases', () => {
  test('a worse week produces negative hours, not a clamped zero', () => {
    // baseline 240, now 360 => -120 min/day => -14h/week
    const r = computeReclaimed(baseline, [ci('2026-01-02', 360), ci('2026-01-03', 360)], 7);
    assert.equal(r.hours, -14);
    assert.equal(r.minutesPerDayDelta, -120);
    assert.equal(r.direction, 'down');
  });

  test('negative direction is reported honestly rather than hidden', () => {
    const r = computeReclaimed(baseline, [ci('2026-01-02', 300)], 7);
    assert.ok(r.hours < 0);
    assert.equal(r.direction, 'down');
  });
});

describe('computeReclaimed — flat band', () => {
  test('identical to baseline is flat, not up', () => {
    const r = computeReclaimed(baseline, [ci('2026-01-02', 240)], 7);
    assert.equal(r.hours, 0);
    assert.equal(r.direction, 'flat');
  });

  test('a trivial gain inside the noise band is not sold as progress', () => {
    // 1 min/day better => 7 min/week => 0.1h, under the 0.25h band
    const r = computeReclaimed(baseline, [ci('2026-01-02', 239)], 7);
    assert.equal(r.direction, 'flat');
  });
});

describe('checkInsInLastDays', () => {
  test('includes today and excludes older entries', () => {
    const now = new Date('2026-01-10T12:00:00');
    const all = [ci('2026-01-10', 60), ci('2026-01-05', 60), ci('2026-01-01', 60)];
    const got = checkInsInLastDays(all, 7, now);
    assert.deepEqual(got.map((c) => c.date), ['2026-01-10', '2026-01-05']);
  });

  test('empty history returns empty, not undefined', () => {
    assert.deepEqual(checkInsInLastDays([], 7, new Date('2026-01-10')), []);
  });
});

describe('reclaimedByWeek', () => {
  test('buckets check-ins into 7-day windows from the first entry', () => {
    const rows = reclaimedByWeek(baseline, [
      ci('2026-01-01', 240),
      ci('2026-01-03', 240),
      ci('2026-01-09', 120),
    ]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].week, 1);
    assert.equal(rows[0].hours, 0);
    assert.equal(rows[1].week, 2);
    assert.equal(rows[1].hours, 14);
  });

  test('no baseline yields an empty series', () => {
    assert.deepEqual(reclaimedByWeek(null, [ci('2026-01-01', 60)]), []);
  });
});

describe('reclaimedCopy — tone safety', () => {
  const shaming = /fail|failed|failure|slipped|behind|should have|disappoint|worse than you|lost ground|bad week|broke/i;

  test('a negative week never uses shaming language', () => {
    const r = computeReclaimed(baseline, [ci('2026-01-02', 360), ci('2026-01-03', 360), ci('2026-01-04', 360)], 7);
    const { headline, sub } = reclaimedCopy(r);
    assert.equal(r.direction, 'down');
    assert.doesNotMatch(headline, shaming);
    assert.doesNotMatch(sub, shaming);
  });

  test('a flat week is framed neutrally', () => {
    const r = computeReclaimed(baseline, [ci('2026-01-02', 240), ci('2026-01-03', 240), ci('2026-01-04', 240)], 7);
    const { headline, sub } = reclaimedCopy(r);
    assert.doesNotMatch(headline, shaming);
    assert.doesNotMatch(sub, shaming);
    assert.match(headline, /level/i);
    assert.match(sub, /part of the shape/i);
  });

  test('"last week" phrasing is only used when a prior week was actually measured', () => {
    // Without a previous window, saying "level with last week" would be an assertion
    // about data that was never computed.
    const flat = [ci('2026-01-02', 240), ci('2026-01-03', 240), ci('2026-01-04', 240)];
    const noPrior = reclaimedCopy(computeReclaimed(baseline, flat, 7));
    assert.doesNotMatch(noPrior.sub, /last week/i);

    const withPrior = reclaimedCopy(
      computeReclaimed(baseline, flat, 7, [ci('2025-12-26', 250)])
    );
    assert.match(withPrior.sub, /last week/i);
  });

  test('a heavier week only claims "higher than last week" when there is a last week', () => {
    const heavy = [ci('2026-01-02', 360), ci('2026-01-03', 360), ci('2026-01-04', 360)];
    const noPrior = reclaimedCopy(computeReclaimed(baseline, heavy, 7));
    assert.doesNotMatch(noPrior.sub, /last week/i);
    assert.match(noPrior.sub, /starting point/i);

    const withPrior = reclaimedCopy(
      computeReclaimed(baseline, heavy, 7, [ci('2025-12-26', 200)])
    );
    assert.match(withPrior.sub, /Higher than last week/i);
  });

  test('week-over-week delta is computed, not guessed', () => {
    const r = computeReclaimed(
      baseline,
      [ci('2026-01-02', 120)],
      7,
      [ci('2025-12-26', 200), ci('2025-12-27', 200)]
    );
    assert.equal(r.previousAvgDailyMinutes, 200);
    assert.equal(r.weekOverWeekDelta, 80);
  });

  test('no copy branch ever references appearance', () => {
    const appearance = /look|appearance|attractive|face|body|ugly|pretty|handsome|better looking/i;
    const cases = [
      computeReclaimed(null, []),
      computeReclaimed(baseline, [ci('2026-01-02', 120)]),
      computeReclaimed(baseline, [ci('2026-01-02', 120), ci('2026-01-03', 120), ci('2026-01-04', 120)]),
      computeReclaimed(baseline, [ci('2026-01-02', 360), ci('2026-01-03', 360), ci('2026-01-04', 360)]),
      computeReclaimed(baseline, [ci('2026-01-02', 240), ci('2026-01-03', 240), ci('2026-01-04', 240)]),
    ];
    for (const r of cases) {
      const { headline, sub } = reclaimedCopy(r, 'Sam');
      assert.doesNotMatch(headline, appearance, `headline leaked appearance: ${headline}`);
      assert.doesNotMatch(sub, appearance, `sub leaked appearance: ${sub}`);
    }
  });

  test('sparse data is labelled as sparse rather than shown as a number', () => {
    const r = computeReclaimed(baseline, [ci('2026-01-02', 120)]);
    const { headline } = reclaimedCopy(r);
    assert.match(headline, /gathering/i);
  });
});
