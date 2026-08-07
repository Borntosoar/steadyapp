import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Button, Field, H1, H2, H3, Body, BodySm, Caption, Scale, Row, Rule, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import { QuietCircle } from '../components/BreathCircle';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { useStore } from '../store/useStore';
import { URGE_SURF } from '../content/exercises.ts';
import { urgesResistedLabel } from '../content/copy.ts';

type Stage = 'home' | 'before' | 'surfing' | 'after';

export default function Urges() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      ? (
          withBoth.reduce((s, u) => s + (u.intensityBefore - (u.intensityAfter ?? 0)), 0) /
          withBoth.length
        ).toFixed(1)
      : null;

    return (
      <Screen>
        <View style={{ marginTop: space.xxl }}>
          <H1>Urges</H1>
          <BodySm style={{ marginTop: space.sm }}>
            Three minutes with an urge, without acting on it. That is the whole exercise, and it
            is the one that changes the most.
          </BodySm>

          {/* The most motivating object in the app: a tally of times you did the hard
              thing. Unlike a symptom score it only ever goes up. */}
          <View style={{ marginTop: space.xl, marginBottom: space.xl }}>
            <Rule />
            <Row style={{ paddingVertical: space.lg, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Text style={[t.hero, { color: c.cool }]}>{resisted}</Text>
                <Text style={[t.caption, { color: c.inkFaint, marginTop: 2 }]}>
                  {urgesResistedLabel(resisted).replace(`: ${resisted}`, '')}
                </Text>
              </View>
              {meanDrop !== null && (
                <View style={{ flex: 1 }}>
                  <Text style={[t.h1, { color: c.ink }]}>−{meanDrop}</Text>
                  <Text style={[t.caption, { color: c.inkFaint, marginTop: 2 }]}>
                    average drop when you sit with one
                  </Text>
                </View>
              )}
            </Row>
            <Rule />
          </View>

          <Button label="I'm having an urge" onPress={() => setStage('before')} />

          {recent.length > 0 && (
            <View style={{ marginTop: space.xxl }}>
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
                    </Caption>
                    {u.resisted && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cool }} />
                    )}
                  </Row>
                </View>
              ))}
            </View>
          )}

          <Button
            label="Back"
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: space.xl, alignSelf: 'flex-start' }}
          />
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
          <Body style={{ marginTop: space.md, marginBottom: space.xxl, color: c.inkSoft }}>
            {URGE_SURF.entry}
          </Body>

          <Field
            label="What set it off?"
            value={trigger}
            onChangeText={setTrigger}
            placeholder="A mirror, a photo, a comment, nothing in particular"
          />

          <Field
            label="What do you want to do?"
            value={wantedTo}
            onChangeText={setWantedTo}
            placeholder="Check, ask someone, retake a photo, cancel something"
          />

          <H3>How strong is it now?</H3>
          <View style={{ marginTop: space.md }}>
            <Scale value={before} onChange={setBefore} lowLabel="Barely there" highLabel="Overwhelming" />
          </View>

          <View style={{ marginTop: space.xxl }}>
            <Button
              label="Start the three minutes"
              disabled={before === null}
              onPress={() => {
                setElapsed(0);
                setStage('surfing');
              }}
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setStage('home')}
              style={{ marginTop: space.xs }}
            />
          </View>
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
    const progress = Math.min(1, elapsed / URGE_SURF.totalSeconds);

    /* Full frame, no chrome, no tab bar. The session is the only thing on screen —
       every element still visible is one more thing to look at instead of the urge. */
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDeep }}>
        <Atmosphere variant="ember" lightX={0.5} rounded="none" scrim={false} style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              width: '100%',
              maxWidth: LAYOUT_MAX_WIDTH,
              alignSelf: 'center',
              paddingTop: insets.top + space.xxl,
              paddingBottom: insets.bottom + space.xl,
              paddingHorizontal: space.xl,
            }}
          >
            {confirmExit ? (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[t.display, { color: '#fff' }]}>{URGE_SURF.exitConfirm.title}</Text>
                <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.md }]}>
                  {URGE_SURF.exitConfirm.body}
                </Text>
                <Button
                  label={URGE_SURF.exitConfirm.stay}
                  onPress={() => setConfirmExit(false)}
                  style={{ marginTop: space.xxl }}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStage('after')}
                  style={({ pressed }) => ({ paddingVertical: space.lg, opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={[t.body, { color: 'rgba(255,255,255,0.6)', textAlign: 'center' }]}>
                    {URGE_SURF.exitConfirm.leave}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Elapsed, drawn as a filling rule rather than a ring. A ring invites
                    watching; a rule at the top of the frame reads once and recedes. */}
                <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.pill }}>
                  <View
                    style={{
                      height: 2,
                      width: `${progress * 100}%`,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: radius.pill,
                    }}
                  />
                </View>

                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <QuietCircle size={200} tone="light" />
                  <Text style={[t.timer, { color: '#fff', marginTop: space.xl }]}>
                    {mm}:{ss}
                  </Text>
                </View>

                <View style={{ minHeight: 120, justifyContent: 'flex-start' }}>
                  <Text
                    style={[
                      t.h2,
                      { color: '#fff', textAlign: 'center', lineHeight: 31 },
                    ]}
                  >
                    {cue?.text}
                  </Text>
                </View>

                {/* Two taps to leave: one tap is the urge acting through the interface. */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmExit(true)}
                  style={({ pressed }) => ({ paddingVertical: space.lg, opacity: pressed ? 0.5 : 1 })}
                >
                  <Text style={[t.bodySm, { color: 'rgba(255,255,255,0.55)', textAlign: 'center' }]}>
                    Leave early
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </Atmosphere>
      </View>
    );
  }

  /* ---------- after ---------- */

  const stayed = elapsed >= URGE_SURF.totalSeconds;
  const drop = before !== null && after !== null ? before - after : null;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Where is it now?</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>
          Same scale as before. Whatever it says is the useful answer.
        </BodySm>

        <Scale value={after} onChange={setAfter} lowLabel="Gone" highLabel="Overwhelming" />

        {drop !== null && drop > 0 && (
          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <Text style={[t.display, { color: c.cool, marginTop: space.lg }]}>−{drop}</Text>
            <Body style={{ marginTop: space.sm }}>{URGE_SURF.complete}</Body>
          </View>
        )}
        {drop !== null && drop <= 0 && (
          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <Body style={{ marginTop: space.lg }}>
              It held steady this time, and you still did not act on it. That is the part that
              counts — the drop shows up across repetitions rather than every single time.
            </Body>
          </View>
        )}

        <View style={{ marginTop: space.xxl }}>
          <Button label="Log it" disabled={after === null} onPress={() => save(true)} />
          {!stayed && (
            <Caption style={{ marginTop: space.md, textAlign: 'center' }}>
              You left before the timer ended. It still counts as resisted — you did not act on it.
            </Caption>
          )}
        </View>
      </View>
    </Screen>
  );
}
