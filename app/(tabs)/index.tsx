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
import { effectiveWeek } from '../../lib/entitlement';
import { useEntitlement } from '../../hooks/useEntitlement';
import { orderOf } from '../../lib/plan';

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
  const { entitled } = useEntitlement();

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
  const moments = useStore((s) => s.moments);
  const entitlement = useStore((s) => s.entitlement);

  /* THE WEEK SHOWN, NOT NECESSARILY THE WEEK REACHED. A free user keeps earning — the
     counter in storage advances exactly as before and resumes at the real week the moment
     they subscribe — but the guided programme they are shown stops at week one, because
     that is what the paywall sells. lib/entitlement.ts has the reasoning and the two safety
     rules that fix its scope. */
  const week = effectiveWeek(protocol.currentWeek, entitled);
  const wp = weekProgress(protocol, profile.practiceDaysPerWeek);
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
  /* Openable = free, or paid and subscribed. This used to be `m.free` alone, so a subscriber
     who had read the three free week-one pieces was pointed at nothing, or back at week one,
     for the remaining eleven weeks of a programme they had paid for. */
  const openable = (m: (typeof MODULES)[number]) => m.free || entitled;
  const dueThisWeek = MODULES.filter((m) => m.week <= week && openable(m));
  const hasUnreadForThisWeek = dueThisWeek.some((m) => !readModules.includes(m.slug));
  const nextUnreadModule =
    dueThisWeek.find((m) => !readModules.includes(m.slug))?.slug
    ?? MODULES.find((m) => openable(m) && !readModules.includes(m.slug))?.slug
    ?? null;

  const action = recommendedAction({
    week,
    checkedInToday,
    hasUnreadForThisWeek,
    mirrorThisWeek: since(mirrorSessions),
    recordsThisWeek: since(thoughtRecords),
    nextUnreadModule,
  });

  /* COMPOSED FROM THE SLICES ABOVE rather than `useStore()`.
     Subscribing to the whole store re-rendered this screen on every write anywhere in the
     app, which matters because Expo Router keeps all four tabs mounted — and `momentShown`
     fires from MomentCard's own mount effect, so the screen re-rendered itself. Every field
     here is already individually subscribed, so this object changes exactly when one of the
     things nextMoment reads changes, and not before.
     Kept in a useMemo so the object identity is stable between renders that did not touch
     any of them. lib/moments.ts reads these eight and nothing else. */
  const momentState = React.useMemo(
    () => ({ checkIns, entitlement, mirrorSessions, moments, practice, protocol, streak, urgeLogs }),
    [checkIns, entitlement, mirrorSessions, moments, practice, protocol, streak, urgeLogs],
  );

  const moment = nextMoment({
    state: momentState as never,
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
    { title: NAMES.still.title, sub: NAMES.still.sub, route: '/still', icon: 'play' as const },
    { title: NAMES.urge.title, sub: '3 minutes', route: '/urges', icon: 'play' as const },
    { title: NAMES.thought.title, sub: 'About 5 minutes', route: '/journal', icon: 'plus' as const },
  ];

  /* THE GAMES, ON THE SCREEN THE APP OPENS TO — docs/DIRECTION.md §16.7, item 3.
   *
   * They were not here. DIRECTION.md §9 says the games ARE the product, four of them shipped
   * across nine days, and Today's grid was check-in, calm, Still, urges and the thought
   * record — every one of them a practice from the twelve-week protocol. `recommendedAction`
   * never returns a game route either, so the app's own recommender could not surface them.
   * The product was one tab away and mentioned by nothing.
   *
   * ORDERED BY THE SURVEY, through `orderOf`, which until now had no production consumer at
   * all: three questions were asked at first open and their answer was used to draw one
   * screen and then discarded. It decides order only — every game is present for everybody,
   * because a survey answer must never leave somebody with a smaller app.
   *
   * A ROW THAT SCROLLS, not a second grid. Four more 48% tiles under the existing five reads
   * as a wall of equal choices, and the point of this row is that these four are not the same
   * kind of thing as "check in" — they are the thing to play. */
  const games = orderOf(profile.survey ?? {}).map((route) => {
    const key = route.replace('/game/', '') as 'curveball' | 'toward' | 'groundwork' | 'ballast';
    return { route, title: NAMES[key].title, sub: NAMES[key].sub };
  });

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
              {/* ⚠ THE RUNNING STREAK IS DELIBERATELY NOT PRINTED HERE — §16.7 item 6.
                  This read "N days in a row" off `streak.current`, and lib/streak.ts is
                  careful about it in every way a string can be careful: silent freezes, no
                  red, `longest` preserved, hard-day taps counting, every message regex-tested
                  for shaming language.
                  None of that reaches the arithmetic. Come back after two weeks away and the
                  top of the first screen turns 40 into 1. No sentence shames anybody; the
                  NUMBER does, and it is the only value in this product that goes down for a
                  reason the person did not choose. Defanging a streak removes the loss
                  aversion that makes a streak work and keeps the cost of one — so what is
                  left is the cost.
                  `registerPractice` is untouched: it still feeds `pendingMilestone` and the
                  `winback` moment, and `streak.longest` is a record rather than a demotion,
                  so Progress is where it belongs. What sits here instead is the one thing
                  that cannot fall. */}
              <Caption>Week {week} of {WEEKS_TOTAL}</Caption>
            </View>
            <WeekStrip days={days} />
            <Explain q={EXPLAIN.week.q} a={EXPLAIN.week.a} />
          </View>

          {/* ---------- the games ----------
              ABOVE "Next up", NOT BELOW THE GRID, and the placement is the point.
              First draft put this under the tile grid, which is a full screen down: the
              product was still not on the screen the app opens to, only closer to it. This
              sits directly under the week strip, so the first scroll shows the number and
              then the four things to play.
              It stays ABOVE "Next up" rather than replacing it, because `recommendedAction`
              never returns a game route — the two are answering different questions, and
              deleting the recommendation to make room would take the protocol's one thread
              away from the person still following it. */}
          <View style={{ marginTop: space.xl }}>
            <Caption style={{ color: c.inkSoft, marginBottom: space.sm }}>Games</Caption>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              /* Negative margin plus matching padding so the row bleeds to the screen edge.
                 A horizontal scroller that stops at the content gutter reads as having
                 nothing more in it, which is the opposite of what the affordance is for. */
              style={{ marginHorizontal: -space.lg }}
              contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}
            >
              {games.map((g) => (
                <Frost key={g.route} style={{ width: 200 }} onPress={() => router.push(g.route)}>
                  <View style={{ minHeight: 104, justifyContent: 'space-between', gap: space.md }}>
                    <View>
                      <H3>{g.title}</H3>
                      <Caption style={{ marginTop: 2 }}>{g.sub}</Caption>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <IconBadge icon="play" size={40} />
                    </View>
                  </View>
                </Frost>
              ))}
            </ScrollView>
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
