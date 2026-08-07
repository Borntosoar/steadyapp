import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { H2, BodySm, Caption, useTheme } from './ui';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { MOMENT_COPY } from '../content/copy.ts';
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
      <H2 style={{ marginTop: space.xs }}>{copy.title}</H2>
      <BodySm style={{ marginTop: space.sm, color: c.ink }}>{copy.body}</BodySm>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, marginTop: space.lg }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.action}
          onPress={() => {
            momentActed(moment.id);
            if (moment.id === 'rate-app') {
              /* STORE REVIEW INTEGRATION POINT
               * Swap for expo-store-review: `await StoreReview.requestReview()`, guarded
               * by `isAvailableAsync()`. iOS caps the native prompt at three a year per
               * user, which is the reason this moment fires once, after something has
               * demonstrably gone well, and never during a bad stretch — a prompt spent
               * on somebody mid bad week is one of three gone. */
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
