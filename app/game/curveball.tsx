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
  sessionScenes, nameOptions, reframeTarget,
  type CurveballScene, type CurveballThought,
} from '../../content/curveball.ts';
import { DISTORTIONS } from '../../content/exercises.ts';

/* Curveball — the CBT game.
 *
 * Three phases per scene, four scenes per session, roughly ninety seconds.
 *
 *   1. INTERCEPT. Thoughts rise. Tap the distorted ones; let the balanced ones go past.
 *   2. NAME IT. One of the distorted thoughts comes back. Which distortion was it?
 *   3. REFRAME. Three replacements. One is accurate; the other two are the two failure
 *      modes people actually produce — cheerfulness, and pretending not to care.
 *
 * THE MOTION IS THE TELL, NOT THE COLOUR. Distorted thoughts wobble and tilt; balanced ones
 * travel straight. Colour is never the only channel carrying that difference, which is the
 * plain WCAG 1.4.1 requirement and also just better game design — a colour tell is read
 * peripherally and teaches nothing, while a movement tell makes you look at the sentence.
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

type Phase = 'intro' | 'intercept' | 'name' | 'reframe' | 'done';

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
  named: number;
  reframed: number;
}

const ZERO: Tally = { caught: 0, allowed: 0, missed: 0, falseAlarm: 0, named: 0, reframed: 0 };

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
      <Motif kind={scene.motif} seed={scene.id} color={c.ink} />
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
          onDone={(round) => {
            setTally((p) => ({
              ...p,
              caught: p.caught + round.caught,
              allowed: p.allowed + round.allowed,
              missed: p.missed + round.missed,
              falseAlarm: p.falseAlarm + round.falseAlarm,
            }));
            setPhase('name');
          }}
        />
      )}

      {phase === 'name' && (
        <NameIt
          key={`${scene.id}-name`}
          scene={scene}
          onDone={(right) => {
            setTally((p) => ({ ...p, named: p.named + (right ? 1 : 0) }));
            setPhase('reframe');
          }}
        />
      )}

      {phase === 'reframe' && (
        <Reframe
          key={`${scene.id}-reframe`}
          scene={scene}
          onDone={(right) => {
            setTally((p) => ({ ...p, reframed: p.reframed + (right ? 1 : 0) }));
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
        <Done tally={tally} scenes={scenes.length} ground={ground} onDone={() => router.back()} />
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
          <H2>Catch the ones that bend.</H2>
          <Body>
            Thoughts rise. The distorted ones wobble on the way up. Tap those, and let the
            straight ones go past.
          </Body>
          <BodySm>
            Letting the fair ones through is half of it. Tapping everything is its own kind of
            wrong.
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
  scene, clock, reduced, index, total, onBack, onDone,
}: {
  scene: CurveballScene;
  clock: boolean;
  reduced: boolean;
  index: number;
  total: number;
  onBack: () => void;
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
        <Caption>The situation</Caption>
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
            <View style={{ flex: 1, justifyContent: 'center', gap: space.sm }}>
              {live.map((row) => (
                <StillThought
                  key={row.key}
                  row={row}
                  mark={judged[row.key]}
                  onPress={() => tap(row)}
                />
              ))}
            </View>
          )}
      </View>

      {!clock && (
        <View style={{ paddingBottom: space.lg, gap: space.sm }}>
          <Button
            label={remaining === live.length ? 'None of them bend' : 'That is all of them'}
            onPress={() => finish(live)}
            variant={remaining === live.length ? 'secondary' : 'primary'}
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
  const rotate = row.anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: bent && !reduced
      ? ['0deg', '2.4deg', '-2.4deg', '2.4deg', '0deg']
      : ['0deg', '0deg', '0deg', '0deg', '0deg'],
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
      <ThoughtPill text={row.thought.text} mark={mark} onPress={onPress} maxWidth={pillMax} />
    </Animated.View>
  );
}

function StillThought({
  row, mark, onPress,
}: { row: Live; mark?: 'hit' | 'slip'; onPress: () => void }) {
  return (
    <View style={{ opacity: mark ? 0.62 : 1 }}>
      <ThoughtPill text={row.thought.text} mark={mark} onPress={onPress} stretch />
    </View>
  );
}

function ThoughtPill({
  text, mark, onPress, stretch, maxWidth,
}: {
  text: string;
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
  const fill = mark === 'hit' ? c.accentDim : mark === 'slip' ? c.coolDim : c.surfaceStrong;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Tap if this thought is distorted"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: fill,
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
      <Text style={[t.bodySm, { color: c.ink, textAlign: stretch ? 'left' : 'center' }]}>
        {mark === 'hit' ? '✓  ' : mark === 'slip' ? '→  ' : ''}
        {text}
      </Text>
    </Pressable>
  );
}

/* ---------- phase two: name it ---------- */

function NameIt({ scene, onDone }: { scene: CurveballScene; onDone: (right: boolean) => void }) {
  const c = useTheme();
  const target = reframeTarget(scene);
  const options = useMemo(() => nameOptions(target.distortion as string), [scene.id]);
  const [picked, setPicked] = useState<string | null>(null);

  const right = picked === target.distortion;

  return (
    <Stage>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Caption>One of them again</Caption>
          <Frost>
            <Body>{target.text}</Body>
          </Frost>
          <BodySm>What is it doing?</BodySm>
        </View>

        <View style={{ gap: space.sm }}>
          {options.map((name) => {
            const chosen = picked === name;
            const isTrue = name === target.distortion;
            const reveal = picked !== null;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen }}
                disabled={reveal}
                onPress={() => {
                  setPicked(name);
                  if (name === target.distortion) haptic.select();
                }}
                style={{
                  backgroundColor: reveal && isTrue ? c.accentDim : c.surface,
                  borderColor: reveal && isTrue ? c.accent : chosen ? c.cool : c.line,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderRadius: radius.md,
                  padding: space.lg,
                  minHeight: 52,
                  justifyContent: 'center',
                }}
              >
                <Text style={[t.body, { color: c.ink }]}>{name}</Text>
              </Pressable>
            );
          })}
        </View>

        {picked !== null && (
          <View style={{ gap: space.md }}>
            <BodySm>
              {right
                ? `Yes. ${defOf(target.distortion as string)}`
                : `It is ${target.distortion}. ${defOf(target.distortion as string)}`}
            </BodySm>
            <Button label="Next" onPress={() => onDone(right)} />
          </View>
        )}
      </View>
    </Stage>
  );
}

/* ---------- phase three: reframe ---------- */

function Reframe({ scene, onDone }: { scene: CurveballScene; onDone: (right: boolean) => void }) {
  const c = useTheme();
  const options = scene.reframe.options;
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : options[picked];

  return (
    <Stage scroll={picked !== null}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl, paddingVertical: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Caption>Instead of</Caption>
          <Frost>
            <Body>{scene.reframe.quote}</Body>
          </Frost>
          <BodySm>Which one is actually truer? Not kinder — truer.</BodySm>
        </View>

        <View style={{ gap: space.sm }}>
          {options.map((o, i) => {
            const reveal = picked !== null;
            return (
              <Pressable
                key={o.text}
                accessibilityRole="button"
                disabled={reveal}
                onPress={() => {
                  setPicked(i);
                  if (o.accurate) haptic.select();
                }}
                style={{
                  backgroundColor: reveal && o.accurate ? c.accentDim : c.surface,
                  borderColor: reveal && o.accurate ? c.accent : picked === i ? c.cool : c.line,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderRadius: radius.md,
                  padding: space.lg,
                }}
              >
                <Text style={[t.bodySm, { color: c.ink }]}>{o.text}</Text>
                {reveal && <Text style={[t.caption, { color: c.inkFaint, marginTop: space.sm }]}>{o.why}</Text>}
              </Pressable>
            );
          })}
        </View>

        {chosen && <Button label="Next" onPress={() => onDone(chosen.accurate)} />}
      </View>
    </Stage>
  );
}

/* ---------- the end of a session ---------- */

function Done({
  tally, scenes, ground, onDone,
}: { tally: Tally; scenes: number; ground: AtmosphereKey; onDone: () => void }) {
  const correct = tally.caught + tally.allowed;
  const total = correct + tally.missed + tally.falseAlarm;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  /* The headline is about the discrimination, not the score — and specifically about the
     false alarms, because a player who tapped everything ends with a high catch count and
     has learned the wrong lesson. That case gets named rather than congratulated. */
  const headline =
    tally.falseAlarm > tally.caught
      ? 'You caught almost everything, including the fair ones.'
      : tally.falseAlarm === 0 && tally.missed === 0
        ? 'You let every fair thought through.'
        : 'You told them apart.';

  const body =
    tally.falseAlarm > tally.caught
      ? 'Some of those thoughts were reasonable. Being able to tell which is the skill — not suspecting all of them.'
      : `${tally.allowed} fair thoughts let through, ${tally.caught} bent ones caught.`;

  return (
    <Finish
      eyebrow={`${scenes} situations`}
      figure={pct}
      figureUnit="% sorted right"
      headline={headline}
      body={body}
      onDone={onDone}
      doneLabel="Done"
      /* The ending stays in the room the last scene was in, rather than cutting to a
         house style. It is also the palette-correct ramp — see groundFor. */
      variant={ground}
    />
  );
}

/* ---------- helper ---------- */

/** The definition shown after a name is picked, read from the one live taxonomy rather than
 *  restated here. A name the game uses that the app does not define throws rather than
 *  rendering "undefined" at somebody mid-session — and `__tests__/curveball.test.mjs` makes
 *  that unreachable by checking every name in the content against the same list. */
function defOf(name: string): string {
  const d = DISTORTIONS.find((x) => x.name === name);
  if (!d) throw new Error(`curveball: "${name}" is not in the distortion taxonomy`);
  return d.definition;
}
