/* Persistence.
 *
 * AsyncStorage on native, localStorage-backed on web (RN Web maps it). Local only — there
 * is no network call anywhere in this file, and there must not be one.
 *
 * This file holds the ONLY copy of somebody's private journal. There is no server, no
 * account and no backup, which is a deliberate product choice (SAFETY.md §6) and which
 * makes the failure modes here more serious than in an app that can re-fetch. Three rules
 * follow from that and each is load-bearing:
 *
 *   1. A read that fails is NOT an empty journal. Returning `emptyState()` on a parse
 *      error hands the app a plausible-looking blank slate, and the very next mutation
 *      writes that blank slate over the real bytes. The unreadable payload is quarantined
 *      under a separate key and writes are locked until the app is restarted, so a bad
 *      read stays recoverable instead of becoming permanent a tap later.
 *   2. The version lives INSIDE the payload, not in the key name. A version in the key
 *      means bumping it silently resets every existing user and orphans their data under
 *      a key nothing reads again.
 *   3. Every collection element is normalised against its own default on the way in.
 *      `JSON.parse` returns `any`, and spreading `any` makes the whole literal `any`, so
 *      `tsc` will happily certify a stored record that is missing half its fields. A
 *      MomentRecord without `shows` turns `shows + 1` into NaN, and `NaN >= maxShows` is
 *      false — which would mean a prompt that can never retire.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, MomentRecord, AvoidanceLevel, PracticeKind } from '../types';
import { initialStreak } from './streak.ts';
/* Imported rather than redefined. Two identical constructors for one persisted shape is
   the same hazard the MomentRecord comment in moments.ts warns about for the type: they
   compile happily while drifting apart. `MOMENTS` comes across for the same reason — the
   moment ids are a closed set and normalise() rejects stored keys outside it. */
import { emptyMomentRecord, MOMENTS } from './moments.ts';
import { emptyEntitlement, type Entitlement } from './entitlement.ts';
import { seal, open, isSealed } from './crypto.ts';

/* The key never changes again. Versioning happens inside the envelope; the `.v2` suffix is
   a historical artefact of the first release and renaming it now would strand real data.

   ⚠ THE `steady.` PREFIX IS NOT A LEFTOVER. The app was called Steady, then briefly
   Cairn, before it was called Anneal. These two keys — plus `steady.device.key.v1` in
   hooks/deviceKey.ts — are the only strings deliberately left behind by both renames, and
   they keep the *first* name on purpose. They are not brand. They are the
   addresses real data already lives at. Renaming them migrates nothing: it points the app
   at an empty key and silently orphans every existing user's twelve weeks of journal,
   urges and streak, with the old data still on the device and unreachable. If a rename is
   ever genuinely wanted it needs a read-old-write-new migration in this file first, and
   there is no reason to want it, because nobody ever sees these strings. */
export const STORAGE_KEY = 'steady.state.v2';

/** Prefix for payloads that could not be read. Never garbage-collected automatically.
 *  Keeps the pre-rename prefix for the reason above — quarantined data is precisely the
 *  data least able to survive being re-addressed. */
export const QUARANTINE_PREFIX = 'steady.unreadable.';

/** Bumped whenever a migration is added below. */
export const SCHEMA_VERSION = 4;

export const emptyState = (): AppState => ({
  profile: {
    firstName: undefined,
    onboardedAt: null,
    disclaimerAcceptedAt: null,
    supportRegion: 'us',
  },
  baseline: null,
  checkIns: [],
  urgeLogs: [],
  thoughtRecords: [],
  mirrorSessions: [],
  experiments: [],
  practice: [],
  commitments: [],
  tracks: {},
  streak: initialStreak(),
  protocol: {
    currentWeek: 1,
    weekPracticeDates: [],
    completedWeeks: [],
    avoidedConditions: [],
  },
  readModules: [],
  moments: {},
  entitlement: emptyEntitlement(),
});

/* ---------- migrations ----------
 *
 * Append-only. `MIGRATIONS[n]` upgrades a payload at version n to version n+1. Pure
 * functions over plain objects, so they are testable without mounting anything.
 *
 * A payload with no `v` field predates the envelope and is treated as version 2. The 2→3
 * step is a no-op because `normalise()` below already backfills `moments` and
 * `trialStartedAt` with the correct defaults — but the slot exists so the NEXT change,
 * which may need a value derived from existing data rather than a static default, has
 * somewhere to live other than a comment. */
type Payload = Record<string, unknown>;

export const MIGRATIONS: ((s: Payload) => Payload)[] = [
  // 0 → 1, 1 → 2: predate this app shipping. Nothing to do.
  (s) => s,
  (s) => s,
  // 2 → 3: `moments` and `trialStartedAt` added. Static defaults, handled by normalise().
  (s) => s,
  /* 3 → 4: `entitled: boolean` + `trialStartedAt` become a single `entitlement` cache.
     The first migration that derives rather than defaults, which is what this slot was
     built for.
     Somebody mid-trial keeps the remainder of it. Somebody entitled with no trial stamp
     paid for something, and since the old model recorded neither plan nor expiry, the
     only safe reading is an entitlement that does not expire — revoking access from a
     paying customer to tidy up a data model would be indefensible. Their next provider
     refresh replaces this with the truth. */
  (s) => {
    const { entitled, trialStartedAt, ...rest } = s as Record<string, unknown>;

    /* Idempotence guard. Without it this step is destructive when run twice: the second
       pass finds no `entitled` field, falls into the `!entitled` branch below, and replaces
       a real purchase with emptyEntitlement(). Verified before the guard —

         after 1 migration:  {"source":"purchase","plan":null,"expiresAt":null,...}
         after 2 migrations: {"source":"none","plan":null,"expiresAt":null,...}

       — a paying customer silently losing access, with no receipt check wired up to give it
       back. A migration gets run twice more easily than it sounds: see the version clamp in
       migrate() below for the two ways it happened here. Every migration in this list must
       be safe to re-apply; that is a property of the slot, not of this one step. */
    if (rest.entitlement) return rest;

    if (!entitled) return { ...rest, entitlement: emptyEntitlement() };

    if (typeof trialStartedAt === 'string') {
      const ends = new Date(trialStartedAt);
      ends.setDate(ends.getDate() + 14);
      return {
        ...rest,
        entitlement: { source: 'trial', plan: null, expiresAt: ends.toISOString(), verifiedAt: null },
      };
    }
    return {
      ...rest,
      entitlement: { source: 'purchase', plan: null, expiresAt: null, verifiedAt: null },
    };
  },
];

/** True when a stored payload comes from a build NEWER than this one.
 *
 *  There is no honest way to read it: the fields it gained are fields this build has never
 *  heard of, and the migration loop below cannot run backwards. Treating it as unreadable
 *  routes it to the quarantine-and-lock-writes path, which is exactly the right tool and is
 *  already built.
 *
 *  What happened without this check: a v5 payload read by a v4 build skipped the loop, was
 *  normalised, and was then written back stamped `{ v: 4 }` — data still v5-shaped, version
 *  downgraded. On the next upgrade, migrate(data, 4) re-ran MIGRATIONS[4] over data that had
 *  already been through it. The realistic trigger is not an attacker: it is a TestFlight
 *  build followed by an App Store build, which every iOS project does. */
export const isFromNewerBuild = (version: number): boolean => version > SCHEMA_VERSION;

function migrate(data: Payload, from: number): Payload {
  let out = data;
  /* Clamped at zero. An unclamped negative — from a hand-edited or corrupt envelope — runs
     the entire chain over current-shaped data, which produced the same entitlement wipe as
     the non-idempotent step above. */
  for (let v = Math.max(0, Math.floor(from)); v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (step) out = step(out);
  }
  return out;
}

/* ---------- normalisation ----------
 *
 * The type boundary. Everything past this point may be trusted to match AppState; nothing
 * before it may be, whatever the declared types say. */

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = (v: unknown): Payload => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Payload) : {});

/* The scalar coercions. Every one of these takes a fallback rather than trusting the stored
   value, because "the declared type says number" is exactly the assumption this layer exists
   to stop making.

   `num` rejects NaN and Infinity as well as non-numbers. That is not pedantry: a single
   non-finite `preoccupationMinutes` propagates through lib/reclaimed.ts into the hero figure
   on the home screen, and the app renders "NaN hours back this week" as the one number the
   whole product stakes its credibility on. Verified: a stored "abc" produced hours=NaN, and
   a stored -99999 produced 11694.6 hours reclaimed. */
const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
/** Array of strings, dropping anything that is not one. */
const strArr = (v: unknown): string[] => arr<unknown>(v).filter((x): x is string => typeof x === 'string');
/** Array of finite numbers, dropping anything that is not one. */
const numArr = (v: unknown): number[] =>
  arr<unknown>(v).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));

/** Every row in a collection, rebuilt from an explicit shape. Rows that cannot be rebuilt
 *  are DROPPED rather than repaired-into-nonsense or passed through.
 *
 *  Dropping is the right call for a reason worth stating: a row with no usable date cannot
 *  be placed on a timeline, in a chart, or in an export, so keeping it only moves the crash
 *  from here to the first screen that reads it. Losing one corrupt row is a bad outcome;
 *  losing the whole app because that row is on the launch path is a much worse one. */
function rows<T>(v: unknown, build: (r: Payload) => T | null): T[] {
  const out: T[] = [];
  for (const raw of arr<unknown>(v)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const built = build(raw as Payload);
    if (built) out.push(built);
  }
  return out;
}

/** Rows restored without a usable id get a synthetic one. Monotonic so two rows on the same
 *  date cannot collide, which would make them the same row to a keyed list. */
let restoredSeq = 0;

/** Every row in the app is keyed by a day-resolution date string and an id. A row with no
 *  date cannot be sorted, grouped, charted or exported, so it is dropped; a row with no id
 *  is recoverable and gets one. */
const dated = (r: Payload): { id: string; date: string } | null => {
  if (typeof r.date !== 'string' || !r.date) return null;
  return { id: str(r.id, `restored-${r.date}-${restoredSeq++}`), date: r.date };
};

const strOrUndef = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);

const avoidance = (v: unknown): AvoidanceLevel =>
  v === 'none' || v === 'small' || v === 'significant' ? v : 'none';

/* Must stay exhaustive over `PracticeKind`. A kind missing from here is not a type error —
   the array is annotated with the union, not derived from it — it is a row that silently
   fails `normalise` and vanishes on the next read, taking a day off somebody's streak with
   it. __tests__/storage.test.mjs now checks this list against the union's source text. */
const PRACTICE_KINDS: PracticeKind[] = [
  'checkin', 'thought-record', 'grounding', 'mirror', 'urge', 'experiment', 'hard-day',
  'curveball', 'toward', 'groundwork', 'ballast',
];

/** An entitlement record that survived a round trip. A missing or malformed one becomes
 *  'none' rather than being trusted — this is the one field where failing toward access
 *  would mean a corrupted byte granting a free subscription, and the user can always
 *  restore a real purchase in two taps. */
function normaliseEntitlement(v: unknown): Entitlement {
  const e = obj(v);
  const source = e.source;
  if (source !== 'trial' && source !== 'purchase' && source !== 'hardship') {
    return emptyEntitlement();
  }
  const out: Entitlement = {
    source,
    plan:
      e.plan === 'monthly' || e.plan === 'yearly' || e.plan === 'lifetime' ? e.plan : null,
    expiresAt: typeof e.expiresAt === 'string' ? e.expiresAt : null,
    verifiedAt: typeof e.verifiedAt === 'string' ? e.verifiedAt : null,
  };
  if (typeof e.willRenew === 'boolean') out.willRenew = e.willRenew;
  return out;
}

/**
 * The type boundary, and now actually one.
 *
 * WHAT THIS USED TO DO, AND WHY IT WAS THE MOST DANGEROUS FUNCTION IN THE APP
 *
 * It returned `{ ...base, ...p, <some overrides> }`. The `...p` meant every key in the
 * parsed blob survived into application state — not just the ones AppState declares. The
 * store then merges that object into itself (`set({ ...state, ... })`, and zustand's
 * setState is an Object.assign), and store METHODS are ordinary properties on that object.
 * So a stored key called `logPractice` overwrites the function called `logPractice`.
 *
 * Verified before the rewrite, feeding `{"checkedInToday":1,"logPractice":"pwned"}`:
 *
 *     checkedInToday: number 1        (app/(tabs)/index.tsx calls it — TypeError on launch)
 *     logPractice   : string "pwned"
 *     reset present : true            ("delete my data" throws)
 *
 * There is no ErrorBoundary in this app, so that TypeError unmounts the entire tree,
 * including the always-mounted SupportBar. The person loses grounding, crisis support, their
 * relapse plan, and the export button — everything, at once, with no route back except
 * deleting the app, which is total loss. And because JSON.parse succeeded, `loadOk` stays
 * true, nothing is quarantined, and the poisoned payload is faithfully written back on the
 * next launch. It is self-perpetuating.
 *
 * The trigger does not need an attacker. A field rename, a partial write, or wiring up the
 * import path that already exists produces the same class of state.
 *
 * SO: build the result field by field, from an allowlist. Never spread the payload. The
 * shape of this function is now the shape of AppState, and adding a field to AppState
 * without adding it here means it does not survive a restart — which is a loud, cheap
 * failure, and the correct direction for this to fail in.
 */
export function normalise(parsed: unknown): AppState {
  const p = obj(parsed);
  const base = emptyState();

  /* Each moment record is rebuilt from its own default, field by field. Merging — which is
     what this used to do — repairs a MISSING field but happily keeps a wrong-typed one, and
     the file header explains exactly why that matters: `shows` of "abc" makes `shows + 1`
     the string "abc1", `"abc1" >= maxShows` is false, and the prompt can never retire. That
     is the bug the merge was written to prevent, still present in the merge.

     The key is checked too. `moments[k] = …` with k of "__proto__" replaces the prototype of
     the map: a crafted payload setting it to `{ "trial-ending": { acted: true } }` makes
     nextMoment() read `acted` through the prototype and permanently retire the trial-ending
     notice — silencing the billing warning the paywall explicitly promises. Verified. The
     moment ids are a closed set, so the fix is to only accept keys from it. */
  const moments: Record<string, MomentRecord> = {};
  for (const [k, v] of Object.entries(obj(p.moments))) {
    /* hasOwnProperty, not `k in MOMENTS`. `in` walks the prototype chain, so
       `'__proto__' in MOMENTS` is true — the guard would have admitted the exact key it was
       written to reject, along with 'toString', 'constructor' and the rest of
       Object.prototype. An own-property check is the only one that means what it says. */
    if (!Object.prototype.hasOwnProperty.call(MOMENTS, k)) continue;
    const r = obj(v);
    moments[k] = {
      shows: num(r.shows, 0),
      lastShownDate: strOrNull(r.lastShownDate),
      dismissals: num(r.dismissals, 0),
      lastDismissedDate: strOrNull(r.lastDismissedDate),
      acted: bool(r.acted, false),
    };
  }

  const profile = obj(p.profile);
  const streak = obj(p.streak);
  const protocol = obj(p.protocol);
  const baseline = obj(p.baseline);
  const plan = obj(protocol.relapsePlan);

  return {
    profile: {
      firstName: typeof profile.firstName === 'string' ? profile.firstName : undefined,
      onboardedAt: strOrNull(profile.onboardedAt),
      disclaimerAcceptedAt: strOrNull(profile.disclaimerAcceptedAt),
      supportRegion: str(profile.supportRegion, base.profile.supportRegion),
      /* The survey. Every field optional and every value a plain string, because this is
         read back from disk and nothing on disk is trusted. An unrecognised answer resolves
         to 'looking' downstream rather than throwing — see lib/plan.ts carryingOf. */
      ...(profile.survey && typeof profile.survey === 'object'
        ? {
            survey: {
              brought: strOrUndef((profile.survey as Payload).brought),
              tried: strOrUndef((profile.survey as Payload).tried),
              worst: strOrUndef((profile.survey as Payload).worst),
            },
          }
        : {}),
      ...(typeof profile.carrying === 'string' ? { carrying: profile.carrying } : {}),
      ...(typeof profile.surveyedAt === 'string' ? { surveyedAt: profile.surveyedAt } : {}),
    },

    /* `baseline` is nullable and was not shape-checked at all, so a stored `5` sailed
       through — truthy, so computeReclaimed walked straight past its `if (!baseline)` guard
       and read fields off a number. It is only a baseline if it carries the figure the whole
       product measures against. */
    baseline:
      typeof baseline.preoccupationMinutes === 'number' && Number.isFinite(baseline.preoccupationMinutes)
        ? {
            capturedAt: str(baseline.capturedAt, ''),
            preoccupationMinutes: baseline.preoccupationMinutes,
            urge: num(baseline.urge, 0),
            avoidance: avoidance(baseline.avoidance),
            suds: num(baseline.suds, 0),
          }
        : null,

    checkIns: rows(p.checkIns, (r) => {
      const d = dated(r);
      if (!d) return null;
      return {
        ...d,
        preoccupationMinutes: num(r.preoccupationMinutes, 0),
        urge: num(r.urge, 0),
        avoidance: avoidance(r.avoidance),
        suds: num(r.suds, 0),
        ...(typeof r.note === 'string' ? { note: r.note } : {}),
      };
    }),

    urgeLogs: rows(p.urgeLogs, (r) => {
      const d = dated(r);
      if (!d) return null;
      return {
        ...d,
        trigger: str(r.trigger, ''),
        wantedTo: str(r.wantedTo, ''),
        intensityBefore: num(r.intensityBefore, 0),
        resisted: bool(r.resisted, false),
        ...(typeof r.intensityAfter === 'number' && Number.isFinite(r.intensityAfter)
          ? { intensityAfter: r.intensityAfter }
          : {}),
      };
    }),

    /* Thought records and experiments carry the most free text and the most optional
       fields. Strings are kept as written — this is the user's own writing and nothing here
       may edit it — but a non-string in a string slot becomes an empty string rather than
       reaching a `.slice` or a `.trim` on a screen. */
    thoughtRecords: rows(p.thoughtRecords, (r) => {
      const d = dated(r);
      if (!d) return null;
      return {
        ...d,
        situation: str(r.situation, ''),
        emotion: str(r.emotion, ''),
        emotionIntensity: num(r.emotionIntensity, 0),
        automaticThought: str(r.automaticThought, ''),
        distortions: strArr(r.distortions),
        evidenceFor: str(r.evidenceFor, ''),
        evidenceAgainst: str(r.evidenceAgainst, ''),
        balancedThought: str(r.balancedThought, ''),
        reRatedIntensity: num(r.reRatedIntensity, 0),
      };
    }),

    mirrorSessions: rows(p.mirrorSessions, (r) => {
      const d = dated(r);
      if (!d) return null;
      return {
        ...d,
        phase: num(r.phase, 1),
        durationSeconds: num(r.durationSeconds, 0),
        sudsBefore: num(r.sudsBefore, 0),
        sudsAfter: num(r.sudsAfter, 0),
        completed: bool(r.completed, false),
        /* `condition` was declared in types/index.ts, written by app/mirror.tsx, and dropped
           here — so the phase-3 entry recording the avoided condition somebody chose to face
           vanished at the next cold start. Exactly the failure the header of this file warns
           about ("adding a field to AppState without adding it here means it does not survive
           a restart"), landing on the single most meaningful thing in the row. */
        ...(strOrUndef(r.condition) === undefined ? {} : { condition: strOrUndef(r.condition) }),
      };
    }),

    experiments: rows(p.experiments, (r) => {
      const d = dated(r);
      if (!d) return null;
      return {
        ...d,
        avoiding: str(r.avoiding, ''),
        prediction: str(r.prediction, ''),
        likelihoodBefore: num(r.likelihoodBefore, 0),
        safetyBehavioursDropped: str(r.safetyBehavioursDropped, ''),
        ...(typeof r.outcome === 'string' ? { outcome: r.outcome } : {}),
        ...(typeof r.comparison === 'string' ? { comparison: r.comparison } : {}),
        ...(typeof r.likelihoodAfter === 'number' && Number.isFinite(r.likelihoodAfter)
          ? { likelihoodAfter: r.likelihoodAfter }
          : {}),
        ...(typeof r.conclusion === 'string' ? { conclusion: r.conclusion } : {}),
        ...(typeof r.completedAt === 'string' ? { completedAt: r.completedAt } : {}),
      };
    }),

    practice: rows(p.practice, (r) => {
      const d = dated(r);
      if (!d) return null;
      if (!PRACTICE_KINDS.includes(r.kind as PracticeKind)) return null;
      return { ...d, kind: r.kind as PracticeKind };
    }),

    /* Track progress. Unknown track ids are kept rather than dropped — a track removed in
       one release and restored in the next should not lose somebody's place, and the reader
       in lib/track.ts already ignores ids it does not recognise. Day ids ARE filtered to
       strings, because that array is what the unlock logic walks. */
    tracks: Object.fromEntries(
      Object.entries(obj(p.tracks)).map(([id, v]) => {
        const t = obj(v);
        return [
          id,
          {
            startedAt: str(t.startedAt, new Date().toISOString()),
            done: Array.isArray(t.done) ? t.done.filter((d): d is string => typeof d === 'string') : [],
          },
        ];
      }),
    ),

    /* No migration needed: a new collection with a static default is exactly what
       normalise() backfills, and the migration slots exist for values that must be DERIVED
       from existing data. See the note at the top of the MIGRATIONS list. */
    commitments: rows(p.commitments, (r) => {
      const d = dated(r);
      if (!d || typeof r.action !== 'string' || !r.action) return null;
      return {
        ...d,
        action: r.action,
        size: str(r.size, 'small'),
        ...(typeof r.kept === 'string' ? { kept: r.kept } : {}),
        ...(typeof r.answeredAt === 'string' ? { answeredAt: r.answeredAt } : {}),
      };
    }),

    streak: {
      current: num(streak.current, 0),
      longest: num(streak.longest, 0),
      freezesRemaining: num(streak.freezesRemaining, initialStreak().freezesRemaining),
      lastPracticeDate: strOrNull(streak.lastPracticeDate),
      frozenDates: strArr(streak.frozenDates),
    },

    /* The nested arrays. These were merged as a plain object, so they got no array coercion
       at all while the seven top-level collections did. Verified: a stored
       `protocol: { weekPracticeDates: 5 }` survived, and `weekProgress` — called on the
       launch screen — threw "number 5 is not iterable". */
    protocol: {
      currentWeek: num(protocol.currentWeek, 1),
      weekPracticeDates: strArr(protocol.weekPracticeDates),
      completedWeeks: numArr(protocol.completedWeeks),
      avoidedConditions: strArr(protocol.avoidedConditions),
      ...(plan.updatedAt || plan.earlyWarnings || plan.whatHelps || plan.whoToTell || plan.firstStep
        ? {
            relapsePlan: {
              earlyWarnings: str(plan.earlyWarnings, ''),
              whatHelps: str(plan.whatHelps, ''),
              whoToTell: str(plan.whoToTell, ''),
              firstStep: str(plan.firstStep, ''),
              updatedAt: str(plan.updatedAt, ''),
            },
          }
        : {}),
    },

    readModules: strArr(p.readModules),
    moments,
    entitlement: normaliseEntitlement(p.entitlement),
  };
}

/* ---------- load / save ---------- */

export interface LoadResult {
  state: AppState;
  /** False when stored bytes existed but could not be read. Writes must stay locked while
   *  this is false, or the first mutation overwrites a recoverable payload with a blank. */
  ok: boolean;
  /** Key the unreadable payload was copied to, when there was one. */
  quarantinedAt?: string;
}

/* ---------- encryption at rest ----------
 *
 * The key and the CSPRNG are INJECTED, from hooks/deviceKey.ts, because both come from
 * native modules and this file has to stay loadable under bare `node --test`. That is not a
 * technicality: it is the only reason the cipher and its failure paths have tests at all.
 *
 * Until `configureCrypto` runs, `key` is null and this layer reads and writes plaintext —
 * which is exactly what the test suite wants, and exactly what an existing install already
 * has on disk. The upgrade is transparent in one direction: a plaintext payload is read as
 * it always was and then written back sealed on the next save. There is no migration step
 * and nobody is asked anything. */
let cryptoConfig: {
  key: Uint8Array | null;
  randomBytes: (n: number) => Uint8Array;
  nonceBytes: number;
} | null = null;

export function configureCrypto(c: {
  key: Uint8Array | null;
  randomBytes: (n: number) => Uint8Array;
  nonceBytes: number;
}): void {
  cryptoConfig = c;
}

/** Test seam. Also the honest answer to "is this install encrypted?". */
export function isEncryptionActive(): boolean {
  return !!cryptoConfig?.key;
}

export async function loadState(): Promise<LoadResult> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // The read itself failed. There may be perfectly good data underneath, so this is not
    // a blank slate — it is an unknown one, and writing to it would be destructive.
    return { state: emptyState(), ok: false };
  }

  if (!raw) return { state: emptyState(), ok: true }; // genuinely a fresh install

  try {
    const outer = JSON.parse(raw);

    /* Sealed payloads. Three ways this goes wrong and all three take the quarantine path,
       because the alternative — returning an empty state that is safe to write over — is
       how adding encryption turns a bad launch into permanent loss:
         - no key configured, because the keychain could not be reached this launch;
         - the key does not match, because it was regenerated or restored from elsewhere;
         - the bytes were tampered with, which Poly1305 catches.
       Quarantine keeps the bytes and locks writes, so a later launch with a working keychain
       can still read them. */
    let parsed: unknown = outer;
    if (isSealed(outer)) {
      const key = cryptoConfig?.key;
      if (!key) return quarantine(raw);
      const plain = open(outer, key);
      if (plain === null) return quarantine(raw);
      parsed = JSON.parse(plain);
    }

    const enveloped = obj(parsed);
    const versioned = typeof enveloped.v === 'number';
    const version = versioned ? (enveloped.v as number) : 2;
    const data = versioned ? obj(enveloped.data) : enveloped;

    /* A payload from a newer build takes the same route as an unparseable one, and for the
       same reason: we cannot read it, so we must not write over it. Reading it as far as we
       understand and then stamping our own lower version on the way out is the destructive
       option, because it downgrades the envelope while leaving the data in the newer shape —
       and the next upgrade then re-runs a migration over data that has already had it. */
    if (isFromNewerBuild(version)) return quarantine(raw);

    return { state: normalise(migrate(data, version)), ok: true };
  } catch {
    /* Unparseable. Keep the bytes before doing anything else — a truncated write or a
       corrupted row is often still largely readable by hand, and this is somebody's
       journal. Quarantine first, degrade second, and never write until restart. */
    return quarantine(raw);
  }
}

/** Copy bytes we refuse to interpret somewhere safe, and lock writes. */
async function quarantine(raw: string): Promise<LoadResult> {
  const key = `${QUARANTINE_PREFIX}${Date.now()}`;
  try {
    await AsyncStorage.setItem(key, raw);
    return { state: emptyState(), ok: false, quarantinedAt: key };
  } catch {
    return { state: emptyState(), ok: false };
  }
}

/** Returns false when the write did not land, so the caller can stop pretending it did.
 *
 *  Silence used to be the whole policy here, on the grounds that an error dialog during a
 *  grounding exercise is worse than a lost entry. The first half of that is still true —
 *  nothing about this surfaces modally, and never on a safety screen. The second half was
 *  wrong: because the entire state is one value, a quota failure is not a lost entry, it
 *  is every entry from now on, silently, until reinstall. The caller needs to know. */
export async function saveState(state: AppState): Promise<boolean> {
  try {
    const envelope = JSON.stringify({ v: SCHEMA_VERSION, data: state });
    /* Sealed when a key is available, plaintext when one is not.
       Falling back to plaintext rather than refusing to write is deliberate and is the
       lesser of two harms: the alternative is that a keychain hiccup silently stops somebody
       recording anything, in an app people open on their worst days. The state of this is
       surfaced to the user rather than hidden — see components/StorageNotice.tsx. */
    const body =
      cryptoConfig?.key
        ? JSON.stringify(seal(envelope, cryptoConfig.key, cryptoConfig.randomBytes(cryptoConfig.nonceBytes)))
        : envelope;
    await AsyncStorage.setItem(STORAGE_KEY, body);
    return true;
  } catch {
    return false;
  }
}

/** "Delete my data" — and it has to mean all of it.
 *
 *  This used to remove STORAGE_KEY alone, which left every quarantined payload on disk:
 *  full, plaintext, uncensored copies of the journal, written by the recovery path and
 *  never garbage-collected by design. Somebody who taps a button reading "delete
 *  everything" and is told it is gone has been told something false, and the copies left
 *  behind are the most sensitive bytes the app ever writes. */
export async function wipeState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const quarantined = keys.filter((k) => k.startsWith(QUARANTINE_PREFIX));
    if (quarantined.length) await AsyncStorage.multiRemove(quarantined);
  } catch {
    /* nothing useful to do */
  }
  /* And the exports. The button's own copy says it erases "every check-in, every note, your
     plan and your history" — a cleartext backup of all four surviving in the cache makes that
     sentence false in the same way the quarantine copies did. */
  await sweepExports();
}

/** Every export filename this app can leave behind. */
export const EXPORT_FILE = /^anneal-(backup|summary)-\d{4}-\d{2}-\d{2}\.(json|txt)$/;

/** Delete any export file left in the cache directory. Returns how many went.
 *
 *  Both export paths write THE WHOLE JOURNAL IN CLEARTEXT to `Paths.cache`, hand it to
 *  `Share.share`, and delete it in a `finally`. A `finally` does not run if the process is
 *  killed — and while the iOS share sheet is up the app is backgrounded and eligible to be
 *  jetsammed. So: tap "Save a full backup", sheet opens, iOS reclaims the app, and a plaintext
 *  copy of every thought record, every urge trigger and the relapse plan's whoToTell is left
 *  sitting in the container. That is precisely the file-level threat model lib/crypto.ts was
 *  written for. The encryption at rest was being undone by the export button next to it.
 *
 *  The CrashScreen path is the likely one rather than the theoretical one: it renders on an
 *  app that has just crashed, and asks the user to press "Save my writing" immediately.
 *
 *  Nothing swept this, so the file also outlived "Delete everything" — wipeState only ever
 *  touched AsyncStorage. Called from wipeState and once at launch, which covers both the user
 *  asking for it to be gone and the app simply getting another chance at it. */
export async function sweepExports(): Promise<number> {
  /* Web has no cache file to sweep: `download()` in app/(tabs)/progress.tsx hands the browser
     a blob and never touches the filesystem. Checked before the import rather than after,
     because expo-file-system logs "not supported on web" on every load — a warning on every
     launch, for a sweep that could never find anything. */
  if (typeof document !== 'undefined') return 0;

  let removed = 0;
  try {
    /* Imported here rather than at the top of the file on purpose. `expo-file-system` is a
       native module whose entry point is TypeScript, and the whole suite loads this file
       under plain node — a top-level import makes every storage test fail to even parse.
       Deferring it also means a platform without a cache directory never loads the module. */
    const { Directory, Paths } = await import('expo-file-system');
    for (const entry of new Directory(Paths.cache).list()) {
      /* Directories carry a name too; only a file can match this pattern. */
      if (!EXPORT_FILE.test(entry.name)) continue;
      try {
        entry.delete();
        removed += 1;
      } catch {
        /* One file we cannot delete is not a reason to stop deleting the rest. */
      }
    }
  } catch {
    /* No cache directory, or a platform without one. Nothing to sweep. */
  }
  return removed;
}

/* ---------- export ----------
 *
 * Onboarding tells the user, before they have written anything: "there is no backup. If
 * you delete the app it is gone. You can export a plain-text copy whenever you like."
 * Both halves of that sentence have to be true, which means export is free (it is not a
 * paid feature, see lib/entitlement.ts) and it has to contain what they actually wrote —
 * a count of thought records is a progress summary wearing a backup's job title. */

/** Plain-text export, for a person or a clinician to read. Never contains an appearance
 *  value, because none is stored. */
export function exportText(state: AppState): string {
  const l: string[] = [];
  l.push('ANNEAL — personal summary');
  l.push(`Generated ${new Date().toLocaleString()}`);
  l.push('');
  l.push('This is self-tracked information from a self-help app.');
  l.push('It is not a clinical assessment and not a diagnosis.');
  l.push('');

  if (state.baseline) {
    l.push('BASELINE (first recorded)');
    l.push(`  Appearance preoccupation: ~${state.baseline.preoccupationMinutes} min/day`);
    l.push(`  Checking urge: ${state.baseline.urge}/10`);
    l.push(`  Distress: ${state.baseline.suds}/10`);
    l.push(`  Avoidance: ${state.baseline.avoidance}`);
    l.push('');
  }

  l.push(`PROGRAMME: week ${state.protocol.currentWeek} of 12`);
  l.push(`Practice days recorded: ${new Set(state.practice.map((p) => p.date)).size}`);
  l.push(`Longest run of consecutive days: ${state.streak.longest}`);
  l.push('');

  if (state.checkIns.length) {
    l.push('DAILY CHECK-INS (most recent 30)');
    [...state.checkIns]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .forEach((c) => {
        l.push(
          `  ${c.date}  preoccupation ~${c.preoccupationMinutes}m  urge ${c.urge}/10  distress ${c.suds}/10  avoidance ${c.avoidance}`
        );
      });
    l.push('');
  }

  if (state.mirrorSessions.length) {
    l.push('GUIDED MIRROR SESSIONS');
    state.mirrorSessions.slice(0, 20).forEach((m) => {
      l.push(
        `  ${m.date}  phase ${m.phase}  ${Math.round(m.durationSeconds / 60)}min  distress ${m.sudsBefore} → ${m.sudsAfter}${m.completed ? '' : '  (ended early)'}`
      );
    });
    l.push('');
  }

  const resisted = state.urgeLogs.filter((u) => u.resisted).length;
  if (state.urgeLogs.length) {
    l.push(`CHECKING URGES: ${state.urgeLogs.length} logged, ${resisted} ridden out`);
    [...state.urgeLogs].slice(0, 20).forEach((u) => {
      l.push(
        `  ${u.date}  ${u.trigger}${u.wantedTo ? ` — wanted to ${u.wantedTo}` : ''}  ${u.intensityBefore}${typeof u.intensityAfter === 'number' ? ` → ${u.intensityAfter}` : ''}`
      );
    });
    l.push('');
  }

  /* The writing itself. This is the part somebody would actually want back, and the part
     that used to be reduced to a single integer. */
  if (state.thoughtRecords.length) {
    l.push(`THOUGHT RECORDS (${state.thoughtRecords.length} total, most recent 20)`);
    l.push('');
    state.thoughtRecords.slice(0, 20).forEach((r) => {
      l.push(`  ${r.date} — ${r.emotion} ${r.emotionIntensity} → ${r.reRatedIntensity}`);
      if (r.situation) l.push(`    Situation: ${r.situation}`);
      if (r.automaticThought) l.push(`    Thought: ${r.automaticThought}`);
      if (r.distortions?.length) l.push(`    Patterns: ${r.distortions.join(', ')}`);
      if (r.evidenceFor) l.push(`    Evidence for: ${r.evidenceFor}`);
      if (r.evidenceAgainst) l.push(`    Evidence against: ${r.evidenceAgainst}`);
      if (r.balancedThought) l.push(`    Balanced view: ${r.balancedThought}`);
      l.push('');
    });
  }

  /* Predictions and outcomes. SAFETY.md §11 exists to keep these honest, so losing them
     out of the export would defeat the point of freezing them in the first place. */
  if (state.experiments.length) {
    l.push(`BEHAVIOURAL EXPERIMENTS (${state.experiments.length})`);
    l.push('');
    state.experiments.slice(0, 20).forEach((e) => {
      l.push(`  ${e.date} — ${e.avoiding}`);
      l.push(`    Predicted: ${e.prediction} (${e.likelihoodBefore}% likely)`);
      if (e.outcome) {
        l.push(`    Happened: ${e.outcome}`);
        if (typeof e.likelihoodAfter === 'number') l.push(`    Rated after: ${e.likelihoodAfter}%`);
        if (e.conclusion) l.push(`    Conclusion: ${e.conclusion}`);
      } else {
        l.push('    Outcome not yet recorded');
      }
      l.push('');
    });
  }

  if (state.protocol.relapsePlan) {
    const p = state.protocol.relapsePlan;
    l.push('RELAPSE PLAN');
    l.push(`  Early warning signs: ${p.earlyWarnings}`);
    l.push(`  What helps: ${p.whatHelps}`);
    l.push(`  Who to tell: ${p.whoToTell}`);
    l.push(`  First step: ${p.firstStep}`);
  }

  return l.join('\n');
}

/** Lossless machine-readable export. The actual backup, and the thing `importJson` reads.
 *  A user-initiated file the user keeps is not a server, an account, or a tracker, so this
 *  stays inside SAFETY.md §6. */
export function exportJson(state: AppState): string {
  return JSON.stringify({ v: SCHEMA_VERSION, data: state }, null, 2);
}

/** Parse a previously exported backup. Returns null if it is not one — never throws, and
 *  never half-applies. The caller confirms with the user before replacing local state. */
export function importJson(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw);
    const enveloped = obj(parsed);
    const versioned = typeof enveloped.v === 'number';
    const version = versioned ? (enveloped.v as number) : 2;
    const data = versioned ? obj(enveloped.data) : enveloped;
    // A file with none of the expected collections is somebody's shopping list, not a
    // Anneal backup, and silently replacing their journal with it would be unforgivable.
    if (!Array.isArray(data.checkIns) && !Array.isArray(data.thoughtRecords) && !data.profile) {
      return null;
    }
    /* The same refusal `loadState` makes above, for the same reason, and it was missing here.
       A backup written by a NEWER build carries fields this version's allowlist has never
       heard of, and reading it does not merely ignore them — `normalise` strips them, so
       importing and then saving is a lossy rewrite of somebody's journal. A TestFlight build
       followed by an App Store build with a lower SCHEMA_VERSION, then "restore my backup",
       is the exact route. Refusing is recoverable; a silent strip is not. */
    if (isFromNewerBuild(version)) return null;
    return normalise(migrate(data, version));
  } catch {
    return null;
  }
}
