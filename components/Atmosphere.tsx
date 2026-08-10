import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, {
  Defs, LinearGradient, RadialGradient, Rect, Stop, Ellipse, Filter, FeTurbulence, G,
} from 'react-native-svg';
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
 * without depicting anybody.
 *
 * WHY THERE IS STRUCTURE AND GRAIN IN HERE, and not just a gradient.
 *
 * For a long time this was four smooth gradient stops and two ellipses. Every `Frost` panel
 * in the app is a BlurView sitting on top of it — and blurring a smooth low-frequency
 * gradient returns almost exactly the same gradient. The app was paying full GPU cost for
 * every frosted card and getting a flat translucent rectangle back, because there was
 * nothing in the ground for the blur to do anything to.
 *
 * The reference's glass works because it sits over photographs of leaves: hard edges, high
 * frequency, real luminance variation. This app cannot ship photography — see the two
 * reasons above — so the structure is generated instead. Overlapping soft ellipses give the
 * blur something to sample, and a turbulence layer at 3.5% gives the whole frame a paper
 * tooth, which also kills the banding that a four-stop gradient shows on a 6.1" panel.
 *
 * The blob layout is SEEDED FROM THE DAY, not from anything about the user. Same ground all
 * day, different ground tomorrow. It must never key off a score: a background that changes
 * with how somebody is doing is a mood ring, and a mood ring is a rating with better
 * manners. */

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

  /* Twelve soft masses, laid out from a seed that changes once a day. A plain
     `Math.random()` here would reshuffle the ground on every re-render, which reads as the
     screen flickering. */
  const blobs = useMemo(() => {
    const d = new Date();
    let seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate() + variant.length * 17;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    return Array.from({ length: 12 }, () => ({
      cx: rnd() * 120 - 10,
      cy: rnd() * 120 - 10,
      rx: 18 + rnd() * 37,
      ry: 14 + rnd() * 30,
      o: 0.08 + rnd() * 0.14,
      s: stops[Math.floor(rnd() * stops.length)],
    }));
  }, [variant, stops]);

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

          {/* Paper tooth. The single cheapest premium signal available: it removes the
              banding a four-stop gradient shows on a real panel, and it gives the blur
              above it actual high-frequency detail to work with. */}
          <Filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
            <FeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} stitchTiles="stitch" />
          </Filter>
        </Defs>

        <Rect x="0" y="0" width="100" height="100" fill={`url(#sky-${id})`} />
        <Rect x="0" y="0" width="100" height="100" fill={`url(#haze-${id})`} />
        <Rect x="0" y="0" width="100" height="100" fill={`url(#glow-${id})`} />

        {/* The land mass. Very wide, very flat ellipses read as a horizon without
            pretending to be an illustration of anything.
            Kept low and semi-transparent on purpose: pushed higher or made opaque, the
            curve stops reading as distance and starts reading as a black dome sitting on
            the sky. The ground gradient beneath does the rest of the work. */}
        {/* The structure the frost needs. Soft, overlapping, and low-contrast enough that
            none of them reads as a shape — the point is variation, not decoration. */}
        <G>
          {blobs.map((b, i) => (
            <Ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={b.s} opacity={b.o} />
          ))}
        </G>

        <Rect x="0" y="0" width="100" height="100" fill={`url(#ground-${id})`} />
        <Ellipse cx="50" cy="152" rx="108" ry="54" fill={stops[0]} opacity={0.5} />
        <Ellipse cx="24" cy="160" rx="80" ry="48" fill={stops[0]} opacity={0.34} />

        <Rect x="0" y="0" width="100" height="100" filter={`url(#grain-${id})`} opacity={0.035} />

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
