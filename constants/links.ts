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

/** ⚠ PROVISIONAL, AND UNDER THE WRONG ACCOUNT. This is a GitHub Pages URL belonging to
 *  Borntosoar — a different company. Anneal is published by its own entity now, so the
 *  documents a user opens from inside the app should not be served by a host that entity
 *  does not control, and `legal/cookie-policy.md` names this address in its first line.
 *
 *  The real answer goes in `legal/entity.json` → `siteOrigin`, which is the single source
 *  for it; `__tests__/legal.test.mjs` fails if this constant and that field disagree once
 *  the field is answered. The value below stays only so the app still builds meanwhile.
 *  See legal/README.md §3. */
export const SITE_ORIGIN = 'https://borntosoar.github.io/steadyapp';

export const LINKS = {
  privacy: `${SITE_ORIGIN}/privacy.html`,
  terms: `${SITE_ORIGIN}/terms.html`,
  /** Not linked from the paywall — it belongs with the support surfaces, not with a
   *  purchase — but it is the same site and it is the document App Review reads most
   *  closely. */
  disclaimer: `${SITE_ORIGIN}/disclaimer.html`,
} as const;

/** The address a person can reach a human on.
 *
 *  Not a crisis line, and the support screen says so directly beneath it — on that screen of
 *  all screens somebody could reasonably assume otherwise.
 *
 *  It exists because without it the app had no outbound channel at all: a user who hit a bug
 *  or lost writing could only reach the public review page, which is slow, one-directional,
 *  and costs a rating for something that might have been fixable the same day. */
export const SUPPORT_EMAIL = 'steadyrecovery3@gmail.com';

/** Pre-filled so the reply is useful without asking somebody in distress to describe their
 *  setup. Deliberately carries NO device identifier, no state, and nothing from the journal:
 *  a mail draft the user can read and edit before sending is the only kind of report this
 *  app is willing to produce. */
export const SUPPORT_MAILTO =
  `mailto:${SUPPORT_EMAIL}` +
  `?subject=${encodeURIComponent('Anneal — feedback')}` +
  `&body=${encodeURIComponent(
    'What happened:\n\n\nWhat you expected instead:\n\n\n' +
      '(Please do not paste anything private you would rather not send. ' +
      'Nothing is attached to this message automatically.)\n'
  )}`;
