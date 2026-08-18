# Applied to Anneal

The general model, resolved into this codebase. Read `SAFETY.md` in the repo root first —
where the two conflict, SAFETY.md wins, and it is not a close call.

---

## The asset

Anneal has something almost no app in this category has: **a true number about the
customer's own life, computed from their own data, that moves when the product works.**

Hours reclaimed is not a proxy, not a mood score, not a badge. It is minutes per day of
appearance preoccupation, self-reported at baseline and again at each check-in, multiplied
out over a week. It is falsifiable, it is theirs, and it is the entire commercial strategy.

Everything below is arranged around getting the customer to that number sooner and keeping
it in front of them.

## The two proof points

| | When | What the customer sees | What it earns |
|---|---|---|---|
| **First proof** | ~90 seconds into onboarding | The cost mirror: what appearance worry currently costs them per week and per year, computed live from the four baseline answers | The habit. Session two. |
| **Second proof** | Third check-in, typically day 3–5 | The real reclaimed-hours figure, against their own baseline | The subscription. |

The paywall belongs at the **second** point. Not onboarding, not install.

This deliberately gives up the highest-converting placement in the published data
(onboarding paywall with trial, ~1.78%). The trade is made knowingly: week one is free by
product design, and an ask placed before any evidence would be selling a promise, which is
the one thing this app refuses to do. What is recovered instead is a much higher-quality
ask — the customer arrives at the paywall having watched their own number move.

## The cost mirror

`lib/cost.ts`. Pure function, no React, unit-tested.

Takes the baseline answers and returns hours per week, days per year, and a sentence. All
arithmetic, no modelling, no projection of improvement.

**What it must never do:**

- Promise a gain. *"You could get 45 days back"* is a treatment claim and it is banned.
  The honest form is *"That is 45 days a year, as things stand."*
- Compare the customer to anybody. No percentiles, no "more than average". That is the
  ranking behaviour this app exists to interrupt.
- Editorialise. No *"that's a lot"*, no *"shocking"*. The multiplication is the argument;
  a person who has just typed "four hours a day" does not need it underlined.

The customer supplied every input. That is what makes it land, and it is also what makes it
defensible to a clinician reading over their shoulder.

## Free tier boundary, stated on day one

Onboarding screen one says exactly what is free forever and what is not. This is the
structural insight from hard-paywall performance — make the commercial shape unmissable
early — implemented without walling anyone out.

The free tier is deliberately generous and must stay that way:

- All of week one, including three learn modules
- The daily check-in and the hours number, forever
- Every grounding exercise, forever
- The hard-day path and all crisis support, forever, never with an upsell attached
- Five thought records a month

`lib/entitlement.ts` hard-codes `ALWAYS_FREE_ROUTES`. Adding a gate to any of them requires
editing a list with a comment telling you not to. Leave that in place.

## Upgrade surfaces, and where they are forbidden

Three places may mention Anneal+:

1. **Progress**, under the locked charts — the customer is looking at their own data
2. **Learn**, at the week 2 boundary — the customer is trying to read the next thing
3. **The week-one completion moment** — the second proof point, the primary ask

Forbidden, permanently:

- Grounding, in any state, including after a completed exercise
- The hard-day path
- Support
- The urge-surf timer, before or after
- Any screen reachable from the Support pill
- Anywhere triggered by a distress rating, a missed week, or a hard-day tap

`__tests__/safety.test.mjs` greps for this. Keep it passing.

## Trial

One month, spanning four protocol weeks — long enough that the customer watches the number
move several times and reaches the week-four plateau the protocol warns them about, which
is better evidence for renewing than anything the paywall can say. Published medians put
17–32 day trials at roughly 45% conversion against roughly 27% under a week, and the
mechanism is habit formation, not patience. Discount that figure: teams confident in the
product are also the teams that offer long trials, so some of the effect is the confidence.

**Pick from the durations the store sells.** App Store Connect offers introductory free
trials at 3 days, 1 week, 2 weeks, 1 month, 2 months, 3 months, 6 months and 1 year, and
nothing in between. A trial length outside that set cannot be configured as a product, so
the app promises a duration the store has no way to grant — and the customer finds out by
being charged early. This is why the answer is 30 days and not the 21 the benchmarks
suggest.

Requirements that ship with it:

- The end **date** is on screen, not a duration
- The charge amount, the **renewal cadence** and the cancellation route are in the same
  sentence as the date (Apple 3.1.2 requires the auto-renew terms at the point of purchase,
  not behind a link)
- A reminder before it ends, promised on the paywall and actually sent, saying how many days
  are actually left rather than a number baked into the copy

## Pricing

Annual pre-selected with the monthly equivalent alongside it, monthly second. Health &
Fitness takes 68% of revenue from annual and annual retains best.

**Lifetime is off the default view**, behind a link reading *"Rather pay once than
subscribe?"*. A twelve-week protocol invites the thought *I'll be done by then*, so a
lifetime option on first read cannibalises exactly the annual renewals that compound past
the ~24-month mark where churn stabilises and LTV is actually made. A third plan is also a
third decision, presented to somebody who is already spending their day making anxious
decisions about themselves.

Disclosed, not removed. Some people genuinely will not take a subscription, and hiding the
option they want in order to sell them one they do not is precisely the behaviour the rest
of this file exists to prevent. The link names what is behind it.

**No discounts, no launch pricing, no countdown.** Beyond the manipulation objection there
is a plain commercial one: in annual Health & Fitness the discounted cohort churns worse
than the full-price cohort. The discount buys a customer who was leaving anyway.

Hardship access stays visible on the paywall — no form, no proof, no explanation.

## Evidence instead of social proof

Anneal has no users, no ratings, and no analytics, so it has no social proof and will not
invent any. What it has is a real evidence base for the *method*, and that converts better
in a low-trust category anyway.

`content/proof.ts` holds the citations. Every claim there is about the literature, never
about Anneal, and every one carries this qualifier somewhere adjacent:

> Anneal is not therapy and has not itself been trialled. These are the findings behind the
> exercises it is built from.

Source figures live in the `bdd-expert` skill's `references/evidence-base.md`. Do not add a
claim to `proof.ts` that is not graded there.

## The plateau

Weeks 5–8 are where behaviour-change products lose people: the early gain has landed, the
next one has not arrived, and the customer concludes it stopped working. In this protocol
that stretch is real — response rates keep climbing well past week 12.

Name it before they reach it, in the product, in week four. An expected plateau is a stage
the customer rides out. An unexpected one is a cancellation.

## What to measure, if analytics are ever added

There are none in v1 and that is a feature. If any are ever added, they belong behind
explicit opt-in, and this is the shortlist:

- **Activation:** reached the cost mirror (aha), completed three check-ins (second proof)
- **Time-to-first-value:** open → cost mirror, in seconds
- **The ask:** week-one completion → paywall view → trial start
- **Trial:** start → day 14 → renewal
- **Health, not just revenue:** median reclaimed hours at week 4 and week 12

Never instrument distress ratings for commercial purposes. Not as a segment, not as a
trigger, not as a cohort. That data exists to help the customer and for no other reason.
