import React from 'react';
import { View, Platform, Share, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Button, H1, H2, H3, Body, BodySm, Caption, Row, Rule, useTheme,
} from '../../components/ui';
import { Atmosphere } from '../../components/Atmosphere';
import { LineChart, BarChart } from '../../components/charts';
import {
  space, type as t, TAB_BAR_HEIGHT, LAYOUT_MAX_WIDTH,
} from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../lib/entitlement';
import {
  reclaimedByWeek, computeReclaimed, checkInsInLastDays, previousWeekCheckIns,
} from '../../lib/reclaimed';
import { exportText } from '../../lib/storage';
import { insightsSummary } from '../../content/copy.ts';

/* Every chart on this screen plots something that should go DOWN, or a count of times the
 * user did the hard thing. Nothing here measures appearance, and nothing ever will —
 * see SAFETY.md. */

/** A titled band with a hairline above it. Replaces what used to be seven stacked cards;
 *  a screen of boxes reads as a dashboard, and a dashboard invites scrutiny of every
 *  individual number, which is the habit this whole app is trying to interrupt. */
function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: space.xxl }}>
      <Rule />
      <H2 style={{ marginTop: space.lg }}>{title}</H2>
      {note ? <Caption style={{ marginTop: space.xs }}>{note}</Caption> : null}
      {children}
    </View>
  );
}

export default function Progress() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entitled } = useEntitlement();
  const state = useStore();

  const { baseline, checkIns, urgeLogs, mirrorSessions } = state;

  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );
  const showNumber = reclaimed.hasData && reclaimed.sampleSize >= 3;

  const hero = (
    <Atmosphere variant="day" lightX={0.68} rounded="none" style={{ minHeight: 260 }}>
      <View
        style={{
          paddingTop: insets.top + space.xxl,
          paddingHorizontal: space.lg,
          paddingBottom: space.xl,
        }}
      >
        <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)' }]}>Hours reclaimed, last 7 days</Text>
        <Text style={[t.hero, { color: '#fff', marginTop: space.sm }]}>
          {showNumber ? Math.abs(reclaimed.hours) : '—'}
          <Text style={[t.h2, { color: 'rgba(255,255,255,0.66)' }]}>  hours</Text>
        </Text>
        <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.sm, maxWidth: 320 }]}>
          {showNumber
            ? 'Against the day you described when you started.'
            : 'Three check-ins and this becomes a number.'}
        </Text>
      </View>
    </Atmosphere>
  );

  if (!entitled) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + space.xl,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
          {hero}
          <View style={{ paddingHorizontal: space.lg }}>
            <Section title="The rest of the picture">
              <Body style={{ marginTop: space.md }}>
                Distress over time, checking frequency, avoidance, and how far distress falls
                inside each mirror session are part of Steady+.
              </Body>
              <BodySm style={{ marginTop: space.md }}>
                Your daily check-in keeps recording either way, so the history is still being
                written while you decide.
              </BodySm>
              <Button
                label="See Steady+"
                onPress={() => router.push('/paywall')}
                style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
              />
            </Section>
          </View>
        </View>
      </ScrollView>
    );
  }

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const short = (d: string) => d.slice(5);

  const weekly = reclaimedByWeek(baseline, checkIns);

  const sudsPoints = sorted.slice(-21).map((x) => ({ x: short(x.date), y: x.suds }));
  const avoidanceScore = { none: 0, small: 1, significant: 2 } as const;
  const avoidPoints = sorted
    .slice(-21)
    .map((x) => ({ x: short(x.date), y: avoidanceScore[x.avoidance] }));

  // Checking urges per day — the number that tends to move first.
  const urgesByDay = new Map<string, number>();
  for (const u of urgeLogs) {
    const k = u.date.slice(0, 10);
    urgesByDay.set(k, (urgesByDay.get(k) ?? 0) + 1);
  }
  const urgeBars = [...urgesByDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([d, n]) => ({ x: short(d), y: n }));

  const withBoth = mirrorSessions.filter((m) => typeof m.sudsAfter === 'number');
  const mirrorBefore = withBoth.length
    ? Math.round(withBoth.reduce((s, m) => s + m.sudsBefore, 0) / withBoth.length)
    : null;
  const mirrorAfter = withBoth.length
    ? Math.round(withBoth.reduce((s, m) => s + m.sudsAfter, 0) / withBoth.length)
    : null;
  const mirrorDeltas = [...withBoth]
    .reverse()
    .slice(-14)
    .map((m) => ({ x: short(m.date), y: m.sudsBefore - m.sudsAfter }));

  const resisted = urgeLogs.filter((u) => u.resisted).length;

  const summary = insightsSummary({
    minutesPerDay: Math.max(0, reclaimed.minutesPerDayDelta),
    urgesLogged: urgeLogs.length,
    urgesResisted: resisted,
    mirrorBefore,
    mirrorAfter,
  });

  const doExport = async () => {
    const txt = exportText(state);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(txt);
      } catch {
        /* clipboard blocked — the file download below still works */
      }
      const blob = new Blob([txt], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `steady-summary-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    await Share.share({ message: txt });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingBottom: insets.bottom + TAB_BAR_HEIGHT + space.xl,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
        {hero}

        <View style={{ paddingHorizontal: space.lg }}>
          {/* Plain-English summary, generated locally. Never mentions appearance quality. */}
          <View style={{ marginTop: space.xl }}>
            <Body>{summary}</Body>
          </View>

          <Section title="Week by week" note="Each point is one week, against your starting point.">
            {weekly.length >= 2 ? (
              <LineChart
                points={weekly.map((w) => ({ x: `w${w.week}`, y: w.hours }))}
                max={Math.max(2, ...weekly.map((w) => w.hours))}
                min={Math.min(0, ...weekly.map((w) => w.hours))}
                label="Hours reclaimed per week"
              />
            ) : (
              <Caption style={{ paddingVertical: space.lg }}>
                Two weeks of check-ins and this becomes a line.
              </Caption>
            )}
          </Section>

          <Section title="Distress" note="Daily, 0 to 10. This one is meant to fall.">
            <LineChart points={sudsPoints} max={10} label="Distress" tone="cool" />
          </Section>

          <Section
            title="Checking urges"
            note={`Logged per day. ${resisted} of ${urgeLogs.length} ridden out without checking.`}
          >
            <BarChart bars={urgeBars} label="Checking urges per day" />
          </Section>

          <Section
            title="Avoidance"
            note="0 none · 1 small · 2 significant. Usually the last one to move, and the one worth waiting for."
          >
            <LineChart points={avoidPoints} max={2} label="Avoidance" tone="cool" />
          </Section>

          <Section title="Mirror sessions" note="How far distress fell inside each session. Taller is better.">
            {mirrorDeltas.length ? (
              <BarChart bars={mirrorDeltas} label="Distress drop per mirror session" tone="cool" />
            ) : (
              <Caption style={{ paddingVertical: space.lg }}>No sessions logged yet.</Caption>
            )}
            {mirrorBefore !== null && (
              <Row style={{ marginTop: space.lg }}>
                <View style={{ flex: 1 }}>
                  <Caption>Average before</Caption>
                  <Text style={[t.h1, { color: c.ink, marginTop: 2 }]}>{mirrorBefore}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Caption>Average after</Caption>
                  <Text style={[t.h1, { color: c.cool, marginTop: 2 }]}>{mirrorAfter}</Text>
                </View>
              </Row>
            )}
          </Section>

          <Section title="Take this to a clinician">
            <BodySm style={{ marginTop: space.sm }}>
              A plain-text summary of your own numbers. Handing someone a written record is far
              easier than saying it out loud, and it saves the first appointment from being spent
              on reconstruction.
            </BodySm>
            <Button
              label="Export summary"
              variant="secondary"
              onPress={doExport}
              style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
            />
          </Section>
        </View>
      </View>
    </ScrollView>
  );
}
