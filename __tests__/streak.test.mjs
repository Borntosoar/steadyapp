import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    /* ⚠ THE CAP ALONE ASSERTED NOTHING. STARTING_FREEZES is 2 and MAX_FREEZES is 5, so
       `2 <= 5` passes whether or not a single freeze was ever earned. Making grantFreeze()
       return its input unchanged — disabling the silent-forgiveness mechanic this whole
       module exists for — left the suite green. Verified.
       So the arithmetic is asserted, not just the ceiling: sixty consecutive days is eight
       whole weeks, far past the cap, so the count must be sitting exactly on it. */
    assert.equal(s.freezesRemaining, MAX_FREEZES,
      'sixty consecutive days earned no freeze — grantFreeze is not being reached');
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

describe('the running streak is never rendered, only the longest run', () => {
  /* ⚠ THIS IS AN ARITHMETIC RULE, NOT A COPY RULE, and every other guard in this file is a
     copy rule. That gap is what let the defect stand.
     lib/streak.ts is careful in every way a STRING can be careful — silent freezes, no red,
     `longest` preserved through a restart, hard-day taps counting, and the suite above
     checking every message for shaming language and appearance references. Then
     `app/(tabs)/index.tsx` printed `streak.current` at the top of the screen the app opens
     to. Come back after a fortnight and 40 becomes 1. No sentence shames anybody; the NUMBER
     does, and it is the only value in the product that falls for a reason the person did not
     choose. Defanging a streak removes the loss aversion that makes one work while keeping
     its whole cost.
     `registerPractice` is untouched — `pendingMilestone` and the `winback` moment still need
     it. What changed is that nothing displays the running count. */

  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

  /** Every screen and component, DISCOVERED rather than listed. A named list of two files is
   *  a list of the two somebody remembered, and this rule has to hold everywhere. */
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
  const uiFiles = ['app', 'components']
    .flatMap((d) => walk(join(ROOT, d)))
    .filter((f) => /\.tsx$/.test(f));

  /* Comments stripped, including trailing ones — the note explaining this rule names
     `streak.current` several times, and a guard that cannot tell an explanation from a
     violation is worse than none. Same stripper as __tests__/entitlement.test.mjs, and for
     the same reason: a commented-out line must not satisfy a pin, and `https://` must not be
     mistaken for a comment. */
  const code = (f) => readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(?<!:)\/\/.*$/gm, '');

  test('no screen reads the running streak count', () => {
    assert.ok(uiFiles.length > 20, `only ${uiFiles.length} UI files found — has the walk broken?`);
    const offenders = uiFiles.filter((f) => /\bstreak\.current\b/.test(code(f)));
    assert.deepEqual(
      offenders.map((f) => f.slice(ROOT.length + 1)), [],
      'these render the running streak, which is the one number here that goes down',
    );
  });

  test('the longest run is shown somewhere, so the record is not merely kept', () => {
    /* The other half. Removing the running count and showing nothing at all would delete a
       real thing somebody earned rather than reframe it — and a comment promising `longest`
       lives on Progress, with no call site, is the exact defect this repository keeps
       finding. Derived: any screen may host it, this only insists one does.

       ⚠ IT MATCHES THE RENDER, NOT THE IDENTIFIER, and that is a correction found by
       mutation. The first version tested `/\bstreak\.longest\b/`, which the VISIBILITY
       CONDITION `streak.longest > 1` satisfies all by itself. So replacing the rendered
       number with a hardcoded string left the guard green and the record invisible —
       verified by doing it. This is the same weakness lib/entitlement.ts's pins document:
       an identifier that appears in a gate and in its own copy pins whichever one survives.
       `{streak.longest}` is a JSX text interpolation, which is the thing a reader sees. */
    const shows = uiFiles.filter((f) => /\{\s*streak\.longest\s*\}/.test(code(f)));
    assert.ok(shows.length > 0, 'nothing renders streak.longest, so the record is invisible');
  });
});
