import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Screen, Button, H1, H2, H3, BodySm, Caption, Chip, Row, Rule, useTheme,
} from '../../components/ui';
import { Atmosphere } from '../../components/Atmosphere';
import { space, type as t, type AtmosphereKey } from '../../constants/theme';
import { MODULES, CONTENT_DISCLAIMER } from '../../content/modules';
import { PHASES } from '../../lib/protocol';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../hooks/useEntitlement';

/* One atmosphere per phase, so the reading list has a sense of moving through a day as
 * it moves through the protocol. Not keyed to anything the user scores. */
const PHASE_ART: Record<number, AtmosphereKey> = { 1: 'night', 2: 'dawn', 3: 'day', 4: 'dusk' };

export default function LearnIndex() {
  const c = useTheme();
  const router = useRouter();
  const readModules = useStore((s) => s.readModules);
  const currentWeek = useStore((s) => s.protocol.currentWeek);
  const { entitled } = useEntitlement();

  const readCount = MODULES.filter((m) => readModules.includes(m.slug)).length;

  return (
    <Screen tabBarSpace>
      <View style={{ marginTop: space.xxl }}>
        <H1>Learn</H1>
        <BodySm style={{ marginTop: space.sm }}>
          Twelve modules, one a week. Each one explains the mechanism behind that week's practice,
          so the practice is something you understand rather than something you follow.
        </BodySm>
        <Caption style={{ marginTop: space.sm }}>
          {readCount} of {MODULES.length} read
        </Caption>

        <View style={{ marginTop: space.xl }}>
          {PHASES.map((phase) => {
            const mods = MODULES.filter((m) => m.phase === phase.id);
            if (!mods.length) return null;
            return (
              <View key={phase.id} style={{ marginBottom: space.xl }}>
                <Row style={{ marginBottom: space.md }}>
                  <Caption>
                    Phase {phase.id} · {phase.name}
                  </Caption>
                  <View style={{ flex: 1 }}>
                    <Rule />
                  </View>
                </Row>

                {mods.map((m, i) => {
                  const locked = !m.free && !entitled;
                  const read = readModules.includes(m.slug);
                  const ahead = m.week > currentWeek && !m.free;
                  return (
                    <Pressable
                      key={m.slug}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.title}${locked ? ', requires Steady plus' : ''}${read ? ', read' : ''}`}
                      onPress={() => router.push(locked ? '/paywall' : `/module/${m.slug}`)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.lg,
                        paddingVertical: space.md,
                        opacity: pressed ? 0.85 : locked ? 0.66 : 1,
                      })}
                    >
                      <Atmosphere
                        variant={PHASE_ART[phase.id]}
                        lightX={0.28 + i * 0.18}
                        rounded="md"
                        scrim={false}
                        style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {read ? (
                          /* A bare white tick disappeared into the artwork behind it.
                             The disc gives it its own ground. */
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor: c.cool,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Svg width={14} height={14} viewBox="0 0 16 16">
                              <Path
                                d="M3.4 8.4 6.5 11.4 12.6 5"
                                stroke={c.bgDeep}
                                strokeWidth={2.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </Svg>
                          </View>
                        ) : (
                          <Text style={[t.label, { color: 'rgba(255,255,255,0.88)' }]}>{m.week}</Text>
                        )}
                      </Atmosphere>

                      <View style={{ flex: 1 }}>
                        <H3>{m.title}</H3>
                        <Caption style={{ marginTop: 2 }}>
                          Week {m.week} · {m.minutes} min read
                        </Caption>
                      </View>

                      {locked ? (
                        <Chip label="Steady+" tone="accent" />
                      ) : m.free ? (
                        <Chip label="Free" tone="cool" />
                      ) : ahead ? (
                        <Chip label="Ahead" />
                      ) : (
                        <Text style={[t.body, { color: c.inkFaint }]}>›</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        {!entitled && (
          <View style={{ marginTop: space.xs }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Weeks 2 to 12</H2>
            <BodySm style={{ marginTop: space.xs }}>
              Week one's three modules stay free forever, along with every grounding exercise and
              all crisis support.
            </BodySm>
            <Button
              label="See Steady+"
              onPress={() => router.push('/paywall')}
              style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
            />
          </View>
        )}

        <Caption style={{ marginTop: space.xxl }}>{CONTENT_DISCLAIMER}</Caption>
      </View>
    </Screen>
  );
}
