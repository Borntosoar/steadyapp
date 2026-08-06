import React, { useEffect } from 'react';
import { View, Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../components/ui';
import { useStore } from '../store/useStore';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';

/* Support is reachable in <= 2 taps from every screen: this bar is always mounted, so
 * it is always exactly one tap. Non-negotiable, see SAFETY.md. */
function SupportBar() {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (pathname === '/support') return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 6,
        right: 0,
        left: 0,
        alignItems: 'center',
        pointerEvents: 'box-none',
      }}
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, alignItems: 'flex-end', paddingRight: space.lg }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Support and crisis lines"
          onPress={() => router.push('/support')}
          style={({ pressed }) => ({
            backgroundColor: c.surface,
            borderColor: c.warn,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.pill,
            paddingVertical: 6,
            paddingHorizontal: space.md,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={[t.caption, { color: c.warn, fontWeight: '600' }]}>Support</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Gate() {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const disclaimerAcceptedAt = useStore((s) => s.profile.disclaimerAcceptedAt);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = pathname.startsWith('/onboarding');
    if (!disclaimerAcceptedAt && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [hydrated, disclaimerAcceptedAt, pathname, router]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'fade',
        }}
      />
      <SupportBar />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Gate />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
