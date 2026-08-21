# Direction: what to build, and what it can be worth

> **Second council, appended at §8.** The founder set a target of $1m+/yr and asked for
> blue-ocean mental-health markets. Two of three advisors reported; the market scout failed
> mid-run on a session limit, so the blue-ocean market survey is **incomplete and its gap is
> named rather than papered over**. What did report converged, from different directions, on
> the same finding: **the market is not the binding constraint.**

Four advisors were briefed independently against one question — **what should be built, in or
near this space, that will genuinely sell?** — with two constraints supplied by the founder:
a target of **$1m+/yr**, and a preference to **keep the engine and swap the condition**.

They were given the same repository and the same commercial diagnosis in `GROWTH.md` §1, and
deliberately different mandates: demand and willingness to pay; business model and structure;
a technical asset inventory; and a red team whose job was to argue against the other three.

This document records what they agreed on, what they disagreed on, and what it means for the
two constraints. It is a decision record, not a plan — `GROWTH.md` §6 remains the plan.

---

## 1. The headline, stated plainly

**No path in this analysis reaches $1m+/yr, and all four advisors converged on that
independently.** The largest modelled outcome is roughly **$220k–$780k at year three, central
case ~$330k** — and that case is not a better app. It is a training-and-institutional
business that happens to own an app, which is a materially different job made of emails,
procurement forms, course production and conference attendance.

That is not a refusal of the target. It is the answer the evidence supports, and the target
should be re-examined against it rather than the analysis re-run until it agrees.

### What $1m/yr actually requires

| Route | Volume needed |
|---|---|
| At `GROWTH.md` §1.1's year-one $1.40 net/download | ~714,000 downloads/yr |
| At the day-60 sanity check of $0.66/install | ~1,515,000 installs/yr |
| Holding ARPU (~$80 net/payer), at the current 2.1% soft-paywall conversion | ~595,000 downloads/yr |
| Same, at a 10.7% hard-paywall conversion | ~117,000 downloads/yr |
| B2B instead | 33 contracts at $30k, or 10 at $100k |

Against a modelled ceiling of 10k–60k downloads/yr, the *cheapest* consumer route is about
**2x the top of that range** and the rest are 10–25x. Note also that the 10.7% route is the
**hard paywall**, which `SAFETY.md` §4 and §12 reject for a stated reason — it gates help
from the most distressed users, who are precisely who the free tier exists for. The volume
arithmetic and the safety constraints are not independent.

---

## 2. Where all four agreed

**The money in this category is human-delivered clinical service, not self-help
subscriptions.** NOCD is at $201M ARR but it is insurance-billed teletherapy — 50,000+
clinician sessions a month. BetterHelp is $1.03B and is therapy. Midi Health is a $1B
hormone-telehealth clinic. Daybreak and BeMe sell clinical staffing to districts and health
plans. The largest *pure self-help* OCD app (150,000+ users) discloses no revenue at all.

That pattern held across nine adjacent conditions. **Every space with proven willingness to
pay is paying for a clinician**, and this product has deliberately declined to be that
(`SAFETY.md` §6, `GROWTH.md` §2.7).

**One counterexample, and it is the only one found: Rootd** — panic and anxiety, bootstrapped,
2M+ users, 7-figure ARR, zero employees. That is the shape the $1m+ target describes. It is
also a much larger and much more crowded market than anything reachable by swapping this
engine's content, and reaching it is a different product in a different category, not a
content swap.

**Health anxiety is protocol #2, if there is one.** All four arrived at it separately:

- *Mechanism* — checking, reassurance-seeking, symptom-googling and avoidance are structurally
  the same loop. David Veale, already cited in `content/proof.ts` for BDD, wrote the standard
  CBT self-help canon for health anxiety too.
- *Reachability* — and this is the real argument. BDD's binding constraint is that most
  sufferers have never had the condition named to them. Health anxiety sufferers **have**; it
  is a household phrase and people make jokes about "Dr Google" at their own expense. It is
  not so much a bigger market as a **reachable** one.
- *Cost* — ~31 founder-days at ~75% code reuse. `app/journal.tsx` (537 lines) and
  `app/grounding.tsx` (501 lines) contain **zero** BDD vocabulary and transfer unmodified.
  `app/mirror.tsx` + `MirrorSurface.tsx` + prompts — 753 lines — are **deleted with nothing
  built to replace them**, because the exposure is sitting with uncertainty, which is the urge
  timer that already exists.

**Separate apps, not one multi-protocol app.** App Store discovery is condition-specific, and
the entire ASO thesis in `APP-STORE.md` §2 rests on ranking for `bdd`, `dysmorphia`,
`checking`. A multi-condition app ranks for none of them well and trades the one working
acquisition channel for a worse one. Same engine, separate listings.

---

## 3. Where they disagreed, and the disagreement worth acting on

### The business advisor: break credibility, and the missing revenue line

Of the three constraints — TAM, LTV, credibility — the argument is that **credibility is the
cheapest to break, the only one that compounds, and the *cause* of the TAM constraint rather
than a sibling of it.** The 90–95% of sufferers who never search are reachable only through
someone who already has their attention: a GP, a therapist, a university service, a charity
helpline, a surgeon who just declined them. Every one of those doors is locked by the same
missing thing.

And credibility is a **ladder, not a trial**. `GROWTH.md` §2.1 treats "a trial" as the unit,
which is 24–48 months to publication. Tiers 1 and 2 — a **named clinical advisor** and a
**preregistered protocol** (OSF is free and instant) — cost roughly six weeks and £300 and
satisfy most of the institutional gate. The outreach email should ask to be named as clinical
reviewer, not to run an RCT: same emails, same week, three-to-eightfold difference in yes-rate.

**The largest single omission in `GROWTH.md` §2 is clinician training.** §2.7 correctly kills
the paid clinician *companion* and then wrongly concludes clinicians are not buyers. They are
not buyers of software. They are buyers of **accredited CPD/CE credit**, annually, because
registration requires it — in a specialty where competent BDD training is genuinely scarce.
Modelled at ~$23k / $77k / $134k net over three years.

Its real value is not the revenue. Every registrant is a trained referrer, and
`GROWTH.md` §5.3 already estimates 5–20 client recommendations per engaged clinician per year.
**It is the only line in any of these documents with negative customer acquisition cost** —
the answer to §1.4's "this product cannot buy its way in" is that you get paid to teach your
way in. It is also unvalidated, and 10–15 therapist interviews already scheduled can test it
for free by adding one question.

### The red team: ship first, and the number that triggered this is wrong

See the correction now inline in `GROWTH.md` §1.1. In short: a **lifetime** search propensity
is multiplied into an **annual** count (potentially 10x too high), the denominator excludes the
subclinical population the keywords already reach (3–10x the other way), and the 2.1%
conversion figure is a cross-category median applied to ~100% high-intent search traffic
(2.5–4x). Seven stacked estimates give the result a 30–100x band.

The structural argument: the app is **~95% built and 0% validated**. A pivot converts that
into 0% built and 0% validated, while the stated problem is "will it sell" — which the pivot
makes harder to answer and moves twelve months further away. Every remaining blocker
(incorporate, D-U-N-S, Organization enrolment, wire billing, host the policy) **recurs
identically in any pivot**, so a pivot buys no relief from the actual bottleneck.

Shipping costs 4–8 weeks and roughly $1,500 and replaces every disputed estimate with fact
from App Store Connect. No proposal in the council can produce a shipped product for less.

---

## 4. Two things nobody was asked about, and both matter

**The SOAR problem.** `legal/entity.json` records the correct decision that this app publishes
under its own entity, separate from SOAR — but the separation has to extend past the corporate
register. **An app for body dysmorphia whose founder publicly runs an apparel and aesthetics
brand is exactly the `GROWTH.md` §2.8 brand risk, arriving for free and without any clinic
being involved.** One journalist connecting a founder bio is all it takes, and §1.4 is explicit
that in this population that perception is not recoverable. Concretely: separate Apple
Developer accounts, separate contact addresses (already true), no shared founder biography
across the two brands' public surfaces, no cross-promotion in either direction, ever. Free to
maintain now, impossible to unwind later.

**Venture capital is structurally incompatible with this product.** A venture-backed version
would be *required*, by the arithmetic of the return, to do the things `SAFETY.md` forbids:
extend the programme to raise LTV, add telemetry to optimise the funnel, buy growth in a
category where the performing creative is banned. The constraints are the product. Grants,
SR&ED and institutional revenue are not second-best capital here — they are the only capital
whose incentives point the same way as the product's.

---

## 5. Corrections to other documents

| Where | Correction |
|---|---|
| `GROWTH.md` §1.1 | Units error in the funnel — now flagged inline. Do not use "$15k–$85k" as settled. |
| `GROWTH.md` §3.1 | Said 344 tests and "no CI of any kind". It is 541 tests and CI has existed for some time. Fixed. |
| `GROWTH.md` §2.2 | The SBIR advice may be **actively wrong** — eligibility looks through to ultimate beneficial ownership, so a US subsidiary of a Canadian-owned parent does not qualify. Verify before spending a week incorporating one. |
| `GROWTH.md` §2.2 | Omits **SR&ED** — a 35% *refundable* credit for a CCPC, non-competitive, paid as cash. Content writing does not qualify and ordinary app work usually does not, but the encrypted storage layer and migration handling plausibly do. Needs a contemporaneous time log started on day one; retroactive logging is worth nothing. |
| `GROWTH.md` §2.3 | Has an unnamed hard blocker: **Android**. No university buys a mental-health tool serving only the iPhone half of its student body — that is an equity-of-access failure and it ends the conversation in procurement. The chain is credibility → institutional → Android. |
| `GROWTH.md` §8 decision 2 | Recommends holding pay-once off the default paywall for 12 months. Two advisors disagree: pay-once nets ~44% more, finiteness sold honestly is a trust asset that cannot be copied by a product that does not finish, and a $149 unit price is what institutional procurement understands. |
| `SUBSCRIPTION-BENCHMARKS.md` §5 | Trial and "Lifetime" rows were stale; corrected separately. |

---

## 6. What this leaves

Three coherent options. They are genuinely different jobs, and the choice is not primarily
commercial.

1. **Ship Anneal, then decide.** 4–8 weeks and ~$1,500. Replaces a 30–100x estimate band with
   App Store Connect facts. Costs nothing that any later option needs, because every blocker
   is shared. This is the red team's recommendation and no other advisor argued against it.
2. **Ship, then build the credibility ladder and the clinician course.** Targets ~$330k at year
   three. Requires becoming a person who does institutional sales and course production.
3. **Ship, then protocol #2 (health anxiety) on the same engine.** ~31 days at ~75% reuse.
   Modelled at $42k–$168k/yr at maturity. The cheapest test of the engine thesis is one week
   of writing protocol #2's twelve-week structure *on paper* against `lib/protocol.ts` and
   `lib/reclaimed.ts`, to find out what breaks before committing.

They are not exclusive, and 2 and 3 both assume 1.

**What none of them is, is $1m+/yr.** If that target is firm, the honest conclusion is that it
is not reachable from this engine in this category, and the question to answer first is not
which condition to build for — it is whether the target or the constraints move.

---

## 7. The technical liabilities any of this inherits

From the code audit, so they are priced rather than discovered:

- **`normalise()` in `lib/storage.ts` is a 185-line hand-written mirror of `AppState`**, with
  no compiler enforcement that `types/index.ts`, `normalise()` and `exportText()` agree. That
  is the correct trade for one app and a tax on every change forever for a multi-protocol
  plan. It is the single biggest liability if the direction changes.
- **~40% of the codebase is executed by zero tests.** All 541 are pure-logic or
  source-text-grep; nothing renders a screen. Swapping content into screens is precisely the
  change class that breaks rendering, and the suite is structurally blind to it. **Budget 3–4
  days of render smoke tests before any content swap.**
- **`lib/protocol.ts` unlocks weeks on completion, never on elapsed time**, and that choice
  radiates into `ProtocolState`, `moments.ts`, the home screen and a safety test. Any
  time-titrated protocol — CBT-I sleep restriction is the clearest case — fights all of it.
  This rules out a whole class of protocols cheaply, and it is better known now.
- **No i18n layer.** Every string is a TypeScript literal. Fine for one more app; a ceiling on
  a portfolio, and it interacts badly with the 31 crisis-line regions already shipped.


---

## 8. Second council — $1m+, and blue-ocean markets

Briefed against the founder's stated target of **$1m+/yr**. Three advisors: market scout,
business-model strategist, red team. **The market scout terminated early on a session limit
and produced nothing** — so there is no systematic blue-ocean market survey here, and any
later claim that "the markets were checked" is false. What follows is two advisors.

### 8.1 The model memo: the constraint is touch-hours, not TAM

$1m/yr is an identity — `customers × ACV = $1m` — and a solo founder has roughly 2,200
working hours a year, of which at most ~1,200 can be customer-facing. That defines a narrow
feasible band and **most mental-health business models sit outside it**: roughly **$800–$3,000
ACV, 350–1,250 customers, sold self-serve**.

Two structural kills, both arithmetic rather than opinion:

- **Consumer paid acquisition is permanently dead.** iOS Health & Fitness CPI is $4.30–$5.50
  against net revenue per download of $0.60–$1.40. That is a **4–8x loss on every install**,
  and no optimisation closes a 5x gap. Consumer growth therefore depends entirely on free
  distribution — which in 2026 means the founder personally producing short-form video,
  weekly, for years. That is a second full-time job they have never done, and it is the real
  input, not engineering.
- **Enterprise B2B2C at $30k ACV is not a solo business.** 33 closed contracts needs ~180–220
  qualified opportunities, ~600–700 first meetings, and **15,000–20,000 outbound touches a
  year** — the annual output of two full-time SDRs. Won accounts alone consume ~1,300 hours;
  the losing pipeline another ~1,000. Before any of it: SOC 2 Type II, HIPAA and BAAs, cyber
  and E&O insurance, a named clinical lead, published outcomes, and reference customers you
  cannot get without first having customers. Buyers also demand **utilisation reporting**,
  which a local-only, no-analytics architecture structurally cannot produce.

**Its recommendation: prosumer practitioner software — sell *to* the licence holder rather
than practise under it.** $1m at $1,200 ACV is 833 customers, about **a third of one percent**
of the private-practice market, against 1.7M consumer installs. First revenue in 60–150 days,
$1m in ~4 years, P(success) ~20–25% — the highest on its board. It routes around the missing
clinical credential permanently and needs near-zero capital. The wedge must be liability or
lost revenue, not saved time: AI session notes is four years saturated.

Its answer to the question asked directly: **$1m needs no clinical credential and no outside
capital, but it does need employees — 1–3 contractors somewhere past $400–600k ARR.** It also
costs the local-only architecture, since professionals need a server, a BAA and an audit
trail, and only ~20–30% of the current code transfers.

### 8.2 The red team: the market was never the constraint

Three facts it checked in the repository rather than assuming:

1. **The whole product was built in thirteen days** — 49 commits, 2026-08-06 to 08-19, 13,041
   lines, 541 tests, encryption, CI, a legal site. Building is not this founder's constraint,
   and a thing that is close to free cannot be the scarce input that produces $1m.
2. **Three renames in thirteen days, with tooling built to support them** — while
   `legal/entity.json` still has no name, no kind, no address, no province. *Three name
   decisions made; zero legal decisions made.* The reversible, private, aesthetic decisions
   get made repeatedly; the irreversible, public, administrative ones do not get made at all.
3. **This council was convened within a day of the last one.** The target survived contact
   with the evidence; the evidence did not survive contact with the target.

Its central claim, and it is the uncomfortable one: **the binding constraint is the transition
from private work to public judgment, not TAM.** Every remaining blocker — incorporate, name a
province, D-U-N-S, Apple Organization, wire billing, publish a page — requires putting a real
legal name on a public document and accepting a number that might be small. Every one recurs
identically in any new market. Searching for a bigger market is the highest-status available
form of not shipping.

It also notes what the $1m target *does* in the system: **it makes every option fail.** Council
one returned "$330k, here is the route" and the response was not "take $330k" but "find a
market where $1m is possible." A target no option clears never requires an option to be
executed.

**On the base rate:** only ~3.5% of subscription apps reach $10,000/month — an eighth of the
target — measured on apps that already shipped. $1m ARR is a few tenths of one percent. It
found two solo-ish mental-health apps at seven figures. Rootd needed five things: an acute
self-labelled symptom; **a hard paywall at onboarding** (which raised its revenue over 6x in
one month); six years of compounding ASO; **a publicly identified founder-patient** as the
growth channel; and money for contractors.

**Items 2 and 4 are forbidden by the founder's own written constraints** — SAFETY.md §4/§12
reject the hard paywall, and the SOAR separation forbids a public founder biography. So:
*the $1m target is incompatible with the constraint set in any market.* Changing the condition
cannot resolve it. Four doors exist — the ethics floor moves, the anonymity moves, capital
arrives, or the target is wrong — and three should stay shut.

### 8.3 Where they agree, and it is not where either was pointed

The model memo says the *business model* is wrong. The red team says the *shipping behaviour*
is. Neither says the market is. Both independently conclude that **choosing a new condition or
a new market changes nothing**, and both note that the one path to $1m that has actually been
walked by a solo founder required mechanics this founder has ruled out on principle.

### 8.4 The SOAR separation — checked, corrected, and resolved

**This section previously said the separation was already breached and called it the
highest-urgency item in this document. That was half right, and the half that was wrong was
the alarming half.** It is recorded here rather than quietly edited, because the reasoning
error is instructive: the finding was real, the severity was inferred from an assumption
nobody had checked, and the assumption was wrong.

**What was true.** `Borntosoar/soar-brand`, the repository for an unrelated clothing brand,
did contain an entire earlier web version of this app — `index.html` titled *"Steady — body
image companion"*, the full `js/` UI, a README opening *"A private, local-only web app for
body dysmorphia and body image distress"*, and the `bdd-expert` clinical skill.

**What was assumed and was false.** That the repository might be public. It is **private** —
zero forks, zero stars, no GitHub Pages. So there was never a live exposure, and the
journalist-connects-the-bio scenario was not available through that route.

**Resolved anyway, and the reason is not tidiness.** The prototype was copied to
`archive/web-prototype/` here and the skill to `.claude/skills/`, then removed from
`soar-brand`, whose README now records what must not come back and why. A separation that
depends on a repository setting staying unchanged forever is not a separation, and the
prototype existed in no other repository — deleting it without moving it first would have
destroyed the only copy of the earliest form of the protocol. `soar-brand`'s history can now
be purged without losing anything.

**The exposure that IS live runs the other way, and this document had it backwards.**
`Borntosoar/steadyapp` — this repository, the shipping app — is **public**, and its owner
account is named after the apparel brand. That linkage is not hypothetical and not a setting:
it is in the repository URL, in the clone instructions in `README.md`, and — most concretely —
in `constants/links.ts`, where `SITE_ORIGIN` is still
`https://borntosoar.github.io/steadyapp`.

That last one is the sharp edge. It is the address the app's own privacy link opens, the
address printed in the first line of `legal/cookie-policy.md`, and the URL that would be
submitted to App Store Connect. **Shipping as-is means a body-dysmorphia app serves its
privacy policy from a URL carrying an apparel brand's name.** It is already an open field —
`legal/entity.json` → `siteOrigin` is null and the build refuses to publish without it — so
the fix costs nothing beyond making the decision. Choose a domain this entity controls.

### 8.5 What the red team proposes instead

Ranked, and all of them use what the repo shows this founder is actually unusual at — **encoding
policy as executable tests** (`safety.test.mjs`, `copy.test.mjs`, `readability.test.mjs`,
`brand.test.mjs`), which is precisely the discipline AI-generated codebases lack:

1. **Ship-readiness audits for AI-built apps.** `READINESS.md` is already the product, and it
   found six of the seven classic pre-submission defects in the founder's own app. $3–8k per
   audit, 3–5 days each. Cash within 90 days. Ceiling: it is time-for-money.
2. **A constraint-test harness as a developer tool** — CI-enforced product-policy testing for
   AI-generated codebases. Software margins, plausible seat-based path, 18–36 months.
3. **SOAR.** If $1m is genuinely non-negotiable, the highest-probability asset the founder
   already owns is the clothing brand: $1m is 20,000 units at $50 net, a well-understood
   number many solo operators hit, with no clinical credential, no SaMD exposure, and no
   ethics floor forbidding the growth mechanic that works. Apparel margins mean $1m of revenue
   is perhaps $150–250k of profit — but it clears the target with a known playbook, and no
   mental-health app on this board does.

### 8.6 The honest state of the question

The blue-ocean survey did not complete, so "is there a mental-health market that supports $1m+
for a solo founder" is **not answered here**. What is answered, twice, from two directions, is
that the founder's constraint set and the $1m target cannot both hold — and that no amount of
market selection reconciles them.

Three things follow that do not depend on the missing survey:

- **The five administrative blockers should be done regardless.** They are market-independent,
  cost about $1,500, and every option in every council requires them.
- **§8.4 is resolved on the repository side and unresolved on the domain side.** The app is
  out of the clothing-brand repository. The public app repository still sits under an owner
  named after that brand, and `SITE_ORIGIN` still points there — which is a decision, not a
  task, and it is already blocking the build.
- **The target needs re-examining before any more analysis is commissioned.** A third council
  against an unchanged target would produce a third memo saying the same thing.

---

## 9. The games pivot — what Anneal is now

**Settled by the founder on 2026-08-21, and this section is the decision record.** The two
councils above were both convened against the question "which condition should this engine
serve." The answer that arrived was to a different question: not which condition, but what
kind of thing this is.

> "i want you to use the name anneal this is anneal it is games in a app with different games
> based on the disorder as well as meditation protocols"

**Anneal is a games app.** One app, several games, each one tracing to a specific clinical
mechanism, plus a meditation layer. The name carries forward; the twelve-week
body-dysmorphia protocol does not, and §9.5 is the unresolved part of that.

### 9.1 The four constraints the founder set

| Question | Answer | What it forecloses, and what it opens |
|---|---|---|
| Time | **Full time — "this is the job"** | Kills the "no time to ship" explanation. §8.2's finding stands: building was never the constraint. |
| Money model | **Freemium now, working toward free-forever / institutionally funded** | The free-forever end state needs an institution to fund it, and every institution asks the credibility question in §3. |
| Clinician access | **"No, and I wouldn't know how"** | This is the binding one. See §9.4. |
| Name | **Anneal** | Settled. `scripts/check-name.mjs` still has to confirm App Store availability, and still needs a machine with outbound HTTPS. |

### 9.2 The brief's central claim, and the evidence against it

The founder's build prompt states the thesis plainly: **"the games ARE the therapy"** — not
mini-games bolted onto a meditation timer. That distinction is right and it is the reason
this direction is worth building. The claim underneath it is not.

Two research passes were run against the eight-game brief. What they returned materially
amends it, and it is recorded here rather than quietly designed around:

- **Gamification adds neither efficacy nor adherence.** Six et al. (2021), a review of 38
  RCTs of gamified mental-health interventions, found no consistent advantage over the same
  content delivered plainly. The active ingredient is the clinical content; the game is a
  delivery vehicle. That does not make the vehicle worthless — a thing people open is worth
  more than a better thing they do not — but it does mean **no efficacy claim may ever rest
  on the game layer**, and the store listing and legal set have to hold that line.
- **SPARX lost roughly 96% of its users before therapeutic dose**, despite being a
  well-made CBT game distributed free at national scale. Free distribution does not solve
  retention, and a D30 > 40% target should be read against that number rather than against
  consumer-app benchmarks.
- **Working-memory training has no far-transfer evidence.** Lumosity paid a $50M FTC
  judgment (settled at $2M) for claiming otherwise. This is not a close call.
- **DBT's TIPP, as usually written, is not safe for an app to instruct.** Cold-water face
  immersion drives the dive reflex; in the population that would use a distress-tolerance
  game, arrhythmia incidence during immersion has been reported far above baseline. An app
  cannot screen for cardiac risk and must not tell an unscreened, distressed person to put
  their face in ice water.
- **The NSDR dopamine claim traces to an n=8 uncontrolled 2002 study that never measured
  motor skill.** The practice is fine. The mechanism story attached to it in the popular
  literature is not, and repeating it would be the kind of claim §5 exists to keep out.

**None of this kills the direction.** It changes what the games may claim, and it kills
three of the eight.

### 9.3 The eight games, re-scoped

| # | Brief | Verdict |
|---|---|---|
| 1 | Neuropsychology — working memory / attention | **CUT.** No far transfer. This is the single largest legal exposure in the brief and the evidence is against it, not merely thin. |
| 2 | CBT — thought distortion detection | **SHIPPED.** Curveball — `content/curveball.ts`, `app/game/curveball.tsx`. Three phases, four scenes, about ninety seconds. |
| 3 | ACT — values-based branching story | **KEEP, second to build.** The mechanism is well evidenced and a branching story is the one format that genuinely needs to be interactive. |
| 4 | Somatic — breath / movement via mic + accelerometer | **REDESIGN.** Drop the sensors. Phone-mic breath detection is unreliable enough that the biofeedback would be lying to the user about their own body. Paced breathing without sensing keeps the evidence and loses nothing real. |
| 5 | Occupational therapy — routine-building sim | **KEEP, and call it what it is.** This is behavioural activation, which has among the best evidence of anything in the brief. It is also barely a game, and pretending otherwise is how it gets built badly. |
| 6 | Art therapy — constraint-based creation | **KEEP, last.** Weakest evidence of the survivors, but near-zero risk and the highest ceiling on "somebody wants to open this." |
| 7 | DBT — TIPP distress tolerance | **REDESIGN.** Keep paced breathing and paired muscle relaxation. Cut temperature and intense exercise entirely — see §9.2. |
| 8 | Positive psychology — gratitude, social | **KEEP.** Modest effects, but real, cheap and safe. |

Meditation layer: NSDR/Yoga Nidra, interoceptive awareness and open monitoring all stay as
**practices**. Every mechanism claim attached to them in the brief comes out.

### 9.4 The clinician answer is the binding constraint, and it is solvable

"No, and I wouldn't know how" is the most consequential of the four answers, because §3 and
§8 both identified a named clinical advisor as tier one of the credibility ladder — six
weeks and roughly £300 — and every institutional route in this document runs through it.
The free-forever end state the founder wants is *specifically* the route that requires it.

"Wouldn't know how" is a smaller problem than it sounds and it is the one thing here that is
purely mechanical: it is an email to authors of the CBT self-help canon, to psychology
departments, and to the clinical leads of the relevant charities, asking to be named as
clinical reviewer — **not** asking anyone to run a trial. §3 records the difference in
yes-rate between those two asks as three- to eightfold. This does not need to be solved
before shipping. It needs to be solved before any institution is approached, and it should
start now because it takes weeks of calendar time and almost no working time.

Until it exists: **no clinical validation language anywhere**, and the freemium tier is the
only model available.

### 9.5 What is still true, and what is now unresolved

Unchanged and carried forward: the name, the legal set, the crisis lines for 31 regions, the
encrypted local-only storage, CI, the release pipeline, the copy rules, and the test suite
that enforces all of it. That is the part of §8.2's "building is not the constraint" finding
that pays off here — the game shipped in one pass because the app around it already existed.

Newly unresolved, and all of it the founder's call:

- **The twelve-week protocol.** The app still opens into a body-dysmorphia programme with a
  week counter, a mirror practice and a phase structure. A games app does not have a week 7.
  These two shapes cannot both be the product, and `lib/protocol.ts` radiates into the home
  screen, `moments.ts`, the streak and a safety test (§7). Deciding this is cheap now and
  expensive after the second game.
- **What the store listing is for.** §2 concluded App Store discovery is condition-specific
  and that a multi-condition app ranks for nothing well. A games app is multi-condition by
  construction. That trade was made deliberately here; it should be made *knowingly*, and it
  means the ASO thesis in `APP-STORE.md` §2 needs rewriting rather than adjusting.
- **Still blocking the build, unchanged since §8.6.** `legal/entity.json` — name, kind,
  address, province, site origin. Five fields. Nothing ships without them, and none of the
  three items above matters if this one stays open.
