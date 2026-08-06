import React from 'react';
import { View, Platform, Share, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, Row, useTheme,
} from '../components/ui';
import { LineChart, BarChart } from '../components/charts';
import { space, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useEntitlement } from '../lib/entitlement';
import {
  reclaimedByWeek, computeReclaimed, checkInsInLastDays, previousWeekCheckIns,
} from '../lib/reclaimed';
import { exportText } from '../lib/storage';
import { insightsSummary } from '../content/copy.ts';

/* Every chart on this screen plots something that should go DOWN, or a count of times the
 * user did the hard thing. Nothing here measures appearance, and nothing ever will —
 * see SAFETY.md. */

export default function Insights() {
  const c = useTheme();
  const router = useRouter();
  const { entitled } = useEntitlement();
  const state = useStore();

  const { baseline, checkIns, urgeLogs, mirrorSessions } = state;

  if (!entitled) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>Insights</H1>
          <Card tone="accent" style={{ marginTop: space.lg }}>
            <Body>
              The charts — reclaimed hours over time, distress, checking frequency, avoidance, and
              mirror-session deltas — are part of Steady+.
            </Body>
            <Body style={{ marginTop: space.md, color: c.inkSoft }}>
              Your daily check-in keeps recording either way, so nothing is lost in the meantime.
            </Body>
          </Card>
          <Button label="See Steady+" onPress={() => router.push('/paywall')} />
          <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const short = (d: string) => d.slice(5);

  const weekly = reclaimedByWeek(baseline, checkIns);
  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );

  const sudsPoints = sorted.slice(-21).map((x) => ({ x: short(x.date), y: x.suds }));
  const avoidanceScore = { none: 0, small: 1, significant: 2 } as const;
  const avoidPoints = sorted.slice(-21).map((x) => ({ x: short(x.date), y: avoidanceScore[x.avoidance] }));

  // Checking urges per week — the number that tends to move first.
  const urgesByWeek = new Map<string, number>();
  for (const u of urgeLogs) {
    const k = u.date.slice(0, 10);
    urgesByWeek.set(k, (urgesByWeek.get(k) ?? 0) + 1);
  }
  const urgeBars = [...urgesByWeek.entries()]
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
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Insights</H1>

        {/* Plain-English summary, generated locally. Never mentions appearance quality. */}
        <Card tone="accent" style={{ marginTop: space.md }}>
          <Body>{summary}</Body>
        </Card>

        <Card>
          <H2>Hours reclaimed</H2>
          <Caption>Each point is one week, against your starting point.</Caption>
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
        </Card>

        <Card>
          <H2>Distress</H2>
          <Caption>Daily, 0–10. Meant to trend down.</Caption>
          <LineChart points={sudsPoints} max={10} label="Distress" />
        </Card>

        <Card>
          <H2>Checking urges</H2>
          <Caption>
            Logged per day. {resisted} of {urgeLogs.length} resisted.
          </Caption>
          <BarChart bars={urgeBars} label="Checking urges per day" />
        </Card>

        <Card>
          <H2>Avoidance</H2>
          <Caption>0 none · 1 small · 2 significant. The one that usually moves last.</Caption>
          <LineChart points={avoidPoints} max={2} label="Avoidance" />
        </Card>

        <Card>
          <H2>Mirror sessions</H2>
          <Caption>How far distress fell within each session. Taller is better.</Caption>
          {mirrorDeltas.length ? (
            <BarChart bars={mirrorDeltas} label="Distress drop per mirror session" />
          ) : (
            <Caption style={{ paddingVertical: space.lg }}>No sessions logged yet.</Caption>
          )}
          {mirrorBefore !== null && (
            <Row style={{ marginTop: space.md }}>
              <View style={{ flex: 1 }}>
                <Caption>Average before</Caption>
                <Text style={[t.h2, { color: c.ink }]}>{mirrorBefore}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Caption>Average after</Caption>
                <Text style={[t.h2, { color: c.accentDeep }]}>{mirrorAfter}</Text>
              </View>
            </Row>
          )}
        </Card>

        <Card>
          <H3>Take this to a clinician</H3>
          <BodySm style={{ marginTop: space.xs }}>
            A plain-text summary of your own numbers. Handing someone a written record is far
            easier than saying it out loud.
          </BodySm>
          <Button label="Export summary" variant="secondary" onPress={doExport} style={{ marginTop: space.md }} />
        </Card>

        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
