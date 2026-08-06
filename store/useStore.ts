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
  setEntitled: (v: boolean) => void;

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

  checkedInToday: () => boolean;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist(get: () => StoreApi) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = get();
    const { hydrated, pendingMilestone, ...rest } = s as StoreApi & Record<string, unknown>;
    void saveState(rest as AppState);
  }, 150);
}

export const useStore = create<StoreApi>((set, get) => ({
  ...emptyState(),
  hydrated: false,
  pendingMilestone: null,

  hydrate: async () => {
    const loaded = await loadState();
    set({ ...loaded, hydrated: true });
  },

  reset: async () => {
    await wipeState();
    set({ ...emptyState(), hydrated: true, pendingMilestone: null });
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
    persist(get);
  },

  acceptDisclaimer: () => {
    set((s) => ({
      profile: { ...s.profile, disclaimerAcceptedAt: new Date().toISOString() },
    }));
    persist(get);
  },

  setSupportRegion: (supportRegion) => {
    set((s) => ({ profile: { ...s.profile, supportRegion } }));
    persist(get);
  },

  setEntitled: (entitled) => {
    set({ entitled });
    persist(get);
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
    persist(get);
  },

  setAvoidedConditions: (list) => {
    set((s) => ({ protocol: { ...s.protocol, avoidedConditions: list } }));
    persist(get);
  },

  setRelapsePlan: (p) => {
    set((s) => ({
      protocol: { ...s.protocol, relapsePlan: { ...p, updatedAt: new Date().toISOString() } },
    }));
    persist(get);
  },

  logPractice: (kind) => {
    const today = dayKey(new Date());
    const s = get();

    const alreadyToday = s.practice.some((p) => p.date === today);
    const prevStreak = s.streak.current;
    const nextStreak = alreadyToday ? s.streak : registerPractice(s.streak, today);
    const milestone = alreadyToday ? null : milestoneReached(prevStreak, nextStreak.current);

    set({
      practice: [{ id: id(), date: today, kind }, ...s.practice],
      streak: nextStreak,
      protocol: recordPracticeDay(s.protocol, today),
      pendingMilestone: milestone ?? s.pendingMilestone,
    });
    persist(get);
  },

  clearMilestone: () => set({ pendingMilestone: null }),

  checkedInToday: () => {
    const today = dayKey(new Date());
    return get().checkIns.some((c) => c.date === today);
  },
}));
