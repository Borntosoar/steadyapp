/* Every URL the app can open, in one file.
 *
 * There are three, they all open in Safari via `Linking.openURL`, and none of them is a
 * WebView. That last point is deliberate and worth keeping: an in-app WebView would make the
 * age-rating answer to "Unrestricted Web Access" a Yes, which raises the rating and invites
 * questions this app does not need to answer. Handing the URL to the system browser keeps
 * that answer No.
 *
 * THE HOST. GitHub Pages, serving site/dist — flat HTML, no JavaScript, no analytics, no
 * cookies. The marketing site has the same shape as the app for the same reason: there is
 * nothing on it to breach.
 *
 * Apple requires the privacy policy and the licence terms to be reachable from inside the
 * app as well as from the App Store listing (Guideline 3.1.2 / 5.1.1). They render beneath
 * the purchase button on the paywall. */

/** Set once the Pages deploy is live. Derived from the repository, so it is knowable now —
 *  but the site itself will not build until the legal documents' remaining blanks are
 *  filled, which is the intended order. See legal/README.md. */
export const SITE_ORIGIN = 'https://borntosoar.github.io/steadyapp';

export const LINKS = {
  privacy: `${SITE_ORIGIN}/privacy.html`,
  terms: `${SITE_ORIGIN}/terms.html`,
  /** Not linked from the paywall — it belongs with the support surfaces, not with a
   *  purchase — but it is the same site and it is the document App Review reads most
   *  closely. */
  disclaimer: `${SITE_ORIGIN}/disclaimer.html`,
} as const;
