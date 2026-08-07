/* Moments — the orchestration layer for everything the app says unprompted.
 *
 * THE DISTINCTION THIS FILE EXISTS TO ENFORCE
 *
 * A **boundary** is reached because the user walked into it: a locked module they tapped,
 * the sixth thought record in a month, the charts on Progress. The app is answering a
 * question the user just asked. Boundaries always render, need no budget, and are not
 * scheduled here.
 *
 * An **interruption** is started by the app: the upgrade ask, a winback, a trial-ending
 * notice, a request for a review. Nobody asked for it. It arrives on top of whatever the
 * person opened the app to do, and it spends trust every time it fires whether or not it
 * converts. Interruptions are budgeted, prioritised, and capped — here, in one place.
 *
 * Scattering interruptions across screens is how apps end up showing three prompts in one
 * session without anybody deciding to. One file, one decision, one at a time.
 *
 * THE RULES
 *
 *   1. At most one interruption a day, across the whole app.
 *   2. Distress suppresses anything commercial for 24 hours. A hard-day tap, a high
 *      distress rating, a significant-avoidance day — no ask, no review request. Timing an
 *      offer off somebody's suffering is the line this product does not cross, and it is
 *      also, separately, how you earn a one-star review.
 *   3. Dismissal is an answer. Each dismissal doubles the wait, and after the configured
 *      limit the moment retires permanently. Three "no"s and it never asks again.
 *   4. Acting on a moment retires it.
 *   5. Service moments outrank everything. A trial ending in two days is money about to
 *      leave somebody's account and they were promised a warning — that fires through a
 *      bad day, because not firing is the thing that would hurt them.
 *
 * See .claude/skills/value-first-growth/references/moments.md for the reasoning and the
 * published frequency figures behind the caps. */

import type { AppState, CheckIn } from '../types';

export type MomentId =
  | 'trial-ending'
  | 'winback'
  | 'plateau'
  | 'month-two-proof'
  | 'week-one-ask'
  | 'rate-app';

/** What the moment is FOR. Governs suppression, not tone.
 *  - service   : the app owes the user this information. Fires regardless of mood.
 *  - care      : about the work going well or badly. Never sells.
 *  - commercial: asks for money.
 *  - advocacy  : asks for a review. Treated like commercial for suppression, because
 *                asking a person having a bad day to go and praise you in public is both
 *                tone-deaf and a reliable way to collect one stars. */
export type MomentKind = 'service' | 'care' | 'commercial' | 'advocacy';

export interface MomentConfig {
  id: MomentId;
  kind: MomentKind;
  /** Higher wins when two are eligible on the same day. */
  priority: number;
  /** Lifetime ceiling on impressions. */
  maxShows: number;
  /** Days between impressions. Doubles with each dismissal. */
  cooldownDays: number;
  /** Dismissals after which the moment retires for good. 0 means it cannot be dismissed
   *  away — only acted on or exhausted. */
  maxDismissals: number;
}

export const MOMENTS: Record<MomentId, MomentConfig> = {
  /* A payment is about to happen and we promised a warning on the paywall. This one is
     not a marketing message, it is the app keeping its word, so nothing suppresses it. */
  'trial-ending': { id: 'trial-ending', kind: 'service', priority: 100, maxShows: 2, cooldownDays: 1, maxDismissals: 0 },

  /* Somebody stopped. Usually during a bad stretch, usually carrying some shame about it.
     Two attempts, a fortnight apart, then the app stops calling. */
  winback: { id: 'winback', kind: 'service', priority: 80, maxShows: 2, cooldownDays: 14, maxDismissals: 1 },

  /* Named before they hit it. An expected plateau is a stage; an unexpected one is a
     cancellation. */
  plateau: { id: 'plateau', kind: 'care', priority: 60, maxShows: 2, cooldownDays: 7, maxDismissals: 1 },

  /* Week eight and the number has held. The subscription was sold on evidence, so the
     evidence has to keep arriving or the renewal does not. */
  'month-two-proof': { id: 'month-two-proof', kind: 'care', priority: 55, maxShows: 1, cooldownDays: 30, maxDismissals: 0 },

  /* The one commercial interruption in the app. Week one done, three check-ins in, a real
     number they have watched move. */
  'week-one-ask': { id: 'week-one-ask', kind: 'commercial', priority: 40, maxShows: 3, cooldownDays: 4, maxDismissals: 3 },

  /* Asked once, after something good, never after something bad. iOS caps the native
     prompt at three a year per user regardless — spending one of those on a person mid
     bad week is a waste of a scarce resource as well as a discourtesy. */
  'rate-app': { id: 'rate-app', kind: 'advocacy', priority: 20, maxShows: 1, cooldownDays: 90, maxDismissals: 1 },
};

export interface MomentRecord {
  shows: number;
  lastShownDate: string | null;
  dismissals: number;
  lastDismissedDate: string | null;
  /** Tapped through. Retires the moment. */
  acted: boolean;
}

export type MomentState = Record<string, MomentRecord>;

export const emptyMomentRecord = (): MomentRecord => ({
  shows: 0,
  lastShownDate: null,
  dismissals: 0,
  lastDismissedDate: null,
  acted: false,
});

/* ---------- dates ---------- */

export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime();
  return Math.round(ms / 86400000);
}

/* ---------- distress suppression ---------- */

/** True when the last day or so looked hard.
 *
 *  Deliberately generous: it errs toward suppressing an ask that might have converted
 *  rather than risking one landing on somebody at their worst. A missed sale costs a few
 *  dollars. The other mistake costs a person's trust in the one app they opened for help,
 *  and the asymmetry is not close. */
export function distressRecently(
  checkIns: CheckIn[],
  hardDayDates: string[],
  now: Date = new Date()
): boolean {
  const today = dayKey(now);

  for (const d of hardDayDates) {
    if (daysBetween(d, today) <= 1) return true;
  }

  for (const ci of checkIns) {
    const gap = daysBetween(ci.date, today);
    if (gap < 0 || gap > 1) continue;
    if (ci.suds >= 8) return true;
    if (ci.avoidance === 'significant') return true;
  }

  return false;
}

/* ---------- eligibility ---------- */

export interface MomentInput {
  state: AppState;
  /** Trial start, if one is running. Drives `trial-ending`. */
  trialStartedAt?: string | null;
  trialDays?: number;
  /** Whether the reclaimed figure is real yet (>= 3 check-ins in the window). */
  reclaimedSampleSize: number;
  /** Practice days done this week against the required number. */
  weekComplete: boolean;
}

export interface Moment {
  id: MomentId;
  kind: MomentKind;
}

/** Which moments the underlying situation makes true, ignoring caps and cooldowns.
 *  Split out from the budgeting so each half can be tested on its own. */
export function eligibleMoments(input: MomentInput, now: Date = new Date()): MomentId[] {
  const { state } = input;
  const out: MomentId[] = [];
  const today = dayKey(now);

  // Trial ending: two days out or closer, and not yet over.
  if (input.trialStartedAt && input.trialDays) {
    const elapsed = daysBetween(input.trialStartedAt.slice(0, 10), today);
    const left = input.trialDays - elapsed;
    if (left <= 2 && left >= 0) out.push('trial-ending');
  }

  // Winback: has a history worth returning to, and has been gone ten days.
  const lastPractice = state.streak.lastPracticeDate;
  if (lastPractice && state.practice.length >= 3) {
    if (daysBetween(lastPractice, today) >= 10) out.push('winback');
  }

  // Plateau: named in week four, before weeks five to eight arrive.
  if (state.protocol.currentWeek >= 4 && state.protocol.currentWeek <= 5) out.push('plateau');

  // Month two: the evidence that keeps a subscription alive past the first renewal.
  if (state.entitled && state.protocol.currentWeek >= 8 && input.reclaimedSampleSize >= 3) {
    out.push('month-two-proof');
  }

  // The ask.
  if (!state.entitled && input.weekComplete && input.reclaimedSampleSize >= 3) {
    out.push('week-one-ask');
  }

  // Review: after real, sustained, self-evidently good use. Never on a thin account.
  const resisted = state.urgeLogs.filter((u) => u.resisted).length;
  if (state.practice.length >= 10 && (resisted >= 3 || state.mirrorSessions.length >= 3)) {
    out.push('rate-app');
  }

  return out;
}

/** Has this moment been used up, dismissed away, or acted on? */
function retired(rec: MomentRecord, cfg: MomentConfig): boolean {
  if (rec.acted) return true;
  if (rec.shows >= cfg.maxShows) return true;
  if (cfg.maxDismissals > 0 && rec.dismissals >= cfg.maxDismissals) return true;
  return false;
}

/** Is the cooldown still running? Each dismissal doubles it — a "no" that is ignored is
 *  not a conversation, it is nagging. */
function cooling(rec: MomentRecord, cfg: MomentConfig, today: string): boolean {
  const anchor = rec.lastDismissedDate ?? rec.lastShownDate;
  if (!anchor) return false;
  const wait = cfg.cooldownDays * Math.pow(2, rec.dismissals);
  return daysBetween(anchor, today) < wait;
}

/**
 * The single decision point. Returns at most one moment for today, or null.
 *
 * Everything the app says unprompted goes through here. If a screen wants to interrupt
 * somebody and it is not in this function, that is the bug.
 */
export function nextMoment(input: MomentInput, now: Date = new Date()): Moment | null {
  const { state } = input;
  const today = dayKey(now);
  const moments = state.moments ?? {};

  const hardDays = state.practice.filter((p) => p.kind === 'hard-day').map((p) => p.date);
  const suppressed = distressRecently(state.checkIns, hardDays, now);

  // One interruption a day, across the whole app. Published guidance puts the ceiling at
  // one or two in-app messages per session; this product spends its budget more slowly
  // than that on purpose, because the customer is not here to be marketed to.
  const alreadyShownToday = Object.values(moments).some((r) => r.lastShownDate === today);

  const candidates = eligibleMoments(input, now)
    .map((id) => ({ cfg: MOMENTS[id], rec: moments[id] ?? emptyMomentRecord() }))
    .filter(({ cfg, rec }) => {
      if (rec.acted) return false;
      // Dismissing something makes it go away now, not tomorrow.
      if (rec.lastDismissedDate === today) return false;

      /* Already today's choice, so it stays today's choice.
         This check has to come before the caps and the cooldown, because rendering a
         moment records its own impression — and without the exemption that record
         immediately trips both the daily budget and the cooldown, and the card vanishes
         from under the person reading it. */
      if (rec.lastShownDate === today) return true;

      if (retired(rec, cfg)) return false;
      if (cooling(rec, cfg, today)) return false;

      // Service moments ignore both the daily budget and the distress suppression. A
      // trial ending is money about to move; staying quiet about it to respect a
      // frequency cap would be the app protecting its own manners at the user's expense.
      if (cfg.kind === 'service') return true;

      if (alreadyShownToday) return false;
      if (suppressed && (cfg.kind === 'commercial' || cfg.kind === 'advocacy')) return false;
      return true;
    })
    .sort((a, b) => b.cfg.priority - a.cfg.priority);

  const win = candidates[0];
  return win ? { id: win.cfg.id, kind: win.cfg.kind } : null;
}

/* ---------- transitions ---------- */

export function markShown(moments: MomentState, id: MomentId, now: Date = new Date()): MomentState {
  const rec = moments[id] ?? emptyMomentRecord();
  // Idempotent within a day: a re-render or a tab switch is not another impression.
  if (rec.lastShownDate === dayKey(now)) return moments;
  return { ...moments, [id]: { ...rec, shows: rec.shows + 1, lastShownDate: dayKey(now) } };
}

export function markDismissed(moments: MomentState, id: MomentId, now: Date = new Date()): MomentState {
  const rec = moments[id] ?? emptyMomentRecord();
  return {
    ...moments,
    [id]: { ...rec, dismissals: rec.dismissals + 1, lastDismissedDate: dayKey(now) },
  };
}

export function markActed(moments: MomentState, id: MomentId): MomentState {
  const rec = moments[id] ?? emptyMomentRecord();
  return { ...moments, [id]: { ...rec, acted: true } };
}
