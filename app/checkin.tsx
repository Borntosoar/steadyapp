import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, Body, BodySm, Caption, Options, Scale, useTheme,
} from '../components/ui';
import { space, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import {
  PREOCCUPATION_BUCKETS, PREOCCUPATION_MINUTES, type PreoccupationBucket, type AvoidanceLevel,
} from '../types';
import { computeReclaimed, checkInsInLastDays, reclaimedCopy } from '../lib/reclaimed';
import { Text } from 'react-native';

const AVOIDANCE_OPTIONS: AvoidanceLevel[] = ['none', 'small', 'significant'];

export default function CheckIn() {
  const c = useTheme();
  const router = useRouter();
  const addCheckIn = useStore((s) => s.addCheckIn);
  const baseline = useStore((s) => s.baseline);
  const profile = useStore((s) => s.profile);

  const [step, setStep] = useState(0);
  const [bucket, setBucket] = useState<PreoccupationBucket | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [avoidance, setAvoidance] = useState<AvoidanceLevel | null>(null);
  const [suds, setSuds] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof computeReclaimed> | null>(null);

  const save = () => {
    const entry = {
      preoccupationMinutes: PREOCCUPATION_MINUTES[bucket ?? '1-3h'],
      urge: urge ?? 0,
      avoidance: avoidance ?? 'none',
      suds: suds ?? 0,
    };
    addCheckIn(entry);
    const next = useStore.getState().checkIns;
    setResult(computeReclaimed(baseline, checkInsInLastDays(next, 7), 7));
    setDone(true);
  };

  if (done) {
    const r = result ?? computeReclaimed(baseline, [], 7);
    const copy = reclaimedCopy(r, profile.firstName);
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <Card>
            {r.hasData && r.sampleSize >= 3 ? (
              <Text style={[t.hero, { color: r.direction === 'up' ? c.accentDeep : c.ink }]}>
                {Math.abs(r.hours)}
                <Text style={[t.h2, { color: c.inkSoft }]}>  hrs</Text>
              </Text>
            ) : null}
            <H2 style={{ marginTop: space.sm }}>{copy.headline}</H2>
            <Body style={{ marginTop: space.sm, color: c.inkSoft }}>{copy.sub}</Body>
          </Card>
          <Button label="Done" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const steps = [
    {
      title: 'Time spent thinking about your appearance today',
      hint: 'Rough is fine. Add up the scattered bits.',
      valid: bucket !== null,
      node: (
        <Options
          options={PREOCCUPATION_BUCKETS}
          value={bucket}
          onChange={setBucket}
          labels={['Under 15 minutes', '15–60 minutes', '1–3 hours', '3–5 hours', 'More than 5 hours']}
        />
      ),
    },
    {
      title: 'How strong was the urge to check?',
      hint: 'Mirrors, reflections, the front camera, asking someone.',
      valid: urge !== null,
      node: <Scale value={urge} onChange={setUrge} lowLabel="None" highLabel="Constant" />,
    },
    {
      title: 'Did appearance worry stop you doing something today?',
      hint: 'This is the one that tends to move last, and matters most.',
      valid: avoidance !== null,
      node: (
        <Options
          options={AVOIDANCE_OPTIONS}
          value={avoidance}
          onChange={setAvoidance}
          labels={[
            'No — I did what I planned to',
            'A small amount — I changed something',
            'Significantly — I skipped or cancelled',
          ]}
        />
      ),
    },
    {
      title: 'Overall distress today',
      hint: 'Not how you looked. How much it hurt.',
      valid: suds !== null,
      node: <Scale value={suds} onChange={setSuds} lowLabel="None" highLabel="The worst it gets" />,
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <Caption>
          {step + 1} of {steps.length}
        </Caption>
        <H1 style={{ marginTop: space.xs }}>{s.title}</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.lg }}>{s.hint}</BodySm>

        <Card>{s.node}</Card>

        <Button
          label={isLast ? 'Save' : 'Next'}
          disabled={!s.valid}
          onPress={() => (isLast ? save() : setStep(step + 1))}
        />
        {step > 0 && (
          <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} style={{ marginTop: space.sm }} />
        )}
      </View>
    </Screen>
  );
}
