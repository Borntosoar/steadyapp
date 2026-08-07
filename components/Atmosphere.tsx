import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Ellipse } from 'react-native-svg';
import { ATMOSPHERES, type AtmosphereKey, radius } from '../constants/theme';

/* Procedural atmosphere.
 *
 * The reference this is modelled on leans on photography — including a portrait on its
 * first screen. Two reasons this uses generated gradients instead:
 *
 *   1. A photograph of an attractive person on the landing screen of a body-image app is
 *      a comparison target. That is the one image category SAFETY.md exists to keep out.
 *   2. There is no network in this app. Bundled photography would be megabytes; this is
 *      a few hundred bytes of vector maths and renders identically offline.
 *
 * The result reads as a horizon at different times of day: a graded sky, a soft light
 * source low in the frame, and a darker mass beneath it. Enough to feel like a place
 * without depicting anybody. */

interface Props {
  variant?: AtmosphereKey;
  /** 0–1. Where the light source sits horizontally. Varying it stops tiles in a rail
   *  from looking like the same asset repeated. */
  lightX?: number;
  style?: ViewStyle;
  rounded?: keyof typeof radius | 'none';
  children?: React.ReactNode;
  /** Darkens the lower half so overlaid text stays readable. */
  scrim?: boolean;
}

export function Atmosphere({
  variant = 'night',
  lightX = 0.62,
  style,
  rounded = 'scene',
  children,
  scrim = true,
}: Props) {
  const stops = ATMOSPHERES[variant];
  const id = useMemo(() => `${variant}-${Math.round(lightX * 100)}`, [variant, lightX]);
  const br = rounded === 'none' ? 0 : radius[rounded];

  return (
    <View style={[{ overflow: 'hidden', borderRadius: br }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`sky-${id}`} x1="0" y1="0" x2="0.25" y2="1">
            <Stop offset="0" stopColor={stops[0]} />
            <Stop offset="0.45" stopColor={stops[1]} />
            <Stop offset="0.78" stopColor={stops[2]} />
            <Stop offset="1" stopColor={stops[3]} />
          </LinearGradient>

          {/* Low sun / moon. Sits near the horizon so the frame has a direction. */}
          <RadialGradient id={`glow-${id}`} cx={`${lightX * 100}%`} cy="72%" r="52%">
            <Stop offset="0" stopColor={stops[3]} stopOpacity="0.95" />
            <Stop offset="0.45" stopColor={stops[3]} stopOpacity="0.35" />
            <Stop offset="1" stopColor={stops[3]} stopOpacity="0" />
          </RadialGradient>

          {/* A second, cooler bloom offset from the first, so the field is not a single
              symmetrical blob. */}
          <RadialGradient id={`haze-${id}`} cx={`${(1 - lightX) * 90}%`} cy="26%" r="60%">
            <Stop offset="0" stopColor={stops[1]} stopOpacity="0.55" />
            <Stop offset="1" stopColor={stops[1]} stopOpacity="0" />
          </RadialGradient>

          {/* Weight in the lower third, so the frame has a floor. Soft-edged, so it
              never draws a line across the picture. */}
          <LinearGradient id={`ground-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.4" stopColor={stops[0]} stopOpacity="0" />
            <Stop offset="0.78" stopColor={stops[0]} stopOpacity="0.42" />
            <Stop offset="1" stopColor={stops[0]} stopOpacity="0.78" />
          </LinearGradient>

          <LinearGradient id={`scrim-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0" />
            <Stop offset="0.55" stopColor="#000" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.62" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="100" height="100" fill={`url(#sky-${id})`} />
        <Rect x="0" y="0" width="100" height="100" fill={`url(#haze-${id})`} />
        <Rect x="0" y="0" width="100" height="100" fill={`url(#glow-${id})`} />

        {/* The land mass. Very wide, very flat ellipses read as a horizon without
            pretending to be an illustration of anything.
            Kept low and semi-transparent on purpose: pushed higher or made opaque, the
            curve stops reading as distance and starts reading as a black dome sitting on
            the sky. The ground gradient beneath does the rest of the work. */}
        <Rect x="0" y="0" width="100" height="100" fill={`url(#ground-${id})`} />
        <Ellipse cx="50" cy="152" rx="108" ry="54" fill={stops[0]} opacity={0.5} />
        <Ellipse cx="24" cy="160" rx="80" ry="48" fill={stops[0]} opacity={0.34} />

        {scrim && <Rect x="0" y="0" width="100" height="100" fill={`url(#scrim-${id})`} />}
      </Svg>
      {children}
    </View>
  );
}

/** A hairline highlight along the top edge. Used on raised surfaces to suggest a light
 *  source without reaching for a blur, which would be glassmorphism by another name. */
export function TopEdge({ color }: { color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: color,
        opacity: 0.7,
      }}
    />
  );
}
