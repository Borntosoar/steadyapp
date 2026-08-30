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
 * REVENUECAT, WIRED
 *
 * These were three stubs and `purchase()` granted access to anybody who tapped it, with no
 * StoreKit and no receipt — a Guideline 2.1 rejection, and the reason `npm run preflight`
 * refused to build a release. They are real calls now:
 *
 *   configure  → Purchases.configure({ apiKey })                    (once, at launch)
 *   refresh    → Purchases.getCustomerInfo()                        (launch + foreground)
 *   purchase   → Purchases.purchasePackage(pkg)
 *   restore    → Purchases.restorePurchases()
 *
 * Each returns a CustomerInfo, which `toProvider` maps onto `ProviderEntitlement` for
 * `projectFromProvider`. That mapping is pure and already tested, so the only untested
 * surface is the SDK call itself.
 *
 * ⚠ THE API KEY IS NOT IN THIS FILE AND MUST NOT BE. It comes from `expo.extra
 * .revenueCatIosKey` in app.json, which is null until somebody with a RevenueCat account
 * fills it in. A null key means `configured` stays false, every call below returns null, and
 * the app behaves exactly as it did with the stubs — no purchases, nothing granted. That is
 * the correct failure: an app that cannot reach a payment provider must sell nothing rather
 * than give everything away, which is what the stub did.
 *
 * WHAT MUST NOT CHANGE
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
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
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
/** The store-facing half. Absent on web, and absent until a key exists.
 *
 *  `Platform.OS` because there is no StoreKit in a browser and `scripts/screenshots.mjs`
 *  drives the real web build — an SDK call that throws on launch there is a crash screen in
 *  every image, which is a failure this repository has already shipped once. */
const API_KEY: string | null =
  (Constants.expoConfig?.extra as { revenueCatIosKey?: string | null } | undefined)
    ?.revenueCatIosKey ?? null;

const SUPPORTED = (Platform.OS === 'ios' || Platform.OS === 'android') && !!API_KEY;

let configured = false;

/** Configure once. Idempotent, and quiet when there is nothing to configure. */
async function ensureConfigured(): Promise<boolean> {
  if (!SUPPORTED) return false;
  if (configured) return true;
  try {
    await Purchases.configure({ apiKey: API_KEY as string });
    /* ⚠ NO SUBSCRIBER ATTRIBUTES, EVER, and this is the line where that promise is kept or
       broken. RevenueCat will happily accept arbitrary key-value pairs about a customer, and
       every one of them leaves the device. Not the reclaimed figure, not a distress rating,
       not a streak, not the survey answer — SAFETY.md §6, and __tests__/safety.test.mjs
       fails the build on `setAttributes` anywhere in the source. What crosses the wire is a
       purchase and an anonymous app user id the SDK generates. */
    configured = true;
    return true;
  } catch {
    return false;
  }
}

/** Map a CustomerInfo onto the pure shape `projectFromProvider` consumes.
 *
 *  Returning null means "could not ask", which is deliberately distinct from returning
 *  `{ active: false }`, which means "asked, and they do not have it". The first must not
 *  revoke anything; the second must. */
function toProvider(info: CustomerInfo): ProviderEntitlement {
  const e = info.entitlements.active[ENTITLEMENT_ID];
  return e
    ? {
        active: true,
        productIdentifier: e.productIdentifier,
        expirationDate: e.expirationDate,
        willRenew: e.willRenew,
        periodType: e.periodType,
      }
    : { active: false };
}

async function fetchProviderEntitlement(): Promise<ProviderEntitlement | null> {
  if (!(await ensureConfigured())) return null;
  try {
    return toProvider(await Purchases.getCustomerInfo());
  } catch {
    /* Could not ask. NOT `{ active: false }` — see above. A timed-out receipt check must
       never look like a cancellation. */
    return null;
  }
}

/** The offering package matching a plan, or null when the catalogue has not loaded.
 *
 *  Looked up by product identifier rather than by RevenueCat package type, because the
 *  product ids are the things App Store Connect owns and `planForProduct` already maps them
 *  in a file the suite can reach. A package type mapping would be a second, untested
 *  translation of the same fact. */
async function packageFor(plan: Plan): Promise<PurchasesPackage | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const all = offerings.current?.availablePackages ?? [];
    return all.find((p) => planForProduct(p.product.identifier) === plan) ?? null;
  } catch {
    return null;
  }
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

    /** Buy. Returns what happened, so the screen can tell the truth about it.
     *
     *  ⚠ IT NO LONGER GRANTS ANYTHING ON ITS OWN. This used to end with a `localGrant`,
     *  unconditionally — one tap and the content unlocked with no StoreKit and no receipt,
     *  for anybody, forever. The entitlement now comes back from the store or it does not
     *  come at all, and `projectFromProvider` is the only thing that writes it.
     *
     *  A cancelled purchase is not an error. The user pressed cancel in a system sheet;
     *  saying "something went wrong" to that is the app misreading a decision as a fault. */
    async purchase(plan: Plan): Promise<'bought' | 'cancelled' | 'unavailable'> {
      const pkg = await packageFor(plan);
      if (!pkg) return 'unavailable';
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        setEntitlement(projectFromProvider(toProvider(customerInfo), planForProduct));
        return 'bought';
      } catch (e) {
        const cancelled = (e as { userCancelled?: boolean } | null)?.userCancelled === true;
        return cancelled ? 'cancelled' : 'unavailable';
      }
    },

    /** Restore. Re-grants an existing entitlement; it never begins a trial.
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
      if (!(await ensureConfigured())) return false;
      try {
        const info = await Purchases.restorePurchases();
        setEntitlement(projectFromProvider(toProvider(info), planForProduct));
        return true;
      } catch {
        return false;
      }
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
