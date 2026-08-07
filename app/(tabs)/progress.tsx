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
import { exportText, exportJson } from '../../lib/storage';
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

  /* Export is FREE, deliberately, and it sits above the entitlement gate for that reason.
     Onboarding tells the user before they have written a word: "there is no backup. If you
     delete the app it is gone. You can export a plain-text copy whenever you like." Putting
     that copy behind $79.99/yr made the sentence false, and it is the only thing standing
     between somebody and total loss on a phone that dies. Nothing in the export is a paid
     analysis — it is their own writing handed back. */
  const download = async (body: string, name: string, mime: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([body], { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    await Share.share({ message: body });
  };

  const stamp = new Date().toISOString().slice(0, 10);
  const doExport = () => download(exportText(state), `steady-summary-${stamp}.txt`, 'text/plain');
  const doBackup = () => download(exportJson(state), `steady-backup-${stamp}.json`, 'application/json');

  const exportSection = (
    <Section title="Take this with you">
      <BodySm style={{ marginTop: space.sm }}>
        A plain-text summary for a clinician, and a full backup file for you. Handing someone
        a written record is far easier than saying it out loud, and it saves the first
        appointment from being spent on reconstruction.
      </BodySm>
      <BodySm style={{ marginTop: space.md, color: c.cool }}>
        Both are free and always will be. Steady keeps nothing on a server, so this file is
        the only copy that survives losing the phone.
      </BodySm>
      <Button
        label="Export summary"
        variant="secondary"
        onPress={doExport}
        style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
      />
      <Button
        label="Save a full backup"
        variant="ghost"
        onPress={doBackup}
        style={{ marginTop: space.xs, alignSelf: 'flex-start' }}
      />
    </Section>
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
            {exportSection}
          </View>
        </View>
      </ScrollView>
    );
  }

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const short = (d: string) => d.slice(5);

  const weekly = reclaimedByWeek(baseline, checkIns);
  /* A bucket built from one or two days is projected over a full seven, so a single good
     Monday in a fresh week drew a spike several times the height of the completed week
     beside it. `reclaimedCopy` already refuses to state a number below three check-ins;
     the chart has to hold the same line or it contradicts the text above it. */
  const plottable = weekly.filter((w) => w.sampleSize >= 3);

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
            {plottable.length >= 2 ? (
              <LineChart
                points={plottable.map((w) => ({ x: `w${w.week}`, y: w.hours }))}
                max={Math.max(2, ...plottable.map((w) => w.hours))}
                min={Math.min(0, ...plottable.map((w) => w.hours))}
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

          {exportSection}
        </View>
      </View>
    </ScrollView>
  );
}
