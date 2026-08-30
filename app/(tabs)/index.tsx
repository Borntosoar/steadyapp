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
import {
  computeReclaimed, checkInsInLastDays, reclaimedCopy, previousWeekCheckIns, lifetimeReclaimed,
} from '../../lib/reclaimed';
import { weekProgress, recommendedAction, WEEKS_TOTAL } from '../../lib/protocol';
import { milestoneCopy } from '../../lib/streak';
import { lastSevenDays } from '../../lib/week';
import { nextMoment } from '../../lib/moments';
import { MODULES } from '../../content/modules';
import { NAMES, EXPLAIN } from '../../content/names';
import { NOTIFY_COPY } from '../../content/copy';
import { markHardDayIntent } from '../../hooks/navIntent';
import { SUPPORT_PILL_CLEARANCE } from '../_layout';
import { effectiveWeek } from '../../lib/entitlement';
import { useEntitlement } from '../../hooks/useEntitlement';
import { orderOf, progress, stoneFor, STAGE_AT } from '../../lib/plan';
import { askOwed } from '../../lib/notify';
import { useNotifications } from '../../hooks/useNotifications';

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
  /* Read for lib/moments.ts, not for rendering — see the memo below. */
  const measures = useStore((s) => s.measures);
  const notify = useStore((s) => s.notify);

  /* ---------- reminders ----------
   *
   * Two effects, and they are separate because rule 4 in lib/notify.ts needs them to be.
   *
   * `sync` replaces the whole queue with what the current state says should be queued, so a
   * check-in this evening clears tonight's reminder rather than letting it fire at somebody
   * who has already done the thing.
   *
   * `suppress` is the half that would be forgotten. A notification is handed to the OS AHEAD
   * of time and fires while the app is closed, so refusing to schedule on a bad day only
   * covers a person who was already having one when the planner last ran. Somebody who was
   * fine this morning, queued a 9pm reminder, and recorded a hard day at six has one sitting
   * in the OS with nothing to stop it. This pulls it back.
   *
   * Both are no-ops on web and both swallow their own failures — a scheduling API that
   * throws must never take the home screen down with it. */
  const { sync: syncNotifications, suppress: suppressNotifications } = useNotifications();
  const notifyKey = `${notify.permitted}:${notify.dailyTime}:${notify.groundwork}`;
  React.useEffect(() => {
    void syncNotifications(useStore.getState() as never, notify);
  }, [notifyKey, checkIns.length, practice.length, entitlement, syncNotifications]);
  React.useEffect(() => {
    void suppressNotifications(useStore.getState() as never);
  }, [checkIns.length, practice.length, suppressNotifications]);

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
     any of them.

     ⚠ THE LIST HAS TO MATCH WHAT lib/moments.ts READS, AND IT DID NOT. The line here used to
     say "lib/moments.ts reads these eight and nothing else", and that sentence was already
     false when it was written: `measure-due` reads `state.measures`, which was absent, so
     `dueMilestone` was handed `undefined` every time. It returns null on an absent history
     rather than throwing, so the scheduled 30/60/90 re-measure silently never fired from
     this screen — the exact bug lib/moments.ts's own docblock records finding once already,
     back when `dueMilestone` had no caller at all. It had a caller and no data.
     Then `measure-baseline` added a read of `state.profile`, which is not optional-chained
     at every level, and the missing field stopped being silent: the home screen crashed to
     CrashScreen on launch. That is how this was found — a screenshot, not a test, because
     every test builds a COMPLETE state and only this screen builds a partial one.
     __tests__/moments.test.mjs now derives the required list from lib/moments.ts and fails
     if this object is missing any of it. Do not shorten it by hand. */
  const momentState = React.useMemo(
    () => ({
      baseline, checkIns, entitlement, measures, mirrorSessions, moments, practice, profile,
      protocol, streak, urgeLogs,
    }),
    [baseline, checkIns, entitlement, measures, mirrorSessions, moments, practice, profile,
      protocol, streak, urgeLogs],
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
  /* ---------- the record ----------
   *
   * THE ONE THING HERE THAT CANNOT FALL, and the reason to open this on day 200.
   *
   * Everything else on this screen is a rolling window or resets. `reclaimed.hours` is seven
   * days and vanishes below three check-ins, so a fortnight away deletes the headline; the
   * running streak went back to 1 and was taken off this screen for that reason. So there
   * was no answer to "why open it in March", because nothing in the app accumulated. Daylio
   * and Bearable both retain on exactly this and nothing else — the record is yours and it
   * has 199 entries in it.
   *
   * `days` is DISTINCT DAYS, ALL TIME, and never revised down. Not the streak, which a gap
   * resets; not sessions, which would pay somebody per action for staying in the app longer.
   * It is the same count lib/moments.ts already uses, so a missed week subtracts nothing and
   * two things in one day are worth what one is.
   *
   * The stone was drawn once, on the survey result screen, and never again — `stageOf`,
   * `progress` and `STAGES` had no production call site at all. lib/plan.ts already argues
   * this out against Deci 1999 and Six 2021: it is a memento given for arriving, not a
   * payment for acts, which is why it is safe to put where a reward would not be. */
  const practiceDays = new Set(practice.map((p) => p.date)).size;
  const stone = stoneFor(profile.carrying);
  const record = stone ? progress(stone, practiceDays) : null;
  const lifetime = lifetimeReclaimed(baseline, checkIns);
  /* The next rung, or null once past the last. Shown as a horizon, NEVER as a countdown with
     a number attached — "N days to go" is a deadline, and a deadline is the thing a memento
     must not become. */
  const nextRung = STAGE_AT.find((d) => d > practiceDays) ?? null;

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

          {/* ---------- the record ----------
              A memento and a total, both monotonic. Below the games rather than above them
              because it is a thing to notice, not a thing to do — and the moment it becomes
              the first thing on the screen it starts reading as the point of opening the app,
              which is when a memento turns into a score.
              Rendered only once there is something to show: a stone at Rough with zero days
              on day one is a scoreboard reading of somebody who has just arrived. */}
          {/* ---------- the reminders ask ----------
              A CARD, NOT A REDIRECT, and not the OS sheet. Three separate refusals, all from
              lib/notify.ts rule 6 and 7:
              · It is not in onboarding. Nobody can answer "would a reminder help" before they
                have used the thing, and the OS permission can only be spent once.
              · It does not open the system sheet from here. Tapping through goes to a screen
                that explains what would fire and what never would; the OS is asked only after
                somebody picks a time, so declining leaves the permission unspent.
              · It appears once. `askOwed` is false the moment `askedAt` is stamped, whichever
                way they answered. */}
          {askOwed({ practice } as never, notify) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${NOTIFY_COPY.ask.title}. ${NOTIFY_COPY.ask.body}`}
              onPress={() => router.push('/reminders')}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Frost style={{ marginTop: space.md }}>
                <Caption style={{ color: c.accentDeep }}>One small thing</Caption>
                <H3 style={{ marginTop: 2 }}>{NOTIFY_COPY.ask.title}</H3>
                <BodySm style={{ marginTop: space.xs }}>{NOTIFY_COPY.ask.body}</BodySm>
              </Frost>
            </Pressable>
          )}

          {record && record.days > 0 && (
            <Frost style={{ marginTop: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                <View style={{ flex: 1 }}>
                  <H3>{record.stone.name}</H3>
                  {/* Stage and days on one line. The stage is the memento; the day count is
                      the thing that cannot fall, and it is the one somebody checks. */}
                  <Caption style={{ marginTop: 2 }}>
                    {record.stage} · {record.days} {record.days === 1 ? 'day' : 'days'} here
                  </Caption>
                </View>
              </View>
              {/* NO COUNTDOWN. The next rung is named as somewhere the stone gets to, never
                  as "N days to go" — a number counting down is a deadline, and a deadline is
                  what this must never become. Absent once past the last rung. */}
              {nextRung !== null && (
                <Caption style={{ marginTop: space.sm, color: c.inkFaint }}>
                  It keeps changing the longer you are here.
                </Caption>
              )}
              {lifetime.hours > 0 && (
                <Caption style={{ marginTop: space.sm }}>
                  {lifetime.hours} hours you have already got back, across {lifetime.weeks}
                  {lifetime.weeks === 1 ? ' week' : ' weeks'}. You cannot lose an hour you
                  already got back.
                </Caption>
              )}
            </Frost>
          )}

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
