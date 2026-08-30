import type { AppState, Commitment } from '../types';
import { dayKey } from './streak.ts';
import { distressRecently } from './moments.ts';
import { daysUntilExpiry } from './entitlement.ts';

/* Local notifications — the policy half.
 *
 * Pure. No React, no expo-notifications, no store. lib/ stays loadable under bare Node so
 * every decision below can be exercised without a phone, and `hooks/useNotifications.ts` is
 * the only thing that talks to the OS.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS AT ALL, AND WHY IT DID NOT
 *
 * `expo-notifications` was on the BANNED dependency list in __tests__/safety.test.mjs, in
 * the same regular expression as Sentry, Firebase, Amplitude and AppsFlyer, under a heading
 * about dependencies that phone home. That is a category error, and it cost this product its
 * entire ability to reach anybody.
 *
 * The package has two halves. `getExpoPushTokenAsync` and its siblings register the device
 * with a remote push service; that half really does phone home, and it stays banned — the
 * allowlist entry names all four calls and a test asserts none of them appears anywhere in
 * the source, plus a second test that `app.json` requests no `aps-environment` entitlement,
 * because remote push cannot function without one. LOCAL scheduling opens no socket and
 * sends nothing anywhere: the app hands iOS a string and a time, and iOS shows it. It is an
 * alarm clock. Nothing about it touches the promise on onboarding screen one.
 *
 * What the ban cost, precisely:
 *   · `lib/moments.ts` computes a `winback` for somebody ten days absent, and every moment
 *     renders inside a mounted screen — so the winback could only fire once the person had
 *     already come back. A re-engagement system that requires re-engagement.
 *   · `app/paywall.tsx` promises a warning before the free month ends and then apologises,
 *     in a comment, that "somebody who does not open Anneal during that week is not reminded
 *     at all … a promise the app keeps only for people who happened to show up is the kind
 *     of small untruth this whole screen exists not to tell."
 *   · `content/groundwork.ts` states that "THE SECOND HALF IS THE PART THAT MATTERS AND IT
 *     HAPPENS TOMORROW", and nothing carried the day to tomorrow.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * THE RULES, AND THEY ARE STRICTER THAN THE CATEGORY'S
 *
 * A notification to somebody with body dysmorphia, at 9pm, is not a neutral object. So:
 *
 *   1. THREE KINDS FIRE AND NOTHING ELSE. The daily check-in, the Groundwork follow-up the
 *      game already promised in writing, and the trial-ending notice the paywall already
 *      promised in writing. Two of the three exist to make an existing promise true rather
 *      than to add a new demand.
 *   2. NOTHING COMMERCIAL EXCEPT THE TRIAL NOTICE, which is money about to leave somebody's
 *      account. SAFETY.md §12 keeps billing off the safety surfaces, and an uninvited
 *      notification is a surface.
 *   3. NO STREAK, NO COUNT, NO MISSED DAYS. `returningCopy()` in lib/streak.ts is the model:
 *      forward-looking, and it never accounts for time away. Enforced by putting every
 *      string in content/copy.ts, where __tests__/copy.test.mjs already greps the whole
 *      export for shaming language, appearance references and exclamation marks.
 *   4. NOTHING WITHIN A DAY OF DISTRESS — and this is the one non-obvious requirement.
 *      A notification is scheduled AHEAD and fires while the app is closed, so suppressing
 *      at schedule time is not enough: a hard day recorded this evening has to CANCEL what
 *      was already queued. `cancellations()` below is that half, and it is the half that
 *      would be forgotten.
 *   5. NO WINBACK. `lib/moments.ts` has one and it stays in-app. Chasing somebody who
 *      stopped opening an app about appearance worry assumes they stopped for a reason the
 *      app can fix; they may have stopped BECAUSE it was making things worse. This is the
 *      one place the ordinary growth playbook is refused outright, and it is refused here in
 *      code rather than left to a future decision — `KINDS` is closed and `winback` is not
 *      in it.
 *   6. THE OS PROMPT IS NEVER SHOWN DURING ONBOARDING. It is offered after a first completed
 *      session, when somebody has a basis to answer. Asking at install is how apps burn the
 *      permission permanently, and it also asks a person to agree to be contacted by
 *      something they have not yet used.
 *   7. "NONE" IS A FIRST-CLASS ANSWER, at the same weight as a time. And a denied OS
 *      permission is never asked about again, in the OS or in the app. */

/** The only notifications this app will ever schedule. Closed on purpose — see rule 5. */
export const KINDS = ['checkin', 'groundwork', 'trial-ending'] as const;
export type NotifyKind = (typeof KINDS)[number];

export interface Scheduled {
  kind: NotifyKind;
  /** Local time to fire, as ISO. The wrapper converts to a platform trigger. */
  at: string;
  /** Stable per kind and per day, so re-running the planner replaces rather than stacks. */
  id: string;
}

/** What the person chose. `time` is minutes past local midnight; null means none at all. */
export interface NotifySettings {
  /** null is a real answer and the default until they pick one. */
  dailyTime: number | null;
  groundwork: boolean;
  /** False once the OS has said no. Never re-prompted — rule 7. */
  permitted: boolean;
  /** ISO. Set when the ask has been shown, so it is shown once. */
  askedAt: string | null;
}

export const defaultSettings = (): NotifySettings => ({
  dailyTime: null,
  groundwork: true,
  permitted: false,
  askedAt: null,
});

/** Suggested reminder time, in minutes past midnight, from survey question three.
 *
 *  THIS IS THE FIRST REAL USE OF THAT QUESTION. `FEATURED_CALM` and `calmFor` had one
 *  consumer between them — a single line on the result screen — so a question asked at first
 *  open configured almost nothing. It picks a suggestion only: the picker opens here and the
 *  person moves it, and a suggestion nobody accepts costs nothing.
 *
 *  The times are chosen to land BEFORE the answer rather than during it. Somebody who said
 *  the evening is worst is reminded at six, while there is still an evening to spend
 *  differently — not at ten, when the only thing left to do about it is feel bad. */
export const SUGGESTED_TIME: Record<string, number> = {
  night: 21 * 60,
  waking: 8 * 60,
  people: 18 * 60,
  anytime: 19 * 60,
};

export function suggestedTime(worst: string | undefined | null): number {
  const k = worst ?? '';
  /* Own-property only, for the reason lib/plan.ts's `calmFor` gives at length: this indexes
     a plain object with a string that came off disk, and `worst: 'constructor'` would
     otherwise return a function where a number is expected. */
  return Object.prototype.hasOwnProperty.call(SUGGESTED_TIME, k) ? SUGGESTED_TIME[k] : 19 * 60;
}

/* ---------- when the ask may be shown ---------- */

/** Has this person finished something? One completed practice day is the bar.
 *
 *  Rule 6. Deliberately not "opened the app": the ask is for permission to interrupt
 *  somebody later, and the only honest moment to make it is after they have had one
 *  experience worth being interrupted for. */
export function askOwed(state: AppState, settings: NotifySettings): boolean {
  if (settings.askedAt) return false;
  if (settings.permitted) return false;
  const days = new Set((state.practice ?? []).map((p) => p.date)).size;
  return days >= 1;
}

/* ---------- the plan ---------- */

const at = (day: Date, minutes: number): Date => {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
};

/** Everything that should currently be queued, for the next `days` days.
 *
 *  Total, and returns [] rather than throwing on any absent field — this is called on launch
 *  against a state assembled from disk, and lib/measure.ts's `completed()` makes the argument
 *  for why that matters on the screen somebody opens at 2am. */
export function plan(
  state: AppState,
  settings: NotifySettings,
  now: Date = new Date(),
  days = 7,
): Scheduled[] {
  if (!settings.permitted) return [];

  const out: Scheduled[] = [];
  const today = dayKey(now);

  /* RULE 4, THE SCHEDULE-TIME HALF. The cancel-time half is `cancellations()`; both are
     needed and only having this one is the bug. */
  const hardDays = (state.practice ?? []).filter((p) => p.kind === 'hard-day').map((p) => p.date);
  const distressed = distressRecently(state.checkIns ?? [], hardDays, now);

  /* ---------- the daily check-in ----------
   *
   * The most valuable of the three, and not for habit reasons. `lib/reclaimed.ts` needs at
   * least MIN_SAMPLE check-ins inside a ROLLING SEVEN DAYS or the hours figure stops being
   * stated at all — so a five-day gap deletes the product's headline number from the home
   * screen. This notification defends the one number the whole app is built on. */
  if (settings.dailyTime !== null && !distressed) {
    for (let i = 0; i < days; i += 1) {
      const day = new Date(now);
      day.setDate(day.getDate() + i);
      const when = at(day, settings.dailyTime);
      /* Never in the past — today's slot may already have gone. */
      if (when.getTime() <= now.getTime()) continue;
      /* Not if they have already checked in today. The wrapper re-plans after every
         check-in, so this clears the same evening rather than the next morning. */
      if (i === 0 && (state.checkIns ?? []).some((c) => c.date === today)) continue;
      out.push({ kind: 'checkin', at: when.toISOString(), id: `checkin-${dayKey(when)}` });
    }
  }

  /* ---------- the Groundwork follow-up ----------
   *
   * content/groundwork.ts says in its own header that the second half is the part that
   * matters and it happens tomorrow. Until now that only happened if somebody independently
   * reopened the game. This is the only notification in the app that the product had already
   * committed to in writing and could not deliver.
   *
   * ⚠ IT FIRES AT THEIR DAILY TIME, NOT AT THE SLOT THEY CHOSE, and that is a limitation
   * rather than a preference. `Commitment` in types/index.ts stores id, date, action, size
   * and the answer — it does not persist which of Groundwork's three time-of-day slots the
   * action was laid into. Firing at a plausible-looking hour would be the app pretending to
   * know something it did not store, so it uses the time the person actually picked, and
   * falls back to early evening when they picked none.
   * Persisting the slot is a storage migration and a decision about whether that field is
   * worth keeping about somebody; it is not something to slip in here. */
  if (settings.groundwork && !distressed) {
    for (const c of pendingCommitments(state, now)) {
      const day = new Date(now);
      day.setDate(day.getDate() + 1);
      const when = at(day, settings.dailyTime ?? 19 * 60);
      out.push({ kind: 'groundwork', at: when.toISOString(), id: `groundwork-${c.id}` });
    }
  }

  /* ---------- the trial ending ----------
   *
   * RULE 2's single exception, and it is the app keeping its word rather than selling.
   * `app/paywall.tsx` promises this warning in writing and then apologises in a comment for
   * only being able to keep the promise for people who happen to open the app that week.
   *
   * NOT suppressed by distress, deliberately, and it is the one thing here that is not. A
   * person is about to be charged. Staying quiet to be gentle would take money from somebody
   * having a bad week without the warning they were promised, which is the worse harm and is
   * the same reasoning MOMENTS['trial-ending'] already uses for maxDismissals: 0. */
  const left = state.entitlement ? daysUntilExpiry(state.entitlement, now) : null;
  if (state.entitlement?.source === 'trial' && left !== null && left >= 1 && left <= 2) {
    const day = new Date(now);
    day.setDate(day.getDate() + Math.max(0, left - 1));
    /* Late morning: a decision about money is better made awake and not at bedtime. */
    const when = at(day, 11 * 60);
    if (when.getTime() > now.getTime()) {
      out.push({ kind: 'trial-ending', at: when.toISOString(), id: `trial-${dayKey(when)}` });
    }
  }

  return out;
}

/** Groundwork actions laid out today and not yet answered.
 *
 *  `kept` is the answer field — set once the person says what became of it — so an unset
 *  `kept` is the whole condition. Scoped to today so a commitment somebody never answered
 *  three weeks ago does not produce a notification about a day they have forgotten. */
function pendingCommitments(state: AppState, now: Date): Commitment[] {
  const today = dayKey(now);
  return (state.commitments ?? []).filter((c) => c.kept == null && c.date === today);
}

/* ---------- rule 4, the half that would be forgotten ---------- */

/** True when everything queued must be pulled back.
 *
 *  ⚠ THIS IS NOT THE SAME CHECK AS THE ONE IN `plan`, AND THAT IS THE ENTIRE POINT.
 *
 *  A notification is handed to the OS ahead of time and fires while the app is closed. So
 *  suppressing at schedule time only covers a person who was already having a bad day when
 *  the planner last ran. Somebody who was fine this morning, queued a 9pm reminder, and then
 *  recorded a hard day at six has a notification sitting in the OS with nothing to stop it.
 *
 *  Checking in is the moment the app learns about a bad day, so the wrapper calls this after
 *  every check-in and every hard-day tap, and drops what is queued.
 *
 *  The trial notice survives, for the reason given above: it is money leaving an account. */
export function cancellations(
  state: AppState,
  now: Date = new Date(),
): NotifyKind[] {
  const hardDays = (state.practice ?? []).filter((p) => p.kind === 'hard-day').map((p) => p.date);
  if (!distressRecently(state.checkIns ?? [], hardDays, now)) return [];
  return ['checkin', 'groundwork'];
}

/** Should anything be scheduled at all? False for an entitled-but-lapsed person too — this
 *  is about permission and preference, never about billing. Kept as its own predicate so the
 *  wrapper has one thing to ask. */
export const enabled = (s: NotifySettings): boolean =>
  s.permitted && (s.dailyTime !== null || s.groundwork);

/** Minutes past midnight, as the picker shows it. Local, 24-hour, zero-padded. */
export function timeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** The times offered. Coarse on purpose: a picker with 1,440 options is a settings screen,
 *  and the difference between 18:00 and 18:15 is not a difference anybody can feel. */
export const TIME_CHOICES = [8 * 60, 12 * 60, 18 * 60, 21 * 60];
