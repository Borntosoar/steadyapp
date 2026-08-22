import React, { useEffect } from 'react';
import { View, Pressable, Text, ActivityIndicator, StyleSheet, Platform, AppState as RNAppState } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../components/ui';
import { useStore, flushState } from '../store/useStore';
import { useEntitlement } from '../hooks/useEntitlement';
import { CrashBoundary } from '../components/CrashScreen';
import { initDeviceCrypto } from '../hooks/deviceKey';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';

/** Routes that stay reachable before the disclaimer has been accepted.
 *
 *  Deliberately only two, and deliberately not `ALWAYS_FREE_ROUTES` — see the redirect
 *  effect below for why reusing that list would be a consent bug. Pinned by
 *  `__tests__/safety.test.mjs`. */
const CRISIS_ROUTES = ['/support', '/grounding'];

/** Horizontal space a screen must leave clear in its top-right corner.
 *
 *  The Support pill is absolutely positioned over every screen, so nothing can flow around
 *  it — content simply passes underneath. At default text size the greeting on Today cleared
 *  it by luck; at larger sizes, or with a longer name, the name went behind the pill.
 *  Exported so the screens that put text in that corner reserve the space deliberately
 *  rather than each guessing a padding. */
export const SUPPORT_PILL_CLEARANCE = 104;

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
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            /* OPAQUE, not a scrim, and this was a real defect rather than a taste call.
               It was `c.scrim` — rgba(…,0.74) with no blur behind it — so body text passing
               under the pill during a normal scroll came through at 26% opacity instead of
               being hidden. On the paywall it landed across the sentence disclosing what
               happens after the trial, which is a Guideline 3.1.2 exposure as well as a
               legibility one: reviewers reject on what the screenshot shows. It is also
               strictly worse than occlusion, because a reader cannot tell whether they are
               seeing a rendering fault or content, and it silently voided the pill label's
               own tested contrast by making its background live body text.

               Content fully hidden behind an obviously elevated opaque object reads as
               chrome and is recovered by one scroll gesture. That is the correct behaviour
               for a floating control. */
            backgroundColor: c.surfaceSolid,
            borderColor: c.lineStrong,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.pill,
            paddingVertical: 7,
            paddingLeft: space.md,
            paddingRight: 14,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.warn }} />
          {/* Capped: this label lives in a pill that overlays content and must stay one
              line. It is chrome, not content — the word is a landmark rather than something
              to read, and it is the same word every time. */}
          <Text maxFontSizeMultiplier={1.3} style={[t.caption, { color: c.ink, fontWeight: '600' }]}>
            Support
          </Text>
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
  const surveyedAt = useStore((s) => s.profile.surveyedAt);

  const { refresh } = useEntitlement();

  /* The device key is fetched BEFORE hydration, and the ordering is the whole point.
     loadState() cannot read a sealed payload without it, and its correct response to a
     sealed payload with no key is to quarantine and lock writes — which is right when the
     keychain is genuinely unreachable and catastrophic if it merely had not been asked yet.
     Awaited, never raced.
     initDeviceCrypto resolves rather than rejects on every path, so a keychain failure
     degrades to plaintext storage instead of an app that will not start. */
  useEffect(() => {
    void (async () => {
      await initDeviceCrypto();
      await hydrate();
    })();
  }, [hydrate]);

  /* Re-ask the store who this person is, at launch and every time the app comes forward.
     This is what makes entitlement a projection rather than a boolean nobody ever clears:
     a refund, an expiry, a cancellation or a lapsed card all arrive through here.
     It writes nothing when the provider cannot be reached, so being offline never revokes
     anything — see hooks/useEntitlement.ts. */
  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  /* Writes are debounced 150ms, which is right while the app is in front of somebody and
     wrong the instant it is not: a mutation followed by a home-swipe-and-kill inside that
     window is simply lost, and there is no server to re-fetch it from. Flush on the way
     out on both platforms — `pagehide` rather than `beforeunload`, because Safari does not
     fire the latter reliably on mobile. */
  useEffect(() => {
    if (Platform.OS === 'web') {
      const onHide = () => void flushState();
      window.addEventListener('pagehide', onHide);
      return () => window.removeEventListener('pagehide', onHide);
    }
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') void flushState();
      if (next === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  /* The disclaimer gate, with the crisis surfaces carved out of it.
   *
   * Without the exemption this is a trap rather than a gate, and it closes on the worst
   * possible person. After a failed load the state is emptyState(), so
   * `disclaimerAcceptedAt` is null even for somebody who has used the app for months. They
   * tap the always-mounted Support pill; the pathname changes; this effect fires; they are
   * replaced back into onboarding. Crisis support is unreachable. It does not clear on
   * restart either: `acceptDisclaimer` writes through `persist`, which returns early while
   * `loadOk` is false, so the acceptance never survives — the loop is permanent, and the
   * person caught in it is the one whose journal just became unreadable.
   *
   * NOT `ALWAYS_FREE_ROUTES`. That list is the BILLING carve-out and it contains '/' and
   * '/paywall', so reusing it here would let a genuine first-run user walk past the
   * disclaimer onto the home screen — trading a lockout bug for a consent bug. The two
   * lists answer different questions and only overlap by coincidence.
   *
   * These two routes are the ones somebody in trouble reaches for, and neither collects
   * anything or claims anything that the disclaimer is there to qualify: one is a list of
   * phone numbers, the other is breathing. */
  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = pathname.startsWith('/onboarding');
    const isCrisisSurface = CRISIS_ROUTES.includes(pathname);
    if (!disclaimerAcceptedAt && !inOnboarding && !isCrisisSurface) {
      /* THE SURVEY COMES FIRST, AND THE DISCLAIMER STILL COMES BEFORE THE APP.
         Three questions about what somebody is carrying, then the existing flow, which is
         where consent is actually recorded — `disclaimerAcceptedAt` remains the only thing
         this gate tests, so nothing legal can be skipped by finishing or skipping a survey.
         Somebody who has already answered goes straight to the disclaimer rather than being
         asked again. */
      router.replace(surveyedAt ? '/onboarding' : '/onboarding/survey');
    }
  }, [hydrated, disclaimerAcceptedAt, surveyedAt, pathname, router]);

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

/* expo-router mounts a layout's exported `ErrorBoundary` when anything below it throws.
   Exported here, from the root layout, it covers every screen in the app.

   Before this existed a single render-time TypeError took the whole tree down, SupportBar
   included, leaving a blank screen with no crisis numbers and no way to export. Several
   concrete routes to that state were found and fixed alongside this; the boundary is here
   because that list is not provably complete. */
export { CrashScreen as ErrorBoundary } from '../components/CrashScreen';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        {/* Belt and braces. expo-router's ErrorBoundary catches throws inside a ROUTE; this
            catches the ones in Gate itself, which is where hydration and the redirect live
            and therefore where a bad payload lands first. */}
        <CrashBoundary>
          <Gate />
        </CrashBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
