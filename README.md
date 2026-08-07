# Steady

A private body-image support app. Twelve weeks, organised around one number: **hours
reclaimed**.

Body-image distress steals time — one to five hours a day for most people, in thinking,
checking, getting ready, avoiding, and recovering. Every screen in Steady serves one
question: *how many hours did you get back this week, and what did you do with them?*

Progress is never "you look better." Progress is hours reclaimed, checking urges
resisted, and distress falling across repeated exposures.

> Steady is an educational self-help tool. It isn't therapy, diagnosis, or medical
> advice. Read [SAFETY.md](./SAFETY.md) before changing anything — the constraints in it
> are load-bearing.

---

## Running it

```bash
npm install
npx expo start --web
```

Then open **http://localhost:8081**.

### On your phone, through Expo Go

Install **Expo Go** from the App Store or Play Store, then on a computer on the
same Wi-Fi as the phone:

```bash
git clone https://github.com/Borntosoar/steadyapp.git
cd steadyapp
npm install
npx expo start
```

Scan the QR code that appears in the terminal — with the Camera app on iOS, or
from inside Expo Go on Android. The phone and the computer have to be on the
same network; if they are not, `npx expo start --tunnel` routes it over ngrok
instead, which is slower but works from anywhere.

The camera permission prompt only appears on the mirror screen, and declining it
is a supported path — the session runs text-guided instead. Nothing is captured
either way.

```bash
npm test          # 209 assertions, no test runner to install — node --test
npm run typecheck # tsc --noEmit
```

See `docs/API.md` for the module contract between `lib/`, `store/` and the screens,
and the two integration seams (RevenueCat, store review).

Requires Node 22+ (the test suite uses Node's built-in TypeScript stripping).

---

## The protocol

Twelve weeks in four phases. **Weeks unlock on completion of four practice days, never on
elapsed time** — falling behind is not representable in the data model.

| Phase | Weeks | Goal | What you actually do |
|---|---|---|---|
| 1 · See the pattern | 1–3 | You see your own numbers for the first time | Daily check-in and reading. No exposure yet. |
| 2 · Interrupt the loop | 4–6 | First measurable drop in checking | Urge log, urge surfing, thought records, first 90-second mirror sessions |
| 3 · Widen the lens | 7–9 | Avoidance drops | Attention training, longer sessions with an avoided condition added, behavioural experiments |
| 4 · Live in the hours | 10–12 | You leave with a plan and a number | Values work, spending the reclaimed time, relapse plan |

Week 1 is free. Weeks 2–12 are Steady+ — but grounding, breathing, the daily check-in,
the hard-day path, and all crisis support are free forever and always within two taps.

---

## Screens

**Onboarding** — five steps, disclaimer-gated. Captures the four-question baseline that
every later number is measured against.

**Home** — reclaimed hours, dominant. One recommended action, not a menu of nine. Week
ring, practice streak, and a "today is a hard day" button that routes to grounding and
preserves the streak.

**Check-in** — four questions, under thirty seconds. Bucketed time, urge strength,
avoidance, distress.

**Mirror** — graded exposure, phase-locked. Pre-rating → timed session with a rotating
neutral-description prompt every 25 seconds → post-rating → the delta, and the trend of
deltas across sessions. Three surfaces: native camera, web `getUserMedia`, or a
text-guided session if either is declined. The third path collects identical data.

**Journal** — a seven-step thought record with tappable distortion definitions, and the
behavioural-experiment engine: predict, drop a safety behaviour, do the thing, record
what actually happened, re-rate. The archive of past experiments is the evidence.

**Urges** — the checking log and the three-minute urge-surfing timer. The running
*urges resisted* count is the largest object on the screen.

**Grounding** — free forever. 5-4-3-2-1, 4-7-8 breathing, attention widening, values
anchor.

**Progress** — hand-rolled SVG charts: reclaimed hours by week, distress, checking
frequency, avoidance, mirror-session deltas. Plus a locally generated plain-English
summary, a plain-text export to hand a clinician, and a full backup file. Both exports
are free on every tier — onboarding promises them as the only backup, so selling them
would make that sentence false.

**Support** — region-selectable crisis lines (CA/US/UK/AU/other) and guidance on finding
a clinician who treats this specifically. Free, always, one tap from every screen.

---

## Layout

```
app/                     expo-router routes
  _layout.tsx            theme, onboarding gate, persistent Support button,
                         flush-on-background
  (tabs)/                the four-tab shell
    _layout.tsx          hand-drawn tab bar
    index.tsx            Today
    practice.tsx  progress.tsx  learn.tsx
  checkin.tsx  mirror.tsx  journal.tsx  urges.tsx
  grounding.tsx  support.tsx  paywall.tsx
  module/[slug].tsx      one learn module
  onboarding/index.tsx   seven steps, cost mirror at step four

components/
  ui.tsx                 Screen, Card, Button, Field, Options, Scale, theme
  Atmosphere.tsx         procedural SVG scenes — no photography, see SAFETY.md
  MomentCard.tsx         the only renderer of an unprompted message
  StorageNotice.tsx      surfaces a failed read or a failed write
  MirrorSurface.tsx      platform-guarded live mirror — no capture path
  BreathCircle.tsx       4-7-8 and the quiet loop, reduce-motion aware
  charts.tsx             hand-rolled SVG line and bar
  RichText.tsx           renders **bold** / *italic* in module prose

lib/                     pure. no React, no store — enforced by test
  reclaimed.ts           the headline metric
  cost.ts                the cost mirror, ~90 seconds into onboarding
  protocol.ts            12 weeks, 4 phases, unlock rules, mirror hierarchy
  streak.ts              freezes, milestones, and dayKey — local, not UTC
  moments.ts             the one scheduler for everything unprompted
  entitlement.ts         ALWAYS_FREE_ROUTES, pricing, pure predicates
  storage.ts             versioned envelope, migrations, export/import
  inline.ts              two-mark emphasis parser

hooks/useEntitlement.ts  the React half of entitlement, out of lib/ on purpose

content/                 all shipped prose and scripts
  modules.ts             12 learn modules
  exercises.ts           grounding, urge surfing, hard day, experiment, record
  copy.ts                microcopy — the whole tone surface in one file
  proof.ts               evidence cited in place of social proof we don't have

constants/               theme, support lines, mirror prompts
store/useStore.ts        zustand + AsyncStorage, the only mutator
docs/API.md              the module contract and the integration seams
__tests__/               reclaimed · protocol · streak · moments · storage ·
                         timezone · modules · copy · safety
```

---

## Notable implementation decisions

**Scales are tappable 0–10 buttons, not sliders.** Drag sliders invite micro-adjustment,
which is its own form of checking, and they behave poorly on web. Bigger targets, no
dependency.

**The reclaimed-hours metric has a ±0.25h/week flat band.** Without it, a one-minute-a-day
improvement reports as progress. Selling seven minutes as a win is how a tool like this
loses someone the first time they notice.

**"Last week" copy is backed by a real week-over-week figure.** The positive branch
compares to baseline; the flat and negative branches speak about last week. Rather than
let those strings describe a comparison that was never computed, `computeReclaimed` takes
an optional previous window and the copy falls back to baseline-true wording when no
prior week exists.

**The hard-day path logs the moment it opens**, not on completion. Showing up on a bad
day is the most valuable thing someone can do that day; making it conditional on
finishing something would be backwards.

**Leaving urge surfing early still counts as resisted.** You did not act on it. That is
the part that matters.

**Tone is enforced by tests, not review.** `__tests__/copy.test.mjs` walks every exported
string in `content/` — recursing through objects and calling the string-returning
functions — and asserts no exclamation marks, no failure language, no appearance
evaluation, no numbers about bodies, no treatment claims, and no paywall urgency. A new
string cannot escape the rules by not being on a list.

---

## Payments

`lib/entitlement.ts` reads a local flag and exposes `useEntitlement()`. Every gate in the
app reads through that hook, so wiring a real provider touches one file — look for
`// REVENUECAT INTEGRATION POINT`. There is no backend and no receipt validation in v1.

---

## Not a medical device

Steady does not diagnose or treat anything. If appearance concerns are taking hours of
most days, or you are avoiding work, school, or people, that is worth a proper
assessment. The Support tab has crisis lines and guidance on finding a clinician who
works with body dysmorphic disorder or OCD-spectrum conditions specifically.

All content is general and educational, not a substitute for professional assessment or
care.
