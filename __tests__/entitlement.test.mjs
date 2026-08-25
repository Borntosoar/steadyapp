import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAYWALL_COPY } from '../content/copy.ts';
import {
  isEntitled, daysUntilExpiry, emptyEntitlement, localGrant, projectFromProvider,
  trialExpiry, isGated, weekGated, ALWAYS_FREE_ROUTES, TIER_COMPARISON,
  BILLING_GRACE_DAYS, OFFLINE_GRACE_DAYS, PRICING, RENEWAL_TERMS, PRICE_NUMBERS, PLUS_ADDS, ALWAYS_FREE} from '../lib/entitlement.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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

describe('every row of the paywall table is enforced somewhere in the app', () => {
  /* This table is a promise made to somebody about to hand over money, so a row no code
     backs is not a copy slip — it is a false statement of what is being sold, on the screen
     where it costs the most.
     Two rows were false. "The twelve weeks — Week 1 / All 12" led the table while
     `weekGated()` had zero call sites, so the entire protocol was free; and "Test a
     prediction" claimed experiments were paid when they are gated by `phase.id >= 3`, a
     protocol gate every free user passes at week 7.
     The week row is now true: the gate is wired, so the row and its three sentences of copy
     came back with it. "Test a prediction" did not, and should not — the experiment gate is
     still the protocol phase, and listing it would double-count the week row.
     These assertions pin each surviving row to the call site that enforces it. They are
     source greps because the enforcement lives inside React components, and the alternative
     — trusting the table — is what produced the defect. */

  const src = (rel) => readFileSync(join(ROOT, rel), 'utf8');
  /* Comments say what the code MEANT to do. Only stripped source says what it does. */
  const code = (rel) => src(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  /* Every screen that shows somebody a week number, and the clamp it must read through.
     Three, because the programme's week is displayed in three places and a clamp missing
     from any one of them is a free user shown week 9 of a programme they are on week 1 of. */
  const WEEK_SCREENS = [
    ['app/(tabs)/index.tsx', /effectiveWeek\(protocol\.currentWeek, entitled\)/],
    ['app/(tabs)/practice.tsx', /effectiveWeek\(reached, entitled\)/],
    ['app/(tabs)/learn.tsx', /effectiveWeek\(reachedWeek, entitled\)/],
  ];

  /* label fragment -> [file, pattern that must appear in it] */
  const ENFORCED = [
    ['weeks', ...WEEK_SCREENS[0]],
    ['mirror', 'app/mirror.tsx', /isGated\('\/mirror', entitled\)/],
    ['Progress', 'app/(tabs)/progress.tsx', /if \(!entitled\)/],
    ['reads', 'app/(tabs)/learn.tsx', /m\.free \|\| entitled/],
    ['records', 'app/journal.tsx', /FREE_LIMITS\.thoughtRecordsPerMonth/],
  ];

  test('there is one enforcement point per row, and no orphan rows', () => {
    assert.equal(
      PLUS_ADDS.length, ENFORCED.length,
      `the table has ${PLUS_ADDS.length} rows and ${ENFORCED.length} are pinned to code below. `
      + 'A new row needs a call site and an entry here; a removed one needs both taken out.',
    );
  });

  for (const [what, file, pattern] of ENFORCED) {
    test(`the ${what} row is backed by ${file}`, () => {
      assert.match(
        src(file), pattern,
        `the paywall sells this and ${file} no longer enforces it`,
      );
    });
  }

  test('the week claim is backed on every screen that shows a week', () => {
    /* One clamp is not the feature. The row says "Week 1 / All 12" to everybody, so any
       screen that prints a week has to agree with it or the table is false again — this
       time in a way only a free user at week 9 ever sees. */
    for (const [file, pattern] of WEEK_SCREENS) {
      assert.match(
        code(file), pattern,
        `${file} shows a week number without clamping it through effectiveWeek()`,
      );
    }
  });

  test('and none of them reads the raw week past the clamp', () => {
    /* The clamp is only worth having if it is the ONLY route to a displayed week.
       `protocol.currentWeek` — the qualified read, straight off the store — may appear in a
       selector and may be passed to effectiveWeek. Anywhere else on those three screens it
       is the unclamped number reaching the render, which is the exact bug the clamp exists
       to prevent. The local each screen assigns the RESULT to is a different matter and is
       deliberately not matched here: learn.tsx calls its clamped local `currentWeek`, which
       is legitimate and which an unqualified grep flags. */
    for (const [file] of WEEK_SCREENS) {
      for (const line of code(file).split('\n')) {
        if (!/\bprotocol\.currentWeek\b/.test(line)) continue;
        assert.match(
          line.trim(), /useStore\(|effectiveWeek\(/,
          `${file} reads protocol.currentWeek outside the store selector and the clamp:\n  ${line.trim()}`,
        );
      }
    }
  });

  test('a locked row names the boundary it is actually behind', () => {
    /* Found in the browser, not here. The clamp made `mirrorOpen` and `experimentsOpen` read
       week 1, so a free user who had genuinely reached week 9 saw "Week 4" on mirror practice
       — a pacing reason they passed a month ago. The chip has to distinguish "you are still
       working up to this" from "you are done working up to it and this part is paid", which
       means deciding on the REACHED week, never the clamped one. */
    const practice = code('app/(tabs)/practice.tsx');
    assert.match(
      practice, /reached >= unlockWeek \? 'Anneal\+' : `Week \$\{unlockWeek\}`/,
      'the lock chip no longer picks its reason from the reached week',
    );
    for (const m of practice.match(/locked: \w+ \? undefined : [^,]+,/g) ?? []) {
      assert.match(
        m, /shut\(/,
        `a locked row states its reason without consulting the reached week:\n  ${m}`,
      );
    }
  });

  test('a clamped week does not describe where somebody is', () => {
    /* Also found in the browser. `phase.focus` for week one is "Check in each day. Nothing
       hard yet. First we find out where you are." — read by somebody eight weeks in, three
       lines above a notice saying they finished week 8. The number is clamped; the sentence
       about a person cannot be, so the locked branch does not get one. */
    const practice = code('app/(tabs)/practice.tsx');
    assert.match(
      practice, /weekLocked\s*\n?\s*\?[^:]*free plan covers/,
      'the clamped week header no longer has a branch of its own',
    );
    const focus = practice.match(/\$\{phase\.focus\}/g) ?? [];
    assert.equal(
      focus.length, 1,
      'phase.focus is rendered somewhere new — check it is not on the locked branch, where it '
      + 'describes a beginner to somebody who is not one',
    );
  });

  test('the table says so, and so does the copy above it and the store listing', () => {
    /* The claim used to live in four places and be enforced in none; the inverse is just as
       wrong, and less likely to be noticed. If the gate is wired and the copy is silent,
       somebody hits a wall the app never told them about — which reads as a bug and feels
       like a trick. All four have to move together, in both directions. */
    const claims = PLUS_ADDS.map((r) => `${r.label} ${r.free} ${r.plus}`).join(' ');
    assert.match(claims, /week/i, 'no row states the week gate that lib/entitlement.ts enforces');
    assert.match(PAYWALL_COPY.sub, /week/i, 'the paywall subheadline no longer states the week gate');
    for (const f of ['fastlane/metadata/en-US/description.txt', 'fastlane/metadata/en-US/promotional_text.txt']) {
      assert.match(
        src(f), /week one is free|week one of the programme/i,
        `${f} no longer says week one is the free tier, which the app now implements`,
      );
    }
  });

  test('weekGated is wired, or the claim goes when it does', () => {
    /* The other direction of the same rule. This function was kept unused for a while with a
       test that fired the moment it gained a call site; that test has done its job and this
       is its inverse — unwire the gate and the four claims above become false again. */
    const callSites = ['app', 'components', 'store', 'hooks']
      .flatMap((dir) => walk(join(ROOT, dir)))
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => /\bweekGated\s*\(/.test(code(f.slice(ROOT.length + 1))))
      .map((f) => f.slice(ROOT.length + 1));
    assert.ok(
      callSites.length > 0,
      'weekGated() has no call sites again. The protocol is free in full, so PLUS_ADDS must '
      + 'drop its week row and PAYWALL_COPY.sub, description.txt and promotional_text.txt '
      + 'must drop the claim.',
    );
    assert.ok(
      callSites.includes('app/(tabs)/practice.tsx'),
      'the week-locked notice on Practice is gone. A free user who finishes week one would '
      + 'stop advancing with nothing on screen saying why.',
    );
  });

  test('the gate does not reach the storage layer', () => {
    /* SAFETY.md §12b: entitlement fails TOWARD the user. A read-time clamp does that by
       construction — the worst it can do is show week one to somebody who has paid, and the
       next render with a refreshed entitlement corrects it. A gate inside recordPracticeDay
       would instead stop writing down practice somebody actually did, and no later render
       gets that back. So the store never learns about billing beyond caching the receipt. */
    const files = [...walk(join(ROOT, 'store')), join(ROOT, 'lib/protocol.ts')]
      .filter((f) => /\.tsx?$/.test(f));
    for (const f of files) {
      const rel = f.slice(ROOT.length + 1);
      assert.doesNotMatch(
        code(rel), /\b(weekGated|effectiveWeek|isGated|FREE_LIMITS)\s*[(.]/,
        `${rel} calls an entitlement policy function. The clamp belongs at read time.`,
      );
    }
  });

  test('and it does not reach anything promised free forever', () => {
    /* SAFETY.md §4. Grounding, the daily check-in, riding out an urge and crisis support sit
       outside every billing state. `__tests__/safety.test.mjs` greps these for any paywall
       reference at all; this is the narrower question of whether the week clamp crept in. */
    for (const rel of ['app/grounding.tsx', 'app/checkin.tsx', 'app/urges.tsx', 'app/support.tsx']) {
      assert.doesNotMatch(
        code(rel), /\b(weekGated|effectiveWeek)\s*\(/,
        `${rel} is free forever and must not consult the week gate`,
      );
    }
  });
});

/** Recursive file list, so the call-site check cannot be defeated by a new subdirectory. */
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
