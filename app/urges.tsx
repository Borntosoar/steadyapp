import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Field, H1, H2, H3, Body, BodySm, Caption, Row, useTheme,
} from '../components/ui';
import { Frost, LevelBar, TopBar, Ground, Explain, URGE_WORDS } from '../components/frost';
import { Finish } from '../components/Finish';
import { Atmosphere } from '../components/Atmosphere';
import { QuietCircle } from '../components/BreathCircle';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../constants/theme';
import { useStore } from '../store/useStore';
import { URGE_SURF } from '../content/exercises.ts';
import { formatLogDate } from '../lib/dates';
import { setQuietZone } from '../hooks/haptics';
import { NAMES, EXPLAIN } from '../content/names';

type Stage = 'home' | 'before' | 'surfing' | 'after' | 'finished';

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

  /* Silent for the three minutes themselves. Somebody sitting through an urge is
     deliberately not acting on a sensation; adding a new one is the wrong help. The finish
     screen afterwards still taps once, because by then they have done the thing. */
  useEffect(() => {
    setQuietZone(stage === 'surfing');
    return () => setQuietZone(false);
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
    setStage('finished');
  };

  const reset = () => {
    setTrigger('');
    setWantedTo('');
    setBefore(null);
    setAfter(null);
    setElapsed(0);
    setConfirmExit(false);
    setStage('home');
  };

  /* ---------- finished ----------
   *
   * This screen used to not exist. You would sit through three minutes of an urge — the
   * hardest thing this app asks of anybody — and then get dropped back on a menu with no
   * acknowledgement at all.
   *
   * The figure is the RESISTED TALLY, not the drop. The drop can be zero, and this screen
   * has to land the same either way; a number that sometimes says nothing happened is worse
   * than no number. The tally only ever goes up, which is exactly why it is safe here. */

  if (stage === 'finished') {
    const drop = before !== null && after !== null ? before - after : null;
    return (
      <Finish
        eyebrow="You did not act on it"
        figure={resisted}
        figureUnit={resisted === 1 ? 'time' : 'times'}
        headline={resisted === 1 ? 'That is one' : 'You have done this ' + resisted + ' times'}
        body={
          drop !== null && drop > 0
            ? `It dropped by ${drop} while you sat with it. That is the urge doing what urges do.`
            : 'It did not fade much this time. You still did not act on it, and that is the part that counts.'
        }
        doneLabel="Done"
        onDone={reset}
      />
    );
  }

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
      <Ground>
        <TopBar onBack={() => router.back()} />

        <H1 style={{ marginTop: space.lg }}>{NAMES.urge.title}</H1>
        <BodySm style={{ marginTop: space.sm }}>
          Three minutes with an urge, without acting on it. That is the whole thing, and it is
          the part that changes the most.
        </BodySm>

        {/* The most motivating object in the app: a tally of times you did the hard thing.
            Unlike a symptom score, it only ever goes up. */}
        <Frost style={{ marginTop: space.xl }}>
          <Row style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.hero, { color: c.cool, fontSize: 52, lineHeight: 56 }]}>{resisted}</Text>
              <Caption style={{ marginTop: 2 }}>
                {resisted === 1 ? NAMES.urge.unit : NAMES.urge.unitPlural}
              </Caption>
            </View>
            {meanDrop !== null && (
              <View style={{ flex: 1 }}>
                <Text style={[t.h1, { color: c.ink }]}>{meanDrop}</Text>
                <Caption style={{ marginTop: 2 }}>points it usually drops while you sit with it</Caption>
              </View>
            )}
          </Row>
          <Explain q={EXPLAIN.urgesResisted.q} a={EXPLAIN.urgesResisted.a} />
        </Frost>

        <Button
          label="I’m having an urge"
          onPress={() => setStage('before')}
          style={{ marginTop: space.md }}
        />

        {recent.length > 0 && (
          <View style={{ marginTop: space.xxl }}>
            <Caption>Recent</Caption>
            <Frost style={{ marginTop: space.sm }}>
              {recent.map((u, i) => (
                <View
                  key={u.id}
                  style={{
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: c.line,
                    paddingVertical: space.md,
                  }}
                >
                  <Row>
                    <View style={{ flex: 1 }}>
                      <BodySm style={{ color: c.ink }}>{u.trigger}</BodySm>
                      <Caption>{formatLogDate(u.date)}</Caption>
                    </View>
                    <Caption>
                      {typeof u.intensityAfter === 'number'
                        ? `went ${u.intensityBefore} to ${u.intensityAfter}`
                        : `was ${u.intensityBefore} out of 10`}
                    </Caption>
                    {u.resisted && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cool }} />
                    )}
                  </Row>
                </View>
              ))}
            </Frost>
          </View>
        )}
      </Ground>
    );
  }

  /* ---------- before ---------- */

  if (stage === 'before') {
    return (
      <Ground>
        <TopBar onBack={() => setStage('home')} />

        <H1 style={{ marginTop: space.lg }}>Before you start</H1>
        <Body style={{ marginTop: space.md, marginBottom: space.xl, color: c.inkSoft }}>
          {URGE_SURF.entry}
        </Body>

        <Frost>
          <Field
            label="What set it off?"
            value={trigger}
            onChangeText={setTrigger}
            placeholder="A mirror, a photo, a comment, nothing"
          />

          <Field
            label="What do you want to do?"
            value={wantedTo}
            onChangeText={setWantedTo}
            placeholder="Check, ask someone, retake a photo, cancel"
          />

          <H3>How strong is it right now?</H3>
          <View style={{ marginTop: space.md }}>
            <LevelBar value={before} onChange={setBefore} words={URGE_WORDS} />
          </View>
        </Frost>

        <View style={{ marginTop: space.xl }}>
          <Button
            label="Start the three minutes"
            disabled={before === null}
            onPress={() => {
              setElapsed(0);
              setStage('surfing');
            }}
          />
        </View>
      </Ground>
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
        <Atmosphere variant="emberDeep" lightX={0.5} rounded="none" scrim style={{ flex: 1 }}>
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
                  <Text style={[t.h2, { color: '#fff', textAlign: 'center', lineHeight: 31 }]}>
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

  return (
    <Ground>
      <TopBar onBack={() => setStage('surfing')} />

      <H1 style={{ marginTop: space.lg }}>Where is it now?</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>
        Same scale as before. Whatever it says is the useful answer.
      </BodySm>

      <Frost>
        <LevelBar value={after} onChange={setAfter} words={URGE_WORDS} />
      </Frost>

      <View style={{ marginTop: space.xl }}>
        <Button label="Log it" disabled={after === null} onPress={() => save(true)} />
        {!stayed && (
          <Caption style={{ marginTop: space.md, textAlign: 'center' }}>
            You left before the timer ended. It still counts — you did not act on it.
          </Caption>
        )}
      </View>
    </Ground>
  );
}
