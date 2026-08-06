import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, useTheme,
} from '../components/ui';
import { BreathCircle, QuietCircle } from '../components/BreathCircle';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { SENSES_STEPS, BREATH, WIDENING, VALUES_ANCHOR, HARD_DAY } from '../content/exercises.ts';

/* Free forever, two taps from anywhere, and never gated. See lib/entitlement.ts. */

type Tool = 'menu' | 'senses' | 'breath' | 'widen' | 'values' | 'hardday' | 'sit';

export default function Grounding() {
  const c = useTheme();
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

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        {tool === 'senses' && <Senses onDone={() => { complete(); setTool('menu'); }} />}
        {tool === 'breath' && <Breath onDone={() => complete()} />}
        {tool === 'widen' && <Widening onDone={() => { complete(); setTool('menu'); }} />}
        {tool === 'values' && <Values onDone={() => { complete(); setTool('menu'); }} />}
        <Button label="Back" variant="ghost" onPress={() => setTool('menu')} style={{ marginTop: space.md }} />
      </View>
    </Screen>
  );
}

/* ---------- menu ---------- */

function Menu({ onPick, onBack }: { onPick: (t: Tool) => void; onBack: () => void }) {
  const c = useTheme();
  const items: { k: Tool; title: string; sub: string }[] = [
    { k: 'breath', title: '4-7-8 breathing', sub: 'Four cycles, about eighty seconds.' },
    { k: 'senses', title: '5-4-3-2-1', sub: 'Three minutes. No timer, no rush.' },
    { k: 'widen', title: 'Attention widening', sub: 'Sixty seconds of practising the wide view.' },
    { k: 'values', title: 'Values anchor', sub: 'Ninety seconds. Three questions.' },
  ];
  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Grounding</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.lg }}>
          Free, always. Any of these counts as showing up.
        </BodySm>

        {items.map((x) => (
          <Pressable
            key={x.k}
            accessibilityRole="button"
            onPress={() => onPick(x.k)}
            style={({ pressed }) => ({
              backgroundColor: c.surface,
              borderRadius: radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.line,
              padding: space.lg,
              marginBottom: space.sm,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <H3>{x.title}</H3>
            <BodySm style={{ marginTop: 2 }}>{x.sub}</BodySm>
          </Pressable>
        ))}

        <Button label="Back" variant="ghost" onPress={onBack} style={{ marginTop: space.md }} />
      </View>
    </Screen>
  );
}

/* ---------- hard day ---------- */

function HardDay({ onPick, complete }: { onPick: (t: Tool) => void; complete: (k?: 'hard-day') => void }) {
  const c = useTheme();
  const router = useRouter();

  // Showing up on a hard day is logged the moment the screen opens. It is the single
  // most clinically valuable thing someone can do on a bad day, so it must not depend on
  // them completing anything afterwards.
  useEffect(() => {
    complete('hard-day');
  }, [complete]);

  return (
    <Screen>
      <View style={{ marginTop: space.xxxl }}>
        <H1>{HARD_DAY.opening}</H1>

        <View style={{ marginTop: space.xl }}>
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

        <Card tone="accent" style={{ marginTop: space.xl }}>
          <Body>{HARD_DAY.close}</Body>
        </Card>

        <Button label="Home" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

/** Two minutes of nothing being asked. The only text is at the midpoint. */
function Sit({ onDone }: { onDone: () => void }) {
  const c = useTheme();
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
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: space.xxxl }}>
        <QuietCircle />
        <View style={{ height: 40, marginTop: space.xl, justifyContent: 'center' }}>
          {showMid ? <Body style={{ color: c.inkSoft }}>{HARD_DAY.sit.midpoint.text}</Body> : null}
        </View>
        <Pressable onPress={onDone} style={{ marginTop: space.xxl, padding: space.md }}>
          <Caption>Finish</Caption>
        </Pressable>
      </View>
    </Screen>
  );
}

/* ---------- 5-4-3-2-1 ---------- */

function Senses({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const [i, setI] = useState(0);
  const step = SENSES_STEPS[i];
  const last = i === SENSES_STEPS.length - 1;

  return (
    <Card>
      {step.count !== null ? (
        <>
          <Text style={[t.display, { color: c.accentDeep }]}>{step.count}</Text>
          <H2>{step.title}</H2>
        </>
      ) : (
        <H2>{step.title}</H2>
      )}
      <Body style={{ marginTop: space.md, color: c.inkSoft }}>{step.text}</Body>
      <Button
        label={last ? 'Finish' : 'Next'}
        onPress={() => (last ? onDone() : setI(i + 1))}
        style={{ marginTop: space.xl }}
      />
    </Card>
  );
}

/* ---------- breathing ---------- */

function Breath({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!started) {
    return (
      <Card>
        <H2>4-7-8 breathing</H2>
        <Body style={{ marginTop: space.md }}>{BREATH.intro}</Body>
        <Button label="Start" onPress={() => setStarted(true)} style={{ marginTop: space.xl }} />
      </Card>
    );
  }

  return (
    <Card>
      <BreathCircle
        onDone={() => {
          setFinished(true);
          onDone();
        }}
      />
      {finished && <Body style={{ marginTop: space.lg }}>{BREATH.outro}</Body>}
    </Card>
  );
}

/* ---------- attention widening ---------- */

function Widening({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const done = elapsed >= WIDENING.totalSeconds;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  const current = [...WIDENING.steps].reverse().find((s) => elapsed >= (s.at ?? 0));

  return (
    <Card>
      <H2>Attention widening</H2>
      {done ? (
        <>
          <Body style={{ marginTop: space.lg }}>{WIDENING.outro}</Body>
          <Button label="Finish" onPress={onDone} style={{ marginTop: space.xl }} />
        </>
      ) : (
        <>
          <Text style={[t.h1, { color: c.accentDeep, marginTop: space.md }]}>
            {WIDENING.totalSeconds - elapsed}s
          </Text>
          <Body style={{ marginTop: space.md, fontSize: 18, lineHeight: 27 }}>{current?.text}</Body>
        </>
      )}
    </Card>
  );
}

/* ---------- values anchor ---------- */

function Values({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const [i, setI] = useState(0);
  const last = i === VALUES_ANCHOR.steps.length - 1;
  return (
    <Card>
      <H2>Values anchor</H2>
      <Caption style={{ marginTop: space.xs }}>
        {i + 1} of {VALUES_ANCHOR.steps.length}
      </Caption>
      <Body style={{ marginTop: space.lg, fontSize: 18, lineHeight: 27 }}>
        {VALUES_ANCHOR.steps[i]}
      </Body>
      <Button
        label={last ? 'Finish' : 'Next'}
        onPress={() => (last ? onDone() : setI(i + 1))}
        style={{ marginTop: space.xl }}
      />
    </Card>
  );
}
