import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, H1, H2, Body, BodySm, Caption, useTheme } from '../components/ui';
import { Frost, TopBar } from '../components/frost';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { useStore } from '../store/useStore';
import { haptic } from '../hooks/haptics';
import {
  INSTRUMENTS, CHOICES, MEASURE_INTRO, MEASURE_SKIP, MEASURE_DONE_TITLE, MEASURE_DONE_BODY,
  MEASURE_NOT_A_DIAGNOSIS, MEASURE_DUE_TITLE, MEASURE_DUE_BODY,
} from '../content/measure.ts';
import { MAX, score, DUE_DAYS } from '../lib/measure.ts';
import { NAMES } from '../content/names';

/* PHQ-8 and GAD-7.
 *
 * WHY THIS SCREEN EXISTS. DIRECTION.md defines winning as measurable PHQ and GAD improvement
 * at 30, 60 and 90 days. The daily check-in measures appearance preoccupation in minutes,
 * which is the right number for the person and cannot produce that claim. This is the claim.
 *
 * WHAT IT IS NOT, AND THE LINE IT WILL NOT CROSS. `content/survey.ts` opens by saying the
 * opening survey "does not produce a diagnosis, a score, or a label", and that rule is not
 * being quietly relaxed here — it is being kept by putting the instrument somewhere else.
 * The tile survey still scores nothing. This screen produces two integers, calls them a
 * starting point, and refuses to say what they mean about anybody. There is no severity band
 * in the code and there must never be one: `lib/measure.ts` deliberately has no function that
 * turns 14 into a word, because the moment one exists somebody will render it.
 *
 * IT IS ALWAYS FREE AND IT IS ALWAYS SKIPPABLE. Free because it is how a person tells whether
 * the thing they may be paying for is working, and putting that behind the payment would be
 * the worst possible thing to charge for. Skippable because fifteen questions about the worst
 * fortnight of somebody's year is a lot to ask at the door, and the brief is explicit that
 * this should feel like the beginning of something rather than a gate.
 *
 * ONE QUESTION PER SCREEN, deliberately. A grid of fifteen rows is a form, it is the single
 * most clinical-looking object this app could render, and it invites scanning down the column
 * of "Not at all" — which is a real measurement problem, not just an aesthetic one.
 *
 * NO CRISIS INFERENCE. A high total does not trigger anything. `content/survey.ts` states the
 * rule and the reason: risk classification from instrument scores is unvalidated here, and a
 * false positive teaches somebody the app is watching them. Support is one tap from every
 * screen including this one, and the therapy guidance is on it. */

/** Every item, flattened, so the screen is a simple index over one list rather than nested
 *  loops over instruments. Derived from INSTRUMENTS — a second list would drift the first
 *  time an instrument changed. */
interface Step {
  instrument: (typeof INSTRUMENTS)[number];
  /** Index within that instrument. */
  i: number;
  text: string;
  /** True on the first item of each instrument, which is where the stem is shown. */
  first: boolean;
}

const STEPS: Step[] = INSTRUMENTS.flatMap((instrument) =>
  instrument.items.map((text, i) => ({ instrument, i, text, first: i === 0 })),
);

export default function Measure() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ milestone?: string }>();
  const saveMeasure = useStore((s) => s.saveMeasure);
  const skipMeasure = useStore((s) => s.skipMeasure);

  /* The milestone arrives as a deep-link param, so it is validated against the closed set
     rather than parsed and trusted — the same rule every other query param in this app
     follows. Anything else is a voluntary retake, which is what null means. */
  const milestone = useMemo(() => {
    const n = Number(params.milestone);
    return DUE_DAYS.includes(n as (typeof DUE_DAYS)[number]) ? n : null;
  }, [params.milestone]);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => STEPS.map(() => null));
  const [done, setDone] = useState<{ phq8: number | null; gad7: number | null } | null>(null);

  /* Where PHQ-8 ends and GAD-7 begins in the flattened list. Derived from the instrument
     rather than written as 8, so the split cannot disagree with the questions on screen. */
  const split = INSTRUMENTS[0].items.length;

  const finish = (all: (number | null)[]) => {
    const p = all.slice(0, split).filter((x): x is number => x !== null);
    const g = all.slice(split).filter((x): x is number => x !== null);
    saveMeasure(p, g, milestone);
    setDone({ phq8: score('phq8', p), gad7: score('gad7', g) });
  };

  const answer = (value: number) => {
    haptic.select();
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    if (step + 1 < STEPS.length) setStep(step + 1);
    else finish(next);
  };

  /* Onboarding arrives here with `replace`, so there is no history to go back to on a first
     run — but the Practice screen and the day-30 ask both `push`, and those should return
     where they came from. `canGoBack` is the only thing that can tell the two apart; without
     it, skipping the baseline on a fresh install goes nowhere at all. */
  const exit = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const leave = () => {
    skipMeasure();
    exit();
  };

  /* ---------- the finished state ---------- */
  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {/* They answered, so leaving is not a decline — plain back, no skip stamp. */}
        <TopBar onBack={exit} title={NAMES.measure.title} />
        <ScrollView
          contentContainerStyle={{
            padding: space.lg,
            paddingBottom: insets.bottom + space.xxl,
            maxWidth: LAYOUT_MAX_WIDTH,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <H1>{MEASURE_DONE_TITLE}</H1>
          <Body style={{ marginTop: space.md, color: c.ink }}>{MEASURE_DONE_BODY}</Body>

          <View style={{ marginTop: space.xl, gap: space.md }}>
            {INSTRUMENTS.map((ins) => {
              const value = ins.key === 'phq8' ? done.phq8 : done.gad7;
              /* No padding or radius passed to Frost: it applies both to its own inner
                 surface, and setting them again out here wrapped every card in a second one. */
              return (
                <Frost key={ins.key}>
                  <Caption style={{ color: c.inkSoft }}>{ins.plainName}</Caption>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: space.xs }}>
                    <Text style={[t.hero, { color: c.ink, fontSize: 40, lineHeight: 44 }]}>
                      {value ?? '—'}
                    </Text>
                    {/* marginLeft rather than the row's `gap`, which does not survive baseline
                        alignment on react-native-web — it rendered "12out of 24". */}
                    <Text style={[t.bodySm, { color: c.inkSoft, marginLeft: space.sm }]}>
                      out of {MAX[ins.key]}
                    </Text>
                  </View>
                  <Caption style={{ marginTop: space.sm, color: c.inkFaint }}>{ins.attribution}</Caption>
                </Frost>
              );
            })}
          </View>

          {/* Under the numbers every single time. Not dismissible and not a footnote: a pair
              of integers this shape, in an app about mental health, invites exactly the
              reading this sentence refuses. */}
          <BodySm style={{ marginTop: space.lg, color: c.inkSoft }}>{MEASURE_NOT_A_DIAGNOSIS}</BodySm>

          <Button label="Done" onPress={exit} style={{ marginTop: space.xl }} />
        </ScrollView>
      </View>
    );
  }

  /* ---------- the offer ---------- */
  if (!started) {
    const lines = milestone ? [MEASURE_DUE_BODY] : MEASURE_INTRO;
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {/* Leaving without finishing is a decline, and is stamped as one so the app does not
            re-offer on the next launch. */}
        <TopBar onBack={leave} title={NAMES.measure.title} />
        <ScrollView
          contentContainerStyle={{
            padding: space.lg,
            paddingBottom: insets.bottom + space.xxl,
            maxWidth: LAYOUT_MAX_WIDTH,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <H1>{milestone ? MEASURE_DUE_TITLE : 'Where you are starting from'}</H1>
          {lines.map((line) => (
            <Body key={line} style={{ marginTop: space.md, color: c.ink }}>
              {line}
            </Body>
          ))}

          <Button label="Start" onPress={() => setStarted(true)} style={{ marginTop: space.xl }} />

          {/* The way out is on the same screen as the way in, at the same weight class as a
              real control, and it says what it does rather than "maybe later". */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={MEASURE_SKIP}
            onPress={leave}
            style={({ pressed }) => ({
              marginTop: space.md,
              minHeight: 44,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={[t.label, { color: c.accentDeep }]}>{MEASURE_SKIP}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  /* ---------- one item ---------- */
  const s = STEPS[step];
  const answered = answers[step];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={leave} title={NAMES.measure.title} />
      <ScrollView
        contentContainerStyle={{
          padding: space.lg,
          paddingBottom: insets.bottom + space.xxl,
          maxWidth: LAYOUT_MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Caption style={{ color: c.inkFaint }}>
          {step + 1} of {STEPS.length}
        </Caption>

        {/* The stem is repeated at the top of each instrument rather than shown once and
            trusted to be remembered. "Over the last 2 weeks" is the part people forget, and
            an item answered about today instead of the fortnight is a wrong measurement
            rather than a wrong opinion. */}
        {s.first ? (
          <Body style={{ marginTop: space.sm, color: c.inkSoft }}>{s.instrument.stem}</Body>
        ) : null}

        <H2 style={{ marginTop: s.first ? space.lg : space.md }}>{s.text}</H2>

        <View style={{ marginTop: space.xl, gap: space.sm }}>
          {CHOICES.map((choice) => {
            const on = answered === choice.value;
            return (
              <Pressable
                key={choice.value}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => answer(choice.value)}
                style={({ pressed }) => ({
                  minHeight: 56,
                  justifyContent: 'center',
                  paddingHorizontal: space.lg,
                  borderRadius: radius.card,
                  backgroundColor: on ? c.accent : c.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: on ? c.accent : c.line,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={[t.body, { color: on ? c.onAccent : c.ink }]}>{choice.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.xl }}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to the previous question"
              onPress={() => setStep(step - 1)}
              style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[t.label, { color: c.accentDeep }]}>Back</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop answering and go back"
            onPress={leave}
            style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[t.label, { color: c.inkSoft }]}>Not now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
