---
name: value-first-growth
description: Conversion, activation, and retention strategy for subscription apps whose users are vulnerable — mental health, body image, addiction, grief, chronic illness. Use when designing or reviewing onboarding, paywalls, pricing, trials, upgrade prompts, streaks, notifications, winback, or any surface where the product asks for money or attention. Grounded in published 2025–2026 subscription benchmarks and in the specific constraint that the user may be in distress at the moment of the ask. Also use for "why aren't people converting", "should the paywall be earlier", "what should the trial length be", or any request to make an app "retain customers" or "convert better".
---

# Value-first growth

Conversion strategy for products where the customer is having a bad day.

The whole field's advice is written for productivity tools and photo editors. Most of it
transfers. Some of it, applied to someone in acute distress, is how you build a product
that makes money for six weeks and gets uninstalled with a one-star review that says *it
felt like it was preying on me*. This skill is the transferable part plus the corrections.

## The one idea

**Sell the proof, not the promise.**

Every competitor sells a promise: you will feel better, you will be calmer, you will
sleep. Promises are cheap, unfalsifiable, and the customer has heard them before and been
let down — which is exactly why trust in this category is low and day-one retention is
20–30% (see `references/benchmarks.md`).

A product that can show the customer a **true number about their own life** has something
no promise can compete with. Find that number. Compute it early. Put the ask next to it.

The entire funnel in this skill is arranged around finding the earliest honest moment the
customer sees something true about themselves, and treating that moment — not install, not
onboarding, not day 30 — as the commercial event.

## The four rules

1. **Nothing that gates safety is ever a revenue surface.** Crisis support, grounding, and
   the panic path are free forever and never carry an upsell. Not a badge, not a "you're
   missing out", not a post-session paywall. This is not a nice-to-have; a paywall in
   front of someone at peak distress is the single fastest way to destroy a health brand.

2. **The paywall appears after investment, never before it.** Noom's funnel is the
   reference case: personalisation, education, empathy, and only then price. By the time
   the ask arrives the customer has spent effort, and effort already spent is the strongest
   predictor of paywall conversion there is.

3. **Never use the customer's distress data to time an offer.** Not "you've had three hard
   days, upgrade now". This is the line that separates personalisation from exploitation,
   and customers feel it immediately even when they can't name it. Time offers off
   *progress* signals, never *suffering* signals.

4. **Every number you show a customer must be one you could defend to them in person.**
   No fabricated ratings, no invented user counts, no "94% of people like you". If you
   don't have social proof, use *evidence* proof: cite the literature behind your method
   and be explicit that it's the method that was tested, not your app.

## Working method

When asked to improve conversion, retention, or "make it retain customers", work in this
order. Do not skip to the paywall; the paywall is almost never the bottleneck.

1. **Locate the aha moment.** The first instant the customer perceives value, stated as a
   concrete on-screen event. Not "they feel calmer" — "they see the hours number for the
   first time". If you can't name the pixel, you don't have one, and that is the finding.
2. **Measure time-to-first-value.** How long from first open to that pixel? Target is under
   two minutes for the first taste. Every day of delay is compounded against a 20–30%
   day-one retention rate. Compressing TTFV is nearly always the highest-leverage change
   available, and it is worth more than any paywall redesign.
3. **Define the activation event.** The measurable action that stands in for the feeling.
   Then check it is reachable in session one by most customers.
4. **Place the ask at the second proof point**, not the first. First proof earns the habit;
   second proof earns the money.
5. **Design the free tier to be genuinely good.** A free tier that is obviously crippled
   reads as hostage-taking. A free tier that solves a real problem completely, and is
   honest that the paid tier solves a *different* problem, converts better and refunds less.
6. **Then** work on paywall, pricing, trial. See `references/funnel.md`.

## Reading the benchmarks correctly

`references/benchmarks.md` holds the published figures. Two warnings about using them.

**Hard paywalls convert about 5× better than freemium** (10.7% vs 2.1% median day-35
trial-to-paid). This number will tempt you to gate everything. In a vulnerable-user product
it is the wrong read: the population that a hard paywall filters out is disproportionately
the population that needs the product and cannot pay, and the reputational cost lands on
exactly the review pages your organic acquisition depends on. Take the structural insight —
*the ask should be unmissable and early in the customer's mind* — and implement it as an
unmissable **free tier boundary** stated on day one, not as a wall.

**Longer trials convert better** (17–32 days: 42.5%; under 4 days: 25.5%). This one
transfers cleanly, with one addition: a long trial on a vulnerable customer without a
conspicuous end-date reminder is a trap, and it will show up as chargebacks and
one-star reviews. Long trial, loud reminder.

## Absolute bans

Refuse these and rewrite. Each one appears in shipped apps and each one is a liability.

- **Fake loading screens.** "Building your personalised plan…" with a progress bar and
  testimonials while nothing computes. Currently described in the trade press as table
  stakes. It is a lie told to a person who came to you because they cannot trust their own
  perception. Compute something real or show nothing.
- **Fabricated social proof.** Ratings you don't have, user counts you never measured,
  "join 40,000 people". If a number is not queryable from a real source, it does not ship.
- **Countdown timers, expiring discounts, "3 spots left".** Manufactured urgency aimed at
  an anxious person. Also: the deep-discount cohort churns worse than the full-price
  cohort, so this trades brand damage for worse customers.
- **Confirmshaming.** "No thanks, I like feeling this way." Dismiss buttons say what they
  do, in the same visual weight as the accept button.
- **Hidden, delayed, or disguised close buttons.** One dismiss, plainly labelled, present
  from the first frame.
- **Streak loss as a sales lever.** "Your 40-day streak ends tonight — upgrade to freeze
  it." Weaponising the thing that was supposed to help.
- **Distress-timed prompts.** Any upsell triggered by a bad mood score, a missed week, a
  crisis-screen visit, or a high distress rating.
- **Pre-checked upsells, opt-out add-ons, auto-upgrade tiers.**
- **Guilt-framed retention notifications.** "We miss you." "You've given up." Notifications
  state a fact or ask a question; they never imply a moral failing.
- **Making cancellation harder than subscription.** Same number of taps or fewer.

## Files

| File | Read it when |
|---|---|
| `references/benchmarks.md` | You need a real figure, with its source and date |
| `references/funnel.md` | Designing or reviewing any stage: install → renewal → winback |
| `references/moments.md` | Deciding **when** a prompt fires, how often, and what silences it |
| `references/copy-patterns.md` | Writing the words on a paywall, prompt, or notification |
| `references/steady.md` | Working on Steady specifically — the applied version |

## The two-line version of timing

`funnel.md` covers what to say at each stage. `moments.md` covers when, and it is the
harder half — most products with good copy still feel pushy, and the cause is almost never
the wording. It is that four screens each decided independently to say something.

The distinction that resolves it: a **boundary** is reached because the user walked into it
(a locked screen they tapped), so it always renders and needs no budget. An **interruption**
is started by the app, spends trust whether or not it converts, and must go through a single
scheduler that returns at most one thing per day for the whole app. Read `moments.md` before
adding any prompt.
