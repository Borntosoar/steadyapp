import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalise, emptyState, exportText, exportJson, importJson, MIGRATIONS, SCHEMA_VERSION,
  isFromNewerBuild, STORAGE_KEY, QUARANTINE_PREFIX, EXPORT_FILE,
} from '../lib/storage.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Persistence.
 *
 * This layer holds the only copy of somebody's private journal. There is no server and no
 * backup, so its failure modes are not inconveniences — they are the whole loss. These
 * tests exercise the boundary functions directly; the AsyncStorage-dependent paths
 * (quarantine, the write lock) are covered by their contract in lib/storage.ts and by the
 * load-failure assertions below. */

const full = () => ({
  ...emptyState(),
  profile: { firstName: 'Sam', onboardedAt: '2026-01-01T00:00:00Z', disclaimerAcceptedAt: '2026-01-01T00:00:00Z', supportRegion: 'uk' },
  baseline: { capturedAt: '2026-01-01T00:00:00Z', preoccupationMinutes: 240, urge: 8, avoidance: 'significant', suds: 8 },
  checkIns: [{ id: 'c1', date: '2026-01-02', preoccupationMinutes: 120, urge: 5, avoidance: 'small', suds: 5 }],
  thoughtRecords: [{
    id: 't1', date: '2026-01-03', situation: 'Passed a shop window',
    emotion: 'shame', emotionIntensity: 80, automaticThought: 'Everyone saw',
    distortions: ['Mind reading'], evidenceFor: 'Someone glanced',
    evidenceAgainst: 'Nobody said anything', balancedThought: 'A glance is a glance',
    reRatedIntensity: 40,
  }],
  experiments: [{
    id: 'e1', date: '2026-01-04', avoiding: 'Going to the shop unstyled',
    prediction: 'People will stare', likelihoodBefore: 90,
    safetyBehavioursDropped: 'the hat', outcome: 'Nobody looked up',
    comparison: 'Much less than predicted', likelihoodAfter: 20,
    conclusion: 'The prediction was the problem',
  }],
  urgeLogs: [{ id: 'u1', date: '2026-01-05', trigger: 'Bathroom mirror', wantedTo: 'check', intensityBefore: 7, intensityAfter: 3, resisted: true }],
});

describe('normalise is the type boundary', () => {
  test('a payload missing every field becomes a valid empty state', () => {
    const s = normalise({});
    assert.deepEqual(s.checkIns, []);
    assert.deepEqual(s.moments, {});
    assert.equal(s.entitlement.source, 'none');
  });

  test('garbage in place of a collection is coerced, not propagated', () => {
    /* JSON.parse returns `any`, and spreading `any` makes the whole literal `any`, so tsc
       will certify a stored scalar as a CheckIn[]. Without this coercion the first
       `.filter` on the home screen throws and the app cannot start at all. */
    const s = normalise({ checkIns: 'not an array', practice: 42, readModules: null });
    assert.deepEqual(s.checkIns, []);
    assert.deepEqual(s.practice, []);
    assert.deepEqual(s.readModules, []);
  });

  test('a moment record missing fields is backfilled, not left short', () => {
    /* The specific consequence of not doing this: `shows` is undefined, `shows + 1` is
       NaN, and `NaN >= maxShows` is false — so the moment can never retire and the app
       interrupts the user forever. */
    const s = normalise({ moments: { 'week-one-ask': { acted: false } } });
    const rec = s.moments['week-one-ask'];
    assert.equal(rec.shows, 0);
    assert.equal(rec.dismissals, 0);
    assert.equal(rec.lastShownDate, null);
    assert.ok(Number.isFinite(rec.shows + 1));
  });

  /* The one field where failing toward access would be wrong. Everywhere else a corrupted
     byte should err generously; here it would mean garbage granting a free subscription,
     and a real purchase is two taps away via Restore. */
  test('a malformed entitlement becomes none rather than being trusted', () => {
    assert.equal(normalise({ entitlement: 'yes' }).entitlement.source, 'none');
    assert.equal(normalise({ entitlement: { source: 'admin' } }).entitlement.source, 'none');
    assert.equal(normalise({ entitlement: {} }).entitlement.source, 'none');
  });

  test('a real entitlement survives, with unknown plans dropped', () => {
    const e = normalise({
      entitlement: { source: 'purchase', plan: 'nonsense', expiresAt: null, verifiedAt: null },
    }).entitlement;
    assert.equal(e.source, 'purchase');
    assert.equal(e.plan, null);
  });

  test('real data passes through unchanged', () => {
    const s = normalise(full());
    assert.equal(s.checkIns.length, 1);
    assert.equal(s.thoughtRecords[0].automaticThought, 'Everyone saw');
    assert.equal(s.profile.firstName, 'Sam');
  });
});

describe('schema versioning', () => {
  test('there is a migration slot for every version', () => {
    assert.ok(MIGRATIONS.length >= SCHEMA_VERSION, 'a version was bumped without a migration slot');
  });

  test('an unversioned payload is treated as the pre-envelope shape and survives', () => {
    // Written before `moments` and `trialStartedAt` existed.
    const legacy = { ...full() };
    delete legacy.moments;
    delete legacy.entitlement;
    const s = importJson(JSON.stringify(legacy));
    assert.ok(s, 'a legacy payload failed to import');
    assert.equal(s.checkIns.length, 1);
    assert.deepEqual(s.moments, {});
    assert.equal(s.entitlement.source, 'none');
  });

  /* The 3 -> 4 migration is the first that derives a value rather than filling a default,
     which is what the MIGRATIONS slot was built for. */
  test('a mid-trial user keeps the remainder of the trial', () => {
    const started = new Date();
    started.setDate(started.getDate() - 10);
    const legacy = { ...full(), entitled: true, trialStartedAt: started.toISOString() };
    delete legacy.entitlement;
    const e = importJson(JSON.stringify(legacy)).entitlement;
    assert.equal(e.source, 'trial');
    assert.ok(new Date(e.expiresAt) > new Date(), 'the remaining trial days were lost');
  });

  test('a paying user with no trial stamp keeps access rather than being revoked', () => {
    // The old model recorded neither plan nor expiry, so the only safe reading is an
    // entitlement that does not expire. Their next provider refresh replaces it with truth.
    const legacy = { ...full(), entitled: true };
    delete legacy.entitlement;
    delete legacy.trialStartedAt;
    const e = importJson(JSON.stringify(legacy)).entitlement;
    assert.equal(e.source, 'purchase');
    assert.equal(e.expiresAt, null);
  });

  test('a non-paying user stays non-paying', () => {
    const legacy = { ...full(), entitled: false };
    delete legacy.entitlement;
    const e = importJson(JSON.stringify(legacy)).entitlement;
    assert.equal(e.source, 'none');
  });

  test('a versioned envelope round-trips', () => {
    const s = importJson(exportJson(full()));
    assert.ok(s);
    assert.equal(s.thoughtRecords[0].balancedThought, 'A glance is a glance');
  });
});

describe('import refuses things that are not backups', () => {
  test('malformed JSON returns null rather than throwing', () => {
    assert.equal(importJson('{ not json'), null);
    assert.equal(importJson(''), null);
  });

  test('a JSON file that is not a Anneal backup is rejected', () => {
    // Silently replacing somebody's journal with their shopping list would be unforgivable.
    assert.equal(importJson('{"items":["milk"]}'), null);
    assert.equal(importJson('[1,2,3]'), null);
  });
});

describe('export is a backup, not a progress summary', () => {
  const txt = exportText(full());

  test('it contains what the user actually wrote', () => {
    /* This used to emit `Thought records completed: 1` and discard every word. A user who
       exported monthly and kept the files still could not read back a single thing they
       had written. */
    assert.match(txt, /Passed a shop window/);
    assert.match(txt, /Everyone saw/);
    assert.match(txt, /A glance is a glance/);
  });

  test('it contains predictions and outcomes', () => {
    // SAFETY.md §11 freezes these so memory cannot rewrite them. Dropping them from the
    // export defeats the point of freezing them.
    assert.match(txt, /People will stare/);
    assert.match(txt, /Nobody looked up/);
    assert.match(txt, /The prediction was the problem/);
  });

  test('it contains the urge log, not just a count', () => {
    assert.match(txt, /Bathroom mirror/);
  });

  test('it still contains no appearance value', () => {
    assert.doesNotMatch(txt, /attractive|ugly|rating out of|score \d+\/10 for looks/i);
  });

  test('an empty state exports without throwing', () => {
    assert.ok(exportText(emptyState()).length > 0);
  });
});

/* ---------- the hostile-payload suite ----------
 *
 * Added after a security review found `normalise` was documented as "the type boundary" and
 * implemented as `{ ...base, ...p }` — a merge, which passed every key of the stored blob
 * straight into application state. Each test below corresponds to a failure reproduced by
 * execution against the old implementation, and every one of them ended the same way: an
 * unhandled TypeError on the launch screen, which with no error boundary meant a blank app
 * with no crisis numbers and no route to the only copy of the person's writing.
 *
 * The threat here is almost never an attacker. It is a partial write, a field rename, or
 * the import path that already exists getting wired up. */
describe('normalise survives a hostile or corrupt payload', () => {
  test('keys that are not part of AppState do not survive', () => {
    /* THE CRITICAL ONE. The store merges this object into itself and zustand's setState is
       an Object.assign, so store METHODS are ordinary properties on the target: a stored key
       called `logPractice` overwrote the function called `logPractice`. Reproduced before
       the fix as `logPractice: string "pwned"`, then TypeError on the first render. */
    const s = normalise({ checkedInToday: 1, logPractice: 'pwned', reset: null, __proto__: { x: 1 } });
    assert.equal(s.checkedInToday, undefined);
    assert.equal(s.logPractice, undefined);
    assert.ok(!('reset' in s));
    assert.deepEqual(Object.keys(s).sort(), Object.keys(emptyState()).sort());
  });

  test('the nested arrays are coerced, not only the top-level collections', () => {
    // `protocol` and `streak` were merged as plain objects, so their arrays got nothing.
    // `weekProgress` — called on the launch screen — threw "number 5 is not iterable".
    const s = normalise({
      protocol: { weekPracticeDates: 5, completedWeeks: 'x', avoidedConditions: {} },
      streak: { frozenDates: 7 },
    });
    assert.ok(Array.isArray(s.protocol.weekPracticeDates));
    assert.ok(Array.isArray(s.protocol.completedWeeks));
    assert.ok(Array.isArray(s.protocol.avoidedConditions));
    assert.ok(Array.isArray(s.streak.frozenDates));
  });

  test('a malformed row is dropped rather than propagated to the first screen that reads it', () => {
    const s = normalise({
      checkIns: [null, 'nope', { date: 20260101 }, { id: 'ok', date: '2026-01-02' }],
      practice: [{ id: 'p', date: '2026-01-02', kind: 'not-a-kind' }, { id: 'q', date: '2026-01-02', kind: 'checkin' }],
    });
    assert.equal(s.checkIns.length, 1);
    assert.equal(s.checkIns[0].date, '2026-01-02');
    assert.equal(s.practice.length, 1, 'an unknown practice kind should not survive');
  });

  test('every surviving row has the fields the screens read off it', () => {
    const s = normalise({ checkIns: [{ date: '2026-01-02' }], urgeLogs: [{ date: '2026-01-02' }] });
    for (const c of s.checkIns) {
      assert.equal(typeof c.id, 'string');
      assert.ok(Number.isFinite(c.preoccupationMinutes));
      assert.ok(['none', 'small', 'significant'].includes(c.avoidance));
    }
    for (const u of s.urgeLogs) assert.equal(typeof u.resisted, 'boolean');
  });

  test('non-finite numbers never reach the figure the whole product is sold on', () => {
    /* Unguarded, a stored "abc" produced hours=NaN and a stored -99999 produced 11694.6
       hours reclaimed — rendered at hero size on the home screen as the one number the user
       is asked to trust. */
    const s = normalise({
      checkIns: [
        { id: 'a', date: '2026-01-02', preoccupationMinutes: 'abc' },
        { id: 'b', date: '2026-01-03', preoccupationMinutes: Infinity },
      ],
      baseline: { capturedAt: 'x', preoccupationMinutes: NaN },
    });
    for (const c of s.checkIns) assert.ok(Number.isFinite(c.preoccupationMinutes));
    assert.equal(s.baseline, null, 'a baseline with no usable figure is not a baseline');
  });

  test('a moment record with wrong-typed fields is repaired, not merely backfilled', () => {
    /* The merge repaired a MISSING field and kept a WRONG-TYPED one, which is the bug it was
       written to prevent: shows of "abc" makes `shows + 1` the string "abc1", and
       `"abc1" >= maxShows` is false, so the prompt can never retire. */
    const s = normalise({ moments: { 'week-one-ask': { shows: 'abc', acted: 'no' } } });
    assert.equal(s.moments['week-one-ask'].shows, 0);
    assert.equal(s.moments['week-one-ask'].acted, false);
  });

  test('a crafted moments key cannot replace the map prototype', () => {
    /* `moments[k] = …` with k of "__proto__" set the prototype of the map. A payload
       setting it to { 'trial-ending': { acted: true } } made nextMoment() read `acted`
       through the prototype and permanently retire the trial-ending notice — silencing the
       billing warning the paywall explicitly promises. Note `k in MOMENTS` does NOT fix
       this: `in` walks the prototype chain, so '__proto__' in MOMENTS is true. */
    const s = normalise(JSON.parse('{"moments":{"__proto__":{"trial-ending":{"acted":true}}}}'));
    assert.equal(Object.getPrototypeOf(s.moments), Object.prototype);
    assert.equal(s.moments['trial-ending'], undefined);
  });

  test('a stored baseline that is not an object cannot masquerade as one', () => {
    // `baseline: 5` is truthy, so computeReclaimed walked past its `if (!baseline)` guard.
    for (const bad of [5, 'x', [], true]) assert.equal(normalise({ baseline: bad }).baseline, null);
  });

  test('exportText never throws, whatever came out of normalise', () => {
    /* The recovery path must not be the first thing to break. It is free on every tier and,
       because the container is excluded from iCloud backup, it is the only copy that
       survives a dead phone — and the copy prompt fires precisely when saving has failed. */
    const hostile = [
      { checkIns: [null] }, { checkIns: [{ date: 12345 }] }, { urgeLogs: [null] },
      { mirrorSessions: [null] }, { experiments: [null] }, { practice: [null] },
      { protocol: { weekPracticeDates: 5 } }, { baseline: 5 }, {},
    ];
    for (const h of hostile) {
      const s = normalise(h);
      assert.equal(typeof exportText(s), 'string');
      assert.equal(typeof exportJson(s), 'string');
    }
  });
});

describe('migrations are safe to re-apply', () => {
  test('every migration is idempotent', () => {
    /* MIGRATIONS[3] was not. Applied twice it found no `entitled` field, took the !entitled
       branch, and replaced a real purchase with emptyEntitlement() — a paying customer
       silently losing access with no receipt check wired up to give it back. The realistic
       trigger is a TestFlight build followed by an App Store build. */
    const sample = {
      entitled: true,
      entitlement: { source: 'purchase', plan: 'yearly', expiresAt: null, verifiedAt: '2026-08-01T00:00:00Z' },
      checkIns: [{ id: 'c', date: '2026-01-02' }],
    };
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const once = MIGRATIONS[i](structuredClone(sample));
      const twice = MIGRATIONS[i](structuredClone(once));
      assert.deepEqual(twice, once, `MIGRATIONS[${i}] is not idempotent`);
    }
  });

  test('a re-run of the entitlement migration does not revoke a purchase', () => {
    const paid = { entitlement: { source: 'purchase', plan: 'yearly', expiresAt: null, verifiedAt: '2026-08-01T00:00:00Z' } };
    assert.equal(MIGRATIONS[3](structuredClone(paid)).entitlement.source, 'purchase');
  });

  test('a payload from a newer build is not readable and must not be re-stamped', () => {
    /* Reading a v(N+1) payload with a vN build skipped the loop, normalised what it
       understood, and wrote it back stamped vN — data still in the newer shape, version
       downgraded, so the next upgrade re-ran a migration over already-migrated data. */
    assert.equal(isFromNewerBuild(SCHEMA_VERSION + 1), true);
    assert.equal(isFromNewerBuild(SCHEMA_VERSION), false);
    assert.equal(isFromNewerBuild(SCHEMA_VERSION - 1), false);
  });
});

describe('the storage keys survive a rename of the app', () => {
  /* THE FAILURE THIS EXISTS FOR. The app was renamed twice, Steady → Cairn → Anneal, ~300 occurrences
     in 40 files. These two strings, and `steady.device.key.v1` in hooks/deviceKey.ts, were
     the only ones deliberately left alone — they are not brand, they are where real data
     already lives.

     A find-and-replace does not know that. Changing them looks like finishing the rename and
     behaves like deleting every user's twelve weeks of journal, urges and streak: the app
     reads an empty key, writes a fresh empty state, and the real record sits on the device
     at the old address with nothing pointing at it. It is silent, it is not an exception,
     and the first report of it is somebody saying their history is gone.

     If these ever genuinely need to change, write the read-old-write-new migration first and
     then change this test on purpose. */
  test('the state key is exactly the one already on every device', () => {
    assert.equal(STORAGE_KEY, 'steady.state.v2');
  });

  test('the quarantine prefix is unchanged, because quarantined data can least afford it', () => {
    assert.equal(QUARANTINE_PREFIX, 'steady.unreadable.');
  });
});

describe('a cleartext export cannot outlive the share sheet', () => {
  /* Both export paths write the WHOLE JOURNAL in cleartext to the cache, hand it to
     Share.share, and delete it in a `finally`. A `finally` does not run when the process is
     killed, and while the iOS share sheet is up the app is backgrounded and jetsammable. So
     a plaintext copy of every thought record, every urge trigger and the relapse plan's
     whoToTell could be left in the container — the exact file-level threat lib/crypto.ts
     exists to defend against, undone by the button next to it. Worse, nothing swept it, so it
     also survived "Delete everything".

     EXPORT_FILE is what the sweep matches on, so these are tests of the pattern: it has to
     catch every name the app can write, and nothing else in a directory it does not own. */

  const matches = (name) => EXPORT_FILE.test(name);

  test('it matches every filename the export paths can produce', () => {
    /* The three literals in app/(tabs)/progress.tsx and components/CrashScreen.tsx. */
    for (const name of ['anneal-backup-2026-08-26.json', 'anneal-summary-2026-08-26.txt',
                        'anneal-backup-2024-01-01.json']) {
      assert.ok(matches(name), `the sweep would leave ${name} behind`);
    }
  });

  test('the names in the source are the names the sweep looks for', () => {
    /* Derived, not restated. If somebody renames an export, this fails rather than the sweep
       quietly stopping at the old prefix. */
    const sources = ['app/(tabs)/progress.tsx', 'components/CrashScreen.tsx']
      .map((rel) => readFileSync(join(ROOT, rel), 'utf8')).join('\n');
    const names = [...sources.matchAll(/`(anneal-[a-z]+-\$\{[^`]*?\}\.(?:json|txt))`/g)]
      .map((m) => m[1].replace(/\$\{[^}]*\}/, '2026-08-26'));
    assert.ok(names.length >= 2, `only found ${names.length} export filenames in the source`);
    for (const n of names) {
      assert.ok(matches(n), `the export writes "${n}" and the sweep does not match it`);
    }
  });

  test('it leaves everything it does not own alone', () => {
    /* The sweep runs over a shared cache directory at every launch. Deleting somebody else's
       file — or a half-written one of ours under a temp name — would be a worse bug than the
       one it fixes. */
    for (const name of ['photo.json', 'anneal.json', 'anneal-backup.json',
                        'anneal-backup-2026-08-26.json.tmp', 'my-anneal-backup-2026-08-26.json',
                        'anneal-backup-yesterday.json', 'ExponentAsset-abc123.png',
                        'anneal-backup-2026-08-26.pdf', 'RCTAsyncLocalStorage']) {
      assert.ok(!matches(name), `the sweep would delete ${name}, which is not its file`);
    }
  });

  test('wipeState sweeps them, so "delete everything" means everything', () => {
    /* The button's copy says it erases "every check-in, every note, your plan and your
       history". A cleartext backup of all four surviving in the cache makes that false. */
    const storage = readFileSync(join(ROOT, 'lib/storage.ts'), 'utf8');
    const body = storage.slice(storage.indexOf('export async function wipeState'));
    const fn = body.slice(0, body.indexOf('\n}\n') + 3);
    assert.match(fn, /sweepExports\(\)/,
      'wipeState no longer sweeps the exports — a plaintext backup survives "Delete everything"');
  });

  test('and it runs at launch, for the file a kill already orphaned', () => {
    const store = readFileSync(join(ROOT, 'store/useStore.ts'), 'utf8');
    assert.match(store, /hydrate: async \(\) => \{[\s\S]{0,600}?sweepExports\(\)/,
      'nothing sweeps at launch, so a file orphaned by a kill stays until the next wipe');
  });
});
