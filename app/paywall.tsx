import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Button, H1, H2, H3, Body, BodySm, Caption, Row, Rule, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { useEntitlement, PRICING, FREE_LIMITS } from '../lib/entitlement';
import { PAYWALL_COPY } from '../content/copy.ts';

/* No countdown. No fake scarcity. No "limited spots". No disguised dismiss.
 *
 * The pitch is that the user has already seen their own number and weeks 2-12 are how
 * they change it. If that isn't persuasive on its own, manufacturing urgency at someone
 * with appearance anxiety is not a trade worth making. See SAFETY.md. */

type Plan = 'monthly' | 'yearly' | 'lifetime';

export default function Paywall() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entitled, purchase, restore } = useEntitlement();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [hardship, setHardship] = useState(false);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (entitled) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>You have Steady+</H1>
          <Body style={{ marginTop: space.md, color: c.inkSoft }}>
            All twelve weeks, unlimited thought records, the full progress picture, and export are
            unlocked.
          </Body>
          <Button
            label="Back to the programme"
            onPress={() => router.replace('/')}
            style={{ marginTop: space.xl, alignSelf: 'flex-start' }}
          />
        </View>
      </Screen>
    );
  }

  const plans: { key: Plan; label: string; price: string; note?: string }[] = [
    { key: 'monthly', label: 'Monthly', price: PRICING.monthly },
    { key: 'yearly', label: 'Yearly', price: PRICING.yearly, note: 'Works out around $3.75 a month' },
    { key: 'lifetime', label: 'Lifetime', price: PRICING.lifetime, note: 'One payment, no subscription' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl, alignItems: 'center' }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
        <Atmosphere variant="dawn" lightX={0.7} rounded="none">
          <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.lg, paddingBottom: space.xxl }}>
            {/* One dismiss, plainly labelled, at the top where it is expected. */}
            <Row>
              <View style={{ flex: 1 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={dismiss}
                style={{ padding: space.sm, minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}
              >
                <Text style={[t.body, { color: 'rgba(255,255,255,0.8)' }]}>Close</Text>
              </Pressable>
            </Row>

            <Text style={[t.display, { color: '#fff', marginTop: space.xl }]}>{PAYWALL_COPY.headline}</Text>
            <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.md }]}>
              {PAYWALL_COPY.sub}
            </Text>
            <Text style={[t.bodySm, { color: 'rgba(255,255,255,0.72)', marginTop: space.md }]}>
              {PAYWALL_COPY.freeLine}
            </Text>
          </View>
        </Atmosphere>

        <View style={{ paddingHorizontal: space.lg, marginTop: space.xl }}>
          <H3>Free, forever</H3>
          <BodySm style={{ marginTop: space.sm }}>
            Week 1 complete · daily check-in · every grounding exercise · all crisis support ·{' '}
            {FREE_LIMITS.learnModules} learn modules · {FREE_LIMITS.thoughtRecordsPerMonth} thought
            records a month
          </BodySm>
          <BodySm style={{ marginTop: space.sm, color: c.cool }}>
            Grounding, breathing, the hard-day path, and crisis support are never paid. Not now and
            not later.
          </BodySm>

          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Steady+</H2>
            <BodySm style={{ marginTop: space.xs, marginBottom: space.lg }}>
              Weeks 2–12 · unlimited thought records · mirror practice · the full progress picture ·
              data export
            </BodySm>

            {plans.map((p) => {
              const on = plan === p.key;
              return (
                <Pressable
                  key={p.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${p.label}, ${p.price}`}
                  onPress={() => setPlan(p.key)}
                  style={{
                    borderWidth: on ? 1.5 : StyleSheet.hairlineWidth,
                    borderColor: on ? c.accent : c.line,
                    backgroundColor: on ? c.accentDim : 'transparent',
                    borderRadius: radius.card,
                    padding: space.lg,
                    marginBottom: space.sm,
                  }}
                >
                  <Row>
                    <View style={{ flex: 1 }}>
                      <H3>{p.label}</H3>
                      {p.note ? <Caption style={{ marginTop: 2 }}>{p.note}</Caption> : null}
                    </View>
                    <Text style={[t.h2, { color: on ? c.accentDeep : c.ink }]}>{p.price}</Text>
                  </Row>
                </Pressable>
              );
            })}

            <Button
              label={`Start ${PRICING.trialDays}-day trial`}
              onPress={async () => {
                await purchase(plan);
                router.replace('/');
              }}
              style={{ marginTop: space.md }}
            />
            <Caption style={{ marginTop: space.sm, textAlign: 'center' }}>
              {PRICING.trialDays} days free, then {plans.find((p) => p.key === plan)?.price}. Cancel
              any time in your app store settings.
            </Caption>
          </View>

          {/* Visible, not buried. No form, no proof, no questions — someone who cannot pay
              is not a lower-value user, and making them ask twice is a bad trade. */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setHardship(true)}
            style={{ marginTop: space.xl, paddingVertical: space.md, alignItems: 'center', minHeight: 44 }}
          >
            <Body style={{ color: c.accentDeep, textDecorationLine: 'underline' }}>
              {PAYWALL_COPY.hardship.link}
            </Body>
          </Pressable>

          {hardship && (
            <View
              style={{
                borderRadius: radius.card,
                backgroundColor: c.accentDim,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.line,
                padding: space.lg,
              }}
            >
              <H3>{PAYWALL_COPY.hardship.title}</H3>
              <Body style={{ marginTop: space.sm }}>{PAYWALL_COPY.hardship.body}</Body>
              <Button
                label={PAYWALL_COPY.hardship.confirm}
                onPress={async () => {
                  await purchase('lifetime');
                  router.replace('/');
                }}
                style={{ marginTop: space.lg }}
              />
            </View>
          )}

          <Button
            label="Restore purchase"
            variant="ghost"
            onPress={async () => {
              await restore();
              router.replace('/');
            }}
            style={{ marginTop: space.lg }}
          />
          <Button label="Not now" variant="ghost" onPress={dismiss} />
        </View>
      </View>
    </ScrollView>
  );
}
