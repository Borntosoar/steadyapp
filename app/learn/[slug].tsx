import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, Caption, Chip, useTheme,
} from '../../components/ui';
import { RichText } from '../../components/RichText';
import { space } from '../../constants/theme';
import { moduleBySlug, MODULES, CONTENT_DISCLAIMER } from '../../content/modules';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../lib/entitlement';

export default function LearnModuleScreen() {
  const c = useTheme();
  const router = useRouter();
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
          <Button label="Back to Learn" variant="secondary" onPress={() => router.replace('/learn')} />
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
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <Caption>
          Week {mod.week} · {mod.minutes} min read
        </Caption>
        <H1 style={{ marginTop: space.xs, marginBottom: space.lg }}>{mod.title}</H1>

        {mod.body.map((p, i) => (
          <View key={i} style={{ marginBottom: space.lg }}>
            <RichText>{p}</RichText>
          </View>
        ))}

        <Card tone="accent" style={{ marginTop: space.sm }}>
          <Caption>One thing to try</Caption>
          <View style={{ marginTop: space.xs }}>
            <RichText>{mod.takeaway}</RichText>
          </View>
        </Card>

        {next && (
          <Button
            label={nextLocked ? `Next: ${next.title} (Steady+)` : `Next: ${next.title}`}
            onPress={() => router.replace(nextLocked ? '/paywall' : `/learn/${next.slug}`)}
            style={{ marginTop: space.md }}
          />
        )}
        <Button
          label="All modules"
          variant="secondary"
          onPress={() => router.replace('/learn')}
          style={{ marginTop: space.sm }}
        />

        <Caption style={{ marginTop: space.lg }}>{CONTENT_DISCLAIMER}</Caption>
      </View>
    </Screen>
  );
}
