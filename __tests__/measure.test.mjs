import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PHQ8, GAD7, INSTRUMENTS, CHOICES } from '../content/measure.ts';
import {
  score, scores, isComplete, completed, baselineOf, latestOf, MAX, RELIABLE_CHANGE,
  DUE_DAYS, dueMilestone, baselineOwed, daysBetween, changeSince, progressSoFar, changeSentence,
} from '../lib/measure.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* PHQ-8 and GAD-7.
 *
 * This is the only clinical instrument in the app, and it is the one place where the usual
 * house rules invert: everywhere else a test asks whether the copy is plain enough, and here
 * a test asks whether the copy is UNCHANGED. A reworded item is not a friendlier item, it is
 * a different question with the old question's scoring attached. */

const sitting = (takenAt, phq, gad, milestone = null) => ({
  id: `m-${takenAt}`, takenAt, phq8: phq, gad7: gad, milestone,
});
const flat = (n, v) => Array.from({ length: n }, () => v);
const okPhq = (v = 1) => flat(8, v);
const okGad = (v = 1) => flat(7, v);

describe('the instrument text is frozen', () => {
  /* A checksum rather than a copy of the strings: a second copy of the items in this file
     would be a second thing to edit, and somebody "fixing" both is exactly as likely as
     somebody fixing one. The hash cannot be satisfied by editing it thoughtfully. */
  const digest = (items) => createHash('sha256').update(items.join(' ')).digest('hex').slice(0, 16);

  test('PHQ-8 still asks the eight published questions, verbatim', () => {
    assert.equal(PHQ8.items.length, 8, 'PHQ-8 no longer has eight items');
    assert.equal(digest(PHQ8.items), '7d40295609b9654d',
      'a PHQ-8 item has been edited. Scores from the edited wording are NOT comparable to '
      + 'scores from before it, and not comparable to the literature at all. If this was a '
      + 'reading-level or tone change, revert it: content/measure.ts explains why this file '
      + 'is exempt from __tests__/copy.test.mjs.');
  });

  test('GAD-7 still asks the seven published questions, verbatim', () => {
    assert.equal(GAD7.items.length, 7, 'GAD-7 no longer has seven items');
    assert.equal(digest(GAD7.items), '94c7a155365ca5f2',
      'a GAD-7 item has been edited — see the PHQ-8 message above');
  });

  test('the four response options are the published ones, in order', () => {
    assert.deepEqual(CHOICES.map((c) => c.label),
      ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']);
    assert.deepEqual(CHOICES.map((c) => c.value), [0, 1, 2, 3],
      'the response values no longer run 0–3, so every total is on a different scale');
  });

  test('it is PHQ-8 and not PHQ-9 — the suicidality item is absent', () => {
    /* PHQ-9's ninth item. content/survey.ts asks this question properly, as an explicit tile
       that ends the survey and opens Support; a 0–3 frequency scale is a worse way to ask it
       and a worse thing to do with the answer. If this item ever appears here, the crisis
       routing has to be built before it ships, not after. */
    const all = PHQ8.items.join(' ').toLowerCase();
    assert.doesNotMatch(all, /better off dead|hurting yourself|harming yourself/,
      'a self-harm item has been added to PHQ-8. That makes this PHQ-9, and PHQ-9 item 9 '
      + 'must route to Support rather than sit in a total. See content/survey.ts.');
  });
});

describe('nothing here turns a number into a label', () => {
  /* The rule content/measure.ts states and this enforces. A severity band is a diagnosis in
     everything but liability, and the app's disclaimer says it does not diagnose. */
  const BANDS = /\b(minimal|mild|moderately severe|moderate|severe)\b/i;

  test('no severity word appears in the measure source', () => {
    for (const rel of ['content/measure.ts', 'lib/measure.ts', 'app/measure.tsx']) {
      const src = readFileSync(join(ROOT, rel), 'utf8')
        /* Comments may DISCUSS bands — the point is that none is rendered. */
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
      assert.doesNotMatch(src, BANDS,
        `${rel} contains a severity band. lib/measure.ts must not gain a function that turns `
        + `a total into a word, because the moment one exists somebody will render it.`);
    }
  });

  test('the not-a-diagnosis line is on the screen that shows the numbers', () => {
    const src = readFileSync(join(ROOT, 'app/measure.tsx'), 'utf8');
    assert.match(src, /MEASURE_NOT_A_DIAGNOSIS/,
      'the screen prints two clinical totals without the sentence saying what they are not');
  });
});

describe('a partial instrument produces no score', () => {
  test('a complete one does', () => {
    assert.equal(score('phq8', okPhq(1)), 8);
    assert.equal(score('gad7', okGad(2)), 14);
    assert.equal(score('phq8', flat(8, 3)), MAX.phq8);
    assert.equal(score('gad7', flat(7, 3)), MAX.gad7);
  });

  test('one answer short is null, not a smaller total', () => {
    /* The bug this prevents: seven answers summed to 7 looks exactly like a complete PHQ-8
       of 7 on a chart, and is not one. */
    assert.equal(score('phq8', flat(7, 1)), null);
    assert.equal(score('gad7', flat(6, 1)), null);
  });

  test('one answer too many is null as well', () => {
    assert.equal(score('phq8', flat(9, 1)), null, 'a nine-item PHQ was scored as if it were PHQ-8');
  });

  test('values outside the response set are null', () => {
    for (const bad of [-1, 4, 1.5, NaN, Infinity]) {
      const a = okPhq(0); a[3] = bad;
      assert.equal(score('phq8', a), null, `${bad} was accepted as a response`);
    }
  });

  test('non-arrays and junk are null rather than throwing', () => {
    for (const bad of [undefined, null, 'seven', {}, 12]) {
      assert.equal(score('phq8', bad), null);
    }
  });

  test('a sitting is complete only when both instruments scored', () => {
    assert.equal(isComplete(sitting('2026-01-01T00:00:00Z', okPhq(), okGad())), true);
    assert.equal(isComplete(sitting('2026-01-01T00:00:00Z', okPhq(), flat(6, 1))), false);
    assert.equal(isComplete(sitting('2026-01-01T00:00:00Z', flat(7, 1), okGad())), false);
  });
});

describe('ordering never trusts insertion order', () => {
  /* An imported backup can arrive in any order, and two screens sorting separately is how
     they end up disagreeing about which sitting was first. */
  const a = sitting('2026-03-01T00:00:00Z', okPhq(1), okGad(1));
  const b = sitting('2026-01-01T00:00:00Z', okPhq(2), okGad(2));
  const c = sitting('2026-02-01T00:00:00Z', okPhq(3), okGad(3));

  test('the baseline is the earliest complete sitting, whatever order it is stored in', () => {
    assert.equal(baselineOf([a, b, c]).takenAt, b.takenAt);
    assert.equal(baselineOf([c, a, b]).takenAt, b.takenAt);
  });

  test('the latest is the most recent', () => {
    assert.equal(latestOf([b, c, a]).takenAt, a.takenAt);
  });

  test('incomplete sittings are kept but never become the baseline', () => {
    /* Kept because the answers are the person's; excluded because comparing a complete
       sitting to a partial one is the same error as scoring a partial one. */
    const partial = sitting('2025-12-01T00:00:00Z', flat(4, 1), okGad());
    assert.equal(baselineOf([partial, b]).takenAt, b.takenAt,
      'an incomplete sitting became the baseline every later score is compared against');
    assert.equal(completed([partial, b]).length, 1);
  });

  test('nothing complete yet means no baseline rather than a throw', () => {
    assert.equal(baselineOf([]), null);
    assert.equal(latestOf([]), null);
  });
});

describe('when it asks again', () => {
  const base = sitting('2026-01-01T00:00:00Z', okPhq(1), okGad(1));
  const at = (days) => new Date(Date.parse(base.takenAt) + days * 86400000).toISOString();

  test('nothing is due before day 30', () => {
    for (const d of [0, 1, 29]) {
      assert.equal(dueMilestone([base], at(d)), null, `something came due on day ${d}`);
    }
  });

  test('day 30 comes due on day 30, not 29 and a half', () => {
    assert.equal(dueMilestone([base], at(29)), null);
    assert.equal(dueMilestone([base], at(30)), 30);
  });

  test('answering day 30 clears it and day 60 is next', () => {
    const m30 = sitting(at(30), okPhq(1), okGad(1), 30);
    assert.equal(dueMilestone([base, m30], at(31)), null);
    assert.equal(dueMilestone([base, m30], at(60)), 60);
  });

  test('four months away asks once, for day 90 — not three times', () => {
    /* Somebody who ignores the app for a season should not be handed three questionnaires
       in a row for having been away. */
    assert.equal(dueMilestone([base], at(200)), 90);
  });

  test('a voluntary retake does not satisfy a scheduled ask', () => {
    /* milestone null. Somebody who retook the questionnaires on day 12 out of interest is
       still owed the day-30 reading, or the series has a hole exactly where the claim is. */
    const voluntary = sitting(at(12), okPhq(1), okGad(1), null);
    assert.equal(dueMilestone([base, voluntary], at(30)), 30);
  });

  test('with no baseline, nothing is ever due', () => {
    assert.equal(dueMilestone([], at(90)), null);
  });

  test('an unreadable timestamp is null rather than a wrong answer', () => {
    assert.equal(daysBetween('not a date', at(30)), null);
    assert.equal(dueMilestone([sitting('nonsense', okPhq(), okGad())], at(90)), null);
  });

  test('the schedule is the one in DIRECTION.md', () => {
    assert.deepEqual([...DUE_DAYS], [30, 60, 90]);
  });
});

describe('a skip is an answer that survives a restart', () => {
  const now = '2026-01-10T00:00:00Z';
  const ago = (days) => new Date(Date.parse(now) - days * 86400000).toISOString();

  test('never asked, no baseline: owed', () => {
    assert.equal(baselineOwed([], null, now), true);
  });

  test('just skipped: not owed', () => {
    /* The behaviour that gets a mental-health app deleted is asking again on next launch. */
    assert.equal(baselineOwed([], ago(0), now), false);
    assert.equal(baselineOwed([], ago(2), now), false);
  });

  test('skipped three days ago: offered once more', () => {
    assert.equal(baselineOwed([], ago(3), now), true);
  });

  test('already answered: never owed, however long ago they skipped', () => {
    const done = [sitting(ago(40), okPhq(), okGad())];
    assert.equal(baselineOwed(done, ago(30), now), false);
    assert.equal(baselineOwed(done, null, now), false);
  });
});

describe('a change is only claimed when it is bigger than the noise', () => {
  const base = sitting('2026-01-01T00:00:00Z', okPhq(2), okGad(2)); // phq 16, gad 14

  test('one point is not an improvement, it is being asked twice', () => {
    const a = sitting('2026-01-01T00:00:00Z', [2, 2, 2, 2, 2, 2, 2, 2], okGad(2));
    const b = sitting('2026-02-01T00:00:00Z', [1, 2, 2, 2, 2, 2, 2, 2], okGad(2));
    const c = changeSince(a, b, 'phq8');
    assert.equal(c.delta, -1);
    assert.equal(c.meaningful, false);
    assert.equal(c.direction, 'flat');
  });

  test('the published thresholds are the ones used', () => {
    assert.equal(RELIABLE_CHANGE.phq8, 5);
    assert.equal(RELIABLE_CHANGE.gad7, 4);
  });

  test('a drop that clears the threshold reads as down', () => {
    const b = sitting('2026-02-01T00:00:00Z', flat(8, 1), okGad(2)); // phq 8, was 16
    const c = changeSince(base, b, 'phq8');
    assert.equal(c.direction, 'down');
    assert.equal(c.meaningful, true);
  });

  test('a rise reads as up and is not softened', () => {
    const b = sitting('2026-02-01T00:00:00Z', flat(8, 3), okGad(2)); // phq 24, was 16
    assert.equal(changeSince(base, b, 'phq8').direction, 'up');
  });

  test('an incomplete sitting on either side is null, not a comparison', () => {
    const partial = sitting('2026-02-01T00:00:00Z', flat(5, 1), okGad(2));
    assert.equal(changeSince(base, partial, 'phq8'), null);
    assert.equal(changeSince(partial, base, 'phq8'), null);
  });

  test('one sitting is not a series', () => {
    assert.equal(progressSoFar([base]), null, 'a lone baseline produced a comparison');
    assert.equal(progressSoFar([]), null);
  });

  test('the sentence never congratulates and never scolds', () => {
    /* An app that celebrates a falling depression score has told somebody their rising one
       is a failure, and it will say so on the worst fortnight of their year. */
    const worse = sitting('2026-02-01T00:00:00Z', flat(8, 3), okGad(2));
    const better = sitting('2026-02-01T00:00:00Z', flat(8, 0), okGad(2));
    for (const other of [worse, better]) {
      const s = changeSentence(changeSince(base, other, 'phq8'));
      assert.doesNotMatch(s, /well done|great|congratulations|proud|sorry|unfortunately|worse|failing/i,
        `the change sentence editorialises: "${s}"`);
    }
  });

  test('and says something rather than nothing when there is no comparison', () => {
    assert.match(changeSentence(null), /\w/);
  });
});

describe('the measure is free, and reachable', () => {
  test('the screen consults no billing state', () => {
    /* It is how a person tells whether the thing they are paying for is working. Putting it
       behind the payment would be the worst available thing to charge for, and SAFETY.md's
       free-forever list exists for this shape of reasoning. */
    const src = readFileSync(join(ROOT, 'app/measure.tsx'), 'utf8');
    for (const t of ['entitled', 'paywall', 'useEntitlement', 'isEntitled', 'Anneal+']) {
      assert.ok(!src.includes(t), `app/measure.tsx references ${t} — the measure must never be gated`);
    }
  });

  test('onboarding ends by offering it', () => {
    const src = readFileSync(join(ROOT, 'app/onboarding/index.tsx'), 'utf8');
    assert.match(src, /router\.replace\('\/measure'\)/,
      'onboarding no longer routes to the baseline questionnaires, so day zero is never captured');
  });

  test('the store appends sittings rather than replacing them', () => {
    /* A retake that overwrote the baseline would delete the only number the 30/60/90
       comparison is made against. */
    const src = readFileSync(join(ROOT, 'store/useStore.ts'), 'utf8');
    /* The INTERFACE declares both names before either is implemented, so slicing from the
       first occurrence of each captured the two type signatures and no code — a guard that
       reads a declaration instead of a body is one of the shapes that has already asserted
       nothing in this repository. Anchor on the implementation, which is the one followed
       by a body. */
    const start = src.indexOf('saveMeasure: (phq8, gad7, milestone) => {');
    assert.notEqual(start, -1, 'saveMeasure is no longer implemented under that signature');
    const fn = src.slice(start, src.indexOf('skipMeasure: () => {', start));
    assert.match(fn, /\.\.\.s\.measures/, 'saveMeasure does not append to the existing sittings');
  });

  test('every route that renders an instrument is a real file', () => {
    const walk = (d) => readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
    assert.ok(walk(join(ROOT, 'app')).some((p) => p.endsWith('measure.tsx')));
  });
});
