import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalise, emptyState, MIGRATIONS, SCHEMA_VERSION, isFromNewerBuild, importJson,
} from '../lib/storage.ts';
import { score, dueMilestone } from '../lib/measure.ts';
import { cyclesFor, actualSeconds, resetStepAt, modeFromName, modeFromParam } from '../lib/still.ts';
import { isEntitled, effectiveWeek, isGated } from '../lib/entitlement.ts';
import { WEEKS_TOTAL } from '../lib/protocol.ts';

/* Property-based fuzzing.
 *
 * Every other test here is example-based: somebody thought of a case and wrote it down. This
 * generates cases nobody thought of, and asserts INVARIANTS rather than outputs.
 *
 * IT EARNED ITS PLACE. The first run found two defects that 1417 example tests did not:
 *
 *   · `normalise` never clamped `protocol.currentWeek` to the protocol's own range, so a
 *     corrupted or hand-edited backup carrying week 999, 0, 1.5 or -5 reached the screens.
 *     The negative case is the serious one: `effectiveWeek` is
 *     `entitled ? week : Math.min(week, maxWeek)`, and `Math.min(-5, 1)` is -5 — so the
 *     free-tier clamp that everything else trusts passed a negative week straight through,
 *     and Practice offered "Week -5 of 12".
 *   · `cyclesFor(1e308)` returned Infinity, from a function whose whole contract is "a whole
 *     number of breaths".
 *
 * AND IT CAUGHT A BUG IN ITSELF, which is the more useful lesson. `isGated` and
 * `effectiveWeek` take a BOOLEAN; the first draft passed an Entitlement object. Every object
 * is truthy, so every iteration took the `if (entitled) return false` fast path — the
 * free-route property reported PASS while never once consulting the free-route list. A
 * vacuous pass on the only safety invariant in the file. Both properties below now force the
 * unentitled branch explicitly rather than hoping the generator produces it.
 *
 * THE SEED IS FIXED, so a failure is reproducible and CI cannot flake. `scripts/fuzz.mjs`
 * runs the same properties with SEED= and N= to search harder before a release. */

const SEED_START = 20260828;
let SEED = SEED_START;
const rnd = () => {
  SEED = (SEED * 1664525 + 1013904223) >>> 0;
  return SEED / 4294967296;
};
/** Each property starts from the same seed, so one failing does not shift the others. */
const reseed = () => { SEED = SEED_START; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Values chosen to be hostile — several have broken this codebase before. */
const NASTY = [
  undefined, null, NaN, Infinity, -Infinity, 0, -0, -1, 1e308, -1e308, 0.1 + 0.2,
  '', ' ', 'null', 'undefined', 'NaN', '0', '-1', 'Infinity',
  '__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty',
  true, false, [], {}, [[]], [{}],
  '1970-01-01T00:00:00Z', '2999-12-31T23:59:59Z', 'not a date', '2026-02-30T00:00:00Z',
  'x'.repeat(5000), Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER,
];
const nasty = () => pick(NASTY);

function junk(depth = 0) {
  const r = rnd();
  if (depth > 3 || r < 0.45) return nasty();
  if (r < 0.62) return Array.from({ length: int(0, 4) }, () => junk(depth + 1));
  const o = {};
  const keys = ['id', 'date', 'takenAt', 'v', 'data', 'phq8', 'gad7', 'milestone', 'kind',
    'suds', '__proto__', 'profile', 'protocol', 'x'];
  for (let i = 0; i < int(0, 5); i++) o[pick(keys)] = junk(depth + 1);
  return o;
}

/** A plausible state with a few fields corrupted — the realistic bad payload, and the one a
 *  purely random generator almost never produces. */
function corruptedState() {
  const s = JSON.parse(JSON.stringify(emptyState()));
  const keys = Object.keys(s);
  for (let i = 0; i < int(1, 4); i++) s[pick(keys)] = junk();
  if (rnd() < 0.5) s.measures = Array.from({ length: int(0, 3) }, () => junk());
  if (rnd() < 0.5) s.profile = junk();
  return s;
}

/** Runs `body` N times, collecting failure strings, and fails once with the first few. */
function forAll(n, body) {
  reseed();
  const bad = [];
  for (let i = 0; i < n; i++) {
    try { body((m) => bad.push(m)); } catch (e) { bad.push(`threw: ${e.message?.slice(0, 200)}`); }
    if (bad.length > 5) break;
  }
  assert.deepEqual(bad, [], `${bad.length} counterexample(s), seed ${SEED_START}:\n  ${bad.join('\n  ')}`);
}

const N = 1200;

describe('the persistence layer holds under arbitrary input', () => {
  test('normalise never throws, and always returns a usable state', () => {
    /* A normalise() that throws on a malformed payload is not a crash — it is somebody's
       journal, on a device with no server copy of it. */
    forAll(N, (fail) => {
      const input = rnd() < 0.5 ? junk() : corruptedState();
      const out = normalise(input);
      if (!out || typeof out !== 'object') return fail('normalise returned a non-object');
      for (const k of ['checkIns', 'urgeLogs', 'thoughtRecords', 'practice', 'measures', 'readModules']) {
        if (!Array.isArray(out[k])) return fail(`${k} is not an array`);
      }
      if (!out.profile || !out.entitlement) return fail('profile or entitlement missing');
      if (!Number.isFinite(out.streak?.current)) return fail('streak.current not finite');
      return undefined;
    });
  });

  test('and clamps the protocol week into the protocol', () => {
    /* THE DEFECT THIS FILE WAS WRITTEN FOR. `num()` alone only rejects non-finite values, so
       999, 0, -5 and 1.5 all survived and reached the screens. */
    forAll(N, (fail) => {
      const stored = pick([...NASTY, int(-500, 500), rnd() * 40 - 10]);
      const w = normalise({
        protocol: { currentWeek: stored, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] },
      }).protocol.currentWeek;
      if (!Number.isInteger(w) || w < 1 || w > WEEKS_TOTAL) {
        return fail(`currentWeek ${String(stored)} normalised to ${w}, outside 1..${WEEKS_TOTAL}`);
      }
      return undefined;
    });
  });

  test('normalise is idempotent', () => {
    /* Not a nicety: loadState normalises on read and saveState writes the result back, so a
       non-idempotent step rewrites the file differently on every launch. */
    forAll(N, (fail) => {
      const input = rnd() < 0.5 ? junk() : corruptedState();
      const a = normalise(input);
      const b = normalise(a);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        return fail(`not idempotent for ${JSON.stringify(input)?.slice(0, 120)}`);
      }
      return undefined;
    });
  });

  test('no payload can pollute Object.prototype', () => {
    forAll(200, (fail) => {
      normalise({
        moments: { __proto__: { evil: 1 }, ok: { shownAt: 'x' } },
        tracks: { __proto__: { evil: 1 } },
        profile: { __proto__: { evil: 1 } },
        measures: [{ __proto__: { evil: 1 }, takenAt: '2026-01-01T00:00:00Z', phq8: [], gad7: [] }],
      });
      if ({}.evil !== undefined) return fail('Object.prototype was polluted');
      return undefined;
    });
  });

  test('every migration is total and safe to re-apply', () => {
    /* A migration run twice already cost this project a paying customer's entitlement — see
       the idempotence guard in MIGRATIONS[3]. That is a property of the slot, not of one step. */
    forAll(400, (fail) => {
      const start = rnd() < 0.5 ? corruptedState() : junk();
      for (let v = 0; v < MIGRATIONS.length; v++) {
        const once = MIGRATIONS[v](JSON.parse(JSON.stringify(start ?? {})) ?? {});
        const twice = MIGRATIONS[v](JSON.parse(JSON.stringify(once)) ?? {});
        if (JSON.stringify(once) !== JSON.stringify(twice)) return fail(`MIGRATIONS[${v}] not idempotent`);
      }
      return undefined;
    });
  });

  test('importJson is total, and never accepts a payload from a newer build', () => {
    forAll(N, (fail) => {
      const v = pick([0, 1, 2, 3, 4, 5, 6, 99, -1, 'x', null, undefined, NaN]);
      const out = importJson(JSON.stringify({ v, data: rnd() < 0.5 ? corruptedState() : junk() }));
      if (out === null) return undefined;
      if (!Array.isArray(out.checkIns) || !out.profile) return fail('importJson returned a broken state');
      if (typeof v === 'number' && Number.isFinite(v) && isFromNewerBuild(v)) {
        return fail(`accepted a v${v} payload, newer than ${SCHEMA_VERSION} — the downgrade data-loss path`);
      }
      return undefined;
    });
  });
});

describe('the safety invariant holds under any entitlement state', () => {
  const FREE = ['/', '/checkin', '/grounding', '/support', '/onboarding', '/paywall', '/still', '/measure'];

  test('a free route is never gated, however broken the entitlement', () => {
    forAll(N, (fail) => {
      const entObj = rnd() < 0.5 ? junk() : {
        source: pick(['none', 'trial', 'purchase', 'hardship', 'nonsense', ...NASTY]),
        plan: nasty(), expiresAt: nasty(), verifiedAt: nasty(),
      };
      let ent;
      try { ent = isEntitled(entObj); } catch { return fail('isEntitled threw'); }
      if (typeof ent !== 'boolean') return fail(`isEntitled returned ${String(ent)}`);
      /* BOTH branches, and `false` unconditionally. Passing only the generated value is how
         the first draft of this property passed while testing nothing — see the header. */
      for (const entitled of [ent, false]) {
        for (const route of FREE) {
          if (isGated(route, entitled) === true) return fail(`${route} gated (entitled=${entitled})`);
        }
      }
      return undefined;
    });
  });

  test('effectiveWeek always lands on a real protocol week', () => {
    forAll(N, (fail) => {
      const stored = pick([...NASTY, int(-100, 100)]);
      const entObj = rnd() < 0.5 ? junk() : {
        source: pick(['none', 'trial', 'purchase', 'hardship']),
        plan: nasty(), expiresAt: nasty(), verifiedAt: nasty(),
      };
      let entitled; try { entitled = isEntitled(entObj) === true; } catch { entitled = false; }
      /* Through normalise, because that is the only route a week takes in the app — and
         fuzzing the raw value is what exposed that normalise did not clamp at all. */
      const viaStorage = normalise({
        protocol: { currentWeek: stored, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] },
      }).protocol.currentWeek;
      for (const e of [entitled, false, true]) {
        const w = effectiveWeek(viaStorage, e);
        if (!Number.isInteger(w) || w < 1 || w > WEEKS_TOTAL) {
          return fail(`effectiveWeek(${viaStorage}, ${e}) = ${w}`);
        }
      }
      return undefined;
    });
  });
});

describe('the clinical measure cannot invent a number', () => {
  test('score is null unless the instrument is complete and in range', () => {
    forAll(N, (fail) => {
      const len = int(0, 12);
      const answers = Array.from({ length: len }, () => pick([0, 1, 2, 3, ...NASTY]));
      const s = score('phq8', answers);
      const valid = len === 8 && answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 3);
      if (valid) {
        const want = answers.reduce((x, y) => x + y, 0);
        if (s !== want) return fail(`wrong total ${s} != ${want}`);
        if (s < 0 || s > 24) return fail(`out of range: ${s}`);
      } else if (s !== null) {
        return fail(`scored an invalid instrument (len=${len}) as ${s}`);
      }
      return undefined;
    });
  });

  test('a milestone is never re-asked, skipped, or invented', () => {
    forAll(N, (fail) => {
      const base = {
        id: 'b', takenAt: '2026-01-01T00:00:00Z',
        phq8: Array(8).fill(1), gad7: Array(7).fill(1), milestone: null,
      };
      const done = [];
      if (rnd() < 0.5) done.push(30);
      if (rnd() < 0.3) done.push(60);
      const all = [base, ...done.map((d) => ({
        id: `m${d}`,
        takenAt: new Date(Date.parse(base.takenAt) + d * 864e5).toISOString(),
        phq8: Array(8).fill(1), gad7: Array(7).fill(1), milestone: d,
      }))];
      const days = int(-10, 400);
      const now = new Date(Date.parse(base.takenAt) + days * 864e5).toISOString();
      const owed = dueMilestone(all, now);
      if (owed === null) return undefined;
      if (done.includes(owed)) return fail(`re-asked milestone ${owed}`);
      if (owed > days) return fail(`asked for day ${owed} on day ${days}`);
      if (![30, 60, 90].includes(owed)) return fail(`invented milestone ${owed}`);
      return undefined;
    });
  });
});

describe('Still is total for any length or link', () => {
  test('a session is a whole number of breaths and never overruns', () => {
    /* `cyclesFor(1e308)` returned Infinity before this. The overrun rule is carved out below
       one cycle, where a single cycle is the deliberate floor — a zero-cycle breathing
       exercise is a screen that ends as it opens. */
    forAll(N, (fail) => {
      const mins = pick([2, 3, 5, 1.75, 0.05, 0.9, 4.4, 10, 1e308, ...NASTY.filter((x) => typeof x === 'number')]);
      const cyc = cyclesFor(mins);
      if (!Number.isInteger(cyc) || cyc < 1) return fail(`cyclesFor(${mins}) = ${cyc}`);
      const CYCLE = 10;
      if (Number.isFinite(mins) && mins * 60 >= CYCLE && actualSeconds(mins) > mins * 60 + 1e-9) {
        return fail(`${mins} min runs ${actualSeconds(mins)}s`);
      }
      return undefined;
    });
  });

  test('mode resolution never escapes the closed set', () => {
    forAll(N, (fail) => {
      const v = nasty();
      const m = modeFromName(v);
      if (!['breathe', 'reset', 'float'].includes(m)) return fail(`modeFromName -> ${m}`);
      const p = modeFromParam(v);
      if (p !== null && !['breathe', 'reset', 'float'].includes(p)) return fail(`modeFromParam -> ${p}`);
      const r = resetStepAt(rnd() * 2000 - 500, pick([600, 1200, 0, -1, NaN]));
      if (r !== null && typeof r !== 'string') return fail(`resetStepAt -> ${typeof r}`);
      return undefined;
    });
  });
});
