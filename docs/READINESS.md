# What an app actually needs to ship

Three questions, in the order that matters: **does it work, is it allowed, will anyone
stay.** Most checklists cover the first, half of the second, and none of the third — which
is why so many apps pass review and die anyway.

Every row carries Steady's real status, checked against the source rather than assumed.
Where something is missing it says so. The point of the table is the gaps, not the ticks.

**Legend:** ✅ done · 🟡 partial or deliberate compromise · ❌ missing · ⬜ blocked on
something outside the code

---

# Part 1 — Functionality: does it work

Not "are the features built". Features are the easy part. This is whether the thing survives
contact with a real phone, real data and real failure.

## 1.1 It launches, and keeps launching

| Necessity | Why | Steady |
|---|---|---|
| Cold start under ~2s | Past that people assume it broke | 🟡 not measured on device |
| No crash on first run | The single highest-leverage bug class | ✅ verified |
| No crash on *upgrade* | Far more common than first-run crashes and far less tested | ✅ schema migrations + newer-payload quarantine |
| Survives being killed mid-write | Task-killed apps lose the last write | ✅ flush on background |

**The one nobody tests:** launching with data written by a *newer* build. It happens the
moment you ship TestFlight and App Store side by side. Steady quarantines it rather than
downgrading the envelope, because reading it partially and re-stamping the old version is
how a migration silently runs twice.

## 1.2 It survives bad data

| Necessity | Why | Steady |
|---|---|---|
| Validate at the boundary, not at the type | `JSON.parse` returns `any`; a cast is not validation | ✅ allowlist rebuild in `lib/storage.ts` |
| Drop malformed rows rather than propagate | Otherwise the crash moves to the first screen that reads it | ✅ |
| Guard non-finite numbers | One `NaN` reaches the headline figure and the product looks broken | ✅ |
| Corrupt state cannot overwrite good state | The difference between a bad launch and permanent loss | ✅ write lock + quarantine |

**This is where most data-loss bugs live.** Not in the write path — in the *read* path
treating "I could not read this" as "there was nothing here", then saving the emptiness over
the top.

## 1.3 It survives a crash

| Necessity | Why | Steady |
|---|---|---|
| A root error boundary | Without one, a render throw blanks the entire app | ✅ `components/CrashScreen.tsx` |
| The crash screen does something useful | "Something went wrong" is not a feature | ✅ crisis numbers, then export, then reload |
| Crash visibility | You cannot fix what you never hear about | 🟡 Apple's free crash reports only — deliberate, no SDK |

## 1.4 Data: in, out, and gone

| Necessity | Why | Steady |
|---|---|---|
| Persists reliably | — | ✅ |
| **Export** in a portable format | Legally required in several regimes, and the user's insurance | ✅ text + JSON, free on every tier |
| **Delete everything**, from inside the app | Erasure right; "delete the app" is a workaround, not a control | ✅ (added late — it existed in the store and nothing called it) |
| Encrypted at rest | Sandbox alone is not much against forensic extraction | ✅ XChaCha20-Poly1305, key in Keychain |
| Failure to decrypt never reads as "empty" | This is what makes encryption safe to add | ✅ quarantines instead |

## 1.5 It tells the truth when it fails

| Necessity | Why | Steady |
|---|---|---|
| Silent failure is the worst failure | Weeks of journalling look saved and are not | ✅ `StorageNotice` |
| Degraded modes are disclosed | Not just handled | ✅ including the unencrypted fallback |
| Failure copy says what to do | "Error 500" helps nobody | ✅ |

## 1.6 It is tested, and the tests enforce the rules

| Necessity | Why | Steady |
|---|---|---|
| Tests for the logic | — | ✅ 424 |
| Tests for the *constraints* | A rule in a markdown file gets deleted by someone who never read it | ✅ `safety.test.mjs` |
| CI that runs them | A guarantee that depends on remembering is not one | ✅ added this week — it did not exist |
| The build itself is tested | Typecheck-clean code can still fail to bundle | ✅ web export in CI |

**Learned the hard way this week:** a JSX syntax error shipped past a green suite, because
the suite read that file as *text* rather than compiling it. The CI bundle step is what
catches that class.

## 1.7 Platform integration

| Necessity | Why | Steady |
|---|---|---|
| App icon, every size | Hard submission blocker | ✅ generated, was missing entirely |
| Splash / launch screen | — | ✅ |
| Permissions: only what is used | Unused permissions are a rejection risk and attack surface | ✅ microphone key removed |
| Permission strings that are specific | "Allow app to access your camera" gets rejected | ✅ |
| Deep links that cannot be weaponised | A registered scheme is an entry point any app can call | ✅ intent flag, not a URL param |
| Background behaviour | Flush state, refresh entitlement | ✅ |

## 1.8 Performance and size

| Necessity | Steady |
|---|---|
| Payload size bounded | 🟡 field caps added; no record-count cap by design |
| No unbounded growth | 🟡 measured: 5k records = 49MB, 800ms stringify |
| Binary size | 🟡 ZXing removed; not measured on device |
| Battery / background work | ✅ none — no timers, no background tasks |

---

# Part 2 — Legal: is it allowed

## 2.1 The entity

| Necessity | Why | Steady |
|---|---|---|
| A named legal entity | Every document needs a party | ⬜ **open** |
| Registered address | Same | ⬜ **open** |
| Governing law — **one** jurisdiction | "Worldwide" is not a choice of law | ✅ Canada |
| The right sub-unit | In Canada, contract law is *provincial* | ⬜ **province open** |
| Developer account of the right type | Apple requires Organization for most; needs D-U-N-S | ⬜ **weeks of lead time** |

## 2.2 The documents

| Document | Required? | Steady |
|---|---|---|
| Privacy policy, **hosted at a public URL** | Hard App Store blocker | 🟡 written, build gated on the three blanks |
| Privacy policy linked **in-app** | Guideline 5.1.1 | ✅ on the paywall |
| Terms / EULA | Apple's standard EULA is acceptable | ✅ custom, plus links |
| Domain-specific disclaimer | Health, finance, legal apps | ✅ medical disclaimer |
| Cookie policy | Only if the site sets cookies | ✅ (it sets none) |
| Accessibility statement | Voluntary now, mandatory under the EAA for some | ✅ honest about its gaps |

## 2.3 Money

| Necessity | Why | Steady |
|---|---|---|
| Auto-renew terms **adjacent to the button** | Guideline 3.1.2 — not behind a link | ✅ `RENEWAL_TERMS` |
| Price, period, and renewal in one place | — | ✅ |
| Restore purchases | Required by 3.1.1 | ✅ and it no longer grants on failure |
| Real receipt validation | Stubs are a 2.1 rejection | ⬜ RevenueCat not wired |
| Trial length the store can actually sell | 21 days is not a purchasable duration | ✅ 30 days |
| No dark patterns | Cheaper than the reputational cost | ✅ two exits, visible dismiss, no countdown |

## 2.4 Data rights

| Right | Regime | Steady |
|---|---|---|
| Access | GDPR, PIPEDA, CCPA | ✅ it is all on their device |
| Portability | GDPR 20 | ✅ JSON export |
| Erasure | GDPR 17, CPRA | ✅ in-app delete |
| Know what is collected | All | ✅ nothing |
| Retention limits | All | ✅ six years for purchase records (CRA) |
| Named accountable person | PIPEDA | ✅ |

## 2.5 Declarations you fill in a web form

| Item | Steady |
|---|---|
| Age rating questionnaire | ✅ answers written, 4+ expected |
| App Privacy label | ✅ both states written (before/after RevenueCat) |
| Privacy manifest (`PrivacyInfo.xcprivacy`) | ✅ required-reason APIs declared |
| Export compliance | ✅ `usesNonExemptEncryption: false` |
| ATT | ✅ N/A, and must stay that way |
| Category | ✅ Health & Fitness, never Medical |

## 2.6 Claims you make

The one that sinks health apps: **saying you treat something.** "Treatment", "therapy",
"clinically proven", "cure" are all rejections *and* untrue for a self-help tool.

Steady: ✅ enforced by test across the app copy **and** the store listing — including the
subtlety that a *denial* uses the same words as a *claim*, so the disclaimer must be allowed
while the assertion is not.

---

# Part 3 — Customer experience: will anyone stay

The part checklists skip. An app can be flawless and legal and still be uninstalled on day
two.

## 3.1 The first sixty seconds

| Necessity | Why | Steady |
|---|---|---|
| It is obvious what this is | You have one screen | ✅ |
| Value before signup | There is no signup, which is better | ✅ |
| First run asks for the minimum | Every field is a drop-off | ✅ |
| Permissions asked **in context** | Never on launch | ✅ camera at week 4 |
| A first win inside the first session | Otherwise nothing has happened yet | ✅ check-in under 30s |

## 3.2 The states nobody designs

| State | Why it matters | Steady |
|---|---|---|
| Empty | The first thing every new user sees | 🟡 present, not systematically designed |
| Loading | Blank screens read as broken | ✅ |
| Error | Must say what to do next | ✅ |
| Offline | Should degrade, not block | ✅ offline-native |
| Success | An action with no acknowledgement does not register as an achievement | ✅ `Finish` |

## 3.3 Accessibility

| Necessity | Steady |
|---|---|
| Contrast ≥4.5:1, **measured** | ✅ computed and tested against the real background |
| Touch targets ≥44pt | ✅ |
| Labels and roles | ✅ every Pressable has a role; icon-only controls have labels — both asserted |
| Reduced motion | ✅ with one documented, deliberate exception |
| **Dynamic Type** | ✅ verified clean at 3.1x (iOS max) with `npm run bigtext`, running uncapped — harsher than a device |
| Screen reader pass | 🟡 structure asserted; announcement ORDER still needs a device and a person |

**The most common accessibility gap in shipped apps is Dynamic Type**, because it only
breaks for people who have already changed a setting — so it never breaks for the developer.
`npm run bigtext` is the answer to that: it scales every rendered font size and reports what
overflows. Two real defects came out of the first run — the greeting ran under the
always-mounted Support pill, and the four tab labels collided into one unreadable word.

## 3.4 Words

| Necessity | Steady |
|---|---|
| Reading level appropriate to the audience | ✅ 8th grade, tested |
| Buttons say what will happen | ✅ |
| Error messages name the next action | ✅ |
| No shaming | ✅ tested |
| Nothing overstated | ✅ — the trial-reminder line was corrected this week for exactly this |

## 3.5 A way to reach a human

| Necessity | Why | Steady |
|---|---|---|
| In-app support route | Without one, your bug report is a one-star review | ✅ bottom of the support screen |
| Support address that is monitored | — | ✅ |
| A route that is not the App Store | The store is where frustration goes to become public | ✅ |
| The feedback draft attaches nothing | A "diagnostic report" that scoops up state breaks the promise | ✅ tested — the user sends only what they type |

**Fixed while writing this document**, along with the review prompt below. Both were an hour
between them. Note the placement: last on the screen, below every crisis line, and labelled
"not a crisis line" — because on that screen somebody could reasonably assume otherwise.

## 3.6 Leaving well

| Necessity | Why | Steady |
|---|---|---|
| Cancelling is easy and honest | Hostile cancellation is the top driver of one-star reviews | ✅ says it takes fewer taps than signing up |
| Data leaves with them | — | ✅ export |
| Deletion is real | — | ✅ |
| No guilt on the way out | — | ✅ |

## 3.7 Asking for things

| Necessity | Steady |
|---|---|
| Review prompt after something good, never after friction | ✅ — it was designed, gated, and **wired to nothing**: the button returned early, so tapping it did literally nothing |
| At most one interruption at a time | ✅ budgeted in one file |
| Distress suppresses commercial asks | ✅ |
| Notifications that are service, not nagging | ✅ none — and the one justified case is documented |

---

# The seven almost everyone misses

1. **A read failure treated as an empty state.** Then saved over the real data.
2. **No error boundary.** One render throw and the whole app is a white screen.
3. **Launching on data from a newer build.** Ships the day you run TestFlight beside App Store.
4. **Dynamic Type.** Never breaks for the developer, always breaks for someone.
5. **No in-app support route.** Every bug becomes a public review.
6. **The store listing drifting from the code.** Advertised trial length vs actual — a refund, a bad review and a metadata violation in one.
7. **A "delete my data" function nothing calls.** Written, tested, never wired.

Steady had **six of the seven**, plus a review button wired to nothing. **All seven are now
fixed** — four of them found by writing this page, which is the argument for writing it down
rather than keeping it in your head.

---

# Steady, scored

| Area | State |
|---|---|
| Functionality | **Strong.** Failure paths are the most thoroughly built part. |
| Legal | **Written, blocked on three fields.** Province, entity name, address. |
| Customer experience | **Closed.** Every gap this document opened with is fixed. |
| Store readiness | **Blocked on the Apple account**, which is weeks. Everything else is close. |

## Next, in order

1. **Start the Apple Organization enrolment.** Longest lead item; everything is downstream.
2. **Name the province and the entity.** Unblocks the site → privacy URL → submission chain.
   ⚠ If Quebec, Bill 96 collides with the English-only decision.
3. **Wire RevenueCat.** Stubs are a rejection under 2.1.
4. **Verify the 31 crisis numbers** against their providers.
5. **A device pass** — VoiceOver announcement order, real launch time, real binary size. The
   three things in this document no test can reach.
