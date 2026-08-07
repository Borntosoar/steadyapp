import React, { useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Card, Button, H1, Body, BodySm, Caption, Label, Rule, useTheme,
} from '../../components/ui';
import { Atmosphere } from '../../components/Atmosphere';
import { RichText } from '../../components/RichText';
import { space, type as t, LAYOUT_MAX_WIDTH, type AtmosphereKey } from '../../constants/theme';
import { moduleBySlug, MODULES, CONTENT_DISCLAIMER } from '../../content/modules';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../lib/entitlement';

const PHASE_ART: Record<number, AtmosphereKey> = { 1: 'night', 2: 'dawn', 3: 'day', 4: 'dusk' };

export default function LearnModuleScreen() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const markModuleRead = useStore((s) => s.markModuleRead);
  const { entitled } = useEntitlement();

  const mod = moduleBySlug(String(slug));
  const locked = mod ? !mod.free && !entitled : false;

  useEffect(() => {
    if (mod && !locked) markModuleRead(mod.slug);
  }, [mod, locked, markModuleRead]);

  if (!mod) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>Not found</H1>
          <Button
            label="Back to Learn"
            variant="secondary"
            onPress={() => router.replace('/learn')}
            style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
          />
        </View>
      </Screen>
    );
  }

  if (locked) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <Caption>Week {mod.week}</Caption>
          <H1 style={{ marginTop: space.xs }}>{mod.title}</H1>
          <Card tone="accent" style={{ marginTop: space.lg }}>
            <RichText>
              This module is part of Steady+. Week one is free, and so is every grounding exercise
              and all crisis support — those never go behind anything.
            </RichText>
          </Card>
          <Button label="See Steady+" onPress={() => router.push('/paywall')} />
          <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  const idx = MODULES.findIndex((m) => m.slug === mod.slug);
  const next = MODULES[idx + 1];
  const nextLocked = next ? !next.free && !entitled : false;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl, alignItems: 'center' }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
        {/* Title sits on the artwork rather than above it, so the module opens like a
            chapter instead of a settings row. */}
        <Atmosphere variant={PHASE_ART[mod.phase]} lightX={0.66} rounded="none">
          <View style={{ paddingTop: insets.top + space.xxl, paddingHorizontal: space.lg, paddingBottom: space.xl }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginBottom: space.xl })}
            >
              <Text style={[t.caption, { color: 'rgba(255,255,255,0.78)' }]}>‹  Learn</Text>
            </Pressable>

            <Text style={[t.caption, { color: 'rgba(255,255,255,0.7)' }]}>
              Week {mod.week} · {mod.minutes} min read
            </Text>
            <Text style={[t.display, { color: '#fff', marginTop: space.sm }]}>{mod.title}</Text>
          </View>
        </Atmosphere>

        <View style={{ paddingHorizontal: space.lg, marginTop: space.xl }}>
          {mod.body.map((p, i) => (
            <View key={i} style={{ marginBottom: space.lg }}>
              <RichText>{p}</RichText>
            </View>
          ))}

          <View style={{ marginTop: space.lg }}>
            <Rule />
            <Label style={{ marginTop: space.lg, color: c.accentDeep }}>One thing to try</Label>
            <View style={{ marginTop: space.sm }}>
              <RichText>{mod.takeaway}</RichText>
            </View>
          </View>

          {next && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace(nextLocked ? '/paywall' : `/module/${next.slug}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.lg,
                marginTop: space.xxl,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Atmosphere
                variant={PHASE_ART[next.phase]}
                lightX={0.4}
                rounded="md"
                scrim={false}
                style={{ width: 56, height: 56 }}
              />
              <View style={{ flex: 1 }}>
                <Caption>{nextLocked ? 'Next · Steady+' : 'Next'}</Caption>
                <Body style={{ marginTop: 2 }}>{next.title}</Body>
              </View>
              <Text style={[t.body, { color: c.inkFaint }]}>›</Text>
            </Pressable>
          )}

          <Button
            label="All modules"
            variant="secondary"
            onPress={() => router.replace('/learn')}
            style={{ marginTop: space.xl, alignSelf: 'flex-start' }}
          />

          <BodySm style={{ marginTop: space.xxl, color: c.inkFaint }}>{CONTENT_DISCLAIMER}</BodySm>
        </View>
      </View>
    </ScrollView>
  );
}
