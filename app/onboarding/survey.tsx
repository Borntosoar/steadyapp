import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Body, BodySm, Caption, H2, Button, useTheme } from '../../components/ui';
import { TopBar } from '../../components/frost';
import { Atmosphere } from '../../components/Atmosphere';
import { Motif } from '../../components/Motif';
import { groundFor } from '../../lib/motif.ts';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { haptic } from '../../hooks/haptics';
import { QUESTIONS, CRISIS_TILE, type Tile } from '../../content/survey.ts';
import { planFor, isCrisis, type Answers, type Plan } from '../../lib/plan.ts';

/* The opening survey.
 *
 * Three questions, one per screen, answered by picking a landscape. Then a sentence about
 * what somebody said, and three things that already exist. content/survey.ts holds the
 * questions and the reasoning; lib/plan.ts holds what the answers configure.
 *
 * TWO THINGS ON THIS SCREEN ARE NOT NEGOTIABLE.
 *
 * The crisis answer is an explicit tile in plain words, and choosing it ends the survey on
 * the spot and opens Support. No reflection, no games, no "and here are three things for
 * you". The app must never try to infer this from anything else — risk classification from
 * wording or play patterns is unvalidated, and a false positive teaches somebody the app is
 * watching them.
 *
 * And there is a way out of every screen, always visible, per the brief's escape hatch. It
 * is the same principle as the games' "Not this one": an app that makes you answer questions
 * about the worst thing in your life before it will show you anything is a gate, and the
 * brief is explicit that this should feel like the beginning of something rather than a gate.
 *
 * WHAT REPLACES THE PROGRESS BAR. A seedling of three dots that fills as you go — the brief
 * asked for a growing element rather than a form counting down, and a bar with "1 of 3" on
 * it is the single most form-like object available. */

export default function Survey() {
  const router = useRouter();
  const c = useTheme();
  const saveSurvey = useStore((s) => s.saveSurvey);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [plan, setPlan] = useState<Plan | null>(null);

  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];
  const KEYS: (keyof Answers)[] = ['brought', 'tried', 'worst'];

  /* The ground moves with the tile somebody is hovering over conceptually — before any pick
     it is the first tile's, so the screen already looks like somewhere. */
  const ground = groundFor(q.tiles[0].mood, c.isDark);

  const answer = (tile: Tile) => {
    haptic.select();
    const next: Answers = { ...answers, [KEYS[step]]: tile.key };
    setAnswers(next);

    if (tile.key === CRISIS_TILE) {
      /* Straight out. Nothing is saved, nothing is configured, and the survey does not
         resume afterwards — somebody who answered this is not then asked two more questions
         about their week. */
      router.replace('/support');
      return;
    }

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
      return;
    }
    const made = planFor(next);
    saveSurvey(next, made.carrying);
    setPlan(made);
  };

  const skip = () => {
    /* "Just let me look around." Recorded as an answer rather than as nothing, so the app
       knows to offer this again later rather than assuming it was completed. */
    saveSurvey({ brought: 'looking' }, 'looking');
    router.replace('/onboarding');
  };

    /* On to the existing flow rather than the home screen: that is where the disclaimer is
     accepted, and consent is not something a survey can skip past. */
  if (plan) return <Result plan={plan} onDone={() => router.replace('/onboarding')} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere variant={ground} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />
      <Stage>
        <TopBar onBack={step === 0 ? skip : () => setStep(step - 1)} />
        <Seedling total={QUESTIONS.length} done={step} />

        <View style={{ gap: space.sm, paddingTop: space.xl, paddingBottom: space.lg }}>
          <H2>{q.ask}</H2>
          {q.note && <BodySm>{q.note}</BodySm>}
        </View>

        <View style={{ gap: space.sm }}>
          {q.tiles.map((tile) => (
            <LandscapeTile
              key={tile.key}
              tile={tile}
              crisis={tile.key === CRISIS_TILE}
              onPress={() => answer(tile)}
            />
          ))}
        </View>

        <View style={{ paddingTop: space.xl, alignItems: 'center' }}>
          <Button label="Just let me look around" variant="ghost" onPress={skip} />
        </View>
      </Stage>
    </View>
  );
}

/* ---------- layout ----------
 *
 * Transparent, for the same reason the games have one: `Screen` paints an opaque background
 * and would cover the atmosphere behind it. */

function Stage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: '100%',
          maxWidth: LAYOUT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: space.lg,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}

/** Three dots that fill. Not a bar, not "1 of 3" — the brief asked for something growing
 *  rather than a form counting down, and a counter is the most form-like object there is. */
function Seedling({ total, done }: { total: number; done: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 7, paddingTop: space.sm }}>
      <Svg width={total * 17} height={12}>
        {Array.from({ length: total }, (_, i) => (
          <Circle
            key={i}
            cx={6 + i * 17}
            cy={6}
            r={i <= done ? 5 : 3}
            fill={i <= done ? c.accent : 'none'}
            stroke={c.lineStrong}
            strokeWidth={1.4}
          />
        ))}
      </Svg>
    </View>
  );
}

/* ---------- a landscape tile ----------
 *
 * The brief asked for texture rather than text buttons or emoji, and the app already had the
 * machinery: an atmosphere ramp with a motif on it, exactly as the games draw their scenes.
 * So an answer reads as a time of day and a weather before it reads as a category, which is
 * closer to how any of this actually arrives. */

function LandscapeTile({
  tile, crisis, onPress,
}: { tile: Tile; crisis: boolean; onPress: () => void }) {
  const c = useTheme();
  const ground = groundFor(tile.mood, c.isDark);

  /* The crisis answer is deliberately NOT a landscape. Everything else on this screen is
     something to browse; that one is not, and dressing it as weather would be the single
     worst decision available on this screen. */
  if (crisis) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tile.label}
        onPress={onPress}
        style={{
          backgroundColor: c.surfaceSolid,
          borderColor: c.rose,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderRadius: radius.md,
          padding: space.lg,
          minHeight: 56,
          justifyContent: 'center',
          marginTop: space.md,
        }}
      >
        <Text style={[t.body, { color: c.ink }]}>{tile.label}</Text>
        <Text style={[t.caption, { color: c.inkFaint, paddingTop: 2 }]}>
          This opens support straight away.
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tile.label}
      onPress={onPress}
      style={{
        borderRadius: radius.card,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.lineStrong,
        minHeight: 84,
        justifyContent: 'center',
      }}
    >
      <Atmosphere variant={ground} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />
      <Motif kind={tile.motif} seed={tile.key} color={c.ink} isDark={c.isDark} inset={10} />
      <Text style={[t.body, { color: c.ink, padding: space.lg }]}>{tile.label}</Text>
    </Pressable>
  );
}

/* ---------- the result ----------
 *
 * The brief calls this the moment somebody decides whether to trust the app, and the way to
 * lose it is to over-reach. So: one sentence describing what they said, three things that
 * already exist, and the stone. No score, no label, no condition, and no promise about how
 * any of it will go. */

function Result({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const c = useTheme();
  const ground = groundFor('morning', c.isDark);

  const things = [
    plan.order[0] === '/game/toward'
      ? 'Toward — five moments, and what each one costs to get past'
      : 'Curveball — three people, and the hour before',
    plan.order[0] === '/game/toward'
      ? 'Curveball — three people, and the hour before'
      : 'Toward — five moments, and what each one costs to get past',
    `${plan.calm} — free, always, and never behind a week`,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere variant={ground} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />
      <Stage>
        <View style={{ paddingTop: space.xxl, gap: space.lg }}>
          <Caption>What you said</Caption>
          <Body>{plan.reflection}</Body>

          <View style={{ paddingTop: space.lg, gap: space.sm }}>
            <Caption>Built already, and here now</Caption>
            {things.map((line) => (
              <Text key={line} style={[t.bodySm, { color: c.ink }]}>
                {line}
              </Text>
            ))}
          </View>

          {/* The stone. Given for arriving, never for completing anything — lib/plan.ts has
              the reasoning, and the short version is that a memento is not a contingent
              reward and the evidence against the second does not touch the first. */}
          <View
            style={{
              marginTop: space.lg,
              padding: space.lg,
              borderRadius: radius.card,
              backgroundColor: c.surfaceSolid,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.lineStrong,
              gap: space.xs,
            }}
          >
            <Text style={[t.label, { color: c.inkFaint }]}>Yours, from here on</Text>
            <Text style={[t.h3, { color: c.ink }]}>{plan.stone.name}</Text>
            <Text style={[t.bodySm, { color: c.inkSoft }]}>{plan.stone.line}</Text>
          </View>

          <BodySm style={{ paddingTop: space.md }}>
            This is a self-help tool. It is not therapy, it does not diagnose anything, and it
            is not a replacement for seeing someone. Everything you just answered stays on
            this phone.
          </BodySm>

          <View style={{ paddingTop: space.lg }}>
            <Button label="Start" onPress={onDone} />
          </View>
        </View>
      </Stage>
    </View>
  );
}
