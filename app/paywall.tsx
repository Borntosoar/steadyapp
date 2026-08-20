import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Text, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  Screen, Button, H1, H2, H3, Body, BodySm, Caption, Label, Row, Rule, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { PRICING, RENEWAL_TERMS, PLUS_ADDS, ALWAYS_FREE, trialEndDate, type Plan } from '../lib/entitlement';
import { useEntitlement } from '../hooks/useEntitlement';
import { PAYWALL_COPY } from '../content/copy.ts';
import { LINKS } from '../constants/links';
import { PROOF_POINTS, PROOF_QUALIFIER } from '../content/proof';
import { useStore } from '../store/useStore';
import { computeReclaimed, checkInsInLastDays, previousWeekCheckIns } from '../lib/reclaimed';

/* No countdown. No fake scarcity. No "limited spots". No disguised dismiss.
 *
 * The pitch is that the user has already seen their own number and weeks 2-12 are how
 * they change it. If that isn't persuasive on its own, manufacturing urgency at someone
 * with appearance anxiety is not a trade worth making. See SAFETY.md. */


export default function Paywall() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entitled, purchase, restore, grantHardship } = useEntitlement();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [hardship, setHardship] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);

  /* The user's own number, on the screen that asks for money.
   *
   * The headline has always said "You have seen your number" and then not shown it. The
   * evidence block underneath showed somebody else's numbers instead — a meta-analysis
   * effect size, which is true and is not the reason anybody buys anything. The whole
   * proposition of this product is that the person can see their own hours moving; putting
   * the ask beside a citation instead of beside that figure gives away the only argument
   * it has. */
  const baseline = useStore((s) => s.baseline);
  const checkIns = useStore((s) => s.checkIns);
  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );
  const hasNumber = reclaimed.hasData && reclaimed.sampleSize >= 3 && reclaimed.hours > 0;

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (entitled) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>You have Anneal+</H1>
          <Body style={{ marginTop: space.md, color: c.inkSoft }}>
            All twelve weeks, as much writing as you want, the full picture on Progress, and
            export. All open.
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
     The badge says what the plan IS, not what you would lose by not taking it.

     The one-off option is off the default view and behind a plainly-labelled disclosure.
     Two reasons: a twelve-week protocol invites "I'll be done by then", so paying once
     cannibalises exactly the annual renewals that compound past the ~24-month mark where
     churn stabilises and LTV is actually made; and a third option on first read is a third
     decision for somebody who is already spending their day making anxious decisions about
     themselves.

     It is labelled "Pay once", never "Lifetime". App Review rejects the second on the
     grounds that nobody can guarantee content for a customer's life — see
     docs/APP-STORE.md §5.4 — and the objection is fair on the merits, not just as a rule.

     Disclosed, not buried. Some people genuinely will not take a subscription, and hiding
     the option they want in order to sell them one they do not is the sort of thing this
     paywall exists not to do. The link says exactly what is behind it. */
  const plans: {
    key: Plan; label: string; headline: string; lines: string[]; badge?: string;
  }[] = [
    /* "Best value" is arithmetic — it is the lowest per-month figure on the list. A badge
       reading "Most popular" would be a claim about users Anneal does not have.

       THE CARD IS A STACK, NOT A ROW. The price used to sit at the right edge in h2 while
       the per-month figure sat under the label as a caption, so the two numbers a reader
       has to compare — $6.67 and $12.99 — were in different type, different sizes, on
       opposite sides of the layout, one card apart. Most people will not do that
       arithmetic, and the ones who do are doing the seller's work. Now each card leads
       with its own per-month figure in the same type on the same left-hand line, and the
       yearly card states the difference outright.

       Stating it is not a discount. There is no struck-through price, no deadline, no
       "was", and no percentage detached from its base — those are the grammar of a
       manufactured saving. These are two prices both on offer today with the arithmetic
       shown, which SAFETY.md §13's test ("every number shown to a customer is one we could
       defend to their face") passes trivially. */
    {
      key: 'yearly',
      label: 'Yearly',
      headline: PRICING.yearlyPerMonth,
      lines: [
        `Billed ${PRICING.yearlyLong}`,
        `${PRICING.monthlyPerYear} if you paid monthly for a year. That is ${PRICING.yearlySaving} less.`,
      ],
      badge: 'Best value',
    },
    {
      key: 'monthly',
      label: 'Monthly',
      headline: PRICING.monthlyLong,
      lines: ['Leave whenever. No discount to lose.'],
    },
    /* AT PARITY, NOT BEHIND A LINK, and this reverses an earlier decision on purpose.
       It was collapsed behind "Rather pay once than subscribe?" on the reasoning that a
       third option is a third decision for somebody already spending their day making
       anxious decisions, and that it cannibalises annual renewals compounding past month
       24. For a programme that finishes in twelve weeks there is very little past month 24
       to compound, and the customer thinking "I will be done by then" is thinking
       accurately. It also nets more per customer than an annual subscription does.

       The honest version of the argument is the deciding one: selling a finite programme
       as a recurring subscription, while hiding the one-off option, is a small dishonesty
       that a suspicious customer in a low-trust category will smell.

       Labelled "Pay once", never "Lifetime" — App Review rejects the second on the grounds
       that nobody can guarantee content for a customer's life (docs/APP-STORE.md §5.4),
       and the objection is fair on the merits rather than just as a rule. */
    {
      key: 'lifetime',
      label: 'Pay once',
      headline: PRICING.lifetimeShort,
      lines: [
        'One payment, not a subscription.',
        'About the same as two years of the annual plan.',
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl, alignItems: 'center' }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
        <Atmosphere variant="grove" lightX={0.7} rounded="none">
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

            {hasNumber ? (
              <>
                <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)', marginTop: space.xl }]}>
                  What you got back this week
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                  <Text style={[t.hero, { color: '#fff' }]}>{Math.abs(reclaimed.hours)}</Text>
                  <Text style={[t.h2, { color: 'rgba(255,255,255,0.7)' }]}>hours</Text>
                </View>
                <Text style={[t.body, { color: 'rgba(255,255,255,0.86)', marginTop: space.sm }]}>
                  {PAYWALL_COPY.sub}
                </Text>
              </>
            ) : (
              <>
                <Text style={[t.display, { color: '#fff', marginTop: space.xl }]}>
                  {PAYWALL_COPY.headline}
                </Text>
                <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.md }]}>
                  {PAYWALL_COPY.sub}
                </Text>
              </>
            )}
            <Text style={[t.bodySm, { color: 'rgba(255,255,255,0.72)', marginTop: space.md }]}>
              {PAYWALL_COPY.freeLine}
            </Text>
          </View>
        </Atmosphere>

        <View style={{ paddingHorizontal: space.lg, marginTop: space.xl }}>
          {/* Trust content above the price, not below. In this category trust IS the
              conversion lever, and here it means evidence, privacy and refund clarity
              rather than testimonials — Anneal has no users to quote and will not invent
              any. See .claude/skills/value-first-growth. */}
          <Rule />
          <H2 style={{ marginTop: space.lg }}>Why these twelve weeks</H2>
          {[PROOF_POINTS[0], PROOF_POINTS[2]].map((p) => (
            <View key={p.stat} style={{ marginTop: space.lg }}>
              <Text style={[t.h1, { color: c.accentDeep }]}>{p.stat}</Text>
              <BodySm style={{ marginTop: space.xs, color: c.ink }}>{p.claim}</BodySm>
              <Caption style={{ marginTop: space.xs }}>{p.source}</Caption>
            </View>
          ))}
          <Caption style={{ marginTop: space.lg }}>{PROOF_QUALIFIER}</Caption>

          {/* Privacy belongs on the screen asking for a card, not only in onboarding.
              Somebody deciding whether to pay is deciding, in the same moment, whether to
              hand a body-image app twelve weeks of their most private writing. That second
              question was answered everywhere except here. */}
          <View
            style={{
              marginTop: space.lg,
              padding: space.lg,
              borderRadius: radius.card,
              backgroundColor: c.coolDim,
            }}
          >
            <BodySm style={{ color: c.ink }}>
              No account, and nothing leaves this phone. Everything you write stays on the
              device, paid or not. There is no server holding any of it.
            </BodySm>
          </View>

          {/* A free-vs-paid comparison is one of the most consistent additions across
              high-performing paywalls, because a large share of people standing at one
              still cannot say what they would be buying. The free column is written
              generously on purpose: a visibly crippled one reads as hostage-taking and
              converts worse than an honest one. */}
          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>{PAYWALL_COPY.plusTitle}</H2>
            <Row style={{ marginTop: space.lg, marginBottom: space.sm }}>
              <View style={{ flex: 1 }} />
              <Caption style={{ width: 66, textAlign: 'center' }}>Free</Caption>
              <Label style={{ width: 66, textAlign: 'center', color: c.accentDeep }}>Anneal+</Label>
            </Row>
            {PLUS_ADDS.map((row) => (
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
            {/* The always-free list is NOT a comparison and must not be rendered as one.
                It used to be four rows inside the grid above reading Forever/Forever and
                ✓/✓, which put an unconditional promise (SAFETY.md §4, §11b) inside a layout
                whose entire visual grammar says "these two things are being compared" — so
                the most generous thing in the product read as a shortfall, three rows deep,
                at the top, where scanning attention is highest. Same content, different
                form, and nothing to lose against. */}
            <H2 style={{ marginTop: space.xxl }}>{PAYWALL_COPY.comparisonTitle}</H2>
            {ALWAYS_FREE.map((label) => (
              <Row
                key={label}
                style={{
                  paddingVertical: space.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.line,
                  alignItems: 'flex-start',
                  gap: space.sm,
                }}
              >
                <View style={{ width: 20, alignItems: 'center', paddingTop: 2 }}>
                  <TierCell value plus />
                </View>
                <BodySm style={{ flex: 1, color: c.ink }}>{label}</BodySm>
              </Row>
            ))}
            <BodySm style={{ marginTop: space.lg, color: c.cool }}>
              Calming down, breathing, the hard-day path and crisis support are never paid for.
              Not now and not later, whatever happens to this business.
            </BodySm>
          </View>

          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Anneal+</H2>
            {/* "on either subscription", not "then whichever of these you pick". Once the
                one-off option is disclosed the list holds a product with no trial at all,
                and the shorter sentence promised the free month across all three. */}
            <BodySm style={{ marginTop: space.xs, marginBottom: space.lg }}>
              {PRICING.trialDays} days free on either subscription. You pick the plan now and
              pay nothing until it ends.
            </BodySm>

            {plans.map((p) => {
              const on = plan === p.key;
              return (
                <Pressable
                  key={p.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${p.label}, ${p.headline}. ${p.lines.join('. ')}`}
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
                  <View>
                    <View>
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
                    </View>
                    <Text style={[t.h2, { color: on ? c.accentDeep : c.ink, marginTop: space.xs }]}>
                      {p.headline}
                    </Text>
                    {p.lines.map((line) => (
                      /* inkSoft, not inkFaint. These carry what the customer is actually
                         agreeing to, and inkFaint clears AA by 0.09 — inside the noise once
                         anti-aliasing on a gradient ground is accounted for. A screen that
                         refuses urgency on principle should not whisper the refusal. */
                      <Caption key={line} style={{ marginTop: 2, color: c.inkSoft }}>{line}</Caption>
                    ))}
                  </View>
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
            {/* The end DATE, the amount, the renewal, and where to cancel — four facts, no
                asterisk. A long trial showing only a duration is a trap; a long trial
                showing a date and a promised reminder is a fair deal.

                Branched on the plan because the one-off product has no trial and no
                renewal, and the unbranched sentence asserted both about it. */}
            <BodySm style={{ marginTop: space.md, textAlign: 'center' }}>
              {plan === 'lifetime'
                ? `${RENEWAL_TERMS.lifetime}.`
                : `Free until ${trialEndDate()}. Then ${RENEWAL_TERMS[plan]}.`}
            </BodySm>
            {/* "We will remind you" was an overstatement, and writing the test for it is what
                made that obvious. The reminder is an in-app card: it fires on each of the
                last three days, outranks every other moment, and survives the distress
                suppression that silences everything else — but somebody who does not open
                Anneal during that week is not reminded at all. For an app deliberately built
                to be missable, with no streak and no nagging, that is a realistic person
                rather than an edge case.
                So the sentence says where the reminder appears, and puts the mechanism that
                does not depend on us first. A promise the app keeps only for people who
                happened to show up is the kind of small untruth this whole screen exists not
                to tell. */}
            {plan !== 'lifetime' && (
              <BodySm style={{ marginTop: space.xs, textAlign: 'center', color: c.inkFaint }}>
                Cancel any time in your app store settings, in fewer taps than it took to
                start. Anneal will also show you a reminder here in the last two days.
              </BodySm>
            )}
            {/* Guideline 3.1.2 wants these reachable from inside the app, adjacent to the
                purchase, not only from the App Store listing. Opened in Safari rather than a
                WebView on purpose: an in-app browser makes the age-rating answer to
                "Unrestricted Web Access" a Yes, which raises the rating for nothing. */}
            <Row style={{ marginTop: space.lg, justifyContent: 'center', gap: space.lg }}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Privacy policy, opens in your browser"
                onPress={() => Linking.openURL(LINKS.privacy)}
                style={({ pressed }) => ({ paddingVertical: space.sm, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={[t.caption, { color: c.inkSoft, textDecorationLine: 'underline' }]}>
                  Privacy policy
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Terms of use, opens in your browser"
                onPress={() => Linking.openURL(LINKS.terms)}
                style={({ pressed }) => ({ paddingVertical: space.sm, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={[t.caption, { color: c.inkSoft, textDecorationLine: 'underline' }]}>
                  Terms of use
                </Text>
              </Pressable>
            </Row>

            <Caption style={{ marginTop: space.md, textAlign: 'center' }}>
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
                  await grantHardship();
                  router.replace('/');
                }}
                style={{ marginTop: space.lg }}
              />
            </View>
          )}

          {/* Restore can fail, and it now says so instead of silently doing nothing.
              It used to grant a permanent entitlement whenever the provider could not be
              reached, which meant this button read as "it worked" in every case — including
              the one where it had just handed out a free subscription to anybody in airplane
              mode. Honest failure needs somewhere to be said. */}
          <Button
            label="Restore purchase"
            variant="ghost"
            onPress={async () => {
              const ok = await restore();
              if (ok) router.replace('/');
              else setRestoreFailed(true);
            }}
            style={{ marginTop: space.lg }}
          />
          {restoreFailed ? (
            <BodySm style={{ textAlign: 'center', color: c.cool, marginTop: space.xs }}>
              We could not reach the App Store just now. Nothing was charged and nothing
              changed. Try again when you have a connection.
            </BodySm>
          ) : null}
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
