import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, useTheme,
} from '../components/ui';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { Text } from 'react-native';

/* Grounding is free forever and reachable in <= 2 taps from anywhere. Nothing on this
 * screen is ever gated, and nothing on it references appearance. */

type Tool = 'menu' | 'senses' | 'breath' | 'widen' | 'values';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* 4-7-8 paced breathing. Animated via Animated API so it runs on web without a native
 * driver — react-native-web ignores useNativeDriver, so we leave it false deliberately. */
function Breathing({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const scale = useRef(new Animated.Value(0.55)).current;
  const [phase, setPhase] = useState('Ready');
  const [round, setRound] = useState(0);
  const TOTAL = 4;

  useEffect(() => {
    let cancelled = false;

    const run = async (n: number) => {
      if (cancelled || n >= TOTAL) {
        if (!cancelled) {
          setPhase('Done');
          onDone();
        }
        return;
      }
      setRound(n + 1);

      const step = (to: number, ms: number, label: string) =>
        new Promise<void>((resolve) => {
          if (cancelled) return resolve();
          setPhase(label);
          Animated.timing(scale, {
            toValue: to,
            duration: ms,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }).start(() => resolve());
        });

      await step(1, 4000, 'Breathe in');
      await step(1, 7000, 'Hold');
      await step(0.55, 8000, 'Breathe out');
      if (!cancelled) void run(n + 1);
    };

    void run(0);
    return () => {
      cancelled = true;
    };
  }, [onDone, scale]);

  const size = 200;
  const r = size / 2 - 8;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} fill={c.accentPale} stroke={c.accent} strokeWidth={2} />
          </Svg>
        </Animated.View>
        <Text style={[t.h2, { position: 'absolute', color: c.accentDeep }]}>{phase}</Text>
      </View>
      <Caption style={{ marginTop: space.md }}>
        {phase === 'Done' ? 'Notice how your body feels now.' : `Round ${round} of ${TOTAL} · in 4, hold 7, out 8`}
      </Caption>
    </View>
  );
}

const SENSES = [
  { n: 5, label: 'things you can see' },
  { n: 4, label: 'things you can feel' },
  { n: 3, label: 'things you can hear' },
  { n: 2, label: 'things you can smell' },
  { n: 1, label: 'thing you can taste' },
];

const WIDEN_STEPS = [
  'Notice that your attention is pointed inward — at yourself, or at how you are coming across.',
  'Pick one object near you. Describe it in detail: colour, texture, edges, wear.',
  'Widen out. Name three sounds you can hear right now, near and far.',
  'Widen again. What is actually happening in this space? What is the temperature, the light, the air?',
  'Return to what you were doing, with attention pointed outward.',
  'It will snap back to you. That is expected. Widening again is the repetition — that is the whole exercise.',
];

const VALUES_PROMPTS = [
  'If appearance worry took up none of your day tomorrow, what would you actually do with the time?',
  'Who is someone you want more contact with than you currently have?',
  'What did you used to do that you have quietly stopped doing?',
  'What would you want to be true of you in five years that has nothing to do with how you look?',
];

export default function Grounding() {
  const c = useTheme();
  const router = useRouter();
  const logPractice = useStore((s) => s.logPractice);
  const [tool, setTool] = useState<Tool>('menu');
  const [sensesStep, setSensesStep] = useState(0);
  const [widenStep, setWidenStep] = useState(0);
  const [logged, setLogged] = useState(false);

  const complete = () => {
    if (!logged) {
      logPractice('grounding');
      setLogged(true);
    }
  };

  if (tool === 'menu') {
    return (
      <Screen>
        <View style={{ marginTop: space.xxl }}>
          <H1>Grounding</H1>
          <BodySm style={{ marginTop: space.sm, marginBottom: space.lg }}>
            Free, always. Use these any time — especially when you are too activated to do
            anything structured. Any of them counts as showing up.
          </BodySm>

          {[
            { k: 'breath' as Tool, title: '4-7-8 breathing', sub: 'Four rounds, about two minutes. Settles the physical end of it.' },
            { k: 'senses' as Tool, title: '5-4-3-2-1', sub: 'Pulls attention out of your head and into the room.' },
            { k: 'widen' as Tool, title: 'Attention widening', sub: 'Sixty seconds of practising outward focus instead of self-focus.' },
            { k: 'values' as Tool, title: 'Values anchor', sub: 'Four questions to reconnect with what the hours are for.' },
          ].map((x) => (
            <Pressable
              key={x.k}
              accessibilityRole="button"
              onPress={() => setTool(x.k)}
              style={({ pressed }) => ({
                backgroundColor: c.surface,
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.line,
                padding: space.lg,
                marginBottom: space.md,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <H3>{x.title}</H3>
              <BodySm style={{ marginTop: space.xs }}>{x.sub}</BodySm>
            </Pressable>
          ))}

          <Card tone="accent">
            <H3>If this is more than a hard moment</H3>
            <BodySm style={{ marginTop: space.xs }}>
              Reaching a person beats any exercise here. Support is one tap away, at the top of the screen.
            </BodySm>
            <Button label="Open support" variant="secondary" onPress={() => router.push('/support')} style={{ marginTop: space.md }} />
          </Card>

          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        {tool === 'breath' && (
          <Card>
            <H2 style={{ marginBottom: space.lg }}>4-7-8 breathing</H2>
            <Breathing onDone={complete} />
          </Card>
        )}

        {tool === 'senses' && (
          <Card>
            <Caption>
              {sensesStep + 1} of {SENSES.length}
            </Caption>
            <H1 style={{ marginTop: space.xs }}>
              {SENSES[Math.min(sensesStep, SENSES.length - 1)].n}
            </H1>
            <H2>{SENSES[Math.min(sensesStep, SENSES.length - 1)].label}</H2>
            <BodySm style={{ marginTop: space.md }}>
              Name them out loud if you can. Out loud works better than in your head.
            </BodySm>
            <Button
              label={sensesStep >= SENSES.length - 1 ? 'Finish' : 'Next'}
              onPress={() => {
                if (sensesStep >= SENSES.length - 1) {
                  complete();
                  setTool('menu');
                  setSensesStep(0);
                } else setSensesStep(sensesStep + 1);
              }}
              style={{ marginTop: space.lg }}
            />
          </Card>
        )}

        {tool === 'widen' && (
          <Card>
            <Caption>
              {widenStep + 1} of {WIDEN_STEPS.length}
            </Caption>
            <Body style={{ marginTop: space.md, fontSize: 18, lineHeight: 27 }}>{WIDEN_STEPS[widenStep]}</Body>
            <Button
              label={widenStep >= WIDEN_STEPS.length - 1 ? 'Finish' : 'Next'}
              onPress={() => {
                if (widenStep >= WIDEN_STEPS.length - 1) {
                  complete();
                  setTool('menu');
                  setWidenStep(0);
                } else setWidenStep(widenStep + 1);
              }}
              style={{ marginTop: space.xl }}
            />
          </Card>
        )}

        {tool === 'values' && (
          <Card>
            <H2>Values anchor</H2>
            <BodySm style={{ marginTop: space.xs, marginBottom: space.lg }}>
              Nothing to fill in. Just sit with each one for a moment.
            </BodySm>
            {VALUES_PROMPTS.map((p, i) => (
              <View key={i} style={{ marginBottom: space.lg }}>
                <Caption>{i + 1}</Caption>
                <Body style={{ marginTop: space.xs }}>{p}</Body>
              </View>
            ))}
            <Button
              label="Finish"
              onPress={() => {
                complete();
                setTool('menu');
              }}
            />
          </Card>
        )}

        <Button label="Back to grounding" variant="ghost" onPress={() => setTool('menu')} style={{ marginTop: space.sm }} />
      </View>
    </Screen>
  );
}
