/* Entitlement — the pure half.
 *
 * v1 reads a local flag. There is no account, no network call, no receipt validation.
 *
 * NOTHING IN lib/ MAY IMPORT FROM store/ OR REACT. This file used to export a React hook
 * and import the store, which pointed the wrong way down the dependency graph and was the
 * reason it was the only engine module with no test file — a suite that runs under bare
 * `node --test` cannot import a module that reaches for zustand. The hook now lives in
 * hooks/useEntitlement.ts; everything left here is data and pure predicates, and is
 * testable directly.
 *
 * THE RULE THAT OUTRANKS BILLING: safety is never gated. Grounding, breathing, crisis
 * support, the hard-day path, the daily check-in, and the support directory are free
 * forever. `isGated()` below is the single place that decides, and it hard-codes the
 * free set rather than deriving it — so gating one of them by accident requires
 * deliberately editing a list with a comment telling you not to. */

/** Routes that must never require payment, under any business decision. */
export const ALWAYS_FREE_ROUTES = [
  '/',
  '/checkin',
  '/grounding',
  '/support',
  '/onboarding',
  '/paywall',
] as const;

/** Free tier caps on otherwise-paid surfaces. */
export const FREE_LIMITS = {
  thoughtRecordsPerMonth: 5,
  learnModules: 3,
  maxWeek: 1,
};

/* Pricing.
 *
 * Annual is the default selection: Health & Fitness takes ~68% of its revenue from annual
 * plans and they retain far better than monthly. Monthly stays on the list anyway — in a
 * category where trust is the binding constraint, offering the flexible option is itself a
 * trust signal, and it says the product expects to earn the next month.
 *
 * No discounts, no launch pricing, no countdown. Beyond the obvious objection to running
 * urgency at an anxious person there is a plain commercial one: in annual Health & Fitness
 * the discounted cohort churns WORSE than the full-price cohort, so a discount buys a
 * customer who was leaving anyway. See .claude/skills/value-first-growth. */
/* Priced at the category, not under it.
 *
 * The previous figures ($6.99 / $44.99 / $89) sat well below every comparable subscription
 * in mental health, and underpricing does more damage here than it looks:
 *
 *   - The discounted cohort in annual Health & Fitness churns WORSE than the full-price
 *     cohort. A low price does not buy loyalty, it buys people who were leaving anyway.
 *   - Price is read as a quality signal in a category where the customer cannot evaluate
 *     the product before buying it. Sitting far under the category reads as thin.
 *   - The hardship tier is what makes this defensible. Nobody is priced out of Steady —
 *     they are one visible, form-free tap from three months free. Given that, pricing the
 *     paid tier at its worth costs nobody anything and funds the free tier.
 *
 * Annual works out roughly half the monthly rate, which is the usual spread and enough to
 * make annual the obviously rational pick without needing a "SAVE 47%" badge shouting it.
 * Lifetime is a shade under two years of annual. */
/** The things somebody can actually buy.
 *
 *  Declared separately from `PRICING` because `keyof typeof PRICING` also admits
 *  `yearlyPerMonth` and `trialDays`, which are display strings and a number. Typed that
 *  way, `purchase('trialDays')` compiled cleanly and would have granted entitlement and
 *  started a trial. */
export type Plan = 'monthly' | 'yearly' | 'lifetime';

/* ---------- the entitlement model ----------
 *
 * `entitled` used to be a persisted boolean, and that was wrong in a way that only shows
 * up in production: nothing in the app ever set it to false. A refund, an expiry, a
 * cancellation, a failed renewal — none had a code path back. Once true, true forever.
 *
 * Entitlement is not a fact the app owns. It is a fact the STORE owns (Apple, Google,
 * RevenueCat), and what we keep locally is a cache of the last answer we were given,
 * timestamped. `isEntitled()` projects that cache into a yes/no at a moment in time. The
 * cache is written in exactly one place, by the refresh path in hooks/useEntitlement.ts.
 *
 * THE DIRECTION THIS FAILS IN, AND WHY
 *
 * When we cannot reach the provider — offline, on a plane, in a hospital with no signal —
 * the honest answer is "unknown". Two ways to resolve that:
 *
 *   Revoke on doubt. Nobody gets a free ride. Somebody mid-protocol on a bad day, out of
 *   signal, opens the app and finds their twelve weeks locked.
 *
 *   Grant on doubt. A small number of people get some free access by staying offline.
 *
 * The second is obviously correct here and it is not close. The cost of being wrong in one
 * direction is a few dollars; in the other it is the person this was built for, at the
 * moment they needed it, being told to pay. Grace windows below are generous on purpose.
 *
 * Note that this only ever governs the PAID surfaces. Grounding, crisis support, the
 * hard-day path and the daily check-in are in ALWAYS_FREE_ROUTES and do not consult any of
 * this — a fully lapsed user keeps all of them forever (SAFETY.md §4). */

export type EntitlementSource = 'none' | 'trial' | 'purchase' | 'hardship';

export interface Entitlement {
  source: EntitlementSource;
  /** Which product, when there is one. Null for hardship and for a lapsed entitlement. */
  plan: Plan | null;
  /** ISO. End of the current paid period. `null` means it does not end — a lifetime
   *  purchase, or a hardship grant we have chosen not to time out. */
  expiresAt: string | null;
  /** ISO. The last time a provider actually told us any of this. Null means never, which
   *  is the state of every local grant in v1. */
  verifiedAt: string | null;
  /** What the provider said about the next renewal. `false` means the user cancelled and
   *  we should not extend grace past the period they paid for; `undefined` means we do not
   *  know, which is the assumption grace exists to cover. */
  willRenew?: boolean;
}

export const emptyEntitlement = (): Entitlement => ({
  source: 'none',
  plan: null,
  expiresAt: null,
  verifiedAt: null,
});

/** Days of access after a period ends when we have no reason to think the user cancelled.
 *
 *  Sized against the real cause rather than invented: Apple retries a failed renewal for
 *  up to 16 days before giving up, and during that window the user believes they are a
 *  subscriber because as far as they are concerned they are. Locking them out over a
 *  declined card is a support ticket at best. */
export const BILLING_GRACE_DAYS = 16;

/** Days of access after a period ends when we simply have not been able to ask.
 *
 *  Separate from billing grace and shorter, because this covers connectivity rather than
 *  payment. Still long enough to cover a holiday without signal. */
export const OFFLINE_GRACE_DAYS = 30;

const DAY_MS = 86_400_000;

/**
 * The projection. Pure, and the single definition of "is this person entitled right now".
 *
 * Never store the result. It changes with the clock, and a stored copy is precisely the
 * bug this model exists to remove.
 */
export function isEntitled(e: Entitlement | null | undefined, now: Date = new Date()): boolean {
  if (!e || e.source === 'none') return false;

  // No end date: a lifetime purchase or a hardship grant. Nothing to re-check.
  if (!e.expiresAt) return true;

  const expires = new Date(e.expiresAt).getTime();
  if (Number.isNaN(expires)) return true; // unparseable date: fail toward access
  const t = now.getTime();
  if (t < expires) return true;

  /* Past the end of the paid period. If the provider told us the user cancelled, that is a
     real answer and we honour it — grace is for uncertainty, not for overriding a decision
     somebody made. */
  if (e.willRenew === false) return false;

  const grace = (e.verifiedAt ? BILLING_GRACE_DAYS : OFFLINE_GRACE_DAYS) * DAY_MS;
  return t < expires + grace;
}

/** Days left in the current period, or null when there is no end date. Negative once the
 *  period has ended and only grace is holding it open. */
export function daysUntilExpiry(e: Entitlement, now: Date = new Date()): number | null {
  if (!e.expiresAt) return null;
  const expires = new Date(e.expiresAt).getTime();
  if (Number.isNaN(expires)) return null;
  return Math.ceil((expires - now.getTime()) / DAY_MS);
}

/** What a provider adapter must hand back. Deliberately the subset of RevenueCat's
 *  `CustomerInfo` this app needs, so the adapter is a mapping and not a translation. */
export interface ProviderEntitlement {
  active: boolean;
  productIdentifier?: string | null;
  expirationDate?: string | null;
  willRenew?: boolean;
  periodType?: 'trial' | 'normal' | 'intro' | string;
}

/** Map a provider response onto the local cache. Pure, so the mapping is testable without
 *  a network, a store account, or a sandbox receipt. */
export function projectFromProvider(
  p: ProviderEntitlement,
  planFor: (productId: string | null | undefined) => Plan | null,
  now: Date = new Date()
): Entitlement {
  const verifiedAt = now.toISOString();
  if (!p.active) {
    return { ...emptyEntitlement(), verifiedAt };
  }
  // No cast. A cast here would let a stray or misspelled field through silently, which is
  // exactly the failure mode this file is being rewritten to remove.
  const out: Entitlement = {
    source: p.periodType === 'trial' ? 'trial' : 'purchase',
    plan: planFor(p.productIdentifier),
    expiresAt: p.expirationDate ?? null,
    verifiedAt,
  };
  if (typeof p.willRenew === 'boolean') out.willRenew = p.willRenew;
  return out;
}

/** A locally granted entitlement — the v1 purchase stub and the hardship path. `verifiedAt`
 *  stays null because nobody verified anything, which is what earns it the longer grace. */
export function localGrant(
  source: Exclude<EntitlementSource, 'none'>,
  plan: Plan | null,
  expiresAt: string | null
): Entitlement {
  return { source, plan, expiresAt, verifiedAt: null };
}

/** `expiresAt` for a trial starting now. */
export function trialExpiry(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + PRICING.trialDays);
  return d.toISOString();
}

export const PRICING = {
  monthly: '$12.99/mo',
  yearly: '$79.99/yr',
  /** Shown beside the annual figure. Anchor low, bill high — the pair reads as honest
   *  where either number on its own reads as a trick. */
  yearlyPerMonth: '$6.67 a month',
  lifetime: '$149 once',
  /** Fourteen days spans two full protocol weeks, so the customer watches their number
   *  move twice before deciding. Published medians: 17–32 day trials convert at 42.5%,
   *  under four days at 25.5%, and the mechanism is habit formation, not patience. */
  trialDays: 14,
};

/** The trial end date, as a date. A long trial showing only a duration is a trap; a long
 *  trial showing a date, an amount, and a promised reminder is a fair deal. */
export function trialEndDate(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + PRICING.trialDays);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
}

/** What each tier actually gets. Rendered as a comparison on the paywall — one of the most
 *  consistent additions across high-performing paywalls, because a large share of people
 *  standing at one still cannot say what they would be buying.
 *
 *  The free column is written generously on purpose. A visibly crippled free column reads
 *  as hostage-taking, and it converts worse than an honest one. */
export const TIER_COMPARISON: { label: string; free: string | true; plus: string | true }[] = [
  { label: 'Daily check-in and your hours number', free: true, plus: true },
  { label: 'Grounding, breathing, the hard-day path', free: 'Forever', plus: 'Forever' },
  { label: 'Crisis support and the therapist guide', free: 'Forever', plus: 'Forever' },
  { label: 'Learn modules', free: '3 of 12', plus: 'All 12' },
  { label: 'The twelve-week protocol', free: 'Week 1', plus: 'Weeks 1–12' },
  { label: 'Thought records', free: '5 a month', plus: 'Unlimited' },
  { label: 'Mirror practice, timed and graded', free: '—', plus: true },
  { label: 'Behavioural experiments', free: '—', plus: true },
  { label: 'Full progress history and charts', free: '—', plus: true },
  /* Free on both sides, because onboarding promises it before any data is collected:
     "there is no backup … you can export a plain-text copy whenever you like." Selling
     somebody the only route their own writing has off the device would make that sentence
     false, and it is the one thing between them and total loss when a phone dies. */
  { label: 'Export and full backup file', free: 'Forever', plus: 'Forever' },
];


/** Is this route gated for a non-entitled user? */
export function isGated(route: string, entitled: boolean): boolean {
  if (entitled) return false;
  if ((ALWAYS_FREE_ROUTES as readonly string[]).includes(route)) return false;
  return true;
}

export function weekGated(week: number, entitled: boolean): boolean {
  return !entitled && week > FREE_LIMITS.maxWeek;
}
