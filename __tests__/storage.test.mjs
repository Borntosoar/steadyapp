import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalise, emptyState, exportText, exportJson, importJson, MIGRATIONS, SCHEMA_VERSION,
} from '../lib/storage.ts';

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
    assert.equal(s.entitled, false);
    assert.equal(s.trialStartedAt, null);
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

  test('a truthy non-boolean cannot grant entitlement', () => {
    assert.equal(normalise({ entitled: 'yes' }).entitled, false);
    assert.equal(normalise({ entitled: 1 }).entitled, false);
    assert.equal(normalise({ entitled: true }).entitled, true);
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
    delete legacy.trialStartedAt;
    const s = importJson(JSON.stringify(legacy));
    assert.ok(s, 'a legacy payload failed to import');
    assert.equal(s.checkIns.length, 1);
    assert.deepEqual(s.moments, {});
    assert.equal(s.trialStartedAt, null);
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

  test('a JSON file that is not a Steady backup is rejected', () => {
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
