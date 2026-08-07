import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextMoment, eligibleMoments, markShown, markDismissed, markActed,
  distressRecently, MOMENTS, dayKey,
} from '../lib/moments.ts';
import { baseAppState, qualifiedForAsk, day, trialing, lifetime } from './helpers/state.mjs';

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
