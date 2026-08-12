import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { H2, BodySm, Caption, useTheme } from './ui';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { MOMENT_COPY } from '../content/copy.ts';
import { computeReclaimed, checkInsInLastDays, previousWeekCheckIns } from '../lib/reclaimed';
import * as StoreReview from 'expo-store-review';
import { daysUntilExpiry, RENEWAL_TERMS } from '../lib/entitlement';
import { countOf } from '../content/names.ts';
import type { Moment } from '../lib/moments';

/* The one place an unprompted message renders.
 *
 * Which moment (if any) appears is decided in lib/moments.ts; this only draws it. Keeping
 * the decision and the drawing apart is what stops a screen quietly growing its own
 * prompt, which is how apps end up showing three at once without anybody choosing that.
 *
 * Every moment carries a dismiss at the same visual weight as the action, labelled with
 * what it does. Dismissal is recorded and it is an answer: it doubles the wait, and after
 * the configured limit that moment never appears again. */

const ROUTES: Record<string, string> = {
  'week-one-ask': '/paywall',
  'trial-ending': '/paywall',
  winback: '/checkin',
  plateau: '/learn',
  'month-two-proof': '/progress',
  'rate-app': '/progress',
};

/** The trial notice fires on each of the last three days and used to say "Two days left"
 *  on all of them. A warning that is wrong about when is not much of a warning. */
function trialEndingTitle(daysLeft: number): string {
  if (daysLeft <= 0) return 'Your free month ends today';
  if (daysLeft === 1) return 'One day left of the free month';
  return `${daysLeft} days left of the free month`;
}

export function MomentCard({ moment }: { moment: Moment }) {
  const c = useTheme();
  const router = useRouter();
  const copy = MOMENT_COPY[moment.id];
  const momentShown = useStore((s) => s.momentShown);
  const momentDismissed = useStore((s) => s.momentDismissed);
  const momentActed = useStore((s) => s.momentActed);

  // Recorded on render, not on tap: an impression the user scrolled past is still an
  // impression, and it is the thing the daily budget is counting.
  useEffect(() => {
    momentShown(moment.id);
  }, [moment.id, momentShown]);

  const commercial = moment.kind === 'commercial';

  /* The one commercial moment leads into the paywall, and like the paywall it used to make
     its case without showing the figure the case rests on. The number goes on the card, in
     the user's own data, ahead of any mention of what weeks two to twelve contain. */
  const baseline = useStore((s) => s.baseline);
  const checkIns = useStore((s) => s.checkIns);
  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );
  const showFigure =
    moment.id === 'week-one-ask' &&
    reclaimed.hasData &&
    reclaimed.sampleSize >= 3 &&
    reclaimed.hours > 0;

  /* ---------- the trial-ending card, which is personalised differently on purpose ----------
   *
   * docs/SUBSCRIPTION-BENCHMARKS.md §6.2 says to extend the reclaimed-hours figure to this
   * card as well as the ask. It should not be, and the reason is the gate three lines above:
   * `reclaimed.hours > 0`. On the ask that gate is fine — an ask with nothing good to say
   * falls back to a headline and asks anyway. On this card it would mean the app shows the
   * customer their number when it flatters and hides it when it does not, in the one frame
   * that exists to tell them money is about to leave their account. Selective evidence at
   * the renewal decision is the dark pattern, and it is worse for being built out of true
   * data.
   *
   * So this card is personalised with what the person DID rather than what it produced.
   * Days practised and urges sat through are counts of their own actions: they only go up,
   * they cannot come back negative on a bad fortnight, and they are the same reshaping the
   * week strip already uses instead of a streak (SAFETY.md §3). It is a weaker hook than a
   * hero number and it is the honest one.
   *
   * The renewal sentence carries the real amount and cadence, because a notice that says
   * "before it renews" without saying into what is not the warning the paywall promised. */
  const entitlement = useStore((s) => s.entitlement);
  const practice = useStore((s) => s.practice);
  const urgeLogs = useStore((s) => s.urgeLogs);

  const trialEnding = moment.id === 'trial-ending';
  const daysLeft = trialEnding ? daysUntilExpiry(entitlement) : null;
  const practiceDays = trialEnding ? new Set(practice.map((p) => p.date)).size : 0;
  const resisted = trialEnding ? urgeLogs.filter((u) => u.resisted).length : 0;

  const title = trialEnding && daysLeft !== null ? trialEndingTitle(daysLeft) : copy.title;

  /* Nothing at all rather than "0 days of practice". Somebody who let the month go by
     unused does not need the app to itemise that at them on the way out — they need the
     amount and the cancel route, which the body carries either way. */
  const record =
    trialEnding && practiceDays > 0
      ? resisted > 0
        ? `${practiceDays} days of practice so far, and ${countOf('urge', resisted)}.`
        : `${practiceDays} days of practice so far.`
      : null;

  const renewal =
    trialEnding && entitlement.plan ? `After that: ${RENEWAL_TERMS[entitlement.plan]}.` : null;

  return (
    <View
      style={{
        borderRadius: radius.card,
        borderWidth: commercial ? 1 : StyleSheet.hairlineWidth,
        borderColor: commercial ? c.accent : c.lineStrong,
        backgroundColor: commercial ? c.accentDim : c.surface,
        padding: space.lg,
      }}
    >
      <Caption style={{ color: commercial ? c.accentDeep : c.inkFaint }}>{copy.eyebrow}</Caption>
      {showFigure ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: space.xs }}>
          <Text style={[t.hero, { color: c.ink, fontSize: 44, lineHeight: 48 }]}>
            {Math.abs(reclaimed.hours)}
          </Text>
          <Text style={[t.h2, { color: c.inkSoft }]}>hours back</Text>
        </View>
      ) : (
        <H2 style={{ marginTop: space.xs }}>{title}</H2>
      )}
      {record ? <BodySm style={{ marginTop: space.xs, color: c.accentDeep }}>{record}</BodySm> : null}
      <BodySm style={{ marginTop: space.sm, color: c.ink }}>
        {renewal ? `${renewal} ` : ''}
        {copy.body}
      </BodySm>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, marginTop: space.lg }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.action}
          onPress={() => {
            momentActed(moment.id);
            if (moment.id === 'rate-app') {
              /* This branch used to `return` and nothing else — so the button read "Write a
                 review ›" and did literally nothing when tapped. A dead control is worse
                 than an absent one: the person concluded the app was broken at the exact
                 moment they were feeling well enough about it to say so publicly.
                 iOS caps the native prompt at three a year per user, which is why this
                 moment fires once, after something has demonstrably gone well, and never
                 during a bad stretch — a prompt spent on somebody mid bad week is one of
                 three gone. Guarded by isAvailableAsync so an unavailable prompt is a quiet
                 no-op rather than a crash. */
              void StoreReview.isAvailableAsync()
                .then((ok) => (ok ? StoreReview.requestReview() : undefined))
                .catch(() => {});
              return;
            }
            router.push(ROUTES[moment.id] ?? '/');
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingVertical: space.xs })}
        >
          <Text style={[t.label, { color: c.accentDeep }]}>{copy.action} ›</Text>
        </Pressable>

        {/* Same weight class as the action, and it says what it does. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.dismiss}
          onPress={() => momentDismissed(moment.id)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingVertical: space.xs })}
        >
          <Text style={[t.label, { color: c.inkSoft }]}>{copy.dismiss}</Text>
        </Pressable>
      </View>
    </View>
  );
}
