import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Button, useTheme } from './ui';
import { Atmosphere } from './Atmosphere';
import { space, type as t, LAYOUT_MAX_WIDTH, atmosphereForScheme, type AtmosphereKey } from '../constants/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

/* The moment the app says something back.
 *
 * Three of five flows used to end by silently returning you to a menu. You would do the
 * hardest thing the app asks — sit through an urge, stand in front of a mirror — and the
 * screen would just change. That silence is most of what "not rewarding" meant, and it is
 * a design failure rather than a taste one: an action with no acknowledgement does not get
 * encoded as an achievement, so there is nothing to come back for.
 *
 * WHY A DRAWN MARK RATHER THAN CONFETTI. Confetti is a slot-machine device; it rewards the
 * tap, not the work, and this is an app for people whose problem is a compulsive loop. A
 * check that draws itself once, in about half a second, reads as "recorded" rather than
 * "you win". It is also the only completion mark anywhere in the codebase — there was none.
 *
 * SAFETY: this component must never accept a route to the paywall or render a commercial
 * prompt. It is the finish for grounding and urge surfing, and those are protected by
 * SAFETY.md §12. `__tests__/safety.test.mjs` greps this file for exactly that. */

const CHECK_LEN = 24; // path length of the mark below, rounded up

/** The completion mark on its own, for scenes that close in place rather than handing over
 *  to a full Finish frame. Draws once over about 400ms. */
export function CheckMark({
  size = 72,
  color,
  fill,
  delay = 0,
}: {
  size?: number;
  color: string;
  fill?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      a.setValue(1);
      return;
    }
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [reduced, delay]);

  return (
    <Animated.View
      style={{
        opacity: a.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [{ scale: a.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.86, 1, 1] }) }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx={16} cy={16} r={15} stroke={color} strokeWidth={1.6} fill={fill ?? 'none'} />
        <AnimatedPath
          d="M9 16.5 14 21.5 23.5 11"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LEN}
          strokeDashoffset={a.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [CHECK_LEN, CHECK_LEN, 0],
          })}
        />
      </Svg>
    </Animated.View>
  );
}

export interface FinishProps {
  /** Small line above the figure, e.g. "Logged for today". */
  eyebrow: string;
  /** The number worth showing, if there is one. Counts up from zero. */
  figure?: number | null;
  /** What the figure is. Rendered small, beside it. */
  figureUnit?: string;
  /** For figures that are not a single count — "70% → 40%". Shown as written, no count-up. */
  figureText?: string | null;
  headline: string;
  body?: string;
  /** Anything that belongs under the copy — the week strip, a chart. */
  children?: React.ReactNode;
  onDone: () => void;
  doneLabel?: string;
  /** Override the time-of-day ground. Urge surfing uses `ember`. */
  variant?: AtmosphereKey;
}

export function Finish({
  eyebrow,
  figure = null,
  figureUnit,
  figureText = null,
  headline,
  body,
  children,
  onDone,
  doneLabel = 'Done',
  variant,
}: FinishProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const sky = variant ?? atmosphereForScheme(c.isDark);

  /* One driver, 0 → 1 over 900ms, sliced by interpolation. Cheaper than five timers and
     it cannot desynchronise. */
  const a = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(figure ?? 0);

  useEffect(() => {
    if (reduced) {
      a.setValue(1);
      setShown(figure ?? 0);
      return;
    }
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1,
      duration: 900,
      easing: Easing.linear,
      useNativeDriver: false, // strokeDashoffset is not a native-driver prop
    }).start();

    if (figure != null && figure > 0) {
      count.setValue(0);
      const id = count.addListener(({ value }) => setShown(Math.round(value)));
      Animated.timing(count, {
        toValue: figure,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return () => count.removeListener(id);
    }
    setShown(figure ?? 0);
  }, [reduced, figure]);

  /* Sliced timeline. Circle first, mark drawing over it, then the words in order. */
  const at = (from: number, to: number) =>
    a.interpolate({ inputRange: [0, from, to, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });

  const ring = at(0, 0.38);
  const mark = at(0.13, 0.6);
  const line1 = at(0.22, 0.5);
  const line2 = at(0.32, 0.62);
  const line3 = at(0.42, 0.74);
  const line4 = at(0.55, 0.9);

  const rise = (v: Animated.AnimatedInterpolation<number>) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere variant={sky} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, paddingHorizontal: space.lg }}>
          {/* The mark. */}
          <Animated.View
            style={{
              opacity: ring,
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
            }}
          >
            <Svg width={72} height={72} viewBox="0 0 32 32">
              <Circle cx={16} cy={16} r={15} stroke={c.accent} strokeWidth={1.6} fill={c.accentDim} />
              <AnimatedPath
                d="M9 16.5 14 21.5 23.5 11"
                stroke={c.accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={CHECK_LEN}
                strokeDashoffset={mark.interpolate({ inputRange: [0, 1], outputRange: [CHECK_LEN, 0] })}
              />
            </Svg>
          </Animated.View>

          <Animated.Text style={[t.caption, { color: c.accentDeep, marginTop: space.xl }, rise(line1)]}>
            {eyebrow}
          </Animated.Text>

          {(figure != null && figure > 0) || figureText ? (
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: space.xs }, rise(line2)]}>
              <Text
                style={[
                  t.hero,
                  { color: c.ink, fontVariant: ['tabular-nums'] },
                  figureText ? { fontSize: 40, lineHeight: 46, letterSpacing: -1.2 } : null,
                ]}
              >
                {figureText ?? shown}
              </Text>
              {figureUnit && !figureText ? <Text style={[t.h2, { color: c.inkSoft }]}>{figureUnit}</Text> : null}
            </Animated.View>
          ) : null}

          <Animated.Text
            style={[
              (figure != null && figure > 0) || figureText ? t.h1 : t.display,
              { color: c.ink, marginTop: space.sm },
              rise(line3),
            ]}
          >
            {headline}
          </Animated.Text>

          {body ? (
            <Animated.Text style={[t.body, { color: c.inkSoft, marginTop: space.md, maxWidth: 340 }, rise(line3)]}>
              {body}
            </Animated.Text>
          ) : null}

          {children ? <Animated.View style={[{ marginTop: space.xl }, rise(line4)]}>{children}</Animated.View> : null}

          <Animated.View style={[{ marginTop: space.xxl }, rise(line4)]}>
            <Button label={doneLabel} onPress={onDone} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
