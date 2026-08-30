import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextMoment, eligibleMoments, markShown, markDismissed, markActed,
  distressRecently, MOMENTS, dayKey,
} from '../lib/moments.ts';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseAppState, qualifiedForAsk, day, trialing, lifetime } from './helpers/state.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* The scheduler decides everything the app says without being asked. Its failure modes are
 * not crashes — they are nagging, and prompts landing on somebody at their worst. Both are
 * invisible in manual testing and both are why people uninstall a health app, so they are
 * tested here rather than trusted to review. */

const ask = (over = {}) => {
  const s = baseAppState();
  Object.assign(s, over);
  return qualifiedForAsk(s);
};

describe('one at a time', () => {
  test('the ask appears once the preconditions are met', () => {
    assert.equal(nextMoment(ask())?.id, 'week-one-ask');
  });

  test('nothing appears before the week is done', () => {
    const input = ask();
    input.weekComplete = false;
    assert.equal(nextMoment(input), null);
  });

  test('nothing appears before the number is real', () => {
    const input = ask();
    input.reclaimedSampleSize = 2;
    assert.equal(nextMoment(input), null);
  });

  test('at most one interruption a day, across the whole app', () => {
    const s = baseAppState();
    s.protocol.currentWeek = 4; // makes the plateau eligible alongside the ask
    const input = qualifiedForAsk(s);

    const first = nextMoment(input);
    assert.ok(first, 'expected a moment');

    s.moments = markShown(s.moments, first.id);
    const second = nextMoment(input);
    assert.equal(second?.id, first.id, 'the day\'s moment should stay the day\'s moment');

    // Once it is dismissed, nothing else takes its slot today either.
    s.moments = markDismissed(s.moments, first.id);
    assert.equal(nextMoment(input), null, 'a second moment fired on the same day');
  });

  /* Rendering a moment records its own impression. Without an exemption for the moment
     currently on screen, that record trips the daily budget and the cooldown on the very
     next render and the card disappears from under the person reading it. Found in a
     browser, not in a unit test — hence this one. */
  test('a moment survives recording its own impression', () => {
    const s = baseAppState();
    const input = qualifiedForAsk(s);
    const first = nextMoment(input);
    s.moments = markShown(s.moments, first.id);
    assert.equal(nextMoment(input)?.id, first.id, 'the moment vanished on re-render');
  });

  test('dismissing it makes it go away now, not tomorrow', () => {
    const s = baseAppState();
    const input = qualifiedForAsk(s);
    s.moments = markDismissed(markShown(s.moments, 'week-one-ask'), 'week-one-ask');
    assert.equal(nextMoment(input), null);
  });

  test('priority decides which one, when several are eligible', () => {
    const s = baseAppState();
    s.protocol.currentWeek = 4;
    const ids = eligibleMoments(qualifiedForAsk(s));
    assert.ok(ids.includes('plateau') && ids.includes('week-one-ask'));
    // Care outranks commercial: something useful beats something billable.
    assert.equal(nextMoment(qualifiedForAsk(s))?.id, 'plateau');
    assert.ok(MOMENTS.plateau.priority > MOMENTS['week-one-ask'].priority);
  });
});

describe('distress suppresses the sell', () => {
  test('a hard-day tap today or yesterday counts', () => {
    assert.equal(distressRecently([], [day(0)]), true);
    assert.equal(distressRecently([], [day(1)]), true);
    assert.equal(distressRecently([], [day(3)]), false);
  });

  test('a high distress rating counts', () => {
    const ci = [{ date: day(0), suds: 8, avoidance: 'none' }];
    assert.equal(distressRecently(ci, []), true);
  });

  test('a significant-avoidance day counts', () => {
    const ci = [{ date: day(0), suds: 3, avoidance: 'significant' }];
    assert.equal(distressRecently(ci, []), true);
  });

  test('an ordinary day does not', () => {
    const ci = [{ date: day(0), suds: 4, avoidance: 'small' }];
    assert.equal(distressRecently(ci, []), false);
  });

  test('the commercial ask is silenced by it', () => {
    const s = baseAppState();
    s.practice.push({ id: 'hd', date: day(0), kind: 'hard-day' });
    assert.equal(nextMoment(qualifiedForAsk(s)), null);
  });

  test('the review request is silenced by it too', () => {
    // Asking somebody mid bad week to go and praise you in public is tone-deaf, and iOS
    // only allows three native prompts a year — spending one there wastes it as well.
    const s = baseAppState();
    s.practice = Array.from({ length: 12 }, (_, i) => ({ id: 'p' + i, date: day(i), kind: 'checkin' }));
    s.urgeLogs = Array.from({ length: 4 }, (_, i) => ({ id: 'u' + i, date: day(i), resisted: true }));
    s.entitlement = lifetime();
    s.protocol.currentWeek = 2;

    const clean = qualifiedForAsk(s);
    clean.weekComplete = false;
    assert.equal(nextMoment(clean)?.id, 'rate-app');

    s.practice.push({ id: 'hd', date: day(0), kind: 'hard-day' });
    assert.equal(nextMoment(clean), null, 'a review request fired on a hard day');
  });

  test('care moments are not silenced — they are not selling anything', () => {
    const s = baseAppState();
    s.protocol.currentWeek = 4;
    s.practice.push({ id: 'hd', date: day(0), kind: 'hard-day' });
    assert.equal(nextMoment(qualifiedForAsk(s))?.id, 'plateau');
  });
});

describe('dismissal is an answer', () => {
  test('a dismissal starts a cooldown', () => {
    const s = baseAppState();
    s.moments = markDismissed(markShown(s.moments, 'week-one-ask'), 'week-one-ask');
    assert.equal(nextMoment(qualifiedForAsk(s)), null);
  });

  test('each dismissal doubles the wait', () => {
    const cfg = MOMENTS['week-one-ask'];
    const s = baseAppState();
    const rec = (shownDaysAgo, dismissedDaysAgo) => ({
      'week-one-ask': {
        shows: 1,
        lastShownDate: day(shownDaysAgo),
        dismissals: 1,
        lastDismissedDate: day(dismissedDaysAgo),
        acted: false,
      },
    });

    // One dismissal, one cooldown ago: still cooling, because the wait has doubled.
    s.moments = rec(cfg.cooldownDays, cfg.cooldownDays);
    assert.equal(nextMoment(qualifiedForAsk(s)), null, 'the wait did not double after a refusal');

    // Twice the cooldown later, it may ask again.
    s.moments = rec(cfg.cooldownDays * 2 + 1, cfg.cooldownDays * 2 + 1);
    assert.equal(nextMoment(qualifiedForAsk(s))?.id, 'week-one-ask');
  });

  /* The cooldown anchors on the LATER of the two dates. Anchoring on the dismissal by
     preference — `lastDismissedDate ?? lastShownDate` — meant that once any dismissal
     existed, a stale dismissal date won forever and the cooldown stopped measuring from
     the most recent impression. Observed: the ask correctly waited its doubled eight days,
     appeared, and then appeared again the next morning. */
  test('a recent impression still counts once a dismissal exists', () => {
    const cfg = MOMENTS['week-one-ask'];
    const s = baseAppState();
    s.moments = {
      'week-one-ask': {
        shows: 2,
        lastShownDate: day(1), // shown yesterday
        dismissals: 1,
        lastDismissedDate: day(cfg.cooldownDays * 3), // dismissed long ago
        acted: false,
      },
    };
    assert.equal(nextMoment(qualifiedForAsk(s)), null,
      'the ask reappeared a day after its last impression');
  });

  test('three refusals retire the ask permanently', () => {
    const s = baseAppState();
    s.moments = {
      'week-one-ask': {
        shows: 1,
        lastShownDate: day(400),
        dismissals: MOMENTS['week-one-ask'].maxDismissals,
        lastDismissedDate: day(400),
        acted: false,
      },
    };
    assert.equal(nextMoment(qualifiedForAsk(s)), null, 'the app kept asking after three refusals');
  });

  test('acting on a moment retires it', () => {
    const s = baseAppState();
    s.moments = markActed(s.moments, 'week-one-ask');
    assert.equal(nextMoment(qualifiedForAsk(s)), null);
  });

  test('the lifetime impression ceiling is respected', () => {
    const s = baseAppState();
    s.moments = {
      'week-one-ask': {
        shows: MOMENTS['week-one-ask'].maxShows,
        lastShownDate: day(400),
        dismissals: 0,
        lastDismissedDate: null,
        acted: false,
      },
    };
    assert.equal(nextMoment(qualifiedForAsk(s)), null);
  });
});

describe('service moments override the budget', () => {
  const onTrial = (daysLeft) => {
    const s = baseAppState();
    s.entitlement = trialing(daysLeft);
    return { s, input: qualifiedForAsk(s) };
  };

  test('fires two days out', () => {
    assert.equal(nextMoment(onTrial(2).input)?.id, 'trial-ending');
  });

  test('does not fire in the middle of the trial', () => {
    assert.ok(!eligibleMoments(onTrial(10).input).includes('trial-ending'));
  });

  test('does not fire once the trial has already lapsed', () => {
    assert.ok(!eligibleMoments(onTrial(-3).input).includes('trial-ending'));
  });

  /* A lifetime purchase has no renewal to warn about. Deriving the notice from a start
     date plus a constant meant somebody who paid once outright got told, through their
     worst day, that they were about to be charged again. */
  test('never fires for a purchase with no expiry', () => {
    const s = baseAppState();
    s.entitlement = lifetime();
    assert.ok(!eligibleMoments(qualifiedForAsk(s)).includes('trial-ending'));
  });

  test('fires even when something else already appeared today', () => {
    const { s, input } = onTrial(1);
    s.moments = markShown(s.moments, 'plateau');
    assert.equal(nextMoment(input)?.id, 'trial-ending',
      'the daily budget silenced a warning about an imminent charge');
  });

  test('cannot be dismissed away', () => {
    assert.equal(MOMENTS['trial-ending'].maxDismissals, 0);
  });
});

describe('winback', () => {
  test('fires after ten days away, for somebody with a history', () => {
    const s = baseAppState();
    s.streak.lastPracticeDate = day(11);
    assert.equal(nextMoment(qualifiedForAsk(s))?.id, 'winback');
  });

  test('does not fire for somebody who barely started', () => {
    const s = baseAppState();
    s.streak.lastPracticeDate = day(11);
    s.practice = [{ id: 'p0', date: day(11), kind: 'checkin' }];
    assert.ok(!eligibleMoments(qualifiedForAsk(s)).includes('winback'));
  });

  test('stops calling after two attempts', () => {
    assert.equal(MOMENTS.winback.maxShows, 2);
  });
});

describe('bookkeeping', () => {
  test('an impression on the same day is not counted twice', () => {
    let m = markShown({}, 'week-one-ask');
    m = markShown(m, 'week-one-ask');
    assert.equal(m['week-one-ask'].shows, 1, 'a re-render counted as a second impression');
  });

  test('an impression is dated', () => {
    const m = markShown({}, 'plateau');
    assert.equal(m['plateau'].lastShownDate, dayKey());
  });

  test('transitions never mutate the input', () => {
    const before = {};
    markShown(before, 'plateau');
    markDismissed(before, 'plateau');
    markActed(before, 'plateau');
    assert.deepEqual(before, {});
  });
});

describe('the configuration itself', () => {
  test('every moment has copy', async () => {
    const { MOMENT_COPY } = await import('../content/copy.ts');
    for (const id of Object.keys(MOMENTS)) {
      const copy = MOMENT_COPY[id];
      assert.ok(copy, `no copy for ${id}`);
      for (const field of ['eyebrow', 'title', 'body', 'action', 'dismiss']) {
        assert.ok(copy[field]?.length > 0, `${id} is missing ${field}`);
      }
    }
  });

  test('exactly one moment asks for money', () => {
    const commercial = Object.values(MOMENTS).filter((m) => m.kind === 'commercial');
    assert.equal(commercial.length, 1,
      'more than one commercial interruption is how an app becomes a shop');
    assert.equal(commercial[0].id, 'week-one-ask');
  });

  test('service moments outrank everything else', () => {
    const service = Object.values(MOMENTS).filter((m) => m.kind === 'service');
    const rest = Object.values(MOMENTS).filter((m) => m.kind !== 'service');
    const lowestService = Math.min(...service.map((m) => m.priority));
    const highestRest = Math.max(...rest.map((m) => m.priority));
    assert.ok(lowestService > highestRest);
  });

  test('the commercial moment is the most easily silenced', () => {
    const ask = MOMENTS['week-one-ask'];
    for (const m of Object.values(MOMENTS)) {
      if (m.kind !== 'commercial' && m.maxDismissals > 0) {
        assert.ok(ask.maxDismissals >= m.maxDismissals);
      }
    }
    assert.ok(ask.maxDismissals > 0, 'the ask must be dismissable for good');
  });
});

describe('the baseline moved out of onboarding and is still asked for', () => {
  /* ⚠ THE DELETION THIS GUARDS AGAINST. `app/onboarding/index.tsx` used to end on
     `router.replace('/measure')`, making fifteen PHQ-8 and GAD-7 items the last step of
     onboarding — sixteen screens between a first open and anything in this app that does
     something, at the point of highest drop-off, in a product whose own onboarding docblock
     says seven or eight of every ten people never come back.
     It now goes to Today and `measure-baseline` offers the sitting a few days in. The risk
     of that change is not that the moment misbehaves; it is that the baseline quietly stops
     being collected AT ALL and nobody notices for months, because the only symptom is an
     absence. DIRECTION.md's win condition is a PHQ and GAD series, so an app that never
     takes a baseline cannot produce the one claim it exists to make.
     `baselineOwed` in lib/measure.ts already owns the asking rule and is tested there. What
     is tested here is the wiring: that the moment exists, that it fires for somebody who has
     not answered, and that it stops. */

  /** Somebody a few days in who has never been offered the questionnaires. */
  const owing = (over = {}) => {
    const s = baseAppState();
    s.measures = [];
    Object.assign(s, over);
    return qualifiedForAsk(s);
  };

  test('onboarding hands off to Today, not to the questionnaires', () => {
    /* The pin for the change itself. Comments stripped, trailing ones included, so the long
       note explaining WHY it moved cannot satisfy a grep for the thing it describes. */
    const code = readFileSync(join(ROOT, 'app/onboarding/index.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(?<!:)\/\/.*$/gm, '');
    assert.doesNotMatch(code, /router\.replace\('\/measure'\)/,
      'onboarding sends people straight into fifteen clinical items again');
    assert.match(code, /router\.replace\('\/'\)/,
      'onboarding no longer routes anywhere on completion');
  });

  test('it is offered to somebody who has not answered yet', () => {
    assert.ok(eligibleMoments(owing()).includes('measure-baseline'));
  });

  test('not on the first day — there has to be something to have a baseline of', () => {
    /* Fifteen questions about the worst fortnight of somebody's year, on the day they
       installed the app, is the placement this change exists to undo. Moving it from the end
       of onboarding to the first launch after it would be the same screen one tap later. */
    const s = baseAppState();
    s.measures = [];
    s.practice = [{ id: 'p0', date: day(0), kind: 'checkin' }];
    assert.ok(!eligibleMoments(qualifiedForAsk(s)).includes('measure-baseline'));
  });

  test('it stops once the baseline exists', () => {
    /* baseAppState carries a completed sitting. If this ever fires for somebody who has
       answered, the app is asking a person to redo work it already has. */
    assert.ok(!eligibleMoments(qualifiedForAsk(baseAppState())).includes('measure-baseline'));
  });

  test('a fresh decline is respected, and re-offered exactly once, later', () => {
    /* The rule `baselineOwed` encodes: asked, declined, asked once more three days on, never
       again. A skip the app forgets overnight is not a skip, it is a delay. */
    const justSkipped = owing();
    justSkipped.state.profile = { ...justSkipped.state.profile, measureSkippedAt: day(0) };
    assert.ok(!eligibleMoments(justSkipped).includes('measure-baseline'),
      'it re-asked the day after somebody said no');

    const skippedAWhileAgo = owing();
    skippedAWhileAgo.state.profile = { ...skippedAWhileAgo.state.profile, measureSkippedAt: day(5) };
    assert.ok(eligibleMoments(skippedAWhileAgo).includes('measure-baseline'),
      'the one follow-up offer never comes');
  });

  test('it never outranks the trial-ending notice', () => {
    /* A questionnaire must not stand in front of a payment somebody is about to be charged
       for. The paywall promises that warning in writing. */
    assert.ok(MOMENTS['measure-baseline'].priority < MOMENTS['trial-ending'].priority);
    const s = owing({ entitlement: trialing(1) });
    assert.equal(nextMoment(s)?.id, 'trial-ending');
  });

  test('it is service, so it does not sell and is not silenced by a hard day', () => {
    /* Same reasoning as its 'measure-due' sibling: the app doing a thing it said it would,
       rather than a judgement about how the work is going. But it must also not be
       COMMERCIAL, or SAFETY.md's rule about money and distress would apply to it and it
       would be suppressed exactly when a person is most worth measuring. */
    assert.equal(MOMENTS['measure-baseline'].kind, 'service');
    const s = owing();
    s.state.practice.push({ id: 'hd', date: day(0), kind: 'hard-day' });
    assert.ok(eligibleMoments(s).includes('measure-baseline'));
  });

  test('the card knows where to send somebody, with no milestone attached', () => {
    /* A moment with no route falls through to '/' — it would render, be tapped, and take the
       person to the screen they are already on. And a milestone param here would stamp a
       first sitting as a 30/60/90 answer, which corrupts the series `dueMilestone` walks. */
    const card = readFileSync(join(ROOT, 'components/MomentCard.tsx'), 'utf8');
    assert.match(card, /'measure-baseline':\s*'\/measure'/,
      'measure-baseline has no route, so its action goes nowhere');
    assert.doesNotMatch(card, /measure-baseline[\s\S]{0,200}milestone=/,
      'a first sitting is being stamped with a milestone it did not answer');
  });

});

describe('the home screen hands this module everything it reads', () => {
  /* ⚠ THE BUG THIS EXISTS FOR, AND WHY 1,484 TESTS DID NOT FIND IT.
   *
   * Every test in this repository builds a COMPLETE AppState and passes it in. `app/(tabs)/
   * index.tsx` does not: it composes a partial object out of individually-subscribed store
   * slices, deliberately, so the screen does not re-render on every write anywhere in the
   * app. That object carried a comment reading "lib/moments.ts reads these eight and nothing
   * else", and the sentence was false when it was written — `measure-due` reads
   * `state.measures`, which was absent. `dueMilestone` returns null on an absent history
   * instead of throwing, so the scheduled 30/60/90 re-measure silently never fired from the
   * home screen. Nothing failed. Nothing could.
   *
   * Then `measure-baseline` added a read of `state.profile`, the same field list was still
   * short, and the missing field stopped being silent: the home screen threw on launch and
   * rendered CrashScreen. It was found by looking at a screenshot, which printed the message.
   *
   * So this walks lib/moments.ts for every `state.X` it reads and insists the screen's object
   * contains all of them. A hand-written list is a list of the fields somebody remembered,
   * which is precisely how the first one got out of date. */

  const code = (rel) => readFileSync(join(ROOT, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(?<!:)\/\/.*$/gm, '');

  test('every state field lib/moments.ts reads is in the home screen momentState', () => {
    const reads = [...new Set(
      [...code('lib/moments.ts').matchAll(/\bstate\.([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]),
    )].sort();
    assert.ok(reads.length >= 8, `only ${reads.length} state reads found — has the walk broken?`);

    const home = code('app/(tabs)/index.tsx');
    const memo = home.slice(home.indexOf('const momentState'), home.indexOf('const moment = nextMoment'));
    assert.ok(memo.length > 0, 'momentState is gone from app/(tabs)/index.tsx');

    const missing = reads.filter((f) => !new RegExp(`\\b${f}\\b`).test(memo));
    assert.deepEqual(missing, [],
      `lib/moments.ts reads these and the home screen does not pass them: ${missing.join(', ')}`);
  });

  test('eligibleMoments is total over a partial state', () => {
    /* The other half, and the one that actually stops a crash screen. The guard above keeps
       the two lists in step; this says that falling out of step is not fatal. A person whose
       stored payload predates a field — an old install, a partial import, anything mid
       migration — must not be shown a crash screen on launch. lib/measure.ts's `completed()`
       makes exactly this argument for exactly this reason. */
    const full = baseAppState();
    for (const field of Object.keys(full)) {
      const partial = { ...full };
      delete partial[field];
      assert.doesNotThrow(
        () => eligibleMoments(qualifiedForAsk(partial)),
        `eligibleMoments throws when "${field}" is missing, which is a crash screen on launch`,
      );
    }
    assert.doesNotThrow(() => eligibleMoments(qualifiedForAsk({})), 'an empty state throws');
  });
});
