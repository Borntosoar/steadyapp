/* The entitlement hook.
 *
 * Lives here rather than in lib/ because it imports the store and returns React state, and
 * lib/ is required to stay pure — the whole test suite works by importing lib modules
 * straight into .mjs files under bare Node, which a module that reaches for zustand breaks.
 * The policy it enforces (ALWAYS_FREE_ROUTES, isGated, the tier tables) stays in
 * lib/entitlement.ts, where it can be tested without mounting anything. */

import { useStore } from '../store/useStore';
import type { Plan } from '../lib/entitlement';

export function useEntitlement() {
  const entitled = useStore((s) => s.entitled);
  const setEntitled = useStore((s) => s.setEntitled);

  return {
    entitled,
    /** REVENUECAT INTEGRATION POINT
     *  Replace this local setter with Purchases.purchasePackage() and drive `entitled`
     *  from customerInfo.entitlements.active. Nothing else in the app needs to change —
     *  every gate reads through this hook. */
    async purchase(plan: Plan) {
      // Only a subscription has a trial to end. A one-off lifetime payment has nothing to
      // renew, so stamping a trial clock on it would schedule a warning about a charge
      // that is never going to happen.
      setEntitled(true, plan !== 'lifetime');
    },
    async restore() {
      // REVENUECAT INTEGRATION POINT — Purchases.restorePurchases()
      // A restore re-grants an existing entitlement; it never begins a trial.
      setEntitled(true, false);
    },
  };
}
