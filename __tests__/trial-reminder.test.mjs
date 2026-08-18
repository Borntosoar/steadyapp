import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { nextMoment, eligibleMoments, MOMENTS } from '../lib/moments.ts';
import { PRICING, localGrant } from '../lib/entitlement.ts';
import { baseAppState, qualifiedForAsk } from './helpers/state.mjs';

/* Does the trial reminder the paywall promises actually fire?
 *
 * app/paywall.tsx says, under the purchase button: "We will remind you two days before it
 * ends." docs/APP-STORE.md §5.4 item 5 flags this as a submission item, and it is right to:
 * a stated commitment the app does not keep is a metadata-accuracy problem under Guideline
 * 2.3, a consumer-protection problem in several jurisdictions, and — the reason that
 * actually matters — the exact species of thing this app's own rules exist to prevent. The
 * whole pitch of the paywall is that it will not do anything sly with somebody's money.
 *
 * The honest scope of these tests: they prove the SCHEDULER fires, in-app, on the right
 * days, through the conditions that suppress everything else. They cannot prove somebody
 * opens the app to see it. That gap is real and is stated at the end of this file. */

/** A trial that ends `days` from now. */
const trialEnding = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return { ...localGrant('trial', 'yearly', d.toISOString()), source: 'trial' };
};

const stateWithTrial = (days) => {
  const s = baseAppState();
  s.entitlement = trialEnding(days);
  return s;
};

describe('the reminder fires on the days the paywall promises', () => {
  test('it fires two days out, which is the sentence on the purchase button', () => {
    const m = nextMoment(qualifiedForAsk(stateWithTrial(2)));
    assert.equal(m?.id, 'trial-ending');
  });

  test('and on each of the remaining days, not only once', () => {
    /* `maxShows` is 2, so it renders on at most two of them — but eligibility has to hold
       across all three or a person who does not open the app on exactly the right day gets
       no warning at all. */
    for (const days of [2, 1, 0]) {
      assert.ok(
        eligibleMoments(qualifiedForAsk(stateWithTrial(days))).includes('trial-ending'),
        `not eligible with ${days} day(s) left`
      );
    }
  });

  test('it does not fire early, when there is nothing to warn about yet', () => {
    for (const days of [3, 7, PRICING.trialDays]) {
      assert.ok(
        !eligibleMoments(qualifiedForAsk(stateWithTrial(days))).includes('trial-ending'),
        `fired ${days} days out, which is nagging rather than warning`
      );
    }
  });

  test('it does not fire after the trial has already ended', () => {
    assert.ok(!eligibleMoments(qualifiedForAsk(stateWithTrial(-1))).includes('trial-ending'));
  });

  test('a one-off purchase never produces a renewal warning', () => {
    /* Nothing renews, so there is nothing to warn about, and a notice implying otherwise
       would be its own small lie. */
    const s = baseAppState();
    s.entitlement = localGrant('purchase', 'lifetime', null);
    assert.ok(!eligibleMoments(qualifiedForAsk(s)).includes('trial-ending'));
  });
});

describe('nothing suppresses it, because it is not marketing', () => {
  test('it fires on a hard day, when every commercial prompt is silenced', () => {
    /* The one moment that must outrank the distress suppression. Money is about to leave
       somebody's account and they were promised a warning; staying quiet to respect a
       frequency cap would be the app protecting its own manners at the user's expense. */
    const s = stateWithTrial(1);
    const today = new Date().toISOString().slice(0, 10);
    s.practice.push({ id: 'hd', date: today, kind: 'hard-day' });
    const m = nextMoment(qualifiedForAsk(s));
    assert.equal(m?.id, 'trial-ending', 'a bad day silenced the billing warning');
  });

  test('it outranks the upgrade ask when both are eligible', () => {
    const s = stateWithTrial(1);
    const m = nextMoment(qualifiedForAsk(s));
    assert.equal(m?.id, 'trial-ending');
  });

  test('it cannot be dismissed away permanently', () => {
    /* maxDismissals 0. "Got it" closes today's card; it does not opt somebody out of being
       told their card is about to be charged. */
    assert.equal(MOMENTS['trial-ending'].maxDismissals, 0);
    assert.equal(MOMENTS['trial-ending'].kind, 'service');
  });

  test('it is the highest-priority moment in the app', () => {
    const others = Object.values(MOMENTS).filter((m) => m.id !== 'trial-ending');
    for (const o of others) {
      assert.ok(
        MOMENTS['trial-ending'].priority > o.priority,
        `${o.id} outranks the billing warning`
      );
    }
  });
});

/* WHAT THIS DOES NOT PROVE, and what to do about it.
 *
 * Everything above is in-app. If the person does not open Anneal during the last three days
 * of the trial, they are not reminded, and the paywall's promise is kept only for people who
 * happened to show up. For an app deliberately built to be missable — no streak, no
 * shaming, missed days neutral — that is a real gap rather than a theoretical one.
 *
 * The fix is a local notification scheduled at purchase, which needs expo-notifications: a
 * dependency the import allowlist governs, a permission prompt, and a design that has to
 * survive SAFETY.md §3. It is the one notification this app has a clear justification for,
 * because it is service rather than engagement — the user asked to be told, and it is about
 * their money rather than about their attendance.
 *
 * Until then the promise should not be overstated. The paywall says "We will remind you two
 * days before it ends", which for a non-returning user is a promise the app cannot keep.
 * Tracked in docs/APP-STORE.md. */
