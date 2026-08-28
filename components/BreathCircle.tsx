import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, AccessibilityInfo } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './ui';
import { space, type as t } from '../constants/theme';
import { BREATH } from '../content/exercises.ts';
import { useReducedMotion } from '../hooks/useReducedMotion';

/* 4-7-8 paced breathing.
 *
 * useNativeDriver stays false deliberately: react-native-web ignores the native driver,
 * and the animation has to be correct in a desktop browser as well as on device. */

type Phase = 'inhale' | 'hold' | 'exhale' | 'done';

/** A pace this circle can run. `hold` is optional and Still's does not have one. */
export interface BreathPattern {
  inhale: number;
  hold?: number;
  exhale: number;
  cycles: number;
  during: readonly string[];
  phaseLabels: { inhale: string; hold?: string; exhale: string };
}

export function BreathCircle({
  onCycle,
  onDone,
  size = 220,
  tone = 'accent',
  pattern,
  showCycles = true,
}: {
  onCycle?: (n: number) => void;
  onDone?: () => void;
  size?: number;
  /** `light` when this sits on artwork rather than on the app ground. */
  tone?: 'accent' | 'light';
  /** Show "cycle 3 of 30" under the circle.
   *
   *  On Calm down this is load-bearing safety copy: BREATH is 4-7-8, its own outro says four
   *  cycles is enough, and a visible end is part of the instruction. In Still it contradicts
   *  the section — STILL_INTRO says "None of them is scored, none of them can be done wrong",
   *  Float deliberately has no clock, and content/still.ts calls a completion mark "the app
   *  asking to be thanked". Then the most-used mode counted to thirty on screen. */
  showCycles?: boolean;
  /** The pace to run.
   *
   *  Defaults to BREATH — 4-7-8, four cycles — so the Calm down path is exactly what it was.
   *  Still passes its own, because a sustained mode cannot use this one: BREATH's own outro
   *  says "Four cycles is enough. More isn't better", and running it for five minutes would
   *  contradict the app's own safety copy in the same build. See content/still.ts. */
  pattern?: BreathPattern;
}) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(0.55)).current;
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(1);

  /* THE CALLBACKS LIVE IN A REF, AND THAT IS A BUG FIX RATHER THAN A STYLE CHOICE.
     This effect used to depend on `[onCycle, onDone, scale]`. Both callbacks are inline
     arrows at the call site, so each gets a new identity on every render of the parent — and
     `onDone` causes one, because it sets state. So the instant the fourth cycle finished the
     effect tore down and ran again: the screen showed "Four cycles done" and a Done button
     while the circle underneath started pacing from cycle one and kept going for another
     seventy-six seconds. On the calm-down path, for somebody who arrived dysregulated.
     The component owns the schedule and must not restart because its parent re-rendered. */
  const cbs = useRef({ onCycle, onDone });
  cbs.current = { onCycle, onDone };

  /* The pattern is read through a ref for the same reason the callbacks are: the effect below
     owns a schedule that must not restart because the parent re-rendered with a fresh object
     literal. A caller writing `pattern={{ ... }}` inline would otherwise re-pace the circle
     mid-breath, which is the exact bug the comment above describes. */
  const pat = useRef(pattern ?? BREATH);
  const P = pat.current;

  useEffect(() => {
    let cancelled = false;
    let current: Animated.CompositeAnimation | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const step = (to: number, seconds: number, p: Phase) =>
      new Promise<void>((resolve) => {
        if (cancelled) return resolve();
        setPhase(p);
        /* REDUCE MOTION: the pacing stays, the movement goes. hooks/useReducedMotion.ts sets
           the rule — every animation collapses to something static — and this is the largest
           sustained motion in the app, a circle scaling continuously for seventy-six seconds,
           which never honoured it. The phase label and the cycle counter carry the exercise
           perfectly well on their own; QuietCircle below already does exactly this. */
        if (reduced) {
          const timer = setTimeout(resolve, seconds * 1000);
          timers.push(timer);
          return;
        }
        current = Animated.timing(scale, {
          toValue: to,
          duration: seconds * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        });
        current.start(() => resolve());
      });

    const run = async () => {
      for (let n = 1; n <= P.cycles; n++) {
        if (cancelled) return;
        setCycle(n);
        cbs.current.onCycle?.(n);
        await step(1, P.inhale, 'inhale');
        /* Hold keeps the circle expanded rather than freezing mid-motion. Skipped entirely
           when the pattern has none — a zero-second hold would still set the phase and flash
           the "Hold" label for a frame. */
        if (P.hold) await step(1, P.hold, 'hold');
        await step(0.55, P.exhale, 'exhale');
      }
      if (!cancelled) {
        setPhase('done');
        cbs.current.onDone?.();
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      /* Stop the in-flight timing as well as flagging the loop. `cancelled` alone left a
         four-to-eight-second animation running against a detached tree — no setState escaped,
         because of the guards, but it is pure cost on the way out of a screen. */
      current?.stop();
    };
  }, [reduced, scale, P]);

  const r = size / 2 - 8;
  const label =
    phase === 'done'
      ? 'Done'
      : phase === 'inhale'
        ? P.phaseLabels.inhale
        : phase === 'hold'
          ? P.phaseLabels.hold ?? ''
          : P.phaseLabels.exhale;

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
          : showCycles
            ? `${P.during[(cycle - 1) % P.during.length]}  ·  cycle ${cycle} of ${P.cycles}`
            : P.during[(cycle - 1) % P.during.length]}
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
