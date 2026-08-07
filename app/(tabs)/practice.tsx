import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, H1, H3, BodySm, Caption, Chip, Row, useTheme } from '../../components/ui';
import { Atmosphere } from '../../components/Atmosphere';
import { space, type as t, type AtmosphereKey } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { mirrorSpecForWeek, phaseForWeek, MIRROR_UNLOCK_WEEK } from '../../lib/protocol';

interface Item {
  title: string;
  sub: string;
  route: string;
  art: AtmosphereKey;
  locked?: string;
}

export default function Practice() {
  const c = useTheme();
  const router = useRouter();
  const week = useStore((s) => s.protocol.currentWeek);
  const phase = phaseForWeek(week);
  const mirrorOpen = !!mirrorSpecForWeek(week);
  const experimentsOpen = phase.id >= 3;

  const items: Item[] = [
    {
      title: 'Urge surfing',
      sub: 'Three minutes with the urge, without acting on it',
      route: '/urges',
      art: 'ember',
    },
    {
      title: 'Mirror practice',
      sub: mirrorOpen ? 'Graded exposure, timed' : 'Graded exposure',
      route: '/mirror',
      art: 'dusk',
      locked: mirrorOpen ? undefined : `Week ${MIRROR_UNLOCK_WEEK}`,
    },
    {
      title: 'Thought record',
      sub: 'Take one thought apart, seven questions',
      route: '/journal',
      art: 'night',
    },
    {
      title: 'Behavioural experiment',
      sub: 'Predict, do the avoided thing, record what happened',
      route: '/journal',
      art: 'day',
      locked: experimentsOpen ? undefined : 'Week 7',
    },
    {
      title: 'Grounding',
      sub: 'Breathing, senses, attention widening. Free forever',
      route: '/grounding',
      art: 'jade',
    },
    {
      title: 'Daily check-in',
      sub: 'Four questions, under thirty seconds',
      route: '/checkin',
      art: 'dawn',
    },
  ];

  return (
    <Screen tabBarSpace>
      <View style={{ marginTop: space.xxl }}>
        <H1>Practice</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>
          Phase {phase.id} · {phase.name}. {phase.focus}
        </BodySm>

        {items.map((it, i) => {
          const locked = !!it.locked;
          return (
            <Pressable
              key={it.title}
              accessibilityRole="button"
              accessibilityLabel={`${it.title}${locked ? `, opens week ${it.locked}` : ''}`}
              onPress={() => router.push(it.route)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.lg,
                marginBottom: space.md,
                opacity: pressed ? 0.9 : locked ? 0.62 : 1,
              })}
            >
              <Atmosphere
                variant={it.art}
                lightX={0.3 + (i % 4) * 0.15}
                rounded="md"
                scrim={false}
                style={{ width: 78, height: 78 }}
              />
              <View style={{ flex: 1 }}>
                <Row>
                  <H3 style={{ flex: 1 }}>{it.title}</H3>
                  {locked ? <Chip label={it.locked!} /> : null}
                </Row>
                <BodySm style={{ marginTop: 2 }}>{it.sub}</BodySm>
              </View>
              <Text style={[t.body, { color: c.inkFaint }]}>›</Text>
            </Pressable>
          );
        })}

        <Caption style={{ marginTop: space.lg }}>
          Grounding and crisis support are never paid, and never locked behind a week.
        </Caption>
      </View>
    </Screen>
  );
}
