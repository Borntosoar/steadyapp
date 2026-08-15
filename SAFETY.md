# SAFETY.md

This file exists so that a future contributor — or a future version of the people who
built this — cannot quietly undo the constraints without first reading why they are here.

Every rule below has a reason. Several of them will look like features you are leaving on
the table. They are. That is the trade, and it was made deliberately.

If you are about to remove one of these, the bar is not "someone asked for it." The bar is
"I have read the reasoning and I have a better answer to the same problem."

---

## The one-paragraph version

Appearance self-monitoring is the behaviour that maintains body dysmorphic disorder.
Checking, measuring, photographing, comparing, and rating are not symptoms sitting
alongside the distress — they are the mechanism that keeps it running. Any feature that
asks a user to look at, score, or track their appearance is therefore not a body-image
feature with a risk attached. It **is** the disorder, wearing product design.

That single fact generates almost every rule in this document.

---

## 1. No photo capture. Ever.

**The rule.** There is no camera roll, no photo storage, no gallery, no filter, no
before/after, and no capture API. `takePicture`, `takePictureAsync`, `capture`,
`savePhoto`, and canvas snapshotting appear nowhere in this codebase.

Note that the identifiers are listed **only in this file**, so the grep below is a clean
signal rather than one that matches the comment warning against it.

**Why.** A stored photo is a permanent, re-inspectable object. The entire point of
perceptual retraining is to reduce close-range repeated inspection; a saved image is a
machine for producing exactly that, on demand, forever. Before/after pairs are worse
again: they make appearance change the unit of progress, which is the belief the whole
programme is built to dismantle.

**Where it lives.** `components/MirrorSurface.tsx`. The camera is rendered as a live
mirror and the stream is discarded frame by frame. On web the stream tracks are stopped
on unmount. There is no path from that component to persistent storage, and adding one
would require writing new code rather than flipping a flag.

**How to check you have not broken it.**

```bash
grep -rEi 'takePicture|savePhoto|captureRef|toDataURL|MediaLibrary|getScreenshot' \
  app components lib store content types
```

That must return **nothing at all** — not "nothing but comments". If you need to warn
about one of these in a code comment, describe it instead of naming it, the way
`components/MirrorSurface.tsx` does.

---

## 2. No appearance metric of any kind

**The rule.** No attractiveness score, no rating, no percentile, no ranking, no
leaderboard, no "improvement" measured in looks. No weight, calories, measurements, BMI,
sizes, or food logging.

**Why.** Beyond the maintaining-behaviour argument above: a number attached to appearance
is re-checkable, comparable across days, and impossible to disconfirm. It converts a
diffuse worry into a precise one, which is a downgrade. And a cross-user ranking would
additionally be non-consensual biometric processing — a legal problem in several
jurisdictions on top of the clinical one.

**Where it lives.** `types/index.ts` has no field for any of these, and says so in a
comment. `lib/reclaimed.ts` measures time, not appearance.

**The governing test:** *which direction is this number supposed to move?* Distress,
urges, checking minutes, and avoidance are meant to go **down**. Hours reclaimed and
urges resisted are meant to go **up** — and neither is a statement about a body. If you
are adding a metric that goes up and is about the user's appearance, stop.

**How to check.**

```bash
grep -rEi '\b(weight|calorie|bmi|attractiveness|hotness|rating|percentile)\b' \
  app components lib store content types
```

Hits should only ever be in comments explaining the prohibition.

---

## 3. No streak shaming

**The rule.** Missed days are neutral. No red UI, no broken-flame iconography, no "you
lost your streak," no make-up task, no guilt copy anywhere.

**Why.** Shame drives concealment; concealment drives dropout. The user most likely to
miss a week is the user having the worst week, which is precisely the person this app
most needs to keep. A streak that punishes absence optimises for the people who need it
least.

**Where it lives.** `lib/streak.ts`. Freezes apply silently. A gap too large to cover
restarts the count at 1 but preserves `longest`, so nothing achieved is erased. The
"hard day" path increments the streak like any other practice.

**Enforced by.** `__tests__/streak.test.mjs` and `__tests__/copy.test.mjs` assert that no
string reachable from the streak or copy modules matches shaming language. Two of the
original drafts failed these tests — `"data, not failure"` (negation still puts the word
in front of the reader) and `"most weeks look like this one"` (`look` is worth banning
outright here). Both were rewritten. The tests are why.

---

## 4. Safety is never paywalled

**The rule.** Grounding, breathing, the hard-day path, the daily check-in, and all crisis
support are free forever, and reachable in **two taps or fewer** from any screen.

**Why.** This app is used by a population with markedly elevated suicide risk. A billing
state must never sit between a person and a crisis line.

**Where it lives.** `lib/entitlement.ts` hard-codes `ALWAYS_FREE_ROUTES` rather than
deriving it, so gating one of them by accident requires deliberately editing a list with
a comment telling you not to. `app/_layout.tsx` mounts the Support button persistently,
which makes it exactly one tap from everywhere.

**Also:** a visible hardship link on the paywall grants access immediately, with no form,
no proof, and no questions. A test asserts the copy contains no eligibility or
application language.

---

## 5. No dark patterns in the paywall

**The rule.** No countdowns, no fake scarcity, no "limited spots," no disguised dismiss.
Two working exits, both plainly labelled.

**Why.** Manufacturing urgency at someone with an anxiety-spectrum condition is a bad
trade at any conversion rate.

**Enforced by.** `__tests__/copy.test.mjs` asserts no urgency language anywhere in
`PAYWALL_COPY`.

---

## 6. Local only

**The rule.** No cloud, no account, no analytics SDK, no third-party tracker in v1. This
is stated on the second onboarding screen, before any data is collected.

**Why.** The content is among the most private material a person holds — many users have
never said it aloud to anyone. The only way to make a privacy promise that cannot be
broken by a future policy change is to have no server to change the policy about.

**Where it lives.** `lib/storage.ts` contains no network call and must not gain one.

---

## 7. No AI chat companion in v1

**Why.** A conversational agent in this domain will be asked "do I look okay?" within
minutes, and an unreliable refusal is worse than no feature. Reassurance is a compulsion:
answering it produces minutes of relief followed by a stronger urge, and it transfers
authority over the user's body to an outside judge. If this is ever built, the refusal
behaviour needs to be the specification, not a guardrail bolted on afterwards.

---

## 8. No diagnostic or treatment claims

**The rule.** "Many people find," never "treats" or "cures." The phrase *body dysmorphic
disorder* may appear in educational content — it does, in Module 12 — but never as a
claim about what this app does.

**Why.** It is false, and it is a regulatory problem.

**Enforced by.** `__tests__/modules.test.mjs` and `__tests__/copy.test.mjs` both assert
the absence of treatment claims across all shipped prose.

---

## 9. Exposure is graded and cannot be skipped

**The rule.** Mirror practice is locked until week 4. Durations increase by phase and the
hierarchy is enforced by the app, not by the user's judgement.

**Why.** Exposure before someone has seen their own baseline is exposure without a
rationale, and that is the version people abandon. Starting at the hardest step produces
a bad first experience and a dropout.

**Where it lives.** `lib/protocol.ts` — `mirrorSpecForWeek()` returns `null` before week
4, and `__tests__/protocol.test.mjs` asserts durations never decrease with phase.

---

## 10. Weeks unlock by completion, never by date

**The rule.** A week opens when the previous week's four practice days are done —
whether that took seven days or forty.

**Why.** A date-gated programme punishes exactly the weeks when someone is struggling
most. `isWeekUnlocked()` takes no date parameter at all, so this is structural rather
than a policy that could drift. A test asserts four practice days spread across two
months completes a week identically to four consecutive days.

---

## 11. Predictions are frozen before outcomes

**The rule.** In a behavioural experiment, the prediction and its likelihood are captured
before the event and are never editable afterwards.

**Why.** Memory quietly rewrites predictions to match outcomes once the outcome is known.
An editable prediction destroys the only thing the exercise produces — a written record
of a belief that failed to come true.

**Where it lives.** `store/useStore.ts` — `completeExperiment()` writes only the
after-event fields. `__tests__/copy.test.mjs` asserts the prediction fields are not
marked `afterEvent`.

---

## 11b. Export is free, lossless, and never sold

Onboarding tells the user, on screen two and before they have written anything: *"there is
no backup. If you delete the app it is gone. You can export a plain-text copy whenever you
like."* Both halves of that have to stay true.

Export therefore sits **above** the entitlement gate on Progress, and the tier comparison
lists it as free on both sides. It also has to contain what they actually wrote — an export
that reduced a year of thought records to `Thought records completed: 41` was a progress
summary wearing a backup's job title. Predictions and outcomes are included too; §11 freezes
them precisely so they can be looked back on, and dropping them from the export defeats
that.

`exportJson` / `importJson` are the real backup path. A user-initiated file the user keeps
is not a server, an account, or a tracker, so this stays inside §6.

**Where it lives.** `lib/storage.ts`, `app/(tabs)/progress.tsx` (export rendered before the
`!entitled` return), `lib/entitlement.ts` `TIER_COMPARISON`, `__tests__/storage.test.mjs`.

---

## 12. The money never touches the safety surfaces

Grounding, crisis support and the urge timer carry no upsell in any state — not a badge, not
a "you're missing out", not a prompt after a completed exercise. These are the screens
somebody opens at their worst. A commercial message arriving at that moment is the fastest
way there is to destroy a health brand, and it is also simply a rotten thing to do.

The upgrade prompt on Today is gated on **progress signals only**: week completed, three
check-ins recorded. It never reads a distress rating, an avoidance answer, a missed week or a
hard-day tap. Using somebody's suffering to time an offer is the line between personalisation
and exploitation, and people feel it even when they cannot name it.

**Where it lives.** `__tests__/safety.test.mjs` greps `app/grounding.tsx`, `app/support.tsx`
and `app/urges.tsx` for any paywall reference, and reads the `askReady` gate in
`app/(tabs)/index.tsx` for distress terms. `lib/entitlement.ts` hard-codes
`ALWAYS_FREE_ROUTES`.

---

## 12b. Entitlement fails toward the user

Access is a projection over a timestamped cache (`isEntitled` in `lib/entitlement.ts`), not
a stored boolean. It used to be a boolean, and nothing in the app ever set it to false — a
refund, an expiry, a cancellation and a failed renewal all left a permanent grant behind.

When the store cannot be reached, the honest answer is "unknown", and this app resolves that
by **granting**. Revoking on doubt means somebody mid-protocol, offline on a bad day, opens
the app and finds their twelve weeks locked. Granting on doubt means a small number of people
get some free access by staying offline. One costs a few dollars; the other costs the person
this was built for, at the moment they needed it. The grace windows are generous on purpose:
16 days after a verified period ends (roughly how long Apple retries a declined card), 30
when we have never been able to ask at all.

A known cancellation is not doubt, and is honoured at the end of the paid period.

None of this reaches the safety surfaces. `ALWAYS_FREE_ROUTES` never consults entitlement, so
a fully lapsed user keeps grounding, crisis support, the hard-day path and the daily check-in
forever — see §4.

**Where it lives.** `lib/entitlement.ts`, `hooks/useEntitlement.ts` (the only writer),
`__tests__/entitlement.test.mjs`.

---

## 13. Every number shown to a customer is one we could defend to their face

No fabricated ratings, no invented review or user counts, no "most popular" badge on an app
with no users. Cairn has no analytics and therefore no social proof, and it will not invent
any. What it shows instead is **evidence about the method**, and `PROOF_QUALIFIER` — *"Cairn
is not therapy and has not itself been trialled"* — travels with it wherever it renders.

The same rule governs the cost mirror in onboarding. It states arithmetic on figures the
customer typed thirty seconds earlier, in the present tense: no promised gain, no comparison
to other people, no editorialising. Below about fifteen minutes a day it declines to show a
cost figure at all, because telling somebody *"this is what it is costing you"* when they
barely have the problem is manufacturing one to sell against.

No countdown, no expiring discount, no scarcity language, anywhere. Beyond the objection to
running urgency at an anxious person there is a plain commercial one: in this category the
discounted cohort churns worse than the full-price cohort.

**Where it lives.** `content/proof.ts`, `lib/cost.ts`, and the monetisation block in
`__tests__/safety.test.mjs`. The strategy behind all of it, with its sources, is in
`.claude/skills/value-first-growth/`.

---

## Running the checks

```bash
npm test          # 237 assertions across engine, protocol, streak, storage, timezones, content, copy and money
npm run typecheck # tsc --noEmit
```

The tone and content rules are tests rather than review notes on purpose. Review catches
what a reviewer happens to notice; a test catches it every time, including at 2am on a
Friday when someone is shipping a copy tweak.
