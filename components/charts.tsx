import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { Caption, useTheme } from './ui';
import { space } from '../constants/theme';

/* Hand-rolled SVG. No chart library anywhere in this app — the shapes needed are simple,
 * and a charting dependency would be more bundle and more web-compat risk than it earns. */

const W = 620;
const H = 170;
const P = 22;

export function LineChart({
  points,
  max,
  min = 0,
  label,
}: {
  points: { x: string; y: number }[];
  max: number;
  min?: number;
  label?: string;
}) {
  const c = useTheme();
  if (points.length < 2) {
    return <Caption style={{ paddingVertical: space.lg }}>Not enough data yet.</Caption>;
  }

  const span = Math.max(1, max - min);
  const px = (i: number) => P + (i * (W - P * 2)) / (points.length - 1);
  const py = (v: number) => H - P - ((v - min) / span) * (H - P * 2);

  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${px(points.length - 1).toFixed(1)},${H - P} L${px(0).toFixed(1)},${H - P} Z`;
  const zeroY = min < 0 && max > 0 ? py(0) : null;

  return (
    <View style={{ marginTop: space.md }}>
      <Svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        accessibilityRole="image"
        aria-label={`${label ?? 'Trend'} across ${points.length} points, latest ${points[points.length - 1].y}`}
      >
        <Line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke={c.line} strokeWidth={1} />
        {zeroY !== null && (
          <Line x1={P} y1={zeroY} x2={W - P} y2={zeroY} stroke={c.line} strokeWidth={1} strokeDasharray="4 4" />
        )}
        <Path d={area} fill={c.accent} opacity={0.1} />
        <Path d={d} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={px(i)} cy={py(p.y)} r={4} fill={c.surface} stroke={c.accent} strokeWidth={2.5} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Caption>{points[0].x}</Caption>
        <Caption>{points[points.length - 1].x}</Caption>
      </View>
    </View>
  );
}

export function BarChart({
  bars,
  label,
}: {
  bars: { x: string; y: number }[];
  label?: string;
}) {
  const c = useTheme();
  if (!bars.length) {
    return <Caption style={{ paddingVertical: space.lg }}>Not enough data yet.</Caption>;
  }

  const max = Math.max(1, ...bars.map((b) => Math.abs(b.y)));
  const slot = (W - P * 2) / bars.length;
  const bw = Math.min(46, slot * 0.62);

  return (
    <View style={{ marginTop: space.md }}>
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} accessibilityRole="image" aria-label={label}>
        <Line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke={c.line} strokeWidth={1} />
        {bars.map((b, i) => {
          const h = (Math.abs(b.y) / max) * (H - P * 2);
          const x = P + i * slot + (slot - bw) / 2;
          return (
            <Rect
              key={i}
              x={x}
              y={H - P - h}
              width={bw}
              height={Math.max(2, h)}
              rx={4}
              fill={b.y >= 0 ? c.accent : c.line}
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Caption>{bars[0].x}</Caption>
        <Caption>{bars[bars.length - 1].x}</Caption>
      </View>
    </View>
  );
}
