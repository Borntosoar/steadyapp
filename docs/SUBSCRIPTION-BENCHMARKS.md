# What the subscription leaders actually do

Research pulled 10 August 2026. Every figure below is attributed. Read the
"How reliable is this" section before you act on any of it — the two largest
datasets in the industry disagree with each other on the single most important
question, and that disagreement is the most useful thing in this document.

---

## 0. How reliable is this

**What I could verify:** figures below come from published 2026 benchmark
reports by RevenueCat and Adapty, plus Business of Apps revenue estimates.
RevenueCat's 2026 report covers **115,000+ apps and $16bn of revenue**, which
makes it the largest dataset available on this question.

**What I could not verify:** the network here blocks direct access to
revenuecat.com, adapty.io, appbrain.com, tasu.ai and substack. I read those
reports through search summaries, not primary sources. That means I can quote
the headline figures with reasonable confidence but **I could not read the
methodology sections**, and for a couple of numbers below I could not find the
original at all. Those are marked ⚠️.

**What is missing entirely:** I have no live top-grossing chart for Health &
Fitness. The one ranking site I found is egress-blocked. Everything about
"position N in the charts" is therefore absent from this document by choice
rather than invented.

**Ranking positions I do have** (US iPhone, top grossing, 3 February 2026, via
Trifleck): **1 ChatGPT, 2 YouTube, 3 TikTok, 4 Paramount+**. That list is a
useful reality check and is discussed in §5.

---

## 1. The market Anneal is actually in

| Figure | Value | Source |
|---|---|---|
| Mental health apps market, 2025 | $8.40bn | Mordor Intelligence |
| Same market, 2026 | $9.45bn | Mordor Intelligence |
| CAGR to 2031 | 14.76% | Mordor Intelligence |
| Health apps revenue, 2025 | $3.5bn, +23.5% YoY | Business of Apps |
| Fitness apps revenue, 2025 | $3.4bn, +24.5% YoY | Business of Apps |
| Subscriptions as share of App Store revenue | ~44% | Trifleck |
| Non-gaming IAP growth, 2025 | +21% YoY, **passed games for the first time** | Trifleck |

The category is growing at ~15% a year and subscription is now the dominant
monetisation model in it. That is the good news.

### The concentration problem

| Figure | Value | Source |
|---|---|---|
| Share of subscription revenue taken by the top 10% of apps | **94.5%** | RevenueCat 2026 |
| Share of Health & Fitness revenue taken by its top 10% | **92.6%** | Adapty 2026 |
| New apps that never reach **$1,000 in total revenue** | **57.7%** | RevenueCat 2026 |

That last row is the number to sit with. It is not a conversion-rate problem or
a design problem. Most apps in this category never make a thousand dollars in
their entire life.

---

## 2. The single most important number, and the disagreement about it

Two large datasets, same year, opposite conclusions:

| Source | Claim |
|---|---|
| **RevenueCat 2026** (115k apps, $16bn) | Hard paywalls convert **10.7%** of downloads to paid by day 35. Freemium converts **2.1%**. A **5× gap.** |
| **Adapty 2026** | Soft paywalls **outconvert hard ones by nearly 50%.** |

They cannot both be right as stated, and neither summary I could reach explains
the discrepancy. The most likely reconciliation — and this is my inference, not
something either report says — is that they are measuring different denominators:
"conversion of downloads" versus "conversion of paywall views." A hard paywall
shows itself to 100% of installs; a soft one shows itself to a self-selected
minority who are already engaged, which mechanically inflates its view-conversion
while depressing its install-conversion.

**Do not treat the 5× figure as a target Anneal is failing to hit.** It is a
comparison between two business models, and the model on the winning side of it
is one this product has already declined for stated reasons (SAFETY.md §4, §12).

---

## 3. The benchmark funnel, end to end

Adapty's 2026 conversion funnel, all categories:

```
install → trial        11.2%
trial   → paid         27.8%
        first renewal  59.2%
        second renewal 45.1%
        third renewal  37.1%
```

Health & Fitness beats the middle step substantially:

| Metric | All categories | Health & Fitness |
|---|---|---|
| Trial → paid | 27.8% | **35.0%** (best of any category) |
| Revenue per install, day 14 | — | **$0.48** (best of any category) |
| Revenue per install, day 60 | — | **$0.66** |
| Share of revenue from annual plans | minority | **60.6%** (only category where annual dominates) |
| Median monthly price | — | **$9.70** (vs gaming $4.99) |
| Median annual price | — | **$39.99**, or $35.64 depending on source |
| Average refund rate | 8.3% globally, up to 14% worst case | — |

**Health & Fitness has the highest install LTV of any App Store category.** The
usual explanation, which I find convincing, is intent: nobody downloads a
fitness app by accident.

### Retention by plan length

| Plan | Retained at 12 months | Retained at day 380 | Churn after year 1 |
|---|---|---|---|
| Annual | **44.1%** | 19.9% | 48% |
| Monthly | 17.5% | 14.2% | 79% |
| Weekly | — | 5.5% | — |

Annual subscribers are roughly **3× more valuable over 24 months** than monthly
ones. This is the strongest, least ambiguous finding in the whole dataset, and
Anneal's yearly-default is already on the right side of it.

---

## 4. What the leaders actually do, mechanically

### Onboarding

| Finding | Figure | Source |
|---|---|---|
| Paywall after 3–5 screens of value vs immediately at launch | **40–60% better** | AppAgent / RocketShip |
| Onboarding paywall **with a trial** | **1.78%** install-to-paid, the best configuration measured | Adapty 2026 |
| Noom's quiz-completers → paid | **>10%**, vs 2.7% median for subscription apps | Airbridge |

The Noom figure is the one worth staring at. It is roughly **4× the median**,
and the mechanism is not the paywall design — it is that a quiz creates
investment before the ask, and the answers then personalise everything after it.

**Calm's onboarding**, which is the closest structural analogue to Anneal:
four quiz steps (what brings you here — sleep/anxiety/focus/self-improvement;
experience level; preferred session length; reminder time), then a mandatory
sign-up, then the paywall. The declared data immediately personalises the home
screen. The paywall leads with a **7-day trial on the yearly plan** and a
strikethrough price.

### Trial length

⚠️ **Unverified.** One source reports trials of **17–32 days converting at
45.7%** versus **26.8% for the common 3–7 day trial**. I could not reach the
primary source and could not find a second one. If true it is a very large
effect for a one-line change. **Treat as a hypothesis to test, not a fact.**

### Retention, using Duolingo as the extreme case

| Figure | Value |
|---|---|
| Monthly DAU retention | 55% |
| Churn, Western markets | 28% |
| DAU growth YoY | +36% |
| Day-7 retention improvement from notification A/B tests | +14% |
| 2025 revenue | $340m |

Duolingo's own framing, which is the transferable part: **notifications are
treated as a core product feature with the same engineering rigour as the
learning algorithm**, not as a marketing channel. The rest of the stack —
streaks, loss-framed evening reminders that escalate when you have a long streak
and no freeze, leagues, variable reward schedules — is explicitly built on loss
aversion and social comparison.

### The two biggest names in mental health are shrinking

| App | 2025 revenue | Subscribers | Change |
|---|---|---|---|
| Calm | $210m | 3.5m | **−24% revenue, −500k subscribers** |
| Headspace | — | 2.0m | **−300k subscribers** |

Calm raised annual pricing in February 2026 and launched a separate Calm Sleep
app at $69.99/yr. Calm's monthly is $14.99, annual $69.99.

This matters more than any tactic in this document. **The two category leaders
are contracting while the category grows at 15%.** Generalised
meditation-and-mindfulness is a saturating position. The growth is going
somewhere else, and specific, mechanism-led, condition-targeted products are the
obvious candidate.

---

## 5. How Anneal's current pricing sits against all this

Current: **$12.99/mo · $79.99/yr · $149 once · 14-day trial.**

| Decision | Benchmark | Verdict |
|---|---|---|
| $12.99 monthly | H&F median $9.70 | **Above median, and that is correct.** High-priced apps convert *better* at day 35 — 2.7% vs 1.5% for low-priced. |
| $79.99 annual | H&F median $39.99 | **2× the median.** Defensible for a 12-week structured programme, but it is the most aggressive number in the product and the one most worth testing. |
| Yearly as the default | Annual = 60.6% of H&F revenue; 44.1% vs 17.5% retention | **Correct, and strongly supported.** |
| 14-day trial | 3–7 day band converts 26.8%; 17–32 day band ⚠️ 45.7% | **Sitting in the gap.** Extending to 17+ days is a one-line change with a large claimed upside. Worth testing. |
| No weekly plan | Weekly converts 1.7–7.4× better; weekly+trial is the highest-LTV configuration at $49.27/12mo | **Deliberate omission — see below.** |
| Lifetime option | — | Apple objects to the term "Lifetime" (see `APP-STORE.md`). Rename before submission. |

### On the weekly plan, honestly

Weekly + trial is, by the numbers, the highest-LTV paywall configuration
available: **$49.27 over 12 months**, versus everything else measured. Weekly
plans convert 1.7–7.4× better than annual across every price tier.

I am not recommending it, and I want to be explicit that this is a judgement
rather than a data-driven conclusion. A $7.48/week price point (the global
median) is $389/year, presented as a small number, to a population defined by
distress and impaired decision-making. Day-380 retention on weekly is **5.5%** —
the model works by churning people fast and replacing them. That is the shape
of a product that makes money from people who stop using it, which is the
opposite of what this one is for.

The number is here so the decision is made with it in view rather than in
ignorance of it.

---

## 6. What transfers to Anneal, split three ways

### Adopt as-is

1. **Show the paywall after 3–5 screens of demonstrated value, not at launch.**
   40–60% better. Anneal's onboarding already does this; keep it.
2. **Personalise the paywall with the user's own onboarding answers.** Noom's
   >10% versus a 2.7% median is the largest single mechanic in this document.
   Anneal now shows the user's real reclaimed-hours figure on the paywall — that
   is exactly this pattern, and it should be extended to the trial-ending and
   week-one cards.

   > **Amended on implementation.** The week-one ask now carries the figure. The
   > trial-ending card does not, and should not. That card renders the figure
   > behind a `hours > 0` gate, which on an *ask* is harmless — an ask with
   > nothing good to say falls back to a headline and asks anyway — but on a
   > renewal notice it means showing the customer their number when it flatters
   > and hiding it when it does not, in the one frame whose job is to say money
   > is about to leave their account. Selective evidence at the renewal decision
   > is a dark pattern and it is worse for being built out of true data. That
   > card is personalised instead with days practised and urges sat through:
   > counts of the person's own actions, which only go up, and which cannot come
   > back negative after a bad fortnight. Same reshaping the week strip already
   > applies to the streak. Weaker hook, honest one.

3. **Keep annual as the default.** 44.1% vs 17.5% twelve-month retention.
4. **Test a longer trial.** 14 → 21 days. One line, claimed large effect, no
   safety implication whatsoever.

   > **Corrected on implementation: 30 days, not 21.** App Store Connect sells
   > introductory free trials in fixed durations only — 3 days, 1 week, 2 weeks,
   > 1 month, 2 months, 3 months, 6 months, 1 year — and 21 days is not among
   > them, so the recommendation above is not purchasable as written. The two
   > options either side are 2 weeks (where Anneal was) and 1 month, and 1 month
   > is the one inside the 17–32 day band the figure comes from. Shipped as
   > `PRICING.trialDays: 30`, with a test asserting the value stays in the set
   > the store can actually grant. Cost: weeks one to four go free, including the
   > week-four plateau — which is the right four weeks to give away, since the
   > plateau is where people quit and somebody who was warned about it and
   > watched it arrive on schedule has better grounds for renewing than any copy
   > on the paywall.
5. **Treat notifications as a product surface with real engineering behind it**,
   which is Duolingo's actual lesson. Anneal has no notifications at all yet.

### Reshape before adopting

6. **Duolingo's streak.** The mechanic works — but it works *through loss
   aversion*, which SAFETY.md §3 forbids, for a specific reason: the person most
   likely to break a streak is the person having the worst week, and they are
   who this app has to keep. **The reshaped version already exists in the
   product**: the week strip draws presence and never absence, and the
   urges-resisted tally only goes up. That is a weaker hook and it is the right
   trade.
7. **Evening escalating reminders.** Duolingo sends more urgent notifications as
   the day runs out. Reshaped: a single, fixed-time, non-escalating prompt that
   never references a gap, a miss, or a number of days. Anything that reads as
   "you haven't" is §3 delivered outside the app.
8. **Calm's mandatory sign-up before the paywall.** Effective for retention and
   cross-device, and incompatible with the local-only, no-account promise made
   on screen one. Keep the promise. It is also a genuine differentiator in a
   category where privacy is the second-largest objection.

### Structurally incompatible

9. **Hard paywall.** 5× on paper. It filters out precisely the people this app
   is built for, and SAFETY.md §4 and §12 make that cost non-transferable.
10. **Weekly pricing.** §5 above.
11. **Leagues, leaderboards, social comparison.** Comparison is a maintaining
    mechanism in this condition. This is not a close call.
12. **Variable reward schedules.** The slot-machine shape, in an app whose whole
    purpose is interrupting a compulsive loop.

---

## 7. The honest verdict on charting

**A body dysmorphia app cannot top the free charts, and no amount of design
changes that.** BDD affects roughly 2 in 100 adults. The top of the US grossing
chart on 3 February 2026 was ChatGPT, YouTube, TikTok, Paramount+ — general-
purpose products with total addressable markets of "everyone with a phone."
Anneal's addressable market is about 2% of adults, most of whom have never heard
the diagnosis named.

What is realistically available:

- **Health & Fitness has the best revenue-per-install of any category** ($0.48
  by day 14) and the **best trial-to-paid rate** (35%). The economics per user
  are the best on the store.
- **The two category leaders are shrinking while the category grows 15% a year.**
  That is a gap, and it is a gap in exactly the direction of specific,
  mechanism-led products rather than general wellbeing.
- **57.7% of new apps never make $1,000.** Clearing that bar is not a low
  ambition; it is the median outcome inverted.

The realistic target is not a chart position. It is being the best-reviewed
product in a defined condition category with the highest install LTV on the
store, priced above median, on annual plans that retain at 44%. That is a real
business. It is not a top-10 free app, and any plan that depends on becoming one
is a plan that fails.

### The one asset that could actually travel

The reclaimed-hours card is the only shareable moment in this category that
**does not out the person sharing it.** Every competitor's shareable artefact is
a mood score, a symptom streak, or a meditation-minutes total, all of which
disclose something diagnosis-adjacent the moment they are posted. "47 hours back
this week" reads like a running PR.

Given that `MOMENT_COPY['rate-app']` says outright that this product has no ad
budget and people will find it by being told about it, that card is not a nice
touch. It is the distribution strategy.

---

## Sources

- RevenueCat, *State of Subscription Apps 2026* — 115,000+ apps, $16bn revenue
- Adapty, *State of In-App Subscriptions 2026*, and their Health & Fitness
  benchmark article
- Business of Apps — Calm, Headspace, health app and fitness app market data
- Mordor Intelligence — mental health apps market sizing
- Airbridge — subscription pricing by category 2026; onboarding-before-paywall
- AppAgent, RocketShip HQ — paywall placement and optimisation
- Trifleck — top grossing apps, February 2026
- Deconstructor of Fun, Digia, Apptitude — Duolingo streak and notification
  teardowns
- Appcues / GoodUX, ScreensDesign — Calm onboarding teardowns

Direct access to revenuecat.com, adapty.io, appbrain.com, tasu.ai and substack
was blocked by the network; those figures come from search summaries of those
reports rather than from reading the reports themselves.
