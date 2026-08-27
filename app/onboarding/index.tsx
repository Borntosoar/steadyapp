import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Field, H1, H2, H3, Body, BodySm, Caption, Label, Options, Rule, useTheme,
} from '../../components/ui';
import { FaceScale, LevelBar, URGE_WORDS } from '../../components/frost';
import { Atmosphere } from '../../components/Atmosphere';
import {
  space, radius, type as t, LAYOUT_MAX_WIDTH,
} from '../../constants/theme';
import { useStore } from '../../store/useStore';
import {
  PREOCCUPATION_BUCKETS, PREOCCUPATION_MINUTES, type PreoccupationBucket, type AvoidanceLevel,
} from '../../types';
import { costMirror, COST_MIRROR_FOOTER } from '../../lib/cost';
import { PROOF_POINTS, PROOF_QUALIFIER } from '../../content/proof';
import { RegionPicker } from '../../components/RegionPicker';
import { regionByKey } from '../../constants/support';

/* Onboarding.
 *
 * Sequenced against one number: day-one retention in health apps runs 20–30%, and trial
 * starts peak on day zero across every model measured. Seven or eight of every ten people
 * who open this are never coming back, so whatever is going to reach somebody has to reach
 * them here, in this session, in the first two minutes.
 *
 * A feature tour does not do that. Their own arithmetic does. The order is therefore:
 *
 *   1  what this is, and the free boundary stated out loud on screen one
 *   2  privacy — the differentiator, and the thing this population asks about first
 *   3  the four baseline questions, framed as the starting point rather than a form
 *   4  THE COST MIRROR — their own number, computed live. the aha moment, ~90 seconds in
 *   5  a commitment they author themselves, which then changes what the app does
 *   6  the evidence behind the method, with the qualifier attached
 *   7  the disclaimer gate
 *
 * There is no paywall in here and there will not be one. The ask belongs at the second
 * proof point — the first time the customer watches their own number move — not before any
 * evidence exists. See .claude/skills/value-first-growth/references/steady.md. */

const AVOIDANCE_OPTIONS: AvoidanceLevel[] = ['none', 'small', 'significant'];
const AVOIDANCE_LABELS = [
  'No — I did what I planned to do',
  'A small amount — I changed something',
  'Significantly — I skipped or cancelled something',
];

const DAYS_OPTIONS = [2, 3, 4, 5] as const;
const DAYS_LABELS = [
  'Two days a week',
  'Three days a week',
  'Four days a week — what the protocol assumes',
  'Five days a week',
];

export default function Onboarding() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const acceptDisclaimer = useStore((s) => s.acceptDisclaimer);

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [bucket, setBucket] = useState<PreoccupationBucket | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [avoidance, setAvoidance] = useState<AvoidanceLevel | null>(null);
  const [suds, setSuds] = useState<number | null>(null);
  const [days, setDays] = useState<number | null>(4);
  /* Read, not guessed again. hydrate() already resolved the device locale on this very
     first run — asking twice could disagree with itself. */
  const supportRegion = useStore((s) => s.profile.supportRegion);
  const setSupportRegion = useStore((s) => s.setSupportRegion);
  const [regionOpen, setRegionOpen] = useState(false);
  const [wantBack, setWantBack] = useState('');

  const baselineDraft =
    bucket !== null
      ? {
          capturedAt: new Date().toISOString(),
          preoccupationMinutes: PREOCCUPATION_MINUTES[bucket],
          urge: urge ?? 5,
          avoidance: avoidance ?? 'small',
          suds: suds ?? 5,
        }
      : null;

  const mirror = costMirror(baselineDraft);

  const finish = () => {
    completeOnboarding(
      baselineDraft ?? {
        capturedAt: new Date().toISOString(),
        preoccupationMinutes: PREOCCUPATION_MINUTES['1-3h'],
        urge: 5,
        avoidance: 'small',
        suds: 5,
      },
      firstName.trim() || undefined,
      /* Step five says "both get used", and for a while neither was. `days` sets the practice
         target the week advances on; `wantBack` is what the hard-day path shows back. */
      { practiceDaysPerWeek: days ?? undefined, wantBack },
    );
    acceptDisclaimer();
    /* Straight to the baseline questionnaires, not to Today.
     *
     * `replace` and not `push`, so Back from the measure screen cannot walk somebody back
     * into an onboarding they have already completed. The measure screen itself routes to
     * Today whether they answer or skip, so this is the last step of onboarding rather than a
     * detour hanging off the end of it.
     *
     * It is offered here and nowhere earlier for the reason DIRECTION.md gives: this is the
     * only moment that yields a true day-zero reading, and every day it is delayed is a day
     * the intervention has already been running when the "before" number is taken. */
    router.replace('/measure');
  };

  const BASELINE_STEP = 2;
  const MIRROR_STEP = 3;
  const LAST = 6;

  /* ---------- step 4: the cost mirror ----------
     Full-frame, on artwork, with the number set larger than anything else in the app.
     This is the moment the product earns a second session. */
  if (step === MIRROR_STEP) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDeep }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, flex: 1 }}>
            <Atmosphere variant="grove" rounded="none" style={{ flex: 1, minHeight: 520 }}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  paddingTop: insets.top + space.xxxl,
                  paddingHorizontal: space.lg,
                  paddingBottom: space.xl,
                }}
              >
                <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)' }]}>
                  {mirror.worthShowing ? 'What it is costing you now' : 'Where you are'}
                </Text>
                {mirror.worthShowing ? (
                  <Text style={[t.hero, { color: '#fff', marginTop: space.sm }]}>
                    {mirror.figure}
                    <Text style={[t.h2, { color: 'rgba(255,255,255,0.66)' }]}>  {mirror.unit}</Text>
                  </Text>
                ) : (
                  <Text style={[t.display, { color: '#fff', marginTop: space.sm }]}>{mirror.headline}</Text>
                )}
                <Text
                  style={[
                    t.body,
                    { color: 'rgba(255,255,255,0.86)', marginTop: space.md, fontSize: 17, lineHeight: 26 },
                  ]}
                >
                  {mirror.sub}
                </Text>
              </View>
            </Atmosphere>

            <View
              style={{
                paddingHorizontal: space.lg,
                paddingTop: space.xl,
                paddingBottom: insets.bottom + space.xl,
              }}
            >
              <BodySm>{COST_MIRROR_FOOTER}</BodySm>
              <Button
                label="Keep going"
                onPress={() => setStep(step + 1)}
                style={{ marginTop: space.xl }}
              />
              <Button
                label="Back"
                variant="ghost"
                onPress={() => setStep(step - 1)}
                style={{ marginTop: space.xs }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const steps = [
    /* 1 — what this is, and the commercial shape, said immediately.
       Stating the free boundary on screen one is the honest version of what a hard paywall
       does structurally: it makes the deal unmissable from the first session. Customers
       who know the shape from the start convert better and refund less. */
    <View key="s0">
      <H1>Anneal</H1>
      <Body style={{ marginTop: space.md }}>
        A self-help tool for appearance worry, built around one idea: this problem steals
        time, and the point is to get the time back.
      </Body>
      <Body style={{ marginTop: space.md }}>
        It is not treatment and not a doctor, and it does not diagnose anything. Plenty of
        people find structured practice like this useful, and some people need more than an
        app. Both are true and neither cancels the other.
      </Body>

      <View style={{ marginTop: space.xxl }}>
        <Rule />
        <Label style={{ marginTop: space.lg, color: c.cool }}>Free, forever</Label>
        <BodySm style={{ marginTop: space.xs, color: c.ink }}>
          Week one, the daily check-in and your hours number, every calming exercise, the
          hard-day path, and all crisis support. No card, no account, no end date.
        </BodySm>
        <Label style={{ marginTop: space.lg, color: c.accentDeep }}>Anneal+</Label>
        <BodySm style={{ marginTop: space.xs, color: c.ink }}>
          Weeks two to twelve, mirror practice, as much writing as you want, and the full
          history. You will not be asked about it until you have seen this work.
        </BodySm>
      </View>

      <View
        style={{
          marginTop: space.xxl,
          borderRadius: radius.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.line,
          backgroundColor: c.surface,
          padding: space.lg,
        }}
      >
        <H3>What it will never do</H3>
        <BodySm style={{ marginTop: space.sm, color: c.ink }}>
          There is no camera roll, no photo, no filter, no rating of how you look, and no
          before-and-after. Nothing in Anneal measures your appearance.
        </BodySm>
      </View>
    </View>,

    /* 2 — privacy. The first question this population asks, and a genuine differentiator. */
    <View key="s1">
      <H1>This stays on your device</H1>
      <Body style={{ marginTop: space.md }}>
        Everything you write is stored locally, in this app, on this phone. There is no
        account to make. There is no server to send it to. Nobody, including us, can read it.
      </Body>
      <Body style={{ marginTop: space.md }}>
        That also means there is no backup. If you delete the app it is gone. You can export
        a plain-text copy whenever you like, including one to take to a clinician.
      </Body>
      <BodySm style={{ marginTop: space.xxl, color: c.cool }}>
        No analytics, no tracker, no third party. Not a promise about how we will behave —
        there is simply no code in here that could send anything anywhere.
      </BodySm>
    </View>,

    /* 3 — baseline. Four questions, framed as the starting point rather than a form. */
    <View key="s2">
      <H1>Where you are today</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xxl }}>
        Four questions about a normal recent day. A rough answer is fine. Trying to be exact
        about it tends to start people going round in circles, which is the thing we are
        here to stop. These are the same four questions you will answer each day.
      </BodySm>

      <H3>How long did you think about how you look?</H3>
      <Caption style={{ marginTop: 2, marginBottom: space.md }}>
        It all counts. Checking, getting ready, keeping away from things, and getting over it
        afterwards.
      </Caption>
      <Options
        options={PREOCCUPATION_BUCKETS}
        value={bucket}
        onChange={setBucket}
        labels={['Under 15 minutes', '15–60 minutes', '1–3 hours', '3–5 hours', 'More than 5 hours']}
      />

      <H3 style={{ marginTop: space.xxl }}>How strong was the pull to check?</H3>
      <Caption style={{ marginTop: 2, marginBottom: space.md }}>
        On a normal day lately.
      </Caption>
      <LevelBar value={urge} onChange={setUrge} words={URGE_WORDS} />

      <H3 style={{ marginTop: space.xxl }}>Did worry about your looks stop you doing something?</H3>
      <Caption style={{ marginTop: 2, marginBottom: space.md }}>
        Think about the last few days.
      </Caption>
      <Options
        options={AVOIDANCE_OPTIONS}
        value={avoidance}
        onChange={setAvoidance}
        labels={AVOIDANCE_LABELS}
      />

      <H3 style={{ marginTop: space.xxl }}>How hard have the days been?</H3>
      <Caption style={{ marginTop: 2, marginBottom: space.md }}>
        Not how you looked. Just how much it hurt.
      </Caption>
      <FaceScale value={suds} onChange={setSuds} />
    </View>,

    null, // the mirror, handled above

    /* 5 — commitment. Self-authored, and it changes what the app actually does. */
    <View key="s4">
      <H1>What you want back</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xxl }}>
        Two answers, both of them yours, and both get used. The first sets your week. The
        second is what you will see on the days it is hard to start.
      </BodySm>

      <H3>How many days a week can you practise?</H3>
      <Caption style={{ marginTop: 2, marginBottom: space.md }}>
        Pick the number you can hit on a bad week, not a good one. Two is a real answer, and
        nothing in here will treat it as a lesser one.
      </Caption>
      <Options
        options={DAYS_OPTIONS as unknown as number[]}
        value={days}
        onChange={setDays}
        labels={DAYS_LABELS}
      />

      <View style={{ marginTop: space.xxl }}>
        <Field
          label="If you got an hour a day back, what would you do with it?"
          hint="One line is plenty. Optional, and it never leaves this phone."
          value={wantBack}
          onChangeText={setWantBack}
          placeholder="Sleep. See people. Stop being late for things."
          multiline
        />
      </View>

      <Field
        label="First name"
        hint="Optional. Only used so the app sounds less like a form."
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Leave blank if you'd rather not"
      />
    </View>,

    /* 6 — evidence in place of social proof. Anneal has no users and will not invent any. */
    <View key="s5">
      <H1>Why these exercises</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>
        Anneal has no reviews to show you and no user count to quote, because it has neither.
        What it has is the reason the exercises are the ones they are.
      </BodySm>

      {PROOF_POINTS.map((p) => (
        <View key={p.stat} style={{ marginBottom: space.xl }}>
          <Rule />
          <Text style={[t.h1, { color: c.accentDeep, marginTop: space.lg }]}>{p.stat}</Text>
          <BodySm style={{ marginTop: space.xs, color: c.ink }}>{p.claim}</BodySm>
          <Caption style={{ marginTop: space.sm }}>{p.source}</Caption>
        </View>
      ))}

      <Caption>{PROOF_QUALIFIER}</Caption>
    </View>,

    /* 7 — disclaimer gate. */
    <View key="s6">
      <H1>Before you start</H1>
      <View
        style={{
          marginTop: space.xl,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: c.warn,
          padding: space.lg,
        }}
      >
        <Body style={{ color: c.ink }}>
          Anneal is a self-help tool. It is not therapy, not a medical device, and not a
          substitute for professional care. It does not diagnose or treat any condition.
        </Body>
        <Body style={{ marginTop: space.md, color: c.ink }}>
          If appearance worry is taking hours of your day, if you are avoiding work, school
          or people, or if you have had thoughts of hurting yourself, please talk to a
          professional. The Support button at the top of every screen has crisis lines and
          guidance on finding a therapist. It is free and always will be.
        </Body>
        <Body style={{ marginTop: space.md, color: c.ink }}>
          If you are in danger right now, contact your local emergency number.
        </Body>
      </View>
      {/* WHICH COUNTRY'S LINES, ASKED WHERE THE SUBJECT ALREADY IS.
          The paragraph above points at crisis lines and at "your local emergency number",
          and until this the app never said which country it thought that was. It guesses from
          the device's region subtag on first launch (hooks/deviceLocale.ts) and the guess is
          conservative — it only names a country on an exact match and otherwise falls to the
          international directory rather than to a confident wrong answer.
          But both of its failure modes were SILENT. A traveller, an immigrant who never
          changed the setting, or anyone on a phone bought abroad gets another country's
          numbers; a phone whose locale carries no region at all gets the directory instead of
          the national line that exists. Neither person finds out until they open Support,
          which is a bad day by definition.
          So it is confirmed here, on the last step, at the calmest moment there is — and it is
          a CONFIRMATION when the guess is confident and a QUESTION when it is not, because
          "we could not tell" deserves a different sentence from "we think it is Canada".
          Not a new step: onboarding is seven already, and this belongs to the paragraph it
          sits under rather than to a screen of its own. */}
      {regionOpen || supportRegion === 'other' ? (
        <View style={{ marginTop: space.lg }}>
          <Body style={{ color: c.ink }}>
            {supportRegion === 'other'
              ? 'We could not tell where you are, so Support will show international directories. Pick a country and it shows lines that work there instead.'
              : 'Which country should Support show crisis lines for?'}
          </Body>
          <View style={{ marginTop: space.md }}>
            <RegionPicker value={supportRegion} onChange={setSupportRegion} />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Support will show crisis lines for ${regionByKey(supportRegion).label}. Change the country.`}
          onPress={() => setRegionOpen(true)}
          style={({ pressed }) => ({ marginTop: space.lg, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <BodySm style={{ color: c.ink }}>
            Support will show crisis lines for{' '}
            <Text style={{ fontWeight: '700' }}>{regionByKey(supportRegion).label}</Text>.{' '}
            <Text style={{ color: c.accentDeep, textDecorationLine: 'underline' }}>Not right?</Text>
          </BodySm>
        </Pressable>
      )}

      <Caption style={{ marginTop: space.lg }}>
        Tapping below records that you have read this. It stays on your device like
        everything else. You can change the country any time on the Support screen.
      </Caption>
    </View>,
  ];

  const canAdvance = step !== BASELINE_STEP || bucket !== null;
  const isLast = step === LAST;

  const label = isLast
    ? 'I understand — start'
    : step === BASELINE_STEP
      ? 'Show me the number'
      : 'Continue';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.xxl,
        paddingBottom: insets.bottom + space.xxl,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, paddingHorizontal: space.lg }}>
        {/* Seven segments. Progress you can see the end of is progress people finish;
            onboarding completion sits at 30–50% across the category and an unbounded flow
            is a large part of why. */}
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: space.xxl }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: radius.pill,
                backgroundColor: i <= step ? c.accent : c.surfaceStrong,
              }}
            />
          ))}
        </View>

        {steps[step]}

        <View style={{ marginTop: space.xxl }}>
          <Button label={label} onPress={() => (isLast ? finish() : setStep(step + 1))} disabled={!canAdvance} />

          {step > 0 && !isLast && (
            <Button
              label="Back"
              variant="ghost"
              onPress={() => setStep(step - 1)}
              style={{ marginTop: space.xs }}
            />
          )}

          {/* Skippable up to the baseline questions, per spec. Past that point there is
              nothing left worth skipping — the number is the reason to be here. */}
          {step < BASELINE_STEP && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep(BASELINE_STEP)}
              style={({ pressed }) => ({ paddingVertical: space.md, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[t.bodySm, { color: c.inkFaint, textAlign: 'center' }]}>
                Skip to the questions
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
