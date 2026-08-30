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
import { effectiveWeek } from '../../lib/entitlement';
import { NAMES, EXPLAIN } from '../../content/names';
import { SUPPORT_PILL_CLEARANCE } from '../_layout';

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
  /* NOT `useStore()`. Subscribing to the whole store means this screen re-renders on every
     write anywhere in the app — and Expo Router keeps all four tabs mounted, so one
     `logPractice` from a game re-ran computeReclaimed, three array sorts, a Map build, four
     reduces and five charts on a screen nobody was looking at.
     `state` here is read by exactly two things, both of them tap handlers, so it is fetched
     at the point of use instead. */
  const snapshot = () => useStore.getState() as never;

  /* Narrow selectors for everything this screen actually renders. Each is `s.field`, so a
     write to a field not listed here does not re-render the charts. */
  const baseline = useStore((st) => st.baseline);
  const checkIns = useStore((st) => st.checkIns);
  const urgeLogs = useStore((st) => st.urgeLogs);
  const mirrorSessions = useStore((st) => st.mirrorSessions);
  const protocol = useStore((st) => st.protocol);
  /* Only `longest` is read — the running streak is deliberately not shown anywhere. See the
     note beside the week strip in app/(tabs)/index.tsx. */
  const streak = useStore((st) => st.streak);
  /* Narrow, like the rest — only the practice target is read here. */
  const practiceDaysPerWeek = useStore((st) => st.profile.practiceDaysPerWeek);
  const [exportFailed, setExportFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const reset = useStore((st) => st.reset);


  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );
  const showNumber = reclaimed.hasData && reclaimed.sampleSize >= 3;

  const wp = weekProgress(protocol, practiceDaysPerWeek);

  /* Clamped, like every other screen that prints a week. This one was the loudest miss: the
     Progress tab said "Week 9 of 12" and lit the ninth pip while Today, Practice and Learn
     all said week 1 — the same fact, four tabs, two answers, and the tab whose whole job is
     to be the honest record of what happened was the one disagreeing. */
  const week = effectiveWeek(protocol.currentWeek, entitled);

  const hero = (
    <>
      <Caption style={{ marginTop: space.xl, paddingRight: SUPPORT_PILL_CLEARANCE }}>Hours back, last 7 days</Caption>
      {/* Wraps rather than clipping. At large text the unit ran off the right edge as
          "hou…", because a row of two Texts with a hero-sized number in it has nowhere to go.
          `flexWrap` puts "hours" on the next line instead, which is ugly at 3x and legible,
          and the alternative was legible at 1x and truncated at 2x. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: space.sm }}>
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
            Week {week} of {WEEKS_TOTAL}
          </Caption>
        </Row>
        <WeekPips
          done={protocol.completedWeeks}
          current={week}
          progress={wp.done / Math.max(1, wp.required)}
        />
        <Explain q={EXPLAIN.week.q} a={EXPLAIN.week.a} />
      </Frost>

      {/* THE LONGEST RUN, AS A RECORD — and only ever the longest.
          Today stopped printing the RUNNING streak (see the note in app/(tabs)/index.tsx):
          `streak.current` is the one number in this product that goes down for a reason
          nobody chose, and it did that at the top of the first screen. `longest` cannot fall
          — lib/streak.ts preserves it through every restart — so it is a thing that happened
          rather than a thing being lost, which is the only version of this worth showing to
          somebody who has just come back after a fortnight away.
          Hidden below two, because "1 day, longest run" is a scoreboard reading of a person's
          first week and says nothing they do not already know. */}
      {streak.longest > 1 && (
        <Frost style={{ marginTop: space.md }}>
          <Row>
            <H3>Longest run</H3>
            <Caption>{streak.longest} days</Caption>
          </Row>
          <Caption style={{ marginTop: space.xs }}>
            The most days in a row you have done something here. It does not go down.
          </Caption>
        </Frost>
      )}
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
   * Written to the cache directory, AND DELETED AGAIN AS SOON AS THE SHEET CLOSES.
   *
   * "The OS reclaims the cache under storage pressure" was the original reasoning, and it is
   * not good enough. lib/crypto.ts names the threat model this app encrypts against —
   * forensic extraction, a jailbroken device, anyone with file-level access to the container
   * — and this file is the whole journal in the clear, sitting in that container until the OS
   * happens to feel short of space. `wipeState()` does not reach it either, so after a single
   * export the "Delete everything" button further down this screen stops being true.
   *
   * By the time `Share.share` resolves the destination has already taken its copy, so
   * removing ours costs the person nothing. */
  const download = async (body: string, name: string, mime: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([body], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      /* Appended and removed rather than clicked while detached, and the object URL revoked
         on the next tick rather than the same one. Chromium tolerates both shortcuts; Firefox
         will not dispatch a click on an element outside the document, and Safari can abort a
         download whose blob URL is revoked synchronously. This is the only backup route in an
         app with no server, and the copy beside it promises this file is the only thing that
         survives losing the phone. */
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return;
    }
    let file: InstanceType<typeof File> | null = null;
    try {
      file = new File(Paths.cache, name);
      if (file.exists) file.delete();
      file.create();
      file.write(body);
      await Share.share({ url: file.uri, title: name });
    } catch {
      /* If the file write fails, falling back to the text sheet is still better than the
         person getting nothing — this is the recovery path, and a clumsy export beats no
         export when the alternative is losing everything. */
      await Share.share({ message: body });
    } finally {
      /* Best effort, and silent. A failure to clean up must not surface as a failed export
         when the export itself succeeded. */
      try {
        if (file?.exists) file.delete();
      } catch {
        /* nothing useful to do, and nothing worth telling the user about */
      }
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
    download(exportText(snapshot()), `anneal-summary-${stamp}.txt`, 'text/plain')
  );
  const doBackup = safely(async () =>
    download(exportJson(snapshot()), `anneal-backup-${stamp}.json`, 'application/json')
  );

  const exportSection = (
    <Section title="Take this with you">
      <BodySm style={{ marginTop: space.sm }}>
        A short summary you can hand to a doctor, and a full backup file for you. Handing
        someone a written record is far easier than saying it out loud. It also means the
        first appointment is not spent piecing it back together.
      </BodySm>
      <BodySm style={{ marginTop: space.md, color: c.cool }}>
        Both are free and always will be. Anneal keeps nothing on a server, so this file is
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

      {/* ---------- erasure ----------
          `reset()` has existed in the store since the beginning and NOTHING CALLED IT. The
          only way to erase anything was to delete the app, which works but is not a control
          — it is a workaround the user has to think of. Drafting the privacy policy is what
          surfaced it: the erasure-rights section had to describe app deletion as the route,
          which is honest and also plainly worse than a button.
          Placed under export deliberately, and after the sentence explaining that the file
          is the only copy. Somebody about to erase everything should have just read how to
          keep a copy of it. */}
      <View style={{ marginTop: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: space.lg }}>
        <H3>Delete everything</H3>
        {!confirmDelete ? (
          <>
            <BodySm style={{ marginTop: space.xs }}>
              Erases every check-in, every note, your plan and your history from this phone.
              There is no server copy, so this is final.
            </BodySm>
            <Button
              label="Delete everything"
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
              style={{ marginTop: space.sm, alignSelf: 'flex-start' }}
            />
          </>
        ) : (
          <>
            <BodySm style={{ marginTop: space.xs, color: c.warn }}>
              This cannot be undone and there is no backup to restore from. If you have not
              saved a copy, do that first — the button is just above.
            </BodySm>
            <Row style={{ marginTop: space.md, justifyContent: 'flex-start', gap: space.md }}>
              {/* The safe choice is the prominent one. A destructive action should not be
                  the easiest thing to hit on a screen somebody may be scrolling quickly. */}
              <Button label="Keep my data" onPress={() => setConfirmDelete(false)} />
              <Button
                label="Yes, delete it all"
                variant="ghost"
                onPress={async () => {
                  setConfirmDelete(false);
                  await reset();
                  router.replace('/');
                }}
              />
            </Row>
          </>
        )}
      </View>
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
            falls during mirror practice. All of that is part of Anneal+.
          </Body>
          <Explain q={EXPLAIN.plus.q} a={EXPLAIN.plus.a} />
          <BodySm style={{ marginTop: space.md }}>
            Your daily check-in keeps recording either way. The history is still being written
            while you decide.
          </BodySm>
          <Button
            label="See Anneal+"
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
