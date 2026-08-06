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

export const PRICING = {
  monthly: '$6.99/mo',
  yearly: '$44.99/yr',
  lifetime: '$89 once',
  trialDays: 7,
};

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
