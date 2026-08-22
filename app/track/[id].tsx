import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Body, BodySm, Caption, H2, Button, useTheme } from '../../components/ui';
import { Frost, TopBar } from '../../components/frost';
import { Atmosphere } from '../../components/Atmosphere';
import { Motif } from '../../components/Motif';
import { groundFor } from '../../lib/motif.ts';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { haptic } from '../../hooks/haptics';
import { TRACK_CAVEAT, TRACK_CLOSE, type Track, type TrackDay } from '../../content/tracks.ts';
import { openTrack, nextDay, isOpen, isComplete, progressOf } from '../../lib/track.ts';

/* A guided track. One route serves all of them — the breakup one is simply the first.
 *
 * TWO SCREENS. An overview listing the days, with everything after the first unfinished one
 * closed; and a day, which is a short piece of orientation, one game, one practice and one
 * question to hold.
 *
 * WHAT THE OVERVIEW DOES NOT SAY. No dates, no "day 3 of 7" counter, no percentage, no
 * streak, and nothing about how long any of this takes. content/tracks.ts has the full list
 * of refusals and the reasoning; the two that shape this screen are that a promised timeline
 * turns an ordinary bad month into evidence something is wrong with you, and that "day
 * three" here means the third one you did rather than the third day since it happened.
 *
 * MARKING A DAY DONE IS THE PERSON'S CALL, NOT THE APP'S. It does not verify that the game
 * was played or the practice completed. Verification would make this a compliance checker
 * for somebody's worst month, and the person who marks a day done without doing the
 * breathing has still read the orientation and held the question, which is most of it. */

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTheme();
  const tracks = useStore((s) => s.tracks);
  const completeTrackDay = useStore((s) => s.completeTrackDay);

  const [openDay, setOpenDay] = useState<TrackDay | null>(null);

  const resolved = openTrack(typeof id === 'string' ? id : '', tracks);

  if (!resolved) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Stage>
          <TopBar onBack={() => router.back()} />
          <View style={{ paddingTop: space.xxl, gap: space.lg }}>
            <H2>That one is not here.</H2>
            <Button label="Back" onPress={() => router.back()} />
          </View>
        </Stage>
      </View>
    );
  }

  const { track, state } = resolved;
  const ground = groundFor(openDay?.mood ?? 'evening', c.isDark);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere variant={ground} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />
      <Motif
        kind={openDay?.motif ?? 'moons'}
        seed={openDay?.id ?? track.id}
        color={c.ink}
        isDark={c.isDark}
        insetTop={110}
      />

      {openDay ? (
        <Day
          day={openDay}
          done={state.done.includes(openDay.id)}
          onBack={() => setOpenDay(null)}
          onGo={(route) => router.push(route)}
          onDone={() => {
            haptic.commit();
            completeTrackDay(track.id, openDay.id);
            setOpenDay(null);
          }}
        />
      ) : (
        <Overview
          track={track}
          state={state}
          onBack={() => router.back()}
          onOpen={setOpenDay}
        />
      )}
    </View>
  );
}

/* ---------- layout ---------- */

function Stage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: '100%',
          maxWidth: LAYOUT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: space.lg,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}

/** Seven dots that fill. The same growing element the survey uses, and for the same reason:
 *  a bar reading "3 of 7" is a schedule, and this is explicitly not one. */
function Seedling({ total, done }: { total: number; done: number }) {
  const c = useTheme();
  return (
    <Svg width={total * 17} height={12}>
      {Array.from({ length: total }, (_, i) => (
        <Circle
          key={i}
          cx={6 + i * 17}
          cy={6}
          r={i < done ? 5 : 3}
          fill={i < done ? c.accent : 'none'}
          stroke={c.lineStrong}
          strokeWidth={1.4}
        />
      ))}
    </Svg>
  );
}

/* ---------- the list of days ---------- */

function Overview({
  track, state, onBack, onOpen,
}: {
  track: Track;
  state: { startedAt: string; done: string[] };
  onBack: () => void;
  onOpen: (d: TrackDay) => void;
}) {
  const c = useTheme();
  const { done, total } = progressOf(track, state);
  const next = nextDay(track, state);
  const finished = isComplete(track, state);

  return (
    <Stage>
      <TopBar onBack={onBack} title={track.title} />
      <View style={{ paddingTop: space.lg }}>
        <Seedling total={total} done={done} />
      </View>

      <View style={{ gap: space.md, paddingTop: space.lg, paddingBottom: space.xl }}>
        <Body>{track.blurb}</Body>
        <BodySm>{TRACK_CAVEAT}</BodySm>
      </View>

      {finished && (
        <View style={{ paddingBottom: space.xl }}>
          <Frost>
            <Body>{TRACK_CLOSE}</Body>
          </Frost>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        {track.days.map((d) => {
          const isDone = state.done.includes(d.id);
          const open = isOpen(track, state, d.id);
          const isNext = next?.id === d.id;
          return (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityLabel={d.title}
              accessibilityState={{ disabled: !open }}
              disabled={!open}
              onPress={() => onOpen(d)}
              style={{
                backgroundColor: c.surfaceSolid,
                borderColor: isNext ? c.accent : c.line,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderRadius: radius.md,
                padding: space.lg,
                gap: space.xs,
                /* Closed days are dimmed rather than hidden. Seeing what is coming is part
                   of what makes a sequence feel like one, and a locked row with a padlock on
                   it would read as a paywall on somebody's worst month. */
                opacity: open ? 1 : 0.45,
              }}
            >
              <Text style={[t.body, { color: c.ink }]}>
                {isDone ? '✓  ' : ''}
                {d.title}
              </Text>
              {open && <Text style={[t.caption, { color: c.inkFaint }]}>{d.about}</Text>}
            </Pressable>
          );
        })}
      </View>
    </Stage>
  );
}

/* ---------- one day ---------- */

function Day({
  day, done, onBack, onGo, onDone,
}: {
  day: TrackDay;
  done: boolean;
  onBack: () => void;
  onGo: (route: string) => void;
  onDone: () => void;
}) {
  const c = useTheme();

  const item = (label: string, sub: string, route: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onGo(route)}
      style={{
        backgroundColor: c.surfaceSolid,
        borderColor: c.line,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderRadius: radius.md,
        padding: space.lg,
        gap: space.xs,
      }}
    >
      <Text style={[t.body, { color: c.ink }]}>{label}</Text>
      <Text style={[t.bodySm, { color: c.inkSoft }]}>{sub}</Text>
    </Pressable>
  );

  return (
    <Stage>
      <TopBar onBack={onBack} />
      <View style={{ gap: space.md, paddingTop: space.xl }}>
        <H2>{day.title}</H2>
        <Body>{day.about}</Body>
      </View>

      <View style={{ gap: space.sm, paddingTop: space.xl }}>
        {item(day.game.label, day.game.focus, day.game.route)}
        {item(day.practice.label, 'Free, always.', day.practice.route)}
      </View>

      {/* One question, and no field under it. content/tracks.ts refusal 2: rumination is the
          thing that maintains this, structured daily reflection can make it worse for the
          person most likely to be here, and the app cannot tell who that is. So it is
          something to carry around rather than something to submit. */}
      <View style={{ paddingTop: space.xl }}>
        <Frost>
          <Caption>To carry</Caption>
          <Body style={{ paddingTop: space.xs }}>{day.hold}</Body>
        </Frost>
      </View>

      <View style={{ paddingTop: space.xxl, gap: space.sm }}>
        {done ? (
          <BodySm>Already marked. You can do it again whenever you want.</BodySm>
        ) : (
          <Button label="Mark this one done" onPress={onDone} />
        )}
        <Caption style={{ textAlign: 'center' }}>
          No schedule. The next one is there when you want it.
        </Caption>
      </View>
    </Stage>
  );
}
