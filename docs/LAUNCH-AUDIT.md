# Pre-launch audit

Audited against the source on 27 August 2026, not against a description of it. Every claim
below was checked by running something — the build, the tests, a grep — and the ones that
could not be checked from a terminal are collected at the end rather than guessed at.

**Eight of the twenty items on the standard checklist do not apply to Anneal.** That is not
luck. It is one architectural decision — no server, no account, no network call — paying off
eight times. The same decision makes two other items *structurally impossible*, which is the
part a generic checklist cannot anticipate and the part most worth reading.

| | Count |
|---|---|
| Hard blockers — rejection or day-one failure | 6 |
| Deliberate risks, already documented elsewhere in `docs/` | 3 |
| Pass | 3 |
| Not applicable by architecture | 8 |

**One file causes three of the six blockers.** `legal/entity.json` has six unanswered fields;
`site/build.mjs` refuses to build while any remain, which I confirmed by running it. So the
legal site has never deployed, which means the privacy-policy URL in the app is dead (item 4,
an automatic rejection), the trader address does not exist (item 15), and support is still a
personal Gmail (item 14). Answering that one file is the highest-leverage hour here.

---

## Items 6–11 — the ones that fail silently

The cleanest block in the audit, for a structural reason: an app with no server, no API keys
and no outbound request cannot fail in most of these ways. Two need action.

### 6. SPF, DKIM, DMARC — N/A today, live the moment item 14 is done
The app sends no email. `constants/links.ts` exposes a `mailto:` draft the user reads and
edits before sending; nothing of ours passes a spam filter. **This becomes real as soon as
support moves to a domain** — replies to distressed users landing in spam is the failure.
Add the records in the same sitting as the domain, not after.

### 7. Test signup with a fresh Gmail — N/A
There is no signup. Grepped `app/`, `store/`, `lib/`, `hooks/` for auth, login, password or
account creation: no hits (the only match was the word "authenticated" in a Poly1305 comment).
The analogue worth one manual test: the support inbox is the app's only channel to a human.

### 8. Hard spend caps — N/A
No API keys to steal. Scanned the tree for OpenAI, Google, RevenueCat and PEM key patterns
and for `.env` files: nothing, and no `.env` exists. Enforced rather than merely true —
`__tests__/safety.test.mjs` holds an import allowlist that fails the build on any package
outside twelve approved ones. No endpoint costs money per call because there is no endpoint.

### 9. LLM credit balance — N/A
No model is called and none runs on the phone. `legal/ai-policy.md` says so publicly and
`__tests__/ai.test.mjs` guards the claim, so it cannot quietly stop being true.

### 10. Pausing free tier — pass
No Supabase, no Render, no backend. The one hosted artefact is the legal site on GitHub
Pages: static, no JavaScript, and Pages does not sleep. The caveat is not that it pauses —
it is that it has never been published at all. See item 4.

### 11. Rehearse a restore — **partial, and the one in this block that applies**
There is no production database, but the GitLab lesson lands harder somewhere else: **users
have exactly one backup mechanism and no server copy.** If import is broken on a fresh
install, the data is simply gone.

Checked and reassuring: exports are written in **cleartext**, not sealed with the device key
(`lib/storage.ts`), so a backup taken on a drowned phone opens on a new one — the failure
mode worth fearing is not present. `importJson` is unit-tested including newer-payload
quarantine (`__tests__/audit-regressions.test.mjs`).

What has never happened is an end-to-end rehearsal on a device: export from a real build,
delete the app, reinstall, import, confirm the writing returns. **Do this during TestFlight
and write the steps down.**

---

## The six hard blockers

### 4. Privacy policy is not hosted — and points at another company
`constants/links.ts` ships `https://borntosoar.github.io/steadyapp`, a Pages address
belonging to Borntosoar, while Anneal is published by its own entity. The file's own comment
flags it as provisional. Running `node site/build.mjs` exits 1 with *"Refusing to build"* and
lists six unanswered questions; `.github/workflows/deploy-site.yml` runs that same command,
so the deploy has never succeeded. Five documents are affected: privacy, terms, disclaimer,
health-data, AI.

**Fix:** answer `legal/entity.json`, point `siteOrigin` at a domain the Anneal entity
controls, enable Pages (Settings → Pages → Source: GitHub Actions), then open all five URLs
from a device that has never seen them.

### 17. Restore Purchases does not call StoreKit
`hooks/useEntitlement.ts` still carries `REVENUECAT INTEGRATION POINT` markers and
`react-native-purchases` is not in `package.json`. `purchase()` and `restore()` set local
flags — content unlocks with no receipt. Guideline 2.1 and 3.1.1.

Good news: the hard part is already right. `app/paywall.tsx` has a real Restore button that
handles failure explicitly rather than silently doing nothing, and auto-renewal terms are
disclosed on the paywall. Only the StoreKit call underneath is missing.

### 18. Production payment key — blocked on 17
There is no key at all, sandbox or production. Flagged so it is not mistaken for a pass:
an absent key and a correct key look identical on a checklist and opposite at the till.

### 1. No beta has been started — the longest lead, and it decides the date
Android is a real target (`eas.json` builds an app-bundle, `app.json` has a full android
block) but there is no mention of Play's closed-testing requirement anywhere in `docs/`.
**12 testers, opted in, 14 continuous days, then roughly another week of Google review** —
and the clock resets if the opted-in count dips below 12. Three weeks minimum before you can
apply for production access, and it runs on calendar days whether or not you are working.

iOS is in better shape: `docs/DEPLOY.md` §8 covers TestFlight properly.

**Start the Play closed track before the code is finished.** Recruit more than 12.

### 15. Trader status — no entity, no address
`legal/entity.json` has `name`, `kind`, `address` and `province` all null. EU trader status
has required a published address since February 2025. Whatever address you register with is
the address that gets published.

Not merely paperwork: `legal/consumer-health-data-policy.md` already notes that Washington's
My Health My Data Act carries a private right of action with treble damages and
fee-shifting, and **that reaches a sole proprietor's personal assets**. For a mental-health
app the entity is a compliance control, not an admin chore.

### 14. Support email is a personal Gmail
`steadyrecovery3@gmail.com`, in both `constants/links.ts` and `legal/entity.json`. Three
problems, and the third is the one people miss:

- It is a personal Gmail, published in the legal documents as the rights-request address.
- **It says *steadyrecovery* and the app is called *Anneal*.** A reviewer reading the privacy
  policy sees a contact address for a different product.
- `fastlane/metadata/en-US/` has no `support_url.txt`, `privacy_url.txt` or
  `marketing_url.txt`. A missing or dead support URL is a metadata rejection.

---

## Deliberate risks already accepted

Documented decisions, not oversights. Two are load-bearing enough to re-consent to with
launch week in view.

### 12. Kill switch — structurally impossible
Remote config is a network call, and this app makes none: enforced by the import allowlist,
promised in `SAFETY.md`, **denied in writing in the published privacy policy**. A
min-supported-version gate has the same problem. So phased release is the only lever, which
makes item 19 more important here than for a normal app, not less.

### 13. Over-the-air hotfix — deliberate no
`expo-updates` is absent on purpose; `docs/DEPLOY.md` §9 states the trade. Accept it, but
know the cost: **with no kill switch and no OTA, a launch-week bug is live for a full review
cycle.** That is the argument for a slow phased rollout and a mid-week submission.

### 2. Crash reporting — deliberate no
No Sentry, no Crashlytics, no analytics. `docs/DEPLOY.md` §9 and `docs/READINESS.md` §1.3
both mark this amber: an SDK would mean the app phones home, which `SAFETY.md` forbids and
the privacy policy denies. `components/CrashScreen.tsx` is a real error boundary showing
crisis numbers first, then export, then reload — the right priority order.

**Worth considering:** the crash screen could offer a copyable diagnostic the user chooses to
paste into the support email. Zero egress, opt-in by construction, and it turns the inbox
into the crash reporter that is otherwise missing.

---

## Passing, and one that will silently break

### 5. SDK privacy declarations — pass now, **false the day RevenueCat lands**
Unusually strong today: `app.json` carries a filled `privacyManifests` block —
`NSPrivacyTracking: false`, empty tracking domains, empty `NSPrivacyCollectedDataTypes`, and
two accessed-API reasons declared (`FileTimestamp C617.1`, `UserDefaults CA92.1`). No
third-party SDK collects anything.

**RevenueCat collects purchase history and a user identifier.** Google's automated scan
catches undeclared device IDs. Re-open the App Privacy label and the Play Data Safety form
the same day that SDK is added, not at submission.

### 3. Delete-account button — N/A, correctly
Apple 5.1.1(v) and Play's rule apply to apps offering account creation. There is none. The
app exceeds the requirement anyway: "Delete everything" wipes state, the exports left in the
cache, and the key (`wipeState` → `sweepExports` + `forgetDeviceKey`). **Say this explicitly
in the review notes** so a reviewer does not look for the flow and reject on its absence.

### 16. Demo account — pass
`docs/SUBMISSION-ANSWERS.md` states the absence rather than skipping the field, which is what
avoids the 2.1 rejection. Include the hardship path and the camera alternative in the notes.

### 19. Phased release and the rating prompt — pass on code
`components/MomentCard.tsx` fires `requestReview()` only from a user tap on a moment card
shown after something has demonstrably gone well — never on first open, never mid-bad-week,
guarded by `isAvailableAsync`. Phased release itself is a console checkbox nobody has ticked
because nothing has been submitted. **Tick both *Phased Release* and *Manually release this
version*.** Given items 12 and 13, that is the only rollback that exists.

### 20. Never submit on a Friday
Nothing in the code decides this, and it matters more here than for most apps: with no kill
switch and no OTA, a Saturday crash is live until Monday's queue moves.

---

## Fix order, by week-one damage

1. **Answer `legal/entity.json`** — unblocks items 4, 14 and 15, and a dead privacy URL is an
   automatic rejection. The entity formation behind it has real lead time; start it the same day.
2. **Open the Play closed track** — 14 continuous days plus ~1 week of review, running on
   calendar days regardless of progress. The single biggest lever on the launch date.
3. **Wire RevenueCat, then test Restore on a device** — items 17 and 18. Smaller than usual
   because the paywall UI and disclosure copy are already correct.
4. **Re-do both privacy declarations the day RevenueCat lands** — item 5, which silently
   becomes false at that commit.
5. **Rehearse export → reinstall → import** — item 11, on real hardware, steps written down.
6. **Domain email, support page, fastlane URL files** — items 14 and 6 in one sitting.
7. **Submit Monday–Wednesday with phased release on** — items 19 and 20.

---

## Not checkable from a terminal — verify by hand

- **Is GitHub Pages enabled?** Settings → Pages → Source must be "GitHub Actions". The
  workflow exists but cannot have succeeded, since its build step fails. The dead-site
  conclusion comes from the build refusing, which is solid — confirm in a browser anyway.
- **Play Console account age.** The 12-tester rule applies to personal accounts created after
  November 2023; an organisation account is exempt. Confirm which you have before planning
  three weeks around it.
- **App Store Connect record** for `com.anneal.app`, and whether the name "Anneal" is free.
  The 90-day reservation starts when you claim it.
- **D-U-N-S number** matching the entity formed in step 1, and whether Apple Developer
  enrolment is Organization or Individual. `npm run preflight` flags this as weeks of lead.
- **Screenshots** — `npm run shots:store` renders them, but a human must confirm no frame
  shows an Anneal+ feature as if free (2.3) and no human face appears in the mirror frames.
- **Age-rating questionnaire** and the App Privacy label, both unverifiable from the repo.

`npm run preflight` reports four of the six blockers on its own and is the only one of these
checks that fails loudly. Run it before every submission.
