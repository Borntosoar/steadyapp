import React, { createContext, useContext } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, useColorScheme, Platform,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

/* ---------- text ---------- */

type TxtProps = { children: React.ReactNode; style?: TextStyle | TextStyle[]; numberOfLines?: number };

const mk = (variant: keyof typeof t, colorKey: keyof Palette = 'ink') =>
  function Txt({ children, style, numberOfLines }: TxtProps) {
    const c = useTheme();
    return (
      <Text numberOfLines={numberOfLines} style={[t[variant], { color: c[colorKey] as string }, style as TextStyle]}>
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
export function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
  style,
}: {
  label?: string;
  hint?: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
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

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'cool' }) {
  const c = useTheme();
  const bg = tone === 'accent' ? c.accentDim : tone === 'cool' ? c.coolDim : c.surfaceStrong;
  const fg = tone === 'accent' ? c.accentDeep : tone === 'cool' ? c.cool : c.inkSoft;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: space.md, alignSelf: 'flex-start' }}>
      <Text style={[t.caption, { color: fg }]}>{label}</Text>
    </View>
  );
}

export const isWeb = Platform.OS === 'web';
