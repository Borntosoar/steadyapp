import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/* Touch feedback.
 *
 * Lives in hooks/ rather than lib/ for the same reason useEntitlement does: it imports
 * `Platform` from react-native, and lib/ is required to stay loadable under bare Node so
 * the test suite can import it directly. __tests__/safety.test.mjs enforces that rule, and
 * it caught this file on the first run — which is exactly what it is there for.
 *
 * expo-haptics has been a dependency of this project since the first commit and was called
 * from nowhere. That is a real miss: on iOS the Taptic Engine is most of what separates an
 * app that feels made from an app that feels like a web page, and it costs nothing.
 *
 * IT IS ALSO THE EASIEST THING TO GET WRONG IN AN APP FOR ANXIOUS PEOPLE. A phone that
 * buzzes at somebody is a phone demanding attention, and demanding attention is what this
 * app spends its whole design budget not doing. So the policy is narrow and it is enforced
 * here rather than left to each call site:
 *
 *   1. Feedback marks something the USER completed. Never something the app wants.
 *   2. Nothing on the calm-down path, the hard-day path, or crisis support. Somebody who
 *      opened those does not need their phone tapping them. `guarded` below is how that is
 *      kept true even if a shared component starts firing one.
 *   3. No warning or error styles, ever. This app does not have a register in which it
 *      tells somebody they got something wrong, and a buzz is that register.
 *   4. Light by default. `Heavy` and `Success` are reserved for things that happen a
 *      handful of times in twelve weeks.
 *
 * Everything is fire-and-forget and every call is swallowed. A device without a Taptic
 * Engine, a simulator, or a user who has turned system haptics off must never produce a
 * rejected promise in a flow somebody is halfway through. */

const on = Platform.OS === 'ios' || Platform.OS === 'android';

/** Set while an immersive calming scene is on screen. See rule 2. */
let quiet = false;

/** Wrap the calm-down and hard-day scenes in this. Nothing taps while it is true. */
export function setQuietZone(v: boolean) {
  quiet = v;
}

function fire(fn: () => Promise<void>) {
  if (!on || quiet) return;
  fn().catch(() => {
    /* No Taptic Engine, or the user turned it off. Not a failure worth surfacing. */
  });
}

export const haptic = {
  /** Picking one of a set: a face, a level, an option. The most common one by far. */
  select: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** A step of something multi-step just completed and the screen is about to move. */
  advance: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** Written down and kept: a check-in saved, an urge logged, a plan stored. The moment
   *  the app's record of somebody's effort actually changed. */
  commit: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  /** Seven, thirty, a hundred days. A handful of times in the life of the app. */
  milestone: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};
