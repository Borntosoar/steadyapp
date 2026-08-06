import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const {
  initialStreak,
  registerPractice,
  dayKey,
  daysBetween,
  milestoneReached,
  milestoneCopy,
  returningCopy,
  freezeCopy,
  STARTING_FREEZES,
  MAX_FREEZES,
} = await import('../lib/streak.ts');

describe('dayKey / daysBetween', () => {
  test('formats a stable yyyy-MM-dd key', () => {
    assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
  });

  test('counts whole days between keys', () => {
    assert.equal(daysBetween('2026-01-01', '2026-01-04'), 3);
    assert.equal(daysBetween('2026-01-01', '2026-01-01'), 0);
  });
});

describe('registerPractice', () => {
  test('first ever practice starts the streak at 1', () => {
    const s = registerPractice(initialStreak(), '2026-01-01');
    assert.equal(s.current, 1);
    assert.equal(s.longest, 1);
  });

  test('consecutive days increment', () => {
    let s = registerPractice(initialStreak(), '2026-01-01');
    s = registerPractice(s, '2026-01-02');
    s = registerPractice(s, '2026-01-03');
    assert.equal(s.current, 3);
  });

  test('practising twice in one day does not double count', () => {
    let s = registerPractice(initialStreak(), '2026-01-01');
    s = registerPractice(s, '2026-01-01');
    assert.equal(s.current, 1);
  });

  test('a single missed day is covered silently by a freeze', () => {
    let s = registerPractice(initialStreak(), '2026-01-01');
    s = registerPractice(s, '2026-01-03'); // skipped the 2nd
    assert.equal(s.current, 2, 'streak should continue');
    assert.equal(s.freezesRemaining, STARTING_FREEZES - 1);
    assert.deepEqual(s.frozenDates, ['2026-01-02']);
  });

  test('a gap larger than banked freezes restarts at 1 without erasing longest', () => {
    let s = registerPractice(initialStreak(), '2026-01-01');
    s = registerPractice(s, '2026-01-02');
    s = registerPractice(s, '2026-01-03');
    const longestBefore = s.longest;
    s = registerPractice(s, '2026-02-01'); // huge gap, freezes cannot cover it
    assert.equal(s.current, 1);
    assert.equal(s.longest, longestBefore, 'past achievement is preserved, never wiped');
  });

  test('earns a freeze every 7 consecutive days, capped', () => {
    let s = initialStreak();
    const start = new Date(2026, 0, 1);
    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      s = registerPractice(s, dayKey(d));
    }
    assert.equal(s.current, 60);
    assert.ok(s.freezesRemaining <= MAX_FREEZES, 'freezes must be capped');
  });
});

describe('milestones', () => {
  test('fire on crossing, not on every day after', () => {
    assert.equal(milestoneReached(6, 7), 7);
    assert.equal(milestoneReached(7, 8), null);
    assert.equal(milestoneReached(29, 30), 30);
    assert.equal(milestoneReached(99, 100), 100);
  });
});

describe('copy safety — nothing in this module may shame or reference appearance', () => {
  const shaming = /fail|failed|failure|broke|broken|lost your|you missed|streak lost|don'?t break|behind|slipped|guilt|shame|disappoint/i;
  const appearance = /\blook\b|\blooks\b|appearance|attractive|face|ugly|pretty|handsome|body/i;

  const allCopy = [
    ...[7, 30, 100].flatMap((d) => {
      const c = milestoneCopy(d);
      return [c.title, c.body];
    }),
    returningCopy(),
    freezeCopy(0),
    freezeCopy(2),
  ];

  test('no shaming language anywhere', () => {
    for (const s of allCopy) {
      assert.doesNotMatch(s, shaming, `shaming language found: "${s}"`);
    }
  });

  test('no appearance language anywhere', () => {
    for (const s of allCopy) {
      assert.doesNotMatch(s, appearance, `appearance language found: "${s}"`);
    }
  });

  test('milestones celebrate attendance rather than improvement', () => {
    for (const d of [7, 30, 100]) {
      const c = milestoneCopy(d);
      assert.match(`${c.title} ${c.body}`, /showing up|turning up|practice|practising/i);
    }
  });

  test('returning copy does not account for time away', () => {
    assert.doesNotMatch(returningCopy(), /\d+\s*(day|week|month)/i);
  });
});
