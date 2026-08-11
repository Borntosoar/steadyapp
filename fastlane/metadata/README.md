# Store metadata, in git

Every indexed App Store field, as a file. `docs/APP-STORE.md` is the reasoning; this is the
decision, in the shape `fastlane deliver` and App Store Connect actually consume.

## One language, every territory

`primary_locale.txt` is `en-US`, and `en-US` is the only locale folder. That is a decision,
not a gap — see `docs/LOCALISATION.md`.

The app is **available worldwide and listed in English**. Those are separate settings in App
Store Connect and it is a normal, coherent combination: someone in Germany can find, buy and
use the app, and the listing they read is in English. What they must not get is an English
listing with a German crisis line that is wrong, which is why `constants/support.ts` covers
31 regions while the interface stays in one language.

Adding a locale folder here later is cheap and is the right first step into a new market —
listing metadata is short, translates well, and pays off before the app itself is translated.
`__tests__/store-metadata.test.mjs` reads every locale folder it finds, so a new one is
covered automatically for field limits and forbidden vocabulary. Its word lists are English,
which is the same gap `docs/LOCALISATION.md` §3 describes for the app's own copy tests, and
it closes the same way.

## Why it lives here rather than only in the dashboard

`docs/GROWTH.md` §7 ends with this line:

> **Any use of "clinically proven", "treatment", "therapy" in store metadata** — APP-STORE.md
> §5.5. `copy.test.mjs` does not cover store metadata, so this is a **discipline problem, not
> a test problem.**

That was true while the listing existed only inside App Store Connect, where nothing can
check it and a change leaves no diff. It is not true now. `__tests__/store-metadata.test.mjs`
reads these files and fails the build on treatment vocabulary, on an over-length field, on a
keyword repeated from the name or subtitle, and on the excluded eating-disorder terms.

The vocabulary rule is the one that matters most. A listing that says *treat*, *therapy*,
*clinically proven* or *cure* invites Guideline 1.4.1 scrutiny, and — separately and more
importantly — it would be false. Steady is a self-help tool built on methods that have been
trialled; it has not itself been trialled. That distinction is load-bearing everywhere else
in this repo, and the store listing is the one place a reviewer reads first.

## The fields

| File | Limit | Current | Why |
|---|---|---|---|
| `name.txt` | 30 | 26 | Highest-ranking field. Holds the two head terms. `docs/APP-STORE.md` §1 |
| `subtitle.txt` | 30 | 28 | Second-highest. Adds *mirror*, *worry*, *hours*. Must not repeat the name |
| `keywords.txt` | 100 | 99 | The highest-leverage field on the page. §2 |
| `primary_category.txt` | — | Health & Fitness | **Not Medical.** That category invites 1.4.1 review by default and buys nothing. §5.5 |

`description.txt`, `promotional_text.txt` and `release_notes.txt` are not written yet.
Description drafts are in `docs/APP-STORE.md` §3; move the chosen one here when it is picked,
and the test will start covering it automatically.

## Deliberately absent from the keyword field

`eating`, `anorexia`, `bulimia`, `calories`, `weight` — the app has no eating-disorder
content and `SAFETY.md` bans weight and calorie data outright. Traffic that converts once and
badly damages rankings, and it is arguably irrelevant metadata under 2.3.7.

`therapy`, `treatment`, `cure`, `clinical` — false, and the terms most likely to make a
reviewer read the listing as a medical claim.

`selfie`, `face`, `skin`, `filter`, `glowup` — collides with the beauty and camera categories,
where the intent is the exact opposite of this app's.

Both lists are asserted in the test. Adding one back should require deleting an assertion
with a comment explaining why, which is the point.

## In-app purchase display names

Indexed, 30 characters each, and shown in the purchase sheet — so they have to stay honest as
well as ranked. Set these in App Store Connect; there is no fastlane file for them:

- `Steady+ Yearly`
- `Steady+ Monthly`
- `Steady+ One-Time` — **never "Lifetime"**. App Review rejects it, and `__tests__/safety.test.mjs`
  keeps the word out of the app's own strings for the same reason.

## Uploading

`fastlane deliver` is not wired up yet, and it needs an App Store Connect API key that must
not be committed. Until then these files are the source of truth and the dashboard is a copy
of them, not the other way round.
