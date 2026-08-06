import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, Row, useTheme,
} from '../components/ui';
import { space, radius } from '../constants/theme';
import { useEntitlement, PRICING, FREE_LIMITS } from '../lib/entitlement';

/* No countdown. No fake scarcity. No "limited spots". No disguised dismiss.
 *
 * The pitch is that the user has already seen their own number and weeks 2-12 are how
 * they change it. If that isn't persuasive on its own, manufacturing urgency at someone
 * with appearance anxiety is not a trade worth making. See SAFETY.md. */

type Plan = 'monthly' | 'yearly' | 'lifetime';

export default function Paywall() {
  const c = useTheme();
  const router = useRouter();
  const { entitled, purchase, restore } = useEntitlement();
  const [plan, setPlan] = useState<Plan>('yearly');

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
            All twelve weeks, unlimited thought records, insights, and export are unlocked.
          </Body>
          <Button label="Back to the programme" onPress={() => router.replace('/')} style={{ marginTop: space.lg }} />
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
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        {/* One dismiss, plainly labelled, at the top where it is expected. */}
        <Row>
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={dismiss}
            style={{ padding: space.sm, minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <Body style={{ color: c.inkSoft }}>Close</Body>
          </Pressable>
        </Row>

        <H1 style={{ marginTop: space.sm }}>You've seen your number.</H1>
        <Body style={{ marginTop: space.sm, color: c.inkSoft }}>
          Weeks 2 through 12 are how you change it — the exposure work, the thought records, the
          attention training, and the plan you leave with.
        </Body>

        <Card style={{ marginTop: space.lg }}>
          <H3>Free, forever</H3>
          <BodySm style={{ marginTop: space.sm }}>
            Week 1 complete · daily check-in · every grounding exercise · all crisis support ·
            {' '}{FREE_LIMITS.learnModules} learn modules · {FREE_LIMITS.thoughtRecordsPerMonth} thought records a month
          </BodySm>
          <BodySm style={{ marginTop: space.sm, color: c.accentDeep }}>
            Grounding, breathing, the hard-day path, and crisis support are never paid. Not now and
            not later.
          </BodySm>
        </Card>

        <H2 style={{ marginTop: space.lg, marginBottom: space.sm }}>Steady+</H2>
        <BodySm style={{ marginBottom: space.md }}>
          Weeks 2–12 · unlimited thought records · mirror practice · insights · data export
        </BodySm>

        {plans.map((p) => {
          const on = plan === p.key;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setPlan(p.key)}
              style={{
                borderWidth: on ? 1.5 : StyleSheet.hairlineWidth,
                borderColor: on ? c.accent : c.line,
                backgroundColor: on ? c.accentPale : c.surface,
                borderRadius: radius.lg,
                padding: space.lg,
                marginBottom: space.sm,
              }}
            >
              <Row>
                <View style={{ flex: 1 }}>
                  <H3>{p.label}</H3>
                  {p.note ? <Caption>{p.note}</Caption> : null}
                </View>
                <H3 style={{ color: on ? c.accentDeep : c.ink }}>{p.price}</H3>
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
          {PRICING.trialDays} days free, then {plans.find((p) => p.key === plan)?.price}. Cancel any
          time in your app store settings.
        </Caption>

        <Button
          label="Restore purchase"
          variant="ghost"
          onPress={async () => {
            await restore();
            router.replace('/');
          }}
          style={{ marginTop: space.md }}
        />
        <Button label="Not now" variant="ghost" onPress={dismiss} />
      </View>
    </Screen>
  );
}
