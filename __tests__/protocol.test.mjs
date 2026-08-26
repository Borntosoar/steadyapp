import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const {
  phaseForWeek,
  isWeekUnlocked,
  weekProgress,
  recordPracticeDay,
  mirrorSpecForWeek,
  recommendedAction,
  PRACTICE_DAYS_PER_WEEK,
  WEEKS_TOTAL,
  MIRROR_UNLOCK_WEEK,
} = await import('../lib/protocol.ts');

const fresh = () => ({
  currentWeek: 1,
  weekPracticeDates: [],
  completedWeeks: [],
  avoidedConditions: [],
});

describe('phases', () => {
  test('map weeks to the right phase', () => {
    assert.equal(phaseForWeek(1).id, 1);
    assert.equal(phaseForWeek(3).id, 1);
    assert.equal(phaseForWeek(4).id, 2);
    assert.equal(phaseForWeek(6).id, 2);
    assert.equal(phaseForWeek(7).id, 3);
    assert.equal(phaseForWeek(9).id, 3);
    assert.equal(phaseForWeek(10).id, 4);
    assert.equal(phaseForWeek(12).id, 4);
  });

  test('clamp out-of-range weeks instead of returning undefined', () => {
    assert.equal(phaseForWeek(0).id, 1);
    assert.equal(phaseForWeek(99).id, 4);
  });
});

describe('week unlocking is by completion, never by date', () => {
  test('week 1 is always open', () => {
    assert.equal(isWeekUnlocked(1, fresh()), true);
  });

  test('week 2 stays locked until week 1 is completed', () => {
    assert.equal(isWeekUnlocked(2, fresh()), false);
    assert.equal(isWeekUnlocked(2, { ...fresh(), completedWeeks: [1] }), true);
  });

  test('elapsed time alone never unlocks anything', () => {
    // No date input exists in the signature at all — this is structural, not a policy
    // that could drift. Completing is the only path.
    assert.equal(isWeekUnlocked(5, { ...fresh(), completedWeeks: [1, 2, 3] }), false);
  });
});

describe('recordPracticeDay', () => {
  test('accumulates distinct days', () => {
    let s = fresh();
    s = recordPracticeDay(s, '2026-01-01');
    s = recordPracticeDay(s, '2026-01-02');
    assert.equal(weekProgress(s).done, 2);
    assert.equal(weekProgress(s).remaining, PRACTICE_DAYS_PER_WEEK - 2);
  });

  test('the same day twice does not double count', () => {
    let s = fresh();
    s = recordPracticeDay(s, '2026-01-01');
    s = recordPracticeDay(s, '2026-01-01');
    assert.equal(weekProgress(s).done, 1);
  });

  test('hitting the minimum advances the week and resets the counter', () => {
    let s = fresh();
    for (const d of ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']) {
      s = recordPracticeDay(s, d);
    }
    assert.equal(s.currentWeek, 2);
    assert.deepEqual(s.completedWeeks, [1]);
    assert.equal(s.weekPracticeDates.length, 0);
  });

  test('a big gap between practice days still completes the week', () => {
    // Falling behind must be unrepresentable: four days spread over two months is a
    // completed week, exactly like four consecutive days.
    let s = fresh();
    for (const d of ['2026-01-01', '2026-01-20', '2026-02-11', '2026-03-02']) {
      s = recordPracticeDay(s, d);
    }
    assert.equal(s.currentWeek, 2);
    assert.deepEqual(s.completedWeeks, [1]);
  });

  test('does not advance past the final week', () => {
    let s = { ...fresh(), currentWeek: WEEKS_TOTAL };
    for (const d of ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']) {
      s = recordPracticeDay(s, d);
    }
    assert.equal(s.currentWeek, WEEKS_TOTAL);
  });
});

describe('mirror hierarchy cannot be skipped', () => {
  test('locked before the unlock week', () => {
    for (let w = 1; w < MIRROR_UNLOCK_WEEK; w++) {
      assert.equal(mirrorSpecForWeek(w), null, `week ${w} should have no mirror spec`);
    }
  });

  test('durations increase monotonically across phases', () => {
    const durations = [4, 6, 8, 10, 12].map((w) => mirrorSpecForWeek(w).durationSeconds);
    for (let i = 1; i < durations.length; i++) {
      assert.ok(durations[i] >= durations[i - 1], 'duration must not decrease with phase');
    }
  });

  test('first mirror session is the gentlest spec regardless of week reached', () => {
    const spec = mirrorSpecForWeek(MIRROR_UNLOCK_WEEK);
    assert.equal(spec.durationSeconds, 90);
    assert.equal(spec.requiresCondition, false);
  });

  test('only phase 3 demands an avoided condition', () => {
    assert.equal(mirrorSpecForWeek(8).requiresCondition, true);
    assert.equal(mirrorSpecForWeek(11).requiresCondition, false);
  });
});

describe('recommendedAction returns exactly one action', () => {
  const base = {
    week: 1,
    checkedInToday: false,
    hasUnreadForThisWeek: true,
    mirrorThisWeek: 0,
    recordsThisWeek: 0,
  };

  test('check-in always comes first when missing', () => {
    assert.equal(recommendedAction(base).route, '/checkin');
    assert.equal(recommendedAction({ ...base, week: 9 }).route, '/checkin');
  });

  test('the reading card comes back every week, not only the first time ever', () => {
    /* This was `modulesReadThisWeek: number`, fed `readModules.length` — an all-time count.
       So the moment somebody read one module, ever, the branch was dead and "Read this week"
       never returned, on the card whose entire job is to say what to do next. `readModules`
       carries no timestamps, so "this week" was never computable from it; the question the
       data can answer is whether anything DUE is still unread.
       The rename also caught a hole here: these tests passed the old field name, so after the
       rename they were handing the function `undefined` and still going green. */
    const done = { ...base, checkedInToday: true, hasUnreadForThisWeek: false };
    const due = { ...base, checkedInToday: true, hasUnreadForThisWeek: true };
    assert.equal(recommendedAction({ ...due, week: 1 }).label, 'Read this week');
    assert.notEqual(recommendedAction({ ...done, week: 1 }).label, 'Read this week',
      'the card shows with nothing left to read');
    /* And having read something in week 1 must not silence it in week 2. */
    assert.equal(recommendedAction({ ...due, week: 2 }).label, 'Read this week',
      'reading once turned the card off for the rest of the programme');
  });

  test('phase 1 never recommends mirror work', () => {
    for (const week of [1, 2, 3]) {
      const a = recommendedAction({ ...base, week, checkedInToday: true, hasUnreadForThisWeek: false });
      assert.notEqual(a.route, '/mirror', `week ${week} must not send someone to exposure yet`);
    }
  });

  test('phase 2 recommends mirror once the check-in is done', () => {
    const a = recommendedAction({ ...base, week: 4, checkedInToday: true });
    assert.equal(a.route, '/mirror');
  });

  test('every branch carries a reason, not just a label', () => {
    const cases = [
      base,
      { ...base, checkedInToday: true },
      { ...base, week: 4, checkedInToday: true, mirrorThisWeek: 3 },
      { ...base, week: 8, checkedInToday: true, mirrorThisWeek: 3 },
      { ...base, week: 11, checkedInToday: true },
    ];
    for (const c of cases) {
      const a = recommendedAction(c);
      assert.ok(a.why && a.why.length > 10, `missing rationale for ${JSON.stringify(c)}`);
      assert.ok(a.label && a.label.length > 2);
    }
  });
});
