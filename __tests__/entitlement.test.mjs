import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEntitled, daysUntilExpiry, emptyEntitlement, localGrant, projectFromProvider,
  trialExpiry, isGated, weekGated, ALWAYS_FREE_ROUTES, TIER_COMPARISON,
  BILLING_GRACE_DAYS, OFFLINE_GRACE_DAYS, PRICING, RENEWAL_TERMS, PRICE_NUMBERS, PLUS_ADDS, ALWAYS_FREE} from '../lib/entitlement.ts';

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
  const planFor = (id) => (id === 'anneal_yearly' ? 'yearly' : null);

  test('an active trial maps to a trial', () => {
    const e = projectFromProvider(
      { active: true, productIdentifier: 'anneal_yearly', expirationDate: at(14), periodType: 'trial', willRenew: true },
      planFor
    );
    assert.equal(e.source, 'trial');
    assert.equal(e.plan, 'yearly');
    assert.equal(e.willRenew, true);
    assert.ok(e.verifiedAt, 'a provider answer must stamp verifiedAt');
  });

  test('an active normal period maps to a purchase', () => {
    const e = projectFromProvider(
      { active: true, productIdentifier: 'anneal_yearly', expirationDate: at(300), periodType: 'normal' },
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
    // Read from PRICING rather than repeated as a literal. The literal said 14 under a name
    // saying "the configured number", so changing the configured number failed a test that
    // was not testing anything about the change.
    assert.equal(left, PRICING.trialDays);
  });

  /* App Store Connect sells introductory free trials in fixed lengths only: 3 days, 1 week,
     2 weeks, 1 month, 2 months, 3 months, 6 months, 1 year. A trial length outside that set
     cannot be configured as a product, so the app would promise a duration the store has no
     way to grant — and the mismatch shows up as a customer being charged early, which is the
     worst place to find out. docs/SUBSCRIPTION-BENCHMARKS.md recommends 21 days; this is why
     the answer is 30. */
  test('the trial length is a duration the App Store can actually sell', () => {
    assert.ok(
      [3, 7, 14, 30, 60, 90, 180, 365].includes(PRICING.trialDays),
      `${PRICING.trialDays} days is not an App Store introductory offer duration`
    );
  });

  test('no expiry means no countdown', () => {
    assert.equal(daysUntilExpiry(localGrant('purchase', 'lifetime', null)), null);
  });

  test('a lapsed period counts negative rather than clamping', () => {
    assert.ok(daysUntilExpiry(localGrant('trial', 'yearly', at(-3))) < 0);
  });
});

describe('what the customer is told will happen to their money', () => {
  /* Apple 3.1.2 requires the auto-renewing terms next to the purchase rather than behind a
     link, and the paywall renders these strings verbatim. Every product needs one or the
     branch that reads it renders `undefined` beside a purchase button. */
  test('every purchasable plan has a renewal sentence', () => {
    for (const plan of ['monthly', 'yearly', 'lifetime']) {
      assert.equal(typeof RENEWAL_TERMS[plan], 'string', `no renewal terms for ${plan}`);
      assert.ok(RENEWAL_TERMS[plan].includes('$'), `${plan} renewal terms name no amount`);
    }
  });

  test('the subscriptions say they renew and say how to stop them', () => {
    for (const plan of ['monthly', 'yearly']) {
      assert.match(RENEWAL_TERMS[plan], /renew/i, `${plan} does not disclose that it renews`);
      assert.match(RENEWAL_TERMS[plan], /cancel/i, `${plan} does not say it can be cancelled`);
    }
  });

  test('the one-off product does not claim a renewal it does not have', () => {
    /* It also has no trial — hooks/useEntitlement grants it outright. The paywall used to
       print "Free until 9 September. Then $149 once." over it, which was two false claims
       in one sentence. */
    assert.match(RENEWAL_TERMS.lifetime, /nothing to renew/i);
  });

  /* App Review rejects "lifetime" on the grounds that no developer can guarantee content
     for the length of a customer's life (docs/APP-STORE.md §5.4). The Plan KEY stays
     `lifetime` — it is an internal identifier that keys stored state — but no string a
     customer reads may contain the word. */
  test('no price or renewal string a customer reads says "lifetime"', () => {
    for (const [key, value] of Object.entries(PRICING)) {
      if (typeof value !== 'string') continue;
      assert.doesNotMatch(value, /lifetime/i, `PRICING.${key} says "lifetime" to a customer`);
    }
    for (const [key, value] of Object.entries(RENEWAL_TERMS)) {
      assert.doesNotMatch(value, /lifetime/i, `RENEWAL_TERMS.${key} says "lifetime" to a customer`);
    }
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

describe('the prices on the paywall are arithmetic, not typed literals', () => {
  /* The paywall now states a saving — "$155.88 if you paid monthly for a year. That is
     $75.89 less." That is a claim about money, made to somebody deciding whether to trust
     this product, on a screen whose whole argument is that it will not manipulate them. A
     stale saving there is worse than a stale number anywhere else in the repo, and prose
     does not fail a build. So every figure is derived from PRICE_NUMBERS and pinned here. */
  test('the yearly saving is the real difference against twelve monthly payments', () => {
    const monthlyYear = PRICE_NUMBERS.monthly * 12;
    assert.equal(PRICING.monthlyPerYear, `$${monthlyYear.toFixed(2)}`);
    assert.equal(PRICING.yearlySaving, `$${(monthlyYear - PRICE_NUMBERS.yearly).toFixed(2)}`);
  });

  test('the per-month figure actually multiplies back to the annual price', () => {
    /* The one that catches a price change made in one place. $6.67 × 12 is $80.04, four
       cents over $79.99 — rounding, not error — so the tolerance is one cent per month. */
    const perMonth = Number(PRICING.yearlyPerMonth.replace(/[^0-9.]/g, ''));
    assert.ok(Math.abs(perMonth * 12 - PRICE_NUMBERS.yearly) <= 0.12,
      `${PRICING.yearlyPerMonth} × 12 is not ${PRICE_NUMBERS.yearly}`);
  });

  test('every long form agrees with its number', () => {
    assert.ok(PRICING.monthlyLong.includes(PRICE_NUMBERS.monthly.toFixed(2)));
    assert.ok(PRICING.yearlyLong.includes(PRICE_NUMBERS.yearly.toFixed(2)));
    assert.ok(PRICING.lifetimeShort.includes(String(PRICE_NUMBERS.lifetime)));
  });

  test('the saving is never presented as a discount', () => {
    /* SAFETY.md §13. A saving stated as arithmetic between two prices both on offer today
       is honest; a percentage detached from its base, a struck-through price or a deadline
       is the grammar of a manufactured one. */
    const all = [PRICING.monthlyPerYear, PRICING.yearlySaving, PRICING.monthlyLong,
                 PRICING.yearlyLong, PRICING.lifetimeShort].join(' ');
    assert.doesNotMatch(all, /%|save|was |only |instead of|discount|off\b/i);
  });

  test('the always-free list and the paid list do not overlap', () => {
    /* The split is the whole point: anything appearing in both is a row that belongs in
       neither, and it is how "Forever / Forever" got back into a comparison grid. */
    const paid = new Set(PLUS_ADDS.map((r) => r.label));
    for (const label of ALWAYS_FREE) {
      assert.ok(!paid.has(label), `"${label}" is in both PLUS_ADDS and ALWAYS_FREE`);
    }
  });

  test('nothing gated is listed as free forever', () => {
    /* ALWAYS_FREE is an unconditional promise. If a label here is ever gated in code the
       promise on the paywall becomes false, which is the one class of error on this screen
       that is a lie rather than a bug. */
    assert.ok(ALWAYS_FREE.length >= 4, 'the free promise has shrunk — was that deliberate?');
    assert.ok(ALWAYS_FREE.some((l) => /crisis/i.test(l)), 'crisis support must stay free');
    assert.ok(ALWAYS_FREE.some((l) => /export|backup/i.test(l)), 'export must stay free');
  });
});
