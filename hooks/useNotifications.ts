import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NOTIFY_COPY } from '../content/copy';
import {
  plan, cancellations, enabled, type NotifySettings, type NotifyKind, type Scheduled,
} from '../lib/notify';
import type { AppState } from '../types';

/* The only file in this app that talks to the notification system.
 *
 * ⚠ LOCAL SCHEDULING ONLY, AND THAT IS AN ENFORCED RULE RATHER THAN AN INTENTION.
 *
 * `expo-notifications` has two halves. `getExpoPushTokenAsync`, `getDevicePushTokenAsync`,
 * `addPushTokenListener` and `registerTaskAsync` register this device with a remote push
 * service: that is a network call, it ships an identifier off the phone, and it would make
 * the sentence on onboarding screen one false. None of them appears anywhere in this
 * repository, and `__tests__/safety.test.mjs` fails the build if one ever does — plus a
 * second, independent check that `app.json` requests no `aps-environment` entitlement,
 * without which remote push cannot function at all even if the source were wrong.
 *
 * What is used is `scheduleNotificationAsync` with a date trigger, which hands iOS a string
 * and a time. No socket, no server, nothing leaves the device. It is an alarm clock.
 *
 * All the DECISIONS live in lib/notify.ts, which is pure and loads under bare Node so the
 * policy is testable without a phone. This file is plumbing: it asks, it schedules, it
 * cancels. If a rule is being decided here, it is in the wrong file. */

/** Notifications arrive while the app is closed; nothing is presented in-app.
 *
 *  An alert appearing over the screen somebody is already using is the app interrupting a
 *  person who is, by definition, already here. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CONTENT: Record<NotifyKind, { title: string; body: string }> = {
  checkin: NOTIFY_COPY.checkin,
  groundwork: NOTIFY_COPY.groundwork,
  'trial-ending': NOTIFY_COPY.trialEnding,
};

/** Web has no notification scheduler in this app, and Expo's web shim throws rather than
 *  no-oping. Every entry point below returns early rather than guarding at call sites —
 *  `scripts/screenshots.mjs` drives the real web build, and a throw on launch there is a
 *  crash screen in every image. */
const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

export interface Notifier {
  /** Ask the OS. Returns whether permission was granted. Never called from onboarding. */
  request: () => Promise<boolean>;
  /** Replace everything queued with what the current state says should be queued. */
  sync: (state: AppState, settings: NotifySettings) => Promise<void>;
  /** Rule 4's second half: pull back what is already queued after a hard day. */
  suppress: (state: AppState) => Promise<void>;
  /** Everything, gone. Used when somebody turns reminders off and on `reset`. */
  clear: () => Promise<void>;
}

export function useNotifications(): Notifier {
  const request = useCallback(async () => {
    if (!SUPPORTED) return false;
    try {
      const existing = await Notifications.getPermissionsAsync();
      /* ⚠ NEVER RE-PROMPT AFTER A NO. `canAskAgain` false means iOS will not show the sheet
         at all, and calling `requestPermissionsAsync` then resolves immediately as denied —
         which would look to this app like a fresh refusal every launch. More to the point,
         a person who said no has answered; asking again is the behaviour that gets a
         mental-health app deleted. */
      if (existing.granted) return true;
      if (!existing.canAskAgain) return false;
      const asked = await Notifications.requestPermissionsAsync();
      return asked.granted;
    } catch {
      /* Fails toward silence. A permissions API that throws must not become a crash on the
         screen after somebody's first session. */
      return false;
    }
  }, []);

  const clear = useCallback(async () => {
    if (!SUPPORTED) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch { /* nothing queued, or no permission — both are the desired end state */ }
  }, []);

  const sync = useCallback(async (state: AppState, settings: NotifySettings) => {
    if (!SUPPORTED) return;
    try {
      /* CANCEL EVERYTHING FIRST, ALWAYS. The alternative is reconciling ids against what the
         OS holds, and a reconciliation that is subtly wrong stacks duplicates — the failure
         mode being three reminders at 9pm, which is the single most deletable thing an app
         of this kind can do. Re-scheduling seven quiet items is cheap. */
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!enabled(settings)) return;

      const items: Scheduled[] = plan(state, settings);
      for (const item of items) {
        const when = new Date(item.at);
        if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: item.id,
          content: { ...CONTENT[item.kind], sound: false },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
      }
    } catch { /* scheduling is best-effort; never let it break a screen */ }
  }, []);

  const suppress = useCallback(async (state: AppState) => {
    if (!SUPPORTED) return;
    const kinds = cancellations(state);
    if (kinds.length === 0) return;
    try {
      /* Cancelled by kind rather than wholesale, because the trial notice is deliberately
         NOT suppressed — see lib/notify.ts. Money about to leave somebody's account is the
         one thing worth saying on a bad day, and staying quiet to be gentle would take it
         without the warning they were promised. */
      const queued = await Notifications.getAllScheduledNotificationsAsync();
      for (const q of queued) {
        const id = q.identifier ?? '';
        if (kinds.some((k) => id.startsWith(k))) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }
    } catch { /* nothing queued */ }
  }, []);

  return { request, sync, suppress, clear };
}
