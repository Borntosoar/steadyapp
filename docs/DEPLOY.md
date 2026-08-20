# Releasing Anneal

From a machine with nothing on it to a build in TestFlight, and from TestFlight to a
submission. Written for one person with one Apple account, because that is what this is.

Two things to know before reading:

**The code is the least blocked part.** Most of this document is about a legal entity, a
number issued by a credit bureau, and a form at Apple. None of it can be automated, most of
it is measured in weeks, and all of it has to happen before a build is worth making.

**Nothing here invents a credential.** Where a value is unknown — the Apple Team ID, the App
Store Connect app ID, the API key — this document says so and the pipeline fails loudly
rather than carrying a plausible-looking placeholder. A fake that looks real is worse than a
gap, because a gap gets filled.

---

## 1. Where this actually stands

Run it rather than trusting this paragraph:

```bash
npm run preflight
```

At the time of writing it reports three blocker groups, and they are the same three as
`docs/READINESS.md` → "Next, in order":

1. `legal/entity.json` is unanswered — five fields, one file, and everything downstream of
   the privacy-policy URL is waiting on them.
2. There is no reachable privacy policy, because of 1.
3. RevenueCat is not wired. `purchase()` and `restore()` are local flags.

Plus the one nothing in the repository can see: **there is no Apple Developer account of the
right type.** That is §2, it is the longest lead item, and everything else is downstream.

Preflight exits `0` when every check ran and passed, `1` on a blocker, and `2` when a check
could not run at all — an incomplete preflight is not a pass and must not be able to satisfy
a CI gate by accident.

---

## 2. The chain that cannot be hurried

Strictly ordered. Each step needs the one above it, and the first two are the ones that take
real time. **Start them before anything else, including finishing the app.**

| # | Step | Needs | Realistic time |
|---|---|---|---|
| 2.1 | Decide the entity: incorporate, or sole proprietorship with a registered trade name | A decision | An evening, then hours to days to register |
| 2.2 | Get a D-U-N-S number for it | 2.1 | **Weeks. Start here.** |
| 2.3 | Enrol in the Apple Developer Program as an **Organization** | 2.2 | Days to weeks, plus a verification call |
| 2.4 | Register the App ID `com.anneal.app` and create the App Store Connect record | 2.3 | Minutes |
| 2.5 | Fill in `legal/entity.json`, publish the site, get a live privacy URL | 2.1 | An hour |
| 2.6 | Wire RevenueCat, create the three products in App Store Connect | 2.4 | A day |
| 2.7 | First build, TestFlight, submit | all of the above | See §7–§8 |

### 2.1 The entity

`legal/README.md` §3 is the authority on this and it is worth reading in full. The short
version: **"Anneal" is a brand, not a party to a contract.** `site/entity.mjs` rejects the
bare app name outright, because terms of use are only enforceable by and against a legal
person that exists.

Two shapes are acceptable, and the choice has consequences beyond this document:

- **A corporation** — `Anneal Inc.` or similar, subject to a NUANS name search. Slower and
  costs more. It is what Apple's Organization requirement effectively forces, because the
  D-U-N-S number in 2.2 wants a business, and it puts a corporate veil between an app in this
  subject area and personal assets.
- **A sole proprietorship** — `Firstname Lastname, carrying on business as Anneal`. Faster
  and cheaper, no veil, and the registered address in the published privacy policy is
  normally a home address. `legal/README.md` §3.3 lists the three ordinary ways around that;
  decide it deliberately rather than by default, because it is obvious only after it is
  indexed.

The **province** is a separate field and a real decision: contract law in Canada is
provincial. ⚠ If the answer is Quebec, the documents as written are not usable — Bill 96,
Law 25 and the Consumer Protection Act all apply and none is addressed. The build blocks
Quebec until `quebecCounselConfirmed` is set, which should only happen after a lawyer has
actually read them.

### 2.2 The D-U-N-S number

Free, issued by Dun & Bradstreet, and required for an Organization enrolment. Apple runs its
own lookup and request form for developers; use that one rather than going to D&B directly,
because Apple's path is the one whose output Apple checks against.

**Turnaround is the thing to plan around, not the effort.** Apple's form is fifteen minutes.
The number itself has historically taken anywhere from a few days to several weeks depending
on whether the business is already in D&B's database and whether the details match exactly.
Check the stated turnaround on Apple's page when you file — it changes — and assume weeks.

The name, address and phone number on the D-U-N-S record must match the entity **exactly**,
including punctuation. A mismatch is the usual reason an enrolment stalls, and correcting a
D&B record is another wait on top of the first.

### 2.3 The Apple Developer Program, as an Organization

$99 USD/year. Not an Individual account: Guideline 5.1.1(ix) covers apps in highly regulated
fields, healthcare is named explicitly, and App Review applies it to mental-health apps
routinely. It cannot be argued away with documentation and it cannot be fixed by editing the
app — see `docs/APP-STORE.md` §5.1.

Apple verifies the entity against the D-U-N-S record and usually telephones the number on it.
Expect days to weeks. There is no way to start this earlier and no way to speed it up.

**The account this ships from is Anneal's own, not SOAR's.** That is decided and recorded in
`legal/entity.json` → `_DECIDED`.

### 2.4 The App ID and the App Store Connect record

Once the account exists:

- Register the App ID for `com.anneal.app`. **A bundle identifier is permanent.** It cannot
  be renamed, and it binds the app to whichever Apple account registers it first. Registering
  it under the wrong account is not a mistake that can be undone — it means a new listing at
  zero downloads. Confirm it is free at this point; uniqueness is store-wide and cannot be
  checked from outside App Store Connect.
- Create the app record and **reserve the name**. The App Store name has to be unique
  store-wide. `scripts/check-name.mjs` found no App Store result for Anneal on a web-evidence
  check, which is most of the risk but not all of it — a name reserved by another developer
  for an app that never shipped is invisible to that check and still enough to block you.
  Reserving is free and holds it for a year.
- The listing name is `fastlane/metadata/en-US/name.txt` (`Anneal: Body Image Anxiety`, 26
  characters). The name on the home screen is `app.json` → `expo.name` (`Anneal`). They are
  different fields and both are right.

---

## 3. From a clean machine

```bash
git clone <this repo> && cd <it>
npm ci                     # not npm install; the lockfile is the pinned truth
npm test && npm run typecheck
```

Requires **Node 22+**. The test suite uses Node's built-in TypeScript stripping and there is
no test runner to install.

For releases, additionally:

```bash
npm i -g eas-cli           # or use npx eas-cli@latest, which is what CI does
eas login                  # Expo account, not Apple
```

**You do not need a Mac.** EAS builds run on Expo's macOS machines, and `eas submit` uploads
from anywhere. You do need **an iPhone** to test the TestFlight build, and honestly you need
one anyway — `docs/READINESS.md` §3.3 lists three things (VoiceOver announcement order, real
cold-start time, real binary size) that no test in this repository can reach.

An iOS **simulator** build needs no Apple credentials at all, which makes it the only EAS
build possible before §2 finishes:

```bash
eas build --platform ios --profile development   # simulator; runs on a Mac's simulator only
```

---

## 4. The legal site, and the URL Apple demands

Nothing here needs the Apple account, so it can be done in parallel with §2.

1. Fill in the five fields in `legal/entity.json`. One file, one edit, and every document
   fills itself from it — they carry `{{ENTITY_NAME}}` and friends rather than the text.
2. Build it:
   ```bash
   npm run site        # refuses while any field is null; ALLOW_TODOS=1 previews
   ```
   Never publish the `ALLOW_TODOS` preview. It leaves `{{TOKENS}}` standing in a live legal
   document, and `scripts/preflight.mjs` treats a published page containing one as a blocker
   for that reason.
3. Turn on GitHub Pages: repository **Settings → Pages → Source: GitHub Actions**. That is
   the whole setup; `.github/workflows/deploy-site.yml` already exists and runs the build
   without `ALLOW_TODOS`, so a deploy fails rather than publishing a hole.
4. Set `constants/links.ts` → `SITE_ORIGIN` to the same origin as `entity.json` →
   `siteOrigin`. `__tests__/legal.test.mjs` fails if they disagree; preflight fails if either
   is missing or the pages do not load.
5. Put the same URL in App Store Connect's Privacy Policy URL field.

The paywall already links both documents (`app/paywall.tsx` → `LINKS`), which is the second
half of Guideline 3.1.2. Once the URLs are live, that item is closed.

---

## 5. RevenueCat

`docs/APP-STORE.md` §5.3: shipping the stubs is a Guideline 2.1 rejection, and arguably
3.1.1, because paid content unlocks without in-app purchase.

The seam is one file. `hooks/useEntitlement.ts` carries four `REVENUECAT INTEGRATION POINT`
markers and the mapping behind them (`projectFromProvider`) is pure and already tested, so
the only untested surface left is the SDK call itself. Its header lists what must not change
when that happens; the first item is that no app state may be sent as a subscriber attribute.

Two things must land in the **same submission** as the SDK, not afterwards:

- `legal/privacy-policy.md` has to say that purchase history and an app user ID now leave the
  device. Preflight blocks a build where `react-native-purchases` is installed and the policy
  never names RevenueCat.
- The **App Privacy label** in App Store Connect flips from "Data Not Collected" to Purchase
  History + User ID, both unlinked and not used for tracking. Both states are already written
  out in `docs/SUBMISSION-ANSWERS.md` §3. A label that understates collection is a 5.1.1
  problem and one of the faster routes to removal. Nothing in this repository can check it.

The three products, created in App Store Connect with these display names (indexed, 30
characters each, shown in the purchase sheet): `Anneal+ Yearly`, `Anneal+ Monthly`,
`Anneal+ One-Time`. Never the word the store rejects for a one-off purchase; the internal
`Plan` key stays as it is because it keys stored state.

The introductory offer must be a duration App Store Connect actually sells. `PRICING.trialDays`
is 30, i.e. the "1 month" offer. Preflight checks this against the purchasable list.

---

## 6. Versions and build numbers

**Two numbers, and they are routinely confused.**

| | Where | Who sees it | Rule |
|---|---|---|---|
| `version` | `app.json` → `expo.version`, `package.json`, `package-lock.json` | Customers | Up to three dot-separated numbers. May repeat across builds. The release tag is `v` + this |
| `buildNumber` | `app.json` → `expo.ios.buildNumber`, mirrored to `android.versionCode` | TestFlight, and Apple's crash reports | Must be strictly greater than every build already uploaded |

### A script, not `autoIncrement` — and why

EAS offers to manage this two ways. Both were wrong here.

`appVersionSource: "remote"`, which is what `eas.json` said, keeps the build number in EAS's
database. Under it the value in `app.json` is decorative, nothing in the repository can answer
"which build is 2.0.0?", and the counter has exactly one copy — recreate the EAS project or
move off EAS and it restarts below numbers already uploaded, at which point App Store Connect
refuses every build until you guess your way back past the highest one.

`appVersionSource: "local"` with `autoIncrement: true` increments `app.json` **on the build
machine**. In CI that machine is a container that is deleted afterwards, so the number that
shipped never reaches git and the tag stops describing the binary.

Both trade an auditable release for one saved keystroke. This app has no server, no analytics
and no crash reporter, by design. When somebody reports a problem, the only evidence available
is the build number they can read in Settings and whatever git says about it. That link is
load-bearing, so the numbers move in a commit:

```bash
npm run version:set                # show what is set now
npm run version:set -- build       # same version, next build (a TestFlight iteration)
npm run version:set -- 2.1.0       # new customer-visible version, and the next build
```

The script does not commit and does not tag. Preflight then checks the numbers against
`app.json` **as it stood at the previous release tag**, which is how monotonicity is enforced
without keeping state anywhere outside git — and why `.github/workflows/release.yml` checks
out with full history and tags.

---

## 7. Building

### 7.1 The first production build must be interactive, once

EAS creates the distribution certificate and provisioning profile by signing into Apple on
your behalf, and that cannot happen in CI the first time. From a laptop, after §2.4:

```bash
eas build --platform ios --profile production
```

Answer the credential prompts. Afterwards the credentials live on EAS's servers and every
later build — including the one CI runs — can be `--non-interactive`.

`eas.json` sets `requireCommit`, so a build from a dirty tree is refused. That is the same
argument as §6: the commit is the record.

### 7.2 Every build after that

```bash
npm run version:set -- build
npm run preflight -- --tag v2.0.0
git commit -am "Release 2.0.0 (build 2)"
git tag v2.0.0
git push --follow-tags
```

The tag triggers `.github/workflows/release.yml`, which runs typecheck, the suite, the web
export and preflight, and only then queues the build. It uses `--no-wait` and prints the
build URL to the job summary: an iOS build is twenty to forty minutes of somebody else's
machine, and a private repository is billed for every minute a runner spends watching it.

**The one secret it needs, which does not exist yet:** `EXPO_TOKEN`, created at
`https://expo.dev/settings/access-tokens` and added under **Settings → Secrets and variables
→ Actions**. It authenticates the Expo CLI as the account that owns the project ID in
`app.json`. It is not an Apple credential and grants nothing at Apple. The workflow checks
for it in its first step and fails with that sentence rather than dying four steps later with
"not logged in".

`workflow_dispatch` runs everything except the build, so the pipeline can be exercised before
a tag is spent on it.

---

## 8. Submitting

Not automated, and not because it is hard. `eas submit` needs an App Store Connect API key,
which needs the Organization account from §2.3. Wiring a submission step today would mean
inventing a secret name for a key nobody can create yet.

```bash
eas submit --platform ios --latest
```

It prompts for what it needs and can create the API key for you on first run. Once that key
exists it can be added to `eas.json` → `submit.production.ios` (`ascAppId`, `appleTeamId`,
`ascApiKeyPath` or the `EXPO_ASC_*` environment variables — the real names are in Expo's
docs, and none of them are guessed at in this repository).

### What is manual in App Store Connect, permanently

None of these live in the repository, and every one of them can hold a submission:

- **Age rating questionnaire.** Answers in `docs/SUBMISSION-ANSWERS.md` §2. Since the 2025
  overhaul an app that has not answered it cannot be submitted or updated at all.
- **App Privacy label.** `docs/SUBMISSION-ANSWERS.md` §3, both states — see §5 above.
- **App Review notes.** `docs/SUBMISSION-ANSWERS.md` §1. The hardship path in particular: an
  unexplained free-unlock button beside a paywall reads to a reviewer exactly like a
  circumvention of in-app purchase, and it is the opposite.
- **Screenshots.** Six frames, `docs/APP-STORE.md` §4, and **no human face in any of them**,
  including the mirror screens. `npm run shots:store` renders them.
- **In-app purchase products**, prices, and the introductory offer.
- **Export compliance.** `usesNonExemptEncryption: false` is already in `app.json`, so the
  question should stop being asked per build.
- **Pricing and availability.** Worldwide, listed in English — a deliberate combination, see
  `fastlane/metadata/README.md`.

The listing text itself is in `fastlane/metadata/`, not in the dashboard. Treat the files as
the source and the dashboard as the copy. `fastlane deliver` would automate the copying and
needs the same API key as `eas submit`.

### TestFlight, before any of that

Internal testers (up to 100, on your own team) get the build as soon as processing finishes —
usually minutes. External testers need Beta App Review, which is a lighter version of the
real thing and typically about a day. Everything in `docs/READINESS.md` that says "needs a
device" happens here.

---

## 9. After it ships

**There is no rollback.** This is worth internalising, because every instinct from web
deployment is wrong here:

- A build that is on the App Store cannot be withdrawn and replaced with the previous one.
  Customers who already updated stay on it.
- What you can do: **remove the app from sale** (drastic, and it hides the listing), or ship a
  fix. A fix is a new build, a new review, and typically a day or more — request an expedited
  review only for something genuinely severe, because the goodwill is finite.
- **Turn on phased release** for automatic updates. It rolls out over seven days and can be
  paused from App Store Connect. It is the closest thing to a canary this platform has, it
  costs nothing, and pausing it is the only fast lever that exists.

**There is no over-the-air update path, deliberately.** `expo-updates` is not a dependency, so
every change ships as a build through review. Adding it would buy a fast fix for JavaScript
bugs, and would also mean the binary Apple reviewed is not necessarily the code that runs —
which for this app is a bigger claim than it sounds, given what `__tests__/safety.test.mjs`
enforces about the shipped source. If it is ever added, that trade is the conversation to
have, not a footnote.

**There is no crash reporter, and that is a decision, not a gap.** `docs/READINESS.md` §1.3
marks crash visibility amber for exactly this reason: Apple's free crash reports are the only
signal, they need the customer to have opted into sharing, and they arrive in App Store
Connect and Xcode Organizer rather than in an inbox. Check them after every release. The
alternative — an SDK — would mean this app phones home, which `SAFETY.md` forbids and the
privacy policy denies in writing.

---

## 10. What is deliberately not automated

| Not automated | Why |
|---|---|
| Submission to App Store Connect | Needs a key that needs an account that needs a D-U-N-S number. §8 |
| Metadata upload (`fastlane deliver`) | Same key. The files are the source meanwhile |
| Screenshot upload | Same, plus every frame wants a human eye on it |
| Version bumps in CI | §6 — the number would not reach git |
| Release notes | Three sentences a person should write, once per release |
| Build notifications | No third party in this pipeline. §9, and `SAFETY.md` |
| Anything that reads app state | There is no telemetry to read and there will not be |

---

## 11. The whole thing, as commands

```bash
# once, when §2 is done
eas login
eas build --platform ios --profile production      # interactive, creates credentials

# every release
npm run version:set -- build                       # or -- 2.1.0
npm run preflight -- --tag v2.0.0                  # exits 1 on a blocker, 2 if incomplete
git commit -am "Release 2.0.0 (build 2)"
git tag v2.0.0 && git push --follow-tags           # CI verifies, then queues the build
eas submit --platform ios --latest                 # manual, prompts for what it needs
```

Read `docs/READINESS.md` before the first one of these, and `docs/APP-STORE.md` §5 before the
last one.
