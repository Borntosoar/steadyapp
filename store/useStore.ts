import { create } from 'zustand';
import type {
  AppState,
  Baseline,
  CheckIn,
  Experiment,
  MirrorSession,
  PracticeKind,
  RelapsePlan,
  ThoughtRecord,
  UrgeLog,
} from '../types';
import { emptyState, loadState, saveState, wipeState } from '../lib/storage';
import { dayKey, registerPractice, milestoneReached } from '../lib/streak';
import { recordPracticeDay } from '../lib/protocol';
import { markShown, markDismissed, markActed, type MomentId } from '../lib/moments';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface StoreApi extends AppState {
  hydrated: boolean;
  /** Set when a milestone fires so the UI can celebrate once, then cleared. */
  pendingMilestone: number | null;

  hydrate: () => Promise<void>;
  reset: () => Promise<void>;

  completeOnboarding: (baseline: Baseline, firstName?: string) => void;
  acceptDisclaimer: () => void;
  setSupportRegion: (region: string) => void;
  setEntitled: (v: boolean, startsTrial?: boolean) => void;
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

  checkedInToday: () => boolean;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
/* Writes are chained rather than fired in parallel. Two overlapping `setItem` calls
   resolve in completion order, not issue order, so a slow write can land after a faster
   later one and silently roll state back. */
let writeChain: Promise<unknown> = Promise.resolve();

function snapshot(get: () => StoreApi): AppState {
  const { hydrated, pendingMilestone, loadOk, saveOk, ...rest } =
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

  hydrate: async () => {
    const { state, ok, quarantinedAt } = await loadState();
    set({ ...state, hydrated: true, loadOk: ok, quarantinedAt: quarantinedAt ?? null });
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

  setEntitled: (entitled, startsTrial = false) => {
    /* The trial clock is stamped ONLY when a trial actually starts, never as a side
       effect of becoming entitled.
       Stamping it on any grant meant a lifetime purchaser — somebody who paid $149 once,
       with no renewal to warn about — got the trial-ending notice on day twelve. That
       notice is a `service` moment: priority 100, ignores the daily budget, ignores
       distress suppression. So the one customer who had already paid the most was told
       through their worst day that they were about to be charged again. */
    set((s) => ({
      entitled,
      trialStartedAt: startsTrial && !s.trialStartedAt ? new Date().toISOString() : s.trialStartedAt,
    }));
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
