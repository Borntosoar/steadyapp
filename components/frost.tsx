import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme, IN_FIXED_SHAPE } from './ui';
import { Atmosphere } from './Atmosphere';
import {
  space, radius, type as t, atmosphereForScheme, elevation, motion,
  LAYOUT_MAX_WIDTH, TAB_BAR_HEIGHT, type AtmosphereKey,
} from '../constants/theme';
import { haptic } from '../hooks/haptics';

/* The frosted-glass vocabulary.
 *
 * Everything the reference does visually comes from four moves, and these are them:
 * translucent blurred panels floating over soft light, circular buttons instead of bars,
 * faces instead of numbers, and a segmented block instead of a slider.
 *
 * The three input primitives here are not decoration. A 0-to-10 grid of buttons asks
 * somebody to quantify how bad they feel, which is a small act of rumination before you
 * have even started, and it is the single most clinical thing the old app did. A row of
 * faces asks the same question in the way a person would ask it. */

/* ---------- frosted panel ---------- */

export function Frost({
  children,
  style,
  intensity = 40,
  tone,
  round = 'card',
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  /** Which way the glass tints. Follows the palette unless a screen needs to override it. */
  tone?: 'light' | 'dark';
  round?: keyof typeof radius;
  onPress?: () => void;
}) {
  const c = useTheme();
  const tint = (tone ?? (c.isDark ? 'dark' : 'light')) === 'dark' ? 'dark' : 'light';
  const body = (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={{
        borderRadius: radius[round],
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.lineStrong,
      }}
    >
      {/* A tint on top of the blur. Blur alone samples whatever is behind it, which on a
          busy background leaves text sitting on noise. */}
      <View style={{ backgroundColor: c.surface, padding: space.lg }}>{children}</View>
    </BlurView>
  );

  /* Shadows are what make a translucent panel read as glass in front of something rather
     than as a lighter rectangle drawn on it. Skipped on the dark palette, where a shadow
     does nothing at all and the hairline plus the surface tint carry the depth instead. */
  const sit = c.isDark ? null : elevation.rest;

  if (!onPress) return <View style={[style, sit]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.select();
        onPress();
      }}
      /* The old press was opacity 0.85 and scale 0.985, which is invisible at 60fps. A card
         that sinks toward the surface is legible, and it only becomes legible once there is
         a shadow for it to sink into. */
      style={({ pressed }) => [
        style,
        sit,
        pressed && !c.isDark ? { shadowRadius: 8, shadowOffset: { width: 0, height: 2 } } : null,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      {body}
    </Pressable>
  );
}

/* ---------- circular action button ---------- */

export function CircleButton({
  icon = 'plus',
  onPress,
  label,
  size = 48,
  tone = 'solid',
}: {
  icon?: 'plus' | 'minus' | 'arrow' | 'back' | 'play' | 'check';
  onPress: () => void;
  /** Accessible name. The glyph alone tells a screen reader nothing. */
  label: string;
  size?: number;
  tone?: 'solid' | 'ghost';
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => <Disc icon={icon} size={size} tone={tone} pressed={pressed} />}
    </Pressable>
  );
}

/* The same disc with no press handling.
 *
 * Needed wherever the whole card is already the button. Nesting a Pressable inside a
 * Pressable renders as a <button> inside a <button> on web, which is invalid markup, and
 * on both platforms it means the visible target and the real target are different things.
 * Inside a tappable card the disc is an affordance, not a control. */
export function IconBadge({
  icon = 'plus',
  size = 48,
  tone = 'solid',
}: {
  icon?: 'plus' | 'minus' | 'arrow' | 'back' | 'play' | 'check';
  size?: number;
  tone?: 'solid' | 'ghost';
}) {
  return <Disc icon={icon} size={size} tone={tone} pressed={false} />;
}

function Disc({
  icon,
  size,
  tone,
  pressed,
}: {
  icon: 'plus' | 'minus' | 'arrow' | 'back' | 'play' | 'check';
  size: number;
  tone: 'solid' | 'ghost';
  pressed: boolean;
}) {
  const c = useTheme();
  const fg = tone === 'solid' ? c.onAccent : c.ink;
  const s = size * 0.32;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'solid' ? c.accent : c.surfaceStrong,
        borderWidth: tone === 'ghost' ? StyleSheet.hairlineWidth : 0,
        borderColor: c.lineStrong,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.93 : 1 }],
      }}
    >
      <Svg width={s} height={s} viewBox="0 0 16 16">
        {icon === 'plus' && (
          <Path d="M8 2v12M2 8h12" stroke={fg} strokeWidth={2} strokeLinecap="round" />
        )}
        {icon === 'minus' && <Path d="M2.5 8h11" stroke={fg} strokeWidth={2} strokeLinecap="round" />}
        {icon === 'arrow' && (
          <Path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
        {icon === 'back' && (
          <Path d="M9.5 3 4.5 8l5 5" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
        {icon === 'play' && <Path d="M4.5 2.8 13 8l-8.5 5.2z" fill={fg} />}
        {icon === 'check' && (
          <Path d="M3 8.4 6.4 11.8 13 5" stroke={fg} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </Svg>
    </View>
  );
}

/* ---------- faces ----------
 *
 * Five faces replacing a 0-to-10 grid. The value still stores 0-10 underneath so every chart,
 * every export and every existing test keeps working — only the asking changed. */

const FACES: { v: number; label: string; mouth: string; brow?: string }[] = [
  /* Brows angle UP toward the middle, not down. Down-toward-the-middle is an angry face,
     and the question here is how much today hurt, not how cross somebody is. */
  { v: 9, label: 'Rough', mouth: 'M8 21c1.6-2.6 6.4-2.6 8 0', brow: 'M6.6 11 10 9.6M17.4 11 14 9.6' },
  { v: 7, label: 'Hard', mouth: 'M8.5 20.5c1.4-1.4 5.6-1.4 7 0' },
  { v: 5, label: 'Okay', mouth: 'M8.5 19.5h7' },
  { v: 3, label: 'Good', mouth: 'M8.5 18.5c1.4 1.5 5.6 1.5 7 0' },
  { v: 1, label: 'Easy', mouth: 'M8 18c1.6 2.8 6.4 2.8 8 0' },
];

export function FaceScale({
  value,
  onChange,
  /** Optional caption under the row, e.g. what the ends mean. */
  hint,
}: {
  value: number | null;
  onChange: (n: number) => void;
  hint?: string;
}) {
  const c = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {FACES.map((f) => {
          const on = value === f.v;
          return (
            <Pressable
              key={f.v}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={f.label}
              onPress={() => {
                haptic.select();
                onChange(f.v);
              }}
              /* The deselection is what makes the selection feel like it arrived. Nothing
                 used to recede, so nothing landed — the chosen face grew by 6% and the
                 other four sat there at full strength. */
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.8 : value === null || on ? 1 : 0.55,
                transform: [{ scale: on ? 1.12 : value === null ? 1 : 0.92 }],
              })}
            >
              <View
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.accent : c.surfaceStrong,
                  borderWidth: on ? 0 : StyleSheet.hairlineWidth,
                  borderColor: c.lineStrong,
                }}
              >
                <Svg width="62%" height="62%" viewBox="0 0 24 24">
                  <Circle cx={9} cy={13} r={1.3} fill={on ? c.onAccent : c.ink} />
                  <Circle cx={15} cy={13} r={1.3} fill={on ? c.onAccent : c.ink} />
                  <Path d={f.mouth} stroke={on ? c.onAccent : c.ink} strokeWidth={1.7} strokeLinecap="round" fill="none" />
                  {f.brow && (
                    <Path d={f.brow} stroke={on ? c.onAccent : c.ink} strokeWidth={1.5} strokeLinecap="round" />
                  )}
                </Svg>
              </View>
              <Text style={[t.caption, { color: on ? c.ink : c.inkFaint, fontWeight: on ? '700' : '500' }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={[t.caption, { color: c.inkFaint, marginTop: space.sm }]}>{hint}</Text> : null}
    </View>
  );
}

/* ---------- segmented level ----------
 *
 * The reference's energy bar. Ten blocks with a minus and a plus, which is faster to set
 * than picking a number out of a grid and reads as a quantity rather than a grade. */

/** Five words spanning 0–10. A number on its own is not a scale anybody can picture, and
 *  the bar shows no digits, so "0 is none, 10 is the most" described something invisible. */
export type LevelWords = [string, string, string, string, string];

export const URGE_WORDS: LevelWords = ['None', 'A flicker', 'Pulling', 'Strong', 'Could not stop'];
export const STRENGTH_WORDS: LevelWords = ['None', 'Mild', 'Middling', 'Strong', 'As bad as it gets'];
export const CHANCE_WORDS: LevelWords = ['No chance', 'Unlikely', 'Even odds', 'Likely', 'Certain'];

export function wordFor(n: number, words: LevelWords, max = 10): string {
  if (n <= 0) return words[0];
  if (n >= max) return words[4];
  return words[Math.min(3, Math.ceil((n / max) * 4))];
}

export function LevelBar({
  value,
  onChange,
  max = 10,
  lowLabel,
  highLabel,
  words,
}: {
  value: number | null;
  onChange: (n: number) => void;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  /** Turns the picked number into a word. Without this the bar is a quantity with no name. */
  words?: LevelWords;
}) {
  const c = useTheme();
  const v = value ?? 0;
  const step = (d: number) => {
    const next = Math.max(0, Math.min(max, v + d));
    /* Only when it actually moved. A control that taps at you while pinned at zero is a
       control telling you off. */
    if (next !== v) haptic.select();
    onChange(next);
  };

  return (
    <View>
      {/* What you have picked, in a word, before the control that picks it. */}
      {words && (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginBottom: space.md }}>
          <Text style={[t.h1, { color: value === null ? c.inkFaint : c.ink }]}>
            {value === null ? '–' : v}
          </Text>
          <Text style={[t.h3, { color: value === null ? c.inkFaint : c.accentDeep }]}>
            {value === null ? 'nothing picked yet' : wordFor(v, words, max)}
          </Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <CircleButton icon="minus" label="Less" size={40} tone="ghost" onPress={() => step(-1)} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: max }, (_, i) => {
            const filled = i < v;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1} out of ${max}`}
                onPress={() => {
                  if (i + 1 !== v) haptic.select();
                  onChange(i + 1);
                }}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: 8,
                  backgroundColor: filled ? c.accent : c.surfaceStrong,
                  borderWidth: filled ? 0 : StyleSheet.hairlineWidth,
                  borderColor: c.lineStrong,
                }}
              />
            );
          })}
        </View>
        <CircleButton icon="plus" label="More" size={40} tone="ghost" onPress={() => step(1)} />
      </View>
      {(lowLabel || highLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
          <Text style={[t.caption, { color: c.inkFaint }]}>{lowLabel}</Text>
          <Text style={[t.caption, { color: c.inkFaint }]}>{highLabel}</Text>
        </View>
      )}
    </View>
  );
}

/* ---------- segmented toggle ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.surface,
        borderRadius: radius.pill,
        padding: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.line,
        alignSelf: 'flex-start',
      }}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: space.lg,
              borderRadius: radius.pill,
              backgroundColor: on ? c.surfaceSolid : 'transparent',
            }}
          >
            <Text style={[t.label, { color: on ? c.ink : c.inkFaint }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- the ground every screen stands on ----------
 *
 * Atmosphere fixed behind a scroll view, content in a centred column. Fixed rather than
 * scrolled on purpose: the frost needs something moving independently behind it, and that
 * parallax is most of what sells the glass as glass rather than as a grey box. */

export function Ground({
  children,
  tabBarSpace = false,
  variant,
}: {
  children: React.ReactNode;
  tabBarSpace?: boolean;
  variant?: AtmosphereKey;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere
        variant={variant ?? atmosphereForScheme(c.isDark)}
        rounded="none"
        scrim={false}
        style={StyleSheet.absoluteFill as never}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.sm,
          paddingBottom: insets.bottom + (tabBarSpace ? TAB_BAR_HEIGHT + space.xl : space.xxxl),
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, paddingHorizontal: space.lg }}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- top bar ----------
 *
 * Back belongs in the top left. Every one of these screens used to put it in a ghost button
 * at the bottom, sometimes eight hundred pixels below the fold, which is not a back
 * affordance — it is a button you find by accident after you have already given up. */

export function TopBar({
  onBack,
  title,
  right,
}: {
  onBack: () => void;
  title?: string;
  right?: React.ReactNode;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 }}>
      <CircleButton icon="back" label="Go back" size={40} tone="ghost" onPress={onBack} />
      {title ? <Text style={[t.h3, { color: c.ink, flex: 1 }]}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

/* ---------- step pips ----------
 *
 * Segments, not a percentage. A bar that creeps is a bar you watch. */

export function Steps({ total, current }: { total: number; current: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop: space.lg }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: radius.pill,
            /* The unfilled track was `surfaceStrong`, which on the light palette is 0.90
               alpha warm white — measured against the pale atmosphere ramps it sits between
               1.10:1 and 1.27:1, so the remaining steps were effectively invisible and a
               four-step bar read as one filled bar with nothing after it. WCAG 1.4.11 asks
               3:1 of a component that conveys state, and this one is the only thing on some
               screens saying how far through you are. */
            backgroundColor: i <= current ? c.accent : c.lineStrong,
          }}
        />
      ))}
    </View>
  );
}

/* ---------- what does this mean? ----------
 *
 * A question in the app's own voice, tapped to open the answer in place.
 *
 * The alternative was a caption under every figure, and that fails in both directions: it
 * is noise for somebody who already knows, and it is never quite enough for somebody who
 * does not. A collapsed question costs one line, reads as an offer rather than an
 * instruction, and can hold three full sentences when it opens.
 *
 * This is the only "hidden" content in the app. Everything else is on the surface, because
 * a person who is anxious will not go hunting. The rule for what may live in here: the
 * screen must still be usable and honest with every one of these closed. */

export function Explain({ q, a }: { q: string; a: string }) {
  const c = useTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <View style={{ marginTop: space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={q}
        onPress={() => setOpen((v) => !v)}
        hitSlop={8}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 17,
            height: 17,
            borderRadius: 9,
            borderWidth: 1.2,
            borderColor: c.accentDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            maxFontSizeMultiplier={IN_FIXED_SHAPE}
            style={[t.caption, { color: c.accentDeep, fontSize: 11, lineHeight: 13, fontWeight: '700' }]}
          >
            {open ? '−' : '?'}
          </Text>
        </View>
        <Text style={[t.caption, { color: c.accentDeep, fontWeight: '600' }]}>{q}</Text>
      </Pressable>
      {open && (
        <Text style={[t.bodySm, { color: c.inkSoft, marginTop: 2, marginBottom: space.xs }]}>{a}</Text>
      )}
    </View>
  );
}

/* ---------- glyphs ----------
 *
 * Every list row in this app used to carry a 64 or 78px Atmosphere gradient. At that size
 * the gradients are indistinguishable blurred smudges, and six of them stacked read as six
 * images that failed to load rather than as artwork.
 *
 * Vector only, and nothing depicting a person — the same constraint components/Atmosphere
 * was written under, and for the same reason. */

export type GlyphKind =
  | 'rings' | 'senses' | 'wave' | 'anchor' | 'mirror' | 'page' | 'flask' | 'plus' | 'book'
  | 'curve';

export function Glyph({ kind, color, size = 24 }: { kind: GlyphKind; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {kind === 'rings' && (
        <>
          <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.6} />
          <Circle cx={12} cy={12} r={7} stroke={color} strokeWidth={1.6} opacity={0.65} />
          <Circle cx={12} cy={12} r={10.5} stroke={color} strokeWidth={1.6} opacity={0.35} />
        </>
      )}
      {kind === 'senses' && (
        <>
          <Path d="M4 12h4M16 12h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Path d="M12 4v4M12 16v4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Circle cx={12} cy={12} r={2.4} stroke={color} strokeWidth={1.7} />
        </>
      )}
      {kind === 'wave' && (
        <>
          <Path d="M2.5 14c3-5 6.5-5 9.5 0s6.5 5 9.5 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M2.5 8.5c3-5 6.5-5 9.5 0s6.5 5 9.5 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.45} />
        </>
      )}
      {kind === 'anchor' && (
        <>
          <Path d="M12 6.5V19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={12} cy={4.6} r={2} stroke={color} strokeWidth={1.7} />
          <Path d="M5 13.5c0 4 3.4 5.8 7 5.8s7-1.8 7-5.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8.6 10h6.8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </>
      )}
      {/* A soft-edged rectangle. Deliberately empty: a mirror glyph with a face in it would
          be the one image this app must never draw. */}
      {kind === 'mirror' && (
        <>
          <Path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke={color} strokeWidth={1.7} />
          <Path d="M8.6 7.4v6" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
        </>
      )}
      {kind === 'page' && (
        <>
          <Path d="M6 3.5h9L18.5 7v13.5H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d="M9 11h6.5M9 14.5h6.5M9 17.5h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.65} />
        </>
      )}
      {kind === 'flask' && (
        <>
          <Path d="M10 3.5v5.2L5.6 17.4A1.6 1.6 0 0 0 7 19.8h10a1.6 1.6 0 0 0 1.4-2.4L14 8.7V3.5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d="M9 3.5h6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Path d="M7.8 14.5h8.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
        </>
      )}
      {kind === 'plus' && <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={1.9} strokeLinecap="round" />}
      {/* Two paths leaving the same point: one straight, one bending away from it. The whole
          game in one mark — and the difference between them is drawn as a difference in
          shape rather than in colour, for the same reason the game itself is. */}
      {kind === 'curve' && (
        <>
          <Path d="M4 20 20 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.4} />
          <Path d="M4 20C10 18 12.5 12 20 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={4} cy={20} r={1.7} fill={color} />
        </>
      )}
      {kind === 'book' && (
        <>
          <Path d="M4 5.2c2.6-1 5.3-1 8 0v14c-2.7-1-5.4-1-8 0z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d="M12 5.2c2.7-1 5.4-1 8 0v14c-2.6-1-5.3-1-8 0" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}

/* ---------- list row ----------
 *
 * One row shape for every menu in the app. Icon, title, one line under it, and a state
 * mark on the right that is either a chevron, a lock label or a check. The check matters
 * more than it looks: a menu that is identical before and after you use it is a menu that
 * makes finishing something feel like nothing happened. */

export function ListRow({
  glyph,
  title,
  sub,
  onPress,
  done = false,
  lock,
  first = false,
  count,
}: {
  glyph: GlyphKind;
  title: string;
  sub: string;
  onPress: () => void;
  done?: boolean;
  /** e.g. "Week 5" — shown instead of the chevron when the item is not open yet. */
  lock?: string;
  first?: boolean;
  /** "3 this week", when there is something to count. */
  count?: string;
}) {
  const c = useTheme();
  const locked = !!lock;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}${locked ? `, opens ${lock}` : ''}${done ? ', done' : ''}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.lg,
        paddingVertical: space.md,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.line,
        opacity: pressed ? 0.85 : locked ? 0.62 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.accentDim,
        }}
      >
        <Glyph kind={glyph} color={c.accentDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[t.h3, { color: c.ink }]}>{title}</Text>
        <Text style={[t.caption, { color: c.inkFaint, marginTop: 2 }]}>{count ?? sub}</Text>
      </View>
      {locked ? (
        <Text style={[t.caption, { color: c.inkFaint }]}>{lock}</Text>
      ) : done ? (
        <Svg width={18} height={18} viewBox="0 0 16 16">
          <Path d="M3 8.4 6.4 11.8 13 5" stroke={c.cool} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      ) : (
        <Text style={[t.body, { color: c.inkFaint }]}>›</Text>
      )}
    </Pressable>
  );
}

/* ---------- week strip ----------
 *
 * The reference has a Today/Week toggle; the thing it implies, and the biggest missing
 * piece in the old app, is being able to see your run at a glance. Seven dots is the
 * whole feature.
 *
 * A missed day is a hollow ring, never a red mark or a break in a chain. SAFETY.md §3:
 * the person most likely to miss a week is the person having the worst week, and they are
 * exactly who this app needs to keep. */

export function WeekStrip({ days }: { days: { key: string; label: string; done: boolean; today: boolean }[] }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((d) => (
        <View key={d.key} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
          <Text style={[t.caption, { color: d.today ? c.ink : c.inkFaint, fontWeight: d.today ? '700' : '500' }]}>
            {d.label}
          </Text>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: d.done ? c.accent : 'transparent',
              borderWidth: d.done ? 0 : 1.5,
              borderColor: d.today ? c.accent : c.lineStrong,
            }}
          >
            {d.done && (
              <Svg width={13} height={13} viewBox="0 0 16 16">
                <Path d="M3.4 8.4 6.5 11.4 12.6 5" stroke={c.onAccent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
