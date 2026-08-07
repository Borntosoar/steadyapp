import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEntitled, daysUntilExpiry, emptyEntitlement, localGrant, projectFromProvider,
  trialExpiry, isGated, weekGated, ALWAYS_FREE_ROUTES, TIER_COMPARISON,
  BILLING_GRACE_DAYS, OFFLINE_GRACE_DAYS,
} from '../lib/entitlement.ts';

/* Entitlement.
 *
 * `entitled` used to be a persisted boolean that nothing in the app ever set to false. A
 * refund, an expiry, a cancellation, a failed renewal — none had a code path back. Once
 * true, true forever. It is now a projection over a timestamped cache, and this file is
 * where the projection's edges are pinned down.
 *
 * This module could not be tested at all until today: it imported the store and exported a
 * React hook, so a suite running in bare Node could not load it. */

const at = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

describe('the projection', () => {
  test('nothing granted means not entitled', () => {
    assert.equal(isEntitled(emptyEntitlement()), false);
    assert.equal(isEntitled(null), false);
    assert.equal(isEntitled(undefined), false);
  });

  test('no expiry means entitled — a lifetime purchase has nothing to re-check', () => {
    assert.equal(isEntitled(localGrant('purchase', 'lifetime', null)), true);
  });

  test('inside the paid period, entitled', () => {
    assert.equal(isEntitled(localGrant('trial', 'yearly', at(3))), true);
  });

  test('a hardship grant behaves like any other, and expires like one', () => {
    assert.equal(isEntitled(localGrant('hardship', null, at(30))), true);
    assert.equal(isEntitled(localGrant('hardship', null, at(-90))), false);
  });
});

describe('which way it fails, and why', () => {
  /* The decision this whole model turns on. When we cannot tell, grant. Being wrong that
     way costs a few dollars; being wrong the other way locks somebody out of a twelve-week
     protocol on a bad day with no signal. */
  test('a locally granted subscription keeps working through the offline window', () => {
    const e = localGrant('purchase', 'monthly', at(-5)); // verifiedAt null: never asked
    assert.equal(isEntitled(e), true, 'revoked while merely unable to verify');
  });

  test('but not forever', () => {
    const e = localGrant('purchase', 'monthly', at(-(OFFLINE_GRACE_DAYS + 2)));
    assert.equal(isEntitled(e), false);
  });

  test('a verified subscription gets the shorter billing-retry window', () => {
    const inGrace = { ...localGrant('purchase', 'monthly', at(-3)), verifiedAt: at(-3) };
    assert.equal(isEntitled(inGrace), true);

    const past = {
      ...localGrant('purchase', 'monthly', at(-(BILLING_GRACE_DAYS + 2))),
      verifiedAt: at(-(BILLING_GRACE_DAYS + 2)),
    };
    assert.equal(isEntitled(past), false);
  });

  test('billing grace is shorter than offline grace', () => {
    // Different causes. One is a declined card the store is retrying; the other is a
    // person on a plane. The second deserves more room.
    assert.ok(BILLING_GRACE_DAYS < OFFLINE_GRACE_DAYS);
  });

  test('a known cancellation is honoured immediately, with no grace', () => {
    /* Grace exists for uncertainty, not to override a decision somebody made. If the
       provider told us they cancelled, that is a real answer. */
    const e = { ...localGrant('purchase', 'monthly', at(-1)), verifiedAt: at(-1), willRenew: false };
    assert.equal(isEntitled(e), false);
  });

  test('an unparseable expiry grants rather than revokes', () => {
    const e = { ...localGrant('purchase', 'monthly', 'not a date'), verifiedAt: null };
    assert.equal(isEntitled(e), true, 'a corrupted date locked out a paying customer');
  });
});

describe('a refund, an expiry and a cancellation all have a path back', () => {
  /* The original defect, stated as a test. Under the old model every one of these left a
     permanent grant behind because nothing ever wrote false. */
  test('an inactive provider response revokes', () => {
    const e = projectFromProvider({ active: false }, () => null);
    assert.equal(e.source, 'none');
    assert.equal(isEntitled(e), false);
  });

  test('an elapsed period past all grace revokes', () => {
    const e = {
      ...localGrant('purchase', 'yearly', at(-400)),
      verifiedAt: at(-400),
    };
    assert.equal(isEntitled(e), false);
  });

  test('a cancellation revokes at the end of the paid period', () => {
    const cancelled = (expiresIn) => ({
      ...localGrant('purchase', 'yearly', at(expiresIn)),
      verifiedAt: at(-1),
      willRenew: false,
    });
    assert.equal(isEntitled(cancelled(5)), true, 'they paid for these days');
    assert.equal(isEntitled(cancelled(-1)), false);
  });
});

describe('mapping a provider response', () => {
  const planFor = (id) => (id === 'steady_yearly' ? 'yearly' : null);

  test('an active trial maps to a trial', () => {
    const e = projectFromProvider(
      { active: true, productIdentifier: 'steady_yearly', expirationDate: at(14), periodType: 'trial', willRenew: true },
      planFor
    );
    assert.equal(e.source, 'trial');
    assert.equal(e.plan, 'yearly');
    assert.equal(e.willRenew, true);
    assert.ok(e.verifiedAt, 'a provider answer must stamp verifiedAt');
  });

  test('an active normal period maps to a purchase', () => {
    const e = projectFromProvider(
      { active: true, productIdentifier: 'steady_yearly', expirationDate: at(300), periodType: 'normal' },
      planFor
    );
    assert.equal(e.source, 'purchase');
    assert.equal(e.willRenew, undefined, 'an unknown renewal must stay unknown, not become false');
  });

  test('an unrecognised product still grants access, just without a plan label', () => {
    const e = projectFromProvider(
      { active: true, productIdentifier: 'something_new', expirationDate: at(30), periodType: 'normal' },
      planFor
    );
    assert.equal(e.plan, null);
    assert.equal(isEntitled(e), true, 'a product rename revoked a paying customer');
  });

  test('an inactive response still stamps verifiedAt', () => {
    // Without this, a confirmed "they do not have it" would look identical to "never asked"
    // and would collect the longer offline grace on the next expiry.
    assert.ok(projectFromProvider({ active: false }, planFor).verifiedAt);
  });
});

describe('trial arithmetic', () => {
  test('a fresh trial expires in the configured number of days', () => {
    const left = daysUntilExpiry({ ...emptyEntitlement(), source: 'trial', expiresAt: trialExpiry() });
    assert.equal(left, 14);
  });

  test('no expiry means no countdown', () => {
    assert.equal(daysUntilExpiry(localGrant('purchase', 'lifetime', null)), null);
  });

  test('a lapsed period counts negative rather than clamping', () => {
    assert.ok(daysUntilExpiry(localGrant('trial', 'yearly', at(-3))) < 0);
  });
});

describe('gating never touches safety, whatever the billing state says', () => {
  test('every safety surface is free for a fully lapsed user', () => {
    for (const route of ['/', '/checkin', '/grounding', '/support', '/onboarding', '/paywall']) {
      assert.ok(ALWAYS_FREE_ROUTES.includes(route), `${route} left the always-free list`);
      assert.equal(isGated(route, false), false, `${route} was gated`);
    }
  });

  test('week one stays open without entitlement', () => {
    assert.equal(weekGated(1, false), false);
    assert.equal(weekGated(2, false), true);
    assert.equal(weekGated(12, true), false);
  });

  test('export is free on both tiers', () => {
    // Onboarding promises it as the only backup before any data is collected.
    const row = TIER_COMPARISON.find((r) => /export/i.test(r.label));
    assert.ok(row, 'the export row vanished from the comparison');
    assert.notEqual(row.free, '—', 'export was moved behind the paywall');
  });
});
