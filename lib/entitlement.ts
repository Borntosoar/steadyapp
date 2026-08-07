/* Entitlement.
 *
 * v1 reads a local flag. There is no account, no network call, no receipt validation.
 *
 * THE RULE THAT OUTRANKS BILLING: safety is never gated. Grounding, breathing, crisis
 * support, the hard-day path, the daily check-in, and the support directory are free
 * forever. `isGated()` below is the single place that decides, and it hard-codes the
 * free set rather than deriving it — so gating one of them by accident requires
 * deliberately editing a list with a comment telling you not to. */

import { useStore } from '../store/useStore';

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
  { label: 'Export for a clinician', free: '—', plus: true },
];

export function useEntitlement() {
  const entitled = useStore((s) => s.entitled);
  const setEntitled = useStore((s) => s.setEntitled);

  return {
    entitled,
    /** REVENUECAT INTEGRATION POINT
     *  Replace this local setter with Purchases.purchasePackage() and drive `entitled`
     *  from customerInfo.entitlements.active. Nothing else in the app needs to change —
     *  every gate reads through this hook. */
    async purchase(_plan: keyof typeof PRICING) {
      setEntitled(true);
    },
    async restore() {
      // REVENUECAT INTEGRATION POINT — Purchases.restorePurchases()
      setEntitled(true);
    },
  };
}

/** Is this route gated for a non-entitled user? */
export function isGated(route: string, entitled: boolean): boolean {
  if (entitled) return false;
  if ((ALWAYS_FREE_ROUTES as readonly string[]).includes(route)) return false;
  return true;
}

export function weekGated(week: number, entitled: boolean): boolean {
  return !entitled && week > FREE_LIMITS.maxWeek;
}
