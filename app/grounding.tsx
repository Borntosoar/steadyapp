import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Button, H1, H2, H3, Body, BodySm, Caption, useTheme,
} from '../components/ui';
import { Frost, TopBar, Ground, ListRow, type GlyphKind } from '../components/frost';
import { CheckMark } from '../components/Finish';
import { Atmosphere } from '../components/Atmosphere';
import { BreathCircle, QuietCircle } from '../components/BreathCircle';
import {
  space, type as t, LAYOUT_MAX_WIDTH, atmosphereForScheme, type AtmosphereKey,
} from '../constants/theme';
import { useStore } from '../store/useStore';
import { consumeHardDayIntent } from '../hooks/navIntent';
import { setQuietZone } from '../hooks/haptics';
import { SENSES_STEPS, BREATH, WIDENING, VALUES_ANCHOR, HARD_DAY } from '../content/exercises.ts';

/* Free forever, two taps from anywhere, and never gated. See lib/entitlement.ts. */

type Tool = 'menu' | 'senses' | 'breath' | 'widen' | 'values' | 'hardday' | 'sit';

/** Full-frame session surface. Every exercise runs inside one of these rather than
 *  inside a card: an exercise in a card on a screen full of other cards is one more
 *  panel to scan, and each of these is asking for the opposite of scanning. */
function Scene({
  variant,
  children,
  footer,
}: {
  variant: AtmosphereKey;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bgDeep }}>
      <Atmosphere variant={variant} lightX={0.5} rounded="none" scrim={false} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: LAYOUT_MAX_WIDTH,
            alignSelf: 'center',
            paddingTop: insets.top + space.xxxl,
            paddingBottom: insets.bottom + space.xl,
            paddingHorizontal: space.xl,
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>{children}</View>
          {footer}
        </View>
      </Atmosphere>
    </View>
  );
}

const onScene = { color: '#fff' };
const onSceneSoft = { color: 'rgba(255,255,255,0.82)' };

function SceneExit({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ paddingVertical: space.lg, opacity: pressed ? 0.5 : 1 })}
    >
      <Text style={[t.bodySm, { color: 'rgba(255,255,255,0.6)', textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

/* The line each exercise closes on. Short, and about what just happened rather than about
 * what it is for — a explanation here would turn the last two seconds back into reading. */
const CLOSING: Record<string, string> = {
  breath: BREATH.outro,
  senses: 'You brought yourself back into the room.',
  widen: WIDENING.outro,
  values: 'That is the direction. Nothing else is asked.',
};

export default function Grounding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; tool?: string }>();
  const logPractice = useStore((s) => s.logPractice);

  /* Nothing taps at anybody on this screen. The whole point of the calm-down path and the
     hard-day path is that the phone stops asking for things, and a buzz is the phone asking
     for something. Held for the entire visit, not per component, so a shared piece cannot
     reintroduce one by accident. */
  useEffect(() => {
    setQuietZone(true);
    return () => setQuietZone(false);
  }, []);

  /* `?tool=breath` opens one exercise directly.
     Added for the guided tracks: a track day that says "do the breathing" and then drops you
     on a menu of five things has handed the choosing back at the exact moment it was trying
     to take it away. Validated against the Tool union rather than cast, because this comes
     off a URL and a URL is not trusted — an unknown value falls back to the menu. */
  const DIRECT: Tool[] = ['senses', 'breath', 'widen', 'values'];
  const asked = typeof params.tool === 'string' ? params.tool : '';
  const [tool, setTool] = useState<Tool>(
    params.mode === 'hard'
      ? 'hardday'
      : DIRECT.includes(asked as Tool)
        ? (asked as Tool)
        : 'menu',
  );
  const [logged, setLogged] = useState(false);

  /* Whether the hard-day screen may write a record the moment it opens.
   *
   * True when the app navigated here, false when a link did. `anneal://grounding?mode=hard`
   * from any other app, or from a message, used to log a hard-day entry with no interaction
   * at all — fabricating "this person had a bad day" in a record that gets exported to a
   * clinician, and advancing the practice-day count that gates the exposure work.
   *
   * Read once, on mount, and deliberately not in a dependency array: consuming it twice
   * would return false the second time and silently disable the in-app path. */
  const [mayAutoLog] = useState(() => params.mode !== 'hard' || consumeHardDayIntent());
  /* Which exercises were finished in this visit. Drives the check on the menu row — the
     menu used to look identical before and after, which is most of why finishing one felt
     like nothing had happened. */
  const [doneTools, setDoneTools] = useState<Tool[]>([]);
  const [closing, setClosing] = useState<Tool | null>(null);

  const complete = (kind: 'grounding' | 'hard-day' = 'grounding') => {
    if (!logged) {
      logPractice(kind);
      setLogged(true);
    }
  };

  /* Every exercise now ends on the same two-and-a-bit seconds: the scene fades to a single
     mark and one line, then returns by itself. Before this, four of them ended by silently
     swapping back to the menu. */
  const finish = (which: Tool) => {
    complete();
    setDoneTools((d) => (d.includes(which) ? d : [...d, which]));
    setClosing(which);
  };

  if (closing) {
    return (
      <SceneClose
        line={CLOSING[closing] ?? 'Done.'}
        onEnd={() => {
          setClosing(null);
          setTool('menu');
        }}
      />
    );
  }

  if (tool === 'menu') return <Menu onPick={setTool} onBack={() => router.back()} done={doneTools} />;
  if (tool === 'hardday') return <HardDay onPick={setTool} complete={complete} autoLog={mayAutoLog} />;
  if (tool === 'sit') return <Sit onDone={() => { complete('hard-day'); setTool('hardday'); }} />;
  if (tool === 'senses') return <Senses onDone={() => finish('senses')} onExit={() => setTool('menu')} />;
  if (tool === 'breath') return <Breath onDone={complete} onFinish={() => finish('breath')} onExit={() => setTool('menu')} />;
  if (tool === 'widen') return <Widening onDone={() => finish('widen')} onExit={() => setTool('menu')} />;
  return <Values onDone={() => finish('values')} onExit={() => setTool('menu')} />;
}

/* ---------- the closing beat ----------
 *
 * Two and a bit seconds, no button. A button here would ask for one more decision from
 * somebody who has just spent three minutes deliberately not making decisions. */

function SceneClose({ line, onEnd }: { line: string; onEnd: () => void }) {
  useEffect(() => {
    const id = setTimeout(onEnd, 2400);
    return () => clearTimeout(id);
  }, [onEnd]);

  return (
    <Scene variant="grove">
      <View style={{ alignItems: 'center' }}>
        <CheckMark size={96} color="rgba(255,255,255,0.92)" />
        <Text style={[t.h2, onScene, { marginTop: space.xl, textAlign: 'center', lineHeight: 31 }]}>
          {line}
        </Text>
      </View>
    </Scene>
  );
}

/* ---------- menu ---------- */

function Menu({ onPick, onBack, done }: { onPick: (t: Tool) => void; onBack: () => void; done: Tool[] }) {
  const c = useTheme();
  const items: { k: Tool; title: string; sub: string; glyph: GlyphKind }[] = [
    { k: 'breath', title: 'Slow your breathing', sub: 'About eighty seconds', glyph: 'rings' },
    { k: 'senses', title: 'Name five things', sub: 'Three minutes. No timer, no rush', glyph: 'senses' },
    { k: 'widen', title: 'Widen your attention', sub: 'One minute', glyph: 'wave' },
    { k: 'values', title: 'Remember what matters', sub: 'Ninety seconds. Three questions', glyph: 'anchor' },
  ];

  return (
    <Ground>
      <TopBar onBack={onBack} />

      <H1 style={{ marginTop: space.lg }}>Calm down</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>
        Free, always. You never have to pay for any of these. Any one of them counts as
        showing up today.
      </BodySm>

      <Frost>
        {items.map((x, i) => (
          <ListRow
            key={x.k}
            glyph={x.glyph}
            title={x.title}
            sub={x.sub}
            done={done.includes(x.k)}
            first={i === 0}
            onPress={() => onPick(x.k)}
          />
        ))}
      </Frost>

      <Pressable
        accessibilityRole="button"
        onPress={() => onPick('hardday')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          marginTop: space.md,
          paddingVertical: space.lg,
          paddingHorizontal: space.lg,
          borderRadius: 24,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.warn,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.warn }} />
        <View style={{ flex: 1 }}>
          <Body style={{ color: c.ink }}>Today is a hard day</Body>
          <Caption>Nothing is asked of you. Opening this counts.</Caption>
        </View>
        <Caption>›</Caption>
      </Pressable>
    </Ground>
  );
}

/* ---------- hard day ---------- */

function HardDay({
  onPick,
  complete,
  autoLog,
}: {
  onPick: (t: Tool) => void;
  complete: (k?: 'hard-day') => void;
  /** False when a link opened this screen rather than the app. See hooks/navIntent.ts. */
  autoLog: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* Showing up on a hard day is logged the moment the screen opens. It is the single most
     clinically valuable thing someone can do on a bad day, so it must not depend on them
     completing anything afterwards.
     Unless a link opened it, in which case nobody has shown up yet and there is nothing
     true to record. The screen still renders in full — somebody who arrived here from a
     message deserves the help exactly as much — it simply waits for them to touch something
     before it writes anything down. */
  useEffect(() => {
    if (autoLog) complete('hard-day');
  }, [complete, autoLog]);

  /** Every route out of this screen goes through here, so the deep-link arrival is recorded
   *  the moment the person actually does something rather than never. */
  const pick = (t: Tool) => {
    if (!autoLog) complete('hard-day');
    onPick(t);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#05080A' }}>
      <Atmosphere variant="night" lightX={0.42} rounded="none" scrim={false} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flex: 1,
              width: '100%',
              maxWidth: LAYOUT_MAX_WIDTH,
              paddingTop: insets.top + space.xxxl,
              paddingBottom: insets.bottom + space.xl,
              paddingHorizontal: space.xl,
              justifyContent: 'center',
            }}
          >
            <Text style={[t.display, onScene]}>{HARD_DAY.opening}</Text>

            <View style={{ marginTop: space.xxl }}>
              {HARD_DAY.options.map((o) => (
                <Button
                  key={o.key}
                  label={o.label}
                  variant={o.key === 'talk' ? 'secondary' : 'primary'}
                  onPress={() => {
                    if (o.key === 'breathe') pick('breath');
                    else if (o.key === 'ground') pick('senses');
                    else if (o.key === 'sit') pick('sit');
                    else router.push('/support');
                  }}
                  style={{ marginBottom: space.sm }}
                />
              ))}
            </View>

            <Text style={[t.body, onSceneSoft, { marginTop: space.xxl }]}>{HARD_DAY.close}</Text>

            <SceneExit label="Home" onPress={() => router.replace('/')} />
          </View>
        </ScrollView>
      </Atmosphere>
    </View>
  );
}

/** Two minutes of nothing being asked. The only text is at the midpoint. */
function Sit({ onDone }: { onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (elapsed >= HARD_DAY.sit.totalSeconds) onDone();
  }, [elapsed, onDone]);

  const showMid = elapsed >= HARD_DAY.sit.midpoint.at! && elapsed < HARD_DAY.sit.midpoint.at! + 12;

  return (
    <Scene variant="night" footer={<SceneExit label="Finish" onPress={onDone} />}>
      <View style={{ alignItems: 'center' }}>
        <QuietCircle tone="light" />
        <View style={{ minHeight: 44, marginTop: space.xxl, justifyContent: 'center' }}>
          {showMid ? <Text style={[t.h2, onScene]}>{HARD_DAY.sit.midpoint.text}</Text> : null}
        </View>
      </View>
    </Scene>
  );
}

/* ---------- 5-4-3-2-1 ---------- */

function Senses({ onDone, onExit }: { onDone: () => void; onExit: () => void }) {
  const [i, setI] = useState(0);
  const step = SENSES_STEPS[i];
  const last = i === SENSES_STEPS.length - 1;

  return (
    <Scene
      variant="night"
      footer={
        <>
          <Button label={last ? 'Finish' : 'Next'} onPress={() => (last ? onDone() : setI(i + 1))} />
          <SceneExit label="Leave" onPress={onExit} />
        </>
      }
    >
      {step.count !== null ? (
        <Text style={[t.hero, { color: 'rgba(255,255,255,0.9)' }]}>{step.count}</Text>
      ) : null}
      <Text style={[t.display, onScene, { marginTop: space.sm }]}>{step.title}</Text>
      <Text style={[t.body, onSceneSoft, { marginTop: space.lg, fontSize: 18, lineHeight: 27 }]}>
        {step.text}
      </Text>
    </Scene>
  );
}

/* ---------- breathing ---------- */

function Breath({
  onDone,
  onFinish,
  onExit,
}: {
  onDone: () => void;
  onFinish: () => void;
  onExit: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!started) {
    return (
      <Scene
        variant="grove"
        footer={
          <>
            <Button label="Start" onPress={() => setStarted(true)} />
            <SceneExit label="Leave" onPress={onExit} />
          </>
        }
      >
        <Text style={[t.display, onScene]}>4-7-8 breathing</Text>
        <Text style={[t.body, onSceneSoft, { marginTop: space.lg, fontSize: 18, lineHeight: 27 }]}>
          {BREATH.intro}
        </Text>
      </Scene>
    );
  }

  return (
    <Scene
      variant="grove"
      footer={
        finished ? (
          <Button label="Done" onPress={onFinish} />
        ) : (
          <SceneExit label="Leave" onPress={onExit} />
        )
      }
    >
      <View style={{ alignItems: 'center' }}>
        <BreathCircle
          tone="light"
          onDone={() => {
            setFinished(true);
            onDone();
          }}
        />
        {finished && (
          <Text style={[t.body, onSceneSoft, { marginTop: space.xl, textAlign: 'center' }]}>
            Four cycles done.
          </Text>
        )}
      </View>
    </Scene>
  );
}

/* ---------- attention widening ---------- */

function Widening({ onDone, onExit }: { onDone: () => void; onExit: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const done = elapsed >= WIDENING.totalSeconds;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  const current = [...WIDENING.steps].reverse().find((s) => elapsed >= (s.at ?? 0));

  return (
    <Scene
      variant="grove"
      footer={
        done ? (
          <Button label="Finish" onPress={onDone} />
        ) : (
          <SceneExit label="Leave" onPress={onExit} />
        )
      }
    >
      {done ? (
        <Text style={[t.h2, onScene]}>{WIDENING.outro}</Text>
      ) : (
        <>
          <Text style={[t.timer, { color: 'rgba(255,255,255,0.9)' }]}>
            {WIDENING.totalSeconds - elapsed}
            <Text style={[t.h2, { color: 'rgba(255,255,255,0.6)' }]}>s</Text>
          </Text>
          <Text style={[t.h2, onScene, { marginTop: space.xl, lineHeight: 31 }]}>{current?.text}</Text>
        </>
      )}
    </Scene>
  );
}

/* ---------- values anchor ---------- */

function Values({ onDone, onExit }: { onDone: () => void; onExit: () => void }) {
  const [i, setI] = useState(0);
  const last = i === VALUES_ANCHOR.steps.length - 1;
  return (
    <Scene
      variant="night"
      footer={
        <>
          <Button label={last ? 'Finish' : 'Next'} onPress={() => (last ? onDone() : setI(i + 1))} />
          <SceneExit label="Leave" onPress={onExit} />
        </>
      }
    >
      <Text style={[t.caption, { color: 'rgba(255,255,255,0.7)' }]}>
        {i + 1} of {VALUES_ANCHOR.steps.length}
      </Text>
      <Text style={[t.display, onScene, { marginTop: space.sm, lineHeight: 46 }]}>
        {VALUES_ANCHOR.steps[i]}
      </Text>
    </Scene>
  );
}
