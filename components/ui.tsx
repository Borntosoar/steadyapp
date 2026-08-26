import React, { createContext, useContext } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, useColorScheme, Platform,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  palette, space, radius, type as t, LAYOUT_MAX_WIDTH, TAB_BAR_HEIGHT, type Palette,
} from '../constants/theme';

/* ---------- theme ---------- */

const ThemeCtx = createContext<Palette>(palette.light);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  /* Light is the default now; dark arrives when the phone asks for it. The reasoning is in
     constants/theme.ts — most opens are in the morning, and meeting that with a near-black
     slab was the thing that made this app feel like an instrument. */
  const c = scheme === 'dark' ? (palette.dark as Palette) : palette.light;
  return <ThemeCtx.Provider value={c}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/* ---------- layout ---------- */

export function Screen({
  children,
  scroll = true,
  style,
  padded = true,
  tabBarSpace = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  tabBarSpace?: boolean;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const pad = padded ? space.lg : 0;

  const inner = (
    <View style={[{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: pad }, style]}>
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <View style={{ flex: 1, width: '100%', maxWidth: LAYOUT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: pad }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.sm,
        paddingBottom: insets.bottom + (tabBarSpace ? TAB_BAR_HEIGHT + space.xl : space.xxxl),
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  );
}

/** Full-bleed section that escapes the Screen's horizontal padding. */
export function Bleed({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ marginHorizontal: -space.lg }, style]}>{children}</View>;
}

/* ---------- text ----------
 *
 * DYNAMIC TYPE. iOS lets a person set text anywhere from 82% to 310% of the default, and a
 * meaningful share of this app's audience will have moved that slider — appearance anxiety
 * co-occurs with a lot of things, and reading a twelve-week programme is a lot of reading.
 * React Native scales text automatically, which is the right default and stays on. The
 * failure mode is not the text: it is layouts that assumed a height.
 *
 * WHY THERE ARE CAPS AT ALL, AND WHY THEY DIFFER BY VARIANT.
 *
 * Body text is capped generously (2x) because it is the content — somebody who needs 300%
 * text needs to read the module, and a screen that scrolls further is a fine outcome.
 *
 * Display and hero type are capped hard (1.4x / 1.3x), and that is not a compromise on
 * accessibility. `hero` is already 64pt: at 310% it is 198pt, which fits roughly two
 * characters on an iPhone and turns "15.8 hours back this week" into a wall nobody can read.
 * A number that is too big to see is not more accessible than one that is merely large. The
 * capped size is still far above the default body size, so the hierarchy survives and the
 * figure stays legible.
 *
 * Nothing here disables scaling. `allowFontScaling={false}` appears nowhere in this
 * codebase, and __tests__/a11y.test.mjs fails if it ever does. */

const MAX_SCALE: Partial<Record<keyof typeof t, number>> = {
  hero: 1.3,
  timer: 1.3,
  display: 1.4,
  h1: 1.6,
  h2: 1.7,
  // h3, body, bodySm, label, caption: uncapped. Content scales as far as the user asked.
};

type TxtProps = { children: React.ReactNode; style?: TextStyle | TextStyle[]; numberOfLines?: number };

const mk = (variant: keyof typeof t, colorKey: keyof Palette = 'ink') =>
  function Txt({ children, style, numberOfLines }: TxtProps) {
    const c = useTheme();
    return (
      <Text
        numberOfLines={numberOfLines}
        maxFontSizeMultiplier={MAX_SCALE[variant]}
        style={[t[variant], { color: c[colorKey] as string }, style as TextStyle]}
      >
        {children}
      </Text>
    );
  };

export const Hero = mk('hero');
export const Display = mk('display');
export const H1 = mk('h1');
export const H2 = mk('h2');
export const H3 = mk('h3');
export const Body = mk('body');
export const BodySm = mk('bodySm', 'inkSoft');
export const Label = mk('label', 'inkSoft');
export const Caption = mk('caption', 'inkFaint');

/** For text inside a shape that cannot grow — a 44pt disc, a week-strip circle, a badge.
 *
 *  The shape is the constraint, not the type. Scaling the glyph inside a fixed circle does
 *  not make it readable, it makes it clipped, and a clipped character is worse than a small
 *  one. Use this ONLY where the container is genuinely fixed by design and the text is a
 *  single character or a short number; anywhere else, make the container grow instead. */
export const IN_FIXED_SHAPE = 1.15;

/* ---------- surfaces ----------
 * Cards are used sparingly and never nested. Most grouping is done with spacing and
 * hairline rules, which is quieter and stops the screen reading as a stack of boxes. */

export function Card({
  children,
  style,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tone?: 'surface' | 'accent' | 'cool' | 'plain';
}) {
  const c = useTheme();
  const bg =
    tone === 'accent' ? c.accentDim : tone === 'cool' ? c.coolDim : tone === 'plain' ? 'transparent' : c.surface;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.card,
          padding: space.lg,
          borderWidth: tone === 'plain' ? 0 : StyleSheet.hairlineWidth,
          borderColor: c.line,
          marginBottom: space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Horizontal hairline. The default grouping device — cheaper than a card. */
export function Rule({ style }: { style?: ViewStyle }) {
  const c = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.line }, style]} />;
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }, style]}>
      {children}
    </View>
  );
}

/* ---------- controls ---------- */

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const c = useTheme();
  /* A disabled button is a button that is WAITING, not a button that is broken. Fading the
     whole thing to 38% turned the fill muddy and dropped the label to about 1.7:1, so the
     primary action read as damaged at exactly the moment somebody was deciding whether this
     app works. Disabled swaps the colours instead of dimming them; the label stays legible. */
  const off = !!disabled;
  const bg = off
    ? c.surface
    : variant === 'primary' ? c.accent : variant === 'secondary' ? c.surfaceStrong : 'transparent';
  const fg = off
    ? c.inkFaint
    : variant === 'primary' ? c.onAccent : variant === 'ghost' ? c.inkSoft : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingVertical: 15,
          paddingHorizontal: space.xl,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: space.sm,
          borderWidth: off || variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          borderColor: off ? c.lineStrong : c.line,
          opacity: pressed && !off ? 0.86 : 1,
          minHeight: 50,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[t.body, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

/** Tappable option row. Deliberately not a drag slider: sliders invite micro-adjustment,
 *  which is its own form of checking, and they behave poorly on web. */
export function Options<T extends string | number>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
  labels?: string[];
}) {
  const c = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {options.map((o, i) => {
        const on = value === o;
        return (
          <Pressable
            key={String(o)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={({ pressed }) => ({
              backgroundColor: on ? c.accentDim : c.surface,
              borderColor: on ? c.accent : c.line,
              borderWidth: on ? 1 : StyleSheet.hairlineWidth,
              borderRadius: radius.md,
              paddingVertical: 15,
              paddingHorizontal: space.lg,
              opacity: pressed ? 0.9 : 1,
              minHeight: 52,
              justifyContent: 'center',
            })}
          >
            <Text style={[t.body, { color: on ? c.accentDeep : c.ink }]}>{labels?.[i] ?? String(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* `Scale`, the 0-to-10 tap grid, lived here and is gone. It was eleven 40px targets that
 * wrapped to seven-plus-four on a phone, stranding its own end labels under an empty row,
 * and it asked somebody to grade how bad they feel before they had started. The
 * replacements are `FaceScale` and `LevelBar` in components/frost.tsx. Both still store
 * 0-10, so nothing downstream noticed. */

/** Labelled text input. Deliberately borderless with a single underline rule: a boxed
 *  field per question turns a reflective screen into a form, and these screens are asking
 *  for things people find hard to type at all. */
/** Character ceilings for a single field. Generous — roughly 700 words on a multiline
 *  field — and there to bound the serialised payload, not to ration what anybody writes.
 *  See the note on `maxLength` below. */
export const FIELD_MAX_MULTILINE = 4000;
export const FIELD_MAX_SINGLE = 300;

export function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
  maxLength,
  style,
}: {
  label?: string;
  hint?: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
  maxLength?: number;
  style?: ViewStyle;
}) {
  const c = useTheme();
  return (
    <View style={[{ marginBottom: space.xl }, style]}>
      {label ? <Text style={[t.h3, { color: c.ink }]}>{label}</Text> : null}
      {hint ? <Text style={[t.caption, { color: c.inkFaint, marginTop: 2 }]}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkFaint}
        multiline={multiline}
        /* Inert on native; load-bearing on web. react-native-web renders this as a
           <textarea>, and browser spellcheck is on by default — Chrome's Enhanced Spellcheck
           and Edge's Microsoft Editor upload the full contents of such a field to Google and
           Microsoft. For the one surface in this app where somebody writes about their own
           body, that is the difference between "nothing leaves this phone" being true and
           being true only on iOS. autoComplete for the same reason: this text must never
           reach a browser's saved-form store. */
        spellCheck={false}
        autoCorrect={false}
        autoComplete="off"
        /* A ceiling on one field, not on how much somebody may write overall.
           The whole state is serialised into a single value on every mutation, so payload
           size is a real constraint: measured, 5,000 thought records is a 49MB blob and an
           800ms JSON.stringify on desktop, and the web build's localStorage gives up around
           5MB and then fails every write from then on. This caps the input that drives that,
           at a length no honest journal entry reaches — around 700 words on a multiline
           field.
           What this deliberately does NOT do is prune old records. Dropping somebody's
           oldest writing to save a few hundred milliseconds is not a trade this app gets to
           make on their behalf; there is no server and no backup, so a pruned record is
           gone. If the payload ever does get large, the answer is to say so, not to quietly
           delete the thing they came here to keep. */
        maxLength={maxLength ?? (multiline ? FIELD_MAX_MULTILINE : FIELD_MAX_SINGLE)}
        style={{
          ...t.body,
          color: c.ink,
          marginTop: space.sm,
          paddingVertical: space.sm,
          minHeight: minHeight ?? (multiline ? 84 : 44),
          textAlignVertical: multiline ? 'top' : 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.lineStrong,
        }}
      />
    </View>
  );
}

/** A small pill. `glyph="lock"` draws a padlock before the label.
 *
 *  The padlock is an accessibility fix, not an ornament. On Learn, "Free" and "Anneal+" were
 *  two filled pills differing only in hue — terracotta against moss — so the most
 *  consequential distinction on the screen, can I open this or not, was carried by colour
 *  alone. That is WCAG 1.4.1, and it fails for the eight percent of men with a colour vision
 *  deficiency before it fails for anybody else. The word was always there; now a shape is
 *  too, and a shape is what survives being desaturated. */
export function Chip({
  label, tone = 'neutral', glyph,
}: { label: string; tone?: 'neutral' | 'accent' | 'cool'; glyph?: 'lock' }) {
  const c = useTheme();
  const bg = tone === 'accent' ? c.accentDim : tone === 'cool' ? c.coolDim : c.surfaceStrong;
  const fg = tone === 'accent' ? c.accentDeep : tone === 'cool' ? c.cool : c.inkSoft;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingVertical: 5,
        paddingHorizontal: space.md,
        alignSelf: 'flex-start',
      }}
    >
      {glyph === 'lock' && (
        /* Decorative, and deliberately carrying no accessibility props of its own. The label
           beside it already reads "Anneal+", so a screen reader announcing "lock, Anneal plus"
           would be worse than one announcing "Anneal plus" — and an SVG with no <title> is not
           announced anyway. Putting `importantForAccessibility` here to say so was worse
           still: react-native-web forwards unknown props to the DOM node, so it logged a React
           warning on every render of every locked row. */
        <Svg width={11} height={11} viewBox="0 0 12 12">
          <Path
            d="M3.4 5.4V3.9a2.6 2.6 0 0 1 5.2 0v1.5"
            stroke={fg}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
          <Rect x={2.3} y={5.4} width={7.4} height={5.2} rx={1.3} fill={fg} />
        </Svg>
      )}
      <Text style={[t.caption, { color: fg }]}>{label}</Text>
    </View>
  );
}

export const isWeb = Platform.OS === 'web';
