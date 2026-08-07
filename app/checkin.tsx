import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Button, H1, BodySm, Caption, Options, Scale, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import { space, radius, type as t, LAYOUT_MAX_WIDTH, atmosphereForHour } from '../constants/theme';
import { useStore } from '../store/useStore';
import {
  PREOCCUPATION_BUCKETS, PREOCCUPATION_MINUTES, type PreoccupationBucket, type AvoidanceLevel,
} from '../types';
import { computeReclaimed, checkInsInLastDays, reclaimedCopy, previousWeekCheckIns } from '../lib/reclaimed';

const AVOIDANCE_OPTIONS: AvoidanceLevel[] = ['none', 'small', 'significant'];

export default function CheckIn() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    addCheckIn({
      preoccupationMinutes: PREOCCUPATION_MINUTES[bucket ?? '1-3h'],
      urge: urge ?? 0,
      avoidance: avoidance ?? 'none',
      suds: suds ?? 0,
    });
    const next = useStore.getState().checkIns;
    setResult(
      computeReclaimed(baseline, checkInsInLastDays(next, 7), 7, previousWeekCheckIns(next))
    );
    setDone(true);
  };

  /* The finish state is the one moment in the day this app gets to say something back.
     It gets the full frame — a flat card here would make four honest answers feel like
     submitting a form. */
  if (done) {
    const r = result ?? computeReclaimed(baseline, [], 7);
    const copy = reclaimedCopy(r, profile.firstName);
    const showNumber = r.hasData && r.sampleSize >= 3;

    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, flex: 1 }}>
            <Atmosphere variant={atmosphereForHour()} rounded="none" style={{ flex: 1, minHeight: 460 }}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  paddingTop: insets.top + space.xxl,
                  paddingHorizontal: space.lg,
                  paddingBottom: space.xl,
                }}
              >
                <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)' }]}>Logged for today</Text>
                {showNumber ? (
                  <Text style={[t.hero, { color: '#fff', marginTop: space.sm }]}>
                    {Math.abs(r.hours)}
                    <Text style={[t.h2, { color: 'rgba(255,255,255,0.66)' }]}>  hours</Text>
                  </Text>
                ) : (
                  <Text style={[t.display, { color: '#fff', marginTop: space.sm }]}>{copy.headline}</Text>
                )}
                <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.md, maxWidth: 340 }]}>
                  {copy.sub}
                </Text>
              </View>
            </Atmosphere>

            <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: insets.bottom + space.xl }}>
              <Button label="Done" onPress={() => router.replace('/')} />
            </View>
          </View>
        </ScrollView>
      </View>
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
        {/* Four segments, not a percentage. A bar that creeps is a bar you watch.
            Sits below the always-mounted Support pill rather than running under it. */}
        <View style={{ flexDirection: 'row', gap: 5, marginTop: space.lg, marginBottom: space.xl }}>
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

        <Caption>
          {step + 1} of {steps.length}
        </Caption>
        <H1 style={{ marginTop: space.xs }}>{s.title}</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>{s.hint}</BodySm>

        {s.node}

        <View
          style={{
            marginTop: space.xxl,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.line,
            paddingTop: space.lg,
          }}
        >
          <Button
            label={isLast ? 'Save today' : 'Next'}
            disabled={!s.valid}
            onPress={() => (isLast ? save() : setStep(step + 1))}
          />
          <Button
            label={step > 0 ? 'Back' : 'Not now'}
            variant="ghost"
            onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
            style={{ marginTop: space.xs }}
          />
        </View>
      </View>
    </Screen>
  );
}
