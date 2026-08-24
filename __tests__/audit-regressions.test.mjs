import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Read repo source without importing it — several assertions here are about the SHAPE of
 *  code that cannot be exercised outside a renderer. */
const readSrc = (rel) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', rel), 'utf8');

import { checkInsInLastDays, previousWeekCheckIns, computeReclaimed } from '../lib/reclaimed.ts';
import { registerPractice, dayKey } from '../lib/streak.ts';
import { recordPracticeDay, PRACTICE_DAYS_PER_WEEK, WEEKS_TOTAL } from '../lib/protocol.ts';
import { calmFor, planFor } from '../lib/plan.ts';
import { importJson, SCHEMA_VERSION } from '../lib/storage.ts';

/* Regressions from the audit pass of 2026-08-23.
 *
 * Every test here corresponds to a defect that was live, was proven by running code rather
 * than by reading it, and that the existing 1135-test suite did not catch. They are grouped
 * in one file on purpose: what they have in common is not a subsystem, it is that each one
 * sat just outside the edge of a test that looked like it already covered the area.
 *
 * Where a test needs a timezone it says so — several of these are only reachable in zones the
 * existing timezone suite does not visit. */

describe('the reclaimed window keeps the oldest day in midnight-DST zones', () => {
  /* checkInsInLastDays and previousWeekCheckIns were the only two places in the app that
     built a boundary with setHours(0,0,0,0) and then compared Date objects. Where local
     midnight does not exist — Chile, Cuba, Lebanon, Egypt, Paraguay all move at midnight —
     that resolves forward to 01:00 and the oldest day falls out of the window.
     __tests__/timezone.test.mjs covers seven zones and all seven transition at 02:00 or
     later, which is why this survived. */

  const window7 = (checkIns, now) => checkInsInLastDays(checkIns, 7, now);

  test('a seven-day window holds seven days, whatever the clock did that night', () => {
    /* Pure day keys, so this assertion is true in every zone the suite happens to run in.
       The zone-specific proof is the one below it. */
    const days = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'];
    const checkIns = days.map((date, i) => ({ id: `c${i}`, date, preoccupationMinutes: 60, urge: 3, avoidance: 'none', suds: 3 }));
    const now = new Date('2026-09-06T15:00:00');
    assert.equal(window7(checkIns, now).length, 7, 'the oldest day was dropped');
  });

  test('the boundary is computed from day keys, not from Date comparison', () => {
    /* The mechanism, asserted directly: a check-in on the first day of the window is IN, and
       one on the day before it is OUT, with no dependence on wall-clock hours. */
    const mk = (date) => ({ id: date, date, preoccupationMinutes: 60, urge: 3, avoidance: 'none', suds: 3 });
    const now = new Date('2026-09-06T00:30:00');
    const got = window7([mk('2026-08-30'), mk('2026-08-31'), mk('2026-09-06')], now).map((c) => c.date);
    assert.deepEqual(got, ['2026-08-31', '2026-09-06']);
  });

  test('the previous-week window is the seven days before that, and does not overlap', () => {
    const mk = (date) => ({ id: date, date, preoccupationMinutes: 60, urge: 3, avoidance: 'none', suds: 3 });
    const all = [];
    for (let d = 18; d <= 30; d++) all.push(mk(`2026-08-${d}`));
    for (let d = 1; d <= 6; d++) all.push(mk(`2026-09-0${d}`));
    const now = new Date('2026-09-06T12:00:00');
    const cur = new Set(window7(all, now).map((c) => c.date));
    const prev = previousWeekCheckIns(all, now).map((c) => c.date);
    assert.equal(prev.length, 7, `previous window held ${prev.length} days`);
    for (const d of prev) assert.ok(!cur.has(d), `${d} is in both windows`);
  });

  test('the headline number does not move because of the calendar', () => {
    /* The user-visible cost: identical data, and the hero figure on the home screen differed
       by 2.3 hours between two zones. */
    const baseline = { capturedAt: '2026-08-01', preoccupationMinutes: 240, urge: 8, avoidance: 'significant', suds: 8 };
    const mk = (date, m) => ({ id: date, date, preoccupationMinutes: m, urge: 3, avoidance: 'none', suds: 3 });
    const checkIns = [mk('2026-08-31', 200), ...['01', '02', '03', '04', '05', '06'].map((d) => mk(`2026-09-${d}`, 60))];
    const now = new Date('2026-09-06T15:00:00');
    const win = window7(checkIns, now);
    assert.equal(win.length, 7);
    assert.equal(computeReclaimed(baseline, win, 7).currentAvgDailyMinutes, 80);
  });
});

describe('a practice day is enrolled in the protocol exactly once', () => {
  /* recordPracticeDay guards a repeat with weekPracticeDates.includes() — but on the call
     that COMPLETES a week it clears that array, so a second call on the same day found it
     empty and enrolled the same day again as day one of the next week. logPractice runs on
     every engagement event, and a check-in plus one game is the ordinary case: the twelve
     weeks completed in 37 distinct days instead of 48. */

  const fresh = () => ({ currentWeek: 1, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] });

  test('it is idempotent WITHIN a week, which is the guarantee it actually makes', () => {
    let p = fresh();
    p = recordPracticeDay(p, '2026-01-01');
    p = recordPracticeDay(p, '2026-01-01');
    assert.deepEqual(p.weekPracticeDates, ['2026-01-01']);
  });

  test('but NOT across its own reset — the footgun is real and stays documented', () => {
    /* Deliberately asserting the flaw rather than a fix, because no fix was made here.
       `recordPracticeDay` cannot recognise a repeat once it has cleared weekPracticeDates:
       it has no memory of the day that completed the week, and giving it one means a new
       field on ProtocolState and a storage migration. That was not worth the risk for a
       function with exactly one caller.
       So the guard lives at the call site, and the test below is the one that matters. If
       somebody later adds a second caller, this test is the note explaining what they have
       to do about it. */
    let p = fresh();
    for (let d = 1; d <= PRACTICE_DAYS_PER_WEEK; d++) p = recordPracticeDay(p, `2026-01-0${d}`);
    assert.equal(p.currentWeek, 2, 'the week did not complete');
    const again = recordPracticeDay(p, `2026-01-0${PRACTICE_DAYS_PER_WEEK}`);
    assert.deepEqual(
      again.weekPracticeDates, [`2026-01-0${PRACTICE_DAYS_PER_WEEK}`],
      'recordPracticeDay became self-idempotent — good, now delete this test and the call-site guard note',
    );
  });

  test('so the store calls it only when the day is new', () => {
    /* THIS is the fix. logPractice fires on every engagement event, and a check-in plus one
       game is the ordinary case — ungated, the twelve weeks completed in 37 distinct days
       instead of 48. */
    const src = readSrc('store/useStore.ts');
    assert.match(
      src, /protocol:\s*alreadyToday\s*\?\s*s\.protocol\s*:\s*recordPracticeDay/,
      'logPractice records a protocol day on every engagement event again',
    );
  });

  test('and the arithmetic that follows from the guard is right', () => {
    /* One enrolment per distinct day => 4 days for week 1 and 4 for each of the other
       eleven. The bug made it 4 + 11 x 3 = 37. */
    /* Loop on completedWeeks, not currentWeek — the latter clamps at WEEKS_TOTAL and would
       never terminate. */
    let p = fresh();
    let days = 0;
    const start = new Date('2026-01-01T00:00:00');
    while (p.completedWeeks.length < WEEKS_TOTAL && days < 300) {
      const d = new Date(start);
      d.setDate(d.getDate() + days);
      p = recordPracticeDay(p, dayKey(d));
      days += 1;
    }
    assert.equal(
      days, WEEKS_TOTAL * PRACTICE_DAYS_PER_WEEK,
      `the programme finished in ${days} distinct days instead of ${WEEKS_TOTAL * PRACTICE_DAYS_PER_WEEK}`,
    );
  });
});

describe('a clock set into the future does not freeze the streak forever', () => {
  /* `if (gap <= 0) return state` returned the state untouched, so lastPracticeDate never
     repaired and every later day was negative too. One practice logged on a skewed clock and
     the streak was pinned permanently: milestones dead, longest frozen, winback unreachable. */

  test('a future stored date re-anchors on today and keeps the run', () => {
    const skewed = { current: 40, longest: 40, freezesRemaining: 2, lastPracticeDate: '2030-06-01', frozenDates: [] };
    const after = registerPractice(skewed, '2026-08-23');
    assert.equal(after.lastPracticeDate, '2026-08-23', 'the future date was left in place');
    assert.equal(after.current, 40, 'the run was reset by a clock error');
  });

  test('and the day after that behaves normally again', () => {
    const skewed = { current: 40, longest: 40, freezesRemaining: 2, lastPracticeDate: '2030-06-01', frozenDates: [] };
    const repaired = registerPractice(skewed, '2026-08-23');
    const next = registerPractice(repaired, '2026-08-24');
    assert.equal(next.current, 41, 'the streak did not resume counting');
    assert.equal(next.longest, 41);
  });

  test('the same day twice is still a no-op', () => {
    const s = { current: 3, longest: 5, freezesRemaining: 2, lastPracticeDate: '2026-08-23', frozenDates: [] };
    assert.equal(registerPractice(s, '2026-08-23'), s);
  });
});

describe('untrusted keys cannot reach Object.prototype', () => {
  /* `FEATURED_CALM[a.worst ?? ''] ?? 'Breathe'` indexed a plain object with a string that
     came off disk. `??` cannot catch a constructor or a prototype, because neither is
     nullish, so the featured calm mode became a function. */

  for (const hostile of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
    test(`"${hostile}" resolves to a real mode`, () => {
      assert.equal(typeof calmFor(hostile), 'string');
      assert.equal(calmFor(hostile), 'Breathe');
      assert.equal(typeof planFor({ worst: hostile }).calm, 'string');
    });
  }

  test('a real answer still works, so the guard did not break the feature', () => {
    assert.equal(calmFor('night'), 'Float');
    assert.equal(calmFor('waking'), 'Breathe');
    assert.equal(calmFor(undefined), 'Breathe');
  });
});

describe('a backup from a newer build is refused rather than silently stripped', () => {
  /* loadState already quarantines a newer payload; importJson did not, so restoring a
     TestFlight backup onto an App Store build normalised it against an older allowlist and
     rewrote the journal without the fields it did not recognise. */

  test('a payload from a future schema returns null', () => {
    const payload = JSON.stringify({
      v: SCHEMA_VERSION + 1,
      data: { profile: { supportRegion: 'us' }, checkIns: [], thoughtRecords: [] },
    });
    assert.equal(importJson(payload), null);
  });

  test('a payload from the current schema still imports', () => {
    const payload = JSON.stringify({
      v: SCHEMA_VERSION,
      data: { profile: { supportRegion: 'us' }, checkIns: [], thoughtRecords: [] },
    });
    assert.notEqual(importJson(payload), null, 'the guard swallowed a valid backup');
  });

  test('an older payload still imports, because migration is the point', () => {
    const payload = JSON.stringify({ v: 2, data: { profile: { supportRegion: 'us' }, checkIns: [] } });
    assert.notEqual(importJson(payload), null);
  });
});

describe('Curveball ends a timed round when every thought has settled', () => {
  /* The round used to end inside `if (i === rows.length - 1)`, behind `if (!finished)
     return`. tap() calls stopAnimation(), and React Native's TimingAnimation.stop() ends with
     __notifyAnimationEnd({ finished: false }) — so catching the last thought returned early
     and nothing else could ever schedule the ending. In timed mode there is no other exit.
     Every scene in content/curveball.ts ends on a distorted thought, so the last thing to
     rise is always one the game tells you to tap.

     This is a source assertion rather than a behavioural one: the logic lives inside a React
     effect driven by an animation callback, and a browser reproduction has to land a tap
     inside a five-second window on a randomly chosen scene. The shape is what matters — that
     completion counts settled rows and does not depend on how a row stopped. */

  /* COMMENTS STRIPPED FIRST. The fix carries a long docblock that quotes the very code it
     replaced — `i === rows.length - 1` and `if (!finished) return;` both appear in prose a
     few lines above the real logic. Matching raw source would fail on the explanation of the
     bug, which is the sort of test that teaches people to delete comments. */
  const src = readSrc('app/game/curveball.tsx')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  test('completion counts settled rows rather than watching the last index', () => {
    assert.match(src, /settled\.size === rows\.length/, 'the round no longer ends on a count');
    assert.doesNotMatch(src, /i === rows\.length - 1/, 'the last-index completion branch is back');
  });

  test('and it does not gate settling on the animation having finished', () => {
    /* `finished` may still guard the 'through' status — a tapped row must not be scored as
       let-through — but it must not guard the settle. */
    assert.doesNotMatch(src, /if \(!finished\) return;/, 'the early return that caused the hang is back');
    assert.match(src, /settle\(row\);/);
  });

  test('the guard is checked against source that still contains the explanation', () => {
    /* A stripper that removed too much would make the two assertions above vacuous. */
    const raw = readSrc('app/game/curveball.tsx');
    assert.match(raw, /i === rows\.length - 1/, 'the docblock explaining the bug was deleted');
    assert.ok(src.length > 4000, 'comment stripping ate the code as well as the comments');
  });

  test('teardown cannot schedule an ending after the screen is gone', () => {
    assert.match(src, /torn = true;/);
    assert.match(src, /if \(torn\) return;/);
  });
});

