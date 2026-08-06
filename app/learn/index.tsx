import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, BodySm, Caption, Chip, Row, useTheme,
} from '../../components/ui';
import { space, radius } from '../../constants/theme';
import { MODULES, CONTENT_DISCLAIMER } from '../../content/modules';
import { PHASES } from '../../lib/protocol';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../lib/entitlement';

export default function LearnIndex() {
  const c = useTheme();
  const router = useRouter();
  const readModules = useStore((s) => s.readModules);
  const currentWeek = useStore((s) => s.protocol.currentWeek);
  const { entitled } = useEntitlement();

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Learn</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.lg }}>
          Twelve modules, one per week. Read them in order — each builds on the one before it.
        </BodySm>

        {PHASES.map((phase) => {
          const mods = MODULES.filter((m) => m.phase === phase.id);
          if (!mods.length) return null;
          return (
            <View key={phase.id} style={{ marginBottom: space.lg }}>
              <Caption>
                Phase {phase.id} · {phase.name}
              </Caption>

              {mods.map((m) => {
                const locked = !m.free && !entitled;
                const read = readModules.includes(m.slug);
                const ahead = m.week > currentWeek && !m.free;
                return (
                  <Pressable
                    key={m.slug}
                    accessibilityRole="button"
                    accessibilityLabel={`${m.title}${locked ? ', locked' : ''}`}
                    onPress={() => router.push(locked ? '/paywall' : `/learn/${m.slug}`)}
                    style={({ pressed }) => ({
                      backgroundColor: c.surface,
                      borderRadius: radius.lg,
                      borderWidth: read ? 1 : StyleSheet.hairlineWidth,
                      borderColor: read ? c.accent : c.line,
                      padding: space.lg,
                      marginTop: space.sm,
                      opacity: pressed ? 0.9 : locked ? 0.72 : 1,
                    })}
                  >
                    <Row>
                      <View style={{ flex: 1 }}>
                        <Caption>
                          Week {m.week} · {m.minutes} min{read ? ' · read' : ''}
                        </Caption>
                        <H3 style={{ marginTop: 2 }}>{m.title}</H3>
                      </View>
                      {locked ? (
                        <Chip label="Steady+" tone="accent" />
                      ) : ahead ? (
                        <Chip label="Ahead" />
                      ) : m.free ? (
                        <Chip label="Free" tone="accent" />
                      ) : null}
                    </Row>
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        {!entitled && (
          <Card tone="accent">
            <H2>Weeks 2 to 12</H2>
            <BodySm style={{ marginTop: space.xs }}>
              Week one's three modules are free forever, along with every grounding exercise and all
              crisis support.
            </BodySm>
            <Button label="See Steady+" onPress={() => router.push('/paywall')} style={{ marginTop: space.md }} />
          </Card>
        )}

        <Caption style={{ marginTop: space.md }}>{CONTENT_DISCLAIMER}</Caption>
        <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.md }} />
      </View>
    </Screen>
  );
}
