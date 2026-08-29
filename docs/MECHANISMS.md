# What is actually in here, mechanism by mechanism

An inventory of the therapeutic components the app ships, written against the code rather
than against the brief. Every row names the file it lives in, so this document can be
checked rather than believed.

Three lists, in order of how much they should worry anybody: **what is in and working**,
**what is deliberately not here and why**, and **what is genuinely undecided and needs the
founder's answer**. The third list is the only one that is a question.

---

## 1. What ships

### 1.1 Cognitive

| Mechanism | Where | Notes |
|---|---|---|
| Cognitive restructuring — full thought record | `content/exercises.ts` `THOUGHT_RECORD_STEPS`, `app/journal.tsx` | Situation → thought → evidence → what you would tell a friend → the balanced line. Writes the distortion tags into the export the person keeps. |
| The distortion taxonomy | `content/exercises.ts` `DISTORTIONS` | Vocabulary only. Never quizzed — §10.2 of `DIRECTION.md` records why: no dismantling study has ever isolated distortion-labelling. |
| Self-distanced prospective reflection | `content/curveball.ts`, `app/game/curveball.tsx` | Curveball. Third person, before the event, choosing an action rather than naming an error. Schertz 2025 is the reason for both the person and the tense. |
| Countering discounting-the-positive | `content/ballast.ts`, `app/game/ballast.tsx` | Ballast. A positive data log built around the filter that deletes the evidence, rather than around the collecting. |
| Psychoeducation | `content/modules.ts` | Twelve modules: attention narrowing, checking, mirrors and cameras, comparison, felt-sense vs. appearance, worse-before-better, self-compassion without lying, reclaimed time, reassurance-seeking, lapse vs. relapse, the fire-exit plan, and when self-help is not enough. |

### 1.2 Behavioural

| Mechanism | Where | Notes |
|---|---|---|
| Behavioural activation + graded task assignment | `content/groundwork.ts`, `app/game/groundwork.tsx` | Groundwork. The mechanic is SIZE, not planning — the ground gives way under one large action, visibly, before anything is committed to. The component Furukawa 2021 found *is* additive. |
| Prediction testing / behavioural experiments | `content/exercises.ts` `EXPERIMENT_FIELDS` | Predict → do → what actually happened → what that changes. |
| Exposure and response prevention | `app/mirror.tsx`, `constants/mirrorPrompts.ts` | Mirror sessions, locked until phase 2 of the protocol. |
| Response prevention for reassurance-seeking | `content/modules.ts` "Asking other people is checking too" | Taught; not yet a practice of its own. |
| Urge surfing | `content/exercises.ts` `URGE_SURF`, `app/urges.tsx` | Before / during / after, with the intensity logged at both ends. Free forever. |
| Relapse prevention plan | `content/exercises.ts` `PLAN_SECTION_COPY`, `app/plan.tsx` | Early signs, triggers, what worked, the fire exit. |

### 1.3 Acceptance and attention

| Mechanism | Where | Notes |
|---|---|---|
| Cognitive defusion | `content/toward.ts`, `app/game/toward.tsx` | Toward. The thought is pinned above the choices, never argued with, and still there at the end. |
| Values clarification and committed action | `content/toward.ts`; `content/exercises.ts` `VALUES_ANCHOR` | The game ends in one small thing to actually do, never a score. |
| Experiential avoidance, made mechanical | `content/toward.ts` | Away moves compound — the scene returns bigger rather than being marked wrong. |
| Task concentration / attention widening | `content/exercises.ts` `WIDENING`, `app/grounding.tsx` | Narrow-to-wide, trained as a movable skill. The BDD-specific attention mechanism. |
| Sensory grounding (5-4-3-2-1) | `content/exercises.ts` `SENSES_STEPS`, `app/grounding.tsx` | Free forever. |
| Open monitoring | `content/still.ts` Float, `app/still.tsx` | |
| Interoceptive awareness / body scan | `content/still.ts` Reset, `app/still.tsx` | NSDR-shaped. No dopamine claim — `__tests__/still.test.mjs` fails if the word appears. |

### 1.4 Physiological

| Mechanism | Where | Notes |
|---|---|---|
| Paced breathing, short | `content/exercises.ts` `BREATH`, `app/grounding.tsx` | 4-7-8, four cycles, about eighty seconds. Free forever. |
| Paced breathing, long | `content/still.ts` Breathe, `app/still.tsx` | In-4 / out-6 with **no hold** — a five-minute 4-7-8 would contradict the app's own safety copy. |

### 1.5 Structure, measurement and safety

| Mechanism | Where | Notes |
|---|---|---|
| Self-monitoring | `app/checkin.tsx` | Appearance preoccupation in minutes, plus what the day looked like. |
| Validated outcome measurement | `content/measure.ts`, `lib/measure.ts`, `app/measure.tsx` | PHQ-8 and GAD-7 at baseline, 30, 60, 90 days. No severity band anywhere, by design. Always free, always skippable. |
| Reliable-change gating on language | `lib/measure.ts` `RELIABLE_CHANGE` | The app may only call movement movement when it clears 5 (PHQ) or 4 (GAD). |
| Seven written tracks | `content/tracks.ts` | breakup / flat / spirals / spent / harsh / unmoored / looking. Each one built around an intervention it refuses first. |
| Entry triage | `content/survey.ts`, `app/onboarding/survey.tsx` | Three questions, answered by picking a landscape. Scores nothing, labels nothing, and routes to a track, a game and a calm mode. |
| Crisis pathway | `content/survey.ts` `CRISIS_TILE`, `app/support.tsx`, `constants/support.ts` | 31 regions. Ends the survey on the spot. One tap from every screen, forever, never gated. |
| The hard-day path | `app/grounding.tsx` | Free forever, `__tests__/safety.test.mjs` enforces it. |

---

## 2. Deliberately not here

These are decisions already made and recorded. They are on this list so that a gap is not
mistaken for an oversight.

| Absent | Where the decision lives | Why |
|---|---|---|
| Working-memory / attention "brain training" game | `DIRECTION.md` §9.2, §9.3 game 1 | **CUT.** No far-transfer evidence. Lumosity's $50M FTC judgment is the precedent, and this was the single largest legal exposure in the brief. |
| TIPP's temperature and intense-exercise components | `DIRECTION.md` §9.2 | Cold-water face immersion drives the dive reflex. An app cannot screen for cardiac risk and must not instruct an unscreened, distressed person. |
| Any dopamine / NSDR mechanism claim | `content/still.ts` header, `DIRECTION.md` §9.2 | The claim traces to an n=8 uncontrolled 2002 study that never measured what it is cited for. The practice stays; the story goes. |
| Mic and accelerometer biofeedback | `DIRECTION.md` §9.3 game 4 | Phone-mic breath detection is unreliable enough that the feedback would be lying to somebody about their own body. |
| Sleep, diet and exercise advice | `content/tracks.ts` refusal 7 | It is what everybody has already said, and being unable to do it is part of what flat *is*. |
| Gratitude lists and positive affirmations | `content/tracks.ts` refusals 8 and 9, `content/ballast.ts` | Affirmations leave people with low self-esteem feeling worse. Ballast works the discounting instead. |
| Distortion-naming quizzes | `DIRECTION.md` §10.2 | Nothing has ever isolated it, and being graded on your own thinking by software is a status move. |
| Severity bands on any score | `content/measure.ts`, `lib/measure.ts` | No function exists that turns 14 into a word, because the moment one exists somebody renders it. |
| Risk inference from instrument scores | `app/measure.tsx` | Unvalidated here, and a false positive teaches somebody the app is watching them. |
| Any efficacy claim resting on the game layer | `DIRECTION.md` §9.2 | Six et al. 2021: gamification adds neither efficacy nor adherence. The content is the active ingredient. |

---

## 3. What is undecided — the founder's calls

Ordered by how much each one costs to answer later rather than now.

**3.1 The twelve-week protocol versus the games app.** `DIRECTION.md` §9.5, still open. The
app opens into a body-dysmorphia programme with a week counter, four phases and a mirror
practice gated to phase 2; the pivot says Anneal is a games app, and a games app has no week
7. `lib/protocol.ts` radiates into the home screen, `lib/moments.ts`, the streak and a safety
test. Everything else on this list is small next to it.

**3.2 Distress tolerance.** Game 7 is `REDESIGN`, not `CUT` — paced breathing survives and
paired muscle relaxation was explicitly kept. Neither PMR nor any distress-tolerance
sequence exists anywhere in the codebase today. Build it minus temperature and exercise, or
decide the grounding tools already cover the slot and close it.

**3.3 The somatic slot.** Game 4 is `REDESIGN` — "paced breathing without sensing keeps the
evidence". Still's Breathe *is* paced breathing without sensing. So either that slot is
already served and should be marked shipped, or something is meant to be there that is not.

**3.4 Art therapy.** Game 6 is `KEEP, last` — weakest evidence of the survivors, near-zero
risk, highest ceiling on somebody wanting to open it. Unbuilt. Build or drop.

**3.5 Habit reversal.** Skin-picking and hair-pulling overlap heavily with the population
this app was originally written for, and there is nothing for either. Not refused anywhere —
simply never considered. Needs a yes or a recorded no.

**3.6 Self-compassion as a practice.** It is taught in a module and reasoned about at length
in the harsh track, which correctly refuses the affirmation version. There is still no
practice a person can do. Whether that gap is deliberate is not written down.

**3.7 Sleep.** `content/tracks.ts` refuses sleep advice for a good reason, and PHQ-8 measures
sleep as one of its eight items. Both can be right, but the app currently measures something
it has decided never to address, and that should be a decision rather than an accident.

**3.8 Sound.** The brief asks for score and sound design "like a modern ambient record".
There is no audio dependency and no assets. `content/still.ts` names this as a gap rather
than a decision.

**3.9 The screen locks during a twenty-minute Reset.** `expo-keep-awake` is not in
`package.json`, and adding a dependency goes through the import allowlist. Small, but it
makes the longest practice in the app unusable as written.

**3.10 The clinical reviewer.** `DIRECTION.md` §9.4. Until one exists, no clinical
validation language anywhere and freemium is the only model. Weeks of calendar time, almost
no working time, and every institutional route runs through it.
