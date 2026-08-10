import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, H1, BodySm, Caption, Options } from '../components/ui';
import { Frost, FaceScale, LevelBar, WeekStrip, TopBar, Steps, Ground } from '../components/frost';
import { Finish } from '../components/Finish';
import { space } from '../constants/theme';
import { useStore } from '../store/useStore';
import {
  PREOCCUPATION_BUCKETS, PREOCCUPATION_MINUTES, type PreoccupationBucket, type AvoidanceLevel,
} from '../types';
import { computeReclaimed, checkInsInLastDays, reclaimedCopy, previousWeekCheckIns } from '../lib/reclaimed';
import { lastSevenDays } from '../lib/week';

/* The daily check-in.
 *
 * Rebuilt around two changes that between them cut this from about eight taps to four.
 *
 * 1. FACES, NOT AN ELEVEN-BUTTON GRID. A row of eleven numbered buttons asks somebody to
 *    quantify how bad they feel before they have started, which is a small act of
 *    rumination, and eleven targets is a Hick's Law violation aimed at a group defined by
 *    over-deliberating about themselves. Five faces ask the same question the way a person
 *    would ask it. The stored value is still 0-10, so every chart, export and test is
 *    untouched.
 * 2. SELECTING ADVANCES. Tapping an answer and then tapping Next is asking twice.
 *
 * The distress question moved to the front so that tapping "How is today going?" on the
 * home screen lands you directly on the row of faces that answers it. */

const AVOIDANCE_OPTIONS: AvoidanceLevel[] = ['none', 'small', 'significant'];

export default function CheckIn() {
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

  /* Selecting an answer moves on by itself, after a beat long enough to see the selection
     land. Without the pause the screen changes before the tap has registered visually and
     it reads as a glitch rather than as progress. */
  const advance = <T,>(set: (v: T) => void, isLast: boolean) => (v: T) => {
    set(v);
    if (isLast) return;
    setTimeout(() => setStep((s) => s + 1), 260);
  };

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

  if (done) {
    const r = result ?? computeReclaimed(baseline, [], 7);
    const copy = reclaimedCopy(r, profile.firstName);
    const showNumber = r.hasData && r.sampleSize >= 3;

    /* The week strip, with today's dot already filled — the same object that will be
       waiting on the home screen tomorrow. This is the beat that closes the loop: it says
       the thing you just did counted, and it shows you where it went. */
    const days = lastSevenDays(useStore.getState().practice.map((p) => p.date));

    return (
      <Finish
        eyebrow="Saved for today"
        figure={showNumber ? Math.abs(r.hours) : null}
        figureUnit="hours"
        headline={showNumber ? copy.headline : 'That is today done'}
        body={copy.sub}
        onDone={() => router.replace('/')}
      >
        <Frost>
          <Caption style={{ marginBottom: space.md }}>Your last seven days</Caption>
          <WeekStrip days={days} />
        </Frost>
      </Finish>
    );
  }

  const steps = [
    {
      title: 'How hard was today?',
      hint: 'Not how you looked. Just how much it hurt.',
      valid: suds !== null,
      node: <FaceScale value={suds} onChange={advance(setSuds, false)} />,
    },
    {
      title: 'How long did you think about how you look?',
      hint: 'A rough guess is fine. Add up the small bits.',
      valid: bucket !== null,
      node: (
        <Options
          options={PREOCCUPATION_BUCKETS}
          value={bucket}
          onChange={advance(setBucket, false)}
          labels={[
            'Less than 15 minutes',
            '15 minutes to an hour',
            '1 to 3 hours',
            '3 to 5 hours',
            'More than 5 hours',
          ]}
        />
      ),
    },
    {
      title: 'How strong was the pull to check?',
      hint: 'Nought is none. Ten is you could not stop.',
      valid: urge !== null,
      node: <LevelBar value={urge} onChange={setUrge} lowLabel="None" highLabel="Could not stop" />,
    },
    {
      title: 'Did worry about your looks stop you doing something?',
      hint: 'This one takes the longest to shift. It also matters most.',
      valid: avoidance !== null,
      node: (
        <Options
          options={AVOIDANCE_OPTIONS}
          value={avoidance}
          onChange={setAvoidance}
          labels={[
            'No, I did what I planned',
            'A little, I changed something',
            'Yes, I skipped it',
          ]}
        />
      ),
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Ground>
      <TopBar onBack={() => (step > 0 ? setStep(step - 1) : router.back())} />

      <Steps total={steps.length} current={step} />

      <Caption style={{ marginTop: space.lg }}>
        Question {step + 1} of {steps.length}
      </Caption>
      <H1 style={{ marginTop: space.xs }}>{s.title}</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>{s.hint}</BodySm>

      <Frost>{s.node}</Frost>

      {/* Only two of the four steps still need a button. On the others the answer IS the
          button, so a Next would be a second way to do the same thing. */}
      <View style={{ marginTop: space.xl }}>
        {isLast ? (
          <Button label="Save today" disabled={!s.valid} onPress={save} />
        ) : step === 2 ? (
          <Button label="Next" disabled={!s.valid} onPress={() => setStep(step + 1)} />
        ) : (
          <Button label="Not now" variant="ghost" onPress={() => router.back()} />
        )}
      </View>
    </Ground>
  );
}
