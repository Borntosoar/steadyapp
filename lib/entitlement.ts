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
 *   - The hardship tier is what makes this defensible. Nobody is priced out of Anneal —
 *     they are one visible, form-free tap from three months free. Given that, pricing the
 *     paid tier at its worth costs nobody anything and funds the free tier.
 *
 * Annual works out roughly half the monthly rate, which is the usual spread and enough to
 * make annual the obviously rational pick without needing a "SAVE 49%" badge shouting it.
 * The one-off option is a shade under two years of annual.
 *
 * THE WORD "LIFETIME" APPEARS IN NO USER-FACING STRING, and should not be reintroduced to
 * one. App Review has repeatedly rejected it on the grounds that no developer can promise
 * content for the length of a customer's life, and they are right — this is a solo project
 * with a twelve-week protocol, not an institution. "Pay once" says the same thing about
 * what the customer is buying and claims nothing about how long we will be here. The Plan
 * key below stays `lifetime` because it is an internal identifier that keys stored state
 * and the product-id mapping in hooks/useEntitlement.ts; renaming it would migrate saved
 * data to fix a word nobody reads. */
/** The things somebody can actually buy.
 *
 *  Declared separately from `PRICING` because `keyof typeof PRICING` also admits
 *  `yearlyPerMonth` and `trialDays`, which are display strings and a number. Typed that
 *  way, `purchase('trialDays')` compiled cleanly and would have granted entitlement and
 *  started a trial. */
import { NAMES } from '../content/names.ts';

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

/* The prices as numbers, so every figure derived from them is arithmetic rather than a
   typed literal that survives exactly one price change. The repo already learned this with
   the contrast ratios in constants/palette.ts: a number asserted in prose drifts silently,
   and the drift is invisible precisely because prose does not fail a build. A wrong saving
   on a paywall is worse than a wrong ratio in a comment — it is a claim about money made to
   somebody deciding whether to trust you. __tests__/entitlement.test.mjs pins the lot. */
export const PRICE_NUMBERS = { monthly: 12.99, yearly: 79.99, lifetime: 149 } as const;

const usd = (n: number) => `$${n.toFixed(2)}`;

export const PRICING = {
  monthly: '$12.99/mo',
  yearly: '$79.99/yr',
  /** Shown beside the annual figure. Anchor low, bill high — the pair reads as honest
   *  where either number on its own reads as a trick. */
  yearlyPerMonth: '$6.67 a month',
  lifetime: '$149 once',

  /** What twelve monthly payments actually cost, and what annual saves against them.
   *
   *  NOT a discount, and the distinction is the whole reason this is allowed here. There is
   *  no struck-through price, no deadline, no "was", and no percentage detached from its
   *  base — those are the grammar of a manufactured saving and SAFETY.md §13 rules them out.
   *  These are two prices both on offer today, with the arithmetic shown. The paywall used
   *  to print "$79.99/yr" beside "$6.67 a month" and leave the reader to compare it against
   *  a number on a different card in different type, which most people will not do. */
  monthlyPerYear: usd(PRICE_NUMBERS.monthly * 12),
  yearlySaving: usd(PRICE_NUMBERS.monthly * 12 - PRICE_NUMBERS.yearly),

  /* Long forms. The plan cards set the price as the card's own headline rather than as a
     figure pinned to the right edge, so "$12.99/mo" reads as an abbreviation there where
     "$12.99 a month" reads as a sentence — and, more to the point, it sits in the same
     type and the same left-hand line as "$6.67 a month" one card above, which is the
     comparison the reader was previously asked to make across two columns unaided. */
  monthlyLong: `${usd(PRICE_NUMBERS.monthly)} a month`,
  yearlyLong: `${usd(PRICE_NUMBERS.yearly)} a year`,
  lifetimeShort: `$${PRICE_NUMBERS.lifetime}`,
  /** One month, and the exact number matters less than the band it sits in.
   *
   *  Published medians put 17–32 day trials at roughly 45% trial-to-paid against roughly
   *  27% for three-to-seven days, and the mechanism is habit formation rather than
   *  patience — a fortnight is long enough to try the app and short enough to try it once.
   *  (That figure is one of the weaker ones in docs/SUBSCRIPTION-BENCHMARKS.md: longer
   *  trials also correlate with teams confident enough in the product to offer one, so
   *  some of the effect is the confidence, not the length. It points the right way even
   *  discounted.)
   *
   *  THIRTY, NOT TWENTY-ONE. The benchmarks doc recommends 21 days. App Store Connect does
   *  not sell that: introductory free trials come in fixed durations — 3 days, 1 week,
   *  2 weeks, 1 month, 2 months, 3 months, 6 months, 1 year — and 21 days is not among
   *  them. The purchasable options either side are two weeks (where we were) and one
   *  month, and one month is the one that lands inside the band above.
   *
   *  What it costs: weeks one to four go free, which includes the plateau the protocol
   *  names in week four. That is the right four weeks to give away. The plateau is where
   *  people quit, and somebody who has been told it was coming and watched it arrive on
   *  schedule has better evidence for renewing than any copy on the paywall.
   *
   *  This number is local arithmetic for display and for the trial-ending notice. Once
   *  RevenueCat is wired, the real expiry arrives from the provider and `trialExpiry` stops
   *  being consulted — a store-granted "1 month" is calendar, so it will land a day either
   *  side of this in some months, which nothing here depends on. */
  trialDays: 30,
};

/** What actually happens to the customer's money, one sentence per product.
 *
 *  Apple 3.1.2 requires the auto-renewing terms next to the purchase, not in a linked
 *  document, and the paywall used to render `Free until 9 September. Then $79.99/yr.` —
 *  which discloses the price and says nothing about the renewal. Worse, it said the same
 *  thing about the one-off product, which has no trial and never renews, so the one
 *  sentence on the screen was wrong for one of the three things it described.
 *
 *  Written out per product rather than assembled from the price strings, because the
 *  assembled version is where "a year, renewing every year" turns into "/yr, renewing
 *  every /yr" the first time somebody edits a price. */
export const RENEWAL_TERMS: Record<Plan, string> = {
  yearly: '$79.99 a year, renewing every year until you cancel',
  monthly: '$12.99 a month, renewing every month until you cancel',
  lifetime: '$149 once. Not a subscription, so there is nothing to renew and nothing to cancel',
};

/** The trial end date, as a date. A long trial showing only a duration is a trap; a long
 *  trial showing a date, an amount, and a promised reminder is a fair deal. */
export function trialEndDate(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + PRICING.trialDays);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
}

type TierRow = { label: string; free: string | true; plus: string | true };

/** What Anneal+ adds, rendered as the two-column grid.
 *
 *  WHY THIS IS SPLIT FROM WHAT FOLLOWS. It used to be one ten-row table titled "What you
 *  get either way", and the first three rows a reader met were ✓/✓, Forever/Forever,
 *  Forever/Forever. The rows are ordered by declaration, the top of any scanned list gets
 *  disproportionate attention, and so the first impression of the paid column was that it
 *  changes nothing. The section was arguing against itself.
 *
 *  The identical rows were never a comparison in the first place — they are an
 *  unconditional promise (SAFETY.md §4, §11b), and putting a promise inside a grid whose
 *  entire visual grammar says "these two things are being compared" makes it read as a
 *  shortfall. So they get a different FORM, not a different position: a plain ticked list
 *  below, with no columns to lose.
 *
 *  EVERY ROW HERE IS ENFORCED SOMEWHERE, AND TWO USED NOT TO BE.
 *
 *  This table is a promise made to somebody about to hand over money, so a row that no code
 *  backs is not a copy slip — it is a false statement of what is being sold, on the screen
 *  where it costs the most. Two were false:
 *
 *  1. "The twelve weeks — Week 1 / All 12" led the table while `weekGated()` had ZERO call
 *     sites, so a non-paying user had the entire protocol. The same claim sat in
 *     PAYWALL_COPY.sub, in the App Store description and in the promotional text — made four
 *     times and enforced none. The gate is wired up now (see `effectiveWeek`), so the row is
 *     back and true.
 *  2. "Test a prediction — — / ✓" claimed behavioural experiments were paid. They are gated
 *     by `phase.id >= 3` in app/journal.tsx, which is a PROTOCOL gate rather than an
 *     entitlement one. That row stayed out: a free user reaches week 7 only by subscribing
 *     now, so the week row already covers it and listing it twice would be double-counting.
 *
 *  Every row is what `weekGated`, `isGated`, `!entitled` and `FREE_LIMITS` enforce, each
 *  verified at its call site:
 *    · weeks    — app/(tabs)/{index,practice,learn}.tsx, `effectiveWeek(week, entitled)`
 *    · mirror   — app/mirror.tsx, `isGated('/mirror', entitled)`
 *    · Progress — app/(tabs)/progress.tsx, `if (!entitled)` on everything below the hero
 *    · reads    — app/(tabs)/learn.tsx, `m.free || entitled`, and 3 of the 12 are free
 *    · records  — app/journal.tsx, `FREE_LIMITS.thoughtRecordsPerMonth`
 *
 *  Ordered largest delta first: the two rows where the free column is empty, then the two cap
 *  rows — "5 a month" last, because it is the most generous free value on the list and the
 *  least persuasive thing in the block.
 *
 *  NOT LISTED, AND DELIBERATELY: the four games and the seven guided tracks are ungated. They
 *  are absent here rather than added to ALWAYS_FREE, because that list is an unconditional
 *  promise and nobody has decided to make one about them yet. Absent is accurate; promised
 *  would be a business decision this file should not make on its own. */
export const PLUS_ADDS: TierRow[] = [
  { label: 'The twelve weeks', free: 'Week 1', plus: 'All 12' },
  { label: NAMES.mirror.title, free: '—', plus: true },
  { label: 'The full picture on Progress', free: '—', plus: true },
  { label: 'Short reads', free: '3 of 12', plus: 'All 12' },
  { label: NAMES.thought.title, free: '5 a month', plus: 'No limit' },
];

/** Free on both tiers, forever. Rendered as a list, not a comparison.
 *
 *  The free column was always written generously on purpose — a visibly crippled one reads
 *  as hostage-taking and converts worse than an honest one. Splitting it out does not make
 *  it less generous; it stops the generosity being displayed as a deficit. */
export const ALWAYS_FREE: string[] = [
  `${NAMES.checkin.title} and your hours number`,
  `${NAMES.calm.title}, and the hard-day path`,
  'Crisis support and help finding a therapist',
  /* Free on both sides, because onboarding promises it before any data is collected:
     "there is no backup … you can export a plain-text copy whenever you like." Selling
     somebody the only route their own writing has off the device would make that sentence
     false, and it is the one thing between them and total loss when a phone dies. */
  'Export and full backup file',
];

/** Retained so existing consumers and docs/API.md keep working. The paywall renders the
 *  two lists above; nothing should add a row here. */
export const TIER_COMPARISON: TierRow[] = [
  ...PLUS_ADDS,
  ...ALWAYS_FREE.map((label) => ({ label, free: 'Forever' as const, plus: 'Forever' as const })),
];

/** Is this route gated for a non-entitled user? */
export function isGated(route: string, entitled: boolean): boolean {
  if (entitled) return false;
  if ((ALWAYS_FREE_ROUTES as readonly string[]).includes(route)) return false;
  return true;
}

/** True when somebody has EARNED a week the free tier does not include.
 *
 *  Wired up 2026-08-23, after a spell during which this had no call sites and the paywall
 *  claimed a gate that did not exist. It gates the PROGRAMME'S WEEK ADVANCE and nothing else,
 *  and that scope is not a matter of taste — two rules fix it:
 *
 *  · SAFETY.md §4 puts grounding, breathing, the hard-day path, the daily check-in and all
 *    crisis support beyond any billing state, forever.
 *  · `__tests__/safety.test.mjs` greps `app/urges.tsx` for ANY paywall reference, so riding
 *    out an urge cannot be gated either, at any week.
 *
 *  What is left that a week actually unlocks is mirror practice (already fully gated by
 *  `isGated`), behavioural experiments and the relapse plan. So rather than half-locking a
 *  practice list and leaving a free user staring at "Week 7 of 12" with most of it dark, the
 *  gate stops the WEEK ITSELF: see `effectiveWeek` below. */
export function weekGated(week: number, entitled: boolean): boolean {
  return !entitled && week > FREE_LIMITS.maxWeek;
}

/** The week to SHOW somebody, which is not always the week they have reached.
 *
 *  A free user who finishes week one keeps earning: `protocol.currentWeek` advances in
 *  storage exactly as before, their practice days, streak and check-ins are untouched, and
 *  the moment they subscribe they resume at the week they actually reached rather than being
 *  sent back to the start. What stops is the guided programme they are being shown.
 *
 *  Clamping here rather than in `recordPracticeDay` is deliberate. That function is pure, is
 *  used by the store, and must not learn about billing — and SAFETY.md §12b says entitlement
 *  fails toward the user, which a storage-layer gate makes very hard to honour when a
 *  subscription lapses mid-protocol. A read-time clamp fails toward the user by construction:
 *  the worst it can do is show week one to somebody who has paid, which the next render of a
 *  refreshed entitlement corrects. */
export function effectiveWeek(week: number, entitled: boolean): number {
  return entitled ? week : Math.min(week, FREE_LIMITS.maxWeek);
}

/** Maps a store product identifier back onto a Plan. Kept beside the seam because it is
 *  the one piece of the mapping that depends on how products were named in App Store
 *  Connect, and it is the piece most likely to be wrong on the first attempt. */
export function planForProduct(productId: string | null | undefined): Plan | null {
  if (!productId) return null;
  if (productId.includes('month')) return 'monthly';
  if (productId.includes('year') || productId.includes('annual')) return 'yearly';
  /* `onetime` and `one_time` map here too. docs/SUBMISSION-ANSWERS.md §5 names the
     non-consumable `steady_plus_onetime`, which contains none of the strings above — so a
     real one-off purchase would have returned null, cached `plan: null`, and broken every
     RENEWAL_TERMS[plan] lookup downstream. A test now walks the product table in that
     document and requires each id to resolve. */
  if (productId.includes('life') || productId.includes('onetime')
      || productId.includes('one_time') || productId.includes('one-time')) {
    return 'lifetime';
  }
  return null;
}
