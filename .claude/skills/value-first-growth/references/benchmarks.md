# Benchmarks

Published figures, with the source and the date they describe. Retrieved August 2026.

Treat every number here as a **prior, not a target**. Category medians hide enormous
variance, and a health app with a real measured outcome behaves unlike a habit tracker.
Where a figure has an obvious confound, it is noted.

---

## Trial → paid

| Figure | Value | Source |
|---|---|---|
| Global median trial-to-paid | ~25.6% | RevenueCat, State of Subscription Apps 2026 |
| Health & Fitness trial-to-paid | ~35% (highest of any category) | RevenueCat 2026 |
| Hard paywall, median day-35 trial-to-paid | 10.7% | RevenueCat 2026 |
| Freemium, median day-35 trial-to-paid | 2.1% | RevenueCat 2026 |
| Trial length 17–32 days | 42.5% median conversion | Business of Apps, subscription trial benchmarks 2026 |
| Trial length under 4 days | 25.5% median conversion | Business of Apps 2026 |
| Opt-out trial (card required) vs opt-in (no card) | roughly 2.5–3× conversion | Userpilot / Appcues, free-trial benchmarks |
| Opt-in trial signup volume | 3–4× higher than opt-out | same |

**The hard-paywall confound.** The 5× gap between hard paywall and freemium is partly a
selection effect: a hard paywall filters for high-intent installs before the measurement
starts. It does not mean converting a given customer is five times more likely. Read it as
*intent filtering works*, not as *walls create demand*.

**The card-upfront confound.** Opt-out trials convert better per signup and worse per
install, for the same reason. If acquisition is organic and word-of-mouth, the volume side
of the trade matters more than the median suggests.

## Paywall placement

| Figure | Value | Source |
|---|---|---|
| Onboarding paywall with trial, average conversion | 1.78% (highest of any placement) | Adapty / AppsOps 2026 |
| Trials started in week one under a hard paywall | 78% | RevenueCat 2026 |
| Largest share of trial starts, all models | Day 0 | RevenueCat, State of Subscription Apps 2025 |
| Onboarding completion, B2C free-trial apps | 30–50% | Business of Apps 2026 |
| In-app vs web paywall conversion | 1.60% vs 1.10% | RevenueCat 2026 |
| In-app vs web LTV | $40.10 vs $35.80 | RevenueCat 2026 |

Day 0 dominating trial starts is the most actionable line in this table. Whatever the ask
is, most people who will ever say yes will say it on the first day. That is an argument for
compressing time-to-value, **not** for putting the price on screen one.

## Retention and churn

| Figure | Value | Source |
|---|---|---|
| Day-one retention, health apps | 20–30% | Sahha, health app churn analysis |
| First-renewal churn, monthly plans | 15–40% | RevenueCat 2026 |
| First-renewal churn, weekly plans | 30–50% | RevenueCat 2026 |
| Annual subscriptions cancelled in month one | ~30% | RevenueCat 2026 |
| Health & Fitness revenue from annual plans | 68% | Adapty, health & fitness benchmarks |
| Monthly plan retention, Health & Fitness | 17.0% | Adapty |
| Point where churn stabilises and LTV compounds | ~24 months (second annual renewal) | RevenueCat 2026 |
| Discount cohort vs full-price cohort, annual H&F | discounted churn **worse** | RevenueCat 2026 |

That last row is the commercial argument against the discount reflex. A cheaper customer is
a worse customer in this category, twice over.

## Activation

| Figure | Value | Source |
|---|---|---|
| Recommended time-to-first-value ceiling | under 15 minutes | Digital Applied, TTV framework 2026 |
| Effect of +25% activation rate on MRR | ~+34% | SaaS activation literature |

**Aha moment vs activation event.** The aha moment is emotional and qualitative — when the
customer *feels* the value. The activation event is behavioural and quantitative — the
measurable action that stands in for that feeling. Design for the first, instrument the
second. Conflating them produces metrics that move while retention doesn't. (Reforge,
activation series.)

## What the numbers do not cover

No published benchmark set separates out products whose customers are in clinical distress.
Health & Fitness is the nearest category and it is dominated by weight loss and workout
apps, whose customers are motivated rather than suffering. Expect:

- lower trust at first open, so **trust-building content converts better than feature lists**
- higher sensitivity to any perceived manipulation
- a real correlation between *the product working* and *the customer paying*, which most
  categories do not have and which is the single biggest asset available

Where a decision depends on a number that does not exist, say so rather than borrowing the
nearest one.

## Sources

- [RevenueCat, State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps)
- [RevenueCat, subscription app trends and benchmarks 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/)
- [RevenueCat, activation metrics that predict retention](https://www.revenuecat.com/blog/growth/activation-metrics)
- [RevenueCat, Noom web-to-app onboarding teardown](https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel/)
- [RevenueCat, when to offer monthly plans](https://www.revenuecat.com/blog/growth/monthly-subscriptions-when-to-offer)
- [Business of Apps, app subscription trial benchmarks](https://www.businessofapps.com/data/app-subscription-trial-benchmarks/)
- [Adapty, health & fitness subscription benchmarks](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/)
- [Adapty, high-performing paywalls 2026](https://adapty.io/blog/high-performing-paywall-2026/)
- [Sahha, why health app users churn within 90 days](https://sahha.ai/blog/health-app-churn-retention/)
- [Digital Applied, time-to-value onboarding framework 2026](https://www.digitalapplied.com/blog/customer-onboarding-time-to-value-2026-saas-metrics-framework)
- [Reforge, defining the aha moment](https://www.reforge.com/c/retention-series-eg/activation/aha-moment)
- [Appcues, free-to-paid conversion strategies](https://www.appcues.com/blog/free-to-paid-conversion-strategies)
- [Userpilot, free trial conversion benchmarks](https://userpilot.com/blog/free-trial-conversion-rate/)
- [UXPA Magazine, ethical UX patterns](https://uxpamagazine.org/ethical-ux-patterns-building-trust-without-manipulation/)
