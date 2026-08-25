import React from 'react';
import { View, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Caption, H2, H3, BodySm, useTheme } from '../../components/ui';
import { Frost, IconBadge, WeekStrip, Explain } from '../../components/frost';
import { Finish } from '../../components/Finish';
import { MomentCard } from '../../components/MomentCard';
import { StorageNotice } from '../../components/StorageNotice';
import { Atmosphere } from '../../components/Atmosphere';
import {
  space, radius, type as t, atmosphereForScheme, elevation,
  TAB_BAR_HEIGHT, LAYOUT_MAX_WIDTH,
} from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { computeReclaimed, checkInsInLastDays, reclaimedCopy, previousWeekCheckIns } from '../../lib/reclaimed';
import { weekProgress, recommendedAction, WEEKS_TOTAL } from '../../lib/protocol';
import { milestoneCopy } from '../../lib/streak';
import { lastSevenDays } from '../../lib/week';
import { nextMoment } from '../../lib/moments';
import { MODULES } from '../../content/modules';
import { NAMES, EXPLAIN } from '../../content/names';
import { markHardDayIntent } from '../../hooks/navIntent';
import { SUPPORT_PILL_CLEARANCE } from '../_layout';

/* Today.
 *
 * Rebuilt to the layout the user asked for: a soft question filling the top of the screen,
 * a week you can see at a glance, one obvious thing to do, and a small grid of everything
 * else. Frosted cards over botanical light rather than slabs on black.
 *
 * The order is deliberate and it is the fix for "no flow to it". Top to bottom the screen
 * answers, in order: how am I doing → how have I been → what do I do now → what else is
 * here → what if today is bad. Each answer is one glance. */

export default function Today() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const profile = useStore((s) => s.profile);
  const baseline = useStore((s) => s.baseline);
  const checkIns = useStore((s) => s.checkIns);
  const streak = useStore((s) => s.streak);
  const protocol = useStore((s) => s.protocol);
  const readModules = useStore((s) => s.readModules);
  const mirrorSessions = useStore((s) => s.mirrorSessions);
  const thoughtRecords = useStore((s) => s.thoughtRecords);
  const urgeLogs = useStore((s) => s.urgeLogs);
  const practice = useStore((s) => s.practice);
  const pendingMilestone = useStore((s) => s.pendingMilestone);
  const clearMilestone = useStore((s) => s.clearMilestone);
  const checkedInToday = useStore((s) => s.checkedInToday)();
  const state = useStore();

  const week = protocol.currentWeek;
  const wp = weekProgress(protocol);
  const sky = atmosphereForScheme(c.isDark);

  const reclaimed = computeReclaimed(
    baseline,
    checkInsInLastDays(checkIns, 7),
    7,
    previousWeekCheckIns(checkIns)
  );
  const copy = reclaimedCopy(reclaimed, profile.firstName);
  const showNumber = reclaimed.hasData && reclaimed.sampleSize >= 3;

  const since = (arr: { date: string }[]) => {
    const cut = new Date();
    cut.setDate(cut.getDate() - 7);
    return arr.filter((x) => new Date(x.date + 'T00:00:00') >= cut).length;
  };

  /* The specific piece, not the list. */
  const nextUnreadModule =
    MODULES.find((m) => m.free && !readModules.includes(m.slug))?.slug ?? null;

  const action = recommendedAction({
    week,
    checkedInToday,
    modulesReadThisWeek: readModules.length,
    mirrorThisWeek: since(mirrorSessions),
    recordsThisWeek: since(thoughtRecords),
    nextUnreadModule,
  });

  const moment = nextMoment({
    state,
    reclaimedSampleSize: reclaimed.sampleSize,
    weekComplete: wp.complete,
  });

  /* The last seven days. A day counts if anything was practised on it. */
  const days = lastSevenDays(practice.map((p) => p.date));

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const resisted = urgeLogs.filter((u) => u.resisted).length;

  /* Seven, thirty and a hundred days.
   *
   * `pendingMilestone` has been written on every practice since the store was built and
   * `milestoneCopy` has been fully unit-tested the whole time, and until now nothing in the
   * app read either one — so every milestone passed in complete silence. This is the
   * consumer. It takes over the screen once, on the next open, and then clears itself. */
  if (pendingMilestone != null) {
    const m = milestoneCopy(pendingMilestone);
    return (
      <Finish
        eyebrow="Worth stopping for"
        figure={pendingMilestone}
        figureUnit="days"
        headline={m.title}
        body={m.body}
        doneLabel="Keep going"
        onDone={clearMilestone}
      >
        <Frost>
          <Caption style={{ marginBottom: space.md }}>Your last seven days</Caption>
          <WeekStrip days={days} />
        </Frost>
      </Finish>
    );
  }

  /* Once the check-in is done its tile leaves rather than sitting there saying so. A grid
     of four where one is greyed out and labelled "Done today" is a to-do list with a
     completed item still on it, and the week strip above already records that it happened. */
  const grid = [
    ...(checkedInToday
      ? []
      : [{ title: NAMES.checkin.title, sub: '30 seconds', route: '/checkin', icon: 'plus' as const }]),
    { title: NAMES.calm.title, sub: 'Free, always', route: '/grounding', icon: 'play' as const },
    { title: NAMES.urge.title, sub: '3 minutes', route: '/urges', icon: 'play' as const },
    { title: NAMES.thought.title, sub: 'About 5 minutes', route: '/journal', icon: 'plus' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* The light everything floats on. Fixed behind the scroll so the frost has
          something that moves independently of it, which is what sells the glass. */}
      <Atmosphere variant={sky} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + space.xxl,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, paddingHorizontal: space.lg }}>
          {/* THE STORAGE NOTICE BELONGS ON THE SCREEN THE APP OPENS TO.
              Its own docblock said "It appears on Today and Progress". It did not — it was
              mounted only on Progress. That matters because of what it says: that this session
              is being written in PLAIN TEXT because the keychain was unreachable, or that
              writes are locked after a quarantine and everything typed this session is being
              discarded. Onboarding promises "nobody, including us, can read it", and the
              sentence retracting that lived a tab away, behind a screen that leads with an
              Anneal+ pitch for anyone unentitled.
              It self-suppresses when storage is healthy, so on almost every launch this
              renders nothing at all. */}
          <StorageNotice />

          {/* Right padding reserves the corner the always-mounted Support pill sits in.
              Without it, a longer name — or any text-size setting above the default — runs
              the greeting straight under the pill, and the name is what disappears. Found at
              2.2x scale, where "Good afternoon, Sam" had its Sam hidden behind "Support".
              The pill is chrome and cannot move; the content is what yields. */}
          <Caption style={{ color: c.inkSoft, paddingRight: SUPPORT_PILL_CLEARANCE }}>
            {greeting}{profile.firstName ? `, ${profile.firstName}` : ''}
          </Caption>

          {/* THE NUMBER IS THE PRODUCT, so it is the largest thing on the screen.
              It used to be set inside a 38px sentence — "15.8 hours back this week" — which
              wrapped on a 393pt phone and left the word "week" alone on line two. An
              orphaned hero is the most amateur thing an app can do with type, and it was
              happening to the one figure nobody else in this category has. */}
          {showNumber ? (
            <View style={{ marginTop: space.sm }}>
              <Text style={[t.hero, { color: c.ink }]}>{Math.abs(reclaimed.hours)}</Text>
              <Text style={[t.h2, { color: c.inkSoft, marginTop: 2 }]}>hours back this week</Text>
              <BodySm style={{ marginTop: space.md, maxWidth: 320 }}>{copy.sub}</BodySm>
              <Explain q={EXPLAIN.hours.q} a={EXPLAIN.hours.a} />
            </View>
          ) : (
            <View style={{ marginTop: space.sm }}>
              <Text style={[t.display, { color: c.ink }]}>How is today going?</Text>
              <BodySm style={{ marginTop: space.md, maxWidth: 320 }}>
                Check in and Anneal starts working out how much time this is taking.
              </BodySm>
            </View>
          )}

          {/* Your week, at a glance. The single biggest thing the old home screen lacked:
              nothing showed you your own run without opening another tab. */}
          <View style={{ marginTop: space.xxl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm }}>
              <Caption style={{ color: c.inkSoft }}>This week</Caption>
              <Caption>
                {streak.current > 0
                  ? `${streak.current} day${streak.current === 1 ? '' : 's'} in a row`
                  : `Week ${week} of ${WEEKS_TOTAL}`}
              </Caption>
            </View>
            <WeekStrip days={days} />
            <Explain q={EXPLAIN.week.q} a={EXPLAIN.week.a} />
          </View>

          {/* The one thing to do now. Solid, not frosted, and the only object on the
              screen carrying the deepest shadow — this is the focal point, and translucency
              was making it recede alongside everything else. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action.label}. ${action.why}`}
            onPress={() => router.push(action.route)}
            style={({ pressed }) => [
              {
                marginTop: space.xxl,
                backgroundColor: c.surfaceSolid,
                borderRadius: radius.scene,
                padding: space.xl,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
              c.isDark ? { borderWidth: StyleSheet.hairlineWidth, borderColor: c.lineStrong } : elevation.lift,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <View style={{ flex: 1 }}>
                <Caption style={{ color: c.accentDeep }}>Next up</Caption>
                <H2 style={{ marginTop: 2 }}>{action.label}</H2>
                <BodySm style={{ marginTop: space.xs }}>{action.why}</BodySm>
              </View>
              <IconBadge icon="arrow" size={56} />
            </View>
          </Pressable>

          {/* Everything else, two up. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md }}>
            {grid.map((g) => (
              <Frost
                key={g.title}
                /* No flexGrow. With an odd number of tiles the last one stretched to the
                   full width and stopped reading as part of the grid. */
                style={{ width: '48%' }}
                onPress={() => router.push(g.route)}
              >
                <View style={{ minHeight: 92, justifyContent: 'space-between', gap: space.lg }}>
                  <View>
                    <H3>{g.title}</H3>
                    <Caption style={{ marginTop: 2 }}>{g.sub}</Caption>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <IconBadge icon={g.icon} size={40} />
                  </View>
                </View>
              </Frost>
            ))}
          </View>

          {resisted > 0 && (
            <Frost style={{ marginTop: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                <Text style={[t.hero, { color: c.cool, fontSize: 40, lineHeight: 44 }]}>{resisted}</Text>
                <View style={{ flex: 1 }}>
                  <H3>{resisted === 1 ? NAMES.urge.unit : NAMES.urge.unitPlural}</H3>
                  <Caption style={{ marginTop: 2 }}>This number only ever goes up.</Caption>
                </View>
              </View>
            </Frost>
          )}

          {moment && (
            <View style={{ marginTop: space.md }}>
              <MomentCard moment={moment} />
            </View>
          )}

          {/* Hard day. Always last, always there. */}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              /* Says "a person inside this app tapped this", which the URL cannot say — the
                 same URL is reachable from any link on the device. See hooks/navIntent.ts:
                 this is what lets the hard-day path log on open here while refusing to log
                 for a `anneal://grounding?mode=hard` arriving from outside. */
              markHardDayIntent();
              router.push('/grounding?mode=hard');
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              marginTop: space.lg,
              paddingVertical: space.lg,
              paddingHorizontal: space.lg,
              borderRadius: radius.card,
              borderWidth: StyleSheet.hairlineWidth,
              /* Was outlined in `warn`. A red box drawn around "Today is a hard day" is a
                 warning banner wrapped around kind words, and people feel the contradiction
                 even when they cannot name it. The dot is the only red on the screen. */
              borderColor: c.lineStrong,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.warn }} />
            <View style={{ flex: 1 }}>
              <H3>Today is a hard day</H3>
              <Caption style={{ marginTop: 2 }}>Nothing is asked of you. Opening this counts.</Caption>
            </View>
            <Caption>›</Caption>
          </Pressable>

          <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>
            A self-help tool, not treatment. Help is one tap away on every screen.
          </Caption>
        </View>
      </ScrollView>
    </View>
  );
}
