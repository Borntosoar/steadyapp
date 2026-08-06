import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, Scale, Row, useTheme,
} from '../components/ui';
import { QuietCircle } from '../components/BreathCircle';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { URGE_SURF } from '../content/exercises.ts';
import { urgesResistedLabel } from '../content/copy.ts';

type Stage = 'home' | 'before' | 'surfing' | 'after';

export default function Urges() {
  const c = useTheme();
  const router = useRouter();
  const urgeLogs = useStore((s) => s.urgeLogs);
  const addUrgeLog = useStore((s) => s.addUrgeLog);

  const [stage, setStage] = useState<Stage>('home');
  const [trigger, setTrigger] = useState('');
  const [wantedTo, setWantedTo] = useState('');
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);

  const resisted = urgeLogs.filter((u) => u.resisted).length;

  useEffect(() => {
    if (stage !== 'surfing') return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage === 'surfing' && elapsed >= URGE_SURF.totalSeconds) setStage('after');
  }, [stage, elapsed]);

  const save = (didResist: boolean) => {
    addUrgeLog({
      trigger: trigger.trim() || 'Checking urge',
      wantedTo: wantedTo.trim(),
      intensityBefore: before ?? 5,
      resisted: didResist,
      ...(after !== null ? { intensityAfter: after } : {}),
    });
    setStage('home');
    setTrigger('');
    setWantedTo('');
    setBefore(null);
    setAfter(null);
    setElapsed(0);
    setConfirmExit(false);
  };

  /* ---------- home ---------- */

  if (stage === 'home') {
    const recent = urgeLogs.slice(0, 12);
    const withBoth = urgeLogs.filter((u) => typeof u.intensityAfter === 'number');
    const meanDrop = withBoth.length
      ? (withBoth.reduce((s, u) => s + (u.intensityBefore - (u.intensityAfter ?? 0)), 0) / withBoth.length).toFixed(1)
      : null;

    return (
      <Screen>
        <View style={{ marginTop: space.xxl }}>
          <H1>Urges</H1>

          {/* The most motivating object in the app: a tally of times you did the hard
              thing. Unlike a symptom score it only ever goes up. */}
          <Card tone="accent" style={{ marginTop: space.md, alignItems: 'center', paddingVertical: space.xl }}>
            <Text style={[t.hero, { color: c.accentDeep }]}>{resisted}</Text>
            <H3 style={{ color: c.accentDeep }}>{urgesResistedLabel(resisted).replace(`: ${resisted}`, '')}</H3>
            {meanDrop !== null && (
              <Caption style={{ marginTop: space.sm }}>
                Average drop when you sit with one: {meanDrop} points
              </Caption>
            )}
          </Card>

          <Button label="I'm having an urge" onPress={() => setStage('before')} />
          <BodySm style={{ marginTop: space.md, marginBottom: space.lg }}>
            Three minutes of sitting with it without acting. That is the whole exercise.
          </BodySm>

          {recent.length > 0 && (
            <>
              <Caption>Recent</Caption>
              {recent.map((u) => (
                <View
                  key={u.id}
                  style={{
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: c.line,
                    paddingVertical: space.md,
                  }}
                >
                  <Row>
                    <View style={{ flex: 1 }}>
                      <BodySm style={{ color: c.ink }}>{u.trigger}</BodySm>
                      <Caption>{u.date}</Caption>
                    </View>
                    <Caption>
                      {u.intensityBefore}
                      {typeof u.intensityAfter === 'number' ? ` → ${u.intensityAfter}` : ''}
                      {u.resisted ? '  · resisted' : ''}
                    </Caption>
                  </Row>
                </View>
              ))}
            </>
          )}

          <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.lg }} />
        </View>
      </Screen>
    );
  }

  /* ---------- before ---------- */

  if (stage === 'before') {
    return (
      <Screen>
        <View style={{ marginTop: space.xxl }}>
          <H1>Before you start</H1>
          <Body style={{ marginTop: space.md, color: c.inkSoft }}>{URGE_SURF.entry}</Body>

          <Card style={{ marginTop: space.lg }}>
            <H3>What set it off?</H3>
            <TextInput
              value={trigger}
              onChangeText={setTrigger}
              placeholder="A mirror, a photo, a comment, nothing in particular"
              placeholderTextColor={c.inkFaint}
              style={inputStyle(c)}
            />
          </Card>

          <Card>
            <H3>What do you want to do?</H3>
            <TextInput
              value={wantedTo}
              onChangeText={setWantedTo}
              placeholder="Check, ask someone, retake a photo, cancel something"
              placeholderTextColor={c.inkFaint}
              style={inputStyle(c)}
            />
          </Card>

          <Card>
            <H3>How strong is it now?</H3>
            <View style={{ marginTop: space.md }}>
              <Scale value={before} onChange={setBefore} lowLabel="Barely there" highLabel="Overwhelming" />
            </View>
          </Card>

          <Button
            label="Start the three minutes"
            disabled={before === null}
            onPress={() => {
              setElapsed(0);
              setStage('surfing');
            }}
          />
          <Button label="Cancel" variant="ghost" onPress={() => setStage('home')} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  /* ---------- surfing ---------- */

  if (stage === 'surfing') {
    const remaining = URGE_SURF.totalSeconds - elapsed;
    const mm = Math.floor(remaining / 60);
    const ss = String(Math.max(0, remaining % 60)).padStart(2, '0');
    const cue = [...URGE_SURF.steps].reverse().find((s) => elapsed >= (s.at ?? 0));

    if (confirmExit) {
      return (
        <Screen scroll={false}>
          <View style={{ flex: 1, justifyContent: 'center', paddingTop: space.xxxl }}>
            <H2>{URGE_SURF.exitConfirm.title}</H2>
            <Body style={{ marginTop: space.md, color: c.inkSoft }}>{URGE_SURF.exitConfirm.body}</Body>
            <Button
              label={URGE_SURF.exitConfirm.stay}
              onPress={() => setConfirmExit(false)}
              style={{ marginTop: space.xl }}
            />
            <Button
              label={URGE_SURF.exitConfirm.leave}
              variant="ghost"
              onPress={() => setStage('after')}
              style={{ marginTop: space.sm }}
            />
          </View>
        </Screen>
      );
    }

    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', paddingTop: space.xxxl }}>
          <QuietCircle size={180} />
          <Text style={[t.h1, { color: c.accentDeep, marginTop: space.lg }]}>
            {mm}:{ss}
          </Text>
          <Body style={{ marginTop: space.lg, textAlign: 'center', fontSize: 18, lineHeight: 27 }}>
            {cue?.text}
          </Body>
          {/* Two taps to leave: one tap is the urge acting through the interface. */}
          <Button
            label="Leave early"
            variant="ghost"
            onPress={() => setConfirmExit(true)}
            style={{ marginTop: space.xxl }}
          />
        </View>
      </Screen>
    );
  }

  /* ---------- after ---------- */

  const stayed = elapsed >= URGE_SURF.totalSeconds;
  const drop = before !== null && after !== null ? before - after : null;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Where is it now?</H1>
        <Card style={{ marginTop: space.lg }}>
          <Scale value={after} onChange={setAfter} lowLabel="Gone" highLabel="Overwhelming" />
        </Card>

        {drop !== null && drop > 0 && (
          <Card tone="accent">
            <Text style={[t.display, { color: c.accentDeep }]}>−{drop}</Text>
            <Body style={{ marginTop: space.sm }}>{URGE_SURF.complete}</Body>
          </Card>
        )}
        {drop !== null && drop <= 0 && (
          <Card tone="accent">
            <Body>
              It held steady this time, and you still did not act on it. That is the part that
              counts — the drop shows up across repetitions rather than every single time.
            </Body>
          </Card>
        )}

        <Button label="Log it" disabled={after === null} onPress={() => save(true)} />
        {!stayed && (
          <Caption style={{ marginTop: space.md, textAlign: 'center' }}>
            You left before the timer ended. It still counts as resisted — you did not act on it.
          </Caption>
        )}
      </View>
    </Screen>
  );
}

function inputStyle(c: ReturnType<typeof useTheme>) {
  return {
    marginTop: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    borderRadius: radius.md,
    padding: space.md,
    color: c.ink,
    backgroundColor: c.bg,
    minHeight: 48,
  };
}
