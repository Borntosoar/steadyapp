# Terms of Use — Steady

**Last updated:** 11 August 2026
**Publisher:** `[LEGAL ENTITY NAME — TODO]` ("we", "us", "our")
**Contact:** steadyrecovery3@gmail.com

<!-- DRAFT. Not reviewed by a lawyer. See legal/README.md before publishing. -->
<!-- Verified against the repository at commit f5db0ae, app.json version 2.0.0. -->

---

## Read this first

**Steady is a self-help tool. It is not therapy, not medical advice, not a diagnosis, and not a medical device.** It does not treat or cure anything. If appearance worry is taking hours out of most of your days, that is worth a proper assessment by a professional.

The full version of that is in `medical-disclaimer.md`, and it forms part of these terms. Please read it.

If you are in danger right now, call your local emergency number.

---

## A note on which terms apply

> **Internal note — decide before submission, then delete this box.**
>
> **Apple's standard EULA is acceptable.** Apple's App Store Terms of Service state that if a developer does not supply its own end-user licence agreement, the *Licensed Application End User Licence Agreement* applies by default. It is published at
> `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`
> and is referenced in Schedule 1 of the Apple Developer Program Licence Agreement. `docs/APP-STORE.md` §5.4 and §6 already assume that link is what goes in the paywall and in the App Store Connect EULA field.
>
> **Recommendation: link Apple's standard EULA in App Store Connect and on the paywall, and publish this document alongside it as your Terms of Use.**
>
> Reasons. Apple's EULA is short, familiar to reviewers, pre-accepted by every iPhone owner, and cannot be argued with — using it removes a whole category of review friction for zero effort. But it says nothing about the things that are actually specific to Steady: the hardship tier, what the free forever tier is, what the app is not (a treatment), and how the crisis lines work. Those are the terms most likely to matter to a real customer and to a regulator, and Apple's document does not cover them.
>
> Using a custom EULA instead of Apple's is also permitted — Apple requires only that a custom one meets or exceeds Apple's minimum terms and includes the "Apple as third-party beneficiary" clause, which section 14 below carries. If you do go custom-only, the custom EULA has to be linked in App Store Connect and in the app.
>
> The one thing you must not do is publish this document with the placeholders still in it.

---

## 1. What this agreement is

These terms are a contract between you and `[LEGAL ENTITY NAME — TODO]` about your use of the Steady iOS app.

By installing or using Steady, you agree to them. If you do not agree, do not use the app — and delete it, which also removes everything it stored.

You must be **16 or older** to use Steady. The app is rated 16+ on the App Store.

<!-- SOURCE: docs/APP-STORE.md §5.6 sets the intended rating at 16+ based on an honest
     "Frequent" answer to the Medical or Treatment Information descriptor. There is no age
     gate inside the app (app/onboarding/index.tsx), so this is a contractual requirement
     rather than something the software enforces. -->

---

## 2. Your licence to use Steady

We give you a personal, limited, non-exclusive, non-transferable, revocable licence to use one copy of Steady on Apple devices that you own or control, as permitted by Apple's App Store Terms of Service and the Usage Rules in them.

That is a licence, not a sale. You do not own the app. We keep everything we have not explicitly given you here.

You may not:

- copy, sell, rent, lease, sub-licence, or redistribute the app;
- take it apart, decompile it, or reverse-engineer it, except to the exact extent the law says you may despite this sentence;
- remove or hide any notice of ownership;
- use it to build a competing product;
- get around, disable, or interfere with the parts that decide what is free and what is paid;
- use automated tools to interact with it, or try to break it on purpose.

---

## 3. What you write stays yours

Everything you type into Steady — your check-ins, thought records, experiments, your relapse plan, all of it — belongs to you. We claim no rights over any of it.

We could not do anything with it even if we wanted to. It stays on your device and we never receive it. See `privacy-policy.md`.

Because there is no server, **there is no backup**. If you delete the app, or lose the phone, it is gone. Steady gives you a free export and a free full backup file on every tier for exactly this reason, including the free tier, and we strongly suggest you use them. **Keeping a copy is your responsibility. We cannot recover anything for you, because we never had it.**

<!-- SOURCE: app/onboarding/index.tsx step 2 makes this promise before any data is entered;
     lib/entitlement.ts TIER_COMPARISON lists export as "Forever" on both tiers;
     app/(tabs)/progress.tsx renders the export block above the entitlement gate;
     SAFETY.md §11b. -->

---

## 4. What is free, and what stays free

Some parts of Steady are free permanently, with no card, no account and no end date:

- The daily check-in and your reclaimed-hours number
- Every calming exercise, and the hard-day path
- **All crisis support**, and the guidance on finding a therapist
- Week 1 of the twelve-week programme, and 3 of the 12 short reads
- Up to 5 thought records a month
- Export and the full backup file

<!-- SOURCE: lib/entitlement.ts — ALWAYS_FREE_ROUTES (hard-coded so it cannot be gated by
     accident), FREE_LIMITS { thoughtRecordsPerMonth: 5, learnModules: 3, maxWeek: 1 } and
     TIER_COMPARISON. SAFETY.md §4: "Safety is never paywalled." -->

**Crisis support and the calming exercises will never be put behind payment.** Not in a promotion, not in a future version, not if your subscription lapses, not if you never pay us anything. A billing state will not sit between you and a crisis line. That is a commitment, and it is enforced in the code by a list that cannot be changed by accident.

---

## 5. Steady+ — what you are buying

Steady+ unlocks weeks 2 to 12, all twelve short reads, unlimited thought records, guided mirror practice, behavioural experiments, and the full progress history.

Three ways to buy it:

| Product | Price | What happens |
|---|---|---|
| **Steady+ Yearly** | $79.99 a year | Renews every year until you cancel |
| **Steady+ Monthly** | $12.99 a month | Renews every month until you cancel |
| **Steady+ One-Time** | $149 once | Not a subscription. Nothing renews, nothing to cancel |

Prices are in US dollars and are the prices in the US App Store. In other countries Apple sets the local price, and it will not be a straight currency conversion. The price you are charged is the one shown in the App Store purchase sheet at the moment you confirm — that one is authoritative, not this table.

<!-- SOURCE: lib/entitlement.ts PRICING { monthly: '$12.99/mo', yearly: '$79.99/yr',
     lifetime: '$149 once', trialDays: 30 } and RENEWAL_TERMS, which spells out the renewal
     sentence per product. The internal Plan key is 'lifetime' but the word "lifetime" appears
     in no customer-facing string — Apple has repeatedly rejected it — and the label shown is
     "Pay once". SAFETY.md and __tests__/safety.test.mjs enforce that. -->

### Free trial

Subscriptions (yearly and monthly) come with a **30-day free trial**. The one-time purchase has no trial, because there is nothing to renew.

- You will not be charged during the trial.
- If you do nothing, the subscription starts automatically when the trial ends, at the price above.
- Cancel at any time before the last day of the trial and you pay nothing.
- If you buy a subscription while a trial is still running, the unused part of the trial is forfeited. That is Apple's rule and it applies to everyone.
- One trial per Apple Account, per product family. Apple decides eligibility, not us.

> ⚠ **Fix before publishing.** The trial length in `lib/entitlement.ts` is **30 days**, and the pre-submission checklist in `docs/APP-STORE.md` says 30 days — but the draft App Store description in the same document still says "14-day free trial" in two places. **The App Store Connect product configuration, the store description, the paywall, and this document must all say the same number.** A trial length that differs between the listing and the app is a metadata-accuracy problem under Apple guideline 2.3 and a consumer-protection problem in several countries.

<!-- SOURCE OF THE CONFLICT: lib/entitlement.ts PRICING.trialDays = 30, with a comment
     explaining that App Store Connect only sells fixed durations and 30 days ("1 month") is
     the one that lands in the right band. docs/APP-STORE.md §3 description text says
     "14-day free trial" for both subscription products; §5.4 checklist says 30. The code and
     the checklist agree; the description is stale. -->

### How billing works

**Apple handles all payment.** We never see or hold your card details.

- Payment is charged to your Apple Account when you confirm the purchase.
- A subscription renews automatically unless you turn off auto-renew **at least 24 hours before** the current period ends.
- Your account is charged for the renewal within 24 hours before the period ends.
- **Manage or cancel in your Apple Account settings** (Settings → your name → Subscriptions). You cannot cancel from inside Steady, and neither can we cancel for you — Apple does not give developers that ability.

### Refunds

Refunds are handled by Apple, under Apple's terms, not ours. Request one at `reportaproblem.apple.com`. We cannot issue, approve, or refuse a refund on Apple's behalf.

Consumer law in your country may give you rights on top of that — for example, in the UK and EU there are statutory rights around digital content that cannot be signed away by these terms. Nothing here removes them.

### If your subscription lapses

You keep everything in the free tier forever, including all of your own writing, your history, the export, and all crisis support. Steady never deletes or holds hostage anything you wrote.

If we cannot check your subscription status — you are offline, on a plane, somewhere with no signal — Steady keeps your access on rather than switching it off. We would rather occasionally give away access we should not have than lock someone out of a twelve-week programme on a bad day because a receipt check timed out.

<!-- SOURCE: lib/entitlement.ts isEntitled() and the "THE DIRECTION THIS FAILS IN" comment;
     BILLING_GRACE_DAYS = 16 (matched to Apple's declined-card retry window),
     OFFLINE_GRACE_DAYS = 30. A known cancellation is honoured at the end of the paid period
     (willRenew === false). SAFETY.md §12b. -->

---

## 6. The hardship tier

If the price is out of reach, there is a link on the purchase screen that gives you **three months of Steady+, immediately, free**.

There is no form. No proof. No questions. No eligibility check. Nobody reviews it and nobody is told. You tap it and it works, including with no internet connection.

<!-- SOURCE: content/copy.ts PAYWALL_COPY.hardship — link "Cannot afford this right now?",
     confirm "Give me three months", body "No form, no questions, nothing to explain."
     hooks/useEntitlement.ts grantHardship(months = 3) is a local grant by design so it works
     offline. SAFETY.md §4 requires a visible hardship link with no eligibility language and a
     test asserts the copy contains none. -->

Terms of the hardship grant:

- It gives you the same access as a paid Steady+ subscription, for three months.
- It costs nothing and creates no debt. If it helps and you can pay later, you can. If you never pay, that is fine, and nothing about the app will nag you about it.
- It is for people who cannot afford the price. We are not going to check, and we would rather it be used by someone who could have paid than missed by someone who could not.
- We may limit or withdraw it if it is being abused at a scale that threatens the app's existence, but we will not do so quietly — and we will never take a grant back from someone who already has one.

<!-- INTERNAL NOTE: the technical grant is three calendar months, after which isEntitled()
     may extend access by a further 30 days of offline grace because verifiedAt is null for a
     local grant (lib/entitlement.ts). That means some people get ~4 months. Granting more
     than promised is not a legal problem, so the terms say three months. Do not "fix" this
     by shortening the grant. -->

---

## 7. How you may use Steady

Use it for yourself, for your own wellbeing. That is the whole intended use.

Do not:

- use Steady to diagnose, treat, or manage anyone else's condition;
- present anything Steady produces as a clinical assessment (the export file says on its face that it is self-tracked information from a self-help app, and not a clinical assessment — do not remove that line if you pass the file on);
- use it in a way that breaks the law where you are.

<!-- SOURCE: lib/storage.ts exportText() writes "This is self-tracked information from a
     self-help app. / It is not a clinical assessment and not a diagnosis." into the header of
     every exported summary. -->

You are welcome to show your export to a clinician. That is what it is for.

---

## 8. Our intellectual property

The app, its name, its design, its written content, the twelve modules, the exercises, the artwork and the code all belong to us or to our licensors, and are protected by copyright and other laws.

You get the licence in section 2 and nothing else. In particular, you may not copy the module content or the exercises into another product.

The clinical methods Steady is built on — cognitive behavioural therapy, exposure and response prevention, attention training — are not ours and we claim no ownership of them. They are a published body of work by many researchers, some of whom are cited inside the app. What is ours is this particular implementation of them.

<!-- SOURCE: content/proof.ts credits Harrison et al., Wilhelm et al., Veale & Riley,
     and population-prevalence surveys by name, and the rule in that file is that "every claim
     is about the published literature. None is about Steady." -->

---

## 9. Availability, changes, and the app going away

We try to keep Steady working, and we do not promise it always will.

- We can change, add to, or remove features. If we remove something you paid for, see below.
- We can stop selling Steady, or stop supporting it, or shut it down entirely. This is a small operation and we would rather say that plainly than pretend otherwise.
- An operating system update, a device change, or an App Store policy change can break the app in ways we did not choose and cannot always fix.

**If Steady is discontinued:** the copy on your phone keeps working for as long as your device and iOS let it, because it needs no server. Your data stays yours and the export keeps working. We will give as much notice as we reasonably can, and we would stop selling subscriptions before we stopped supporting the app.

**This is the honest reason the one-time product is called "Pay once" and not "lifetime".** Nobody can promise software for the length of your life, and we are not going to pretend to.

<!-- SOURCE: lib/entitlement.ts — the block explaining why "lifetime" appears in no
     user-facing string: "this is a solo project with a twelve-week protocol, not an
     institution." -->

---

## 10. Disclaimer of warranties

Steady is provided **"as is" and "as available"**, with no warranty of any kind, to the fullest extent the law allows.

We specifically do not promise that:

- the app will produce any particular result, improvement, or outcome for you;
- it will work without interruption or errors;
- any error will be fixed;
- it is suitable for you, your situation, or any particular purpose;
- the crisis lines listed in the app will be reachable, correct at the moment you need them, or able to help you (see section 12).

We disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement, again to the extent the law allows.

**If you are a consumer, you may have rights that cannot be excluded** — under the UK Consumer Rights Act 2015, EU consumer law, the Australian Consumer Law, or your own state's law. Nothing here takes those away. Where such a right exists, it applies despite anything in this section.

---

## 11. Limitation of liability

To the fullest extent the law allows:

We are not liable for indirect, incidental, special, consequential, or punitive damages; for lost profits, lost data, or lost opportunity; or for anything arising from your use of, or inability to use, Steady.

**Our total liability to you, for everything, is limited to the greater of (a) what you actually paid us for Steady in the 12 months before the claim, or (b) $50 USD.** If you have never paid us anything, that limit is $50.

**What we do not, and cannot, exclude:**

- death or personal injury caused by our negligence;
- fraud or fraudulent misrepresentation;
- anything else the law does not permit us to exclude.

`[REVIEW WITH COUNSEL — TODO]` — the enforceability of a liability cap in a mental-health context is exactly the kind of thing to pay for an opinion on, and the answer differs by jurisdiction.

---

## 12. Crisis lines and third-party services

Steady lists crisis helplines and directories run by other organisations. **We do not run any of them.** We are not connected to them and they have not endorsed Steady.

We list them because they help people, and we check them, but:

- We cannot promise a number is correct at the moment you dial it. Numbers change and services close.
- We cannot promise anyone will answer, or answer quickly, or be able to help.
- What happens on that call is between you and them.
- Tapping a number simply hands it to your phone's dialler. We do not place, route, monitor, record, or learn about the call.

**If a number in the app is wrong, please tell us at steadyrecovery3@gmail.com.** A wrong number is the worst thing this app could ship and we will fix it immediately.

**In an emergency, call your local emergency number** — 911 in Canada and the US, 999 in the UK, 000 in Australia — rather than relying on anything in this app.

<!-- SOURCE: constants/support.ts, whose header says "Verify these periodically — a wrong
     number here is the worst bug this app could ship." app/support.tsx:25 dials via
     Linking.openURL('tel:…') and nothing else. -->

---

## 13. Ending this agreement

**You** can end it at any time by deleting the app. That also deletes everything Steady stored, permanently.

Cancelling a subscription is separate — do that in your Apple Account settings. Deleting the app does not cancel a subscription, and you will keep being billed if you do not cancel.

**We** can end it if you seriously break these terms, in which case your licence stops and you must stop using the app. We cannot reach into your phone to delete anything, and we would not want to be able to.

When this agreement ends, sections 3, 8, 10, 11, 12, 14 and 15 survive.

---

## 14. Apple

You and we agree that:

- These terms are between **you and us**, not between you and Apple. Apple is not responsible for Steady or its contents.
- Apple has no obligation to provide any support or maintenance for Steady.
- If Steady fails to conform to any applicable warranty, you may notify Apple and Apple will refund the purchase price. Beyond that refund, Apple has no other warranty obligation whatsoever with respect to Steady.
- Apple is not responsible for any claim about Steady, including product liability claims, claims that Steady fails to conform to a legal or regulatory requirement, and claims under consumer protection or similar law.
- Apple is not responsible for investigating, defending, settling, or discharging any third-party claim that Steady infringes intellectual property rights.
- You confirm you are not in a country subject to a US Government embargo or designated as "terrorist supporting", and are not on any US Government list of prohibited or restricted parties.
- **Apple and its subsidiaries are third-party beneficiaries of these terms**, and on your acceptance Apple has the right to enforce them against you.

<!-- This section reproduces the minimum terms Apple requires in a custom EULA (Apple
     Developer Program Licence Agreement, Schedule 1). Do not delete it if you use this
     document as your EULA. -->

---

## 15. Governing law and disputes

> 🔴 **YOU MUST CHOOSE THIS. DO NOT PUBLISH WITHOUT IT.**
>
> These terms are governed by the laws of `[GOVERNING LAW JURISDICTION — TODO]`, and the courts of `[COURTS — TODO]` have `[exclusive / non-exclusive — TODO]` jurisdiction.
>
> **We have deliberately not guessed.** The right answer depends on where your legal entity is registered, where you are tax-resident, and where your customers are — and getting it wrong is worse than leaving it blank, because a governing-law clause pointing at a jurisdiction you have no connection to can be struck out and take other clauses with it. The bundle identifier `com.borntosoar.steady` and the App Store organisation requirement in `docs/APP-STORE.md` §5.1 mean an entity exists or is being formed; use that entity's home jurisdiction unless your solicitor says otherwise.
>
> Two things to raise with them at the same time:
> 1. **Consumer protection is mandatory and cannot be contracted around.** Wherever you choose, a customer in the UK, the EU, Canada or Australia keeps the consumer rights of their own country. Say so explicitly in the published clause.
> 2. Decide whether you want an arbitration clause and a class-action waiver. They are common in US-facing apps, largely unenforceable against consumers in the UK and EU, and they read badly in a mental-health product. Our suggestion is to skip both, but it is a real decision.

---

## 16. The rest

- **Whole agreement.** These terms, plus `privacy-policy.md` and `medical-disclaimer.md`, are the whole agreement between us about Steady.
- **Severability.** If a court decides part of this is unenforceable, the rest still stands.
- **No waiver.** If we do not enforce something straight away, we have not given up the right to enforce it later.
- **Assignment.** You may not transfer your rights under these terms. We may transfer ours if the app changes hands, and we will say so in the app if that happens.
- **Changes.** We may update these terms. If a change is significant we will say so in the app. Carrying on using Steady after a change means you accept it. If you do not accept it, delete the app.

---

## Contact

steadyrecovery3@gmail.com
`[LEGAL ENTITY NAME — TODO]`, `[REGISTERED ADDRESS — TODO]`

---

<!--
================================================================================
INTERNAL NOTES — will not render
================================================================================

DECISIONS THE OWNER MUST MAKE BEFORE THIS IS PUBLISHED
1. Governing law + courts (§15). Blocking.
2. Legal entity name + registered address. Blocking, and separately blocking for the
   App Store — docs/APP-STORE.md §5.1 requires an Organization developer account for
   health apps under guideline 5.1.1(ix).
3. Contact email. Blocking.
4. Effective date.
5. Apple standard EULA vs this custom one (see the note under the title). Recommendation
   is: link Apple's in App Store Connect and on the paywall, publish this alongside.
6. Arbitration / class-action waiver: in or out. Recommendation: out.
7. Liability cap figure — $50 is a placeholder chosen to be defensible for a $12.99/mo app.
   Confirm with counsel.

SENTENCES THAT BECOME FALSE IF THE PRODUCT CHANGES
- §3 "we never receive it" / "we cannot recover anything for you" — breaks on any backend
  or cloud backup. If cloud backup is ever added, this clause and the entire privacy
  policy change together.
- §4 "crisis support will never be put behind payment" — this is a promise, not a
  description, and it is enforced by ALWAYS_FREE_ROUTES in lib/entitlement.ts plus
  __tests__/safety.test.mjs. Keep the test. Breaking this after publishing it would be
  a straightforward misrepresentation.
- §5 pricing table — every figure comes from lib/entitlement.ts PRICING. If a price
  changes, this table, RENEWAL_TERMS, the paywall, and the App Store description all
  change together.
- §5 "30-day free trial" — see the conflict flag. Resolve before publishing.
- §5 "You cannot cancel from inside Steady" — breaks if a manage-subscription deep link
  is added (which would be a good idea; it does not change who does the cancelling).
- §6 hardship "three months" — comes from grantHardship(months = 3).
- §12 "we do not learn about the call" — breaks on any analytics.

OPEN PRODUCT ITEM THAT AFFECTS THESE TERMS
docs/APP-STORE.md §5.4 requires a functional Terms of Use link inside the purchase flow.
It does not exist yet — the only Linking.openURL calls in the codebase are tel: links.
Whatever URL this document ends up at must be wired into app/paywall.tsx before submission,
alongside the privacy policy link.
-->
