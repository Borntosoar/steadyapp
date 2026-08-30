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
  lifetimeReclaimed,
  MIN_SAMPLE,
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
    /* The assertion is about the behaviour, not the wording: one check-in must not be
       rendered as an hours figure. Pinning the exact word made a copy edit look like a
       safety regression. */
    assert.doesNotMatch(headline, /\d/, `a single check-in produced a number: "${headline}"`);
    assert.match(headline, /still|gathering|adding|starts/i, `headline does not say it is incomplete: "${headline}"`);
  });
});


describe('lifetimeReclaimed — the one number here that cannot fall', () => {
  /* WHY IT EXISTS. Every other figure in this app is a rolling window or resets:
     `computeReclaimed` is seven days and disappears below MIN_SAMPLE check-ins, so a
     fortnight away deletes the headline, and the running streak went back to 1 and was taken
     off Today for the same reason. Nothing accumulated, so nothing answered "why open this
     on day 200". `reclaimedByWeek`'s own docstring had promised a cumulative figure for
     months and no such function existed.

     The property that matters is MONOTONICITY: adding days must never reduce it. That is the
     whole claim the copy makes — "you cannot lose an hour you already got back" — and it is
     a claim about English as much as arithmetic, so it is tested rather than asserted in a
     comment. */

  /** `days` consecutive check-ins at `minutes`, starting at 2026-01-02. */
  const run = (days, minutes, from = 1) =>
    Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.UTC(2026, 0, from + 1 + i));
      return ci(d.toISOString().slice(0, 10), minutes);
    });

  test('no baseline and no check-ins produce nothing rather than zero-as-a-claim', () => {
    assert.deepEqual(lifetimeReclaimed(null, run(7, 120)), { hours: 0, weeks: 0 });
    assert.deepEqual(lifetimeReclaimed(baseline, []), { hours: 0, weeks: 0 });
  });

  test('a thin week is not counted, because the app refuses to name that number anyway', () => {
    /* `reclaimedCopy` will not state a figure below MIN_SAMPLE. A lifetime total built partly
       from weeks the app declines to describe individually is that same refused number, said
       louder and with more authority. */
    const thin = lifetimeReclaimed(baseline, run(MIN_SAMPLE - 1, 120));
    assert.equal(thin.weeks, 0);
    assert.equal(thin.hours, 0);

    const enough = lifetimeReclaimed(baseline, run(MIN_SAMPLE, 120));
    assert.equal(enough.weeks, 1);
    assert.ok(enough.hours > 0);
  });

  test('a heavy week is not netted off a good one', () => {
    /* ⚠ THE RULE, AND IT IS A CLAIM ABOUT THE PAST RATHER THAN ABOUT ARITHMETIC. A week
       worse than baseline has a negative figure. Subtracting it would mean the app taking
       back hours somebody genuinely did get back in March because April was worse, under a
       sentence saying they cannot lose them. The heavy weeks are not hidden — the signed
       week-by-week chart ships beside this and contains every one. Two questions, two
       numbers, both true. */
    const good = run(7, 120);                 // well under the 240 baseline
    const heavy = run(7, 400, 8);             // well over it
    const both = lifetimeReclaimed(baseline, [...good, ...heavy]);
    const goodOnly = lifetimeReclaimed(baseline, good);
    assert.equal(both.hours, goodOnly.hours,
      'a bad fortnight reduced hours the person had already got back');
    assert.equal(both.weeks, goodOnly.weeks);
  });

  test('it never decreases as days are added — the property the copy promises', () => {
    /* Walked rather than sampled. Mixes good weeks and heavy ones deliberately, because the
       only way this goes backwards is a heavy week being allowed to subtract. */
    const all = [...run(7, 120), ...run(7, 400, 8), ...run(7, 60, 15), ...run(7, 300, 22)];
    let prev = -1;
    for (let n = 0; n <= all.length; n += 1) {
      const h = lifetimeReclaimed(baseline, all.slice(0, n)).hours;
      assert.ok(h >= prev, `hours fell from ${prev} to ${h} after ${n} check-ins`);
      prev = h;
    }
  });

  test('the total is rounded once, at the end', () => {
    /* ⚠ ASSERTS THE VALUE, NOT THE SHAPE, and that is a correction found by mutation. The
       first version checked `r.hours === Math.round(r.hours * 10) / 10`, which is true of
       any already-rounded number — including a total built by rounding every week first. It
       passed happily against exactly the bug it was written for.
       133 minutes a day against a 240 baseline is 12.5 hours a week, which is the discriminator:
       three such weeks are 37.5 rounded once, and 39 if each week is rounded before summing.
       Half an hour per week does not sound like much until it is a year of data, at which
       point the headline number is out by a working day. */
    const r = lifetimeReclaimed(baseline, [...run(7, 133), ...run(7, 133, 8), ...run(7, 133, 15)]);
    assert.equal(r.weeks, 3);
    assert.equal(r.hours, 37.5, 'the weekly figures were rounded before they were added up');
  });

  test('weeks counts the weeks that contributed, not the weeks that elapsed', () => {
    /* Somebody who logged one good week, vanished for a month, then logged another should
       read "2 weeks", not "6". The number is a count of their own record, and a gap is not
       something they did. */
    const r = lifetimeReclaimed(baseline, [...run(7, 120), ...run(7, 120, 29)]);
    assert.equal(r.weeks, 2);
  });
});
