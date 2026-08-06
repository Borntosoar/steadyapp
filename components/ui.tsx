import React, { createContext, useContext } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, space, radius, type as t, LAYOUT_MAX_WIDTH, type Palette } from '../constants/theme';

/* ---------- theme ---------- */

const ThemeCtx = createContext<Palette>(palette.light);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? palette.dark : palette.light;
  return <ThemeCtx.Provider value={c}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/* ---------- layout ---------- */

/** Phone-width column, centred on wide viewports so the desktop browser build reads as
 *  a product rather than a stretched mobile app. */
export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const inner = (
    <View style={[{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, alignSelf: 'center', padding: space.lg }, style]}>
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>{inner}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.sm,
        paddingBottom: insets.bottom + space.xxxl,
        alignItems: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  );
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

export const Display = mk('display');
export const H1 = mk('h1');
export const H2 = mk('h2');
export const H3 = mk('h3');
export const Body = mk('body');
export const BodySm = mk('bodySm', 'inkSoft');
export const Label = mk('label', 'inkSoft');
export const Caption = mk('caption', 'inkFaint');

/* ---------- card ---------- */

export function Card({
  children,
  style,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tone?: 'surface' | 'accent' | 'flat';
}) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === 'accent' ? c.accentPale : tone === 'flat' ? 'transparent' : c.surface,
          borderRadius: radius.lg,
          padding: space.lg,
          borderWidth: tone === 'flat' ? 0 : StyleSheet.hairlineWidth,
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

/* ---------- buttons ---------- */

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useTheme();
  const bg = variant === 'primary' ? c.accent : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'ghost' ? c.inkSoft : c.accentDeep;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingVertical: 14,
          paddingHorizontal: space.xl,
          alignItems: 'center',
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          borderColor: c.line,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          minHeight: 48,
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={[t.body, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

/** Tappable option row — used for every scale in the app.
 *  Deliberately not a drag slider: sliders invite micro-adjustment, which is its own
 *  form of checking, and they are unreliable on web. */
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
        const active = value === o;
        return (
          <Pressable
            key={String(o)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o)}
            style={({ pressed }) => ({
              backgroundColor: active ? c.accentPale : c.surface,
              borderColor: active ? c.accent : c.line,
              borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
              borderRadius: radius.md,
              paddingVertical: 14,
              paddingHorizontal: space.lg,
              opacity: pressed ? 0.9 : 1,
              minHeight: 48,
              justifyContent: 'center',
            })}
          >
            <Text style={[t.body, { color: active ? c.accentDeep : c.ink }]}>
              {labels?.[i] ?? String(o)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 0–10 horizontal scale. Big targets, no dragging. */
export function Scale({
  value,
  onChange,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}) {
  const c = useTheme();
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {nums.map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${n} out of ${max}`}
              onPress={() => onChange(n)}
              style={{
                width: 40,
                height: 44,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? c.accent : c.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: active ? c.accent : c.line,
              }}
            >
              <Text style={[t.body, { color: active ? '#fff' : c.inkSoft, fontWeight: active ? '700' : '400' }]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {(lowLabel || highLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs }}>
          <Caption>{lowLabel}</Caption>
          <Caption>{highLabel}</Caption>
        </View>
      )}
    </View>
  );
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' }) {
  const c = useTheme();
  return (
    <View
      style={{
        backgroundColor: tone === 'accent' ? c.accentPale : c.surfaceAlt,
        borderRadius: radius.pill,
        paddingVertical: 5,
        paddingHorizontal: space.md,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={[t.caption, { color: tone === 'accent' ? c.accentDeep : c.inkSoft }]}>{label}</Text>
    </View>
  );
}

export function Divider() {
  const c = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginVertical: space.lg }} />;
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }, style]}>
      {children}
    </View>
  );
}

export const isWeb = Platform.OS === 'web';
