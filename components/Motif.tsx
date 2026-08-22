import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { scatter, MOTIF_MAX_OPACITY, MOTIF_CELL, STROKE, type MotifKind } from '../lib/motif.ts';

/* The scene's wallpaper: one small mark, repeated, very faint.
 *
 * Why it exists and the rules it lives under are in lib/motif.ts. Three of them matter
 * enough to repeat at the drawing:
 *
 *   1. IT NEVER MOVES, AND IT IS NEVER TILTED. Curveball's tell is a 2.4° tilt on a rising
 *      thought. A drifting background steals the motion channel; a field of randomly tilted
 *      marks steals the orientation channel, which is the rod-and-frame illusion aimed
 *      squarely at the skill being trained. Upright marks give the eye a true vertical and
 *      make the tell easier to read.
 *   2. IT IS DRAWN IN THE INK COLOUR, NOT ITS OWN. Hearts in pink and rays in yellow would
 *      each need their own contrast argument against two palettes and eight ramps. One
 *      colour has one argument, and the opacity is clamped here rather than trusted to the
 *      call site.
 *   3. IT IS SMALLER THAN THE TYPE IT SITS BEHIND. `SIZE` was 34, which with scale put marks
 *      at 24–44pt against a body cap height of about 11 — icons scattered on a screen, not
 *      texture. Texture reads as ground when the mark is at or under the x-height of the
 *      type in front of it.
 *
 * WHY THIS MEASURES ITS BOX. The first version placed each mark with `<G x="40%" y="70%">`
 * to avoid an onLayout. react-native-svg's `G` takes numbers for `x`/`y`, not percentage
 * strings — every mark resolved to zero and all of them stacked in the top-left corner,
 * which rendered as a single heart in the margin and looked deliberate. Percentages work on
 * `Rect`, which is why Atmosphere gets away with them; they do not work on a group
 * transform. So this measures, and accepts one frame with no wallpaper on it.
 *
 * Every glyph is drawn in a 24×24 box and placed by transform, so adding a kind is a path,
 * a stroke weight in lib/motif.ts, and nothing else. */

const SIZE = 20;

function Glyph({ kind, color }: { kind: MotifKind; color: string }) {
  const p = { stroke: color, strokeWidth: STROKE[kind], fill: 'none' } as const;
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
    /* Two broken concentric rings, going round again.
       This was a circular arrow, and it did not survive review or the screenshots: the whole
       meaning lived in a four-unit arrowhead, which is the first thing to vanish at 6–10%
       opacity, so most of them read as a letter C. Nesting two open arcs puts the meaning in
       the overall shape instead of in one small detail, which is the only kind of glyph that
       works at this size and this weight. */
    case 'loops':
      return (
        <G>
          <Path {...p} strokeLinecap="round" d="M12 2.6a9.4 9.4 0 1 1-7.4 3.6" />
          <Path {...p} strokeLinecap="round" d="M12 8.2a3.8 3.8 0 1 0 3.4 2.1" />
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
    /* A fork: one stem, two ways on. Drawn with both branches the same weight on purpose —
       the ACT game has no wrong answer, and a fork with one bold branch and one faint one
       would say the opposite before a word is read. */
    case 'paths':
      return (
        <G>
          <Path {...p} strokeLinecap="round" d="M12 21v-6.4" />
          <Path {...p} strokeLinecap="round" d="M12 14.6C12 10 9.6 7.4 5.6 5.2" />
          <Path {...p} strokeLinecap="round" d="M12 14.6C12 10 14.4 7.4 18.4 5.2" />
        </G>
      );
  }
}

export function Motif({
  kind,
  seed,
  color,
  isDark,
  opacity,
  inset = 14,
  insetTop = 0,
}: {
  kind: MotifKind;
  /** The scene id. Same scene, same layout, every play. */
  seed: string;
  /** The palette's ink. Passed in so this file never reaches for a theme. */
  color: string;
  /** Which ceiling applies. A fixed alpha is not a fixed weight across two palettes. */
  isDark: boolean;
  opacity?: number;
  /** Keeps whole marks inside the frame. Without it the outermost column reaches 0.95 of
   *  the width and half a glyph is sliced off by the edge — which reads as a bug rather
   *  than as a pattern bleeding deliberately. */
  inset?: number;
  /** Reserves the top strip. The back button and the step pips live up there, and the pips
   *  are the only thing on this screen reporting state; nothing decorative should cross
   *  them. */
  insetTop?: number;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });

  const ceiling = isDark ? MOTIF_MAX_OPACITY.dark : MOTIF_MAX_OPACITY.light;
  const safe = Math.min(opacity ?? ceiling, ceiling);

  /* Grid derived from the measured box so the cells stay roughly square. A fixed 4×7 on a
     393×852 frame gave 98×122 cells — a row pitch wider than the jitter could bridge, which
     left the glyphs sitting in readable horizontal bands. */
  const cols = Math.max(3, Math.round(box.w / MOTIF_CELL));
  const rows = Math.max(4, Math.round((box.h - insetTop) / MOTIF_CELL));
  const dots = useMemo(() => scatter(seed, cols, rows), [seed, cols, rows]);

  const spanX = Math.max(0, box.w - inset * 2);
  const spanY = Math.max(0, box.h - insetTop - inset);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
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
                `translate(${(inset + d.x * spanX).toFixed(1)} ${(insetTop + d.y * spanY).toFixed(1)}) ` +
                (d.rotate ? `rotate(${d.rotate.toFixed(1)}) ` : '') +
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
