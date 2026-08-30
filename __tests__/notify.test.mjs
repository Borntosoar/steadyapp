import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KINDS, plan, cancellations, enabled, askOwed, defaultSettings, suggestedTime,
  timeLabel, TIME_CHOICES, SUGGESTED_TIME,
} from '../lib/notify.ts';
import { baseAppState, day } from './helpers/state.mjs';
import { NOTIFY_COPY } from '../content/copy.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Local notifications.
 *
 * This is the only surface in the product that reaches somebody who is not holding the app,
 * which makes it the one place a mistake arrives uninvited, at a time nobody chose, on a lock
 * screen other people can see. Every assertion below is about restraint rather than delivery:
 * what must not fire, what must be pulled back, and what must never be said.
 *
 * The package was BANNED before this — `expo-notifications` sat in the same regex as Sentry
 * and Firebase in __tests__/safety.test.mjs, under a heading about phoning home. That was a
 * category error: local scheduling registers no token and opens no socket. The remote half
 * is still banned and safety.test.mjs now names all four of its calls. */

const on = (over = {}) => ({ ...defaultSettings(), permitted: true, dailyTime: 21 * 60, ...over });

/** A state with the fields these tests care about, over the shared fixture. */
const stateWith = (over = {}) => ({ ...baseAppState(), commitments: [], ...over });

describe('what may fire at all', () => {
  test('the set of kinds is closed, and winback is not in it', () => {
    /* ⚠ THE ONE REFUSAL THAT IS PURE RESTRAINT. Every other rule here protects a person from
       being interrupted badly; this one refuses a re-engagement mechanic outright.
       lib/moments.ts computes a `winback` at ten days absent and it stays in-app. Chasing
       somebody who stopped opening an app about appearance worry assumes they stopped for a
       reason the app can fix. They may have stopped BECAUSE it was making things worse, and
       a notification then is the app inserting itself back into a life that removed it.
       Asserted rather than commented, because this is the exact rule that gets relaxed by
       somebody reading a retention report. */
    assert.deepEqual([...KINDS].sort(), ['checkin', 'groundwork', 'trial-ending']);
    assert.ok(!KINDS.includes('winback'), 'a winback notification has been added');
    assert.ok(!KINDS.includes('streak'), 'a streak notification has been added');
  });

  test('nothing is scheduled without permission', () => {
    assert.deepEqual(plan(stateWith(), { ...on(), permitted: false }), []);
    assert.equal(enabled({ ...on(), permitted: false }), false);
  });

  test('nothing is scheduled when the person picked no time and no follow-up', () => {
    const none = { ...on(), dailyTime: null, groundwork: false };
    assert.equal(enabled(none), false);
    assert.deepEqual(plan(stateWith(), none), []);
  });

  test('"none" is a real answer that survives, not an absence of one', () => {
    /* `dailyTime: null` is the default AND the decline. If a future refactor makes null mean
       "not asked yet" and substitutes a default time, somebody who explicitly said no starts
       being messaged. The `askedAt` stamp is what distinguishes the two states. */
    const declined = { ...defaultSettings(), askedAt: day(0) };
    assert.equal(declined.dailyTime, null);
    assert.equal(enabled(declined), false);
    assert.equal(askOwed(stateWith(), declined), false, 'the ask returned after a decline');
  });
});

describe('the daily reminder', () => {
  test('it is scheduled for the days ahead, at the chosen time', () => {
    const items = plan(stateWith({ checkIns: [] }), on(), new Date('2026-03-02T09:00:00'));
    const daily = items.filter((i) => i.kind === 'checkin');
    assert.ok(daily.length >= 5, `only ${daily.length} daily reminders planned`);
    for (const d of daily) {
      const when = new Date(d.at);
      assert.equal(when.getHours(), 21, 'a reminder is not at the chosen hour');
    }
  });

  test('nothing is ever scheduled in the past', () => {
    /* An expired trigger is not merely useless — expo-notifications rejects it, and one
       rejection inside a batch can take the rest of the batch with it. */
    const now = new Date('2026-03-02T23:30:00');
    for (const item of plan(stateWith({ checkIns: [] }), on(), now)) {
      assert.ok(new Date(item.at).getTime() > now.getTime(), `${item.id} is in the past`);
    }
  });

  test('today is skipped once they have already checked in', () => {
    /* Otherwise the app reminds somebody at 9pm to do a thing they did at 8pm, which is the
       single most obviously-broken notification a habit app can send. */
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    const today = day(0);
    const withCheckIn = stateWith({ checkIns: [{ id: 'c', date: today, suds: 3, avoidance: 'none', preoccupationMinutes: 60, urge: 3 }] });
    const ids = plan(withCheckIn, on(), now).map((i) => i.id);
    assert.ok(!ids.includes(`checkin-${today}`), 'it reminded somebody who had already checked in');
  });

  test('ids are stable per kind and day, so re-planning replaces rather than stacks', () => {
    /* Three reminders at 9pm is the most deletable thing an app of this kind can do. */
    const now = new Date('2026-03-02T09:00:00');
    const a = plan(stateWith({ checkIns: [] }), on(), now).map((i) => i.id);
    const b = plan(stateWith({ checkIns: [] }), on(), now).map((i) => i.id);
    assert.deepEqual(a, b);
    assert.equal(new Set(a).size, a.length, 'the plan contains duplicate ids');
  });
});

describe('distress suppression, both halves', () => {
  /* ⚠ TWO HALVES, AND THE SECOND IS THE ONE THAT WOULD BE FORGOTTEN.
     A notification is handed to the OS ahead of time and fires while the app is closed. So
     refusing to SCHEDULE on a bad day only covers somebody who was already having one when
     the planner last ran. A person who was fine this morning, queued a 9pm reminder, then
     recorded a hard day at six has one sitting in the OS with nothing to stop it. */

  const hardDayToday = () => stateWith({
    checkIns: [],
    practice: [{ id: 'hd', date: day(0), kind: 'hard-day' }],
  });

  test('half one: nothing new is scheduled after a hard day', () => {
    const items = plan(hardDayToday(), on());
    assert.deepEqual(items.filter((i) => i.kind === 'checkin'), []);
    assert.deepEqual(items.filter((i) => i.kind === 'groundwork'), []);
  });

  test('half two: what is already queued is pulled back', () => {
    assert.deepEqual(cancellations(hardDayToday()).sort(), ['checkin', 'groundwork']);
  });

  test('a high distress rating counts, not only a hard-day tap', () => {
    const s = stateWith({
      practice: [],
      checkIns: [{ id: 'c', date: day(0), suds: 9, avoidance: 'none', preoccupationMinutes: 90, urge: 5 }],
    });
    assert.deepEqual(cancellations(s).sort(), ['checkin', 'groundwork']);
  });

  test('an ordinary day cancels nothing', () => {
    assert.deepEqual(cancellations(stateWith({ practice: [] })), []);
  });

  test('the trial notice is never cancelled, and that is deliberate', () => {
    /* The one exception, and it is not an oversight. A person is about to be charged. Staying
       quiet to be gentle takes money from somebody having a bad week without the warning the
       paywall promised them in writing, which is the worse harm — the same reasoning
       MOMENTS['trial-ending'] already uses for maxDismissals: 0. */
    assert.ok(!cancellations(hardDayToday()).includes('trial-ending'));
  });

  test('and it is still scheduled on a hard day', () => {
    const now = new Date();
    const ends = new Date(now);
    ends.setDate(ends.getDate() + 2);
    const s = hardDayToday();
    s.entitlement = { source: 'trial', plan: 'yearly', expiresAt: ends.toISOString(), verifiedAt: null };
    const kinds = plan(s, on(), now).map((i) => i.kind);
    assert.ok(kinds.includes('trial-ending'), 'the promised billing warning was suppressed');
  });
});

describe('the Groundwork follow-up', () => {
  const withCommitment = () => stateWith({
    checkIns: [],
    practice: [],
    commitments: [{ id: 'k1', date: day(0), action: 'Put the bins out', size: 'small' }],
  });

  test('it fires for a commitment made today and not yet answered', () => {
    /* content/groundwork.ts states in its own header that the second half is the part that
       matters and it happens tomorrow. Until now that only happened if somebody independently
       reopened the game — the app promised something in writing it could not deliver. */
    const ids = plan(withCommitment(), on()).map((i) => i.id);
    assert.ok(ids.includes('groundwork-k1'));
  });

  test('it does not fire once the person has answered', () => {
    const s = withCommitment();
    s.commitments[0].kept = 'happened';
    assert.deepEqual(plan(s, on()).filter((i) => i.kind === 'groundwork'), []);
  });

  test('it does not fire for a commitment from weeks ago', () => {
    /* An unanswered commitment from three weeks back is not a follow-up, it is the app
       raising a day the person has forgotten. */
    const s = withCommitment();
    s.commitments[0].date = day(21);
    assert.deepEqual(plan(s, on()).filter((i) => i.kind === 'groundwork'), []);
  });

  test('it can be turned off on its own', () => {
    assert.deepEqual(
      plan(withCommitment(), { ...on(), groundwork: false }).filter((i) => i.kind === 'groundwork'),
      [],
    );
  });
});

describe('the ask is offered once, after something has been finished', () => {
  test('not before a single practice day', () => {
    /* Rule 6. The OS permission can be spent once, and asking at install asks somebody to
       agree to be interrupted later by a thing they have not used. */
    assert.equal(askOwed(stateWith({ practice: [] }), defaultSettings()), false);
  });

  test('once one day is done', () => {
    assert.equal(askOwed(stateWith(), defaultSettings()), true);
  });

  test('never again once it has been put', () => {
    assert.equal(askOwed(stateWith(), { ...defaultSettings(), askedAt: day(0) }), false);
  });

  test('and never during onboarding', () => {
    /* Checked in the source rather than in the model, because the failure is a route being
       added to the onboarding flow, which no unit test would see. */
    const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = join(dir, e.name);
      return e.isDirectory() ? walk(full) : [full];
    });
    const onboarding = walk(join(ROOT, 'app/onboarding'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(?<!:)\/\/.*$/gm, '');
    assert.doesNotMatch(onboarding, /\/reminders|useNotifications|expo-notifications/,
      'onboarding asks for notification permission, which burns it before anybody can answer');
  });
});

describe('the survey finally configures something', () => {
  test('every "when is it worst" answer has a suggested time', () => {
    /* This is the first real consumer of survey question three — `FEATURED_CALM` and
       `calmFor` had one line between them, so a question asked at first open configured
       almost nothing. */
    for (const key of Object.keys(SUGGESTED_TIME)) {
      const m = suggestedTime(key);
      assert.ok(Number.isInteger(m) && m >= 0 && m < 24 * 60, `${key} maps to ${m}`);
    }
  });

  test('an unknown or hostile answer falls back rather than throwing', () => {
    /* `worst` comes off disk through a permissive string reader. `constructor` and
       `__proto__` are the two that turn a plain object index into a function or a prototype,
       and `??` catches neither because neither is nullish — the same guard lib/plan.ts's
       `calmFor` carries, for the same reason. */
    for (const bad of [undefined, null, '', 'nonsense', 'constructor', '__proto__', 'toString']) {
      const m = suggestedTime(bad);
      assert.equal(typeof m, 'number', `suggestedTime(${String(bad)}) returned a non-number`);
      assert.ok(m >= 0 && m < 24 * 60);
    }
  });

  test('every offered time is a real minute of a real day', () => {
    for (const m of TIME_CHOICES) {
      assert.ok(Number.isInteger(m) && m >= 0 && m < 24 * 60);
      assert.match(timeLabel(m), /^\d{2}:\d{2}$/);
    }
  });
});

describe('what a notification is allowed to say', () => {
  /* content/copy.ts is already walked by __tests__/copy.test.mjs for shaming language,
     appearance references and exclamation marks, and by readability.test.mjs for reading
     level. These are the rules SPECIFIC to a lock screen, which those suites do not know
     about: a notification is read by somebody who did not open anything, possibly in front
     of other people, and it cannot be dismissed by scrolling past. */

  /** ⚠ ONLY THE STRINGS THAT REACH A LOCK SCREEN, and the scoping is the correction.
   *
   *  The first version walked all of NOTIFY_COPY, including `ask` and `settings`, which are
   *  ordinary in-app screens. It failed immediately — on the sentence "No counts, no streaks,
   *  and nothing at all on a hard day", which is the app PROMISING the thing the guard
   *  forbids. A guard that cannot tell a promise from a violation is one people learn to
   *  route around, and this file already documents that failure happening three times
   *  elsewhere.
   *  `ask` and `settings` are covered by __tests__/copy.test.mjs and readability.test.mjs
   *  like every other screen. What is special about the three below is only that they arrive
   *  uninvited, at a time nobody chose, where somebody else may read them. */
  const LOCK_SCREEN = [NOTIFY_COPY.checkin, NOTIFY_COPY.groundwork, NOTIFY_COPY.trialEnding];

  const strings = () => LOCK_SCREEN.flatMap((c) => [c.title, c.body]);

  test('no notification contains a count, a streak or a day number', () => {
    /* A number on a lock screen is a scoreboard read by somebody who did not ask for one, and
       the running streak was removed from Today for precisely this reason. */
    for (const s of strings()) {
      assert.doesNotMatch(s, /\b\d+\b/, `"${s}" puts a number on a lock screen`);
      assert.doesNotMatch(s, /streak|in a row|day \d|keep it going|don't break/i, `"${s}"`);
    }
  });

  test('no notification refers to appearance, a body, or how somebody looks', () => {
    /* SAFETY.md §2. The worst possible place for this app to mention appearance is a phone
       screen somebody else might be looking at. */
    for (const s of strings()) {
      assert.doesNotMatch(s, /\b(look|looks|looking|appearance|body|mirror|face|weight|photo)\b/i, `"${s}"`);
    }
  });

  test('nothing sells except the one notice about money already promised', () => {
    /* SAFETY.md §12 keeps billing away from the safety surfaces, and an uninvited
       notification is a surface. The trial notice is the single exception and it exists
       because app/paywall.tsx promises it in writing. */
    const commercial = /upgrade|subscribe|Anneal\+|unlock|offer|discount|save \d/i;
    for (const [key, group] of Object.entries(NOTIFY_COPY)) {
      if (key === 'trialEnding') continue;
      const text = JSON.stringify(group);
      assert.doesNotMatch(text, commercial, `NOTIFY_COPY.${key} sells something`);
    }
  });

  test('the billing notice says what will happen and how to stop it', () => {
    const text = `${NOTIFY_COPY.trialEnding.title} ${NOTIFY_COPY.trialEnding.body}`;
    assert.match(text, /charg/i, 'it does not say a charge is coming');
    assert.match(text, /cancel/i, 'it does not say how to stop it');
  });

  test('the decline is worded as an answer, not as a delay', () => {
    /* "Maybe later" is a delay dressed as a choice, and it is how a screen implies the
       decline was the wrong pick. */
    assert.doesNotMatch(NOTIFY_COPY.ask.decline, /later|not now|maybe/i);
  });

  test('every kind that can fire has copy', () => {
    /* Derived from KINDS. A kind added without copy schedules a notification with an empty
       title, which is a blank grey box on somebody's lock screen. */
    const byKind = { checkin: NOTIFY_COPY.checkin, groundwork: NOTIFY_COPY.groundwork, 'trial-ending': NOTIFY_COPY.trialEnding };
    for (const k of KINDS) {
      assert.ok(byKind[k], `${k} can be scheduled and has no copy`);
      assert.ok(byKind[k].title?.length > 0 && byKind[k].body?.length > 0, `${k} copy is incomplete`);
    }
  });
});

describe('the planner is total', () => {
  test('a partial state never throws', () => {
    /* Called on launch against a state assembled from disk, on installs older than fields
       that now exist. lib/measure.ts's `completed()` makes the argument: an absent history is
       an empty history, and that is a different thing from a crash on the launch screen.
       This is also the exact failure that shipped once already, in lib/moments.ts. */
    const full = stateWith();
    for (const field of Object.keys(full)) {
      const partial = { ...full };
      delete partial[field];
      assert.doesNotThrow(() => plan(partial, on()), `plan() throws without "${field}"`);
      assert.doesNotThrow(() => cancellations(partial), `cancellations() throws without "${field}"`);
    }
    assert.doesNotThrow(() => plan({}, on()), 'an empty state throws');
    assert.doesNotThrow(() => cancellations({}), 'an empty state throws');
  });
});
