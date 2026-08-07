import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, Body, BodySm, H1, H2, Caption, Options, Scale, useTheme, Label,
} from '../../components/ui';
import { space, radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import {
  PREOCCUPATION_BUCKETS, PREOCCUPATION_MINUTES, type PreoccupationBucket, type AvoidanceLevel,
} from '../../types';

const AVOIDANCE_OPTIONS: AvoidanceLevel[] = ['none', 'small', 'significant'];
const AVOIDANCE_LABELS = [
  'No — I did what I planned to do',
  'A small amount — I changed something',
  'Significantly — I skipped or cancelled something',
];

export default function Onboarding() {
  const c = useTheme();
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const acceptDisclaimer = useStore((s) => s.acceptDisclaimer);

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [bucket, setBucket] = useState<PreoccupationBucket | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [avoidance, setAvoidance] = useState<AvoidanceLevel | null>(null);
  const [suds, setSuds] = useState<number | null>(null);

  const finish = () => {
    completeOnboarding(
      {
        capturedAt: new Date().toISOString(),
        preoccupationMinutes: PREOCCUPATION_MINUTES[bucket ?? '1-3h'],
        urge: urge ?? 5,
        avoidance: avoidance ?? 'small',
        suds: suds ?? 5,
      },
      firstName.trim() || undefined
    );
    acceptDisclaimer();
    router.replace('/');
  };

  const steps = [
    // 1 — what this is and isn't
    <Card key="s0" tone="plain">
      <H1>Steady</H1>
      <Body style={{ marginTop: space.md }}>
        Steady is a self-help tool for appearance worry. It is built around one idea: this
        problem steals time, and the point is to get that time back.
      </Body>
      <Body style={{ marginTop: space.md }}>
        It is not treatment, and it is not a doctor. It does not diagnose anything. Many
        people find structured practice like this useful, and some people need more than an
        app — those two things are both true and neither cancels the other.
      </Body>
      <Card tone="accent" style={{ marginTop: space.lg }}>
        <Label>What it will never do</Label>
        <Body style={{ marginTop: space.sm }}>
          There is no camera roll, no photo, no filter, no rating of how you look, and no
          before-and-after. Nothing in Steady measures your appearance.
        </Body>
      </Card>
    </Card>,

    // 2 — privacy
    <Card key="s1" tone="plain">
      <H1>This stays on your device</H1>
      <Body style={{ marginTop: space.md }}>
        Everything you write is stored locally, in this app, on this device. There is no
        account to make. There is no server to send it to. Nobody — including us — can read it.
      </Body>
      <Body style={{ marginTop: space.md }}>
        That also means there is no backup. If you delete the app, it is gone. You can export
        a plain-text copy whenever you want, including one to take to a clinician.
      </Body>
    </Card>,

    // 3 — the pitch
    <Card key="s2" tone="plain">
      <H1>The hours question</H1>
      <Body style={{ marginTop: space.md }}>
        Appearance worry costs most people somewhere between one and five hours a day —
        thinking about it, checking, getting ready, avoiding things, recovering afterwards.
      </Body>
      <Body style={{ marginTop: space.md }}>
        Steady is twelve weeks of getting those hours back. That is the only thing it measures
        and the only thing it will ever ask you to improve.
      </Body>
      <Body style={{ marginTop: space.md, fontWeight: '600', color: c.accentDeep }}>
        Next we take your starting number. It is four questions, and it is the "before" that
        everything else gets compared to.
      </Body>
    </Card>,

    // 4 — baseline capture
    <View key="s3">
      <H1>Where you are today</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.lg }}>
        Answer for a typical recent day. Rough is fine — precision is not the point, and
        trying to be exact about this tends to make people ruminate.
      </BodySm>

      <Card>
        <H2>Time spent thinking about your appearance</H2>
        <BodySm style={{ marginBottom: space.md }}>On a typical day recently.</BodySm>
        <Options
          options={PREOCCUPATION_BUCKETS}
          value={bucket}
          onChange={setBucket}
          labels={['Under 15 minutes', '15–60 minutes', '1–3 hours', '3–5 hours', 'More than 5 hours']}
        />
      </Card>

      <Card>
        <H2>Urge to check</H2>
        <BodySm style={{ marginBottom: space.md }}>
          Mirrors, reflections, front camera, asking someone. How strong, typically?
        </BodySm>
        <Scale value={urge} onChange={setUrge} lowLabel="None" highLabel="Constant" />
      </Card>

      <Card>
        <H2>Did appearance worry stop you doing something?</H2>
        <BodySm style={{ marginBottom: space.md }}>Thinking about the last few days.</BodySm>
        <Options options={AVOIDANCE_OPTIONS} value={avoidance} onChange={setAvoidance} labels={AVOIDANCE_LABELS} />
      </Card>

      <Card>
        <H2>Overall distress</H2>
        <BodySm style={{ marginBottom: space.md }}>How much it has been hurting, in general.</BodySm>
        <Scale value={suds} onChange={setSuds} lowLabel="None" highLabel="The worst it gets" />
      </Card>

      <Card>
        <H2>First name</H2>
        <BodySm style={{ marginBottom: space.md }}>Optional. Only used to make the app sound less like a form.</BodySm>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Leave blank if you'd rather not"
          placeholderTextColor={c.inkFaint}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.line,
            borderRadius: radius.md,
            padding: space.md,
            color: c.ink,
            backgroundColor: c.bg,
            minHeight: 48,
          }}
        />
      </Card>
    </View>,

    // 5 — disclaimer gate
    <Card key="s4" tone="plain">
      <H1>Before you start</H1>
      <Card tone="accent" style={{ marginTop: space.lg }}>
        <Body>
          Steady is a self-help tool. It is not therapy, not a medical device, and not a
          substitute for professional care. It does not diagnose or treat any condition.
        </Body>
        <Body style={{ marginTop: space.md }}>
          If appearance worry is taking hours of your day, if you are avoiding work, school or
          people, or if you have had thoughts of hurting yourself, please talk to a
          professional. The Support button at the top of every screen has crisis lines and
          guidance on finding a therapist — it is free and always will be.
        </Body>
        <Body style={{ marginTop: space.md }}>
          If you are in danger right now, contact your local emergency number.
        </Body>
      </Card>
      <Caption style={{ marginTop: space.lg }}>
        Tapping below records that you have read this. It stays on your device like everything else.
      </Caption>
    </Card>,
  ];

  const canAdvance = step !== 3 || (bucket !== null && urge !== null && avoidance !== null && suds !== null);
  const isLast = step === steps.length - 1;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>{steps[step]}</View>

      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: space.lg }}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: i === step ? c.accent : c.line,
            }}
          />
        ))}
      </View>

      <Button
        label={isLast ? 'I understand — start' : step === 3 ? 'Save my starting number' : 'Continue'}
        onPress={() => (isLast ? finish() : setStep(step + 1))}
        disabled={!canAdvance}
      />

      {step > 0 && !isLast && (
        <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} style={{ marginTop: space.sm }} />
      )}

      {/* Every screen except the disclaimer is skippable, per spec. */}
      {step < 3 && (
        <Button label="Skip the introduction" variant="ghost" onPress={() => setStep(3)} style={{ marginTop: space.xs }} />
      )}
    </Screen>
  );
}
