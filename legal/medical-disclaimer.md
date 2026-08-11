# Medical Disclaimer — Steady

**Last updated:** 11 August 2026
**Publisher:** `[LEGAL ENTITY NAME — TODO]`
**Contact:** steadyrecovery3@gmail.com

<!-- DRAFT. Not reviewed by a lawyer. See legal/README.md before publishing. -->
<!-- This is the most important document in this folder. Every sentence has been checked
     against the app's own vocabulary rules: SAFETY.md §8 bans treatment claims in shipped
     prose, __tests__/copy.test.mjs and __tests__/modules.test.mjs enforce it with a regex,
     and docs/APP-STORE.md §5.5 extends the ban to store metadata. Nothing in this document
     may reintroduce the words this app has deliberately kept out. -->

---

## If you are in danger right now

**Call your local emergency number.** 911 in Canada and the United States. 999 in the United Kingdom. 000 in Australia.

Do not work through an app. Do not wait to finish a session. Go and get a person.

The Support screen in Steady is one tap from every screen, it lists crisis lines, and it is free forever on every tier — including if you have never paid us anything and never will.

---

## The short version

Steady is a **self-help tool**. It is educational.

It is **not** therapy.
It is **not** a diagnosis.
It is **not** medical advice.
It is **not** a medical device.
It is **not** a replacement for seeing a professional.

It does not diagnose any condition. It cannot tell you whether you have body dysmorphic disorder, or anything else. It makes no promise about your outcome.

If appearance worry is taking hours out of most of your days, or you are avoiding work, school, or people because of how you think you look, that is worth a proper assessment by someone qualified to give one. An app is not that.

<!-- SOURCE: this mirrors the disclaimer gate the app itself shows at onboarding step 7
     (app/onboarding/index.tsx), which reads: "Steady is a self-help tool. It is not therapy,
     not a medical device, and not a substitute for professional care. It does not diagnose or
     treat any condition." Keeping the two documents in the same words is deliberate. -->

---

## 1. What Steady actually is

Steady is a twelve-week structured self-help programme for appearance worry. It gives you:

- a short daily check-in — how long you spent thinking about how you look, how strong the urge to check was, whether you avoided something, how hard the day was;
- twelve short readings about what appearance worry does and why;
- written exercises: thought records, behavioural experiments, urge logging, a relapse plan;
- timed, graded mirror practice from week 4 onward;
- grounding and breathing exercises;
- crisis lines and guidance on finding a professional.

The one number the whole app is built around is **hours reclaimed** — an estimate of time you got back, calculated from figures you typed in yourself.

That number is **not a health measurement**. It is arithmetic on your own rough self-report. It does not measure a condition, a severity, a symptom level, or your progress in any clinical sense. It is a count of your own reported time, nothing more, and it should never be read as anything more.

<!-- SOURCE: lib/reclaimed.ts measures time, not appearance (SAFETY.md §2). docs/APP-STORE.md
     §5.5 states the same limit in the same terms and explains why it matters under Apple
     guideline 1.4.1 — the accuracy clause there is aimed at sensor-derived claims, and this
     figure is not one. -->

---

## 2. What Steady is not, in detail

### Not therapy

Therapy is a relationship with a trained person who can see you, ask you questions you did not expect, notice what you are not saying, adjust as they go, and be accountable to a professional body.

Steady is a piece of software following a fixed structure. It cannot see you. It does not know your history. It cannot tell when something is going wrong. It has no judgement and no clinical responsibility, and it is not supervised by anyone.

If you have a therapist, Steady is not a substitute for them and it is not a reason to stop going. Show them your export if it is useful. If it clashes with what they have asked you to do, do what they have asked you to do.

### Not a diagnosis

Nothing in Steady diagnoses anything.

The four questions in the daily check-in are not a diagnostic test. They are not the BDD-YBOCS, the BDDQ, or any other validated instrument, and they should not be read as one or scored like one. They exist so you can watch your own numbers move over time.

Body dysmorphic disorder is named in the educational content, because being able to name a thing is useful and most people carrying it have never heard the name. Naming it is not the same as telling you that you have it. Only a qualified clinician can assess that.

<!-- SOURCE: SAFETY.md §8 — "The phrase body dysmorphic disorder may appear in educational
     content — it does, in Module 12 — but never as a claim about what this app does." -->

### Not medical advice

Nothing in Steady is advice about your health, your medication, or your care.

Steady names medication as a conversation to have with a doctor. It gives no dosing information, no recommendation to start or stop anything, and no opinion on any specific drug. **Do not start, stop, or change any medication because of anything in this app.** Talk to the person who prescribed it.

<!-- SOURCE: docs/APP-STORE.md §5.9 confirms guideline 1.4.2 (drug dosage calculators) does
     not apply: "Module 12 mentions medication as a topic for a doctor and gives no dosing
     information; keep it that way." -->

### Not a medical device

Steady is not registered, cleared, approved, or certified as a medical device by any regulator. Not by the FDA in the United States, not by the MHRA in the United Kingdom, not under the EU Medical Device Regulation, not by Health Canada, not by the TGA in Australia.

It is not intended to diagnose, prevent, monitor, predict, or manage any disease or condition, and it should not be used as if it were. It is a general wellbeing and educational product.

It carries no CE mark, no UKCA mark, and no equivalent. We claim no certification, no clinical audit, and no regulatory approval of any kind, because we have none.

---

## 3. Steady itself has never been trialled

This is the sentence that matters most in the whole document, so it gets its own section.

**Steady has not been tested in a clinical trial. There is no study of Steady. There are no published results about Steady. Nobody has measured whether Steady helps anyone.**

What Steady *does* have is a method built out of approaches that have been studied — cognitive behavioural therapy, exposure and response prevention, and attention training for appearance concerns. There is a real research literature behind those approaches, and the app cites it by name where it shows a figure.

Those two things are not the same thing, and we will not let them blur:

- A figure like "d = 1.22" describes what happened in published trials of **therapy delivered by clinicians**. It is not a claim about what will happen to you in this app.
- "Around half of people who respond do so by about week twelve" describes what happened in **treatment trials**. It is not a schedule for your recovery.
- "Roughly two people in a hundred" is a **population estimate**. It says nothing about you.

Wherever those figures appear inside the app, this sentence is attached to them and cannot be separated from them:

> *"Steady is not therapy and has not itself been trialled. These are findings about the methods the exercises are built from."*

<!-- SOURCE: content/proof.ts — PROOF_QUALIFIER, and the file rule: "every claim below is
     about the published literature. None is about Steady." __tests__/safety.test.mjs asserts
     the qualifier is present on any screen that renders PROOF_POINTS, and docs/APP-STORE.md
     §5.5 requires it stay visually adjacent to the figures rather than below the fold.
     The four cited sources are Harrison et al. (meta-analysis, 7 RCTs, N = 299),
     Wilhelm et al., Veale & Riley, and prevalence surveys (Rief 1.7%, Buhlmann 1.8%,
     Koran 2.4%). -->

**We make no promise about your outcome.** Not that you will feel better, not that your numbers will fall, not by week 12 or ever. Structured practice like this helps a lot of people. It does not help everyone, and some people need more than an app. Both of those are true and neither cancels the other.

---

## 4. When an app is not enough

Please talk to a professional — a doctor, a therapist, a nurse, a school or university counsellor — if any of these is true:

- Appearance worry takes hours out of most days.
- You are avoiding work, school, or people because of how you think you look.
- You are having thoughts of hurting yourself. **This means today, not eventually.**
- You are seriously considering cosmetic procedures to fix a problem other people say they cannot see.
- You are using alcohol or drugs to cope with how you feel about how you look.
- You have stopped eating properly, or eating has become the way this shows up. Steady is **not** built for eating disorders and contains nothing about food, weight, or body size. If that is what is happening, an eating disorder service is the right place, and it is a different service from this app.
- Things are getting worse, or they are staying the same after a real effort.
- Someone who loves you has told you they are worried.

Using Steady is not a reason to delay any of that. If you are on a waiting list, Steady can be something to do while you wait. It is not the thing you were waiting for.

<!-- SOURCE: the thresholds match app/onboarding/index.tsx step 7 and constants/support.ts
     THERAPY_GUIDANCE, which points at CBT with exposure and response prevention, the IOCDF
     directory, NHS Talking Therapies self-referral in the UK, and sliding-scale options.
     docs/APP-STORE.md §5.5 records that Module 12 is entirely about when self-help is not
     enough. SAFETY.md §2 confirms the app contains no eating, weight or calorie content. -->

---

## 5. The crisis lines listed in Steady

Steady lists crisis helplines for Canada, the United States, the United Kingdom and Australia, plus international directories for everywhere else. Tapping a number hands it to your phone's dialler.

**Please read this part carefully. It is the part with real consequences.**

### We do not operate any of these services

Every number and service listed in Steady is run by an independent organisation. We are not affiliated with any of them, we do not fund them, we do not staff them, we do not train them, and they have not endorsed Steady.

We list them because they are the right thing to reach for, and because a person in distress should not have to go looking.

### What we cannot promise

- **That a number is correct at the moment you dial it.** We check these and we take it seriously — the app's own source file says a wrong number here would be the worst bug it could ship — but services change numbers, merge, and close.
- **That anyone will answer.** Crisis lines have queues. Some have waits.
- **That they will be able to help you**, or help in the way you needed.
- **That the service is available where you are.** Most of the listed lines are national and will not work from another country.
- **That the call will connect at all.** That depends on your phone, your signal, and your carrier.

### What happens on the call is not ours

Once the call connects, it is between you and that organisation. We do not place it, route it, monitor it, record it, or find out that it happened. Their privacy practices and their duty of care are theirs, not ours.

### In a genuine emergency, use your emergency number

A crisis line is not an emergency service. If someone's life is in immediate danger, call **911 / 999 / 000** or go to an emergency department. That is the right call and it is not an overreaction.

### If you find a wrong number, tell us

steadyrecovery3@gmail.com. We will fix it immediately. This is the one bug report we would drop everything for.

<!-- SOURCE: constants/support.ts holds every listed line, with the header comment "Verify
     these periodically — a wrong number here is the worst bug this app could ship."
     app/support.tsx:25 and components/CrashScreen.tsx:98 are the only outbound links in the
     app and both are tel:. The app's own emergency block reads "Contact your local emergency
     number. That is the right call and it is not an overreaction." -->

> ⚠ **Operational commitment, not just a legal clause.** Somebody has to actually re-check `constants/support.ts` on a schedule. Put a recurring reminder somewhere real. A disclaimer does not make a wrong number acceptable, and it is unlikely to be much of a defence if one is left in there for a year.

---

## 6. What Steady deliberately will not do

These are not missing features. Each one is left out because including it would make things worse, and the reasoning is written into the codebase so a future version cannot quietly reverse it.

- **No photographs.** No capture, no camera roll, no gallery, no filter, no before-and-after. The camera is used only as a live mirror and every frame is discarded. A saved photo is a permanent object you can re-inspect on demand, and repeated close-range inspection is the behaviour this whole approach is built to reduce.
- **No rating or score about how you look.** No attractiveness score, no percentile, no ranking, no comparison with anyone else.
- **No weight, measurements, clothing size, calories, or food logging.**
- **No AI chat.** A conversational assistant in this area gets asked "do I look okay?" within minutes. Answering that question is the compulsion, not the cure — it gives a few minutes of relief and a stronger urge afterwards, and it hands authority over your own body to something outside you.
- **No streak shaming.** Missed days are neutral. Nothing in the app can represent falling behind as a failure.
- **No urgency, countdowns, or fake scarcity** anywhere, including on the purchase screen.
- **No selling of safety.** Grounding, breathing, the hard-day path, the daily check-in and all crisis support are free forever and carry no upsell in any state.

<!-- SOURCE: SAFETY.md §§1, 2, 3, 4, 5, 7 and 12, each with the enforcing test named. -->

---

## 7. Exposure practice, and doing it safely

From week 4 onward Steady includes timed mirror practice. This is a form of graded exposure — deliberately staying with something uncomfortable rather than avoiding it or checking compulsively.

Two honest things about it:

**It is meant to be uncomfortable, at first.** Distress usually rises before it falls. That is expected and it is a normal part of how this kind of practice works.

**Uncomfortable is not the same as harmful.** If a session leaves you feeling genuinely unsafe, or much worse for hours afterwards, or thinking about hurting yourself — **stop, and talk to a professional before doing another one.** You can end any session at any time and the app records it without comment.

Steady controls the pace on purpose: mirror practice is locked until week 4, durations increase by phase, and the order cannot be skipped ahead. That is deliberate — exposure before you have seen your own baseline is exposure without a reason, and that is the version people quit.

<!-- SOURCE: lib/protocol.ts mirrorSpecForWeek() returns null before week 4;
     __tests__/protocol.test.mjs asserts durations never decrease with phase; SAFETY.md §9. -->

**Do not use the mirror practice if a clinician has told you not to do exposure work, or has asked you to do it a different way.** Follow them, not the app.

---

## 8. Your export is not a clinical record

Steady lets you export a plain-text summary to hand to a doctor or therapist. That is a good use of it and it is free on every tier.

But the file is a record of what **you** typed. It is self-report, not assessment. It has not been reviewed by anyone. It is not a medical record, it is not evidence of a diagnosis, and it should not be used to support one on its own.

The exported file says so on its own front page, in the app's own words: *"This is self-tracked information from a self-help app. It is not a clinical assessment and not a diagnosis."* Please leave that line in if you pass the file on.

<!-- SOURCE: lib/storage.ts exportText() writes exactly those two lines into the header of
     every export. -->

---

## 9. If something goes wrong

If using Steady makes things worse, stop using it and speak to a professional.

If you believe Steady harmed you, please tell us at steadyrecovery3@gmail.com. We would genuinely rather know.

---

## 10. Legal effect

This disclaimer forms part of the Terms of Use (`terms-of-use.md`) and should be read with it, including the sections on warranties and on limitation of liability.

Nothing here removes any right you have under consumer law where you live, and nothing here limits liability for death or personal injury caused by our negligence, or for fraud. To the extent the law does not permit part of this document to apply, that part does not apply and the rest still does.

---

## Contact

steadyrecovery3@gmail.com
`[LEGAL ENTITY NAME — TODO]`

---

<!--
================================================================================
INTERNAL NOTES — will not render
================================================================================

VOCABULARY DISCIPLINE
This document deliberately does not use "treat", "cure", "heal", "fix", "clinically
proven", "therapeutic", "recovery programme", or "clinically validated" as descriptions
of Steady. Where "treatment" appears it refers to what happened in published TRIALS OF
THERAPY (§3), never to what Steady does — which is the same distinction content/proof.ts
draws and __tests__/copy.test.mjs enforces with:
  /\b(steady|this app) (treats|cures|heals|will fix)\b|\bclinically proven\b|
   \bguaranteed to (work|help|fix)\b/i
docs/APP-STORE.md §5.5 extends the ban to store metadata, which the copy test does NOT
cover. If this document is ever revised, re-read that section first.

WHY THE CRISIS-LINE SECTION IS AS LONG AS IT IS
It is the largest liability surface in the product and it is not hypothetical. The app
lists numbers it does not own, to a population with markedly elevated suicide risk
(SAFETY.md §4), on a screen reachable in one tap from everywhere. Three things reduce
exposure and all three are in §5: (a) a clear statement that we do not operate the
services, (b) no promise of availability, accuracy at time of use, or outcome, and
(c) a direction to emergency services for genuine emergencies rather than to a helpline.
What a disclaimer will NOT do is excuse a stale number. The operational commitment in
the callout is the part that actually matters.

QUESTIONS WORTH PAYING A LAWYER FOR — this document specifically
1. Does listing third-party crisis lines create any duty of care in your jurisdiction,
   and does this wording discharge it? Ask specifically about the UK and Canada.
2. Does the twelve-week structured programme, taken as a whole, risk being characterised
   as a "software as a medical device" under EU MDR / UK MDR 2002 / FDA general wellness
   guidance? Our reading is comfortably no — no diagnosis, no treatment claim, no
   condition-specific management claim, general wellness positioning, Health & Fitness
   category. Get it confirmed, because the answer would change the whole product.
3. Is the disclaimer gate at onboarding step 7 sufficient acceptance, or does the
   disclaimer need re-presenting at the paywall and before the first mirror session?
4. Does the exposure content (§7) need its own explicit contraindication list?
5. Any additional wording required for Australia, given the TGA's rules on therapeutic
   goods advertising, if the app is listed there.

FACT CHECK TRAIL
- "not registered / cleared / approved as a medical device": true by absence — there is
  no regulatory submission and no claim of one anywhere in the repo. app.json declares
  no medical entitlements. docs/APP-STORE.md §5.5 directs shipping under Health & Fitness
  rather than Medical, precisely to avoid inviting 1.4.1 scrutiny.
- "Steady has not been tested in a clinical trial": true by absence, and stated by the
  app itself in content/proof.ts PROOF_QUALIFIER.
- Crisis lines listed: Canada (988, Kids Help Phone, 911), US (988, Crisis Text Line 741741,
  911), UK (Samaritans 116 123, Shout 85258, NHS 111 option 2, 999), Australia (Lifeline
  13 11 14, Beyond Blue 1300 22 4636, Kids Helpline 1800 55 1800, 000), plus
  findahelpline.com and iasp.info. All from constants/support.ts.
-->
