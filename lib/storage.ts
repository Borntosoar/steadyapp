/* Persistence.
 *
 * AsyncStorage on native, localStorage-backed on web (RN Web maps it). Local only —
 * there is no network call anywhere in this file, and there must not be one. */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '../types';
import { initialStreak } from './streak';

export const STORAGE_KEY = 'steady.state.v2';

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
});

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    // Shallow-merge onto a fresh empty state so a shape change in a later version
    // degrades to defaults rather than crashing on a missing key.
    return {
      ...emptyState(),
      ...parsed,
      profile: { ...emptyState().profile, ...(parsed.profile ?? {}) },
      streak: { ...initialStreak(), ...(parsed.streak ?? {}) },
      protocol: { ...emptyState().protocol, ...(parsed.protocol ?? {}) },
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable. Failing silently is correct here: the alternative is
    // an error dialog during a grounding exercise, which is worse than a lost entry.
  }
}

export async function wipeState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
}

/** Plain-text export. Never contains an appearance value because none is stored. */
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
    l.push(`CHECKING URGES: ${state.urgeLogs.length} logged, ${resisted} resisted`);
    l.push('');
  }

  l.push(`Thought records completed: ${state.thoughtRecords.length}`);

  if (state.protocol.relapsePlan) {
    const p = state.protocol.relapsePlan;
    l.push('');
    l.push('RELAPSE PLAN');
    l.push(`  Early warning signs: ${p.earlyWarnings}`);
    l.push(`  What helps: ${p.whatHelps}`);
    l.push(`  Who to tell: ${p.whoToTell}`);
    l.push(`  First step: ${p.firstStep}`);
  }

  return l.join('\n');
}
