import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Timezone regressions.
 *
 * Every one of these was live and every one passed the whole existing suite, because the
 * fixtures built their dates with toISOString() — the same UTC assumption the bug was made
 * of. A test that shares the defect's assumption cannot see the defect.
 *
 * These run the real modules in a child process with TZ set, which is the only way to
 * exercise date handling that depends on the host's zone. Sydney is UTC+10/+11 (ahead of
 * UTC, so local "today" can be UTC "tomorrow") and Los Angeles is UTC-7/-8 (behind, so
 * local afternoon is already UTC tomorrow). Both directions matter and they fail
 * differently. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function inZone(tz, body) {
  const script = `
    import { dayKey, daysBetween } from '${ROOT}/lib/streak.ts';
    import { distressRecently, nextMoment, eligibleMoments } from '${ROOT}/lib/moments.ts';
    const day = (n) => dayKey(new Date(Date.now() - n * 864e5));
    ${body}
  `;
  const out = execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '--eval', script],
    { env: { ...process.env, TZ: tz }, encoding: 'utf8' }
  );
  return JSON.parse(out.trim().split('\n').pop());
}

const ZONES = ['Australia/Sydney', 'Pacific/Auckland', 'Asia/Tokyo', 'UTC', 'Europe/London', 'America/Los_Angeles', 'America/New_York'];

describe('day keys agree with stored dates in every zone', () => {
  for (const tz of ZONES) {
    test(`${tz}: today's check-in is not treated as a future date`, () => {
      /* The original bug. Stored dates come from streak's local dayKey; moments compared
         them against a UTC one. In Sydney at 9am, today's own check-in looked like
         tomorrow, hit the `gap < 0` guard, and was skipped — so a 10-out-of-10 distress
         rating did not suppress the upgrade ask. */
      const suppressed = inZone(tz, `
        const ci = [{ date: day(0), suds: 10, avoidance: 'significant' }];
        console.log(JSON.stringify(distressRecently(ci, [])));
      `);
      assert.equal(suppressed, true, `today's own distress rating was ignored in ${tz}`);
    });

    test(`${tz}: a hard day tapped today suppresses the ask`, () => {
      const suppressed = inZone(tz, `console.log(JSON.stringify(distressRecently([], [day(0)])));`);
      assert.equal(suppressed, true, `a hard-day tap was ignored in ${tz}`);
    });

    test(`${tz}: yesterday still counts, three days ago does not`, () => {
      const r = inZone(tz, `
        console.log(JSON.stringify([
          distressRecently([], [day(1)]),
          distressRecently([], [day(3)]),
        ]));
      `);
      assert.deepEqual(r, [true, false], `the 24-hour window is wrong in ${tz}`);
    });
  }
});

describe('the daily budget follows the local day, not UTC', () => {
  for (const tz of ['America/Los_Angeles', 'America/New_York', 'Australia/Sydney']) {
    test(`${tz}: a moment shown today is still today's moment at any hour`, () => {
      /* The budget used to reset at UTC midnight — 5pm in Los Angeles — so a card
         somebody was reading got replaced by the paywall ask mid-session, and a second
         interruption could arrive in the same local day. */
      const same = inZone(tz, `
        const base = {
          profile: {}, baseline: null, checkIns: [], urgeLogs: [], thoughtRecords: [],
          mirrorSessions: [], experiments: [],
          practice: [0,1,2,3].map((n) => ({ id: 'p'+n, date: day(n), kind: 'checkin' })),
          streak: { current: 4, longest: 4, lastPracticeDate: day(0), freezes: 2 },
          protocol: { currentWeek: 4, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] },
          readModules: [], entitlement: { source: 'none', plan: null, expiresAt: null, verifiedAt: null },
          moments: { plateau: { shows: 1, lastShownDate: day(0), dismissals: 0, lastDismissedDate: null, acted: false } },
        };
        const input = { state: base, reclaimedSampleSize: 5, weekComplete: true };
        console.log(JSON.stringify(nextMoment(input)?.id ?? null));
      `);
      assert.equal(same, 'plateau', `today's moment was swapped for another one in ${tz}`);
    });
  }
});

describe('a future-dated hard day cannot silence the app forever', () => {
  test('a clock-skewed hard day one day ahead does not suppress', () => {
    /* Fails safe either way, but without a lower bound one bad clock reading suppressed
       every commercial moment for the life of the install, silently and permanently. */
    const r = inZone('UTC', `
      const ahead = dayKey(new Date(Date.now() + 3650 * 864e5));
      console.log(JSON.stringify(distressRecently([], [ahead])));
    `);
    assert.equal(r, false, 'a hard day ten years in the future suppressed the ask');
  });
});

describe('weekly bucketing survives a daylight-saving transition', () => {
  test('three consecutive weeks contain seven days each across spring-forward', () => {
    /* Raw millisecond division put eight days in one bucket and six in the next, because
       a seven-day span crossing the transition measures 6.958 days and floors down. The
       chart then showed an inflated week beside a deflated one. */
    const script = `
      import { reclaimedByWeek } from '${ROOT}/lib/reclaimed.ts';
      const start = new Date('2026-03-01T12:00:00');
      const checkIns = Array.from({ length: 21 }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i);
        const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        return { id: 'c'+i, date: key, preoccupationMinutes: 100, urge: 4, avoidance: 'small', suds: 4 };
      });
      const baseline = { capturedAt: '2026-03-01T00:00:00Z', preoccupationMinutes: 240, urge: 8, avoidance: 'significant', suds: 8 };
      console.log(JSON.stringify(reclaimedByWeek(baseline, checkIns).map((w) => w.sampleSize)));
    `;
    const out = execFileSync(
      process.execPath,
      ['--experimental-strip-types', '--input-type=module', '--eval', script],
      { env: { ...process.env, TZ: 'America/New_York' }, encoding: 'utf8' }
    );
    assert.deepEqual(JSON.parse(out.trim().split('\n').pop()), [7, 7, 7]);
  });
});
