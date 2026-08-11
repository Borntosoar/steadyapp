import React, { useState } from 'react';
import { View, Platform, Share, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button, H1, H2, H3, Body, BodySm, Caption, Row, useTheme,
} from '../../components/ui';
import { Frost, Ground, Explain } from '../../components/frost';
import { StorageNotice } from '../../components/StorageNotice';
import { LineChart, BarChart } from '../../components/charts';
import { space, type as t } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../hooks/useEntitlement';
import {
  reclaimedByWeek, computeReclaimed, checkInsInLastDays, previousWeekCheckIns,
} from '../../lib/reclaimed';
import { File, Paths } from 'expo-file-system';
import { exportText, exportJson } from '../../lib/storage';
import { insightsSummary } from '../../content/copy.ts';
import { weekProgress, WEEKS_TOTAL } from '../../lib/protocol';
import { NAMES, EXPLAIN } from '../../content/names';

/* Every chart on this screen plots something that should go DOWN, or a count of times the
 * user did the hard thing. Nothing here measures appearance, and nothing ever will —
 * see SAFETY.md. */

/** A titled frosted panel. Replaces what used to be seven bands separated by hairlines on
 *  a flat black ground — legible, and completely inert. */
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
    <Frost style={{ marginTop: space.md }}>
      <H2>{title}</H2>
      {note ? <Caption style={{ marginTop: space.xs }}>{note}</Caption> : null}
      {children}
    </Frost>
  );
}

/** The twelve weeks, at a glance.
 *
 * Nothing in the app has ever shown the shape of the whole programme, so somebody in week
 * five had no way to see that week five is a third of the way in rather than most of it.
 * Filled for finished weeks, half for the one in progress, hollow after. */
function WeekPips({ done, current, progress }: { done: number[]; current: number; progress: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop: space.md }}>
      {Array.from({ length: WEEKS_TOTAL }, (_, i) => {
        const w = i + 1;
        const complete = done.includes(w);
        const now = w === current;
        return (
          <View
            key={w}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: complete ? c.accent : c.surfaceStrong,
              borderWidth: complete ? 0 : StyleSheet.hairlineWidth,
              borderColor: c.lineStrong,
            }}
          >
            {now && !complete && (
              <View style={{ width: `${Math.round(progress * 100)}%`, height: 8, backgroundColor: c.accent }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function Progress() {
  const c = useTheme();
  const router = useRouter();
  const { entitled } = useEntitlement();
  const state = useStore();
  const [exportFailed, setExportFailed] = useState(false);

  const { baseline, checkIns, urgeLogs, mirrorSessions } = state;

  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );
  const showNumber = reclaimed.hasData && reclaimed.sampleSize >= 3;

  const wp = weekProgress(state.protocol);

  const hero = (
    <>
      <Caption style={{ marginTop: space.xl }}>Hours back, last 7 days</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
        <Text style={[t.hero, { color: c.ink }]}>{showNumber ? Math.abs(reclaimed.hours) : '—'}</Text>
        <Text style={[t.h2, { color: c.inkSoft }]}>hours</Text>
      </View>
      <BodySm style={{ marginTop: space.xs, maxWidth: 320 }}>
        {showNumber
          ? 'Compared with the day you described when you started.'
          : 'Three check-ins and this turns into a number.'}
      </BodySm>
      {showNumber && <Explain q={EXPLAIN.hours.q} a={EXPLAIN.hours.a} />}

      <Frost style={{ marginTop: space.lg }}>
        <Row>
          <H3>The twelve weeks</H3>
          <Caption>
            Week {state.protocol.currentWeek} of {WEEKS_TOTAL}
          </Caption>
        </Row>
        <WeekPips
          done={state.protocol.completedWeeks}
          current={state.protocol.currentWeek}
          progress={wp.done / Math.max(1, wp.required)}
        />
        <Explain q={EXPLAIN.week.q} a={EXPLAIN.week.a} />
      </Frost>
    </>
  );

  /* Export is FREE, deliberately, and it sits above the entitlement gate for that reason.
     Onboarding tells the user before they have written a word: "there is no backup. If you
     delete the app it is gone. You can export a plain-text copy whenever you like." Putting
     that copy behind $79.99/yr made the sentence false, and it is the only thing standing
     between somebody and total loss on a phone that dies. Nothing in the export is a paid
     analysis — it is their own writing handed back. */
  /* Shared as a FILE, not as a message body.
   *
   * `Share.share({ message })` discards the filename and the type and hands iOS a string, so
   * UIActivityViewController treats it as text — and the sheet it builds for text leads with
   * Messages, Mail and WhatsApp. The button says "Save a full backup", which does not prepare
   * anyone for a destination picker whose most prominent rows are messaging apps, and the
   * body of that string is every thought record, every urge trigger, and the relapse plan
   * including whoToTell. One mis-tap put a year of somebody's most private writing into an
   * iMessage thread.
   *
   * Given a file `url` with a .json/.txt extension, the same sheet leads with "Save to
   * Files". This is user-initiated export either way and entirely legitimate — SAFETY.md
   * §11b — but it is the highest-probability route by which this data ever leaves a phone,
   * and the UI was not treating it like one.
   *
   * Written to the cache directory on purpose: the OS reclaims it under storage pressure, so
   * a plaintext copy of the journal does not accumulate in the container forever just because
   * somebody once tapped export. */
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
    try {
      const file = new File(Paths.cache, name);
      if (file.exists) file.delete();
      file.create();
      file.write(body);
      await Share.share({ url: file.uri, title: name });
    } catch {
      /* If the file write fails, falling back to the text sheet is still better than the
         person getting nothing — this is the recovery path, and a clumsy export beats no
         export when the alternative is losing everything. */
      await Share.share({ message: body });
    }
  };

  const stamp = new Date().toISOString().slice(0, 10);
  /* Both wrapped. exportText walks every collection, and while normalise() now guarantees
     the shapes it reads, this is the one button somebody presses when everything else has
     already gone wrong — it is the last place in the app that should be allowed to throw. */
  const safely = (fn: () => Promise<void>) => () => {
    fn().catch(() => setExportFailed(true));
  };
  const doExport = safely(async () =>
    download(exportText(state), `steady-summary-${stamp}.txt`, 'text/plain')
  );
  const doBackup = safely(async () =>
    download(exportJson(state), `steady-backup-${stamp}.json`, 'application/json')
  );

  const exportSection = (
    <Section title="Take this with you">
      <BodySm style={{ marginTop: space.sm }}>
        A short summary you can hand to a doctor, and a full backup file for you. Handing
        someone a written record is far easier than saying it out loud. It also means the
        first appointment is not spent piecing it back together.
      </BodySm>
      <BodySm style={{ marginTop: space.md, color: c.cool }}>
        Both are free and always will be. Steady keeps nothing on a server, so this file is
        the only copy that survives if you lose the phone.
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
      {/* Said before they tap, not after. The sheet that opens can send this anywhere on the
          phone, and the file is everything they have written — the one place in the app
          where a mis-tap is unrecoverable in a way that matters. */}
      <Caption style={{ marginTop: space.sm }}>
        The backup contains everything you have written, including your plan. Saving it to
        Files keeps it on this phone; the same menu can also send it to other people, so pick
        carefully.
      </Caption>
      {exportFailed ? (
        <BodySm style={{ marginTop: space.sm, color: c.warn }}>
          That did not work. Try once more — and if it keeps failing, do not delete the app,
          because this file is the only copy.
        </BodySm>
      ) : null}
    </Section>
  );

  if (!entitled) {
    return (
      <Ground tabBarSpace>
        {hero}
        <View style={{ marginTop: space.lg }}>
          <StorageNotice onBackup={doBackup} />
        </View>
        <Section title="The rest of the picture">
          <Body style={{ marginTop: space.md }}>
            How hard your days have been, how often you check, what you skip, and how far it
            falls during mirror practice. All of that is part of Steady+.
          </Body>
          <Explain q={EXPLAIN.plus.q} a={EXPLAIN.plus.a} />
          <BodySm style={{ marginTop: space.md }}>
            Your daily check-in keeps recording either way. The history is still being written
            while you decide.
          </BodySm>
          <Button
            label="See Steady+"
            onPress={() => router.push('/paywall')}
            style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
          />
        </Section>
        {exportSection}
      </Ground>
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
    <Ground tabBarSpace>
      {hero}

      <View style={{ marginTop: space.lg }}>
        <StorageNotice onBackup={doBackup} />
      </View>

      {/* Plain-English summary, generated on the device. Never mentions how anybody looks. */}
      <Frost style={{ marginTop: space.md }}>
        <Body>{summary}</Body>
      </Frost>

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
            Two weeks of check-ins and this turns into a line.
          </Caption>
        )}
      </Section>

      <Section title="How hard the days were" note="One point a day, 0 to 10. This one is meant to fall.">
        <LineChart points={sudsPoints} max={10} label="How hard each day was" tone="cool" />
        <Explain q={EXPLAIN.distress.q} a={EXPLAIN.distress.a} />
      </Section>

      <Section
        title="Urges to check"
        note={`One bar a day. You sat through ${resisted} of ${urgeLogs.length}.`}
      >
        <BarChart bars={urgeBars} label="Urges to check, per day" />
        <Explain q={EXPLAIN.urgesResisted.q} a={EXPLAIN.urgesResisted.a} />
      </Section>

      <Section
        title="Things you skipped"
        note="Nothing skipped is 0. A bit changed is 1. Skipped it is 2."
      >
        <LineChart points={avoidPoints} max={2} label="Things you skipped" tone="cool" />
        <Explain q={EXPLAIN.avoidance.q} a={EXPLAIN.avoidance.a} />
      </Section>

      <Section title={NAMES.mirror.title} note="How far it fell inside each session. Taller is better.">
        {mirrorDeltas.length ? (
          <BarChart bars={mirrorDeltas} label="How far it fell in each session" tone="cool" />
        ) : (
          <Caption style={{ paddingVertical: space.lg }}>No sessions logged yet.</Caption>
        )}
        {mirrorBefore !== null && (
          <Row style={{ marginTop: space.lg }}>
            <View style={{ flex: 1 }}>
              <Caption>Usually starts at</Caption>
              <Text style={[t.h1, { color: c.ink, marginTop: 2 }]}>{mirrorBefore}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Caption>Usually ends at</Caption>
              <Text style={[t.h1, { color: c.cool, marginTop: 2 }]}>{mirrorAfter}</Text>
            </View>
          </Row>
        )}
      </Section>

      {exportSection}
    </Ground>
  );
}
