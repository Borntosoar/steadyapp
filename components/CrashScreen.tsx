import React from 'react';
import { View, Text, Pressable, ScrollView, Linking, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ui';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { exportJson } from '../lib/storage';
import { useStore } from '../store/useStore';
import { regionByKey } from '../constants/support';

/* The backstop.
 *
 * WHY THIS EXISTS. Until now there was no error boundary anywhere in the app, which meant
 * any render-time throw unmounted the entire tree — including the always-mounted SupportBar
 * that SAFETY.md §4 makes non-negotiable. The person was left on a blank screen with no
 * crisis numbers, no breathing exercise, no relapse plan, and no way to get their own
 * writing out. Their only move was to delete the app, which is total loss, because there is
 * no server and no backup.
 *
 * Several concrete routes to that blank screen were found and fixed in the same pass — a
 * persisted payload overwriting the store's own methods, uncoerced nested arrays, malformed
 * collection rows. This component exists because that list is not provably complete and the
 * next one will be found the same way: from a user who cannot tell us, because their app
 * will not open.
 *
 * WHAT IT MUST DO, IN ORDER. Get them to help; get their data out; then, and only then,
 * offer to reset. Nothing here reads state that could itself be the thing that crashed —
 * the crisis numbers are a static table, and the export is wrapped in its own try.
 *
 * SAFETY: this screen must never mention the paywall, a subscription, or a price. Somebody
 * whose app has just broken is not a sales opportunity. `__tests__/safety.test.mjs` greps
 * this file for exactly that.
 */

export function CrashScreen({ error, onReset }: { error?: Error; onReset?: () => void }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = React.useState<'idle' | 'ok' | 'failed'>('idle');

  /* Read straight from the store rather than through a selector, and never let a failure
     here take the screen down with it — this may be the only remaining route by which the
     person gets their own writing off the device. */
  const rescue = async () => {
    try {
      const json = exportJson(useStore.getState() as never);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `anneal-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        await Share.share({ message: json });
      }
      setSaved('ok');
    } catch {
      setSaved('failed');
    }
  };

  /* Hard-coded to the default region rather than read from the profile. The profile lives
     in the state that may be the thing that just crashed, and `regionByKey` falls back
     safely on its own. A phone number that is right for most people beats no phone number. */
  const region = regionByKey('us');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.xxl,
        }}
      >
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, paddingHorizontal: space.lg }}>
          <Text style={[t.h1, { color: c.ink }]}>Something went wrong</Text>
          <Text style={[t.body, { color: c.inkSoft, marginTop: space.md }]}>
            This is the app failing, not you. Your writing is still on this phone. Nothing
            has been sent anywhere and nothing has been deleted.
          </Text>

          {/* Help first. Always first. */}
          <View
            style={{
              marginTop: space.xl,
              padding: space.lg,
              borderRadius: radius.card,
              backgroundColor: c.coolDim,
            }}
          >
            <Text style={[t.h3, { color: c.ink }]}>If you need someone right now</Text>
            {/* Round-the-clock lines only. This screen appears when the app has already
                failed, and there is no room on it to explain that the number it just offered
                does not answer until two in the afternoon. Filtered rather than sliced blind,
                so that reordering a region's lines can never put a part-time one here. */}
            {region.lines.filter((l) => l.hours === '24/7').slice(0, 2).map((line) => (
              <Pressable
                key={line.contact}
                accessibilityRole="button"
                accessibilityLabel={`Call ${line.name}`}
                onPress={() => Linking.openURL(`tel:${line.contact.replace(/[^\d+]/g, '')}`)}
                style={({ pressed }) => ({ paddingVertical: space.md, opacity: pressed ? 0.6 : 1, minHeight: 44 })}
              >
                <Text style={[t.body, { color: c.cool }]}>
                  {line.name} — {line.contact}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Their data out, second. */}
          <Text style={[t.h3, { color: c.ink, marginTop: space.xl }]}>Save a copy first</Text>
          <Text style={[t.bodySm, { color: c.inkSoft, marginTop: space.xs }]}>
            There is no server and no backup, so this file is the only copy that survives if
            you reinstall. Do this before anything else.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={rescue}
            style={({ pressed }) => ({
              marginTop: space.md,
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderRadius: radius.pill,
              backgroundColor: c.accent,
              alignItems: 'center',
              minHeight: 44,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={[t.label, { color: c.onAccent }]}>Save my writing</Text>
          </Pressable>
          {saved === 'ok' ? (
            <Text style={[t.bodySm, { color: c.accentDeep, marginTop: space.sm }]}>Saved.</Text>
          ) : null}
          {saved === 'failed' ? (
            <Text style={[t.bodySm, { color: c.warn, marginTop: space.sm }]}>
              That did not work. Try once more; if it keeps failing, do not reinstall the app
              yet.
            </Text>
          ) : null}

          {/* Reset last, and only after the copy. */}
          {onReset ? (
            <Pressable
              accessibilityRole="button"
              onPress={onReset}
              style={({ pressed }) => ({ marginTop: space.xxl, paddingVertical: space.md, minHeight: 44, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[t.body, { color: c.inkSoft, textDecorationLine: 'underline' }]}>
                Try opening the app again
              </Text>
            </Pressable>
          ) : null}

          {error?.message ? (
            <Text style={[t.caption, { color: c.inkFaint, marginTop: space.xl }]} selectable>
              {error.message}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/** expo-router renders an exported `ErrorBoundary` from a layout when a route below it
 *  throws. Exporting this from app/_layout.tsx puts it under the whole app. */
export class CrashBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <CrashScreen error={this.state.error} onReset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
