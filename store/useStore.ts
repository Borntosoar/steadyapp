import { create } from 'zustand';
import type {
  AppState,
  Baseline,
  CheckIn,
  Experiment,
  MirrorSession,
  PracticeKind,
  RelapsePlan,
  Commitment,
  SurveyAnswers,
  ThoughtRecord,
  UrgeLog,
} from '../types';
import { emptyState, loadState, saveState, wipeState, isEncryptionActive } from '../lib/storage';
import { regionForLocale } from '../constants/support';
import { deviceLocale } from '../hooks/deviceLocale';
import { dayKey, registerPractice, milestoneReached } from '../lib/streak';
import { recordPracticeDay } from '../lib/protocol';
import { markShown, markDismissed, markActed, type MomentId } from '../lib/moments';
import type { Entitlement } from '../lib/entitlement';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface StoreApi extends AppState {
  hydrated: boolean;
  /** Set when a milestone fires so the UI can celebrate once, then cleared. */
  pendingMilestone: number | null;

  hydrate: () => Promise<void>;
  reset: () => Promise<void>;

  completeOnboarding: (baseline: Baseline, firstName?: string) => void;
  /** The opening survey. Answers and the shape they resolve to, both on device. */
  saveSurvey: (answers: SurveyAnswers, carrying: string) => void;
  /** Groundwork keeps one action for tomorrow. */
  keepCommitment: (action: string, size: string) => void;
  /** ...and answers for it the next time the game opens. */
  answerCommitment: (id: string, kept: string) => void;
  acceptDisclaimer: () => void;
  setSupportRegion: (region: string) => void;
  /** The ONLY writer of the entitlement cache. Everything else projects it. */
  setEntitlement: (e: Entitlement) => void;
  momentShown: (id: MomentId) => void;
  momentDismissed: (id: MomentId) => void;
  momentActed: (id: MomentId) => void;

  addCheckIn: (c: Omit<CheckIn, 'id' | 'date'> & { date?: string }) => void;
  addUrgeLog: (u: Omit<UrgeLog, 'id' | 'date'>) => void;
  addThoughtRecord: (t: Omit<ThoughtRecord, 'id' | 'date'>) => void;
  addMirrorSession: (m: Omit<MirrorSession, 'id' | 'date'>) => void;
  addExperiment: (e: Pick<Experiment, 'avoiding' | 'prediction' | 'likelihoodBefore' | 'safetyBehavioursDropped'>) => void;
  completeExperiment: (
    id: string,
    outcome: Pick<Experiment, 'outcome' | 'comparison' | 'likelihoodAfter' | 'conclusion'>
  ) => void;
  markModuleRead: (slug: string) => void;
  setAvoidedConditions: (list: string[]) => void;
  setRelapsePlan: (p: Omit<RelapsePlan, 'updatedAt'>) => void;

  /** The one entry point that advances streak + protocol. Everything that counts as
   *  engagement routes through here, including "hard day". */
  logPractice: (kind: PracticeKind) => void;
  clearMilestone: () => void;

  /** False when stored bytes existed but could not be read. Writes stay locked. */
  loadOk: boolean;
  /** False when the last write did not land — storage full or unavailable. */
  saveOk: boolean;
  /** Key an unreadable payload was copied to, if there was one. */
  quarantinedAt: string | null;
  /** False when the device keychain could not be reached, so writes are going out in plain
   *  text rather than sealed. Surfaced to the user — see components/StorageNotice.tsx. */
  encrypted: boolean;

  checkedInToday: () => boolean;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
/* Writes are chained rather than fired in parallel. Two overlapping `setItem` calls
   resolve in completion order, not issue order, so a slow write can land after a faster
   later one and silently roll state back. */
let writeChain: Promise<unknown> = Promise.resolve();

/* Session-only fields are stripped here and nowhere else. Anything left in `rest` is
   written to disk, so a field that is not part of AppState must appear in this
   destructure — `quarantinedAt` did not, and was being serialised into the payload. */
function snapshot(get: () => StoreApi): AppState {
  const { hydrated, pendingMilestone, loadOk, saveOk, quarantinedAt, encrypted, ...rest } =
    get() as StoreApi & Record<string, unknown>;
  return rest as AppState;
}

function persist(get: () => StoreApi, set: (p: Partial<StoreApi>) => void) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    /* THE WRITE LOCK. If the stored payload could not be read, this process is holding a
       blank state that only LOOKS like a fresh install. Writing it would overwrite a
       journal that is still sitting on disk and still recoverable. Better to lose this
       session's edits than somebody's year. */
    if (!get().loadOk) return;
    writeChain = writeChain.then(async () => {
      const ok = await saveState(snapshot(get));
      if (ok !== get().saveOk) set({ saveOk: ok });
    });
  }, 150);
}

/** Write immediately, skipping the debounce. Called when the app goes to the background,
 *  where the alternative is losing whatever happened in the last 150ms to a task kill. */
export async function flushState(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const s = useStore.getState();
  if (!s.loadOk) return;
  writeChain = writeChain.then(async () => {
    const ok = await saveState(snapshot(() => useStore.getState()));
    if (ok !== useStore.getState().saveOk) useStore.setState({ saveOk: ok });
  });
  await writeChain;
}

export const useStore = create<StoreApi>((set, get) => ({
  ...emptyState(),
  hydrated: false,
  pendingMilestone: null,
  loadOk: true,
  saveOk: true,
  quarantinedAt: null,
  /* Optimistic default, corrected on hydrate. Starting false would flash a "not scrambled"
     notice on every launch during the moment before the keychain answers. */
  encrypted: true,

  hydrate: async () => {
    const { state, ok, quarantinedAt } = await loadState();

    /* Guess the crisis-line region from the device, but ONLY on a genuinely fresh install.
       `onboardedAt` is the marker: once somebody has been through onboarding, what is stored
       is either their explicit choice or a default they have already lived with, and quietly
       changing it because they picked up a phone in another country would be the app
       overriding a person about where they are.
       Before this, the default was 'us' for everybody on earth — a reasonable guess for an
       English-only listing and a bad one for an app available in every territory. */
    const fresh = !state.profile.onboardedAt;
    const supportRegion = fresh ? regionForLocale(deviceLocale()) : state.profile.supportRegion;

    set({
      ...state,
      profile: { ...state.profile, supportRegion },
      hydrated: true,
      loadOk: ok,
      quarantinedAt: quarantinedAt ?? null,
      /* Read AFTER loadState, because initDeviceCrypto has configured it by then. This is
         the real answer to "is this install encrypted", not an assumption. */
      encrypted: isEncryptionActive(),
    });
  },

  reset: async () => {
    /* Cancel the pending write first. Without this, a save queued 150ms ago lands after
       removeItem and rewrites the whole journal straight back — a "delete my data" that
       deletes nothing. */
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await wipeState();
    set({
      ...emptyState(),
      hydrated: true,
      pendingMilestone: null,
      loadOk: true,
      saveOk: true,
      quarantinedAt: null,
    });
  },

  keepCommitment: (action, size) => {
    set((s) => ({
      commitments: [{ id: id(), date: dayKey(new Date()), action, size }, ...s.commitments],
    }));
    persist(get, set);
  },

  answerCommitment: (cid, kept) => {
    set((s) => ({
      commitments: s.commitments.map((c) =>
        c.id === cid ? { ...c, kept, answeredAt: new Date().toISOString() } : c,
      ),
    }));
    persist(get, set);
  },

  saveSurvey: (answers, carrying) => {
    set((s) => ({
      profile: {
        ...s.profile,
        survey: answers,
        carrying,
        surveyedAt: new Date().toISOString(),
      },
    }));
    persist(get, set);
  },

  completeOnboarding: (baseline, firstName) => {
    set((s) => ({
      baseline,
      profile: {
        ...s.profile,
        firstName,
        onboardedAt: new Date().toISOString(),
      },
    }));
    persist(get, set);
  },

  acceptDisclaimer: () => {
    set((s) => ({
      profile: { ...s.profile, disclaimerAcceptedAt: new Date().toISOString() },
    }));
    persist(get, set);
  },

  setSupportRegion: (supportRegion) => {
    set((s) => ({ profile: { ...s.profile, supportRegion } }));
    persist(get, set);
  },

  setEntitlement: (entitlement) => {
    /* Writes the cache, nothing more. Whether the user is entitled RIGHT NOW is a
       question for `isEntitled(entitlement)`, asked fresh each time — a stored boolean is
       what let a refund, an expiry and a cancellation all have no path back. */
    set({ entitlement });
    persist(get, set);
  },

  /* Moment bookkeeping. Every unprompted message in the app routes through these three,
     so the record of what was shown and what was refused lives in exactly one place. */
  momentShown: (id) => {
    set((s) => ({ moments: markShown(s.moments, id) }));
    persist(get, set);
  },

  momentDismissed: (id) => {
    set((s) => ({ moments: markDismissed(s.moments, id) }));
    persist(get, set);
  },

  momentActed: (id) => {
    set((s) => ({ moments: markActed(s.moments, id) }));
    persist(get, set);
  },

  addCheckIn: (c) => {
    const date = c.date ?? dayKey(new Date());
    set((s) => ({
      // One check-in per day. A second replaces the first rather than stacking, so the
      // daily average can't be skewed by someone re-answering while ruminating.
      checkIns: [{ ...c, id: id(), date }, ...s.checkIns.filter((x) => x.date !== date)],
    }));
    get().logPractice('checkin');
  },

  addUrgeLog: (u) => {
    set((s) => ({ urgeLogs: [{ ...u, id: id(), date: dayKey(new Date()) }, ...s.urgeLogs] }));
    get().logPractice('urge');
  },

  addThoughtRecord: (t) => {
    set((s) => ({
      thoughtRecords: [{ ...t, id: id(), date: dayKey(new Date()) }, ...s.thoughtRecords],
    }));
    get().logPractice('thought-record');
  },

  addMirrorSession: (m) => {
    set((s) => ({
      mirrorSessions: [{ ...m, id: id(), date: dayKey(new Date()) }, ...s.mirrorSessions],
    }));
    get().logPractice('mirror');
  },

  addExperiment: (e) => {
    set((s) => ({
      experiments: [{ ...e, id: id(), date: dayKey(new Date()) }, ...s.experiments],
    }));
    get().logPractice('experiment');
  },

  /* The prediction fields are never touched here. Once an outcome is known, memory
     rewrites what you "always expected" — so the prediction stays frozen as written. */
  completeExperiment: (expId, outcome) => {
    set((s) => ({
      experiments: s.experiments.map((e) =>
        e.id === expId ? { ...e, ...outcome, completedAt: new Date().toISOString() } : e
      ),
    }));
    get().logPractice('experiment');
  },

  markModuleRead: (slug) => {
    set((s) => (s.readModules.includes(slug) ? s : { readModules: [...s.readModules, slug] }));
    persist(get, set);
  },

  setAvoidedConditions: (list) => {
    set((s) => ({ protocol: { ...s.protocol, avoidedConditions: list } }));
    persist(get, set);
  },

  setRelapsePlan: (p) => {
    set((s) => ({
      protocol: { ...s.protocol, relapsePlan: { ...p, updatedAt: new Date().toISOString() } },
    }));
    persist(get, set);
  },

  logPractice: (kind) => {
    const today = dayKey(new Date());
    const s = get();

    const alreadyToday = s.practice.some((p) => p.date === today);
    const prevStreak = s.streak.current;
    const nextStreak = alreadyToday ? s.streak : registerPractice(s.streak, today);
    const milestone = alreadyToday ? null : milestoneReached(prevStreak, nextStreak.current);

    /* One row per day per kind, not one per action. This array is only ever read as a
       set of dates (and, for hard days, a set of dates per kind), so an unconditional
       append was pure growth — and it made `practice.length` count actions, which had the
       review prompt firing at somebody on their first afternoon. */
    const alreadyThisKind = s.practice.some((p) => p.date === today && p.kind === kind);

    set({
      practice: alreadyThisKind ? s.practice : [{ id: id(), date: today, kind }, ...s.practice],
      streak: nextStreak,
      protocol: recordPracticeDay(s.protocol, today),
      pendingMilestone: milestone ?? s.pendingMilestone,
    });
    persist(get, set);
  },

  clearMilestone: () => set({ pendingMilestone: null }),

  checkedInToday: () => {
    const today = dayKey(new Date());
    return get().checkIns.some((c) => c.date === today);
  },
}));
