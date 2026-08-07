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
import type { AppState, MomentRecord } from '../types';
import { initialStreak } from './streak.ts';
/* Imported rather than redefined. Two identical constructors for one persisted shape is
   the same hazard the MomentRecord comment in moments.ts warns about for the type: they
   compile happily while drifting apart. */
import { emptyMomentRecord } from './moments.ts';

/* The key never changes again. Versioning happens inside the envelope; the `.v2` suffix is
   a historical artefact of the first release and renaming it now would strand real data. */
export const STORAGE_KEY = 'steady.state.v2';

/** Prefix for payloads that could not be read. Never garbage-collected automatically. */
export const QUARANTINE_PREFIX = 'steady.unreadable.';

/** Bumped whenever a migration is added below. */
export const SCHEMA_VERSION = 3;

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
  streak: initialStreak(),
  protocol: {
    currentWeek: 1,
    weekPracticeDates: [],
    completedWeeks: [],
    avoidedConditions: [],
  },
  readModules: [],
  entitled: false,
  moments: {},
  trialStartedAt: null,
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
];

function migrate(data: Payload, from: number): Payload {
  let out = data;
  for (let v = from; v < SCHEMA_VERSION; v++) {
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

export function normalise(parsed: unknown): AppState {
  const p = obj(parsed);
  const base = emptyState();

  /* Each moment record is merged against its own default. Merging only the outer map —
     which is what this used to do — leaves individual records short of fields, and a
     record missing `shows` produces a prompt that can never retire. */
  const moments: Record<string, MomentRecord> = {};
  for (const [k, v] of Object.entries(obj(p.moments))) {
    moments[k] = { ...emptyMomentRecord(), ...obj(v) } as MomentRecord;
  }

  return {
    ...base,
    ...p,
    profile: { ...base.profile, ...obj(p.profile) },
    streak: { ...initialStreak(), ...obj(p.streak) },
    protocol: { ...base.protocol, ...obj(p.protocol) },
    // Collections are coerced to arrays: a corrupted scalar here would otherwise crash
    // every `.filter` and `.map` downstream on the first render.
    checkIns: arr(p.checkIns),
    urgeLogs: arr(p.urgeLogs),
    thoughtRecords: arr(p.thoughtRecords),
    mirrorSessions: arr(p.mirrorSessions),
    experiments: arr(p.experiments),
    practice: arr(p.practice),
    readModules: arr(p.readModules),
    moments,
    entitled: p.entitled === true,
    trialStartedAt: typeof p.trialStartedAt === 'string' ? p.trialStartedAt : null,
  } as AppState;
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
    const parsed = JSON.parse(raw);
    const enveloped = obj(parsed);
    const versioned = typeof enveloped.v === 'number';
    const version = versioned ? (enveloped.v as number) : 2;
    const data = versioned ? obj(enveloped.data) : enveloped;
    return { state: normalise(migrate(data, version)), ok: true };
  } catch {
    /* Unparseable. Keep the bytes before doing anything else — a truncated write or a
       corrupted row is often still largely readable by hand, and this is somebody's
       journal. Quarantine first, degrade second, and never write until restart. */
    const key = `${QUARANTINE_PREFIX}${Date.now()}`;
    try {
      await AsyncStorage.setItem(key, raw);
      return { state: emptyState(), ok: false, quarantinedAt: key };
    } catch {
      return { state: emptyState(), ok: false };
    }
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, data: state }));
    return true;
  } catch {
    return false;
  }
}

export async function wipeState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
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
  l.push('STEADY — personal summary');
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
    // Steady backup, and silently replacing their journal with it would be unforgivable.
    if (!Array.isArray(data.checkIns) && !Array.isArray(data.thoughtRecords) && !data.profile) {
      return null;
    }
    return normalise(migrate(data, version));
  } catch {
    return null;
  }
}
