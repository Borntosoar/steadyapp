/* The entitlement hook.
 *
 * Lives here rather than in lib/ because it imports the store and returns React state, and
 * lib/ is required to stay pure — the whole test suite works by importing lib modules
 * straight into .mjs files under bare Node, which a module that reaches for zustand breaks.
 * The policy it enforces (ALWAYS_FREE_ROUTES, isGated, the tier tables) stays in
 * lib/entitlement.ts, where it can be tested without mounting anything.
 *
 * `entitled` is COMPUTED on every read and never stored. That is the whole point of the
 * rewrite: the old model persisted a boolean that nothing in the app ever set back to
 * false, so a refund, an expiry, a cancellation or a failed renewal all left a permanent
 * grant behind. Access is now a question asked fresh against a timestamped cache.
 *
 * REVENUECAT INTEGRATION
 *
 * Three functions below are stubs and all three are marked. Replacing them is the entire
 * integration; nothing outside this file needs to change, because every consumer reads
 * `entitled` and `isGated` rather than touching the cache.
 *
 *   configure  → Purchases.configure({ apiKey })                    (once, at launch)
 *   refresh    → Purchases.getCustomerInfo()                        (launch + foreground)
 *   purchase   → Purchases.purchasePackage(pkg)
 *   restore    → Purchases.restorePurchases()
 *
 * Each returns a CustomerInfo; map `customerInfo.entitlements.active[ENTITLEMENT_ID]` onto
 * `ProviderEntitlement` and hand it to `projectFromProvider`. The mapping is pure and
 * already tested, so the only untested surface left is the SDK call itself.
 *
 * WHAT MUST NOT CHANGE WHEN THAT HAPPENS
 *
 *   - No AppState-derived value may be sent as a subscriber attribute. Not the reclaimed
 *     figure, not a distress rating, not a streak. SAFETY.md §6 says nothing leaves the
 *     device, and "it's only analytics" is how that promise gets broken.
 *   - A failed refresh must never revoke. `refresh()` below writes nothing on error, so
 *     the cached entitlement stands and `isEntitled` extends its offline grace.
 *   - The hardship grant must keep working with no network at all. It is a local grant by
 *     design and must not be routed through the provider.
 */

import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  isEntitled,
  localGrant,
  planForProduct,
  projectFromProvider,
  trialExpiry,
  type Entitlement,
  type Plan,
  type ProviderEntitlement,
} from '../lib/entitlement';

/** The entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'anneal_plus';

/* `planForProduct` moved to lib/entitlement.ts.
 *
 * It is a pure string-to-Plan mapping with no React and no native dependency, and it lived
 * here — beside the RevenueCat seam — because the naming is an App Store Connect concern.
 * That reasoning was fine and the consequence was not: this file imports the store, so it
 * cannot load under bare node, so nothing in the suite could test the mapping. It shipped
 * unable to resolve `steady_plus_onetime`, one of the three products in the price table.
 * Policy that decides what somebody has bought belongs in the file that already calls itself
 * "the single place that decides", where a test can reach it. */
/** REVENUECAT INTEGRATION POINT — replace with a real `getCustomerInfo()` call.
 *  Returning null means "could not ask", which is deliberately distinct from returning
 *  `{ active: false }`, which means "asked, and they do not have it". The first must not
 *  revoke anything; the second must. */
async function fetchProviderEntitlement(): Promise<ProviderEntitlement | null> {
  // const info = await Purchases.getCustomerInfo();
  // const e = info.entitlements.active[ENTITLEMENT_ID];
  // return e
  //   ? { active: true, productIdentifier: e.productIdentifier,
  //       expirationDate: e.expirationDate, willRenew: e.willRenew, periodType: e.periodType }
  //   : { active: false };
  return null;
}

export function useEntitlement() {
  const entitlement = useStore((s) => s.entitlement);
  const setEntitlement = useStore((s) => s.setEntitlement);

  /** Ask the provider and re-project. Safe to call on every launch and foreground.
   *
   *  Writes nothing when the provider cannot be reached — a plane, a dead cell, a store
   *  outage — so the cached entitlement stands and `isEntitled` covers the gap with its
   *  offline grace. Silently locking somebody out of a twelve-week protocol because a
   *  receipt check timed out is not a bug we are going to ship twice. */
  const refresh = useCallback(async () => {
    const provider = await fetchProviderEntitlement().catch(() => null);
    if (!provider) return;
    // A local hardship grant is ours, not the store's, and a provider that has never heard
    // of it must not be allowed to take it away.
    if (entitlement.source === 'hardship' && !provider.active) return;
    setEntitlement(projectFromProvider(provider, planForProduct));
  }, [entitlement.source, setEntitlement]);

  return {
    /** Computed, every read. Never persisted. */
    entitled: isEntitled(entitlement),
    entitlement,
    refresh,

    /** REVENUECAT INTEGRATION POINT — Purchases.purchasePackage(), then project the
     *  returned customerInfo exactly as `refresh` does. */
    async purchase(plan: Plan) {
      // Only a subscription has a trial to end. A one-off lifetime payment has nothing to
      // renew, so it gets no expiry and never produces a trial-ending notice.
      const next: Entitlement =
        plan === 'lifetime'
          ? localGrant('purchase', 'lifetime', null)
          : localGrant('trial', plan, trialExpiry());
      setEntitlement(next);
    },

    /** REVENUECAT INTEGRATION POINT — Purchases.restorePurchases().
     *  A restore re-grants an existing entitlement; it never begins a trial.
     *
     *  Returns false when the provider could not be reached, so the caller can say so
     *  rather than implying the restore succeeded.
     *
     *  WHY THIS NO LONGER GRANTS ON FAILURE. It used to end with an unconditional
     *  `setEntitlement(localGrant('purchase', null, null))` — a record with no expiry, which
     *  `isEntitled` returns true for forever. The comment called it a v1 stub, but the
     *  `.catch(() => null)` above collapses "the network failed" into the same `null` as
     *  "no provider is wired", so the moment RevenueCat lands this becomes live: airplane
     *  mode, one tap on Restore, permanent Anneal+ with no receipt. In an app that is
     *  deliberately offline-capable end to end, staying offline is a normal way to use it,
     *  not a corner case.
     *
     *  Note the asymmetry with `refresh()` above, which is deliberate and stays. Failing
     *  open is right there because it PRESERVES an existing cache — the cost of being wrong
     *  is somebody keeping access they already paid for. Here it would CREATE one out of
     *  nothing, and the cost of being wrong is the entitlement model meaning nothing. */
    async restore(): Promise<boolean> {
      const provider = await fetchProviderEntitlement().catch(() => null);
      if (!provider) return false;
      setEntitlement(projectFromProvider(provider, planForProduct));
      return true;
    },

    /** The hardship path. Local by design: it must work with no network, no account and
     *  no receipt, because somebody who cannot pay is not a lower-value user and should
     *  not have to be online to say so. */
    async grantHardship(months = 3) {
      const ends = new Date();
      ends.setMonth(ends.getMonth() + months);
      setEntitlement(localGrant('hardship', null, ends.toISOString()));
    },
  };
}
