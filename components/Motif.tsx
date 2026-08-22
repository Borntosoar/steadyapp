import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { scatter, MOTIF_MAX_OPACITY, type MotifKind } from '../lib/motif.ts';

/* The scene's wallpaper: one small mark, scattered, very faint.
 *
 * Why it exists and the rules it lives under are in lib/motif.ts. Two of them matter enough
 * to repeat at the drawing:
 *
 *   1. IT NEVER MOVES. Curveball's whole tell is motion. A drifting background competes for
 *      the one channel the game teaches you to read.
 *   2. IT IS DRAWN IN THE INK COLOUR, NOT ITS OWN. Hearts in pink and rays in yellow would
 *      each need their own contrast argument against two palettes and eight atmosphere
 *      ramps. One colour at one opacity has one argument, and `opacity` is clamped here
 *      rather than trusted to the call site.
 *
 * WHY THIS MEASURES ITS BOX. The first version placed each mark with `<G x="40%" y="70%">`
 * to avoid an onLayout. react-native-svg's `G` takes numbers for `x`/`y`, not percentage
 * strings — every mark resolved to zero and all twenty-eight stacked in the top-left
 * corner, which rendered as a single heart in the margin and looked deliberate. Percentages
 * work on `Rect`, which is why Atmosphere gets away with them; they do not work on a group
 * transform. So this measures, and accepts one frame with no wallpaper on it.
 *
 * Every glyph is drawn in a 24×24 box and placed by transform, so adding a kind is a path
 * and nothing else. */

const SIZE = 34;

/** Stroke-drawn, never filled: a filled shape at 9% reads as a smudge, an outline at 9%
 *  reads as a line somebody drew.
 *
 *  The stroke colour is passed down rather than inherited through `currentColor`. Inherited
 *  colour is supported unevenly across react-native-svg versions and platforms, and a
 *  wallpaper that silently renders black on one of them is worse than no wallpaper. */
function Glyph({ kind, color }: { kind: MotifKind; color: string }) {
  const p = { stroke: color, strokeWidth: 1.5, fill: 'none' } as const;
  switch (kind) {
    case 'hearts':
      return <Path {...p} d="M12 20.3 4.4 12.6a4.7 4.7 0 0 1 6.7-6.6l.9.9.9-.9a4.7 4.7 0 1 1 6.7 6.6z" strokeLinejoin="round" />;
    case 'messages':
      return (
        <Path
          {...p}
          strokeLinejoin="round"
          d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v7.5a1.5 1.5 0 0 1-1.5 1.5H10l-4 3.6V16H4.5A1.5 1.5 0 0 1 3 14.5V7a1.5 1.5 0 0 1 1.5-1.5Z"
        />
      );
    case 'papers':
      return (
        <G>
          <Path {...p} strokeLinejoin="round" d="M6 3.5h8L18.5 8v12.5H6z" />
          <Path {...p} d="M13.8 3.7V8.2h4.5" />
        </G>
      );
    case 'moons':
      return <Path {...p} strokeLinejoin="round" d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11Z" />;
    case 'rings':
      return (
        <G>
          <Circle {...p} cx={9.4} cy={12} r={5.6} />
          <Circle {...p} cx={14.6} cy={12} r={5.6} />
        </G>
      );
    case 'loops':
      return (
        <G>
          <Path {...p} strokeLinecap="round" d="M19.4 12a7.4 7.4 0 1 1-2.6-5.6" />
          <Path {...p} strokeLinecap="round" strokeLinejoin="round" d="M17.6 2.4v4.3h-4.3" />
        </G>
      );
    case 'rays':
      return (
        <G>
          <Path {...p} strokeLinecap="round" d="M4 17.5h16" />
          <Path {...p} strokeLinecap="round" d="M7.6 17.5a4.4 4.4 0 0 1 8.8 0" />
          <Path {...p} strokeLinecap="round" d="M12 6.2v2.4M6.4 8.6l1.7 1.7M17.6 8.6l-1.7 1.7" />
        </G>
      );
  }
}

export function Motif({
  kind,
  seed,
  color,
  opacity = MOTIF_MAX_OPACITY,
}: {
  kind: MotifKind;
  /** The scene id. Same scene, same layout, every play. */
  seed: string;
  /** The palette's ink. Passed in so this file never reaches for a theme. */
  color: string;
  opacity?: number;
}) {
  const dots = useMemo(() => scatter(seed), [seed]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const safe = Math.min(opacity, MOTIF_MAX_OPACITY);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
      }}
    >
      {box.w > 0 && (
        <Svg width={box.w} height={box.h} opacity={safe}>
          {dots.map((d, i) => (
            <G
              key={i}
              transform={
                `translate(${(d.x * box.w).toFixed(1)} ${(d.y * box.h).toFixed(1)}) ` +
                `rotate(${d.rotate.toFixed(1)}) ` +
                `scale(${((d.scale * SIZE) / 24).toFixed(3)}) ` +
                `translate(-12 -12)`
              }
            >
              <Glyph kind={kind} color={color} />
            </G>
          ))}
        </Svg>
      )}
    </View>
  );
}
