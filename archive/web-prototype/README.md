# Steady

A private, local-only web app for body dysmorphia and body image distress. It carries the working components of BDD-specific CBT — the treatment with the strongest evidence behind it (pooled **d = −1.22** across 7 randomized trials, N=299).

Open `index.html` in any modern browser. No build step, no dependencies, no server, no network requests of any kind.

---

## The design problem, and how this resolves it

Engagement in this category is normally built on the compulsion. A daily "check your face" prompt is excellent for retention and clinically toxic — appearance self-monitoring **is** the maintaining behaviour in BDD, so a daily attractiveness score isn't a body-image intervention, it's the disorder productized.

So retention here is built on the other thing that brings people back: **visible improvement**. That's not a compromise — it's what the outcome data supports. In Wilhelm's trial ~50% responded by week 12 and ~81% by week 22; in the escitalopram continuation trial responders kept improving (35.7% further gains) while stopping doubled relapse. Sticking with it *is* the therapeutic act.

**The governing rule: every number in this app is one that should go down.** Distress, urge intensity, time lost, avoidance, belief conviction. A metric framed to go *up* — attractiveness, rating, rank — is iatrogenic no matter how kind the copy wrapped around it.

### Deliberately absent

No camera or photo upload. No appearance scoring, rating, percentile, or ranking. No before/after comparison. No social feed or leaderboard. No daily appearance check-in. No counter-reassurance either — the app will not tell you that you look fine, because "you look completely normal" is reassurance wearing a different coat.

---

## What's in it

**Onboarding — your own maintaining cycle.** Four questions build a personalized trigger → thought → distress → compulsion → relief → stronger-urge loop. This is module 1 of CBT-BDD, and most early therapeutic movement comes from recognising you're inside a known mechanism rather than personally defective. Every later screen refers back to it.

**Practice** — seven exercises:
- **Urge surfing** with a live timer and a before/after rating, producing the user's own evidence that urges fall without being obeyed
- **Perceptual retraining** — 12 body regions, timed, neutral factual description at conversational distance. The distinctive BDD component and the one non-specialists most often omit; it directly opposes the local-detail processing bias Feusner's imaging work identified
- **Delay the check** (2/5/10/30 min) — bans fail, delays work
- **Attention widening**, **5-4-3-2-1 grounding**, **box breathing**, **a friend's voice**

**Exposure ladder.** Users build and climb their own hierarchy. Each attempt is framed as a behavioural experiment — state the prediction, drop the compulsion, record what *actually* happened — which outperforms pure habituation. SUDS updates to the most recent rating so the step visibly gets easier.

**Thought records.** Standard CBT structure plus a downward-arrow prompt to the core belief, because the target is never "my nose is fine" — it's that your nose isn't what decides whether you're acceptable.

**Weekly check-in.** An 8-item self-report severity tracker (0–32), plus belief conviction tracked separately, plus a risk item. Results are reported against the real trial benchmarks: ≥30% reduction is treatment response, ≥50% is "very much improved."

**Progress.** Severity and conviction trend lines, practice streak, urge-resistance rate, mean urge drop — and **"What BDD took, and what you've got back."** That last one is the outcome that actually matters; symptom scores are a proxy for it.

**Clinician export.** Copy or download a plain-text summary. Only ~15% of people with BDD are ever diagnosed and shame is the main barrier to disclosure — handing someone a written record is far easier than saying it out loud.

**Learn.** Ten psychoeducation cards with attributed figures, and explicit confidence grading where the evidence is contested (e.g. social media, where state-body-image effects are real but causation is unresolved and longitudinal effects small).

---

## Two safety behaviours worth calling out

**The risk item takes precedence over everything.** If someone endorses thoughts of self-harm, the app suppresses the progress message entirely and shows crisis resources instead — it never congratulates someone on a falling score in the same breath. It's asked plainly, because asking does not plant the idea. Verified in the test suite.

**The streak counts response prevention, not app opens.** An app-open streak trains you to open the app. This one only advances on days you resisted or delayed a compulsion, ran an exposure, did retraining, or completed a thought record. Missing a day costs the streak but never produces a guilt message — shame drives concealment, which is the opposite of the goal.

---

## Privacy

Everything lives in `localStorage` on the device. No account, no backend, no analytics, no network request of any kind — verified in the test suite, which fails on any non-`file://` request. "Erase everything" is available in Progress. Clearing browser data wipes it.

---

## Architecture

```
index.html      shell + modal
styles.css
js/content.js   psychoeducation, exercise protocols, measures
js/store.js     localStorage + derived metrics
js/app.js       UI and routing
```

The weekly severity measure is **original**, not the BDD-YBOCS. The BDD-YBOCS is a copyrighted, rater-administered clinical instrument; reproducing it in a self-help app would be both a licensing problem and a clinical misuse. This scale covers the same six load-bearing domains (time, distress, interference, resistance, control, avoidance) so the trend is meaningful, and it's labelled throughout as self-report tracking rather than a diagnostic score. Belief conviction is tracked separately, modelled on the construct the Brown Assessment of Beliefs Scale measures.

---

## Not a medical device

A self-help companion, not treatment or diagnosis. Crisis resources are one click away from every screen. For persistent distress, a therapist experienced in CBT or ERP for BDD is the right step — the International OCD Foundation (iocdf.org) maintains a specialist directory.

If appearance concerns take an hour or more of most days, or you're avoiding work, school, or people, that's worth a proper assessment.

---

## The `bdd-expert` skill

`.claude/skills/bdd-expert/` is the Claude Code skill this app's content was built from — the clinical evidence base, assessment instruments, treatment protocols, and a conversation playbook, with claims graded **[Established] / [Probable] / [Contested]**. `evals/` holds its test cases.
