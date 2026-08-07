import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  Screen, Button, H1, H2, H3, Body, BodySm, Caption, Label, Row, Rule, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { useEntitlement, PRICING, TIER_COMPARISON, trialEndDate } from '../lib/entitlement';
import { PAYWALL_COPY } from '../content/copy.ts';
import { PROOF_POINTS, PROOF_QUALIFIER } from '../content/proof';

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

  /* Annual is pre-selected and badged: Health & Fitness takes ~68% of revenue from annual
     and annual retains far better. Monthly stays on the list anyway — in a category where
     trust is the binding constraint, offering the flexible option is itself a trust signal.
     The badge says what the plan IS, not what you would lose by not taking it. */
  const plans: { key: Plan; label: string; price: string; note?: string; badge?: string }[] = [
    /* "Best value" is arithmetic — it is the lowest per-month figure on the list. A badge
       reading "Most popular" would be a claim about users Steady does not have. */
    { key: 'yearly', label: 'Yearly', price: PRICING.yearly, note: `Works out at ${PRICING.yearlyPerMonth}`, badge: 'Best value' },
    { key: 'monthly', label: 'Monthly', price: PRICING.monthly, note: 'Leave whenever, no discount to lose' },
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
            {/* One dismiss, plainly labelled, present in the first frame. Top LEFT, because
                the always-mounted Support pill owns the top right on every screen and two
                controls stacked on each other is how a dismiss ends up looking hidden
                whether or not anybody intended it. */}
            <Row>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={dismiss}
                style={{ padding: space.sm, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={[t.body, { color: 'rgba(255,255,255,0.85)' }]}>‹  Close</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
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
          {/* Trust content above the price, not below. In this category trust IS the
              conversion lever, and here it means evidence, privacy and refund clarity
              rather than testimonials — Steady has no users to quote and will not invent
              any. See .claude/skills/value-first-growth. */}
          <Rule />
          <H2 style={{ marginTop: space.lg }}>Why these twelve weeks</H2>
          {PROOF_POINTS.slice(0, 2).map((p) => (
            <View key={p.stat} style={{ marginTop: space.lg }}>
              <Text style={[t.h1, { color: c.accentDeep }]}>{p.stat}</Text>
              <BodySm style={{ marginTop: space.xs, color: c.ink }}>{p.claim}</BodySm>
              <Caption style={{ marginTop: space.xs }}>{p.source}</Caption>
            </View>
          ))}
          <Caption style={{ marginTop: space.lg }}>{PROOF_QUALIFIER}</Caption>

          {/* A free-vs-paid comparison is one of the most consistent additions across
              high-performing paywalls, because a large share of people standing at one
              still cannot say what they would be buying. The free column is written
              generously on purpose: a visibly crippled one reads as hostage-taking and
              converts worse than an honest one. */}
          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>{PAYWALL_COPY.comparisonTitle}</H2>
            <Row style={{ marginTop: space.lg, marginBottom: space.sm }}>
              <View style={{ flex: 1 }} />
              <Caption style={{ width: 66, textAlign: 'center' }}>Free</Caption>
              <Label style={{ width: 66, textAlign: 'center', color: c.accentDeep }}>Steady+</Label>
            </Row>
            {TIER_COMPARISON.map((row) => (
              <Row
                key={row.label}
                style={{
                  paddingVertical: space.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.line,
                  alignItems: 'flex-start',
                }}
              >
                <BodySm style={{ flex: 1, color: c.ink }}>{row.label}</BodySm>
                <View style={{ width: 66, alignItems: 'center' }}>
                  <TierCell value={row.free} />
                </View>
                <View style={{ width: 66, alignItems: 'center' }}>
                  <TierCell value={row.plus} plus />
                </View>
              </Row>
            ))}
            <BodySm style={{ marginTop: space.lg, color: c.cool }}>
              Grounding, breathing, the hard-day path and crisis support are never paid. Not now
              and not later, whatever happens to this business.
            </BodySm>
          </View>

          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Steady+</H2>
            <BodySm style={{ marginTop: space.xs, marginBottom: space.lg }}>
              {PRICING.trialDays} days free, then whichever of these you pick. Annual works out
              at {PRICING.yearlyPerMonth}.
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
                      <Row style={{ justifyContent: 'flex-start', gap: space.sm }}>
                        <H3>{p.label}</H3>
                        {p.badge ? (
                          <View
                            style={{
                              backgroundColor: on ? c.accent : c.surfaceStrong,
                              borderRadius: radius.pill,
                              paddingVertical: 3,
                              paddingHorizontal: space.sm,
                            }}
                          >
                            <Text style={[t.caption, { color: on ? c.onAccent : c.inkSoft, fontSize: 11 }]}>
                              {p.badge}
                            </Text>
                          </View>
                        ) : null}
                      </Row>
                      {p.note ? <Caption style={{ marginTop: 2 }}>{p.note}</Caption> : null}
                    </View>
                    <Text style={[t.h2, { color: on ? c.accentDeep : c.ink }]}>{p.price}</Text>
                  </Row>
                </Pressable>
              );
            })}

            <Button
              label="Start my twelve weeks"
              onPress={async () => {
                await purchase(plan);
                router.replace('/');
              }}
              style={{ marginTop: space.md }}
            />
            {/* The end DATE, the amount, and where to cancel — three facts, one sentence,
                no asterisk. A long trial showing only a duration is a trap; a long trial
                showing a date and a promised reminder is a fair deal. */}
            <BodySm style={{ marginTop: space.md, textAlign: 'center' }}>
              Free until {trialEndDate()}. Then {plans.find((p) => p.key === plan)?.price}.
            </BodySm>
            <BodySm style={{ marginTop: space.xs, textAlign: 'center', color: c.inkFaint }}>
              We will remind you two days before it ends. Cancel any time in your app store
              settings, in fewer taps than it took to start.
            </BodySm>
            <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>
              {PAYWALL_COPY.noUrgency}
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

/** One cell of the comparison grid. A tick where the tier simply has the thing, the
 *  qualifier where it has a limited amount of it, an em dash where it does not. */
function TierCell({ value, plus }: { value: string | true; plus?: boolean }) {
  const c = useTheme();
  if (value === true) {
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16">
        <Path
          d="M3.4 8.4 6.5 11.4 12.6 5"
          stroke={plus ? c.accentDeep : c.cool}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }
  return (
    <Text
      style={[
        t.caption,
        { color: value === '\u2014' ? c.inkFaint : plus ? c.accentDeep : c.inkSoft, textAlign: 'center' },
      ]}
    >
      {value}
    </Text>
  );
}
