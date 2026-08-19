# Direction: what to build, and what it can be worth

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
