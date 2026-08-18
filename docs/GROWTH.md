# GROWTH.md

Growth, monetisation and automation for Anneal. Written to be decided on, not surveyed.

**Status of the numbers.** Every figure is either (a) attributed to a source, (b) computed
from a figure in `docs/SUBSCRIPTION-BENCHMARKS.md`, or (c) marked **[est.]** with the
reasoning shown inline. Nothing is invented. Where the network blocked a source I say so.
`docs/SUBSCRIPTION-BENCHMARKS.md` is not repeated here — this document builds on it and
assumes you have read it.

**Constraint filter.** Every idea below has been run against SAFETY.md §1–§13. Ideas that
failed are in §7 with the reason, not silently dropped. Where an idea passes only with a
modification, the modification is stated as part of the idea rather than as a caveat.

**One correction before anything else.** The brief said this repo has "a working Playwright
screenshot harness." It does not. `grep -ri playwright` across the repo returns hits only in
`SAFETY.md`, `docs/APP-STORE.md`, `content/modules.ts` and two agent definitions — no
harness, no config, no dependency in `package.json`. There is also **no `.github/workflows`
directory and no CI of any kind**. What does exist and is genuinely useful: 344 passing
tests under `node --test` with zero installed dependencies, a working web export in `dist/`,
and the GitHub remote. §3 builds on what is actually there.

---

## 1. The honest commercial diagnosis

### 1.1 The ceiling on organic acquisition, computed

This is the most important number in the document, so here is the whole chain. Every link
is an estimate and each one is stated so you can disagree with a specific step rather than
the conclusion.

| Step | Value | Where it comes from |
|---|---|---|
| Adults in the primary English-language markets (US, UK, CA, AU) | ~366m | US ~260m adults, UK ~54m, CA ~32m, AU ~20m **[est., rounded public population figures]** |
| BDD prevalence | 2 in 100 | `content/proof.ts` — Rief 1.7%, Buhlmann 1.8%, Koran 2.4% |
| People meeting criteria | ~7.3m | arithmetic |
| On iPhone | ~4m | **[est.]** iOS share 50–60% across these four markets |
| Who will ever *search a term that reaches this app* | 5–10% | **[est.]** — the binding assumption. Most people with BDD have never had the condition named to them; `content/modules.ts` module 1 makes exactly this point. Concealment is a diagnostic feature. |
| Annual searchers reachable | 200k–400k | arithmetic |
| Share a top-ranked app captures on its winnable terms | 5–15% | **[est.]** — Anneal can plausibly rank #1–3 on `bdd`, `dysmorphia`, `dysmorphic`, `checking`, `reassurance`, `appearance` (per `docs/APP-STORE.md` §2) but not on `esteem`, `confidence`, `ocd`, `cbt` |
| **Downloads per year from ASO at maturity** | **10k–60k** | arithmetic |

Now revenue per download. Anneal is freemium with a soft paywall, which is the model
RevenueCat 2026 measures at **2.1% install→paid by day 35** (vs 10.7% for hard paywalls —
the model Anneal has already declined for stated reasons).

Per 1,000 downloads, assuming a plan mix of 65% annual / 20% monthly / 15% pay-once
**[est. — no data exists yet; annual is pre-selected and the category takes 60.6% of revenue
from annual per Adapty 2026, so 65% is a modest step up from category behaviour]**:

```
21 payers per 1,000 downloads          (2.1%, RevenueCat 2026)
  13.6 annual   × $79.99  = $1,088
   4.2 monthly  × $12.99 × 4.5 mo avg life = $245
   3.1 pay-once × $149    = $  462
                            -------
  gross year one            ≈ $1,795   → $1.80 per download
  less 8.3% refunds         ≈ $1,646   (Adapty 2026 global average refund rate)
  less Apple 15%            ≈ $1,399   → $1.40 net per download
```

Monthly average life of 4.5 months is derived from Adapty's 17.5% twelve-month monthly
retention: a cohort decaying to 17.5% over 12 months has a mean life in that range
**[est., simple exponential fit]**.

**The near-term sanity check disagrees with the year-one figure and you should trust the
near-term one.** Adapty's Health & Fitness revenue per install is **$0.48 at day 14** and
**$0.66 at day 60** — the best of any category. Anneal's $1.40 is a *year-one* number that
depends on annual subscriptions actually being held for a year. Plan on $0.66 by day 60 and
treat everything above that as unproven.

**Conclusion: pure ASO is a $15k–$85k/year business at maturity.**
(10k–60k downloads × $1.40, discounted for the fact that maturity takes 18–24 months.)

That is a real outcome — it clears the 57.7% of apps that never make $1,000 (RevenueCat
2026) by two orders of magnitude. It is also not a company. Everything in §2 exists because
of this paragraph.

### 1.2 The twelve-week end caps LTV, and the arithmetic is worse than it looks

A subscription app sells access to something that keeps being worth having. Anneal sells a
programme that finishes. Module 12 tells the customer, in writing, that they are done and
that maintenance costs far less than the initial work. That is the correct thing to say and
it is a direct instruction to cancel.

Adapty's 44.1% twelve-month annual retention is measured across apps with ongoing value.
For a finite programme, model **25–35% [est.]** — the honest adjustment is that the
customer's reason to renew is maintenance and relapse insurance, which is real but weaker
than "I still use this every day."

| Product | Gross | Apple 15% | Net | Expected net LTV |
|---|---|---|---|---|
| Annual, renewing at 30% **[est.]** | $79.99 × 1.30 = $104 | | | **$88** |
| Pay once | $149 | | | **$127** |
| Monthly, 4.5 mo | $58 | | | **$50** |

**The pay-once product is worth ~44% more than an annual subscription and this is the
single most commercially significant fact in the document.** `.claude/skills/value-first-growth/references/steady.md`
currently keeps pay-once off the default paywall view on the reasoning that it cannibalises
"annual renewals that compound past the ~24-month mark." For a product with ongoing value
that reasoning is right. For a twelve-week programme it is probably wrong — there is very
little past month 24 to compound, and the customer who thinks *I'll be done by then* is
thinking accurately.

This is a decision, not a fact, because it turns on a number nobody has: the real year-two
renewal rate. **See §8, decision 2.**

### 1.3 Optimising blind

No analytics means no onboarding funnel, no paywall view→tap rate, no time-to-first-value
measurement, no cohort behaviour, no A/B testing of in-app copy. `value-first-growth`
identifies compressing time-to-first-value as "nearly always the highest-leverage change
available" — and Anneal cannot measure it.

What that actually costs: the ordinary practice of shipping a change and watching a number
move is unavailable. Every in-app change is a bet placed on judgement.

What it does *not* cost, and this is the part most founders get wrong: **the entire App
Store funnel is instrumented by Apple, for free, with no SDK.** Impressions → product page
views → conversion rate → first-time downloads → sessions → active devices → deletions →
trial starts → trial-to-paid → MRR → refunds. Apple even ships a native A/B testing product.
Fully spelled out in §4.

**The least-invasive way to get the in-app signal you're missing, ranked:**

1. **TestFlight (free, up to 10,000 external testers).** Sessions and crashes per build, and
   a direct email channel to consenting testers. This is your pre-launch instrumentation and
   it touches nothing.
2. **Consented export files from beta testers.** `exportJson` already exists and is free on
   every tier. A tester who *chooses* to email you their export gives you the complete
   behavioural record — onboarding completion, check-in cadence, week progression, where
   they stopped. No code, no SDK, no promise broken, because the user initiated it. Delete
   on receipt of the analysis; say so in writing when you ask.
3. **Moderated sessions.** 8–12 people, screen-shared, watching where they stop.
4. **Custom Product Pages as channel instrumentation** (§4.2) — free per-channel conversion
   measurement with zero code.

Do not add an analytics SDK. §4.4 prices what it would cost you.

### 1.4 Trust is the binding constraint, and it is also the moat

In this category the customer cannot evaluate the product before buying, has usually been
let down before, and has frequently been sold to by an industry that profits from their
distress. The things that would normally raise conversion — urgency, social proof, before/
after — are the exact things that destroy trust here.

The commercial consequence: **Anneal cannot buy its way in.** Paid acquisition into a
low-trust category converts badly, and the ad creative that performs in this vertical is
creative Anneal is forbidden from making. The privacy posture is the compensating asset, and
it is worth more institutionally than it is to consumers (§2.1).

### 1.5 ASO is low-volume and high-intent, which is a specific kind of problem

`docs/APP-STORE.md` §2 has already done this work and it is good. The unaddressed issue is
that **you have no volume data.** Apple's search popularity index is the only authoritative
source and it is not in any of the docs.

**Do this, it is free and takes an hour:** open an Apple Search Ads Advanced account. You do
not have to spend anything. The keyword planner exposes Apple's own search popularity score
(a 5–99 index) and competitiveness for every term. That converts §2 of APP-STORE.md from a
well-reasoned guess into a ranked list. This is the highest-value free hour available before
launch.

### 1.6 What is genuinely hard, in one list

1. The addressable market is ~2% of adults and most of them have never named the condition.
2. The product finishes, so LTV is structurally capped.
3. No telemetry, so in-app iteration is blind.
4. Every high-performing growth tactic in the category is banned by SAFETY.md, correctly.
5. The safety surfaces — the most valuable part of the product for the most distressed
   users — are permanently free, so the customers with the highest need contribute least.
6. Not clinically trialled, which blocks clinician referral, institutional procurement and
   most press.
7. Solo founder, no ad budget, no social proof, and an App Store account that may not even
   be the right *type* yet (APP-STORE.md §5.1 — this is a hard blocker with a multi-week
   lead time).

Items 1, 2 and 6 are addressed in §2. Item 3 is addressed in §4. Item 7 is week 1 of §6.

---

## 2. Revenue lines that are currently overlooked

Ranked by expected value against effort. The ranking is the recommendation.

| # | Line | Yr-1 revenue **[est.]** | Founder-weeks | Risk | Verdict |
|---|---|---|---|---|---|
| 1 | Academic partnership + trial | $0 direct | 3–5 | Low | **Do it. It unlocks 2, 3 and 7.** |
| 2 | Non-dilutive grants | $0–$300k | 6–10 | Low | **Do it, jurisdiction-dependent.** |
| 3 | University / student counselling licensing | $10k–$60k | 8–12 | Medium | **Do it after 1.** |
| 4 | The book | $2k–$15k | 2–3 | Low | **Do it. Cheapest line here.** |
| 5 | Supporter edition (family/partners) | $3k–$12k | 2–4 | Low-med | Do it in v1.1. |
| 6 | Localisation | +20–40% of consumer rev | 4–6/language | Medium | One language, after PMF. |
| 7 | Clinician companion | $0 direct | 1 | Low | **Free, not a product.** Referral asset. |
| 8 | Cosmetic/derm clinic channel | $5k–$25k | 3–5 | **High (brand)** | Founder judgement — §2.8. |
| 9 | Employer / EAP | $0–$20k | 10+ | Medium | Only as a bundled catalogue item. |
| 10 | Apple Health / Screen Time | $0 | 2–4 | Med-high | **Defer.** §2.10. |
| 11 | Content licensing of the 12 modules | $5k–$30k | 4+ | **High (safety)** | Restrict severely or decline. |

### 2.1 Academic partnership and a trial — the keystone

**The idea.** Approach a university research group that publishes on BDD or on digital
mental health, and offer the app, the codebase access, and engineering time for free in
exchange for them running a study. Feasibility study, single-arm open trial, or a waitlist-
controlled RCT depending on their appetite.

**Why it ranks first despite generating no revenue.** Every other high-value line in this
list is blocked by the same sentence: *Anneal is not therapy and has not itself been
trialled* (`content/proof.ts`, `PROOF_QUALIFIER`). That sentence is currently a liability
disclaimed on the paywall. A registered trial converts it into: *an independent trial is
under way at [institution]* — which is the sentence that unlocks institutional procurement
(§2.3), most grant applications (§2.2), clinician referral (§5.3) and press (§5.6).

**Why an academic will say yes.** They need a well-built, ethically-designed intervention
with a clean data story and they almost never have one. Anneal's specific selling points to
a researcher are unusual and worth stating explicitly in the approach email:

- The local-only architecture means **no IRB/REC data-governance problem**. There is no
  server holding participant data, no DPA to negotiate, no transfer agreement.
- `exportJson` produces a complete, structured participant record that the participant
  themselves hands over — which is exactly the consent model an ethics committee prefers.
- The protocol is already manualised (`lib/protocol.ts`, `content/modules.ts`), and the
  fidelity constraints are enforced by tests. That is more methodological rigour than most
  apps offered to researchers.
- The 344-test suite and SAFETY.md make the safety case for you.

**Revenue model.** Direct: zero. Indirect: it is a precondition for §2.2 and §2.3, and it is
the only route by which the largest sums in this document become reachable.

**Effort:** 3–5 founder-weeks (identifying groups, writing the approach, a protocol
document, then intermittent support). **Risk:** low. The main downside is a null result, and
even a null result on a self-help app is publishable and honest.

**Where to start.** Groups publishing on BDD specifically — the citations already in
`content/proof.ts` name them: Veale (UK), Wilhelm (Massachusetts General / Harvard),
Harrison. The IOCDF's BDD Special Interest Group and the BDD Foundation's clinical advisory
network are the shortest route to an introduction.

### 2.2 Grants — the largest single number in this document

Almost every app founder skips this. In this category it is real money and it does not
dilute.

| Programme | Amount | Notes |
|---|---|---|
| **NIH/NIMH SBIR Phase I** | **up to $323,090** | Verified via NIMH search summary, 2026. Requires a **US small business**, >50% US-owned. There is a standing Notice of Special Interest for digital mental health technologies. |
| NIMH SBIR Phase II | Substantially larger | Follows Phase I |
| **Wellcome Mental Health Data Prize (UK)** | **up to £100,000** | Six teams selected; 2026 round closed 8 May 2026 — check the next cycle |
| **NIHR i4i (UK)** | Varies; a recent CYP mental health call distributed £1.5m across 17 projects (~£88k avg) | i4i THRIVE ran a March 2026 call |
| Innovate UK digital mental health | Varies | UKRI has run dedicated digital mental health competitions |
| **Mitacs Accelerate (Canada)** | ~$15k per internship unit, roughly half matched by Mitacs **[est. — verify current rates]** | **Pairs directly with §2.1.** The cheapest possible on-ramp if the entity is Canadian. |

**The eligibility question decides the strategy.** The publisher is Anneal's own entity,
separate from SOAR (`legal/entity.json`), and the governing law is Canadian with the
crisis-line ordering in `constants/` putting CA first — so a Canadian entity, though it is
not yet incorporated and the province is still open. If so, SBIR is
out unless you incorporate a US subsidiary, and the realistic path is **Mitacs + CIHR +
NRC IRAP, anchored on the academic partnership in §2.1.** If there is a US or UK entity, the
ranking changes materially. **See §8, decision 4.**

**Effort:** 6–10 founder-weeks for a serious SBIR-class application; 2–3 for a Mitacs unit
where the academic partner does most of the writing. **Risk:** low — the downside is
unpaid time. **Expected value:** even at a 10–20% hit rate **[est.]**, a $300k Phase I has
an expected value of $30k–$60k against ~8 weeks of work. Nothing else in this document has
that ratio.

### 2.3 B2B2C: universities and student counselling — and the mechanical problem you must solve

**The demand is real.** Student counselling services are the most over-subscribed mental
health provision in the developed world and every one of them buys digital self-help to put
in front of a waiting list. SilverCloud (Amwell) and Togetherall are the incumbents in
exactly this slot. Pricing is not public — I could not find a single published per-student
rate, and the search results confirm both vendors quote bespoke.

**The no-data-collection posture is your differentiator, and it is a bigger one than you
think.** A university buying a mental health app runs it through IT security, data
protection, and (in the UK) DTAC. That process kills most vendors and takes 6–18 months.
Anneal's answer to every question on those forms is *no data is collected, there is no
server, there is no account.* You are not competing on features against SilverCloud; you are
competing on the fact that you can clear procurement in a quarter of the time.

**The mechanical problem.** A buyer will not renew a contract they cannot justify, and
justification means utilisation data. Anneal cannot report utilisation, ever, because it
collects nothing.

**The solution, and it preserves the promise completely:** sell **redeemable codes**, not
seats. Generate App Store offer codes, hand the batch to the institution, and report
**redemptions** — a number that comes from App Store Connect, not from the app, and that
tells the buyer exactly what they need (how many students took it up) while telling them
nothing about any student. Pitch this as a feature: *"we can tell you how many of your
students started; we cannot tell you which ones, and neither can anyone else, ever."* For a
student counselling service that is a selling point, not an apology.

> **Verify before selling:** confirm current App Store Connect offer-code batch limits and
> whether one-time-use codes suit a campus distribution of your target size. Apple's promo
> codes (100 per version) are far too few; subscription **offer codes** are the right
> mechanism and support much larger batches, but confirm the ceiling in ASC before you quote
> a number to a buyer.

**Revenue model [est.].** A single-condition tool is a fraction of a full-platform contract.
Price at **$3,000–$8,000/year per institution** for a code allocation of 250–1,000 students.
Ten institutions at $6,000 = **$60,000 ARR** — which is more than the midpoint of the entire
organic consumer business in §1.1, from ten conversations.

**Effort:** 8–12 founder-weeks including a first pilot. **Risk:** medium — procurement
cycles are long, budgets are annual, and a solo founder with no trial data will be told no a
lot. This is why §2.1 comes first.

**Adjacent buyers, same mechanism:** NHS Talking Therapies services (UK — requires DTAC
assessment, budget for that), community mental health teams, employer-adjacent student
health plans, and secondary schools' pastoral services (16+ age rating permits this; be
careful, and do not chase it until the adult market works).

### 2.4 The book — the cheapest line in this document

`content/modules.ts` is roughly 12,000 words of finished, edited, tested prose plus
`content/exercises.ts`. It is a book that has already been written.

**The idea.** A paperback and ebook of the twelve modules, restructured as a workbook, on
Amazon KDP. Zero inventory, zero upfront cost.

**Why it is worth doing beyond the money:**
- It reaches the population that will not download an app about this — which, given
  concealment is a feature of the condition, is a large fraction of it.
- A book is a credibility artefact. "Author of [title]" opens the clinician and press doors
  in §5 that "solo app developer" does not.
- It is a permanent, un-deplatformable SEO surface with an ISBN.

**Revenue model [est.].** KDP paperback at $16.99 returns roughly $5–7 per copy after print
and royalty; ebook at $9.99 returns ~$7 at 70%. 300–2,000 copies in year one is a defensible
band for a niche self-help title with no author platform → **$2,000–$15,000.**

**Effort:** 2–3 weeks (restructure, cover, KDP setup). **Risk:** low. **Constraint check:**
all SAFETY.md content rules apply unchanged; the disclaimer language in `CONTENT_DISCLAIMER`
and Module 12 must be reproduced in front matter. No before/after imagery, no faces on the
cover, no treatment claims in the blurb or the subtitle.

### 2.5 Supporter edition — for the people who are being asked "does this look okay?"

Module 9 (`reassurance-is-checking-with-extra-steps`) is already a complete, well-written
guide for the partner, parent or friend on the receiving end. It tells them the reassurance
they are giving is the compulsion, and gives them a script. That audience has money, is
motivated, is not in distress themselves, and currently has nowhere to go.

**Constraint check — this is the important part.** It must be a **separate, standalone
product with no connection whatsoever to the sufferer's app or data.** No linking, no
sharing, no "invite your partner", no visibility into anything. The moment a supporter can
see a sufferer's data you have built a monitoring tool for a population defined by shame,
and that is catastrophic. Because there is no server, this is easy to guarantee — the two
apps have literally no way to communicate.

**Revenue model [est.].** A one-off $19.99 in-app purchase inside a small separate app, or a
$14.99 ebook. If 5% of Anneal's paid users have a supporter who buys **[est.]**, that is
small; the realistic volume comes from the supporter searching independently (*"how to help
someone with body dysmorphia"* is a real and well-populated query). **$3,000–$12,000/year.**

**Effort:** 2–4 weeks, most of the content exists. **Risk:** low-medium. The one failure
mode to design against: a supporter using it as ammunition. Frame every line as *what you
can stop doing*, never *what they should do*.

### 2.6 Localisation as a growth lever, with a real objection

**The case for.** Non-English App Store markets have materially less competition on these
exact terms, and Health & Fitness has the best revenue per install of any category
everywhere, not just in English. German, Spanish, Brazilian Portuguese and Japanese are the
usual first picks for mental health apps.

**The objection nobody else will raise.** `__tests__/copy.test.mjs` and
`__tests__/readability.test.mjs` enforce Anneal's tone — no shaming language, no appearance
evaluation, no treatment claims, eighth-grade reading level — **using English-language
pattern matching.** Translate the app and the entire enforcement mechanism silently stops
covering the shipped product. SAFETY.md's central claim, that the rules are tests rather
than review notes, becomes false in every locale but one.

**Therefore: localisation is not a translation job, it is a translation job plus a per-locale
safety review by a clinician who speaks the language, plus a per-locale test suite.** Budget
accordingly.

**Cost [est.].** ~18,000 words of user-facing content at $0.12–0.20/word professional rate =
**$2,200–$3,600 per language**, plus clinician review (~$800–$1,500), plus the test work.
Call it **$4,000–$6,000 all-in per language.**

**Recommendation:** one language, after English PMF is demonstrated, chosen by whichever
market shows the strongest organic signal in App Store Connect's territory breakdown — which
you will have for free by then (§4.1). Do not do four at once.

### 2.7 The clinician companion — kill this as a revenue line, keep it as a channel

The plain-text export already exists and is free on every tier, and SAFETY.md §11b says it
must stay that way because onboarding promises it.

**Who would pay?** Not the clinician. A therapist will not pay a subscription for a tool
their client uses; they have no budget line for it and the client is already paying. Not the
client — they already have it free, and gating it would break §11b.

**So do not build a paid clinician product.** Build a free one-page **clinician sheet**: what
Anneal is, what it is not, what the export contains, how the protocol maps onto standard CBT
for BDD, and the disclaimer. Put it on the marketing site as a PDF. Its job is to make a
therapist comfortable recommending the app, which is channel §5.3 — the highest-quality,
lowest-CAC acquisition available to this product.

That is the correct answer and it is worth more than the subscription you were considering.

### 2.8 Cosmetic surgery and dermatology clinics — real money, real brand risk

**The idea.** Module 5 already states that good cosmetic surgeons screen for BDD and turn
people down. Those clinicians have a live problem: they decline a patient, and have nothing
to hand them. Anneal is exactly what you hand them. Sell blocks of codes to clinics.

**The revenue is real.** Aesthetic clinics have marketing budgets, decide fast, and have no
procurement process. **$5,000–$25,000/year [est.]** across a handful of clinic groups is
plausible within a year — faster than universities by an order of magnitude.

**The risk is also real and it is not a data question.** Anneal's entire position is
built against the appearance industry. Any adjacency — a logo on a clinic's website, a
mention in a press story, a screenshot of the two brands together — can be read as the app
being funded by the industry that profits from the distress. In this population, that
perception is not recoverable.

**If you do it, the line is:** codes only, no co-branding, no clinic logo anywhere in or
near the app, no referral fee in either direction, no listing of clinic partners, and a
written refusal to work with any clinic that markets procedures as a solution to appearance
distress. And it never appears in your own marketing.

**This is a founder judgement, not an analysis. See §8, decision 8.**

### 2.9 Employer / EAP — sharpen it or skip it

EAP pricing is **$1–$5 PEPM** for traditional providers, with app-based entrants below $2
PEPM (Global Growth Insights / Kyan Health, 2026). A 2,000-person employer at $2 PEPM is
$48,000/year — but that is for a *full* EAP.

**The arithmetic kills the direct sale.** At 2% prevalence, a 2,000-person employer has ~40
people who need this. No benefits manager buys a single-condition tool for 2% of headcount
when their EAP already claims to cover everything.

**The version that works:** get listed inside someone else's platform. Modern EAP and
digital-front-door vendors assemble catalogues of specialist point solutions and pay revenue
share or a small per-referral fee. That is a partnership conversation, not a sales motion,
and the no-data posture again makes integration trivial.

**Verdict:** do not build an employer sales motion. Send five emails to catalogue-model
vendors after §2.1 gives you something to say. **Effort: 1 week. Expected value: uncertain
but the cost is trivial.**

### 2.10 Apple Health and Screen Time — defer, and here is exactly why

**Screen Time / DeviceActivity / FamilyControls: reject.** The obvious idea is to
corroborate reclaimed hours with real device usage — time in camera, time in social apps.
It requires an Apple entitlement, and more importantly it turns Anneal into a surveillance
tool that watches the user's appearance-related behaviour and reports it back to them. That
is a precision instrument for self-monitoring, aimed at a population whose disorder *is*
self-monitoring. It fails SAFETY.md §2's governing test.

**HealthKit: defer, don't reject.** A write-only integration (Mindful Minutes for grounding
and urge-surfing sessions) is technically clean, keeps data on-device, and would surface
Anneal inside the Health app — a modest discovery benefit. But: HealthKit data syncs to
iCloud at the user's option, which sits uncomfortably against the flat promise on onboarding
screen two, and Guideline 5.1.3 opens a review surface that APP-STORE.md §5.9 currently and
correctly lists as *not applicable*. The discovery benefit does not pay for complicating the
cleanest claim the product makes.

**Verdict: neither, in v1 or v2.**

### 2.11 Content licensing of the modules — decline in the general case

Licensing the twelve modules to another platform means the words appear somewhere you do not
control, without `PROOF_QUALIFIER`, without the disclaimer gate, without `copy.test.mjs`,
and potentially next to advertising for cosmetic procedures. Revenue **$5k–$30k [est.]**;
the cost is the one asset the product cannot replace.

**The only version worth doing:** licensing to a non-profit or an institution that is
already bound by the same standards (a charity, an NHS service, a university), at cost or
free, with the disclaimer and qualifier contractually required to travel with the text. That
is not a revenue line, it is §2.1 and §2.3 by another name.

---

## 3. Automation

Naming the tool, the cost, and what it replaces. **All of it fits inside free tiers.**

### 3.1 What exists to build on

| Asset | State |
|---|---|
| 344 tests, `node --test`, zero dependencies | Working. Runs in ~5s. |
| `npm run typecheck` | Working. |
| Web export (`dist/`) | Working — the whole app renders in a browser. |
| GitHub repo (`Borntosoar/steadyapp`) | Exists. |
| EAS project (`eas.json`, projectId set) | Configured, three profiles. |
| CI | **None. No `.github/workflows`.** |
| Screenshot harness | **None.** (The brief said otherwise.) |
| Marketing site | **None** — and this is a submission blocker (APP-STORE.md §5.2). |

### 3.2 The build order

**1. CI on GitHub Actions — 1 hour, free.**
Ubuntu runners, `npm test` + `npm run typecheck` on push and PR. GitHub Actions is free and
unlimited for public repos; a private repo gets 2,000 minutes/month free, and a 5-second
Node job will never approach it. *Replaces:* remembering to run the suite.

**2. The SAFETY.md greps as a CI job — 1 hour, free.**
SAFETY.md §1 and §2 document grep commands that must return nothing, and they currently run
only when a human remembers. Move them into the same workflow as a failing check. *Replaces:*
the single highest-consequence manual step in the repo.

```yaml
# .github/workflows/ci.yml — sketch
- run: npm test
- run: npm run typecheck
- name: safety invariants
  run: |
    ! grep -rEi 'takePicture|savePhoto|captureRef|toDataURL|MediaLibrary|getScreenshot' \
      app components lib store content types
```

**3. Screenshot generation — 1 day, free.**
This is the one that pays for itself immediately, and the web export makes it cheap. Add
Playwright as a dev dependency, serve `dist/`, seed `localStorage` with a fixture store
state (the app's persistence goes through AsyncStorage, which is `localStorage` on web), and
capture the six frames from APP-STORE.md §4 at Apple's required pixel dimensions for each
device class. Commit the fixture so the screenshots are reproducible and reviewable in a diff.

*Replaces:* a full day of manual simulator work per submission, multiplied by every device
size and every locale. Once localisation happens (§2.6) this becomes the difference between
localising and not.

*Cost:* $0. Playwright is free; runs on the GitHub Actions Ubuntu runner.

**4. Metadata and screenshot upload — `fastlane deliver`, free.**
fastlane is open source and free. `deliver` uploads the App Store Connect metadata tree
(`fastlane/metadata/en-US/…`) plus screenshots. Put the name, subtitle, keyword string,
description and promotional text from APP-STORE.md into that tree **so the listing lives in
version control** — which means the 99-character keyword field, the exact description, and
every future edit are reviewable and revertible.

*Replaces:* editing the App Store listing in a web form with no history.

**5. Binary build and submit — EAS, free tier.**
EAS Free allows 15 iOS builds/month; Starter is $19/month + usage; Production $199/month +
usage. **Stay on Free.** Fifteen builds a month is far more than a solo launch needs, and
EAS Submit handles the upload. `eas.json` already has a production profile with
`autoIncrement`. Add a workflow that runs `eas build --platform ios --profile production
--non-interactive` on a git tag.

*Replaces:* Xcode, certificates, and manual archive/upload.

**6. Release-note drafting — half a day, free.**
The commit style in this repo is already prose sentences describing user-visible change
("Price the trial at a length the store actually sells, and say what renews"), which is
better material than most conventional-commit logs. A script that collects commit subjects
since the last tag and writes them into a draft PR body is 30 lines. **Do not auto-publish
release notes.** Draft, founder edits, ship — the "What's New" text is customer-facing copy
in an app where copy is tested for tone.

**7. Marketing site + privacy policy — 1–2 days, free.**
Forced by APP-STORE.md §5.2 (hard blocker: the Privacy Policy URL field is mandatory and
there is currently no privacy policy link anywhere in the app or on the web). Astro or plain
HTML on GitHub Pages, $0.

The leverage: **generate the site's content pages from `content/modules.ts` at build time.**
One source of truth, twelve SEO pages that cannot drift from the app, and the whole thing
regenerates on push. This is simultaneously the privacy-policy host, the SEO channel (§5.5),
the clinician sheet host (§2.7), and the changelog. Highest ratio of outcomes to effort in
this section.

**8. Review-response drafting — half a day, free. Human in the loop, always.**
The App Store Connect API exposes `customerReviewResponses` — get, create, update, delete
(Apple Developer Documentation). A scheduled workflow can pull new reviews and open a GitHub
issue with a drafted reply.

**Do not auto-post replies.** A generated reply to a one-star review from someone in
distress, in this category, is the kind of thing that gets screenshotted. Draft only; you
press send. Apple holds responses in a moderation queue for up to 24 hours anyway, so there
is no speed advantage worth the risk.

*Replaces:* checking App Store Connect daily. *Cost:* $0 (vs AppFollow/Appbot at roughly
$50–$200/month for the same thing plus dashboards you do not need).

**9. Metrics pull — half a day, free.**
The App Store Connect API's analytics report endpoints deliver the metrics in §4 as files.
A weekly workflow that requests the reports, diffs them, and posts a summary to a GitHub
issue gives you a dated, version-controlled record of the entire funnel with no dashboard
subscription. *Replaces:* AppFigures/Appbot/Sensor Tower ($9–$500+/month).

**10. Crash monitoring — zero work, free.**
App Store Connect reports crashes with logs and no SDK. **Do not add Sentry, Firebase
Crashlytics or Bugsnag** — any of them flips the App Privacy label from "Data Not Collected"
to a Diagnostics disclosure (APP-STORE.md §5.7 and §6), which costs you the single strongest
line in the store listing in exchange for stack traces you can get from Apple. Include crash
count in the weekly pull from step 9.

**11. Support inbox — 1 hour, ~$0.**
There are no accounts, so support is email. Do not buy a helpdesk; at the volume this app
will produce, Gmail with filters and canned responses is correct. Zendesk/Intercom start
around $19–$99/seat/month and replace nothing you need.

The triage that matters is **safety triage**: a filter that flags any inbound message
containing crisis language and surfaces it immediately, with a pre-written response pointing
to the Support tab's regional lines and to emergency services. Write that response now,
before launch, not while reading the email. Everything else — refunds, restore, device
transfer — is a canned response.

### 3.3 Automation cost summary

| Tool | Cost | Replaces |
|---|---|---|
| GitHub Actions | $0 (free tier) | Manual test/typecheck/safety-grep runs |
| Playwright | $0 | ~1 day of manual screenshots per submission per locale |
| fastlane `deliver` | $0 | Hand-editing the store listing |
| EAS Build/Submit | $0 (Free: 15 iOS builds/mo) | Xcode, certs, manual upload |
| ASC API (reviews, analytics) | $0 | AppFollow/Appbot/AppFigures, $50–$200/mo |
| GitHub Pages | $0 | Web hosting, and it unblocks submission |
| Apple crash reporting | $0 | Sentry/Crashlytics — **and protects the privacy label** |
| Gmail filters | $0 | Zendesk/Intercom, $19–$99/seat/mo |
| **Total** | **$0/month** | **~$100–$400/month of tooling** |

Optional paid additions, in the order I would buy them: Apple Search Ads budget (§5.7),
professional translation (§2.6), participant incentives for moderated testing (§4.5). No
SaaS subscription belongs on that list.

---

## 4. Optimisation without analytics

### 4.1 What Apple gives you free, precisely

No SDK, no code, no privacy-label change. From Apple's own App Store Connect metrics
reference:

**Acquisition** — Impressions (total and unique devices, counting views over 1 second on
Today/Games/Apps/Search); Product Page Views (total and unique); Conversion Rate (downloads
÷ unique impressions); First-Time Downloads; Redownloads; Total Downloads; Updates.

**Usage** — Installations (including Family Sharing and redownloads); Sessions (2+ seconds);
Active Devices; Active in Last 30 Days; **Deletions**; Crashes with logs.

**Commerce** — In-App Purchases; Sales; Proceeds; Paying Users; **Refund rates**.

**Subscriptions** — Active plans by state (free trial, paid, billing retry, churned);
**trial-to-paid conversion rate**; offer conversion; **MRR**.

**Since the 2026 analytics overhaul** the full funnel — search impression → product page →
install — is explicit with a conversion rate at each step, **split by source: search, browse,
referrer, and App Store Ads**, with cohort views by acquisition month or campaign. Referrer
attribution is what makes §5's channels measurable.

**Also free and separately valuable:** the App Store **search terms** report tells you which
queries actually produced impressions — the only real feedback loop on the keyword field in
APP-STORE.md §2.

**Two limits, stated honestly.** Usage metrics (sessions, active devices, retention) are
derived only from users who opted in to sharing analytics with developers; Apple does not
publish that opt-in rate, so treat the *level* as unreliable and the *trend* as reliable.
And none of it sees inside the app.

**What this actually means: you have a complete funnel from impression to renewal, with
per-channel attribution and cohort retention, for free.** The only blind spot is between app
open and paywall. That is a real blind spot but it is one screen's worth, not a whole funnel.

### 4.2 The two Apple features that replace A/B testing

**Product Page Optimization.** Apple's native A/B test: up to **3 treatments** against your
default page, running up to **90 days**, testing app icon, screenshots and app previews.
Traffic split and statistical readout handled by Apple. Free. This directly tests the six
screenshot frames and captions in APP-STORE.md §4 — which is where most of your conversion
lives, since the first two or three frames appear in search results.

**Run this from week one of launch.** Test one thing: frame 1 caption (*"Hours back, not
looks better"*) against a privacy-led frame 1 (*"No account. Nothing uploaded."*). The
benchmarks doc argues the hours number is the differentiator; APP-STORE.md argues privacy is
the second-biggest objection in the category. Both are reasoned; PPO settles it for free.

**Custom Product Pages — up to 70 per app** (Apple doubled the limit from 35 in October
2025). Each has its own URL, its own screenshots and promotional text, **and reports
separately in Analytics.**

This is your channel instrumentation. Give the BDD Foundation one URL, a subreddit AMA
another, a clinician one-pager a third, the book a fourth, each university a fifth. You then
know, without any SDK, how many impressions and installs each channel produced and what each
converted at. That is per-channel CAC measurement inside a product with no analytics.

**This is the answer to "how do you optimise blind."** You largely don't have to.

### 4.3 On-device metrics, shown to the user, that never leave the phone

Already built: the Progress tab, `insightsSummary`, the reclaimed-hours series. The
principle from SAFETY.md §2's governing test — *which direction is this number supposed to
move?* — constrains any addition.

Two worth adding, both safe:

- **Programme position, stated plainly.** "You have completed 7 of 12 weeks." A count of
  actions taken, only goes up, no appearance content. Useful to the user and it is the
  honest renewal argument at month 12 (§1.2) — someone at week 7 of 12 has a reason to stay
  that no paywall copy can manufacture.
- **A user-composed, user-copied summary.** A button that produces a short plain-text
  paragraph the user can paste into a review, a message to a friend, or a clinician's notes.
  It is `insightsSummary` with a copy button. It costs nothing, transmits nothing, and it is
  the mechanism behind the one shareable artefact `SUBSCRIPTION-BENCHMARKS.md` §7 identifies
  as the distribution strategy.

### 4.4 Opt-in anonymous reporting — what it would cost, and the recommendation

**The recommendation is: do not build it. Not in v1, not in v2.**

Here is the trade written out.

**What you would gain:** onboarding drop-off, time-to-first-value, paywall view→tap,
week-by-week completion. Real, useful, currently missing.

**What it would cost:**

1. **The promise changes category.** Onboarding screen two currently makes an
   *unconditional* claim: no cloud, no analytics, nothing leaves the phone. Any opt-in
   telemetry converts that to *"we don't collect anything unless you let us."* Those are not
   the same sentence and every reader who has been burned before knows it. In a category
   where trust is the binding constraint (§1.4) that is the most expensive sentence in the
   product to weaken.
2. **The App Privacy label changes.** "Data Not Collected" is a specific, rare, customer-
   visible badge and it is screenshot frame 2's entire argument.
3. **The data would be bad.** Opt-in telemetry is self-selected toward the least anxious,
   most trusting users — the ones least representative of the population you are optimising
   for.
4. **SAFETY.md §6 says the point of having no server is that there is no policy to change
   later.** Adding an opt-in endpoint creates the server, and every future pressure to widen
   it starts from there.

**If it is ever built, the only defensible shape:** a single, user-initiated button (never a
prompt, never a background job, no SDK), that displays the exact JSON to be sent on screen
before sending, sends counts only and never text, and is off by default with no re-ask. Even
then, only after there is a specific question that the ASC funnel plus moderated testing
genuinely cannot answer. Today there is no such question.

### 4.5 Pre-launch qualitative — this is where the in-app signal actually comes from

**Moderated testing: 8–12 participants.** Nielsen's finding that five users surface most
usability problems holds per segment; two segments (people who identify with the condition;
people with subclinical appearance anxiety) means 10–12. Watch specifically: do they reach
the cost mirror (~90 seconds, the first proof point in `references/steady.md`), do they
complete onboarding, and what do they say at the paywall.

*Recruitment ethics:* do **not** run a BDD screening instrument to select participants. You
are not a clinician and screening implies diagnosis. Recruit on behaviour — "people who
spend significant time worrying about their appearance." Prolific or user-testing panels at
roughly **$12–$15/hour participant pay plus platform fee [est.]**; 12 sessions ≈
**$700–$900 all-in.**

*Safety protocol, written before the first session:* what you do if a participant becomes
distressed (stop, offer to end, provide the same regional crisis lines the app carries),
and a stated boundary that you cannot give clinical advice.

**Therapist interviews: 10–15.** Cheaper, faster, and higher-value than user testing for
this product, because clinicians are simultaneously your referral channel (§5.3), your
credibility check, and your route to §2.1 and §2.3. Ask three things: what do you currently
hand people between sessions; what would stop you recommending this; what would the export
need to contain for it to be useful in a session. Offer nothing but the finished clinician
sheet — no payment, no affiliate, ever.

**Community engagement: read, do not post.** r/BodyDysmorphia has ~44,600 members. Read six
months of it before writing a word of marketing copy. The vocabulary people actually use for
this — which is not the vocabulary in the modules — is the keyword research that no ASO tool
will give you. Engagement rules are in §5.4.

---

## 5. Growth channels, ranked for this product

CAC figures are **[est.]** unless stated. Time-to-first-result assumes a launched app.

### 5.1 ASO — rank 1

**CAC:** ~$0 marginal. **Time to first result:** 2–8 weeks after launch (Apple's index and
ranking take time to settle). **Ceiling:** §1.1 — 10k–60k downloads/year at maturity.

APP-STORE.md §2 has done this well. Three additions:

- Open Apple Search Ads Advanced (free) and pull the real popularity index before locking
  the keyword string (§1.5).
- Run PPO from launch week (§4.2).
- Watch the search terms report monthly; it is the only honest feedback on the keyword field.

**Ethical line:** `ugly` in the keyword field is correct and APP-STORE.md's reasoning is
right — a keyword is a match on a search, not content, and matching that query with an app
that refuses to rate anyone's face is the best available outcome for that search. The line is
at the screenshots: no manufactured emotional imagery, no faces, no implied before/after, no
claim in a caption that the app does not deliver.

**Failure mode:** ranking #1 on terms nobody searches. Mitigated by the Search Ads popularity
data. The second failure mode is chasing `esteem` and `confidence` — those are unwinnable at
launch and APP-STORE.md correctly frames them as year-two holds. Do not let a slow first
month tempt you into rewriting the keyword field toward volume; the intent is the asset.

### 5.2 BDD Foundation and equivalent charities — rank 2

The BDD Foundation (UK registered charity 1153753) describes itself as the only BDD-specific
charity in the world. It runs an email helpline and support groups. Adjacent bodies: the
IOCDF (US) with its BDD programme, ADAA, and national OCD charities.

**CAC:** ~$0 plus whatever you donate. **Time to first result:** 1–3 months.
**Volume [est.]:** a listing on a resource page is worth low hundreds of installs a year; a
newsletter mention or a webinar is worth 500–2,000 in a burst.

**How to do it without being the app founder mining a support charity:**
1. Offer first, ask second. The hardship tier already gives three months free with no form —
   tell them that mechanism exists and that their community qualifies by default.
2. Ask for a **listing**, not promotion. Resource pages are what they are for.
3. Offer the clinician sheet (§2.7) and the modules for their own use, free.
4. Give them a Custom Product Page URL (§4.2) so both sides can see what the referral
   produced.
5. Commit a percentage of revenue in writing, and pay it whether or not they list you.

**Ethical line:** never post into a support group as the founder. Never DM helpline users.
Never use the charity's name in marketing without written permission — implying endorsement
you do not have is both a legal and a moral problem here.

**Failure mode:** you are asking a small, volunteer-heavy charity to endorse an untrialled
commercial product. Expect a no until §2.1 exists. That is the correct sequencing, not a
setback.

### 5.3 Clinician referral — rank 3, and the highest quality traffic available

**CAC:** ~$0 marginal, high time cost. **Time to first result:** 3–6 months.
**Volume [est.]:** a therapist who likes it might recommend it to 5–20 clients a year. Fifty
engaged clinicians = 250–1,000 high-intent installs a year, converting far above the 2.1%
median because the recommendation came from a trusted source.

**What it needs:** the clinician sheet (§2.7), the export in a form a clinician can read in
30 seconds, and — the real unlock — §2.1.

**Ethical line:** no referral fees, no affiliate codes, no commissions, in either direction.
The moment money moves between Anneal and a clinician for referrals, every recommendation
becomes suspect, and in this category that is fatal. Free institutional access is fine;
payment is not.

**Failure mode:** clinicians will not recommend an untrialled tool, and they are right not
to. This channel is gated on §2.1 and there is no way around it.

### 5.4 Reddit and Discord — rank 4, highest risk of self-inflicted damage

r/BodyDysmorphia: ~44,600 members. Related: r/BDD, r/OCD, r/socialanxiety, and several
Discord servers.

**CAC:** $0. **Time to first result:** immediate — in either direction.
**Volume [est.]:** one mod-approved post or AMA on a 44k subreddit produces 50–300 installs.
An unapproved promotional post produces a permanent ban, a screenshot, and a reputation.

**Exactly how to engage:**
1. **Message the moderators first.** Always, without exception. Ask what is permitted.
2. **Disclose in every single comment.** "I built an app for this" in the comment itself,
   not in a profile bio.
3. **Give the content away with no link.** The twelve modules are genuinely good writing
   about mechanism. Post module 2 (`why-checking-makes-it-worse`) as a plain text post,
   attributed, with no call to action. If people ask what it is from, answer honestly.
4. **AMA only if invited.** Never propose one in a support community.
5. **Never reply to a person describing distress with anything that mentions the product.**
   This is SAFETY.md §12 applied outside the app: using someone's suffering to time an offer
   is the same act whether it happens in a paywall or a comment thread.

**Ethical line:** the founder of a commercial product cannot participate in a support
community as a peer. You are either transparently a builder asking for feedback, or you are
not there.

**Failure mode:** one bad post ends the channel permanently and the screenshot outlives the
app. Given the asymmetry, the correct default is to read for months and post rarely.

### 5.5 SEO and content — rank 5, slow but compounding

The site from §3.2 step 7, generated from `content/modules.ts`. Target queries the App Store
cannot reach: *"how to stop checking mirrors"*, *"is body dysmorphia the same as low self
esteem"*, *"how do I help my partner with body dysmorphia"* (which is also §2.5's funnel).

**CAC:** ~$0 marginal, high time. **Time to first result:** 6–12 months.
**Volume [est.]:** a 15-page site of genuinely good content on low-competition long-tail
health queries reaches 1,000–5,000 sessions/month within a year, converting to app installs
in the low single digits — call it 200–800 installs/year at maturity.

**Failure mode, and it is specific:** health content is held to elevated quality standards
by search engines, and an anonymous site with no named author and no credentials will not
rank against charity and health-service domains no matter how good the writing is. **The fix
is a named clinical reviewer** — one clinician willing to be listed as having reviewed the
content. That is another output of the §5.3 conversations, and it is worth more than any
amount of keyword work.

**Ethical line:** write for the reader. The moment a page is written for a query rather than
a person, this category punishes it — and the tone tests that protect the app do not protect
the website.

### 5.6 Press — rank 6, unpredictable

**CAC:** $0. **Time to first result:** unpredictable; 0–12 months.
**Volume [est.]:** one piece in a national outlet is worth 1,000–10,000 installs in a week
and almost nothing afterwards. Treat it as a spike, not a channel.

**The angle that works** is not "new app for body dysmorphia." It is **"the app that refuses
to let you take a photo"** — a product built by deliberately removing every feature the
category is built on. SAFETY.md is, frankly, the most interesting document in this repo and
it is a story in itself.

**Ethical line, non-negotiable, put it in the media kit:** no before/after imagery, no stock
photography of distressed people looking in mirrors, no case studies of identifiable users,
no prevalence statistic without its source. Supply your own no-face imagery (the
`Atmosphere.tsx` scenes exist for exactly this) so the picture desk does not reach for a
stock mirror shot.

**Failure mode:** a well-meaning piece that illustrates itself with the exact imagery the
product exists to refuse, and readers with the condition are harmed by the article that was
meant to help them. Refuse coverage that will not agree the imagery terms.

### 5.7 Apple Search Ads — rank 7, as measurement not scale

**Show the arithmetic before spending anything.** Net revenue per download from §1.1 is
~$1.40 year-one, ~$0.66 by day 60. Apple Search Ads on niche terms typically runs
$0.50–$2.00 cost-per-tap with 30–50% tap-to-install **[est. — no verified 2026 figure for
this vertical; the network returned no primary source]**, implying **$2–$6 CPI.**

**That is unprofitable against $1.40 unless high-intent exact-match terms convert several
times better than the 2.1% freemium median** — which they plausibly do, since someone
searching `bdd` is a different person from someone browsing. But "plausibly" is not a budget.

**Recommendation:** spend $10–$20/day for 30 days on brand plus the six winnable exact terms
only, and treat the spend as **buying the popularity and conversion data**, not buying users.
After 30 days you will know your real CPI and your real conversion by term, from Apple, for
about $450. Then decide.

**Ethical line:** no keyword bidding on competitor brand terms in the mental health space,
and never bid on crisis-related queries.

### 5.8 Founder-led social — rank 8, conditional

The reclaimed-hours card is, per `SUBSCRIPTION-BENCHMARKS.md` §7, the one shareable artefact
in this category that does not out the person sharing it. That is a real insight and it
argues for a social presence.

**But:** short-form content about appearance anxiety, made by a founder on camera, is a
person's face being used to market a product about faces. The failure mode is obvious.

**If you do it:** no face, no voice-over-selfie, no "my story" content. Text-on-screen or
voice-only, about the mechanism — the same register as the modules. The hours framing is the
hook: *"appearance worry costs the average person one to five hours a day."*

**Verdict: optional, and last.** Nothing else on this list depends on it.

---

## 6. The 90-day plan

Assumes launch is the goal and the founder is working on this substantially full-time. Week
1 starts Monday.

### Phase 1 — Unblock submission (weeks 1–4)

Everything here is a hard blocker or one step from one.

**Week 1**
- **Check the Apple Developer Program enrolment type.** If it is Individual, start the
  Organization conversion today — D-U-N-S plus days-to-weeks of processing (APP-STORE.md
  §5.1). This is the longest-lead item in the entire plan and everything else is downstream.
- Open an Apple Search Ads Advanced account; pull popularity scores for every term in
  APP-STORE.md §2; revise the keyword string if the data disagrees.
- Complete the age-rating questionnaire (16+, answers already written in APP-STORE.md §6).
- Enrol in the App Store Small Business Program — 15% not 30%, takes minutes, and every
  revenue figure in this document assumes it.
- Stand up CI (§3.2 steps 1–2).

**Week 2**
- Wire RevenueCat. `hooks/useEntitlement.ts` has the integration point and
  `lib/entitlement.ts` is already shaped for it. Stubbed purchases are a rejection under
  2.1/3.1.1 (APP-STORE.md §5.3).
- Update the App Privacy label in the same submission (§5.7) — Purchase History and User ID,
  not linked, not tracking.
- Site + privacy policy live on GitHub Pages; add the in-app link via `Linking.openURL`, not
  a WebView (this preserves the "No" answer on Unrestricted Web Access).

**Week 3**
- Paywall legal disclosure: privacy policy and EULA links beneath the purchase button
  (APP-STORE.md §5.4 items 2–3).
- Confirm the `trial-ending` moment actually fires — the paywall promises a reminder and a
  promise the app does not keep is a 2.3 problem and a consumer-protection problem.
- Screenshot harness (§3.2 step 3); generate all six frames per APP-STORE.md §4.
- fastlane metadata tree committed (§3.2 step 4).

**Week 4**
- App Review notes (draft exists in APP-STORE.md §5.3).
- Full pre-submission checklist from APP-STORE.md.
- **TestFlight build to 20–30 external testers.**

> **GATE 1 (end of week 4): can this be submitted?**
> Organization account confirmed, privacy policy live and linked, purchases real, paywall
> disclosure complete, age rating done. **If the account conversion is still pending,
> everything after this slips — do not try to work around it.**

### Phase 2 — Evidence and first contact (weeks 5–8)

Runs in parallel with review. Do not sit and wait.

**Week 5**
- 10–12 moderated sessions (§4.5). Watch for cost-mirror arrival and onboarding completion.
- Ask TestFlight testers to voluntarily send export files; analyse; delete.

**Week 6**
- 10–15 therapist interviews (§4.5). Produce the clinician sheet (§2.7) from what they say.
- Write the safety-triage canned responses and the support filters (§3.2 step 11).

**Week 7**
- **Submit.** Expect a rejection round; APP-STORE.md §5 lists what for.
- Contact 5–8 academic groups (§2.1). One page: what it is, what is already built, what you
  are offering, what you are asking. Attach SAFETY.md — it is the most persuasive artefact
  you have.
- Contact the BDD Foundation and the IOCDF with the offer-first approach (§5.2).

**Week 8**
- Fix rejections; resubmit.
- Grant landscape scan against the entity's actual jurisdiction (§2.2, §8 decision 4).
- Begin the book restructure (§2.4) — it is the best use of dead time during review.

> **GATE 2 (end of week 8): is there a route to credibility?**
> At least one academic group in conversation, and at least one clinician willing to be
> named as a content reviewer. **If neither, §2.3, §5.3 and §5.5 are all blocked and the
> plan collapses back to consumer ASO only — which §1.1 says is a $15k–$85k business. Decide
> then whether that is the business you want.**

### Phase 3 — Launch and learn (weeks 9–13)

**Week 9 — launch**
- Live. Start PPO test 1 immediately: hours-led frame 1 vs privacy-led frame 1 (§4.2).
- Create Custom Product Pages for each named channel (§4.2).
- Apple Search Ads: $15/day, exact match, six terms, 30 days, as measurement (§5.7).
- Review-draft workflow live (§3.2 step 8).

**Week 10**
- First weekly metrics pull (§3.2 step 9). Establish the baseline: impressions → page views
  → conversion rate → installs → sessions → trial starts.
- Respond to every review personally, within 24 hours, in the app's own register.

**Week 11**
- Book to KDP.
- First university conversations, if §2.1 has produced anything to point at (§2.3).
- Ship a v1.1 with whatever the moderated sessions found. Onboarding drop-off fixes rank
  above everything else — time-to-first-value is the highest-leverage change available and
  it is the one thing you learned qualitatively.

**Week 12**
- Grant application drafted for whichever programme fits the jurisdiction.
- Read PPO results (needs ~2–4 weeks of traffic; if volume is too low to call it, say so
  rather than reading noise).
- Trial cohort from week 9 begins converting — first trial-to-paid number lands here (30-day
  trial). **This is the first real commercial signal in the entire plan.**

**Week 13**
- Full review against the numbers below.

> **GATE 3 (end of week 13): which business is this?**
>
> | Signal | Source | Read |
> |---|---|---|
> | Product page conversion rate | ASC, free | Below ~3%: the listing is wrong. Above ~8%: the listing is working, the problem is volume. **[est. thresholds — App Store conversion varies widely by category; treat as directional]** |
> | Trial start rate | ASC subscription metrics | Compare to Adapty's 11.2% install→trial |
> | Trial→paid | ASC | Compare to Health & Fitness 35% |
> | Deletions vs installs | ASC | The retention signal you have |
> | Total downloads | ASC | Against the 10k–60k/yr maturity band in §1.1 |
> | Academic partnership | Conversations | Yes/no decides §2.2, §2.3, §5.3 |
>
> **The decision at gate 3 is where the next 90 days go: deeper into consumer ASO, or into
> institutional and grant revenue.** §1.1 says consumer alone tops out around $85k/year. If
> the week-13 numbers are tracking the low end of that band, the institutional path is not a
> diversification — it is the business.

---

## 7. Considered and rejected

Written down so they do not get re-proposed in three months.

| Idea | Why it dies |
|---|---|
| **Weekly subscription** | Highest-LTV configuration in the data ($49.27/12mo). Day-380 retention 5.5% — the model makes money from people who quit. `SUBSCRIPTION-BENCHMARKS.md` §5 already rejected it; it stays rejected. |
| **Referral / invite programme** | Sharing an app called *Body Image Anxiety* identifies the sharer as having the condition. A referral scheme monetises disclosure by a population defined by concealment. The hours card is the only shareable artefact, precisely because it discloses nothing. |
| **Influencer marketing in beauty/fitness/wellness** | The creators with reach in appearance-adjacent verticals make their living from the mechanism this app interrupts. Brand adjacency alone is disqualifying. |
| **In-app advertising** | Destroys the privacy label, requires an SDK, and the ad networks that serve health apps will serve cosmetic-procedure creative to a BDD audience. |
| **Analytics SDK, even a "privacy-friendly" one** | §4.4. The promise is on screen two; the App Privacy badge is screenshot frame 2's entire argument. |
| **Crash-reporting SDK** | Apple already gives you crashes for free; an SDK costs you the "Data Not Collected" label. §3.2 step 10. |
| **Selling anonymised aggregate data to researchers** | There is no data. This only becomes possible by building the thing that must not be built. |
| **AI chat companion** | SAFETY.md §7. Also the single most-requested feature you will receive; the answer is still no, and the reasoning is written down. |
| **Screen Time / DeviceActivity integration** | §2.10. A precision self-monitoring instrument for a self-monitoring disorder. |
| **Android in the first 90 days** | Every document in this repo is Apple-specific, iOS pays materially better per install, and a solo founder shipping two platforms at launch ships neither well. Revisit at month 6. |
| **A web version of the app** | Requires a server, or a browser-storage promise that is far weaker than the on-device one. The privacy claim is the moat; do not water it down for reach. |
| **Discount / launch pricing / bundles** | The discounted cohort in annual Health & Fitness churns worse than the full-price cohort. Already argued in `lib/entitlement.ts`; repeated here because it will be proposed again the first slow month. |
| **Paid clinician subscription** | §2.7. Nobody is the buyer. Free, as a referral asset, is worth more. |
| **Direct employer/EAP sales motion** | §2.9. 2% prevalence does not justify a PEPM line item. Catalogue listing only. |
| **General content licensing** | §2.11. The words leave with the qualifier stripped off. |
| **Auto-posted review responses** | §3.2 step 8. Human in the loop, always, in this category. |
| **Any use of "clinically proven", "treatment", "therapy" in store metadata** | APP-STORE.md §5.5. `copy.test.mjs` does not cover store metadata, so this is a discipline problem, not a test problem. |

---

## 8. What you must decide, and what I can just build

### Decisions that need you

1. **Apple Developer account type.** Individual or Organization? If Individual, the
   conversion starts today and everything else waits on it. *(Blocker. APP-STORE.md §5.1.)*

2. **Pay-once positioning.** §1.2 computes expected annual LTV at ~$88 net against ~$127 net
   for pay-once, under a 30% year-two renewal estimate for a finite programme. If that
   estimate is right, pay-once should be on the default paywall view, not behind a link — and
   `references/steady.md` should be amended. **The counter-argument is that you do not know
   the renewal rate and will not for a year.** The genuine choice: promote pay-once now and
   take certain money, or hold the current structure and find out what annual retention
   actually is. My recommendation is to hold for 12 months *and* raise pay-once to $179 —
   which tests price elasticity on the product least likely to be price-sensitive, at no risk
   to the subscription line.

3. **Institutional path: now or after gate 3?** Starting §2.1 and §2.3 in week 7 costs
   consumer-launch focus. Waiting until week 13 costs a quarter on a 6–18 month procurement
   cycle. **Recommendation: start §2.1 in week 7 (it is five emails), hold §2.3 until gate
   3.**

4. **Entity jurisdiction.** This decides the entire grant strategy. US entity → NIMH SBIR at
   up to $323,090 is the single largest number in this document. Canadian → Mitacs + CIHR +
   IRAP, smaller but far easier and it pairs naturally with §2.1. UK → Wellcome and NIHR
   i4i. **I need to know where the entity is before §2.2 can be made concrete.**

5. **Academic partnership: are you willing to give free institutional access and 3–5 weeks of
   engineering support for a trial that might return a null result?** If no, say so now and
   §2.1, §2.2, §2.3, §5.3 and §5.5 all come off the table together, and the plan is consumer
   ASO with a $15k–$85k ceiling.

6. **Localisation: yes/no, and are you willing to fund a per-locale clinical review?** §2.6 —
   translation without it silently voids the tone-enforcement guarantee that SAFETY.md is
   built on. If you will not fund the review, do not localise.

7. **Budget ceiling.** Two line items: ~$450 for 30 days of Apple Search Ads as measurement,
   and ~$800 for moderated testing participants. Both are recommended. Everything else in
   this document runs at $0.

8. **Cosmetic and dermatology clinic channel: in or out?** §2.8. Real money, real and
   possibly unrecoverable brand risk. This is a values question and it is yours.

9. **Marketing site scope.** It has to exist — the privacy policy is a submission blocker.
   The question is whether it is one page or the fifteen-page content asset in §5.5. My
   recommendation is fifteen pages generated from `content/modules.ts`, because the marginal
   cost over one page is about a day and it unlocks the SEO channel.

### What I can build without asking

All of this is additive, none touches SAFETY.md's constraints, and none needs a decision:

- `.github/workflows/ci.yml` — tests, typecheck, and the SAFETY.md greps as a failing check
- The Playwright screenshot harness with a committed fixture state, all six frames, every
  required device size
- `fastlane/metadata/` populated from APP-STORE.md so the store listing lives in git
- The App Store Connect API scripts: weekly metrics pull, review fetch, review-response
  drafting into a GitHub issue
- The release-notes drafter
- The marketing site scaffold, generated from `content/modules.ts`, plus the privacy policy
  text
- The clinician sheet (§2.7)
- Support-inbox filters and the pre-written safety-triage response
- The book manuscript restructured from `content/modules.ts`

---

## Sources

**Read directly:** `README.md`, `SAFETY.md`, `docs/SUBSCRIPTION-BENCHMARKS.md`,
`docs/APP-STORE.md`, `lib/entitlement.ts`, `content/modules.ts`, `content/copy.ts`,
`content/proof.ts`, `.claude/skills/value-first-growth/SKILL.md` and `references/steady.md`,
`package.json`, `eas.json`, `app.json`, and the test suite (344 tests, all passing at time of
writing).

**External, via search — the network blocked direct access to `stora.sh`, so the 2026
analytics-overhaul details come from search summaries rather than the primary article:**

- [App Store Connect performance metrics reference — Apple Developer](https://developer.apple.com/help/app-store-connect/reference/performance-metrics/)
- [Customer Review Responses — Apple Developer Documentation](https://developer.apple.com/documentation/appstoreconnectapi/customer-review-responses)
- [App Store Small Business Program — Apple Developer](https://developer.apple.com/app-store/small-business-program/)
- [App Store product page optimization: how to run A/B tests (2026) — MobileAction](https://www.mobileaction.co/blog/product-page-optimization/)
- [Custom Product Pages in 2026: 70 Pages, Keywords, Limits — RespectASO](https://respectaso.com/blog/custom-product-pages-app-store-guide-2026/)
- [SBIR/STTR application process — National Institute of Mental Health](https://www.nimh.nih.gov/funding/sbir/application-process)
- [Mental Health Award: Accelerating scalable digital mental health interventions — Wellcome](https://wellcome.org/research-funding/schemes/mental-health-award-accelerating-scalable-digital-mental-health)
- [The Wellcome Mental Health Data Prize UK — MHIN](https://www.mhinnovation.net/events/wellcome-mental-health-data-prize-uk)
- [Invention for Innovation (i4i) — NIHR](https://www.nihr.ac.uk/funding-programmes/invention-for-innovation)
- [£1.5 million NIHR funding for 17 health tech projects — HTN Health Tech News](https://htn.co.uk/2025/10/13/1-5-million-nihr-funding-for-17-health-tech-projects-for-children-and-young-peoples-mental-health/)
- [SilverCloud platform for higher education — SilverCloud by Amwell](https://www.silvercloudhealth.com/uk/higher-education)
- [Top 10 Employee Assistance Program (EAP) Services Companies in 2026 — Global Growth Insights](https://www.globalgrowthinsights.com/blog/employee-assistance-program-eap-services-companies-1152)
- [Modern EAP vs Traditional EAP: 7 Differences in 2026 — Kyan Health](https://www.kyanhealth.com/post/modern-eap-vs-traditional-eap)
- [Body Dysmorphic Disorder Foundation](https://bddfoundation.org/)
- [The Body Dysmorphic Disorder Foundation, charity 1153753 — Charity Commission](https://findthatcharity.uk/orgid/GB-CHC-1153753)
- [r/BodyDysmorphia subreddit stats](https://subredditstats.com/r/BodyDysmorphia)
- [Subscriptions, plans, and add-ons — Expo Documentation](https://docs.expo.dev/billing/plans/)
- [Expo Application Services pricing](https://expo.dev/pricing)
- [App Store vs Google Play Review Replies: Technical Guide (2026) — Reply Argus](https://www.replyargus.com/blog/app-store-vs-google-play-review-replies)

**Could not verify:** per-student licensing rates for SilverCloud or Togetherall (both quote
bespoke; no public figure exists that I could find), Apple Search Ads cost-per-tap benchmarks
for this specific vertical in 2026, current App Store Connect offer-code batch limits, and
the developer-analytics opt-in rate (Apple does not publish it). Every figure derived from
those gaps is marked **[est.]** above.
