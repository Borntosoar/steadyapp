import React from 'react';
import { View, Linking, Platform, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, useTheme,
} from '../components/ui';
import { space, radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { SUPPORT_REGIONS, regionByKey, THERAPY_GUIDANCE, SUPPORT_INTRO } from '../constants/support';

/* Free, always, and never gated. Action first — someone reading this may be in real
 * distress, so the numbers come before any explanation. */

export default function Support() {
  const c = useTheme();
  const router = useRouter();
  const region = useStore((s) => s.profile.supportRegion);
  const setSupportRegion = useStore((s) => s.setSupportRegion);
  const active = regionByKey(region);

  const dial = (contact: string) => {
    const digits = contact.replace(/[^\d+]/g, '');
    if (!digits || Platform.OS === 'web') return;
    Linking.openURL(`tel:${digits}`).catch(() => {});
  };

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Support</H1>
        <Body style={{ marginTop: space.sm, marginBottom: space.lg }}>{SUPPORT_INTRO}</Body>

        <Card tone="accent">
          <H3>If you are in danger right now</H3>
          <Body style={{ marginTop: space.xs }}>
            Contact your local emergency number. That is the right call and it is not an overreaction.
          </Body>
        </Card>

        <Caption style={{ marginBottom: space.sm }}>Where are you?</Caption>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
          {SUPPORT_REGIONS.map((r) => {
            const on = r.key === region;
            return (
              <Pressable
                key={r.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setSupportRegion(r.key)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: space.md,
                  borderRadius: radius.pill,
                  backgroundColor: on ? c.accent : c.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: on ? c.accent : c.line,
                  minHeight: 40,
                  justifyContent: 'center',
                }}
              >
                <BodySm style={{ color: on ? '#fff' : c.inkSoft }}>{r.label}</BodySm>
              </Pressable>
            );
          })}
        </View>

        <Card>
          <H2>{active.label}</H2>
          {active.lines.map((l, i) => (
            <Pressable
              key={i}
              accessibilityRole={Platform.OS === 'web' ? 'text' : 'button'}
              onPress={() => dial(l.contact)}
              style={{ marginTop: space.lg }}
            >
              <H3>{l.name}</H3>
              <Body style={{ color: c.accentDeep, marginTop: 2 }}>{l.contact}</Body>
              {l.note ? <Caption>{l.note}</Caption> : null}
            </Pressable>
          ))}
        </Card>

        <Card>
          <H2>Tell one person today</H2>
          <Body style={{ marginTop: space.sm }}>
            You do not have to explain the whole thing, and you do not have to say it well. "I have
            been having a hard time with how I feel about myself and it is taking up a lot of my
            head" is enough of an opening.
          </Body>
          <BodySm style={{ marginTop: space.md }}>
            Appearance distress is unusually private — most people carrying it have never said it out
            loud to anyone. Saying it once to one person changes what is possible next.
          </BodySm>
        </Card>

        <Card>
          <H2>Finding a therapist</H2>
          {THERAPY_GUIDANCE.map((g, i) => (
            <Body key={i} style={{ marginTop: space.md, color: c.inkSoft }}>
              {g.replace(/\*\*/g, '')}
            </Body>
          ))}
        </Card>

        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
