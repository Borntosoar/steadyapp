import React from 'react';
import { View, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Bleed, Button, Caption, H2, H3, Body, BodySm, Row, Rule, useTheme } from '../../components/ui';
import { MomentCard } from '../../components/MomentCard';
import { StorageNotice } from '../../components/StorageNotice';
import { PRICING } from '../../lib/entitlement';
import { nextMoment } from '../../lib/moments';
import { Atmosphere } from '../../components/Atmosphere';
import {
  space, radius, type as t, atmosphereForHour, TAB_BAR_HEIGHT, LAYOUT_MAX_WIDTH,
  type AtmosphereKey,
} from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { computeReclaimed, checkInsInLastDays, reclaimedCopy, previousWeekCheckIns } from '../../lib/reclaimed';
import { phaseForWeek, weekProgress, recommendedAction, WEEKS_TOTAL } from '../../lib/protocol';

const RAIL: { key: string; title: string; sub: string; route: string; art: AtmosphereKey }[] = [
  { key: 'urges', title: 'Urge surfing', sub: '3 min', route: '/urges', art: 'ember' },
  { key: 'mirror', title: 'Mirror practice', sub: 'Graded', route: '/mirror', art: 'dusk' },
  { key: 'ground', title: 'Grounding', sub: 'Free', route: '/grounding', art: 'jade' },
  { key: 'journal', title: 'Thought record', sub: '5 min', route: '/journal', art: 'night' },
];

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
  const checkedInToday = useStore((s) => s.checkedInToday)();

  const week = protocol.currentWeek;
  const phase = phaseForWeek(week);
  const wp = weekProgress(protocol);
  const sky = atmosphereForHour();

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

  const action = recommendedAction({
    week,
    checkedInToday,
    modulesReadThisWeek: readModules.length,
    mirrorThisWeek: since(mirrorSessions),
    recordsThisWeek: since(thoughtRecords),
  });

  const resisted = urgeLogs.filter((u) => u.resisted).length;

  /* Everything the app says unprompted goes through one scheduler: at most one a day,
     prioritised, capped, and silenced for 24 hours by any sign of a hard day. The screen
     does not decide what to show — it asks. See lib/moments.ts. */
  const state = useStore();
  const moment = nextMoment({
    state,
    trialStartedAt: state.trialStartedAt,
    trialDays: PRICING.trialDays,
    reclaimedSampleSize: reclaimed.sampleSize,
    weekComplete: wp.complete,
  });

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + space.xl, alignItems: 'center' }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
        {/* ---- the scene ---- */}
        <Atmosphere variant={sky} rounded="none" style={{ minHeight: 430 }}>
          <View style={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.lg, paddingBottom: space.xl }}>
            <Caption style={{ color: 'rgba(255,255,255,0.72)' }}>
              {greeting}{profile.firstName ? `, ${profile.firstName}` : ''}
            </Caption>

            <View style={{ marginTop: space.xxxl }}>
              {/* The figure IS the headline when there is one. Rendering `copy.headline`
                  under it as well printed the same number twice, stacked. */}
              {showNumber ? (
                <Text style={[t.hero, { color: '#fff' }]}>
                  {Math.abs(reclaimed.hours)}
                  <Text style={[t.h2, { color: 'rgba(255,255,255,0.66)' }]}>  hours</Text>
                </Text>
              ) : (
                <Text style={[t.display, { color: '#fff' }]}>{copy.headline}</Text>
              )}
              <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.md, maxWidth: 340 }]}>
                {copy.sub}
              </Text>
            </View>

            <Row style={{ marginTop: space.xl }}>
              <WeekRing week={week} total={WEEKS_TOTAL} />
              <View style={{ flex: 1 }}>
                <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)' }]}>
                  Week {week} of {WEEKS_TOTAL} · {phase.name}
                </Text>
                <Text style={[t.caption, { color: 'rgba(255,255,255,0.55)', marginTop: 2 }]}>
                  {wp.complete ? 'Week complete' : `${wp.remaining} more day${wp.remaining === 1 ? '' : 's'} to open week ${week + 1}`}
                </Text>
              </View>
            </Row>
          </View>
        </Atmosphere>

        {/* Renders nothing unless persistence has actually stopped working. Above the
            day's action because losing the writing outranks doing more of it. */}
        <View style={{ paddingHorizontal: space.lg, marginTop: -space.xl }}>
          <StorageNotice />
        </View>

        {/* ---- today's one action ---- */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(action.route)}
            style={({ pressed }) => ({
              backgroundColor: c.surfaceSolid,
              borderRadius: radius.card,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.lineStrong,
              padding: space.lg,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Row>
              <View style={{ flex: 1 }}>
                <Caption>Today</Caption>
                <H2 style={{ marginTop: 2 }}>{action.label}</H2>
              </View>
              <View
                style={{
                  width: 46, height: 46, borderRadius: radius.pill,
                  backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Svg width={15} height={15} viewBox="0 0 15 15">
                  <Path d="M4 2.6 12.4 7.5 4 12.4z" fill={c.onAccent} />
                </Svg>
              </View>
            </Row>
            <BodySm style={{ marginTop: space.sm }}>{action.why}</BodySm>
          </Pressable>
        </View>

        {/* ---- practice rail ---- */}
        <View style={{ marginTop: space.xl }}>
          <Row style={{ paddingHorizontal: space.lg, marginBottom: space.md }}>
            <H3>Practice</H3>
            <Pressable accessibilityRole="button" onPress={() => router.push('/practice')}>
              <Caption>See all</Caption>
            </Pressable>
          </Row>
          <Bleed>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}
            >
              {RAIL.map((r, i) => (
                <Pressable
                  key={r.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}, ${r.sub}`}
                  onPress={() => router.push(r.route)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                >
                  <Atmosphere
                    variant={r.art}
                    lightX={0.35 + i * 0.16}
                    rounded="card"
                    style={{ width: 168, height: 196, justifyContent: 'flex-end' }}
                  >
                    <View style={{ padding: space.md }}>
                      <Text style={[t.caption, { color: 'rgba(255,255,255,0.7)' }]}>{r.sub}</Text>
                      <Text style={[t.h3, { color: '#fff', marginTop: 2 }]}>{r.title}</Text>
                    </View>
                  </Atmosphere>
                </Pressable>
              ))}
            </ScrollView>
          </Bleed>
        </View>

        {/* ---- quiet numbers. rules, not cards. ---- */}
        <View style={{ paddingHorizontal: space.lg, marginTop: space.xxl }}>
          <Rule />
          <Row style={{ paddingVertical: space.lg }}>
            <Stat value={String(streak.current)} label={`day${streak.current === 1 ? '' : 's'} of practice`} />
            <Stat value={String(resisted)} label="urges resisted" tone="cool" />
            <Stat value={`${wp.done}/${wp.required}`} label="this week" />
          </Row>
          <Rule />
        </View>

        {/* ---- the one unprompted message ----
             Placed after the week's numbers rather than above them, so whatever the app
             has to say arrives behind what the person actually opened it for. */}
        {moment && (
          <View style={{ paddingHorizontal: space.lg, marginTop: space.xxl }}>
            <MomentCard moment={moment} />
          </View>
        )}

        {/* ---- hard day ---- */}
        <View style={{ paddingHorizontal: space.lg, marginTop: space.lg }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/grounding?mode=hard')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              paddingVertical: space.lg,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 8, height: 8, borderRadius: 4, backgroundColor: c.warn,
              }}
            />
            <View style={{ flex: 1 }}>
              <Body style={{ color: c.ink }}>Today is a hard day</Body>
              <Caption>Nothing is required. This still counts as showing up.</Caption>
            </View>
            <Caption>›</Caption>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: space.lg, marginTop: space.md }}>
          <Caption>
            A self-help tool, not treatment. Support is one tap away from every screen.
          </Caption>
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'cool' }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[t.h1, { color: tone === 'cool' ? c.cool : c.ink }]}>{value}</Text>
      <Text style={[t.caption, { color: c.inkFaint, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function WeekRing({ week, total }: { week: number; total: number }) {
  const size = 44;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, week / total);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.28)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#fff"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[t.label, { color: '#fff' }]}>{week}</Text>
    </View>
  );
}
