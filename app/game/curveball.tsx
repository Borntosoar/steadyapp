import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, BodySm, Caption, H2, Button, useTheme } from '../../components/ui';
import { Frost, TopBar, Steps, Segmented } from '../../components/frost';
import { Finish } from '../../components/Finish';
import { Atmosphere } from '../../components/Atmosphere';
import { Motif } from '../../components/Motif';
import { groundFor } from '../../lib/motif.ts';
import type { AtmosphereKey } from '../../constants/theme';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { haptic } from '../../hooks/haptics';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  sessionScenes, actionsFor, cast,
  type CurveballScene, type CurveballThought, type NextAction,
} from '../../content/curveball.ts';
import { PASS_LABEL, PASS_ACKNOWLEDGEMENT } from '../../content/toward.ts';

/* Curveball — the CBT game.
 *
 * Three phases per scene, four scenes per session, roughly ninety seconds.
 *
 *   1. INTERCEPT. Somebody else's thoughts rise before a thing that has not happened yet.
 *      Tap the ones they cannot check; let the ones that hold up go past. A caught thought
 *      names its own pattern — shown, never asked about.
 *   2. WHAT THEY DO NEXT. Three actions, and the one that proceeds on what they actually
 *      know is never marked as correct. You see what happens instead.
 *
 * The naming quiz is gone and the reframe answer key is gone; docs/DIRECTION.md §10 has the
 * evidence. In short: nothing has ever isolated distortion-labelling, and picking an accurate
 * reframe trains the one CBT component that is probably not additive, while choosing an
 * action trains the one that is.
 *
 * THE TELL IS SHAPE, NOT COLOUR — AND IT SURVIVES REDUCE MOTION. Distorted thoughts lean;
 * balanced ones sit straight. With animation allowed they also sway, and with Reduce Motion
 * on they hold a fixed lean instead, because a static angle is not motion. Colour never
 * carries the difference alone, which is the plain WCAG 1.4.1 requirement and also better
 * game design: a colour tell is read peripherally and teaches nothing, while a difference in
 * shape makes you look at the sentence.
 *
 * WHY THERE IS A CLOCK AT ALL, AND WHY IT CAN BE TURNED OFF. Time pressure is the point:
 * distorted thoughts arrive fast and unbidden in life, and practising the catch at leisure
 * trains a skill you cannot deploy. But the audience for a CBT game includes people whose
 * anxiety a timer makes worse and people whose ADHD makes the timed version simply
 * inaccessible, and a game they cannot play teaches them nothing at all. `No clock` below is
 * therefore not a difficulty setting — it removes the falling entirely and lays the thoughts
 * out to be sorted at any pace. Same discrimination, no stopwatch.
 *
 * FEEDBACK, AND THE ONE PLACE THIS APP BENDS ITS OWN RULE. hooks/haptics.ts says this app
 * has no register in which it tells somebody they got something wrong. A game needs to say
 * so or it teaches nothing — but it says it about the THOUGHT, never about the player, and
 * it says it silently. No error haptic, no red, no buzz. The only touch feedback here is on
 * a correct catch. */

type Phase = 'intro' | 'intercept' | 'next' | 'done';

/** How long a thought takes to cross the field. Slow enough to read a short sentence twice,
 *  fast enough that hesitating costs something. */
const RISE_MS = 5400;
/** Gap between thoughts entering. Two on screen at once, never five. */
const SPAWN_MS = 1250;

interface Live {
  key: string;
  thought: CurveballThought;
  lane: -1 | 0 | 1;
  anim: Animated.Value;
  /** Phase offset so two wobbling thoughts never wobble in lockstep. */
  phase: number;
  status: 'live' | 'caught' | 'through';
}

interface Tally {
  /** Distorted, intercepted. The hit. */
  caught: number;
  /** Balanced, correctly let past. Half the skill and the half people forget. */
  allowed: number;
  /** Distorted, let past. */
  missed: number;
  /** Balanced, intercepted. The false alarm — the failure mode that matters most, because a
   *  player who taps everything is rehearsing that every thought they have is suspect. */
  falseAlarm: number;
  /** Actions chosen that proceeded on what the character actually knew. Counted for the
   *  ending's sentence and never shown as a score. */
  went: number;
  /** Scenes where an action was chosen at all. */
  decided: number;
}

const ZERO: Tally = { caught: 0, allowed: 0, missed: 0, falseAlarm: 0, went: 0, decided: 0 };

export default function Curveball() {
  const router = useRouter();
  const c = useTheme();
  const reduced = useReducedMotion();
  const logPractice = useStore((s) => s.logPractice);

  /* Chosen once per mount. Re-shuffling between scenes would let the same scene reappear
     inside one session. */
  const scenes = useMemo<CurveballScene[]>(() => sessionScenes(), []);

  const [clock, setClock] = useState(true);
  const [phase, setPhase] = useState<Phase>('intro');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [tally, setTally] = useState<Tally>(ZERO);
  /* Held apart from the tally so no arithmetic can start treating a pass as a judgement. */
  const [passed, setPassed] = useState(0);

  const scene = scenes[sceneIndex];

  /* The ground belongs to the SCENE, and it is drawn once here rather than inside each
     phase, so that naming and reframing a thought happen in the same room the thought
     arrived in. Before the intro is played it is the first scene's ground, which is why
     starting a session already feels like somewhere.

     `groundFor` picks by palette: each mood names a pale ramp and a deep one, and the light
     palette must never be handed a deep ramp — dark ink on `emberDeep` is unreadable, and
     that is a contrast failure rather than a taste one. lib/motif.ts holds the pairs and
     __tests__/motif.test.mjs holds them to it. */
  const ground = groundFor(scene.mood, c.isDark);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* `style={absoluteFill}` and `scrim={false}` are both load-bearing and both were
          missing first time round. Atmosphere does not position itself: without the fill it
          is an ordinary flex child at the top of this column and collapses to nothing, which
          is why the scene grounds did not appear at all. And its scrim darkens the lower
          half for screens that set white type straight onto the artwork — this one sets
          palette ink on it, so the scrim would just muddy the ramp. Ground does exactly the
          same two things for the same two reasons. */}
      <Atmosphere
        variant={ground}
        rounded="none"
        scrim={false}
        style={StyleSheet.absoluteFill as never}
      />
      {/* `insetTop` clears the header. The back button and the step pips sit up there, and
          the pips are the only thing on this screen reporting state — decoration running
          through them is decoration on the one element that has a job. */}
      <Motif
        kind={scene.motif}
        seed={scene.id}
        color={c.ink}
        isDark={c.isDark}
        insetTop={110}
      />
      {phase === 'intro' && (
        <Intro
          clock={clock}
          onClock={setClock}
          onStart={() => setPhase('intercept')}
          onBack={() => router.back()}
        />
      )}

      {phase === 'intercept' && (
        <Intercept
          key={scene.id}
          scene={scene}
          clock={clock}
          reduced={reduced}
          index={sceneIndex}
          total={scenes.length}
          onBack={() => router.back()}
          onPass={() => {
            /* Straight to the next scene. No name phase, no reframe, nothing added to the
               tally, no record that it happened beyond the count the ending reports once. */
            setPassed((n) => n + 1);
            if (sceneIndex + 1 < scenes.length) setSceneIndex(sceneIndex + 1);
            else {
              logPractice('curveball');
              setPhase('done');
            }
          }}
          onDone={(round) => {
            setTally((p) => ({
              ...p,
              caught: p.caught + round.caught,
              allowed: p.allowed + round.allowed,
              missed: p.missed + round.missed,
              falseAlarm: p.falseAlarm + round.falseAlarm,
            }));
            setPhase('next');
          }}
        />
      )}

      {phase === 'next' && (
        <WhatNext
          key={`${scene.id}-next`}
          scene={scene}
          onBack={() => router.back()}
          onDone={(action) => {
            setTally((p) => ({
              ...p,
              went: p.went + (action.checks ? 1 : 0),
              decided: p.decided + 1,
            }));
            if (sceneIndex + 1 < scenes.length) {
              setSceneIndex(sceneIndex + 1);
              setPhase('intercept');
            } else {
              logPractice('curveball');
              setPhase('done');
            }
          }}
        />
      )}

      {phase === 'done' && (
        <Done tally={tally} passed={passed} scenes={scenes.length} ground={ground} onDone={() => router.back()} />
      )}
    </View>
  );
}

/* ---------- the transparent stage every phase stands on ----------
 *
 * THIS EXISTS BECAUSE OF A REAL DEFECT, and it is worth naming precisely because the bug
 * was invisible in the sense that everything looked fine. The first version of this screen
 * drew `<Atmosphere />` at the root and then rendered each phase inside `Screen`, which
 * paints `backgroundColor: c.bg` across the full frame. So the atmosphere was constructed,
 * laid out, rasterised — twelve seeded ellipses and a turbulence layer — and then covered
 * completely by an opaque rectangle on every single frame. The screenshots looked like a
 * flat pale field because that is exactly what they were.
 *
 * `Screen` is right for the rest of the app, where the ground is the app's ground. It is
 * wrong here, where the ground is the scene's. This is the same layout with nothing painted
 * behind it, so the atmosphere and the motif show through. */

function Stage({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View
      style={{
        flex: scroll ? undefined : 1,
        width: '100%',
        maxWidth: LAYOUT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: space.lg,
      }}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={{ flex: 1, paddingTop: insets.top }}>{inner}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + space.xl }}
    >
      {inner}
    </ScrollView>
  );
}

/* ---------- intro ---------- */

function Intro({
  clock, onClock, onStart, onBack,
}: { clock: boolean; onClock: (v: boolean) => void; onStart: () => void; onBack: () => void }) {
  const c = useTheme();
  return (
    <Stage>
      <TopBar onBack={onBack} title="Curveball" />
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
        <View style={{ gap: space.md }}>
          <H2>Three people, and the hour before.</H2>
          <Body>
            Someone is about to do a hard thing, and their thoughts arrive first. Tap the
            ones they cannot check. Let the ones that hold up go past.
          </Body>
          <BodySm>
            Letting the fair ones through is half of it — some of what they think is simply
            true, and telling which is which is the whole skill.
            {'\n\n'}
            The situations are ordinary ones: a message not sent, a room about to be walked
            into, a partner gone quiet. Any of them can be left where it is.
          </BodySm>
        </View>

        <View style={{ gap: space.sm }}>
          <Caption>Pace</Caption>
          <Segmented
            value={clock ? 'timed' : 'open'}
            onChange={(v) => onClock(v === 'timed')}
            options={[
              { key: 'timed', label: 'Timed' },
              { key: 'open', label: 'No clock' },
            ]}
          />
          <Caption>
            {clock
              ? 'Thoughts move. This is closer to how they actually arrive.'
              : 'Nothing moves. Sort them at whatever pace you like.'}
          </Caption>
        </View>

        <Button label="Start" onPress={onStart} />
        <Caption style={{ textAlign: 'center', color: c.inkFaint }}>
          About ninety seconds.
        </Caption>
      </View>
    </Stage>
  );
}

/* ---------- phase one: intercept ---------- */

function Intercept({
  scene, clock, reduced, index, total, onBack, onPass, onDone,
}: {
  scene: CurveballScene;
  clock: boolean;
  reduced: boolean;
  index: number;
  total: number;
  onBack: () => void;
  onPass: () => void;
  onDone: (t: Pick<Tally, 'caught' | 'allowed' | 'missed' | 'falseAlarm'>) => void;
}) {
  const c = useTheme();
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [live, setLive] = useState<Live[]>([]);
  const [judged, setJudged] = useState<Record<string, 'hit' | 'slip'>>({});

  /* Timers and animations started here have to be stoppable from the cleanup, or leaving the
     screen mid-scene keeps a chain of setTimeouts alive that calls setState on an unmounted
     tree. Kept in a ref rather than state because nothing renders from them. */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);

  const lanes: (-1 | 0 | 1)[] = [-1, 1, 0, -1, 1, 0];

  /* The whole scene's thoughts, in the order they will arrive. The order is fixed rather
     than shuffled: each scene is written so the balanced thoughts are not all bunched at the
     end, and shuffling would undo that. */
  const items = scene.thoughts;

  const finish = useCallback(
    (rows: Live[]) => {
      if (done.current) return;
      done.current = true;
      let caught = 0, allowed = 0, missed = 0, falseAlarm = 0;
      for (const r of rows) {
        const bent = r.thought.distortion !== null;
        if (r.status === 'caught') bent ? caught++ : falseAlarm++;
        else bent ? missed++ : allowed++;
      }
      onDone({ caught, allowed, missed, falseAlarm });
    },
    [onDone],
  );

  /* Timed mode: spawn on a chain, each thought animating from the bottom edge to the top. */
  useEffect(() => {
    if (!clock || !height) return;
    const rows: Live[] = items.map((thought, i) => ({
      key: `${scene.id}-${i}`,
      thought,
      lane: lanes[i % lanes.length],
      anim: new Animated.Value(0),
      phase: (i * 1.7) % 6.28,
      status: 'live',
    }));
    setLive(rows);

    rows.forEach((row, i) => {
      timers.current.push(
        setTimeout(() => {
          Animated.timing(row.anim, {
            toValue: 1,
            duration: RISE_MS,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished) return;
            /* Reached the top untouched. Mutating `status` on the row object rather than
               through setState is deliberate: `finish` reads these rows directly, and a
               state update racing six animation callbacks would score the last one twice. */
            if (row.status === 'live') row.status = 'through';
            if (i === rows.length - 1) {
              timers.current.push(setTimeout(() => finish(rows), 260));
            }
          });
        }, i * SPAWN_MS),
      );
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      rows.forEach((r) => r.anim.stopAnimation());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, height, scene.id]);

  /* Open mode: everything present at once, nothing moving. */
  useEffect(() => {
    if (clock) return;
    setLive(
      items.map((thought, i) => ({
        key: `${scene.id}-${i}`,
        thought,
        lane: 0,
        anim: new Animated.Value(0),
        phase: 0,
        status: 'live',
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, scene.id]);

  const tap = (row: Live) => {
    if (row.status !== 'live') return;
    row.status = 'caught';
    row.anim.stopAnimation();
    const bent = row.thought.distortion !== null;
    /* Rule from hooks/haptics.ts: feedback marks what the player did, never a correction.
       So the correct catch taps and the false alarm says nothing. */
    if (bent) haptic.select();
    setJudged((p) => ({ ...p, [row.key]: bent ? 'hit' : 'slip' }));
  };

  const remaining = live.filter((r) => r.status === 'live').length;

  return (
    <Stage>
      {/* The step pips do NOT go in TopBar's `right` slot, and they do not go inline beside
          a caption either. Both were tried in the browser and both rendered nothing: the
          root layout floats the Support pill over the top-right corner of every screen, so
          the `right` slot is drawn underneath it, and `Steps` lays its pips out with
          `flex: 1`, which collapses to zero width in a row that has no width to give. It is
          a full-width bar by design, so it gets its own line — the same way checkin.tsx and
          journal.tsx use it, with a zero-based `current`. */}
      <TopBar onBack={onBack} />
      <Steps total={total} current={index} />

      <View style={{ gap: space.xs, paddingTop: space.lg, paddingBottom: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Caption>{scene.who}, in a minute</Caption>
          {/* THE WAY OUT, AND IT SITS HERE FOR A REASON.
              Toward has had one since it shipped, and the rationale written there names two
              scenes as the cause — a partner gone quiet, and an appointment somebody has been
              avoiding. Curveball contains that same partner scene, plus the midnight one, and
              had no exit at all. It is worse here than it would be there, because Toward
              waits for you and this does not: once the intercept starts, sentences keep
              rising at somebody who has frozen on the first line.
              So the pass is offered next to the situation, before a single thought has
              spawned, and stays reachable while they rise. A pass counts as nothing — see
              content/toward.ts for why that is the whole point. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${PASS_LABEL}. Skip this situation.`}
            onPress={onPass}
            hitSlop={10}
          >
            <Text style={[t.label, { color: c.inkFaint }]}>{PASS_LABEL}</Text>
          </Pressable>
        </View>
        <Body>{scene.scene}</Body>
      </View>

      <View
        /* `overflow: hidden` is not tidiness. The rising thoughts are absolutely positioned
           inside this view and travel past its top edge, and without a clip they ride up
           over the situation line and sit on top of it — two sentences overlapping in the
           same 40 points, one of them the one the player is meant to be reasoning about. */
        style={{ flex: 1, overflow: 'hidden' }}
        onLayout={(e) => {
          setHeight(e.nativeEvent.layout.height);
          setWidth(e.nativeEvent.layout.width);
        }}
      >
        {clock
          ? live.map((row) => (
              <RisingThought
                key={row.key}
                row={row}
                height={height}
                width={width}
                reduced={reduced}
                mark={judged[row.key]}
                onPress={() => tap(row)}
              />
            ))
          : (
            /* SCROLLS, AND SITS AT THE TOP.
               Two fixes in one view. It was centred inside `flex: 1`, which on a 852pt frame
               left about 140pt of nothing above the stack and 140 below — so the situation
               and the thoughts about it read as two unrelated blocks when they are one, and
               that void was the largest uninterrupted area of wallpaper on the screen, which
               is most of why the motif read as loud. Top-aligned, they are one column.
               And it scrolls. At iOS accessibility text sizes six pills plus a two-line
               situation exceed the field, and the parent's `overflow: hidden` — which timed
               mode genuinely needs — was clipping them at the top and bottom at once with no
               indication anything was missing. */
            <ScrollView
              contentContainerStyle={{ gap: space.sm, paddingTop: space.sm, paddingBottom: space.lg }}
              showsVerticalScrollIndicator={false}
            >
              {live.map((row) => (
                <StillThought
                  key={row.key}
                  row={row}
                  mark={judged[row.key]}
                  onPress={() => tap(row)}
                />
              ))}
            </ScrollView>
          )}
      </View>

      {!clock && (
        /* The terminal action must not look like a seventh thought.
           It was `Button variant="secondary"` — same `surfaceStrong` fill as an untapped
           pill, same `radius.pill`, and a fainter border than the pills have. On a screen
           where tapping a pill means "this thought is distorted", a submit control that is
           visually the same object invites a mis-tap that ends the round. It now sits on a
           solid bar with a hairline above it, which reads as chrome rather than as content. */
        <View
          style={{
            paddingTop: space.md,
            paddingBottom: space.lg,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.lineStrong,
            backgroundColor: c.surfaceSolid,
            marginHorizontal: -space.lg,
            paddingHorizontal: space.lg,
          }}
        >
          <Button
            label={remaining === live.length ? 'None of them bend' : 'That is all of them'}
            onPress={() => finish(live)}
          />
        </View>
      )}
    </Stage>
  );
}

function RisingThought({
  row, height, width, reduced, mark, onPress,
}: {
  row: Live;
  height: number;
  width: number;
  reduced: boolean;
  mark?: 'hit' | 'slip';
  onPress: () => void;
}) {
  const bent = row.thought.distortion !== null;

  /* Wobble is drawn from the same driver as the travel, so a distorted thought's sway is
     tied to how far up the screen it is rather than to a second timer that can drift out of
     step with it. Reduced motion flattens the sway and keeps the travel: removing the travel
     as well would remove the game.
     The lane offset is folded into the sway's output range rather than composed with
     `Animated.add`, because composing means a second node in the native graph for a value
     that never changes — and it is the shape of thing that quietly falls off the native
     driver and starts crossing the bridge sixty times a second.
     BOTH OFFSETS ARE DERIVED FROM THE MEASURED WIDTH, NOT PICKED. They started as the
     prototype's fixed pixel values, and on a 393pt phone a left-lane distorted thought
     travelled far enough off the edge to lose its first word — visible in the browser, and
     it would have been the first thing a player saw. `room` is the horizontal space the
     pill genuinely has, and nothing is allowed to exceed it. Where `room` collapses to zero
     on a very narrow screen the tilt survives on its own, so the tell never depends on the
     sway alone. */
  const pillMax = Math.min(280, width * 0.72);
  const room = Math.max(0, (width - pillMax) / 2 - 4);
  const laneX = row.lane * room * 0.7;
  const sway = bent && !reduced ? room * 0.3 : 0;

  const translateY = row.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, -70],
  });
  const translateX = row.anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [laneX, laneX + sway, laneX - sway, laneX + sway, laneX],
  });
  /* THE TELL HAS TO SURVIVE REDUCE MOTION, and it did not.
     With the accessibility setting on, `sway` went to zero and every entry of this output
     range went to '0deg' — so a distorted pill and a balanced one were pixel-identical
     while the intro carried on promising that "the distorted ones wobble on the way up".
     The game was not degraded for those players. It was unplayable, and the comment above
     reasoned about exactly this and still got it wrong: flattening the sway does not soften
     the tell, it removes it, and the tell is the game.
     The fix is that a STATIC tilt is not motion. Reduce Motion asks for nothing that
     animates; an element sitting at a fixed angle triggers nothing vestibular. So distorted
     thoughts still lean — they just stop swaying about it. */
  const lean = bent ? (reduced ? '2.4deg' : null) : '0deg';
  const rotate = lean
    ? lean
    : row.anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '2.4deg', '-2.4deg', '2.4deg', '0deg'],
      });

  return (
    <Animated.View
      pointerEvents={mark ? 'none' : 'auto'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        transform: [{ translateY }, { translateX }, { rotate }],
        opacity: mark ? 0.55 : 1,
      }}
    >
      <ThoughtPill
        text={row.thought.text}
        pattern={row.thought.distortion}
        mark={mark}
        onPress={onPress}
        maxWidth={pillMax}
      />
    </Animated.View>
  );
}

function StillThought({
  row, mark, onPress,
}: { row: Live; mark?: 'hit' | 'slip'; onPress: () => void }) {
  return (
    <View style={{ opacity: mark ? 0.62 : 1 }}>
      <ThoughtPill
        text={row.thought.text}
        pattern={row.thought.distortion}
        mark={mark}
        onPress={onPress}
        stretch
      />
    </View>
  );
}

function ThoughtPill({
  text, pattern, mark, onPress, stretch, maxWidth,
}: {
  text: string;
  /** The distortion this thought is an instance of, or null. Appears once it has been
   *  caught, in small type, as a statement. This is what replaced the naming quiz: the
   *  vocabulary is still taught, the player is just no longer examined on it. */
  pattern?: string | null;
  mark?: 'hit' | 'slip';
  onPress: () => void;
  stretch?: boolean;
  maxWidth?: number;
}) {
  const c = useTheme();
  /* `hit` and `slip` are both just "you tapped this" states. Neither is coloured as an
     error — see the note at the top of the file. The difference is carried by the tick and
     the arrow, not by red and green. */
  const border = mark === 'hit' ? c.accent : mark === 'slip' ? c.cool : c.lineStrong;

  /* THE PILL IS OPAQUE, AND IT HAS TO BE. It used `c.surfaceStrong`, which is 0.90 alpha on
     the light palette and 0.17 on the dark one — so in dark mode 83% of whatever was behind
     it came through, and once each scene had a wallpaper that meant motif strokes running
     across the sentences. Measured on the tender scene's brightest ramp stop, body ink over
     that pill was 4.36:1 clean and 3.65:1 where a glyph crossed it, against a 4.5 floor for
     15px type. This is the one element on this screen that must be readable; it should not
     have been sharing a token with decorative frost.
     `hit` and `slip` are both just "you tapped this" states, composited over the solid so
     they stay opaque too. Neither is coloured as an error — see the note at the top of the
     file. The difference is carried by the tick and the arrow, not by red and green. */
  const fill = mark === 'hit' ? c.accentDim : mark === 'slip' ? c.coolDim : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Tap if this thought is distorted"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.surfaceSolid,
        borderColor: border,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderRadius: radius.pill,
        paddingVertical: 13,
        paddingHorizontal: space.lg,
        maxWidth: stretch ? undefined : maxWidth ?? 280,
        alignSelf: stretch ? 'stretch' : 'center',
        opacity: pressed ? 0.88 : 1,
        minHeight: 48,
        justifyContent: 'center',
      })}
    >
      {/* The tapped tint, over the solid rather than instead of it. */}
      {fill && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: fill, borderRadius: radius.pill }]}
        />
      )}
      {/* `t.body`, not `t.bodySm`. This is the game's primary read — a sentence somebody has
          about five seconds to parse while it moves — and it was set at the second-smallest
          rung on the type ladder. */}
      <Text style={[t.body, { color: c.ink, textAlign: stretch ? 'left' : 'center' }]}>
        {mark === 'hit' ? '✓  ' : mark === 'slip' ? '→  ' : ''}
        {text}
      </Text>
      {mark === 'hit' && pattern && (
        <Text
          style={[t.caption, { color: c.inkFaint, textAlign: stretch ? 'left' : 'center', paddingTop: 2 }]}
        >
          {pattern}
        </Text>
      )}
    </Pressable>
  );
}

/* ---------- phase two: what they do next ----------
 *
 * This replaces two screens: a naming quiz and a reframe answer key. Both are gone for
 * reasons in docs/DIRECTION.md §10, and the short version is that neither was doing the work
 * it looked like it was doing.
 *
 * The three options are ACTIONS, and exactly one of them proceeds on what the character
 * actually knows. That one is never marked. There is no tick, no score, no "correct" — the
 * player picks, and then reads what happens. A consequence teaches; a verdict just tells
 * somebody they were graded on a guess about a fictional person's evening.
 *
 * Why actions rather than reframes at all: choosing what somebody does is behavioural
 * activation, which the component analyses find adds something on top of the rest of a CBT
 * package. Choosing the most accurate rewording of a thought is cognitive restructuring,
 * which the same analyses find probably does not. Same screen, better-supported mechanism. */

function WhatNext({
  scene, onBack, onDone,
}: {
  scene: CurveballScene;
  onBack: () => void;
  onDone: (a: NextAction) => void;
}) {
  const c = useTheme();
  const options = useMemo(() => actionsFor(scene), [scene.id]);
  const [picked, setPicked] = useState<NextAction | null>(null);

  return (
    <Stage scroll={picked !== null}>
      <TopBar onBack={onBack} />
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl, paddingVertical: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Caption>{scene.who}</Caption>
          <H2>What does {scene.who} do?</H2>
        </View>

        <View style={{ gap: space.sm }}>
          {options.map((o) => {
            const isPick = picked?.text === o.text;
            const revealed = picked !== null;
            if (revealed && !isPick) return null;
            return (
              <Pressable
                key={o.text}
                accessibilityRole="button"
                disabled={revealed}
                onPress={() => {
                  setPicked(o);
                  /* Feedback marks that a choice was made, never which choice. Both a
                     careful action and an avoidant one get the same tap, because both are
                     things a person does and neither is the player being right. */
                  haptic.select();
                }}
                style={{
                  backgroundColor: c.surfaceSolid,
                  borderColor: isPick ? c.accent : c.line,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderRadius: radius.md,
                  padding: space.lg,
                  gap: space.sm,
                }}
              >
                <Text style={[t.body, { color: c.ink }]}>{o.text}</Text>
                {isPick && (
                  <>
                    <Text style={[t.label, { color: c.inkFaint }]}>What happens</Text>
                    <Text style={[t.bodySm, { color: c.inkSoft }]}>{o.outcome}</Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        {picked && <Button label="Next" onPress={() => onDone(picked)} />}
      </View>
    </Stage>
  );
}

/* ---------- the end of a session ---------- */

function Done({
  tally, passed, scenes, ground, onDone,
}: { tally: Tally; passed: number; scenes: number; ground: AtmosphereKey; onDone: () => void }) {
  const played = tally.caught + tally.allowed + tally.missed + tally.falseAlarm;

  /* The headline is about the discrimination, never a score — and specifically about the
     false alarms, because somebody who tapped everything ends with a high catch count and
     has learned the wrong lesson. That case gets named rather than congratulated, and it is
     the one branch here that is load-bearing.
     The wording used to open "You caught almost everything, including the fair ones", which
     reads as a correction the moment somebody is already feeling got at. Same information,
     no finger. */
  const headline =
    played === 0
      ? 'You left them all where they were.'
      : tally.falseAlarm > tally.caught
        ? 'A lot of those were fair ones.'
        : tally.falseAlarm === 0 && tally.missed === 0
          ? 'You let every fair thought through.'
          : 'You told them apart.';

  const body =
    played === 0
      ? 'That is a fine way to spend it. They will be here another day.'
      : tally.falseAlarm > tally.caught
        ? 'Some of those thoughts held up. Telling which is the skill — not suspecting all of them, which is the thing most of us already do without practising.'
        : `${tally.allowed} fair thoughts let through, ${tally.caught} bent ones caught.`;

  /* WHO IS NEXT, BY NAME, AND WHY THAT LINE IS HERE.
     SPARX — a well-made CBT game given away free at national scale — was completed by 3.1%
     of the adolescents who registered, and lost half of them between module one and module
     two. Completed units, not sessions started, is what the adherence literature ties to
     outcome. So the cheapest honest thing this screen can do is give a reason to come back
     that is specific rather than a streak: somebody with a name, mid-week, still deciding.
     No points, no counter, no notification. Deci 1999 is clear that a contingent reward
     bolted on here would undermine the thing it was meant to encourage. */
  const upNext = cast()[(scenes + passed) % cast().length];

  return (
    <Finish
      eyebrow={`${scenes} situations`}
      /* NO NUMBER. `pct` used to be handed to Finish as the figure, which renders it as the
         largest element on the screen and counts it up — an accuracy score on somebody's
         mind, animated. The headline was careful and the number under it was not. The count
         that carries meaning is already in `body` as a sentence, and Toward deliberately has
         no score at all; this is the two games agreeing. Finish renders nothing when the
         figure is null. */
      figure={null}
      headline={headline}
      body={body}
      onDone={onDone}
      doneLabel="Done"
      /* The ending stays in the room the last scene was in, rather than cutting to a
         house style. It is also the palette-correct ramp — see groundFor. */
      variant={ground}
    >
      <BodySm style={{ paddingTop: space.lg, textAlign: 'center' }}>
        {upNext} is next time.
      </BodySm>

      {passed > 0 && (
        /* Noticed once, plainly, and never discussed. Same rule as Toward: a pass that gets
           commented on is a pass somebody will not take twice. */
        <BodySm style={{ paddingTop: space.lg, textAlign: 'center' }}>
          {passed === 1 ? 'One you left alone.' : `${passed} you left alone.`}
        </BodySm>
      )}
    </Finish>
  );
}
