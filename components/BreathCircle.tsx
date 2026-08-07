import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, AccessibilityInfo } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './ui';
import { space, type as t } from '../constants/theme';
import { BREATH } from '../content/exercises.ts';

/* 4-7-8 paced breathing.
 *
 * useNativeDriver stays false deliberately: react-native-web ignores the native driver,
 * and the animation has to be correct in a desktop browser as well as on device. */

type Phase = 'inhale' | 'hold' | 'exhale' | 'done';

export function BreathCircle({
  onCycle,
  onDone,
  size = 220,
  tone = 'accent',
}: {
  onCycle?: (n: number) => void;
  onDone?: () => void;
  size?: number;
  /** `light` when this sits on artwork rather than on the app ground. */
  tone?: 'accent' | 'light';
}) {
  const c = useTheme();
  const scale = useRef(new Animated.Value(0.55)).current;
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const step = (to: number, seconds: number, p: Phase) =>
      new Promise<void>((resolve) => {
        if (cancelled) return resolve();
        setPhase(p);
        Animated.timing(scale, {
          toValue: to,
          duration: seconds * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start(() => resolve());
      });

    const run = async () => {
      for (let n = 1; n <= BREATH.cycles; n++) {
        if (cancelled) return;
        setCycle(n);
        onCycle?.(n);
        await step(1, BREATH.inhale, 'inhale');
        // Hold keeps the circle expanded rather than freezing mid-motion.
        await step(1, BREATH.hold, 'hold');
        await step(0.55, BREATH.exhale, 'exhale');
      }
      if (!cancelled) {
        setPhase('done');
        onDone?.();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [onCycle, onDone, scale]);

  const r = size / 2 - 8;
  const label =
    phase === 'done'
      ? 'Done'
      : phase === 'inhale'
        ? BREATH.phaseLabels.inhale
        : phase === 'hold'
          ? BREATH.phaseLabels.hold
          : BREATH.phaseLabels.exhale;

  const light = tone === 'light';
  const fill = light ? 'rgba(255,255,255,0.10)' : c.accentDim;
  const stroke = light ? 'rgba(255,255,255,0.6)' : c.accent;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} fill={fill} stroke={stroke} strokeWidth={2} />
          </Svg>
        </Animated.View>
        <Text style={[t.h2, { position: 'absolute', color: light ? '#fff' : c.accentDeep }]}>{label}</Text>
      </View>
      <Text
        style={[
          t.caption,
          { color: light ? 'rgba(255,255,255,0.72)' : c.inkFaint, marginTop: space.md },
        ]}
      >
        {phase === 'done'
          ? ''
          : `${BREATH.during[(cycle - 1) % BREATH.during.length]}  ·  cycle ${cycle} of ${BREATH.cycles}`}
      </Text>
    </View>
  );
}

/** A slow, unlabelled breathing circle. Used by the hard-day sit and the urge timer,
 *  where text would be an imposition — the point of both is that nothing is asked.
 *
 *  `tone="light"` is for when this sits on artwork rather than on the app ground: ochre
 *  on an ember sky is nearly invisible, and a pacing cue you cannot see is worse than
 *  no pacing cue. */
export function QuietCircle({
  size = 200,
  tone = 'accent',
}: {
  size?: number;
  tone?: 'accent' | 'light';
}) {
  const c = useTheme();
  const scale = useRef(new Animated.Value(0.7)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (live) setReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    // Reduced motion gets a still circle at rest size rather than a paced one. The
    // timer beside it still does the pacing.
    if (reduceMotion) {
      scale.setValue(0.85);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(scale, { toValue: 0.7, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, reduceMotion]);

  const r = size / 2 - 8;
  const fill = tone === 'light' ? 'rgba(255,255,255,0.10)' : c.accentDim;
  const stroke = tone === 'light' ? 'rgba(255,255,255,0.55)' : c.accent;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
        </Svg>
      </Animated.View>
    </View>
  );
}
