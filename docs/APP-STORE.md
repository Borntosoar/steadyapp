# App Store listing and submission

Everything App Store Connect asks for, plus the review risks that are specific to this app.

This is App Store Optimization, not web SEO. There is no website, so there are no meta
tags, no sitemap, no schema markup and no backlinks. On iOS, search ranking is decided by
**six indexed fields**: app name, subtitle, the 100-character keyword field, in-app
purchase display names, in-app event titles, and (since mid-2025, by OCR) screenshot
caption text. **The long description is not indexed on iOS. Not a word of it.** Neither is
promotional text. The description's only job is conversion.

One consequence worth stating early: some of what follows is not a marketing task. Two
items — an organisation developer account and a hosted privacy policy URL — are hard
blockers that no amount of copy will route around. They are in §5.

---

## 1. App name and subtitle

Both fields are 30 characters. The name carries the most ranking weight of any field, the
subtitle the second most. Neither may contain prices, other apps' names, or unverifiable
claims (Guideline 2.3.7).

### App name

| # | Name | Chars | Notes |
|---|---|---|---|
| A | `Steady: Body Image Anxiety` | 26 | Holds the two head terms this app can plausibly compete on and the exact phrase people type. |
| B | `Steady: Body Image Support` | 26 | Softer, on-voice, but "Support" is a near-zero-volume connector — it buys a feeling, not a ranking. |
| C | `Steady – Appearance Anxiety` | 27 | The app's own vocabulary. Precise, much lower volume, and gives up "body image" entirely. |

**Recommendation: A — `Steady: Body Image Anxiety`.**

"Body image" is the head term for this category. "Anxiety" is enormous and unwinnable on
its own, but it is not on its own here — it sits next to "body image", and Apple builds
phrase matches across fields, so the pair earns *body image anxiety*, *image anxiety*,
*body anxiety*. B spends six of its characters on a word nobody searches. C is the most
honest description of the app and the worst ASO decision on the page; keep "appearance"
for the keyword field, where it costs ten characters instead of a title slot.

Avoid putting **BDD** or **dysmorphia** in the name. Both belong in the keyword field,
where they rank identically for search purposes but are not sitting in the app's title
implying that Steady treats a diagnosed disorder. That distinction matters in §5.

### Subtitle

Must not repeat words from the name — Apple already indexes those, so a repeat is a wasted
character.

| # | Subtitle | Chars | Notes |
|---|---|---|---|
| A | `Hours back from mirror worry` | 28 | Carries the product's actual idea and adds "mirror", "worry", "hours" to the index. |
| B | `Mirror checking, self esteem` | 28 | Maximum keyword value. Reads like a list, which is what it is. |
| C | `Less checking, more hours` | 25 | Cleanest voice, weakest index — "less" and "more" are dead characters. |

**Recommendation: A — `Hours back from mirror worry`.**

It adds "mirror" (which combines with "checking" from the keyword field to reach *mirror
checking*, a query with almost no competition and perfect intent) and it says what the app
does in the app's own register. B ranks marginally better and reads like a keyword dump on
a listing whose whole pitch is that it will not manipulate you; "self esteem" is
unwinnable at launch anyway, so put "esteem" in the keyword field and let it pay off in
year two.

**Combined index for the recommended pair** — name + subtitle + keyword field produce these
phrase matches without any of them being written out in full: *body image*, *body image
anxiety*, *body dysmorphia*, *body dysmorphic*, *body checking*, *mirror checking*,
*appearance anxiety*, *self image*, *self esteem*, *reassurance checking*.

---

## 2. Keyword field (100 characters)

The single highest-leverage field on the page. Rules: comma-separated, **no spaces after
commas** (a space is a wasted character), no duplication of anything in the name or
subtitle, no plurals where Apple's stemming covers them, no "app", no category words
("health", "fitness" — the category is already indexed), no competitor names.

### The string

```
bdd,dysmorphia,dysmorphic,self,esteem,confidence,checking,reassurance,ocd,cbt,appearance,ugly,shame
```

99 of 100 characters. The last character is left empty on purpose — there is no term worth
four letters that is not already covered, and padding with a partial word indexes nothing.

### Term by term

| Term | Chars | Why it is there | Verdict for a new app with no ratings |
|---|---|---|---|
| `bdd` | 3 | The acronym is how people who suspect it in themselves search first. Three characters for a perfect-intent query. | **Winnable.** Tiny volume, almost no competition, highest conversion rate on the list. |
| `dysmorphia` | 10 | Combines with "body" in the name to reach *body dysmorphia*, the most-searched lay term for this. | **Winnable.** The best volume-to-competition ratio available. |
| `dysmorphic` | 10 | Separate stem from "dysmorphia" — Apple will not connect them. Reaches *body dysmorphic disorder*, the clinical phrasing. | **Winnable.** Lower volume than "dysmorphia" but the searcher is further along and converts harder. |
| `self` | 4 | Cheap connector. Reaches *self esteem*, *self image* (with "image" from the name), *self care*. | Mixed — the phrases it forms range from unwinnable to easy. |
| `esteem` | 6 | *Self esteem* is one of the largest terms in the whole category. | **Competitive.** Will not rank in year one. Included because it costs six characters and compounds once ratings exist. |
| `confidence` | 10 | Very large head term; the softer word people use before they will say "dysmorphia". | **Competitive.** Same reasoning as above — a long-term hold, not a launch bet. |
| `checking` | 8 | Reaches *mirror checking* (subtitle) and *body checking* (name). The behaviour this app is actually built around. | **Winnable.** Almost nothing else in the store targets this. |
| `reassurance` | 11 | *Reassurance seeking* is a named compulsion with a real, if small, search population and effectively zero competition. | **Winnable.** Expensive in characters, but it is a query this app should own outright. |
| `ocd` | 3 | Three characters for an adjacent, high-volume condition that shares mechanism (Module 12 makes the link explicit). | **Competitive** on its own; useful in combination. |
| `cbt` | 3 | The method label people search for by name. Three characters. | **Competitive**, cheap enough not to matter. |
| `appearance` | 10 | *Appearance anxiety*, *appearance concerns* — the app's own vocabulary and clinically precise. | **Winnable.** Low volume, low competition, exactly right intent. |
| `ugly` | 4 | This is what someone actually types at their worst. It is a real query with real volume and it is not being served well. | **Winnable**, with a judgement call attached — see below. |
| `shame` | 5 | Broad emotional entry point; combines to *body shame*, *appearance shame*. | Mid. Moderate competition, decent intent. |

### On `ugly`

There is a tension worth naming rather than burying. SAFETY.md §2 forbids any
appearance-evaluative content inside the app, and "ugly" is an appearance evaluation. But a
keyword is not content — it is a match on somebody's search, and matching *ugly* with an
app that refuses to rate anyone's face is the best possible outcome for that search. The
alternative is that the query keeps going to before-and-after editors. Keep it. If it is
ever cut, replace with `looks` (5 chars) and drop the trailing space.

### Deliberately excluded

- **`eating`, `anorexia`, `bulimia`, `calories`, `weight`** — the app has no eating-disorder
  content and SAFETY.md bans weight and calorie data outright. This traffic would convert
  once, badly, and irrelevant traffic that does not convert damages rankings. It is also
  arguably irrelevant metadata under Guideline 2.3.7.
- **`therapy`, `treatment`, `cure`, `clinical`** — see §5. These are the terms most likely
  to make a reviewer read the listing as a medical claim, and they are false.
- **`selfie`, `face`, `skin`, `filter`, `glowup`** — collides with the beauty and camera
  categories, which are enormous and where the intent is the opposite of this app's.
- **`mindfulness`, `journal`, `habit`** — huge, generic, unwinnable, weak fit.

### Two free indexed fields most people forget

- **In-app purchase display names** are indexed, up to 30 characters each, and you have
  three products. They are shown to the customer in the purchase sheet, so they must stay
  honest: `Steady+ Yearly`, `Steady+ Monthly`, `Steady+ One-Time`. Do not stuff them.
- **Screenshot captions** are read by OCR and treated as ranking signal. This is a
  third-party finding rather than something Apple documents, but the captions in §4 should
  carry the vocabulary anyway, so act on it.

---

## 3. Description

Not indexed. Its only job is to convert the person who already tapped through. On an
iPhone roughly the first 125 characters show before **more**, and that fragment is what
earns the tap.

### Above the fold

> Appearance worry takes hours out of a day. Steady counts those hours and helps you get
> them back. Nothing leaves your phone.

124 characters. Three facts, no adjectives, and the privacy claim lands inside the visible
window rather than four scrolls down where nobody sees it.

### Full description

```
Appearance worry takes hours out of a day. Steady counts those hours and helps you get them back. Nothing leaves your phone.

Most people who worry about how they look lose between one and five hours a day to it — thinking about it, checking, getting ready, avoiding things, and recovering afterwards. Steady is built around that one number, and around getting it down.

Progress here is never "you look better." Progress is hours reclaimed, checking urges resisted, and distress falling across repeated practice. There is no photo capture, no rating, no score about your appearance, and no before-and-after. Those things are the problem, not the measure of it.

TWELVE WEEKS, FOUR PHASES

See the pattern (weeks 1–3). A daily check-in that takes under thirty seconds, and three short readings on what your attention is actually doing.

Interrupt the loop (weeks 4–6). The checking log, the three-minute urge timer, thought records, and the first timed mirror sessions.

Widen the lens (weeks 7–9). Attention training, longer sessions, and behavioural experiments where you write down what you think will happen, do the thing, and record what actually happened.

Live in the hours (weeks 10–12). What the reclaimed time goes to, and a written plan for the weeks that go badly.

Weeks unlock when you finish four practice days, not on a date. Fall behind by a month and nothing is lost, because falling behind is not a thing this app can represent.

WHAT IS FREE, ALWAYS

Grounding, breathing, and the hard-day path.
The daily check-in and your hours number.
Crisis lines for Canada, the US, the UK and Australia, and guidance on finding a clinician.
Week one of the programme and the first three readings.
Export and a full backup file.

These are free forever, on every tier, and never more than two taps from any screen. A billing state will not sit between you and a crisis line.

PRIVATE BY CONSTRUCTION

No account, no sign-in, no cloud, no analytics, no tracker. What you write stays in this app on this phone, and there is no server it could be sent to. That also means there is no backup: if you delete the app it is gone, which is why the plain-text export and the full backup file are free on every tier.

STEADY+

Steady+ unlocks weeks 2 to 12, all twelve readings, unlimited thought records, mirror practice, behavioural experiments, and the full progress history.

Steady+ Yearly: 14-day free trial, then $79.99 per year. Renews annually until cancelled.
Steady+ Monthly: 14-day free trial, then $12.99 per month. Renews monthly until cancelled.
Steady+ One-Time: $149 once. Not a subscription.

Payment is charged to your Apple Account when you confirm the purchase. A subscription renews automatically unless auto-renew is switched off at least 24 hours before the period ends. Your account is charged for renewal within 24 hours of the end of the current period. Manage or cancel in your Apple Account settings. Any unused part of a free trial is forfeited if you buy a subscription during the trial.

If the price is out of reach there is a link on the purchase screen that gives you three months, immediately, with no form and no questions.

Privacy policy: https://example.com/steady/privacy
Terms of use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

BEFORE YOU START

Steady is an educational self-help tool. It is not therapy, not a diagnosis, not medical advice, and not a medical device. It does not treat or cure anything. If appearance concerns are taking hours out of most days, or you are avoiding work, school or people, that is worth a proper assessment — the Support tab has crisis lines and guidance on finding someone who works with body dysmorphic disorder or OCD-spectrum conditions specifically.

If you are having thoughts of harming yourself, that means today rather than eventually. The Support tab is one tap from every screen and it is free.
```

Replace the privacy policy URL with the real one before submission (§5, item 2). The
Terms of Use link is Apple's standard EULA, which satisfies the requirement without you
drafting one.

### Promotional text (170 characters, not indexed, editable without review)

> Week one is free, and grounding, the daily check-in and crisis support are free forever.
> No account, no cloud, no tracker — what you write stays on your phone.

Use this field for anything time-sensitive later, since changing it does not require a new
build or a new review.

---

## 4. Screenshot plan

Six frames. The first two or three appear in search results at thumbnail size and carry
most of the conversion weight; frames four to six are only ever seen by someone already
scrolling the listing.

Rules for the whole set: real app UI in a current device frame, one type and colour system
throughout, captions of three to five words in type large enough to read at thumbnail size,
and — non-negotiably — **no human face in any frame**, including the mirror screens. The
Atmosphere SVG scenes and the text-guided mirror path exist for exactly this.

| # | Caption | Screen | Why it is in this position |
|---|---|---|---|
| 1 | **Hours back, not looks better** | Home, with reclaimed hours at full size and the week ring beneath | The whole product in one image. It states the metric and rules out the thing people fear an app like this will do. Readable at thumbnail because the number is already the largest object on the screen. |
| 2 | **No account. Nothing uploaded.** | Onboarding step: "This stays on your device" | The second-biggest objection in this category, answered before it is raised. In a category where people have never said this out loud to anyone, privacy is a conversion lever, not a footnote. |
| 3 | **Count the urges you resisted** | Urges, with the running resisted tally dominant | First frame that shows a mechanism rather than a promise. "Resisted" is the emotional hook — it only goes up, and it is about what you did, not how you look. |
| 4 | **Mirror practice, timed and graded** | Mirror pre-rating screen, or the text-guided session — never a live camera frame | The most differentiated feature and the one people are most wary of. Showing the timer and the rating scale, not a face, makes the point that this is structured exposure rather than a mirror app. |
| 5 | **See the hours come back** | Progress, showing the reclaimed-hours-by-week chart | Proof that the number in frame 1 is a real series, not a vanity figure. Charts convert well this deep in a listing because the visitor is now looking for evidence. |
| 6 | **Grounding and crisis lines, free** | Grounding, or the Support screen with the region picker | Closes on trust. It says the safety surfaces are not a paid feature, which is both true and the strongest thing this app can say about itself. |

Frame 4 needs a note in App Review notes (§5) so the reviewer understands why a "mirror"
app has no photograph in its screenshots.

---

## 5. Apple review risk

Ordered by how likely each is to stop the submission, not by guideline number.

### 5.1 — Guideline 5.1.1(ix), highly regulated fields. **Blocker.**

> "Apps that provide services in highly regulated fields (such as banking and financial
> services, healthcare, gambling, legal cannabis use, air travel and crypto exchanges) or
> that require sensitive user information should be submitted by a legal entity that
> provides the services, and not by an individual developer."

**Risk here:** healthcare is named explicitly, and App Review applies this to mental-health
apps regularly. The rejection cannot be argued away with documentation, and it cannot be
fixed by editing the app — Apple's stock response is that the developer account itself must
be an Organization. Converting an Individual account to an Organization requires a D-U-N-S
number and takes days to weeks.

**What to change:** submit from an Organization developer account, with the seller name
matching the entity. The bundle identifier `com.borntosoar.steady` suggests an entity
already exists; confirm the Apple Developer Program enrolment type before building anything
else in this document. If it is currently an Individual enrolment, start the conversion now
— it is the longest-lead item on the list.

Steady's actual posture helps the argument if it is ever contested: it provides no
healthcare service, holds no sensitive user information off-device, and has no account.
Put that in the review notes. But do not rely on it.

### 5.2 — Guideline 5.1.1(i), privacy policy. **Blocker.**

> "All apps must include a link to their privacy policy in the App Store Connect metadata
> field **and within the app in an easily accessible manner**."

**Risk here:** there is no website, and the App Store Connect Privacy Policy URL field is
mandatory. Worse, `grep` across `app/`, `components/` and `lib/` finds exactly one
`Linking.openURL` call in the whole codebase, and it is a `tel:` link on the Support
screen. **There is currently no privacy policy link anywhere in the app.** That is a
straightforward rejection.

**What to change:**

1. Host one static page. GitHub Pages, or any plain host — this is a document, not a
   website, and it does not contradict the decision not to build one. The repo is already
   on GitHub.
2. The policy must state, per 5.1.1(i): what data is collected (none, in v1), how, and all
   uses; that no third party receives user data; and the retention and deletion policy
   (data lives only on the device and is deleted when the app is deleted, with export
   available at any time).
3. Add the link in-app somewhere permanent — a Settings or About row — and on the paywall
   (see 5.4).
4. Add the same URL to the App Store Connect metadata field.

**If RevenueCat ships in v1, the policy must say so before submission**, not after. See 5.7.

### 5.3 — Guideline 2.1, App Completeness, and the reviewer's three minutes. **High.**

**Risk here:** weeks unlock on completion of four practice days, never on elapsed time
(`lib/protocol.ts`). A reviewer who opens the app, taps around for three minutes, and
cannot reach any paid content will reject under 2.1 as incomplete or non-functional, and
may additionally flag the IAP as untestable. This is one of the most common rejections for
programme-shaped apps and it has nothing to do with the app being wrong.

Two further tripwires in the same category:

- `purchase()` and `restore()` in `hooks/useEntitlement.ts` are currently local flags with
  a `// REVENUECAT INTEGRATION POINT` marker and no StoreKit behind them. Submitting with
  stubbed purchases is a rejection under 2.1 and potentially 3.1.1, because content is
  being unlocked outside of in-app purchase. **This must be wired before submission.**
- The hardship link grants full entitlement instantly with no payment. That is permitted —
  giving paid content away free is not a 3.1.1 issue — but an unexplained free-unlock
  button next to a paywall looks to a reviewer exactly like a circumvention of IAP. Explain
  it, or it gets read the wrong way.

**What to change:** write App Review notes. Draft:

> Steady is a twelve-week self-help programme for appearance anxiety. It is educational; it
> does not diagnose or treat, and it is not a medical device. Everything is stored locally —
> no account, no server, no analytics.
>
> To reach the paid content quickly: open the paywall from the Today tab, tap "Can't afford
> this right now?", then "Give me three months". This grants full access immediately. It is
> a deliberate hardship path, offered free to anyone who taps it, with no form and no
> eligibility check. It is not a way to obtain paid content outside of in-app purchase — it
> is us choosing to give the content away to people who cannot pay.
>
> Weeks unlock on completion of four practice days rather than on elapsed time, so the later
> weeks will not appear on a fresh install. The hardship grant above bypasses the paywall
> but not the protocol; to inspect week 4 content directly, [state the debug path, or supply
> a build with the protocol gate relaxed].
>
> The mirror screen requests camera access and renders a live mirror only. Nothing is
> captured, recorded or stored, and there is no capture API anywhere in the codebase.
> Declining the permission is a fully supported path — the session runs text-guided and
> collects the same data. This is why no screenshot shows a camera frame.
>
> Crisis support is free on every tier and is one tap from every screen via the persistent
> Support button. It is never gated by billing state.

### 5.4 — Guideline 3.1.2 and Schedule 2 §3.8(b), subscription disclosure. **High.**

Apple requires all of the following to be shown **inside the binary, clearly and
conspicuously, in the purchase flow, without the user having to tap a link**:

| Required | Present today? |
|---|---|
| Title of the auto-renewing subscription | Partial — the rows say "Yearly" / "Monthly", not "Steady+ Yearly". Use the IAP display name. |
| Length of subscription | **Missing as words.** `$79.99/yr` is a price string; the renewal period is never stated. |
| Price, and price per unit | Yes — `$79.99/yr` and `$6.67 a month`. |
| Statement that it renews automatically until cancelled | **Missing.** The paywall says "Cancel any time in your app store settings", which is not the same statement. |
| Functional link to the privacy policy | **Missing.** |
| Functional link to the Terms of Use (EULA) | **Missing.** |

**What to change on `app/paywall.tsx`:**

1. Replace the line `Free until {date}. Then {price}.` with the full disclosure, in the
   same plain register the file already uses. Something like:

   > Free until 21 August. Then $79.99 a year, renewing every year until you cancel.
   > Cancel any time in your Apple Account settings, in fewer taps than it took to start.

2. Add two plainly labelled links directly beneath the purchase button: **Privacy policy**
   and **Terms of use**. Apple's standard EULA
   (`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`) is acceptable and
   removes the need to write one.
3. Add the same two links to the App Store Connect metadata (Privacy Policy URL field, and
   the EULA field or the description).
4. **Rename the "Lifetime" plan.** App Review has repeatedly objected to "lifetime" on the
   grounds that no developer can guarantee content for a customer's lifetime. `Steady+
   One-Time`, labelled "Pay once" in the UI, carries the same meaning with none of the risk.
5. The paywall promises "We will remind you two days before it ends." `MOMENT_COPY`
   contains a `trial-ending` moment, so the copy exists — confirm it actually fires, via a
   local notification or an in-app card that a lapsed user will genuinely see. A stated
   commitment the app does not keep is a metadata-accuracy problem under 2.3 and a
   consumer-protection problem in several jurisdictions, quite apart from being the exact
   kind of thing this app's own rules exist to prevent.

Everything else about this paywall is already on the right side of the line: no countdown,
no fake scarcity, two working exits, a visible restore button (required by 3.1.1), and a
free tier that is genuinely usable.

### 5.5 — Guideline 1.4.1, medical claims. **Medium.**

> "Medical apps that could provide inaccurate data or information, or that could be used
> for diagnosing or treating patients may be reviewed with greater scrutiny. Apps must
> clearly disclose data and methodology to support accuracy claims relating to health
> measurements… Apps should remind users to check with a doctor in addition to using the
> app and before making medical decisions."

**What is at risk:**

- **The category choice.** Ship under **Health & Fitness**, not **Medical**. The Medical
  category invites 1.4.1 scrutiny by default and buys nothing in return.
- **`content/proof.ts` on the paywall.** `d = 1.22`, `12 weeks`, `2 in 100` are effect
  sizes and prevalence figures rendered next to a purchase button. In isolation that reads
  as an efficacy claim about Steady. It is saved by `PROOF_QUALIFIER` — *"Steady is not
  therapy and has not itself been trialled. These are findings about the methods the
  exercises are built from"* — which `safety.test.mjs` already asserts travels with them.
  **Keep that test. Keep the qualifier visually adjacent to the figures, not below the
  fold.** If a reviewer ever queries the numbers, the answer is that each is sourced on
  screen and the qualifier disclaims application to this app.
- **Do not put any of those figures in the App Store description.** A statistic in the
  store listing has no qualifier travelling with it, and the description is where a
  reviewer looks first. The draft in §3 contains no numbers other than durations, counts
  and prices.
- **"Hours reclaimed" is not a health measurement.** It is arithmetic on self-reported
  bucketed time, and 1.4.1's accuracy clause is aimed at sensor-derived claims (blood
  pressure, glucose, oximetry from the device's sensors). Describe it as what it is — a
  count of the customer's own reported time — and never as a measurement of a condition,
  a severity, or a symptom level. The ±0.25h/week flat band is a good-faith accuracy
  decision worth mentioning in review notes if it ever comes up.
- **The doctor reminder is already there.** `DISCLAIMER` and `CONTENT_FOOTER` both point to
  professional care, the onboarding disclaimer gate is step 7, and Module 12 is entirely
  about when self-help is not enough. This is genuinely well covered — make sure the
  reviewer sees the onboarding gate rather than skipping it.
- **Vocabulary in store metadata.** SAFETY.md §8 already bans treatment claims in shipped
  prose and `copy.test.mjs` enforces it, but **store metadata is not covered by that test.**
  Nothing in the name, subtitle, keyword field, screenshots or description may say *treat*,
  *cure*, *therapy*, *clinically proven*, *heal*, *fix*, or *recovery*. The drafts above
  avoid all of them. If this file is ever revised by someone else, that is the sentence to
  re-read.

### 5.6 — Age rating, Guideline 2.3.6. **Medium — and it is a submission gate.**

Apple overhauled age ratings in 2025: 12+ and 17+ were removed, 13+, 16+ and 18+ added, and
a longer content questionnaire introduced. Every app had to complete the new questionnaire
by 31 January 2026; that deadline has passed, so **an app that has not answered it cannot
be submitted or updated at all.** Answers in §6.

The specific risk: the questionnaire's **Medical or Treatment Information** descriptor
covers "content that provides diagnoses or guidance around the management of medical
conditions or health and wellness (medication guidance, emergency medical care, or
treatment information)." Steady's twelve modules discuss body dysmorphic disorder by name,
describe what CBT and ERP involve, name medication as a conversation to have with a doctor,
define a behavioural threshold for seeking professional help, and carry crisis lines. That
is frequent, not infrequent. **Answer honestly and take 16+.** Under-rating triggers 2.3.6,
a forced re-review, and — Apple's own wording — potentially "an inquiry from government
regulators". 16+ costs nothing here; the app's disclaimer gate is already written for
adults.

### 5.7 — App Privacy label accuracy once RevenueCat lands. **Medium, and easy to get wrong.**

Today the app collects nothing and transmits nothing, so the label is "Data Not Collected".
The moment RevenueCat is wired in, that stops being true: RevenueCat transmits purchase
history and an app user ID to its servers. **The App Privacy label must be updated in the
same submission as the SDK, not afterwards.** A label that understates collection is a
5.1.1/5.1.2 problem and one of the faster routes to app removal. Details in §6.

Two related items:

- **Third-party SDK privacy manifests** have been required since 2024. RevenueCat ships
  one; confirm it is present in the build.
- **The app's own `PrivacyInfo.xcprivacy`** must declare required-reason API usage. Steady
  persists through AsyncStorage, which is `NSUserDefaults` underneath — reason code
  `CA92.1` (access to app group / same-app data). Expo covers some of this; verify rather
  than assume.

### 5.8 — Camera permission, Guideline 5.1.1(ii)–(iv). **Low. Already handled.**

`NSCameraUsageDescription` in `app.json` is specific and truthful, which is what (ii)
requires of purpose strings. (iii) data minimisation is satisfied — the camera is the core
of the mirror feature and nothing else requests protected resources. (iv) requires an
alternative for users who decline, and the text-guided path is exactly that, collecting
identical data. This is better than most health apps manage. The only action is to say so
in the review notes so a reviewer who declines the prompt does not conclude the feature is
broken.

### 5.9 — Things that are *not* problems, so nobody wastes time on them

- **5.1.1(v) account deletion** does not apply. There are no accounts, and (v) explicitly
  endorses letting people use an app without a login.
- **5.1.2(i) App Tracking Transparency** does not apply. No tracking, no ATT prompt needed,
  and adding one unnecessarily is itself a rejection risk.
- **5.1.3 Health and Health Research** does not apply. No HealthKit, no Clinical Health
  Records, no human-subject research. If HealthKit is ever added, 5.1.3(ii) forbids storing
  personal health information in iCloud — which SAFETY.md §6 already forbids for other
  reasons.
- **2.5.1** — the app does not integrate HealthKit and does not claim to, so there is no
  framework-purpose mismatch.
- **1.4.2 drug dosage calculators** does not apply. Module 12 mentions medication as a
  topic for a doctor and gives no dosing information; keep it that way.
- **The hardship grant is not a 3.1.1 violation.** Apple polices content unlocked through
  payment *outside* IAP. Content given away for free is not that.

---

## 6. Age rating and App Privacy answers

### Age rating questionnaire — App Store Connect

Recommended result: **16+**.

| Question | Answer | Why |
|---|---|---|
| **Medical or Treatment Information** | **Frequent** | Twelve modules discuss BDD, CBT and ERP, medication as a doctor conversation, thresholds for professional help, and crisis contacts. This is the answer that sets the 16+ rating. |
| **Health or Wellness Topics** | Infrequent | Grounding, breathing, values-based activity planning. No calorie tracking, no dieting, no exercise prescription — SAFETY.md §2 forbids all three. Contributes 9+; immaterial next to the above. |
| Violence (all types: cartoon, realistic, graphic, prolonged) | None | |
| Sexual Content or Nudity | None | |
| Profanity or Crude Humour | None | `copy.test.mjs` would fail. |
| Horror or Fear Themes | None | |
| Alcohol, Tobacco, or Drug Use or References | None | Module 12 names substance use as a reason to seek help. That is a health referral, not a reference to use. If App Store Connect's wording seems to catch it, answer Infrequent — it does not change 16+. |
| Gambling (simulated or real) | None | |
| Contests | None | |
| Loot Boxes | None | |
| **Unrestricted Web Access** | **No** | Verified: the only `Linking.openURL` call in the codebase is `tel:` on the Support screen. **This answer changes the moment a privacy-policy link is added (5.2).** A single link to your own policy is not "unrestricted web access" — it opens one known URL — but if it is implemented with an in-app browser that can navigate anywhere, the honest answer becomes Yes. Use `Linking.openURL` to hand the URL to Safari rather than embedding a `WKWebView`. |
| User-Generated Content | No | Journal entries are local and visible to nobody. |
| Ability to Chat or Message | No | |
| Social Media features / integration | No | SAFETY.md §7 rules out an AI companion in v1; there is no social surface of any kind. |
| Advertising | No | |
| In-App Controls — Parental Controls | No | |
| In-App Controls — Age Assurance | No | |

### App Privacy "nutrition label" — App Store Connect

**Version 1, before RevenueCat is wired in.**

The first question is: *"Do you or your third-party partners collect any data from this
app?"* → **No.**

That single answer completes the section and produces the **"Data Not Collected"** label,
which displays to customers as *"The developer does not collect any data from this app."*

This is correct and defensible, and the reason is worth writing down because it is
counterintuitive: the app holds extremely sensitive material — thought records, distress
ratings, appearance concerns — and still answers No. Apple's definition of *collect* is
"transmitting data off the device in a way that allows you and/or your third-party partners
to access it for a period longer than necessary to service the transmitted request in real
time." Nothing leaves the device. `lib/storage.ts` contains no network call and, per
SAFETY.md §6, must not gain one. Local storage is not collection.

Confirm before answering:

- No analytics SDK, no crash reporter (Sentry, Firebase, Bugsnag), no attribution SDK.
- Expo's own telemetry is build-time, not runtime — verify no `expo-analytics`,
  `expo-firebase-*` or similar is in `package.json`.
- The user-initiated export writes a file the user keeps. Not collection.

**Version 1 with RevenueCat, or any later version that adds it.** The answer flips to
**Yes**, and these are the selections:

| Data type | Collected | Linked to identity | Used for tracking | Purpose |
|---|---|---|---|---|
| Purchases → **Purchase History** | Yes | **No** | **No** | App Functionality |
| Identifiers → **User ID** (RevenueCat's anonymous app user ID) | Yes | **No** | **No** | App Functionality |

Everything else stays unselected — no Contact Info, no Health & Fitness, no Sensitive Info,
no Usage Data, no Diagnostics (unless a crash reporter is added, which would add
Diagnostics → Crash Data, App Functionality, not linked, not tracking), no Location, no
Search History, no Browsing History, no Contacts, no Photos or Videos, no Audio Data, no
Financial Info.

The tracking question — *"Is this data used to track you?"* — is **No** for both. There is
no ATT prompt, no advertising SDK, no data broker. Do not add an ATT prompt "just in case";
requesting tracking permission you do not need is its own rejection risk.

Note the asymmetry that matters most: **Health & Fitness data must remain unselected in
every version.** Distress ratings and checking counts never leave the device, so under
Apple's definition they are not collected, and selecting the category would be inaccurate
in the other direction. If a future version ever syncs, that selection becomes mandatory
and the app enters 5.1.3 territory.

### Other App Store Connect fields

| Field | Value |
|---|---|
| Primary category | **Health & Fitness** — not Medical (see 5.5) |
| Secondary category | Medical, or leave empty. Medical as a *secondary* category is lower risk than primary, but it is not worth much either. |
| Privacy Policy URL | Required. Hosted static page (see 5.2). |
| EULA | Apple's standard EULA, or a custom one in the EULA field. The link must also appear on the paywall. |
| Content Rights | No third-party content. |
| Sign-In required | No. |
| Demo account | Not applicable — no accounts. Say so in review notes rather than leaving the field to be interpreted. |
| Export compliance | No non-exempt encryption. The app makes no network calls; confirm `ITSAppUsesNonExemptEncryption: false` is set in the Info.plist so the question stops being asked on every build. |

---

## Pre-submission checklist

Blockers first.

- [ ] **Every crisis number in `constants/support.ts` verified against its provider.** 31
      regions, assembled from knowledge rather than a live check. A wrong number here is the
      worst bug this app can ship. Mitigated but not removed by the findahelpline.com
      backstop in every region — see `docs/LOCALISATION.md` §2
- [x] **Governing law jurisdiction chosen: Canada.** `legal/terms-of-use.md` §15, standard
      Canadian construction, non-exclusive jurisdiction, no arbitration clause
- [ ] **Province named** — the last field blocking the legal site build, which blocks the
      privacy policy URL, which blocks submission. Canadian contract and consumer law is
      provincial. **If it is Quebec, Bill 96 requires French versions** and that must be
      settled before launch — see `docs/LOCALISATION.md` §1
- [ ] Legal entity name and registered address — likely one decision with the Organization
      account below, since that needs a D-U-N-S number
- [ ] Apple Developer Program enrolment is an **Organization**, not an Individual (5.1)
- [ ] Privacy policy hosted at a real URL, linked in App Store Connect **and in-app** (5.2)
- [ ] StoreKit / RevenueCat wired — `purchase()` and `restore()` are not stubs (5.3)
- [ ] Paywall shows subscription length, auto-renewal statement, and both legal links (5.4)
      — length and the auto-renewal statement are **done**, via `RENEWAL_TERMS` in
      `lib/entitlement.ts`; the two legal links remain outstanding and are blocked on the
      privacy policy URL on the line above
- [x] "Lifetime" renamed to "One-Time" / "Pay once" (5.4) — the label is "Pay once". The
      `Plan` key stays `lifetime` because it is an internal identifier that keys stored
      state; `__tests__/safety.test.mjs` greps every source file to keep the word out of
      anything a customer reads
- [ ] Free trial configured at a duration App Store Connect sells. `PRICING.trialDays` is
      30, i.e. the "1 month" introductory offer. Asserted in `__tests__/entitlement.test.mjs`
- [ ] App Privacy label matches what the build actually does, including RevenueCat (5.7) — both states written out in `docs/SUBMISSION-ANSWERS.md` §3. Today the honest answer is Data Not Collected; the RevenueCat rows go in the SAME submission as the SDK
- [ ] New age-rating questionnaire completed — answers written in `docs/SUBMISSION-ANSWERS.md` §2; expected result 4+, and if it comes out higher find out which answer did it rather than accepting it
- [x] App Review notes written, including the hardship path and the camera alternative (5.3) — `docs/SUBMISSION-ANSWERS.md` §1
- [x] Category is Health & Fitness (5.5) — `fastlane/metadata/en-US/primary_category.txt`, asserted by test
- [ ] No treatment vocabulary anywhere in name, subtitle, keywords, screenshots or
      description (5.5)
- [x] `trial-ending` reminder actually fires (5.4) — `__tests__/trial-reminder.test.mjs`
      proves it fires on each of the last three days, outranks every other moment, survives
      the distress suppression, and cannot be dismissed away. **Known gap:** it is in-app
      only, so a user who does not open Steady that week is not reminded. The paywall copy
      was corrected to say so rather than overstate it. A local notification is the real
      fix and is the one notification this app has a clean justification for — service, not
      engagement
- [ ] No human face in any screenshot (§4)
- [x] Keyword field is 99 characters, no spaces after commas, nothing repeated from the
      name or subtitle (§2) — in `fastlane/metadata/`, all four rules asserted by test

---

## Sources

- [App Review Guidelines — Apple Developer](https://developer.apple.com/app-store/review/guidelines/)
- [Schedule 2 and 3, Apple Developer Program License Agreement (PDF)](https://developer.apple.com/support/downloads/terms/schedules/Schedule-2-and-3-English.pdf)
- [How to Comply with Apple's Schedule 2, Section 3.8(b) — RevenueCat](https://www.revenuecat.com/blog/engineering/schedule-2-section-3-8-b/)
- [Age ratings values and definitions — App Store Connect Help](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)
- [Updated age ratings in App Store Connect — Apple Developer News](https://developer.apple.com/news/?id=ks775ehf)
- [Age Rating Updates, Upcoming Requirements — Apple Developer](https://developer.apple.com/news/upcoming-requirements/?id=07242025a)
- [App Privacy Details on the App Store — Apple Developer](https://developer.apple.com/app-store/app-privacy-details/)
- [User Privacy and Data Use — Apple Developer](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [App rejection due to 5.1.1(ix) — Apple Developer Forums](https://developer.apple.com/forums/thread/689699)
- [Guideline 3.1.2 subscription rejections — Apple Developer Forums](https://developer.apple.com/forums/thread/807082)
- [App Store Keyword Field Guide 2026 — AppLaunchFlow](https://www.applaunchflow.com/blog/app-store-keyword-field-guide-2026)
- [App Store Keyword Research: iOS App Keywords & ASO Guide 2026 — AppLaunchFlow](https://www.applaunchflow.com/blog/app-store-keyword-research-2026)
- [App Store Metadata Reference: Character Limits + Indexing — AppScreenshotStudio](https://appscreenshotstudio.com/tools/app-store-indexed-fields)
- [App Store App Name, Subtitle, Keywords: 30/30/100 (2026) — AppScreenshotStudio](https://appscreenshotstudio.com/blog/app-store-metadata-for-indie-devs-title-subtitle-keywords-2026)
- [ASO Screenshots: 2026 Best Practices — AppFollow](https://appfollow.io/blog/aso-screenshots-best-practices)
- [App Store Screenshot Best Practices for ASO in 2026 — AppLaunchFlow](https://www.applaunchflow.com/blog/app-store-screenshot-best-practices-2026)
- [App Store age ratings in 2026: the 2025 overhaul explained — PTKD Journal](https://ptkd.com/journal/app-store-age-ratings-2025-update)
