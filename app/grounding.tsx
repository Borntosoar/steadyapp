import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Button, H1, H2, H3, Body, BodySm, Caption, Rule, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import { BreathCircle, QuietCircle } from '../components/BreathCircle';
import {
  space, type as t, LAYOUT_MAX_WIDTH, type AtmosphereKey,
} from '../constants/theme';
import { useStore } from '../store/useStore';
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

export default function Grounding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const logPractice = useStore((s) => s.logPractice);

  const [tool, setTool] = useState<Tool>(params.mode === 'hard' ? 'hardday' : 'menu');
  const [logged, setLogged] = useState(false);

  const complete = (kind: 'grounding' | 'hard-day' = 'grounding') => {
    if (!logged) {
      logPractice(kind);
      setLogged(true);
    }
  };

  if (tool === 'menu') return <Menu onPick={setTool} onBack={() => router.back()} />;
  if (tool === 'hardday') return <HardDay onPick={setTool} complete={complete} />;
  if (tool === 'sit') return <Sit onDone={() => { complete('hard-day'); setTool('hardday'); }} />;
  if (tool === 'senses') return <Senses onDone={() => { complete(); setTool('menu'); }} onExit={() => setTool('menu')} />;
  if (tool === 'breath') return <Breath onDone={complete} onExit={() => setTool('menu')} />;
  if (tool === 'widen') return <Widening onDone={() => { complete(); setTool('menu'); }} onExit={() => setTool('menu')} />;
  return <Values onDone={() => { complete(); setTool('menu'); }} onExit={() => setTool('menu')} />;
}

/* ---------- menu ---------- */

function Menu({ onPick, onBack }: { onPick: (t: Tool) => void; onBack: () => void }) {
  const c = useTheme();
  const items: { k: Tool; title: string; sub: string; art: AtmosphereKey }[] = [
    { k: 'breath', title: '4-7-8 breathing', sub: 'Four cycles, about eighty seconds', art: 'jade' },
    { k: 'senses', title: '5-4-3-2-1', sub: 'Three minutes. No timer, no rush', art: 'night' },
    { k: 'widen', title: 'Attention widening', sub: 'Sixty seconds of practising the wide view', art: 'day' },
    { k: 'values', title: 'Values anchor', sub: 'Ninety seconds. Three questions', art: 'dawn' },
  ];
  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Grounding</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>
          Free, always, and never behind a week. Any of these counts as showing up.
        </BodySm>

        {items.map((x, i) => (
          <Pressable
            key={x.k}
            accessibilityRole="button"
            accessibilityLabel={`${x.title}, ${x.sub}`}
            onPress={() => onPick(x.k)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.lg,
              paddingVertical: space.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Atmosphere
              variant={x.art}
              lightX={0.3 + i * 0.16}
              rounded="md"
              scrim={false}
              style={{ width: 64, height: 64 }}
            />
            <View style={{ flex: 1 }}>
              <H3>{x.title}</H3>
              <BodySm style={{ marginTop: 2 }}>{x.sub}</BodySm>
            </View>
            <Text style={[t.body, { color: c.inkFaint }]}>›</Text>
          </Pressable>
        ))}

        <View style={{ marginTop: space.xl }}>
          <Rule />
          <Pressable
            accessibilityRole="button"
            onPress={() => onPick('hardday')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              paddingVertical: space.lg,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.warn }} />
            <View style={{ flex: 1 }}>
              <Body style={{ color: c.ink }}>Today is a hard day</Body>
              <Caption>Nothing is required. This still counts as showing up.</Caption>
            </View>
            <Caption>›</Caption>
          </Pressable>
          <Rule />
        </View>

        <Button
          label="Back"
          variant="ghost"
          onPress={onBack}
          style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
        />
      </View>
    </Screen>
  );
}

/* ---------- hard day ---------- */

function HardDay({ onPick, complete }: { onPick: (t: Tool) => void; complete: (k?: 'hard-day') => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Showing up on a hard day is logged the moment the screen opens. It is the single
  // most clinically valuable thing someone can do on a bad day, so it must not depend on
  // them completing anything afterwards.
  useEffect(() => {
    complete('hard-day');
  }, [complete]);

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
                    if (o.key === 'breathe') onPick('breath');
                    else if (o.key === 'ground') onPick('senses');
                    else if (o.key === 'sit') onPick('sit');
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
        <View style={{ height: 44, marginTop: space.xxl, justifyContent: 'center' }}>
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

function Breath({ onDone, onExit }: { onDone: () => void; onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!started) {
    return (
      <Scene
        variant="jade"
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
      variant="jade"
      footer={<SceneExit label={finished ? 'Done' : 'Leave'} onPress={onExit} />}
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
            {BREATH.outro}
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
      variant="day"
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
      variant="dawn"
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
