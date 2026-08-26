# Privacy Policy — {{APP_NAME}}

**Last updated:** 11 August 2026
**Applies to:** the {{APP_NAME}} iOS app, version 2.0.0 and later, published by {{ENTITY_NAME}} ("we", "us").
**Contact:** {{CONTACT_EMAIL}}

<!-- DRAFT. Not reviewed by a lawyer. See legal/README.md before publishing. -->
<!-- Every factual claim in this document is sourced in an HTML comment beside it. HTML
     comments do not render, so a reader sees the policy and a maintainer sees the proof.
     Verified against the repository at commit f5db0ae, app.json version 2.0.0. -->

---

## The short version

{{APP_NAME}} has no server. There is no account, no sign-in, no cloud, no analytics, and no third-party tracker. Everything you write stays in the app, on your phone.

We do not receive your data. We do not store it, read it, sell it, or share it. Not because we promise not to — because there is no code in the app that could send it anywhere.

That one fact decides almost everything else in this document.

<!-- SOURCE: a search for fetch(, XMLHttpRequest, axios, WebSocket and http(s):// URLs across
     app/, components/, lib/, store/, content/, types/, hooks/ and constants/ returns nothing.
     package.json lists 19 runtime dependencies and none is an analytics SDK, crash reporter,
     attribution SDK or backend client. lib/storage.ts (the only persistence module) contains
     no network call and its header comment forbids adding one. SAFETY.md §6. -->

---

## 1. Who this policy is from

{{ENTITY_NAME}}, of {{ENTITY_ADDRESS}}, publishes {{APP_NAME}}.

Where data-protection law needs someone named as the **controller** (the party that decides why and how personal data is handled), that is us. In practice we hold no personal data about you at all, for the reasons set out in section 3.

We are based in Canada, so **PIPEDA** (the Personal Information Protection and Electronic Documents Act) is the law that primarily applies to us. Because the app is sold worldwide, the GDPR, UK GDPR and CCPA/CPRA may also apply to customers in those places, and sections 9 to 12 set out the rights each of them gives you.

We have not appointed a Data Protection Officer. Under the GDPR one is required where an organisation carries out large-scale monitoring or processes special-category data at scale, and we do neither — we receive no personal data at all. PIPEDA requires an accountable individual instead, and that is the developer, reachable at {{CONTACT_EMAIL}}.

<!-- The DPO position rests on receiving no personal data, which is verified in the sections
     below. It changes the day any server-side processing is introduced. Worth a lawyer's
     confirmation as part of the review in legal/README.md, but it is not a close call on
     the current facts. -->

---

## 2. What we collect

Nothing.

We collect no name, no email address, no phone number, no account, no device identifier, no advertising identifier, no location, no usage statistics, no crash reports, and no diagnostic data.

There is no sign-up screen because there is nothing to sign up to.

<!-- SOURCE: there is no auth flow, no account model and no user table anywhere in the app.
     types/index.ts defines the entire persisted shape; the only identity-ish field is
     profile.firstName, which is optional, local, and used only to address the user on screen
     (app/onboarding/index.tsx: "Optional. Only used so the app sounds less like a form."). -->

The only thing the app can reach out to the network for is a phone call you start yourself — see section 8.

---

## 3. What is stored on your phone, and why that is different

{{APP_NAME}} stores what you write so the app can show it back to you. All of it lives in the app's own storage area on your device, in a single record.

<!-- SOURCE: lib/storage.ts — AsyncStorage.setItem(STORAGE_KEY, …) where STORAGE_KEY is
     'steady.state.v2'. On iOS AsyncStorage is a file in the app's container. -->

What is in that record:

| What | Example |
|---|---|
| Your daily check-in | roughly how long you spent thinking about how you look, how strong the urge to check was, whether you avoided something, how hard the day was |
| Your writing | thought records, behavioural experiments, your relapse plan, the one-line note about what you would do with an extra hour |
| Practice history | which exercises you did and on which dates, streak counts, which weeks you finished, which readings you have opened |
| Guided mirror sessions | date, how long, distress rating before and after, whether you finished |
| Urge logs | what set it off, what you wanted to do, how strong it was, whether you rode it out |
| Settings | your first name if you gave one, which country's crisis lines to show, that you read the disclaimer |
| Purchase state | which tier you are on and when it runs out |

<!-- SOURCE: lib/storage.ts normalise() rebuilds the whole persisted shape field by field —
     profile, baseline, checkIns, urgeLogs, thoughtRecords, mirrorSessions, experiments,
     practice, streak, protocol (incl. relapsePlan), readModules, moments, entitlement.
     That function is an exhaustive list of what can be stored. -->

**What is never stored, by design:** no photographs, no video, no audio, no weight, no measurements, no clothing size, no calories, no attractiveness score, no rating or ranking of how you look, and no before-and-after of any kind. There is no field for any of them.

<!-- SOURCE: SAFETY.md §1 and §2; types/index.ts carries no such field; the exportText()
     function in lib/storage.ts carries the comment "Never contains an appearance value,
     because none is stored." A grep for weight|calorie|bmi|attractiveness|rating|percentile
     across the source hits only comments explaining the prohibition. -->

### Why "stored on your phone" is not "collected by us"

Most privacy law is about what an organisation does with your data once it has it. We never have it.

Data that stays inside an app on your own device, that we cannot see, cannot request, and have built no means of receiving, is not data we process. Apple draws the same line: its App Store definition of *collect* is transmitting data off the device where the developer can then access it. Nothing in {{APP_NAME}} transmits anything.

<!-- SOURCE: Apple's App Privacy definition of "collect", quoted and applied in
     docs/APP-STORE.md §6 ("App Privacy nutrition label"), which records the correct answer as
     "Data Not Collected". app.json declares NSPrivacyTracking: false, an empty
     NSPrivacyTrackingDomains array, and an empty NSPrivacyCollectedDataTypes array. -->

This is the sentence that makes the rest of this policy short. If we ever add a server, an account, a backup service, or analytics, it stops being true and this policy has to be rewritten before that ships.

> ⚠ **Depends on the build.** Everything in sections 2 to 6 is true of the version described at the top of this page. Section 15 lists what changes when payments are wired in.

---

## 4. The camera

{{APP_NAME}} uses the camera for one thing: showing you a live mirror during guided mirror practice, from week 4 onward.

- The picture is shown and thrown away, frame by frame. Nothing is captured, recorded, saved, uploaded, or written to your photo library.
- There is no photo-taking function in the app. Not a hidden one, not a disabled one — the code to do it does not exist.
- {{APP_NAME}} never asks for access to your photo library.
- You can say no. If you decline the camera, the session runs with text prompts instead and records exactly the same before-and-after ratings. It is a fully supported path, not a broken one.

<!-- SOURCE: components/MirrorSurface.tsx. Native path renders expo-camera's CameraView with
     facing="front" and nothing else; web path calls getUserMedia and stops every track on
     unmount; the third path is text-guided. No capture API, no canvas snapshot, no media
     library write anywhere in the file — SAFETY.md §1 ships a grep that proves the absence
     across the whole codebase. package.json contains expo-camera but no expo-media-library
     and no image-picker. app.json requests only NSCameraUsageDescription. -->

---

## 5. Getting your data out (export and backup)

Because there is no server, there is also no backup. If you delete {{APP_NAME}}, everything in it is gone. The app tells you this on the second onboarding screen, before you have written a word.

<!-- SOURCE: app/onboarding/index.tsx step 2: "That also means there is no backup. If you
     delete the app it is gone. You can export a plain-text copy whenever you like." -->

So {{APP_NAME}} gives you two free ways to take a copy, on every tier including the free one:

- **Export summary** — a plain-text file you could hand to a doctor or therapist.
- **Save a full backup** — a complete, lossless file that can be read back into the app.

<!-- SOURCE: app/(tabs)/progress.tsx renders the export section above the entitlement gate;
     lib/entitlement.ts TIER_COMPARISON lists "Export and full backup file" as "Forever" on
     both tiers; SAFETY.md §11b. -->

On iPhone, tapping either one opens Apple's standard share sheet, and **you** choose where the file goes — Files, Mail, Messages, a notes app, whatever you pick. Once you send it somewhere, it is subject to whatever that other app or service does with it. That step is yours, not ours, and we never see the file.

<!-- SOURCE: app/(tabs)/progress.tsx:146 — await Share.share({ message: body }). The same
     path exists on components/CrashScreen.tsx:53 so a person can rescue their writing even
     if the app fails to open. -->

**Treat those files carefully.** They contain the most private things you have written in the app, in plain text, with no password on them.

---

## 6. How your data is protected

We want to be exact here rather than reassuring.

**What genuinely protects your data:**

- It never leaves your phone, so there is no server for anyone to break into and no employee who could look at it.
- iOS keeps every app's storage separate from every other app's. Another app cannot read {{APP_NAME}}'s data.
- iOS encrypts the file system, and that protection is tied to your device passcode. **If you do not have a passcode set on your iPhone, that protection is weaker.** Setting one is the single most useful thing you can do to protect what you write in {{APP_NAME}}.
- {{APP_NAME}}'s stored data is **excluded from iCloud and iTunes/Finder backups by default**, so it is not copied into your iCloud account. This is a consequence of the storage library the app uses, which sets Apple's "exclude from backup" flag unless an app overrides it. {{APP_NAME}} does not override it.

<!-- SOURCE: node_modules/@react-native-async-storage/async-storage/ios/RNCAsyncStorage.mm
     lines 518-527: reads the Info.plist key RCTAsyncStorageExcludeFromBackup, and where the
     key is absent defaults to @YES ("by default, we want to exclude AsyncStorage data from
     backup"), then sets NSURLIsExcludedFromBackupKey on the storage directory. app.json's
     ios.infoPlist block sets only NSCameraUsageDescription, so the key is absent and the
     default applies. RE-VERIFY THIS after any upgrade of that dependency — it is a library
     default, not something {{APP_NAME}} states in its own configuration. -->

**{{APP_NAME}}'s own encryption:**

- What the app saves — every check-in, note, urge log and thought record — is encrypted before it is written down, using a cipher called XChaCha20-Poly1305. On disk it is unreadable bytes, not text.
- The key is 32 random bytes made on your device the first time you open the app. It is kept in the iPhone Keychain, marked so that it never syncs to iCloud and can only be read while the phone is unlocked. It is never sent anywhere, because nothing in this app sends anything anywhere.
- If the app cannot reach the Keychain — it happens, usually right after a restore or an install — it does not quietly invent a new key, because that would make everything you had already written unreadable. It saves that session in plain text instead **and says so on the home screen**, in those words. Closing the app fully and opening it again usually fixes it.

**What that encryption does not protect:**

- Anyone who can unlock your phone can open {{APP_NAME}} and read everything in it. There is no PIN, no Face ID lock, and no hidden mode inside the app. The encryption protects your writing from other software on the device and from anyone reading the raw storage — not from someone holding your unlocked phone.
- The export and backup files you create are not encrypted or password-protected. That is deliberate: an export you cannot open is not a backup. Where you keep it is up to you.

<!-- SOURCE: lib/crypto.ts:35,103 — xchacha20poly1305 from @noble/ciphers. lib/storage.ts
     writes JSON.stringify(seal(...)) with 24 fresh random nonce bytes per write.
     hooks/deviceKey.ts:39,51-52,68-71 — 32 bytes from expo-crypto getRandomBytes, held at
     KEY_ID 'steady.device.key.v1' with keychainAccessible WHEN_UNLOCKED_THIS_DEVICE_ONLY.
     A keychain read failure returns 'unavailable' and does NOT mint a replacement key
     (deviceKey.ts:54-58). The plaintext fallback is disclosed by components/StorageNotice.tsx,
     rendered on Today and Progress, wording in content/copy.ts STORAGE_COPY.notEncrypted.
     There is still no app-lock screen in app/.

     THIS SECTION WAS FALSE FOR A PERIOD, AND IT PREDICTED ITSELF. It said "{{APP_NAME}} does
     not add its own encryption ... ordinary readable text", and carried a warning block
     saying the encryption layer was being built and that this section must be rewritten when
     it shipped. The layer shipped. The rewrite did not. So the live legal document went on
     describing a build that no longer existed, while the App Store listing said the opposite
     ("scrambled so other software on the device cannot read it") and the app said the
     opposite again on the home screen. Break-risk #4 at the foot of this file is the entry
     that called this exact drift. -->

> ⚠ **Depends on the build.** Every sentence above describes the shipped app as of the commit carrying this file. If the encryption layer is ever removed, downgraded or made conditional, **this section has to move in the same commit** — a policy claiming encryption the app does not perform is worse than the plain-text version it replaced. There is a test that fails if the cipher named here stops matching `lib/crypto.ts`.

**One more thing worth knowing.** If {{APP_NAME}} ever finds stored data it cannot read — a corrupted file, or a file written by a newer version of the app — it makes a copy of those bytes and sets them aside rather than overwriting them, so nothing is destroyed while it is still recoverable. Those set-aside copies stay on your device until you delete your data or delete the app. They contain the same private material as the main file.

<!-- SOURCE: lib/storage.ts quarantine() writes the unreadable payload to a key prefixed
     'steady.unreadable.' and is documented as never garbage-collected automatically;
     wipeState() removes every such key alongside the main one. -->

---

## 7. Payments

At the version described at the top of this page, {{APP_NAME}} does not take payment at all. The purchase buttons do not yet connect to Apple.

<!-- SOURCE: hooks/useEntitlement.ts — purchase(), restore() and fetchProviderEntitlement()
     are marked "REVENUECAT INTEGRATION POINT" and set local flags only; no StoreKit or
     RevenueCat SDK is in package.json. docs/APP-STORE.md §5.3 flags shipping this way as a
     rejection risk, so the shipping build will almost certainly have payments wired in —
     which means section 15 will be the live text by the time this policy is published. -->

> ⚠ **Blocker before publishing.** If the build you submit has payments wired in — and Apple will most likely require that — then **section 15 is not a future note, it is the current state**, and this section must be replaced by it before the policy goes live. Publishing a policy that says "we do not take payment" alongside a build that does is worse than having no policy.

---

## 8. Crisis lines and phone calls

The Support screen lists crisis helplines for thirty countries, plus a "somewhere else" option carrying international directories.

Tapping a number hands it to your phone's dialler. We do not place the call, route it, record it, or learn that you made it. The call is between you, your phone company, and the organisation you rang — all of which are independent of us and have their own privacy practices. We do not operate any of these services.

**Everywhere else the app can send you.** A handful of links open your normal web browser or your mail app, and nothing about you travels with them — no identifier, no query string, nothing about what you have written:

- the privacy policy and the terms, from the subscription screen;
- the medical disclaimer, from the Support screen;
- a plain `mailto:` address for writing to us, from the Support screen. What you then type in your mail app is between you and your mail provider.

None of these opens inside {{APP_NAME}}. There is no embedded browser anywhere in this app, deliberately — a page opening inside an app can be watched by that app, and one opening in Safari cannot.

<!-- SOURCE: constants/support.ts holds the numbers — SUPPORT_REGIONS has 31 entries, of
     which 30 are countries and the 31st is key 'other' / label 'Somewhere else' holding
     findahelpline.com and IASP. Hence "thirty countries, plus". The previous sentence named
     four countries (CA/US/UK/AU), which was the region list several versions ago.

     Linking.openURL call sites, complete: app/support.tsx tel:, SUPPORT_MAILTO and
     LINKS.disclaimer; app/paywall.tsx LINKS.privacy and LINKS.terms;
     components/CrashScreen.tsx tel:. The old text here said the dialler "is the only
     outbound link in the whole app", which was true when it was written and had been wrong
     for four call sites since. Break-risk #5 at the foot of this file called this one too.
     __tests__/safety.test.mjs holds the no-WebView rule that the last paragraph states. -->

See `medical-disclaimer.md` for what we can and cannot promise about those lines.

---

## 9. Your rights under GDPR and UK GDPR

If you are in the UK, the EU or the EEA, the General Data Protection Regulation and the UK GDPR give you rights over personal data an organisation holds about you.

We hold none. So here is what each right means in practice with {{APP_NAME}}:

| Right | How it works here |
|---|---|
| **Access** — get a copy of your data | Open Progress and tap **Save a full backup**. That file is everything the app holds. We could not give you a copy because we do not have one. |
| **Portability** — get it in a reusable format | The same backup file. It is JSON, and it can be read back into {{APP_NAME}}. |
| **Rectification** — correct wrong data | Edit it in the app. Nothing you correct needs to reach us, because nothing reached us in the first place. |
| **Erasure** ("right to be forgotten") | Delete the app from your iPhone. That removes the app's container, including everything {{APP_NAME}} stored. There is nothing left anywhere else. |
| **Restriction** and **objection** | There is no processing by us to restrict or object to. |
| **Withdraw consent** | See the legal-basis note below — we are not relying on your consent for anything, because we are not processing anything. |
| **Not be subject to automated decision-making** | {{APP_NAME}} makes no decision about you. It does arithmetic on numbers you typed and shows you the result. |

**How to erase everything.** Open **Progress**, scroll to "Take this with you", and use **Delete everything** at the bottom of that section. It removes every check-in, note, plan and history entry from the device, including any recovery copies the app has made. There is no server copy, so this is final and immediate — which is why the button sits directly below the export, and why it asks once more before doing it.

Deleting the app also erases everything, for the same reason: there is nowhere else it is kept.

<!-- This paragraph used to read as a product gap: reset() existed in the store and NOTHING
     CALLED IT, so the only erasure route was deleting the app. Writing this section is what
     surfaced that. The control now exists in app/(tabs)/progress.tsx. -->

<!-- SOURCE: store/useStore.ts reset() cancels the pending write, calls
     lib/storage.ts wipeState() (which removes STORAGE_KEY and every 'steady.unreadable.'
     key) and resets in-memory state. A grep for callers of reset across app/ and components/
     finds none — the only hits are an unrelated local function in app/urges.tsx. There is no
     Settings or About screen in app/. -->

**Legal basis.** Data-protection law asks an organisation to name a lawful basis for each processing activity. We do not have one to name, because we carry out no processing of your personal data. If a regulator took the view that publishing the app is itself processing, the basis would be our legitimate interest in providing software you asked to use (Article 6(1)(f)), and the balancing test is unusually easy: the interference with your privacy is zero, because we receive nothing.

**Special category data.** Information about mental health is "special category" data under Article 9 — the most protected kind. {{APP_NAME}} is full of it. That is exactly why it was built with no server: the strongest protection available for special category data is for the operator never to hold it.

**Complaints.** If you think we have got this wrong, please tell us at {{CONTACT_EMAIL}}. You can also complain to your data-protection regulator — in the UK that is the Information Commissioner's Office (ico.org.uk); in the EU it is the supervisory authority for the country you live in.

---

## 10. Your rights in California (CCPA / CPRA)

For California residents, under the California Consumer Privacy Act as amended by the CPRA:

- **Categories of personal information collected in the last 12 months:** none.
- **Categories sold:** none. We have never sold personal information and have no way to.
- **Categories shared for cross-context behavioural advertising:** none. There is no advertising in {{APP_NAME}}.
- **Sensitive personal information collected:** none. (Health information you type stays on your device and never reaches us, so it is not collected.)
- **Sources of personal information:** not applicable.
- **Business or commercial purpose for collecting:** not applicable.
- **Third parties we disclose to:** none.
- **Retention:** we retain nothing, so there is no retention period to state.

You have the right to know, delete, correct, opt out of sale or sharing, limit the use of sensitive personal information, and not be discriminated against for exercising these rights. Because we hold nothing about you, a request under any of them can be answered in one line — and we will answer it in one line if you send one to {{CONTACT_EMAIL}}.

We do not offer financial incentives for personal information. We do not process personal information for behavioural advertising, so there is no "Do Not Sell or Share My Personal Information" link to provide.

<!-- SOURCE: same evidence as §2. No advertising SDK, no ad identifier access, no ATT prompt;
     app.json sets NSPrivacyTracking: false. docs/APP-STORE.md §5.9 records that ATT does not
     apply and that adding a prompt unnecessarily is itself a review risk. -->

---

## 11. Your rights in Canada (PIPEDA)

Under the Personal Information Protection and Electronic Documents Act:

- **Accountability.** {{ENTITY_NAME}} is accountable for personal information under its control. Questions go to the developer at {{CONTACT_EMAIL}}.
- **Identifying purposes, consent, limiting collection.** We collect no personal information, so there is no purpose to identify and no consent to obtain.
- **Limiting use, disclosure and retention.** We hold nothing, so there is nothing to use, disclose or retain.
- **Accuracy.** You control accuracy directly — the data is on your device and you can edit it.
- **Safeguards.** Described honestly in section 6.
- **Openness.** This document.
- **Individual access.** The in-app export and backup give you everything, immediately, without asking us.
- **Challenging compliance.** Write to us first. You can also complain to the Office of the Privacy Commissioner of Canada (priv.gc.ca).

---

## 12. Children and young people

{{APP_NAME}} is intended for people **aged 16 and over**, and is rated 16+ on the App Store.

We do not knowingly collect personal information from anyone of any age, including children, because we do not collect personal information at all. There is no account to create, so there is no under-age account for us to detect, suspend, or delete.

If you are under 16 and using {{APP_NAME}}, please talk to a parent, carer, or someone at school about what you are going through. The crisis lines in the Support screen include services specifically for young people, and they are free.

<!-- SOURCE: docs/APP-STORE.md §5.6 sets 16+ as the intended rating, driven by an honest
     "Frequent" answer to the Medical or Treatment Information descriptor. constants/support.ts
     includes Kids Help Phone (Canada, under 30) and Kids Helpline (Australia, 5–25).
     NOTE FOR THE PRODUCT TEAM: there is no age gate in app/onboarding/index.tsx. The store
     rating is the only age control. That is normal and defensible for a 16+ app, but do not
     write a sentence here claiming the app verifies age, because it does not. -->

---

## 13. Sending data to other countries

None. Your data does not travel to another country because it does not travel anywhere. There are no international transfers, no standard contractual clauses to point at, and no adequacy decision to rely on.

> ⚠ **Depends on the build.** Section 15 changes this. Apple and RevenueCat both operate internationally.

---

## 14. How long things are kept

**By us:** nothing, for no time, because we never receive anything.

**On your device:** for as long as you keep the app installed. {{APP_NAME}} does not expire, thin out, or delete your history on its own. Delete the app and it is gone — completely, with no copy anywhere, which is the flip side of a promise that nothing is uploaded.

---

## 15. What changes when payments are switched on

{{APP_NAME}} will sell subscriptions through **Apple's In-App Purchase**, with **RevenueCat** used to keep track of what you bought. When that ships, the following becomes true and everything above must be read with it in mind.

**What is collected then:**

- **Purchase history** — which {{APP_NAME}} product you bought, when it started, when it renews or ends, whether it is a trial, whether it was cancelled or refunded.
- **An anonymous app user ID** — a random identifier RevenueCat generates so it can tell one anonymous customer from another. It is not your name, not your email, not your Apple Account, and it is not linked to anything you write in {{APP_NAME}}.

**What is still never collected, and must never be:**

Nothing you write. No check-in, no distress rating, no thought record, no urge log, no mirror session, no streak, no reclaimed-hours figure, no relapse plan. None of it may be attached to a purchase record, sent as a customer attribute, or used to segment anyone. This is written into the code as an instruction to whoever wires up the integration.

<!-- SOURCE: hooks/useEntitlement.ts, "WHAT MUST NOT CHANGE WHEN THAT HAPPENS": "No
     AppState-derived value may be sent as a subscriber attribute. Not the reclaimed figure,
     not a distress rating, not a streak." Reinforced by SAFETY.md §6. -->

**Who does what:**

- **Apple** takes the payment and holds the billing relationship. We never see your card details, your billing address, or your Apple Account. Apple handles refunds and cancellations. Apple's own privacy policy governs what Apple does: apple.com/legal/privacy
- **RevenueCat** receives the purchase record and the anonymous ID, and tells the app whether your subscription is active. It acts as our **processor** (a company that handles data on our instructions and may not use it for its own purposes). RevenueCat's privacy policy: revenuecat.com/privacy
- **Us.** We can see anonymous, aggregate sales figures — how many subscriptions are active, how many trials converted. We cannot tie any of it to a person, and we cannot tie any of it to anything written inside the app.

**Legal basis** for handling purchase data: performance of a contract (Article 6(1)(b)) — you bought something and we have to know that you did in order to unlock it.

**International transfers:** Apple and RevenueCat are US-headquartered and operate globally, so purchase data will be handled outside the UK/EU. Transfers rely on the mechanisms in those companies' own terms — for RevenueCat, its data-processing agreement and standard contractual clauses. <!-- CONFIRM THE CURRENT TRANSFER MECHANISM WITH COUNSEL BEFORE PUBLISHING. -->

**Retention** of purchase data: for as long as your subscription is active, plus the period Canadian tax law requires records to be kept. The Canada Revenue Agency generally requires business records to be retained for **six years** from the end of the last tax year they relate to, so that is the outside limit on purchase records. We hold none of it directly — it sits with Apple and, once integrated, RevenueCat.

<!-- Six years is the CRA's general rule for books and records. Confirm it against the
     entity's actual filing position with an accountant; it is the standard answer and not
     a controversial one. -->

**Your rights** over purchase data are the ordinary ones — access, correction, deletion, portability, objection. Ask us at {{CONTACT_EMAIL}}. Note that some purchase records must be kept for tax reasons even after a deletion request, and that Apple holds its own copy of your transaction independently of us.

**The App Store privacy label must be updated in the same release that adds the SDK** — Purchases → Purchase History, and Identifiers → User ID, both marked *not linked to identity* and *not used for tracking*. Health and fitness data stays unselected, in every version, because it never leaves the device.

<!-- SOURCE: docs/APP-STORE.md §5.7 and §6, which set out these exact label selections and
     warn that a label understating collection is a route to app removal. -->

---

## 16. Things {{APP_NAME}} does not do

Stated plainly, because in this category people ask:

- No account, no login, no password.
- No analytics, no telemetry, no product metrics, no session recording, no heatmaps.
- No crash reporting service.
- No advertising, no ad network, no ad identifier, no App Tracking Transparency prompt (we have nothing to track).
- No social features, no sharing to social networks, no leaderboards, no comparison with other users.
- No AI chat, and nothing you write is sent to any AI system.
- No email list built from the app.
- No selling, renting, or trading of data — there is nothing to sell.
- No access to your photos, contacts, microphone, location, calendar, or health data.

<!-- SOURCE: package.json (19 runtime dependencies, none of them any of the above);
     app.json requests only camera permission on iOS and Android; SAFETY.md §7 rules out an
     AI companion in v1; docs/APP-STORE.md §6 records "no social surface of any kind". -->

---

## 17. Changes to this policy

If the app changes in a way that makes any of this wrong, we will update this page first and change the app second. The date at the top will tell you when it last changed.

If a future version ever adds a server, an account, cloud sync, or analytics, that will be a genuinely different product from a privacy point of view. It will be announced in the app, not slipped into this document.

---

## 18. Contact

{{CONTACT_EMAIL}}
{{ENTITY_NAME}}, {{ENTITY_ADDRESS}}

---

<!--
================================================================================
INTERNAL NOTES — NOT FOR PUBLICATION AS PART OF THE VISIBLE POLICY
(They are inside an HTML comment and will not render. Keep it that way.)
================================================================================

SENTENCES THAT BECOME FALSE IF THE PRODUCT CHANGES
Ranked by how much exposure the falsehood creates.

1. "We do not receive your data … there is no code in the app that could send it
   anywhere." — The Short Version, and again in §3.
   BREAKS ON: any backend, any account system, any cloud sync, any analytics SDK, any
   crash reporter (Sentry/Firebase/Bugsnag), any AI feature. Also breaks on a
   "share your progress" feature that posts anywhere.
   EXPOSURE: this is the load-bearing claim of the whole document and it is also in the
   App Store description and on screenshot 2. Breaking it silently is a
   misrepresentation to customers and an inaccurate App Privacy label at the same time.

2. "Data Not Collected" posture / §2 "Nothing."
   BREAKS ON: RevenueCat landing. §15 already handles it, but §2 and §7 must be edited
   in the SAME commit, not left as future tense. See the blocker note in §7.

3. "Excluded from iCloud and iTunes backups by default" — §6.
   BREAKS ON: upgrading @react-native-async-storage/async-storage to a version that
   changes the default; adding RCTAsyncStorageExcludeFromBackup=NO to app.json; migrating
   persistence to MMKV, SQLite, expo-file-system or Core Data, none of which carry this
   default. RE-VERIFY at every dependency bump.

4. "{{APP_NAME}} does not add its own encryption" — §6.
   BREAKS ON: the encryption layer landing. Good direction, still needs the sentence
   rewritten. Do not pre-write it.

5. "The only outbound link in the whole app is a tel: link" — §8.
   BREAKS ON: adding the in-app privacy policy link that Apple requires (5.1.1(i)).
   That link is REQUIRED before submission, so this sentence will need softening to
   something like "the only links are the crisis dialler and links to this policy and
   the terms, which open in Safari". Also flips the App Store Connect "Unrestricted Web
   Access" answer if implemented as an in-app WKWebView instead of Linking.openURL.
   See docs/APP-STORE.md §6.

6. "There is no PIN, no Face ID lock" — §6. Breaks on adding an app lock (which would
   be an improvement worth making before a wide launch).

7. §12 "no account to create, so no under-age account to detect" — breaks on accounts.

8. §13 "no international transfers" — breaks the moment RevenueCat lands.

CONTRADICTIONS FOUND IN THE CODE WHILE WRITING THIS
- No in-app "delete my data" control exists. store/useStore.ts reset() is implemented and
  correct but has zero callers. Flagged visibly in §9.
- No in-app link to this policy exists. Required by Apple 5.1.1(i) and by the paywall
  disclosure rules (3.1.2). Both flagged in docs/APP-STORE.md §5.2 / §5.4 and still open.
- components/CrashScreen.tsx shares the ENTIRE state as JSON through the share sheet on a
  single tap, on a screen shown after a crash. That is correct and humane, but it means a
  full plaintext copy of the journal can leave the device very easily. §5 covers it.
- The web build (react-native-web, app.json web.output "single", a built dist/ directory)
  would store the same data in browser localStorage, which is NOT covered by the iOS
  backup-exclusion claim in §6 and not covered by any of the iOS protections. If the web
  build is ever hosted publicly, this policy needs a web section and cookie-policy.md
  needs to stop saying the site is static and cookie-free.
-->
