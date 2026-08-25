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
| 3 | ACT — values-based branching story | **SHIPPED.** Toward — `content/toward.ts`, `app/game/toward.tsx`. Two values, five moments, each offering relief or movement and never both in one option; avoidance compounds into the scene returning bigger rather than being marked wrong. |
| 4 | Somatic — breath / movement via mic + accelerometer | **REDESIGN.** Drop the sensors. Phone-mic breath detection is unreliable enough that the biofeedback would be lying to the user about their own body. Paced breathing without sensing keeps the evidence and loses nothing real. |
| 5 | Occupational therapy — routine-building sim | **SHIPPED as Groundwork.** `content/groundwork.ts`, `app/game/groundwork.tsx`. Behavioural activation — the component §10 found *is* additive, which is why it went third rather than fifth. Lay out tomorrow against a ground that holds four; a large action plus anything gives way, in front of you, before anything is committed to. Keeps one thing, and asks about it the next time it opens. |
| 6 | Art therapy — constraint-based creation | **KEEP, last.** Weakest evidence of the survivors, but near-zero risk and the highest ceiling on "somebody wants to open this." |
| 7 | DBT — TIPP distress tolerance | **REDESIGN.** Keep paced breathing and paired muscle relaxation. Cut temperature and intense exercise entirely — see §9.2. |
| 8 | Positive psychology — gratitude, social | **SHIPPED as Ballast.** `content/ballast.ts`, `app/game/ballast.tsx`. A positive data log built around the *discounting* rather than the collecting — the belief lives in the filter that deletes the evidence, so the filter's own sentence is put on screen in print and the move is to strike it out or let it stand. Serves `harsh`, the shape the survey could previously do least for. |

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

---

## 10. Third council — how to stop the games feeling clinical

Convened on the founder's note that Curveball "does not make sense for the customer with this
problem" and needs to be less clinical. Three advisors: a clinician, a game designer, and a
research specialist. All three reported.

**A caveat that applies to the whole of §10.2, and it is not a small one.** The research
advisor's egress was blocked for every journal domain it tried, so its findings come from
search-engine summaries of abstracts rather than from full texts. Study designs, sample sizes
and directions of effect are reliable. **Specific effect sizes are not, and must be checked
against the paper before any of them goes near a store listing, a grant application or an
investor.** The four to verify first are named in §10.5.

### 10.1 The defects that were live regardless, now fixed

These are separated out because they were true whichever direction wins, and shipping them
un-fixed while the direction was debated would have been indefensible.

| Defect | Why it mattered |
|---|---|
| **The game was unplayable with Reduce Motion on.** `sway` went to zero and the rotation output range collapsed to all-`0deg`, so distorted and balanced pills were pixel-identical — while the intro promised the bent ones lean. | Not degraded. Unplayable. The comment above that code had reasoned about this exact case and concluded keeping the travel was enough; flattening the sway does not soften the tell, it deletes it, and the tell is the game. Fixed with a static lean, since a fixed angle is not animation. |
| **No way out of a scene.** | Toward's exit rationale names a partner gone quiet and an avoided appointment as its cause. Curveball contains that same partner scene verbatim, plus midnight rumination, **on a clock** — Toward waits for you, Curveball does not. Two phases had no back button at all. |
| **An animated accuracy score on somebody's mind.** `pct` was handed to `Finish` as the figure, which renders it largest on screen and counts it up. | The headline was careful; the number above it was not. |
| **A defensible answer marked wrong.** "Everyone else copes fine" was Mind reading; "Everyone else gets up fine" was Comparison bias. | The same sentence with two answers. That does not read as clinical, it reads as unfair. |

### 10.2 What the evidence actually says, and it is worse for Curveball than expected

**Cognitive restructuring is the component with the weakest case for being additive.**
Furukawa et al. 2021 (*Lancet Psychiatry* 8:500–511), an individual-participant-data component
network meta-analysis of internet CBT, concludes that future iCBT packages "might include
behavioural activation but not relaxation… **but probably not cognitive restructuring**."
Jacobson 1996 and Dimidjian 2006 point the same way from the dismantling literature.

The counterweight, and it should be stated: Ciharova/Cuijpers et al. 2021 (45 studies, 3,382
participants) found restructuring alone, behavioural activation alone, and both together all
beat control with **no significant differences between them**. So restructuring is not inert.
It is **not additive** — which for a product deciding what to build next is the operative
finding.

**Distortion-labelling has never been tested.** No dismantling study isolates "name which
distortion this is" from noticing-plus-evidence-checking. The taxonomy is not empirically
derived — Burns 1980, on Beck's smaller set — and the NLP literature that has tried to
operationalise it reports overlapping categories and poor inter-annotator agreement. The
honest claim is **untested convention, not disproven**.

**What has evidence is naming the FEELING, not the error.** Affect labelling produces a
regulatory profile resembling reappraisal — and Torre & Lieberman 2018 report that people
predict it will make them feel worse. It regulates implicitly. *The effective move does not
announce itself*, which is the whole register problem in one sentence.

**Defusion matches restructuring, and beats it in an app.** Head-to-head experiments find
defusion, restructuring and exposure comparable; Krafft/Levin et al. 2018 delivered both by
mobile app to people high in self-criticism and found **defusion the more consistent**. That
is a finding in Toward's favour, not Curveball's.

**Self-distancing works for rehearsal and fails for comfort.** Schertz, Orvell, Kross et al.
2025 — two weeks of experience sampling, 208 participants, 12,966 surveys — found distanced
self-talk worked when used to prepare for something upcoming and **did not work when used to
feel better about something that already happened**. Every Curveball scene is second person
and retrospective. Both are the wrong side of that finding.

**Narrative does not solve dose.** SPARX in trial: 60% completed all seven modules. SPARX
in the wild, 21,320 New Zealand adolescents: **51.1% finished module one, 7.4% reached module
four, 3.1% finished all seven** — with effect sizes matching the trial *for those who
engaged*. And MindLight, purpose-built with exposure and neurofeedback, performed no better
than a commercial platformer with no therapeutic content in it at all; adding explicit CBT
on top of MindLight added nothing.

**Do not add points to compensate.** Deci, Koestner & Ryan 1999, 128 studies: performance-,
completion- and engagement-contingent rewards all undermine free-choice intrinsic motivation.
Six et al. 2021 already told us gamification moves neither outcome nor adherence.

**And the metric that matters is not sessions.** Donkin et al. 2011: module completion
predicted depression outcomes; logins, time online and pages opened did not.

### 10.3 Where the three advisors converged

Independently, and from different directions, all three said:

1. **Delete the naming phase.** The clinician: recall of the noun is an exam wrapped around
   the operation. The designer: it is the loudest clinical furniture. The researcher: no
   evidence supports it.
2. **Third person.** Somebody else's thoughts, not the player's own, adjudicated.
3. **No score, no points, no correctness feedback on the tap.**

### 10.4 Where they disagreed, and the disagreement is real

**The clinician refuses to remove the taxonomy from the product**, and the reason is
concrete rather than clinical: `THOUGHT_RECORD_STEPS` step 4 asks the user to tick which
distortions applied, those selections persist, and they are written into the plain-text
export SAFETY.md §11b makes a promise about. Delete the vocabulary from the game and step 4
becomes an unexplained wall of jargon with nothing in the product that ever introduced it —
the jargon does not go away, it relocates to the *least* game-like screen. This was also
already fixed once deliberately (`content/exercises.ts`, the Overgeneralisation note).

**The resolution is that these are two decisions being treated as one.** Keep the vocabulary
in the data, the Learn module and the thought record. Remove the quiz.

### 10.5 What this leaves, and the decision that is the founder's

The synthesis all three support, ordered by evidential strength:

1. **Move the situation from retrospective to about-to-happen, and from "you" to a named
   person.** This is the researcher's sharpest correction and neither of the other two had
   it. It costs a content rewrite and no engineering.
2. **Delete the naming phase.** Keep the taxonomy everywhere else.
3. **Replace "pick the most accurate reframe" with "pick what they do next."** Same
   three-option screen; converts the loop from cognitive restructuring, which is not
   additive, toward behavioural activation, which is.
4. **Keep the let-through rule.** It is the one thing standing between this and a machine
   that trains people to distrust every thought they have, and it is the rule with a test on
   it.
5. **Fix session one to session two before anything else.** SPARX lost half its population
   there, and completion is what buys the effect.

**Numbers to verify before external use:** Furukawa 2021's component estimates, Moran & Eyal
2022's pooled distancing effect, Baumel 2019's retention figures, and the SPARX CDRS-R
interval. Two claims are already retired: Crum & Langer 2007 failed to replicate, and every
Duolingo retention figure in circulation traces to secondary blogs.

**Built, 2026-08-22.** Items 1–5 are done: the seven scenes are prospective and third
person with three recurring characters, the naming quiz is gone with the vocabulary kept and
now *shown* on a caught thought, "pick the most accurate reframe" is replaced by "what does
Theo do" with consequences instead of a verdict, the let-through rule is untouched, and the
ending names who is up next by name — no points, no streak, per Deci 1999.

**One thing came out of it that was not on anybody's list.** Rebuilding the test file exposed
that `node --test` prints `not ok` for a suite that throws while being collected and then
**exits 0**. A helper had drifted out of scope, roughly forty assertions silently stopped
running, and the summary still read `# fail 0`. That is the same failure this project already
has a whole test file about — a guard that matches nothing always passes — one level up, at
the runner. `scripts/test.mjs` now fails the build on any `not ok` at any depth rather than
trusting the counters.

**What is not decided here is scope**, and it is not a technical question. The designer's
narrative rebuild is roughly a month and a real writing job. The stripped-back version —
deletions plus the third-person prospective rewrite — is days. Both are honest. The record
exists so the choice is made against the evidence rather than against the last thing anybody
read.

---

## 11. Guided tracks, and the first one

Built 2026-08-22, on the founder's brief for a "catered plan" that follows from the opening
survey — the example given was somebody depressed after a breakup getting a protocol rather
than a menu. `content/tracks.ts`, `lib/track.ts` and `app/track/[id].tsx`.

### 11.1 What a track is

Seven days. Each pairs one game (with a different focus every time it recurs), one
deep-linked practice, and one question to hold. The sequence is the product: a track is not a
content library with a nicer wrapper, and the reason to build it at all is Donkin 2011 —
module completion predicts outcome, logins do not.

The arc is built on mechanisms with the best support rather than on stages-of-grief, which
was written about dying and never validated for relationship dissolution. In order: the acute
part; the life that narrowed; memory editing toward the good parts; self-concept, which is
the specific damage a long relationship does when it ends; the self-blame voice; what
restarts the clock; and what the next week is for.

### 11.2 The five refusals, and why each is load-bearing

These are stated in the header of `content/tracks.ts` and enforced in
`__tests__/tracks.test.mjs`, because a comment is not a constraint.

| Refusal | Why |
|---|---|
| **No timeline, ever.** | The eleven-week figure everybody quotes comes from a survey of undergraduates about their worst breakup. It is not a prognosis. A promised date that passes converts an ordinary bad month into evidence that something is wrong with you. |
| **No daily writing about the breakup.** | The reliable finding in the dissolution literature is that rumination maintains distress, and repeated structured reflection has been found to make things worse for people already high in it — which is exactly who downloads a breakup app. The app cannot screen for that, so it hands nobody a daily reprocessing task and hopes. Every day carries a question to hold, and there is no `TextInput` on the screen. |
| **No advice about their actual life.** | Nothing tells anybody to block a number, delete photographs or go no-contact. Those decisions have consequences the app cannot see: shared housing, children, work, a person who is still a friend. Day six describes what tends to restart the clock and stops there. |
| **No assumptions about the shape of it.** | Not who left, not how long, not married, not a gender, not romantic in the sense the word usually implies. Checked against the copy by regex. |
| **Days are not dates.** | "Day three" is the third one you did. Somebody who opens this six months later is not behind, and somebody who misses four days is not either. |

Two of those are structural rather than editorial and are checked at the code level:
`lib/track.ts` stores `startedAt` and is then forbidden from reading it — every unlock
function is asserted free of `Date`, `now()` and `startedAt` — and progress is a **set of day
ids** rather than an index, so inserting or reordering a day cannot silently move everybody
who is mid-track.

### 11.3 What the track does not gate

Every track is listed in Practice for everybody. `forCarrying` decides only what the survey
result screen offers, and that is the whole of its job. This is the same rule the game order
already follows: hiding something behind a survey answer means somebody who tapped quickly at
2am has a smaller app forever.

There is also no cap. Three in an evening is allowed. A cap would be the app deciding it
knows the right pace for somebody's worst month — the same thing the skip, the pass and the
no-clock mode all refuse.

### 11.4 The closing screen is deliberately not a celebration

Finishing a track is not finishing the thing the track is about, and "Congratulations, you
have completed After It Ended" is the cruellest available version of that screen.
`TRACK_CLOSE` says the week has a shape it did not have at the start and that none of it is
finished, and the test asserts both halves.

### 11.5 One defect this found

Day one linked to `/game/curveball?clock=off` — the acute week is the wrong place for a
stopwatch — and `app/game/curveball.tsx` read no route parameters at all. The link was
decorative and the day opened timed. There is now a test that every query parameter a track
passes is read by the screen it opens, because a parameter nothing reads is a lie told
somewhere nobody looks. The parameter sets the *starting position* of the toggle and nothing
more: the intro still offers the choice, since a link that silently removed it would be the
app deciding what somebody can handle.

### 11.6 The second track — flat, and the five refusals that are its own

Built 2026-08-23. `FLAT` in `content/tracks.ts`, id `flat`, title "When nothing lands", offered
to the `flat` and `spent` survey shapes.

**Why this shape next.** It is the one where the mechanism with the best support and the
mechanic already built are the same thing. §10.2 records what the component literature says —
behavioural activation is the piece to keep, cognitive restructuring probably is not additive
(Furukawa 2021, with Jacobson 1996 and Dimidjian 2006 from the dismantling side) — and
Groundwork already *is* behavioural activation. It is also maximally unlike the breakup track,
acute loss against absent reward, which is the honest way to find out whether the format
generalises or whether track one was a good week of writing.

**The fact the track turns on.** Flatness is not mainly an absence of pleasure. What goes is
anticipation and the registering of reward afterwards, while in-the-moment liking is often far
more intact than anybody expects. That dissociation is why "do things you enjoy" fails as
advice and why "do it before you want to" does not, and day two is entirely about it.

| Refusal | Why it is load-bearing |
|---|---|
| **6. It never says "do things you enjoy."** | The presenting problem restated as the cure. Somebody here has already been told this by everyone; hearing it from an app is a reason to close the app. Every instruction is about doing regardless of wanting to, and about size. |
| **7. No sleep, diet or exercise advice.** | Not one line about eight hours, daylight or going for a run. Being unable to do those is part of what flat *is*, and repeating them makes the app one more voice on that list. Groundwork's deck already contains ordinary physical actions without any of them being prescribed as a remedy, which is the correct amount. |
| **8. No gratitude and no bright side.** | A gratitude prompt handed to somebody flat reads as an accusation — the implication is that the problem is insufficient noticing. Day four does work on registering, but on the *discounting* of things that already happened, which is the opposite operation and is Ballast's existing mechanic. |
| **9. A missed plan is information about the size of the step, never about the person.** | BA orthodoxy, and what decides whether the track is still openable in week two. Groundwork already encodes it; the test asserts `nextSize` survives, because this track is the loudest place a regression there would be felt. |
| **10. It does not promise the feeling comes back.** | The honest statement is that action goes first and feeling follows unreliably and late. "You will start enjoying things again" sets up a failed prediction on day three that the person reads as being about them. The close says so outright. |

**Groundwork three times, on purpose.** One exposure to the intervention is a demonstration
rather than a method. Days one, three and seven are the same mechanic pointed at the smallest
possible step, at a whole day, and then at the same smallest step again — day seven says that
it is the same and that this is the point. Padding those slots with two more games would look
more varied and teach less.

### 11.7 What building the second one exposed in the first

Three screens said "seven" because both tracks happen to have seven days: the shared closing
line, the Practice row, and the survey result. Every one of them would have been quietly wrong
the first time a track was five days long, and none of them would have failed a test — the
sort of defect that only appears once there are two of something. `TRACK_CLOSE` is now
number-free and is a fallback rather than the text, tracks carry their own `close`, the screens
call `daysWord(track)`, and the suite checks any number a close names against that track's
actual day count.

The same class of coupling turned up on the survey result screen, which claims "Curveball —
three people" and "Toward — five moments" as JSX literals. Those are the first concrete claims
anybody reads about this app, on the screen the brief calls the moment somebody decides whether
to trust it, and nothing tied them to the content. `__tests__/survey.test.mjs` now checks both
against `cast()` and `SCENES`.

The track overview also drew a hardcoded `evening` + `moons` ground, so every future track
would have arrived wearing the breakup track's weather. It takes the first day's pair now.

**Still uncovered by any track:** `spirals` (cannot stop thinking) and `looking`. `spirals` is
the obvious third and it carries a trap worth naming before anybody starts: an app for people
who cannot stop thinking that hands them more thinking to do is the failure mode, and the
literature that matters there is worry postponement and attention training rather than
anything Curveball currently does.

### 11.8 The third track — spirals, and the trap it is built around

Built 2026-08-23. `SPIRALS` in `content/tracks.ts`, id `spirals`, title "The thinking part",
offered to the `spirals` shape only.

**The trap, named before anything else.** An app for people who cannot stop thinking that
hands them more thinking to do is the failure mode, and it is the ordinary outcome. The worry
diary, the thought record, the evidence-for-and-against, the "is this thought realistic" —
somebody here will do every one of them for an hour and call it progress, because it feels
exactly like the thing they were already doing. The whole track is arranged around not doing
that.

**Why the content is not the target.** The reliable observation is that the topic is
interchangeable and the process is stable: worry running forward and rumination running back
behave like one repetitive process wearing different subjects. Answering tonight's question
therefore does nothing, because the answering is the habit and it will find another subject by
tomorrow. Day one says that and the rest follows.

The days, in order: the process rather than the topic; the belief that worrying is doing
something useful, which is why nobody stops and is the least-known thing in here; abstract
"why" questions against concrete "what exactly" ones; putting it down rather than settling or
suppressing it; attention outward, because this is worst when there is nothing else in the
room; suppression, which everybody has already tried; and what to do when it starts again.

| Refusal | Why it is load-bearing |
|---|---|
| **11. No thought-challenging, no evidence-for-and-against.** | For this one shape, examining the content is fuel, and an app cannot supervise the difference between examining a thought once and examining it all evening. |
| **12. No suppression — and it says so out loud.** | "Just stop thinking about it" is what everyone here has already been told and already tried. It does not hold, and checking whether it worked is more attention on the thing. The track names this rather than merely avoiding it, because somebody who has been failing at suppression for years has been reading that as a fact about themselves. |
| **13. No reassurance, and it never answers the question.** | Worry is a search for certainty and reassurance is the maintaining behaviour — this app already says so about asking other people. "It will probably be fine" is the easiest sentence for a mental health app to produce by accident and the one that does the damage here. Every `hold` on this track is checked to end in a question mark. |
| **14. No worry diary and no scheduled worry period.** | Postponement is in as a move, not an appointment. The evidence for postponing is decent; a standing daily appointment to worry is still a standing daily appointment to worry, and that is the version that survives contact with an unsupervised app. |
| **15. It does not promise quiet.** | The target is not an empty head. What changes is how long somebody stays in it once it starts, and the close says only that. |

**Why Toward leads, and why Curveball is here at all.** Toward appears three times because its
mechanic *is* the move: its own header says the thought is pinned above the choices, never
argued with, never disproved, and still there when the scene ends — and the away move it offers
is relief, which for somebody here is precisely "think it through once more and it will
settle". Curveball is a thought-checking game in a track that refuses thought-checking, so its
two appearances have to survive daylight. Its actual rule is a *discrimination* — tap the ones
that cannot be checked — and the useful learning for a worrier is that the uncheckable ones are
the ones they have been trying to check; the naming quiz and the reframe answer key were both
removed in §10 and this track depends on their absence. Second, the clock makes dwelling
structurally impossible. A game you cannot ruminate inside is worth more here than a calmer one
you can.

**Ballast is deliberately absent.** Its beliefs are all about self-worth and none of them is a
belief about thinking. Bending it to fit would have bought a fourth game and a false day. The
test asserts the absence so a later edit has to argue with it.

### 11.9 The contradiction this one exposed, and the one it did not

`orderOf` in `lib/plan.ts` led `spirals` with **Curveball**, on the reasoning that "Curveball
leads where the trouble is the thinking itself". That is backwards for this shape, and building
the track is what made it visible: it put the thought-adjudicating game in front of the person
who cannot stop adjudicating thoughts. The home screen was arguing with the protocol. Toward
leads that shape now, Curveball is second, and both are one tap away in Practice as always.

The first version of the test written to pin that down asserted the general rule — *every
track's first game equals the game the survey leads that shape with* — and immediately failed
on the breakup track, which opens on Curveball while `orderOf` leads `loss` with Toward. That
one is **not** a contradiction and the content was not changed to satisfy the rule: a
sequence's opening move and a home screen's ordering answer different questions, and the
acute-breakup day is about forecasts, which is exactly Curveball's discrimination. The test was
narrowed to the invariant that is actually load-bearing — a track must not be led by a game its
own header refuses — with the reasoning recorded in the test itself.

**Now covered by a track:** `loss`, `unmoored`, `harsh` (breakup); `flat`, `spent` (flat);
`spirals`. The only shape without one is `looking` — "just looking around" — and it should stay
that way: handing somebody a seven-day protocol for having no particular reason to be here is
the opposite of what that answer means. Verified in the browser that the result screen offers
them nothing.

### 11.10 The fourth track — spent, and taking it back off the flat one

Built 2026-08-23. `SPENT` in `content/tracks.ts`, id `spent`, title "Running on empty".
**This also corrects §11.6**, which recorded the flat track as covering `flat` and `spent`.
It no longer does.

**Why the borrowed fit was worse than it looked.** The survey's own reflection for this shape
names the distinguishing feature: *"You are still doing all of it. That is usually what makes
this one so hard to say out loud."* Function is intact and capacity is gone. The flat track
assumes the opposite — that the doing has stopped and the job is to start it — so handing it to
somebody who is still doing everything reads as an instruction to do more, which is the exact
wrong prescription. `forCarrying` is now `['flat']` and the test asserts no two tracks claim the
same survey shape.

**The honest ground, stated on day two.** Interventions aimed at the individual move this less
than changes to the load itself do. That makes an app — a purely individual instrument — a
small thing pointed at a largely structural problem. Saying so plainly is what buys the right
to offer anything: the cruellest thing a wellness product does to somebody in this state is
imply they would be fine if they coped better. The test asserts the admission lands on day one
or two, because an admission that arrives on day six is a disclaimer.

| Refusal | Why it is load-bearing |
|---|---|
| **16. Never implies a failure of coping.** | No resilience, no stress management, no "handle it better". The evidence points at load; the app cannot move load. |
| **17. No self-care vocabulary.** | No me-time, treat yourself, filling your cup, "you deserve". It is the register that made workplace wellness read as an insult to the people it was aimed at, and this audience has the sharpest ear for it in the survey. |
| **18. No time management or productivity advice.** | Somebody here is usually extremely good at prioritising — it is *why* they are still doing all of it. Offering it implies they got here by being disorganised. |
| **19. No advice about the job, and no assumption there is one.** | Not quit, not cut hours, not talk to a manager. And the load is as often a parent being cared for, a child, an illness, or a second shift nobody calls a job — this is the shape most likely to be misread as work stress. Both halves are checked by regex. |
| **20. Does not promise a weekend will do it.** | Implying it sets up exactly the conclusion the track exists to prevent: the rest did not fix it, so the problem must be the person. |

**And it never names the condition.** The word for this has a definition, a scale and a live
argument about whether it is a medical diagnosis at all. None of that helps anybody at 11pm,
the survey has never handed somebody a label, and the test bans the vocabulary. "Exhaustion" is
plain English and stays.

**All four games, which is not balance for its own sake.** This shape spans capacity
(Groundwork, whose ground visibly gives way under one large thing), prediction (Curveball — "if
I stop, it all falls over" is a forecast), cost against value (Toward), and the deletion of
your own effort (Ballast, whose discount sentences are exactly how somebody here files a week's
work as not counting). Ballast fits this track better than the one it was written for. Both
Curveball days run without the clock, which follows from refusal 16 rather than from the usual
one-exposed-day convention: a stopwatch is load.

### 11.11 What the fourth track exposed, and one guard that was too blunt

**Four tracks broke the Practice list.** Every unstarted row read "seven of them, in order.
Nothing on a schedule" — fine with one track, and with four it was four identical subtitles
under four deliberately evocative titles, so the list told the reader nothing about which one
was theirs. It also put a lowercase "seven" at the start of a sentence, which is what made me
look. Tracks now carry a `oneLine` — "For when you are still doing all of it." — and the row
shows that. The length still appears on the overview seedling and on the survey result.

**The close's number guard was too blunt and had to be rewritten rather than obeyed.** It
flagged every number word anywhere in a close, and fired on "and that one is worth having on its
own", where "one" is a pronoun. The fix was a better guard, not worse copy: a number now counts
as a claim only in counting position — "the seven", "all seven", "seven of them" — and "one" is
excluded entirely, since English uses it as a pronoun constantly and a one-day track is already
impossible. Because the guard was rewritten, there is now a test of the guard itself, checking
it against both the string it must catch and the string it must not.

**Every survey shape except `looking` now has a track**: `loss`/`unmoored`/`harsh` (breakup),
`flat` (flat), `spirals` (spirals), `spent` (spent). `looking` — "just looking around" — keeps
none, and should: handing a seven-day protocol to somebody with no particular reason to be here
is the opposite of what that answer means.

### 11.12 The fifth track — harsh, and the intervention it has to refuse first

Built 2026-08-23. `HARSH` in `content/tracks.ts`, id `harsh`, title "The running commentary".
**This corrects the breakup track's coverage**, which had claimed `harsh` since §11.2.

**Why that was a worse mismatch than flat/spent.** Six of the breakup track's seven days assume
a relationship ended; only "The voice" is about self-criticism at all. Offering "After it ended"
to somebody whose survey answer was "I am hard on myself" is wrong on the title alone, before
any content loads. `forCarrying` is now `['loss', 'unmoored']`.

**`unmoored` stays and is the same defect one degree milder**, recorded rather than hidden.
"Everything changed at once" is often a breakup and just as often a move, a diagnosis, a job
going, or leaving a country — and the breakup track assumes a person. It is a stretch rather
than a mistake; an honest stretch beats an empty shelf, and it goes the moment `unmoored` has
somewhere better. There is a test asserting the reasoning stays in the file alongside the
stretch, so the decision cannot quietly become invisible.

**The design problem, and it has a different answer from the other tracks'.** The obvious
intervention here is self-compassion, which has decent support. What sinks it in practice is
that highly self-critical people are often frightened of it — being easier on yourself reads as
dishonest, or as the thing that will make you slide — and that fear predicts a poor response.
Opening with "be kind to yourself" is this track's version of telling a flat person to do things
they enjoy. There is a sharper second reason: positive self-statements have been found to leave
people with *low* self-esteem feeling worse while helping those who already felt fine, which is
precisely this audience and precisely the wrong direction.

**So the frame is accuracy, not kindness.** Day six is called "Fair, not kind": the same
standard of evidence anybody else would get, and no more generous than that. A lower bar than
kindness and much harder to argue with — which matters, because the failure mode of this shape
is an argument the person always wins.

**The order is itself the intervention, and it is tested as one.** Nothing warm is offered until
the function of the criticism has been looked at (day two) and the double standard has been felt
(day three). A test asserts `fair-not-kind` falls after both.

| Refusal | Why it is load-bearing |
|---|---|
| **21. No affirmations, nothing kind offered up front.** | See above. Banned rather than softened. |
| **22. It does not argue that the criticism is false.** | "That is not true, you are great" is reassurance, triggers the discount on the way past, and loses — the sentence usually has a grain in it, which is why it stuck. The moves are the double standard and the function, never adjudication of content. |
| **23. No comparison, even favourable.** | "Better than you think" is reassurance; "everyone feels like this" erases. Comparison is also part of this shape's machinery, so using it as the remedy feeds it. |
| **24. No family history and no origin hunting.** | Day four says the sentence is older than the situation and stops. An unsupervised app inviting somebody to open their childhood at 1am is the clearest harm case in this track, and nobody is there when it goes wrong. |
| **25. It never promises the voice goes.** | It usually does not. What changes is the gap between hearing it and taking dictation from it. |

**And it is never a scoreboard.** An app that asks somebody hard on themselves to rate
themselves has handed the voice a metric.

**Ballast carries it, three times, in the track it was written for.** `content/ballast.ts` opens
by naming this shape as the one the survey could do least for. Its mechanic — the *discount*,
not the collecting — is this shape's mechanism made playable. A test pins the game file's own
statement of purpose so the two cannot drift apart.

**Day three runs on the clock and day seven does not**, which are opposite calls from every
other track and both deliberate: speed is the instrument on day three, because the automatic
allowance extended to somebody else — before there is time to be fair about it — is the data.
Day seven is about the gap between hearing and acting, which needs the opposite.

**Every survey shape except `looking` now has a track of its own** except `unmoored`, which
shares the breakup one on the stretch recorded above. `looking` keeps none, on purpose.

### 11.13 The sixth track — unmoored, and the shape sheet is now closed

Built 2026-08-23. `UNMOORED` in `content/tracks.ts`, id `unmoored`, title "The ground moved".
This resolves the stretch recorded in §11.12: the breakup track now claims `['loss']` and
nothing else, which took three passes to arrive at.

**The widest shape in the survey, and that is the design problem.** A country, a job, an
illness, a birth, a death, an institution left behind, a religion left behind, a house move, a
relationship — all of them land on this tile, and any copy that names one excludes the rest.
The survey's own reflection is what they share and is the entire brief: *"The ground moved, and
the version of you that knew what to do lived on the old ground."* What unifies them is not the
event. It is the discontinuity, and the loss of the automatic that comes with it.

**The axis the app must not guess is whether it was chosen.** A move somebody wanted and a move
forced on them feel nothing alike, and the person who chose it very often feels they have
forfeited the right to find it hard — which makes them exactly the person reading this at
midnight. Every line works for both or it does not ship. Structurally this is the spent track's
"you are still doing all of it, so it reads as coping".

| Refusal | Why it is load-bearing |
|---|---|
| **26. No assumption about what changed, or whether it was chosen.** | The strongest refusal here. The blurb lists four deliberately unlike each other and then says "or something with no obvious name", because a list that reads as exhaustive excludes everybody it missed. Both halves are checked, and the test asserts the spread survives an edit. |
| **27. No silver lining and no growth framing.** | Not "everything happens for a reason", not a new chapter, not a fresh start. Unfalsifiable, reflexive, and offered early it tells somebody their difficulty is a lesson. Growth may well happen; the app does not get to promise it or ask for it. |
| **28. No advice about rebuilding.** | Not join a club, not meet people, not get into a routine. It presumes capacity and context the app cannot see and lands as "you are not trying". What it does instead is name the mechanism — repetition in the new context — and leave the locating to the person. |
| **29. It does not ask anybody to decide who they are now.** | The middle of a transition is precisely when that faculty is offline, so asking is the app demanding output from the one thing not working. Day three names the question in order to say it has no answer, then offers the answerable one: what was true on both sides. |
| **30. No timeline for feeling normal.** | Refusal 1 bans timelines everywhere, but this shape asks hardest, so the honest answer is stated rather than merely withheld — there is not one, and not having one is not a bad sign. |

**What makes a values game honest in a track that refuses the identity question.** Toward's
values are recognised from a list rather than authored, so picking two that predate the change
is continuity-spotting rather than identity construction. That distinction is the whole reason
day three can use it, and there is a test pinning the focus to it.

**All four games, and Groundwork twice**, because repetition in the new context is the actual
mechanism by which a sense of yourself re-forms — behind you, out of things that stop needing a
decision, rather than in front of you out of a decision.

**One divergence left deliberately in place.** `orderOf` leads `unmoored` with Toward while the
track opens on Curveball. Per §11.9 that is not a contradiction — a sequence's opening move and
a home screen's ordering answer different questions — and it is the same pattern as the breakup
track, which opens on Curveball while `loss` leads with Toward. The narrowed test from §11.9
pins only the case that was load-bearing.

### 11.14 The shape sheet, closed

Six tracks, six shapes, one deliberate gap:

| Survey answer | Shape | Track |
|---|---|---|
| I lost someone, or something | `loss` | After it ended |
| Everything feels flat | `flat` | When nothing lands |
| I cannot stop thinking | `spirals` | The thinking part |
| I am running on empty | `spent` | Running on empty |
| I am hard on myself | `harsh` | The running commentary |
| Everything changed at once | `unmoored` | The ground moved |
| Just looking around | `looking` | *(none, on purpose)* |

There is now a test asserting every shape has exactly one track and that `looking` has none, so
a seventh track cannot quietly leave a shape behind, and nothing can quietly hand a protocol to
somebody who said they had no particular reason to be here.

**Thirty refusals across six tracks**, five shared and five per track, every one of them
enforced by a test rather than left in a comment — and each new guard checked against a string
it must catch as well as the copy it must pass, because a guard that matches nothing always
passes. That habit has now caught three real defects in this feature alone: the dead
`?clock=off` parameter, the `orderOf` contradiction, and the identical Practice subtitles.

### 11.15 The seventh track — looking, which reverses §11.14

Built 2026-08-23. `LOOKING` in `content/tracks.ts`, id `looking`, title "How any of this
works". **This reverses the decision recorded in §11.14**, and the reasoning for the reversal
matters more than the reversal.

Every earlier version of this file said `looking` should have no track, because handing a
seven-day protocol to somebody with no particular reason to be here is the opposite of what
that answer means. **That argument is still correct.** It is an argument against a seven-day
protocol, not against anything at all, and the difference is the whole design.

**Who actually taps that tile.** The survey's own note says it: *"No particular reason to be
here, or none you want to write down yet."* Three people land there — somebody genuinely
browsing, somebody who has a reason and is not ready to say it, and somebody who has never
been given a word for what is happening and should not have to pick one to get in, which is
the stated design principle of the whole survey. The skip button lands here too:
`app/onboarding/survey.tsx` records "Just let me look around" as `looking`. The old refusal was
written for the first of those three and quietly failed the other two.

So it is a different kind of thing: **four days, not seven, one per game**, so nothing is
padded. A tour of the METHOD rather than of the app — each day is one real idea about how minds
work, true regardless of what brought anybody here, usable by somebody who never says a word
about themselves.

| Refusal | Why it is load-bearing |
|---|---|
| **31. It is not a funnel.** | It does not work toward a disclosure, another track, or a payment. If somebody does all four and leaves, that worked. The refusal most likely to erode later — a four-day intro is exactly the shape a growth team would turn into onboarding, one sentence at a time. |
| **32. It does not try to find out what is wrong.** | No second survey, no narrowing questions, no inference from what somebody plays. They declined to name it. |
| **33. It assumes no distress and no absence of it.** | Every line works for somebody idly curious and for somebody in real trouble who is not saying so, because both are here and the app cannot tell them apart. |
| **34. A tour of the method, not of the app.** | A product tour is marketing wearing a track's clothes. |
| **35. Nothing is withheld behind it.** | Finishing unlocks nothing, because nothing was locked. A test asserts it is not wired into the onboarding flow, which is what would make it a gate. |

This is also the first non-seven-day track, so it is the first real exercise of the number
guards from §11.11: `daysWord` says four, the close claims four, and the counting-position
guard checks the claim against the actual day count.

**All seven survey shapes now have exactly one track, `looking` included**, and the test that
used to carve out the exception now asserts the rule — inverted rather than deleted, because
the reasoning is the part worth keeping.

## 12. The audit pass, and what it found

Six agents were run over the whole app on 2026-08-23: security, React Native correctness,
App Store readiness, accessibility and visual design, latent logic bugs, and the build
pipeline. What follows is what was fixed. §12.4 is what was not.

### 12.1 The dead test that was hiding the others

`__tests__/motif.test.mjs` computed contrast with its own compositor, whose `rgba()` parser
fell back to `[hex(s), 1]` for anything it did not recognise. `surfaceSolid` is a plain hex,
so the pill's alpha came back as 1 — and `over(pillRGB, 1, painted)` returns `pillRGB`
exactly, discarding the motif, which was the only reason the function was called. The stated
worst case on one line was deleted by the next.

It therefore computed two numbers, twenty times each: **15.44 and 11.93**. It would have
passed with `MOTIF_MAX_OPACITY` at 1.0, with every ramp pure white, or with `ATMOSPHERES`
deleted. `constants/palette.ts` opens by saying the previous generation of these guarantees
"were asserted in comments instead, and they were wrong, by a factor of four in places, for
months" — the replacement reproduced the defect one level down, in arithmetic that looked
like proof.

Behind it, four real failures, each verified independently before being fixed:

| Failure | Measured | Fix |
|---|---|---|
| Dark ink on the grounds `groundFor` actually returns | `inkFaint` on `emberDeep[3]` **2.83:1** | All three deep ramps scaled into `night`'s luminance band (top stop 0.023). Proportional, so the gradient keeps its shape and both ramps keep their hue. |
| `night` itself, with a motif over it | `inkFaint` on `night[2]` **4.44:1** | Same scaling. In dark the motif is LIGHT ink, so it raises the ground's luminance and costs contrast — the term nobody had modelled. |
| Light `inkFaint` on any pale ramp plus motif | as low as **3.81:1** | `#5B6552` → `#505948`. The old value cleared AA with ~2% headroom and the motif was never in that budget. |
| `Frost` on the dark palette | `inkFaint` **2.37:1** on a panel vs **3.00:1** on bare ground | `dark.surface` now darkens (`rgba(8,11,6,0.40)`). It was a near-white mirrored from the light palette, so the component that exists to help text was hurting it — and `surfaceSolid` darkens, so one screen had two surfaces with opposite elevation polarity. |

The arithmetic now lives in `lib/color.ts` with **its own unit tests**, checked against the
WCAG definitions rather than against its own output — black on white is 21:1, the primaries
carry their stated coefficients, the linearisation knee is applied below 0.03928. The suite
walks the stack the renderer actually paints (ground → motif → surface) across all three ink
tokens, and asserts that removing the motif or the surface *changes the answer*, which is the
assertion the old version needed and did not have.

**Container opacity is now banned where it holds text.** RN composites `opacity` over the
whole subtree, so the dimmed future-day rows on a track measured **2.92:1** and the wallpaper
showed through the card. Later days are set in `inkFaint` at full opacity instead, keep their
subtitle, and carry a `→` mark plus ", next" in the accessibility label — because a border
colour alone was WCAG 1.4.1, and sage-on-warm-grey is the deuteranopic worst case.

### 12.2 Security: the promise held at the centre and leaked at the edges

No code path in the app can send user content off-device, and that is enforced by a test
rather than by intent. The failures were all at the edges:

- **Every export wrote the whole journal in plaintext to the app cache and left it there** —
  where `wipeState()` does not reach, so after one export the "Delete everything" button on
  that same screen stopped being true. Now deleted in a `finally` once the share sheet closes.
- **The crash screen still used `Share.share({ message })`** — the text sheet whose leading
  rows are Messages, Mail and WhatsApp, carrying every thought record and the relapse plan
  including `whoToTell`. Progress was rewritten specifically to avoid that; this screen kept
  it, and it fires when the person is most rattled. Now a file share, then deleted.
- **`StorageNotice` was mounted only on Progress** despite its own docblock saying otherwise.
  It is the sentence that retracts onboarding's "nobody, including us, can read it" when the
  keychain is unreachable and the session is being written in plain text. Now on Today.
- The web download path appended and removed the anchor and deferred `revokeObjectURL`, since
  Firefox will not dispatch a click on a detached element and Safari can abort a download
  whose blob URL is revoked in the same tick — and this is the only backup route in an app
  with no server.

### 12.3 The build pipeline could go green without running

Three ways, all now closed and all three demonstrated rather than argued:

1. **A signal-killed run exited 0.** `code` is `null` when a child dies from a signal, and
   `process.exit(null)` exits zero. An OOM-killed suite printed nothing and CI recorded a pass.
2. **`process.exit(0)` mid-file makes node report the whole file `ok`** — no `not ok` line
   exists for the scanner to find. Stdout cannot reveal this, so there is now a floor on the
   test count.
3. **The glob was `__tests__/*.test.mjs`**, so a suite in a subdirectory ran zero times and
   said nothing. `__tests__/helpers/` already established the habit.

The reporter is also pinned and `NODE_OPTIONS` cleared on the child: failure detection reads
TAP, and node only defaulted to TAP because stdout happened to be a pipe.

**And preflight had a disarmed check reporting ✓.** With zero tags — which is where the repo
is — the build-number monotonicity check compared nothing and printed a clean tick, in a file
whose own header states that a disarmed check is a failing check. It now reports as skipped,
which routes to the exit-2 path that already existed.

### 12.4 What was found and NOT fixed

Recorded rather than quietly dropped:

- **The app cannot be submitted, and it is not a code problem.** `legal/entity.json` has no
  `name`, and D-U-N-S → Apple Organization enrolment → a privacy-policy URL all hang off that
  one null. Realistically four to eight weeks, dominated by third parties.
- **`purchase()` grants paid access with no StoreKit and no money.** Preflight blocks on it;
  CI does not run preflight.
- **`usesNonExemptEncryption: false`** is declared while shipping a third-party 256-bit AEAD
  over user content at rest, justified in the docs by "the app makes no network calls" — which
  is not the EAR test. Needs somebody who does export compliance, not another opinion here.
- **The age rating is planned as 4+** for an app whose first-run survey contains an explicit
  self-harm tile and whose keywords include two clinical diagnoses.
- **`weekGated()` and `FREE_LIMITS.maxWeek` have no call sites**, so the paywall's own table
  describes a boundary the code does not enforce.
- **iPad is declared supported with no iPad screenshots**, which blocks submission on its own.
- `maxFontSizeMultiplier` is a no-op on react-native-web, so every text-size cap in the app
  exists on one of two shipping targets. The tab bar overflows at 2.2x and the Support pill
  occludes content on four screens that do not use `SUPPORT_PILL_CLEARANCE`.
