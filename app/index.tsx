import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, Chip, Row, useTheme,
} from '../components/ui';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { computeReclaimed, checkInsInLastDays, reclaimedCopy } from '../lib/reclaimed';
import { phaseForWeek, weekProgress, recommendedAction, WEEKS_TOTAL } from '../lib/protocol';
import { freezeCopy } from '../lib/streak';
import { Text } from 'react-native';

function Ring({ value, total }: { value: number; total: number }) {
  const c = useTheme();
  const size = 54;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, value / total);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[t.label, { color: c.accentDeep }]}>{value}</Text>
    </View>
  );
}

export default function Home() {
  const c = useTheme();
  const router = useRouter();

  const profile = useStore((s) => s.profile);
  const baseline = useStore((s) => s.baseline);
  const checkIns = useStore((s) => s.checkIns);
  const streak = useStore((s) => s.streak);
  const protocol = useStore((s) => s.protocol);
  const readModules = useStore((s) => s.readModules);
  const mirrorSessions = useStore((s) => s.mirrorSessions);
  const thoughtRecords = useStore((s) => s.thoughtRecords);
  const logPractice = useStore((s) => s.logPractice);
  const checkedInToday = useStore((s) => s.checkedInToday)();

  const week = protocol.currentWeek;
  const phase = phaseForWeek(week);
  const wp = weekProgress(protocol);

  const windowCheckIns = checkInsInLastDays(checkIns, 7);
  const reclaimed = computeReclaimed(baseline, windowCheckIns, 7);
  const copy = reclaimedCopy(reclaimed, profile.firstName);

  const since = (arr: { date: string }[]) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return arr.filter((x) => new Date(x.date + 'T00:00:00') >= cutoff).length;
  };

  const action = recommendedAction({
    week,
    checkedInToday,
    modulesReadThisWeek: readModules.length,
    mirrorThisWeek: since(mirrorSessions),
    recordsThisWeek: since(thoughtRecords),
  });

  const heroColor = reclaimed.direction === 'up' ? c.accentDeep : c.ink;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Caption>
              Week {week} of {WEEKS_TOTAL} · {phase.name}
            </Caption>
          </View>
          <Ring value={week} total={WEEKS_TOTAL} />
        </Row>
      </View>

      {/* Reclaimed hours — top and dominant, per spec. */}
      <Card style={{ marginTop: space.md, paddingVertical: space.xl }}>
        {reclaimed.hasData && reclaimed.sampleSize >= 3 ? (
          <>
            <Text style={[t.hero, { color: heroColor }]}>
              {reclaimed.direction === 'down' ? '' : ''}
              {Math.abs(reclaimed.hours)}
              <Text style={[t.h2, { color: c.inkSoft }]}>  hrs</Text>
            </Text>
            <H2 style={{ marginTop: space.sm }}>{copy.headline}</H2>
          </>
        ) : (
          <H1>{copy.headline}</H1>
        )}
        <Body style={{ marginTop: space.sm, color: c.inkSoft }}>{copy.sub}</Body>
        {reclaimed.hasData && reclaimed.sampleSize >= 3 && (
          <Caption style={{ marginTop: space.md }}>
            Based on {reclaimed.sampleSize} check-in{reclaimed.sampleSize === 1 ? '' : 's'} this week,
            against your starting point of about {Math.round(reclaimed.baselineDailyMinutes / 6) / 10} hrs a day.
          </Caption>
        )}
      </Card>

      {/* One action. Not a menu. */}
      <Card tone="accent">
        <Caption>Today</Caption>
        <H2 style={{ marginTop: space.xs }}>{action.label}</H2>
        <Body style={{ marginTop: space.xs, color: c.inkSoft }}>{action.why}</Body>
        <Button label="Start" onPress={() => router.push(action.route)} style={{ marginTop: space.lg }} />
      </Card>

      <Row style={{ marginBottom: space.md }}>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <Caption>Practice streak</Caption>
          <H1 style={{ marginTop: space.xs }}>{streak.current}</H1>
          <Caption>{freezeCopy(streak.freezesRemaining)}</Caption>
        </Card>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <Caption>This week</Caption>
          <H1 style={{ marginTop: space.xs }}>
            {wp.done}
            <Text style={[t.body, { color: c.inkFaint }]}>/{wp.required}</Text>
          </H1>
          <Caption>{wp.complete ? 'Week complete' : `${wp.remaining} more to open week ${week + 1}`}</Caption>
        </Card>
      </Row>

      {/* Hard day — preserves the streak, logs nothing judgmental, two taps to grounding. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/grounding?mode=hard')}
        style={({ pressed }) => ({
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.warn,
          borderRadius: radius.lg,
          padding: space.lg,
          opacity: pressed ? 0.85 : 1,
          marginBottom: space.md,
        })}
      >
        <H3 style={{ color: c.warn }}>Today is a hard day</H3>
        <BodySm style={{ marginTop: space.xs }}>
          Skip the programme. Go straight to something steadying. This still counts as showing up.
        </BodySm>
      </Pressable>

      <Row style={{ flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
        <Button label="Check in" variant="secondary" onPress={() => router.push('/checkin')} style={{ flex: 1 }} />
        <Button label="Grounding" variant="secondary" onPress={() => router.push('/grounding')} style={{ flex: 1 }} />
      </Row>
      <Row style={{ flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
        <Button label="Learn" variant="secondary" onPress={() => router.push('/learn')} style={{ flex: 1 }} />
        <Button label="Insights" variant="secondary" onPress={() => router.push('/insights')} style={{ flex: 1 }} />
      </Row>

      <Chip label={phase.goal} tone="accent" />
      <Caption style={{ marginTop: space.md }}>
        A self-help tool, not treatment. Support is one tap away from every screen.
      </Caption>
    </Screen>
  );
}
