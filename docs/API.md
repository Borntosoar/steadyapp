# API.md

Cairn has no server, no account, no endpoints, and no network call anywhere in the
codebase. That is SAFETY.md §6 and it is the product, not an implementation detail. There
is nothing here to write an OpenAPI spec about, and if you find yourself reaching for one,
the feature you are about to add is the thing that breaks the promise.

The API that does exist is the contract between the three layers of the app. `lib/` holds
the engine, `store/` is the only thing allowed to mutate it, and `app/` and `components/`
read the result. That boundary is the surface a contributor has to get right, and several
of its signatures changed recently, so this file states them as they actually are. Every
signature below was read off the source rather than remembered.

---

## 1. Architecture in brief

Three layers, one direction of dependency.

```
app/  components/     screens and views. Read through hooks. Never call saveState.
        |
        v
store/useStore.ts     the only mutator. Owns persistence, debounce, and the write lock.
        |
        v
lib/                  pure functions over plain data. No React, no store, no side effects.
```

**`lib/` is pure.** No `import React`, no hooks, no JSX, and no import from `store/`. A lib
module takes plain values and returns plain values. `lib/storage.ts` is the single
exception to "no side effects" — it talks to AsyncStorage, because somebody has to — and it
is written so that every decision it makes (`normalise`, `migrate`, the export and import
functions) is a pure function that can be tested without touching a device.

**`store/useStore.ts` is the only mutator.** It is the sole caller of `saveState`, the sole
owner of the debounce timer and the write chain, and the sole place `AppState` is assembled
from the engine's return values. A screen that writes to storage directly has bypassed the
write lock described in §2.1, and the first thing it will do on a bad load is destroy
somebody's journal.

**Screens read through hooks.** `useStore((s) => s.field)` for state, `useEntitlement()`
for billing, and the pure lib functions called directly with values pulled out of the
store. Screens compute; they do not decide what to persist.

### Why the rule is worth defending

Everything in `lib/` runs under `node --test` without mounting React:

```bash
npm test          # 208 assertions, 46 suites
npm run typecheck # tsc --noEmit
```

The suite works by importing lib modules straight into a `.mjs` test file:

```js
import { computeReclaimed, reclaimedByWeek } from '../lib/reclaimed.ts';
```

There is no jest, no react-test-renderer, no transform step and no test config. That is why
the whole suite runs in about four seconds and why rules that are really about tone and
safety — no shaming language, no appearance metric, no urgency copy — can be enforced as
assertions rather than as review notes. The instant a lib module imports React, every test
that imports it stops running, and the assertions that were protecting a clinical constraint
quietly stop protecting anything.

Two mechanical consequences follow, and both bite immediately if ignored:

1. **Sibling imports inside `lib/` carry an explicit `.ts` extension.** Node's ESM resolver
   does not guess. `lib/storage.ts`, `lib/reclaimed.ts` and `lib/moments.ts` all import
   `'./streak.ts'` with the extension for exactly this reason. Files under `store/`, `app/`
   and `components/` go through Metro, which does guess, so they are written without it.
2. **A new lib module must be importable from a bare Node process.** If it needs a native
   module to load, it is not a lib module.

### The rule is enforced, not just described

`lib/entitlement.ts` used to import `useStore` and export `useEntitlement()`, a React hook.
It pointed the wrong way down the diagram, and it was the reason that module was the only
one in `lib/` with no test file: a suite running under bare Node cannot import something
that reaches for zustand.

The hook now lives in `hooks/useEntitlement.ts`. What stays in `lib/entitlement.ts` is data
and pure predicates — `ALWAYS_FREE_ROUTES`, `PRICING`, `Plan`, `FREE_LIMITS`,
`TIER_COMPARISON`, `isGated`, `weekGated`, `trialEndDate` — all directly importable and
testable.

`__tests__/safety.test.mjs` asserts that no file under `lib/` imports React, React Native,
or `../store/`. If you are tempted to reach for the store from a lib module, the thing you
want is almost always a parameter.

---

## 2. The engine modules

### 2.1 `lib/storage.ts`

Persistence, and the only copy of somebody's private journal. There is no server to
re-fetch from, which makes the failure modes here total rather than annoying.

#### Constants

```ts
export const STORAGE_KEY = 'steady.state.v2';
export const QUARANTINE_PREFIX = 'steady.unreadable.';
export const SCHEMA_VERSION = 3;
```

`STORAGE_KEY` never changes again. The `.v2` suffix is a historical artefact of the first
release; renaming it now strands every existing user's data under a key nothing reads.
Versioning happens **inside** the payload envelope, never in the key name.

#### `emptyState(): AppState`

A fresh install. Returns a new object every call, so it is safe to spread.

#### `normalise(parsed: unknown): AppState`

**The type boundary.** Everything past this call may be trusted to match `AppState`;
nothing before it may be, whatever the declared types say.

`JSON.parse` returns `any`, and spreading `any` into an object literal makes the whole
literal `any`, so `tsc` will happily certify a stored record that is missing half its
fields. `normalise` merges each nested object against its own default, coerces every
collection to an array, forces `entitled` to a real boolean (`p.entitled === true`, so a
truthy string cannot grant entitlement), and merges **each individual moment record**
against `emptyMomentRecord()` rather than merging only the outer map. That last one is
load-bearing: a `MomentRecord` missing `shows` turns `shows + 1` into `NaN`, and
`NaN >= maxShows` is `false`, which produces a prompt that can never retire.

**Invariant:** any path that turns stored bytes into `AppState` goes through `normalise`.
There are exactly two such paths, `loadState` and `importJson`, and both do.

#### `MIGRATIONS` and the version contract

```ts
export const MIGRATIONS: ((s: Record<string, unknown>) => Record<string, unknown>)[];
```

Append-only. `MIGRATIONS[n]` upgrades a payload at version `n` to version `n + 1`. Pure
functions over plain objects, so they are testable without mounting anything.

The contract, in full:

- Adding a migration means **appending** a function and **bumping** `SCHEMA_VERSION`.
  `__tests__/storage.test.mjs` asserts there is a migration slot for every version, so
  bumping one without the other fails the suite.
- Never edit an existing migration. A user three versions behind will run it.
- A payload with no `v` field predates the envelope and is treated as version 2.
- The current 2→3 step is a deliberate no-op, because `normalise` already backfills
  `moments` and `trialStartedAt` with static defaults. 3 → 4 is the first that DERIVES a
  value: it folds `entitled: boolean` and `trialStartedAt` into a single `entitlement`,
  which may need a value derived from existing data, has somewhere to live other than a
  comment.

#### `loadState(): Promise<LoadResult>`

**This does not return a bare `AppState`.** It used to. It returns:

```ts
export interface LoadResult {
  state: AppState;
  /** False when stored bytes existed but could not be read. */
  ok: boolean;
  /** Key the unreadable payload was copied to, when there was one. */
  quarantinedAt?: string;
}
```

Three outcomes:

| Situation | `state` | `ok` | `quarantinedAt` |
|---|---|---|---|
| Fresh install, nothing stored | `emptyState()` | `true` | absent |
| Read succeeded and parsed | migrated + normalised | `true` | absent |
| `getItem` threw | `emptyState()` | `false` | absent |
| Stored bytes were unparseable | `emptyState()` | `false` | quarantine key, if the copy succeeded |

**The invariant a caller must not violate: when `ok` is false, writes stay locked.**

A read that fails is not an empty journal. Returning a plausible-looking blank slate hands
the app something that behaves exactly like a fresh install, and the very next mutation
writes that blank over bytes that were still sitting on disk and still recoverable. The
unparseable payload is copied under `QUARANTINE_PREFIX${Date.now()}` before anything else
happens, and it is never garbage-collected. Losing one session of edits is recoverable.
Losing a year is not.

`store/useStore.ts` enforces this in `persist()` and `flushState()` with `if (!get().loadOk) return;`.
Anything else that learns to write must do the same.

```ts
const { state, ok, quarantinedAt } = await loadState();
set({ ...state, hydrated: true, loadOk: ok, quarantinedAt: quarantinedAt ?? null });
```

#### `saveState(state: AppState): Promise<boolean>`

**Returns a boolean, and the boolean matters.** `false` means the write did not land.

Silence used to be the whole policy here, on the grounds that an error dialog during a
grounding exercise is worse than a lost entry. The first half of that is still true —
nothing about this surfaces modally, and never on a safety screen. The second half was
wrong: because the entire state is one value under one key, a quota failure is not a lost
entry, it is every entry from now on, silently, until reinstall.

#### `wipeState(): Promise<void>`

Removes the key. Swallows errors. Callers must cancel any pending debounced write first,
or a save queued 150ms ago lands after the removal and rewrites the journal straight back.
`useStore.reset()` does this.

#### `exportText(state: AppState): string`

Plain-text summary for a person or a clinician. Contains no appearance value, because none
is stored.

#### `exportJson(state: AppState): string`

Lossless backup, the same envelope shape `loadState` reads: `{ v: SCHEMA_VERSION, data: state }`,
pretty-printed. This is the real backup path.

#### `importJson(raw: string): AppState | null`

Parses a previously exported backup. **Never throws and never half-applies.** Returns
`null` when the file has none of the expected collections, because silently replacing
somebody's journal with their shopping list would be unforgivable. The caller confirms
with the user before replacing local state.

**Invariant (SAFETY.md §11b):** export is free on both tiers and must contain what the user
actually wrote. An export that reduced a year of thought records to `Thought records completed: 41`
is a progress summary wearing a backup's job title. Predictions and outcomes are included
too; §11 freezes them precisely so they can be looked back on.

---

### 2.2 `lib/streak.ts`

#### `dayKey(d: Date | string = new Date()): string`

Returns a **local** calendar day as `YYYY-MM-DD`.

```ts
import { dayKey } from './streak.ts';

dayKey();                       // today, in the device's zone
dayKey(new Date(iso));          // the local day that ISO instant fell on
dayKey('2026-03-14');           // idempotent on an existing key
```

**This is the single source of truth for "today", and it is local, not UTC.** Every date
written to storage comes from here, so anything comparing against a stored date must come
through here too.

The reason this is stated in capital letters rather than left as a detail: `lib/moments.ts`
used to define its own `dayKey` on `toISOString()`, which is UTC. Two definitions of "today"
inside one persisted object produced four separate bugs, the worst of which was this. For a
user in Sydney, a 10-out-of-10 distress check-in filed that morning carried a local date one
day ahead of the UTC "today". The scheduler's `gap < 0` guard read that as a future date and
skipped it, so distress suppression did not trigger, and the upgrade prompt fired at
somebody having the worst day the app had ever recorded — the exact scenario the suppression
rule exists to prevent.

Every test passed throughout, because the fixtures built their dates in UTC too. That is why
`__tests__/timezone.test.mjs` now runs the day-key and scheduler assertions with `TZ` set
across several zones, and why `lib/moments.ts` re-exports `dayKey` rather than owning one.

Anything that slices ten characters off an ISO string is reintroducing the bug. Use
`dayKey(new Date(isoString))`.

#### `daysBetween(a: string, b: string): number`

Whole calendar days from `a` to `b`, both `YYYY-MM-DD`. Negative when `b` is earlier.
Rounds rather than floors, which is what keeps it exact across daylight-saving transitions:
a seven-day span that crosses spring-forward measures 6.958 days in raw milliseconds and
floors into the wrong week.

#### `initialStreak(): StreakState`

```ts
{ current: 0, longest: 0, freezesRemaining: 2, lastPracticeDate: null, frozenDates: [] }
```

#### `registerPractice(state: StreakState, today = dayKey(new Date())): StreakState`

Pure. Returns the next state.

| Gap since `lastPracticeDate` | Behaviour |
|---|---|
| `<= 0` | already counted today, state returned unchanged |
| `1` | consecutive, `current + 1` |
| `> 1`, missed days covered by banked freezes | `current + 1`, freezes spent, missed days pushed to `frozenDates` |
| `> 1`, not enough freezes | `current` restarts at 1, `longest` preserved |

**Invariant (SAFETY.md §3):** freezes apply silently and a restart is silent. There is no
return value, field, or string here that tells the user they nearly lost something or that
they lost it. The user most likely to miss a week is the user having the worst week, and
that is precisely the person this app most needs to keep.

A freeze is earned every `DAYS_PER_EARNED_FREEZE` (7) consecutive days, capped at
`MAX_FREEZES` (5).

#### `milestoneReached(previous: number, next: number): number | null`

Returns the milestone crossed on this increment, or `null`. Fires on the crossing only,
never on every day after. `MILESTONES` is `[7, 30, 100]`.

#### `milestoneCopy(days: number): { title: string; body: string }`

#### `returningCopy(): string`

Copy for somebody who has been away. Forward-looking only. No accounting of what was
missed.

#### `freezeCopy(remaining: number): string`

**Invariant:** every string this module can produce is asserted against a shaming-language
regex in `__tests__/streak.test.mjs`. Two drafts failed it and were rewritten: `"data, not failure"`
(negation still puts the word in front of the reader) and `"most weeks look like this one"`
(`look` is worth banning outright here).

---

### 2.3 `lib/reclaimed.ts`

The only headline metric in Cairn. It answers one question: how many hours did you get
back this week, compared to where you started. Hours rather than distress because hours are
concrete, they are what appearance preoccupation actually steals, and there is no way to
reinterpret "hours reclaimed" as a statement about how somebody looks.

#### `ReclaimedResult`

```ts
export interface ReclaimedResult {
  hours: number;                            // vs baseline, across the window. Negative is allowed.
  minutesPerDayDelta: number;               // positive = fewer minutes lost than baseline
  currentAvgDailyMinutes: number;
  baselineDailyMinutes: number;
  sampleSize: number;                       // how many check-ins the window contains
  hasData: boolean;
  direction: 'up' | 'flat' | 'down';
  previousAvgDailyMinutes: number | null;   // the seven days BEFORE the window, or null
  weekOverWeekDelta: number | null;         // positive = fewer minutes than last week
}
```

#### `meanDailyMinutes(checkIns: CheckIn[]): number`

Returns `0` for empty input rather than `NaN`.

#### `computeReclaimed(baseline, windowCheckIns, days = 7, previousWindowCheckIns = []): ReclaimedResult`

```
hours = (baselineDailyMinutes − currentAvgDailyMinutes) × days / 60
```

Returns an all-zero result with `hasData: false` when `baseline` is null or the window is
empty. `direction` is `'flat'` inside ±0.25h; anything smaller is noise, and reporting a
six-minute gain as progress is how a tool like this loses the user the first time they
notice.

**Invariant a caller must not violate: do not render a figure below three check-ins.**
`reclaimedCopy` refuses to state a number under `sampleSize < 3`, and every screen guards
the hero figure the same way:

```ts
const showNumber = reclaimed.hasData && reclaimed.sampleSize >= 3;
```

**Second invariant:** `hours` is never clamped at zero. A worse week reports negative hours
honestly. Hiding it would make the number one the user stops believing.

#### `previousWeekCheckIns(checkIns, now = new Date()): CheckIn[]`

The seven days immediately before the current window.

#### `checkInsInLastDays(checkIns, days, now = new Date()): CheckIn[]`

The `days` days ending today, inclusive.

#### `reclaimedByWeek(baseline, checkIns): { week: number; hours: number; sampleSize: number }[]`

Cumulative history bucketed into seven-day windows measured from the first check-in. Drives
the chart on Progress.

**`sampleSize` is new on each bucket.** It is carried out so the caller can refuse to plot a
bucket built from one or two days. `reclaimedCopy` already declines to state a number below
three check-ins, and a chart that draws thin data at full height contradicts the copy
sitting next to it. The consumer filters:

```ts
const weekly = reclaimedByWeek(baseline, checkIns);
const plottable = weekly.filter((w) => w.sampleSize >= 3);
```

`week` is 1-based. Buckets are computed with `daysBetween`, not by dividing timestamps,
which is what keeps seven days in a week across both daylight-saving transitions.

#### `reclaimedCopy(r: ReclaimedResult, _firstName?: string): { headline: string; sub: string }`

**Invariant:** a flat or negative week is reported neutrally and curiously, never with
disappointment. There is no "you slipped" string in this function and there must never be
one. A second rule sits underneath it: the flat and negative strings speak about "last
week", so they are only used when `previousAvgDailyMinutes !== null`. Otherwise the function
falls back to baseline phrasing rather than asserting a comparison that was never computed.
`__tests__/reclaimed.test.mjs` asserts both.

---

### 2.4 `lib/protocol.ts`

The 12-week programme. `WEEKS_TOTAL` is 12, `PRACTICE_DAYS_PER_WEEK` is 4.

#### `PHASES: Phase[]` and `phaseForWeek(week: number): Phase`

Four phases of three weeks. `phaseForWeek` clamps out-of-range input rather than returning
`undefined`.

#### `mirrorSpecForWeek(week: number): MirrorSpec | null`

```ts
export const MIRROR_UNLOCK_WEEK = 4;
```

Returns `null` before week 4. Mirror phase runs one behind the protocol phase, so the first
mirror session is always the gentlest spec (90 seconds, arm's length, fully clothed)
regardless of which week the user reached before starting.

**Invariant (SAFETY.md §9):** exposure is graded and cannot be skipped. Durations never
decrease with phase, and `__tests__/protocol.test.mjs` asserts monotonic increase.

#### `isWeekUnlocked(week: number, state: ProtocolState): boolean`

**Takes no date parameter, and must not gain one.** Week 1 is always open; week `n` opens
when `n - 1` is in `completedWeeks`. A date-gated programme punishes exactly the weeks when
somebody is struggling most, so here falling behind is not representable. `__tests__/safety.test.mjs`
asserts the signature still takes no date.

#### `weekProgress(state: ProtocolState): { done, required, complete, remaining }`

`done` counts **distinct** dates.

#### `recordPracticeDay(state: ProtocolState, dayKey: string): ProtocolState`

Pure. Records a practice day against the current week and advances when the minimum is met,
clearing `weekPracticeDates` on the roll-over. Week 12 enters `completedWeeks` like any
other week before the counter stops; testing the ceiling first meant `isProtocolComplete`
was unreachable, `weekPracticeDates` accumulated forever, and the home screen read
"156/4 this week" permanently.

#### `isProtocolComplete(state: ProtocolState): boolean`

#### `recommendedAction(opts): RecommendedAction`

```ts
recommendedAction({
  week: number,
  checkedInToday: boolean,
  modulesReadThisWeek: number,
  mirrorThisWeek: number,
  recordsThisWeek: number,
}): { route: string; label: string; why: string }
```

The single card on Today. One recommendation, not a menu of nine: choice paralysis is real
and it is worse when somebody is already ruminating. The check-in always comes first when
it is missing, and phase 1 never recommends mirror work.

**Invariant:** every branch returns a `why`, not just a `label`. A test asserts it.

---

### 2.5 `lib/moments.ts`

The orchestration layer for everything the app says unprompted. The distinction it exists
to enforce:

A **boundary** is reached because the user walked into it — a locked module they tapped,
the sixth thought record this month. The app is answering a question the user just asked.
Boundaries always render, need no budget, and are not scheduled here.

An **interruption** is started by the app — the upgrade ask, a winback, a trial notice, a
review request. Nobody asked for it, and it spends trust every time it fires whether or not
it converts. Interruptions are budgeted, prioritised and capped here, in one place.

#### Types

```ts
export type MomentId =
  | 'trial-ending' | 'winback' | 'plateau'
  | 'month-two-proof' | 'week-one-ask' | 'rate-app';

export type MomentKind = 'service' | 'care' | 'commercial' | 'advocacy';

export interface MomentConfig {
  id: MomentId;
  kind: MomentKind;
  priority: number;      // higher wins when two are eligible the same day
  maxShows: number;      // lifetime impression ceiling
  cooldownDays: number;  // doubles with each dismissal
  maxDismissals: number; // 0 = cannot be dismissed away
}

export type MomentState = Record<string, MomentRecord>;
export interface Moment { id: MomentId; kind: MomentKind }
```

`MOMENTS: Record<MomentId, MomentConfig>` holds the table. `MomentRecord` is declared once,
in `types/index.ts`, because it is persisted — two independent definitions of one stored
shape compile happily while they drift apart.

#### `distressRecently(checkIns, hardDayDates, now = new Date()): boolean`

True when today or yesterday carried a hard-day tap, a SUDS of 8 or more, or significant
avoidance. Deliberately generous: it errs toward suppressing an ask that might have
converted rather than risking one landing on somebody at their worst.

**Invariant: both bounds on the date gap matter.** The check is `gap >= 0 && gap <= 1`.
Without the lower bound, a single hard-day tap recorded while the device clock was wrong
leaves a future date in `practice` and suppresses every commercial moment for the life of
the install, silently and unboundedly. `__tests__/timezone.test.mjs` asserts a
clock-skewed hard day one day ahead does not suppress.

#### `eligibleMoments(input: MomentInput, now = new Date()): MomentId[]`

Which moments the underlying situation makes true, ignoring caps and cooldowns. Split out
from the budgeting so each half can be tested alone.

```ts
export interface MomentInput {
  state: AppState;
  trialDays?: number;
  reclaimedSampleSize: number;  // from ReclaimedResult.sampleSize
  weekComplete: boolean;        // from weekProgress().complete
}
```

**Invariant: count practice DAYS, not practice events.** `state.practice` holds one row per
day per kind, so a person who did several things in their first sitting has a `length`
well above their day count. Reading `practice.length` had the review prompt firing at
somebody on their first afternoon, under a comment promising it would not. Use
`new Set(state.practice.map((p) => p.date)).size`.

**The trial notice reads the entitlement's own `expiresAt`**, not a start date plus a
constant. That is what a provider actually hands back, so it keeps working when the trial
length changes, when the store grants an extension, and when the trial began on another
device. A lifetime purchase has no `expiresAt` and therefore never produces the notice —
under the old arithmetic it did, warning somebody who had paid once outright that they were
about to be charged again.
Slicing its first ten characters compares a UTC date against a local one.

#### `nextMoment(input: MomentInput, now = new Date()): Moment | null`

**The single decision point.** At most one moment for today, or `null`. If a screen wants to
interrupt somebody and it is not going through here, that is the bug.

```ts
const state = useStore();
const moment = nextMoment({
  state,
  trialDays: PRICING.trialDays,
  reclaimedSampleSize: reclaimed.sampleSize,
  weekComplete: wp.complete,
});
```

The filter order inside is itself a contract, and each step is there because of a specific
failure:

1. `acted` retires the moment permanently.
2. Dismissed today: gone now, not tomorrow.
3. **Already today's choice stays today's choice.** This check comes before the caps and
   the cooldown, because rendering a moment records its own impression — without the
   exemption, that record immediately trips both the daily budget and the cooldown and the
   card vanishes from under the person reading it.
4. Retired by `maxShows` or `maxDismissals`.
5. Cooling. The anchor is the **later** of `lastDismissedDate` and `lastShownDate`, not the
   dismissal by preference. `lastDismissedDate ?? lastShownDate` looks reasonable and is
   wrong: once any dismissal exists the stale date wins forever, and the observed effect was
   the ask waiting its doubled eight days, appearing, then appearing again the next morning.
6. **Service moments return true here**, bypassing both the daily budget and distress
   suppression. A trial ending is money about to leave somebody's account and they were
   promised a warning. Staying quiet to respect a frequency cap would be the app protecting
   its own manners at the user's expense.
7. One interruption a day, across the whole app.
8. Distress suppresses `commercial` and `advocacy` for 24 hours. Not `care` — a care moment
   is not selling anything.

Then highest `priority` wins.

#### Transitions

```ts
markShown(moments: MomentState, id: MomentId, now?: Date): MomentState
markDismissed(moments: MomentState, id: MomentId, now?: Date): MomentState
markActed(moments: MomentState, id: MomentId): MomentState
```

All three are pure and return a new map; `__tests__/moments.test.mjs` asserts they never
mutate the input. `markShown` is idempotent within a day — a re-render or a tab switch is
not another impression.

Screens do not call these directly. They call the store actions `momentShown`,
`momentDismissed` and `momentActed`, which wrap them and persist.

---

### 2.6 `lib/entitlement.ts`

#### `ALWAYS_FREE_ROUTES`

```ts
export const ALWAYS_FREE_ROUTES = [
  '/', '/checkin', '/grounding', '/support', '/onboarding', '/paywall',
] as const;
```

**Hard-coded rather than derived, on purpose.** Gating one of these by accident should
require deliberately editing a list with a comment telling you not to. `__tests__/safety.test.mjs`
asserts every safety surface is still in it, in code and not only in prose.

#### `isGated(route: string, entitled: boolean): boolean`

#### `weekGated(week: number, entitled: boolean): boolean`

`FREE_LIMITS` is `{ thoughtRecordsPerMonth: 5, learnModules: 3, maxWeek: 1 }`.

#### `PRICING`, `RENEWAL_TERMS` and `trialEndDate(from = new Date()): string`

`PRICING` holds `monthly`, `yearly`, `yearlyPerMonth`, `lifetime` and `trialDays` (30).
`trialEndDate` returns a localised date string, not a duration: a long trial showing only a
duration is a trap, a long trial showing a date and an amount is a fair deal.

`trialDays` must stay one of the durations App Store Connect actually sells as an
introductory offer — 3, 7, 14, 30, 60, 90, 180 or 365 days. Anything else is a promise the
store has no way to grant, and the mismatch surfaces as a customer being charged early.
`__tests__/entitlement.test.mjs` asserts it.

`RENEWAL_TERMS: Record<Plan, string>` is the Apple 3.1.2 disclosure, one sentence per
product, rendered beside the purchase button rather than behind a link. The subscription
entries name the amount, the cadence, and the fact that they repeat until cancelled; the
one-off entry says it is not a subscription and has nothing to renew. The word "lifetime"
appears in no user-facing string — App Review objects to it, see APP-STORE.md §5.4 — while
the `Plan` key keeps the name, because it is an internal identifier that keys stored state.

**Invariant (SAFETY.md §5, §13):** no discounts, no launch pricing, no countdown, no
scarcity language. `__tests__/copy.test.mjs` and `__tests__/safety.test.mjs` both assert it.

#### `TIER_COMPARISON`

`{ label, free: string | true, plus: string | true }[]`. The free column is written
generously on purpose. Export is listed as free on both sides and must stay that way.

#### `Plan`

```ts
export type Plan = 'monthly' | 'yearly' | 'lifetime';
```

Declared separately from `PRICING` on purpose. `keyof typeof PRICING` also admits
`yearlyPerMonth` and `trialDays`, which are a display string and a number — typed that way,
`purchase('trialDays')` compiled cleanly and would have granted entitlement and started a
trial. Use `Plan` for anything that represents a purchasable thing.

#### `useEntitlement()` — lives in `hooks/useEntitlement.ts`, not here

```ts
import { useEntitlement } from '../hooks/useEntitlement';

const { entitled, purchase, restore } = useEntitlement();
```

A React hook, and the only consumer-facing gate in the app. Every screen that gates reads
through it, which is what makes the RevenueCat swap in §3.1 a one-file change. It sits
outside `lib/` because it imports the store; see §1.

#### `Entitlement` — a cache, not a fact

```ts
interface Entitlement {
  source: 'none' | 'trial' | 'purchase' | 'hardship';
  plan: Plan | null;
  expiresAt: string | null;   // ISO. null = does not expire (lifetime)
  verifiedAt: string | null;  // ISO. last time a provider actually told us
  willRenew?: boolean;        // undefined = we do not know
}
```

`entitled` used to be a persisted boolean, and nothing in the app ever set it to false. A
refund, an expiry, a cancellation, a failed renewal — none had a code path back. Once true,
true forever.

Entitlement is not a fact this app owns. It belongs to the store, and what is kept locally
is a timestamped cache of the last answer received. **Never store the projection.**

#### `isEntitled(e, now = new Date()): boolean`

The single definition of "is this person entitled right now". Pure, and the only thing
allowed to answer the question.

```ts
const { entitled } = useEntitlement();   // computed on every read
```

**Which way it fails.** When the provider cannot be reached, the honest answer is "unknown",
and there are two ways to resolve that. Revoking on doubt means somebody mid-protocol,
offline on a bad day, finds their twelve weeks locked. Granting on doubt means a small
number of people get free access by staying offline. The second is correct here and it is
not close: one costs a few dollars, the other costs the person this was built for at the
moment they needed it.

| State | Entitled |
|---|---|
| `source: 'none'` | no |
| `expiresAt: null` | yes, always |
| now < `expiresAt` | yes |
| past expiry, `willRenew === false` | **no** — a known cancellation is a real answer, not doubt |
| past expiry, `verifiedAt` set | yes for `BILLING_GRACE_DAYS` (16) — Apple retries a declined card for about that long |
| past expiry, `verifiedAt` null | yes for `OFFLINE_GRACE_DAYS` (30) — never asked, so give more room |
| unparseable `expiresAt` | yes — a corrupted date must not lock out a paying customer |

None of this governs the safety surfaces. `ALWAYS_FREE_ROUTES` does not consult it, so a
fully lapsed user keeps grounding, crisis support, the hard-day path and the check-in
forever (SAFETY.md §4).

#### `projectFromProvider(p, planFor, now?): Entitlement`

Maps a `ProviderEntitlement` onto the cache. Pure, so the RevenueCat mapping is testable
without a network, a store account, or a sandbox receipt — which leaves the SDK call itself
as the only untested surface in the integration.

An inactive response still stamps `verifiedAt`. Without that, a confirmed "they do not have
it" would be indistinguishable from "never asked" and would collect the longer grace.

#### `localGrant(source, plan, expiresAt): Entitlement`

For grants this app makes itself: the v1 purchase stub and the hardship path. `verifiedAt`
stays null, which is what earns them the longer offline grace.

#### `setEntitlement(e)` — the store action

```ts
setEntitlement: (e: Entitlement) => void
```

The only writer. Everything else projects.

---

### 2.7 `lib/cost.ts`

The cost mirror, shown roughly ninety seconds after first open. Four answers in, one
multiplication out.

#### `costMirror(baseline: Baseline | null): CostMirror`

```ts
export interface CostMirror {
  minutesPerDay: number;
  hoursPerWeek: number;
  daysPerYear: number;   // waking days, at 16 waking hours. Calendar days overstate it.
  figure: string;        // split from `unit` so the number can be set at hero size
  unit: string;
  headline: string;
  sub: string;
  worthShowing: boolean; // false below 15 min/day
}
```

`figure` and `unit` are separate strings because set as one string the line wraps to two
rows of 68px serif and shoves everything below it off a small phone.

**Three invariants, all enforced by `__tests__/cost.test.mjs` and the monetisation block of
`__tests__/safety.test.mjs`:**

1. **Never promise a gain.** "You could get 45 days back" is a treatment claim. The honest
   form is present tense: "around 45 waking days a year, as things stand."
2. **Never compare the customer to anyone.** No percentiles, no averages, no "more than
   most". Ranking yourself against other people is the behaviour this app exists to
   interrupt.
3. **Never editorialise.** No "that's a lot", no exclamation marks. The multiplication is
   the whole argument.

Below 15 minutes a day, `worthShowing` is false and no cost figure is produced at all.
Telling somebody "this is what it is costing you" when they barely have the problem is
manufacturing one to sell against.

`COST_MIRROR_FOOTER` names the target without promising to hit it.

---

### 2.8 `lib/inline.ts`

#### `parseInline(input: string): Token[]`

```ts
export interface Token { text: string; bold?: boolean; italic?: boolean }
```

Minimal emphasis parser for `**bold**` and `*italic*`. Deliberately not a markdown library:
the module content uses exactly two marks, and a parser dependency would be more surface
area than the feature is worth.

**Invariant:** an unmatched marker renders literally rather than swallowing the rest of the
paragraph, and the bold alternative is matched first so `**x**` is never read as two italic
runs. `__tests__/modules.test.mjs` round-trips every paragraph in the real content and
asserts no characters are lost.

It lives in `lib/` rather than beside the component precisely so it stays plain TypeScript
and can be tested without a JSX toolchain.

---

### 2.9 `store/useStore.ts`

The only mutator. Every action `set`s and then calls `persist(get, set)`, except the ones
that route through `logPractice`, which persists at the end.

#### State beyond `AppState`

```ts
hydrated: boolean;              // false until hydrate() resolves; the root layout blocks on it
pendingMilestone: number | null;// set when a milestone fires, cleared by clearMilestone()
loadOk: boolean;                // false when stored bytes existed but could not be read
saveOk: boolean;                // false when the last write did not land
quarantinedAt: string | null;   // key an unreadable payload was copied to
```

None of these are persisted. `snapshot()` in `store/useStore.ts` destructures all five out
before writing, and anything left in the rest object goes to disk — a session-only field
missing from that list ends up serialised, which is what happened to `quarantinedAt`.

**They have a UI.** `components/StorageNotice.tsx` reads all three and renders nothing when
storage is healthy. It appears on Today and on Progress, where it sits above the backup
button that resolves the `!saveOk` case. This matters more than it looks: without a
surface, the detection is worse than useless — `saveState` carries a comment arguing "the
caller needs to know" and for a while no caller did anything, so somebody could journal for
weeks with every entry appearing saved and lose all of it on the next cold start with no
explanation available to them. Never render it on a safety surface.

#### Lifecycle

```ts
hydrate: () => Promise<void>;   // calls loadState(), sets loadOk and quarantinedAt
reset: () => Promise<void>;     // cancels the pending write, wipes, returns to empty
```

#### Actions

| Action | Signature |
|---|---|
| `completeOnboarding` | `(baseline: Baseline, firstName?: string) => void` |
| `acceptDisclaimer` | `() => void` |
| `setSupportRegion` | `(region: string) => void` |
| `setEntitlement` | `(e: Entitlement) => void` — the only writer of the cache |
| `momentShown` | `(id: MomentId) => void` |
| `momentDismissed` | `(id: MomentId) => void` |
| `momentActed` | `(id: MomentId) => void` |
| `addCheckIn` | `(c: Omit<CheckIn, 'id' \| 'date'> & { date?: string }) => void` |
| `addUrgeLog` | `(u: Omit<UrgeLog, 'id' \| 'date'>) => void` |
| `addThoughtRecord` | `(t: Omit<ThoughtRecord, 'id' \| 'date'>) => void` |
| `addMirrorSession` | `(m: Omit<MirrorSession, 'id' \| 'date'>) => void` |
| `addExperiment` | `(e: Pick<Experiment, 'avoiding' \| 'prediction' \| 'likelihoodBefore' \| 'safetyBehavioursDropped'>) => void` |
| `completeExperiment` | `(id: string, outcome: Pick<Experiment, 'outcome' \| 'comparison' \| 'likelihoodAfter' \| 'conclusion'>) => void` |
| `markModuleRead` | `(slug: string) => void` |
| `setAvoidedConditions` | `(list: string[]) => void` |
| `setRelapsePlan` | `(p: Omit<RelapsePlan, 'updatedAt'>) => void` |
| `logPractice` | `(kind: PracticeKind) => void` |
| `clearMilestone` | `() => void` |
| `checkedInToday` | `() => boolean` |

Notes that are contracts rather than trivia:

- **`id` and `date` are assigned by the store**, which is why every `add*` action takes an
  `Omit`. `addCheckIn` is the one that accepts an override, because backfill needs it.
- **`addCheckIn` replaces the same day rather than stacking.** One check-in per day, so the
  daily average cannot be skewed by somebody re-answering while ruminating.
- **`completeExperiment` writes only the after-event fields.** The prediction and
  `likelihoodBefore` are never touched. Memory rewrites predictions to match outcomes once
  the outcome is known, and an editable prediction destroys the only thing the exercise
  produces. `__tests__/safety.test.mjs` asserts completing an experiment cannot rewrite the
  prediction (SAFETY.md §11).
- **`logPractice` is the one entry point that advances streak and protocol.** Every `add*`
  action calls it, including the hard-day path. It writes one row per day per kind, not one
  per action, and it is what keeps `practice` readable as a set of dates.

#### `flushState(): Promise<void>` — exported separately

```ts
import { useStore, flushState } from '../store/useStore';
```

Not a store action. A module-level function, because it is called from lifecycle handlers
that are outside React's render tree.

Writes are debounced 150ms, which is right while the app is in front of somebody and wrong
the instant it is not: a mutation followed by a home-swipe-and-kill inside that window is
simply lost, and there is no server to re-fetch it from. `flushState` cancels the timer and
awaits the write.

```ts
useEffect(() => {
  if (Platform.OS === 'web') {
    const onHide = () => void flushState();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }
  const sub = RNAppState.addEventListener('change', (next) => {
    if (next === 'background' || next === 'inactive') void flushState();
  });
  return () => sub.remove();
}, []);
```

`pagehide` rather than `beforeunload`, because Safari does not fire the latter reliably on
mobile.

#### Two persistence invariants

**The write lock.** Both `persist()` and `flushState()` begin with `if (!get().loadOk) return;`.
If the stored payload could not be read, this process is holding a blank state that only
looks like a fresh install. Writing it would overwrite a journal that is still on disk and
still recoverable. Better to lose this session's edits than somebody's year.

**Writes are chained, not parallel.** `writeChain = writeChain.then(...)`. Two overlapping
`setItem` calls resolve in completion order, not issue order, so a slow write can land after
a faster later one and silently roll state back.

---

## 3. Integration seams

These are the only two points in Cairn that will ever talk to something outside the
device, and both are currently stubs. Neither is a server: one is a payments SDK reading a
receipt, the other is an OS-level prompt. Both stay inside SAFETY.md §6.

Documented here as contracts a future implementer fulfils, not as work items.

### 3.1 RevenueCat — `hooks/useEntitlement.ts`

Four stubs, all marked in the file. Replacing them is the entire integration; nothing
outside that file changes, because every consumer reads `entitled` or `isGated` rather than
touching the cache.

| Stub | Real call |
|---|---|
| `fetchProviderEntitlement()` | `Purchases.getCustomerInfo()` |
| `purchase(plan)` | `Purchases.purchasePackage(pkg)` |
| `restore()` | `Purchases.restorePurchases()` |
| (add at launch) | `Purchases.configure({ apiKey })` |

Each returns a `CustomerInfo`. Map `customerInfo.entitlements.active[ENTITLEMENT_ID]` onto
`ProviderEntitlement` and hand it to `projectFromProvider`.

**`fetchProviderEntitlement` returning `null` means "could not ask" and must not revoke
anything.** Returning `{ active: false }` means "asked, and they do not have it" and must.
Collapsing those two is how an offline user loses access.

`refresh()` runs at launch and on every foreground (`app/_layout.tsx`), which is what makes
entitlement a projection rather than a boolean nobody clears.

**What must not change when the SDK goes in:**

1. **No `AppState`-derived value may be sent as a subscriber attribute.** Not the reclaimed
   figure, not a distress rating, not a streak. SAFETY.md §6 says nothing leaves the device,
   and "it's only analytics" is how that promise gets broken.
2. **A failed refresh must write nothing.** The cached entitlement stands and `isEntitled`
   covers the gap.
3. **The hardship grant stays local.** It must work with no network, no account and no
   receipt — somebody who cannot pay should not have to be online to say so. `refresh()`
   explicitly declines to let an inactive provider response clear a hardship grant.

### 3.2 Store review — `components/MomentCard.tsx`

**Where.** The `moment.id === 'rate-app'` branch of the action handler, which currently
records `momentActed` and returns without navigating.

**What replaces what.**

```ts
// today
if (moment.id === 'rate-app') {
  return;
}

// fulfilled
if (moment.id === 'rate-app') {
  if (await StoreReview.isAvailableAsync()) {
    await StoreReview.requestReview();
  }
  return;
}
```

**The contract the implementer must hold:**

1. **Guard on `isAvailableAsync()`.** It is false on web and on builds without the
   capability, and calling `requestReview()` regardless is how you get an unhandled
   rejection inside a press handler.
2. **iOS caps the native prompt at three a year per user**, silently, and the OS decides
   whether the prompt renders at all. That cap is the whole reason `rate-app` is configured
   as `maxShows: 1`, `cooldownDays: 90`, and eligible only after ten practice days plus
   either three resisted urges or three mirror sessions. A prompt spent on somebody mid bad
   week is one of three gone, and it will not come back.
3. **`advocacy` is suppressed by distress exactly like `commercial`.** Asking a person
   having a bad day to go and praise you in public is tone-deaf and a reliable way to
   collect one stars. `__tests__/safety.test.mjs` asserts a hard day silences every
   commercial and advocacy moment.
4. **No custom review UI, no pre-prompt asking "are you enjoying Cairn?", no routing to
   the store listing on a "yes".** That pattern filters ratings, which is against store
   policy, and it is a second interruption charged against the same budget.
5. **The scheduler stays in charge.** The decision to ask lives in `lib/moments.ts`. This
   file only draws what it was handed. If review logic starts making its own eligibility
   decisions here, the daily budget stops being a budget.

---

## 4. Invariants that outrank convenience

Short list. Each is enforced by a test, and each will at some point look like a feature you
are leaving on the table. That is the trade, and it was made deliberately.

| Invariant | Rule | Enforced by |
|---|---|---|
| `loadState().ok === false` locks writes | SAFETY.md §6 | `__tests__/storage.test.mjs`; the `if (!get().loadOk) return` in `persist` and `flushState` |
| Unreadable bytes are quarantined before anything else | SAFETY.md §6 | `lib/storage.ts` contract; `__tests__/storage.test.mjs` |
| `normalise` is the only way `unknown` becomes `AppState` | SAFETY.md §6 | `__tests__/storage.test.mjs` — "a truthy non-boolean cannot grant entitlement", "a moment record missing fields is backfilled" |
| Every schema bump has a migration slot | — | `__tests__/storage.test.mjs` — "there is a migration slot for every version" |
| Export is free on both tiers and contains what the user wrote | SAFETY.md §11b | `__tests__/storage.test.mjs` — "it contains what the user actually wrote", "it contains predictions and outcomes" |
| `dayKey` is local and is the only definition of "today" | — | `__tests__/timezone.test.mjs` — "day keys agree with stored dates in every zone" |
| A future-dated entry cannot silence the app forever | SAFETY.md §12 | `__tests__/timezone.test.mjs` — "a clock-skewed hard day one day ahead does not suppress" |
| Missed days are neutral; freezes and restarts are silent | SAFETY.md §3 | `__tests__/streak.test.mjs` — "no shaming language anywhere" |
| No number below three check-ins | SAFETY.md §13 | `__tests__/reclaimed.test.mjs` — "sparse data is labelled as sparse rather than shown as a number" |
| A worse week is reported honestly, never clamped or shamed | SAFETY.md §13 | `__tests__/reclaimed.test.mjs` — "a negative week never uses shaming language" |
| "Last week" phrasing only when a prior week was measured | SAFETY.md §13 | `__tests__/reclaimed.test.mjs` — `"last week" phrasing is only used when a prior week was actually measured` |
| Weeks unlock by completion, never by date | SAFETY.md §10 | `__tests__/safety.test.mjs` — "week unlocking still takes no date parameter" |
| Mirror practice locked before week 4; durations never decrease | SAFETY.md §9 | `__tests__/safety.test.mjs`, `__tests__/protocol.test.mjs` |
| Predictions are frozen once written | SAFETY.md §11 | `__tests__/safety.test.mjs` — "completing an experiment cannot rewrite the prediction" |
| Safety routes are free in code, not only in prose | SAFETY.md §4, §12 | `__tests__/safety.test.mjs` — "the always-free routes are still free in code, not only in prose" |
| `nextMoment` is the only thing that starts an unprompted conversation | SAFETY.md §12 | `__tests__/safety.test.mjs` — "the scheduler is the only thing that starts an unprompted conversation" |
| Distress silences commercial and advocacy for 24 hours | SAFETY.md §12 | `__tests__/safety.test.mjs` — "a hard day silences every commercial and advocacy moment" |
| Service moments fire through a bad day | SAFETY.md §12 | `__tests__/safety.test.mjs` — "a trial-ending notice still fires on a hard day" |
| No countdown, expiry or scarcity language | SAFETY.md §5, §13 | `__tests__/safety.test.mjs`, `__tests__/copy.test.mjs` |
| The cost mirror promises nothing and compares nobody | SAFETY.md §13 | `__tests__/cost.test.mjs`, `__tests__/safety.test.mjs` |
| No still-image capture API anywhere | SAFETY.md §1 | `__tests__/safety.test.mjs` — "no still-image capture API appears anywhere" |
| No appearance or body metric field on any type | SAFETY.md §2 | `__tests__/safety.test.mjs` — "no appearance or body metric fields exist" |
| `lib/storage.ts` makes no network call | SAFETY.md §6 | `__tests__/safety.test.mjs` — "storage makes no network call" |
| No analytics or tracking SDK imported anywhere | SAFETY.md §6 | `__tests__/safety.test.mjs` — "no analytics or tracking SDK is imported anywhere" |

The tone and safety rules are tests rather than review notes on purpose. Review catches what
a reviewer happens to notice; a test catches it every time, including at 2am on a Friday
when somebody is shipping a copy tweak.
