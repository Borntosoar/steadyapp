import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, Chip, Row, Scale, useTheme,
} from '../components/ui';
import { MirrorSurface, type MirrorMode } from '../components/MirrorSurface';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { mirrorSpecForWeek, MIRROR_UNLOCK_WEEK } from '../lib/protocol';
import {
  MIRROR_RULES, DISTANCE_RATIONALE, NEUTRAL_SWAPS, promptsForPhase, CONDITION_SUGGESTIONS,
} from '../constants/mirrorPrompts';

type Stage = 'intro' | 'condition' | 'before' | 'session' | 'after';

/** One prompt every 25 seconds — inside the 20–30s band, and a clean divisor of the
 *  90s / 180s / 300s / 480s durations. */
const PROMPT_INTERVAL = 25;

export default function Mirror() {
  const c = useTheme();
  const router = useRouter();

  const week = useStore((s) => s.protocol.currentWeek);
  const sessions = useStore((s) => s.mirrorSessions);
  const addMirrorSession = useStore((s) => s.addMirrorSession);
  const avoidedConditions = useStore((s) => s.protocol.avoidedConditions);
  const setAvoidedConditions = useStore((s) => s.setAvoidedConditions);

  const spec = mirrorSpecForWeek(week);

  const [stage, setStage] = useState<Stage>('intro');
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [condition, setCondition] = useState<string | null>(null);
  const [mode, setMode] = useState<MirrorMode>('text');

  const onModeResolved = useCallback((m: MirrorMode) => setMode(m), []);

  useEffect(() => {
    if (stage !== 'session') return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const duration = spec?.durationSeconds ?? 90;
  useEffect(() => {
    if (stage === 'session' && elapsed >= duration) setStage('after');
  }, [stage, elapsed, duration]);

  /* ---------- locked ---------- */

  if (!spec) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>Not yet</H1>
          <Card tone="accent" style={{ marginTop: space.lg }}>
            <Body>
              Mirror practice opens in week {MIRROR_UNLOCK_WEEK}. You are in week {week}.
            </Body>
            <Body style={{ marginTop: space.md, color: c.inkSoft }}>
              This is deliberate. Exposure before you have seen your own baseline is exposure
              without a reason, and that is the version people stop doing. Phase one is for
              watching the pattern; the work on it starts after.
            </Body>
          </Card>
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  /* ---------- intro ---------- */

  if (stage === 'intro') {
    const deltas = sessions
      .filter((s) => typeof s.sudsAfter === 'number')
      .slice(0, 8)
      .map((s) => s.sudsBefore - s.sudsAfter);

    return (
      <Screen>
        <View style={{ marginTop: space.xxl }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Caption>Week {week}</Caption>
              <H1>Mirror practice</H1>
            </View>
            <Chip label={`Phase ${spec.phase}`} tone="accent" />
          </Row>

          <Card style={{ marginTop: space.md }}>
            <Row>
              <View style={{ flex: 1 }}>
                <Caption>Length</Caption>
                <H3>
                  {duration >= 60 ? `${Math.round(duration / 60)} min` : `${duration}s`}
                </H3>
              </View>
              <View style={{ flex: 1 }}>
                <Caption>Distance</Caption>
                <BodySm style={{ color: c.ink }}>{spec.distance}</BodySm>
              </View>
            </Row>
            <Caption style={{ marginTop: space.md }}>{spec.conditions}</Caption>
          </Card>

          <Card>
            <H3>The rules</H3>
            {MIRROR_RULES.map((r, i) => (
              <Row key={i} style={{ alignItems: 'flex-start', marginTop: space.sm }}>
                <Text style={[t.bodySm, { color: c.accentDeep, width: 18 }]}>{i + 1}</Text>
                <BodySm style={{ flex: 1, color: c.ink }}>{r}</BodySm>
              </Row>
            ))}
          </Card>

          <Card tone="accent">
            <H3>Why distance</H3>
            <BodySm style={{ marginTop: space.xs, color: c.ink }}>{DISTANCE_RATIONALE}</BodySm>
          </Card>

          <Card>
            <H3>Swap the word, keep going</H3>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm }}>
              {NEUTRAL_SWAPS.map(([a, b]) => (
                <View
                  key={a}
                  style={{
                    backgroundColor: c.surfaceAlt,
                    borderRadius: radius.pill,
                    paddingVertical: 4,
                    paddingHorizontal: space.md,
                  }}
                >
                  <Caption>
                    {a} → {b}
                  </Caption>
                </View>
              ))}
            </View>
          </Card>

          {deltas.length > 0 && (
            <Card>
              <H3>Your last sessions</H3>
              <Caption>How far distress fell from start to end. Higher bars are better.</Caption>
              <DeltaBars deltas={deltas} />
            </Card>
          )}

          <Button
            label="Begin"
            onPress={() => setStage(spec.requiresCondition ? 'condition' : 'before')}
          />
          <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  /* ---------- condition (phase 3) ---------- */

  if (stage === 'condition') {
    const options = [...new Set([...avoidedConditions, ...CONDITION_SUGGESTIONS])];
    return (
      <Screen>
        <View style={{ marginTop: space.xxl }}>
          <H1>Add one condition</H1>
          <Body style={{ marginTop: space.sm, color: c.inkSoft }}>
            Pick something you normally avoid. One is enough — this is meant to be harder than
            last phase, not impossible.
          </Body>

          <View style={{ marginTop: space.lg }}>
            {options.map((o) => {
              const on = condition === o;
              return (
                <Pressable
                  key={o}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setCondition(o);
                    if (!avoidedConditions.includes(o)) setAvoidedConditions([...avoidedConditions, o]);
                  }}
                  style={{
                    borderWidth: on ? 1.5 : StyleSheet.hairlineWidth,
                    borderColor: on ? c.accent : c.line,
                    backgroundColor: on ? c.accentPale : c.surface,
                    borderRadius: radius.md,
                    padding: space.lg,
                    marginBottom: space.sm,
                    minHeight: 48,
                    justifyContent: 'center',
                  }}
                >
                  <BodySm style={{ color: on ? c.accentDeep : c.ink }}>{o}</BodySm>
                </Pressable>
              );
            })}
          </View>

          <Button label="Continue" disabled={!condition} onPress={() => setStage('before')} />
          <Button label="Back" variant="ghost" onPress={() => setStage('intro')} style={{ marginTop: space.sm }} />
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
          <Body style={{ marginTop: space.sm, color: c.inkSoft }}>
            How much distress are you carrying right now? This is the number the session moves.
          </Body>
          <Card style={{ marginTop: space.lg }}>
            <Scale value={before} onChange={setBefore} lowLabel="None" highLabel="The worst it gets" />
          </Card>
          <Button
            label="Start"
            disabled={before === null}
            onPress={() => {
              setElapsed(0);
              setStage('session');
            }}
          />
          <Button label="Back" variant="ghost" onPress={() => setStage('intro')} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  /* ---------- session ---------- */

  if (stage === 'session') {
    const prompts = promptsForPhase(spec.phase);
    const idx = Math.min(Math.floor(elapsed / PROMPT_INTERVAL), prompts.length - 1);
    const remaining = Math.max(0, duration - elapsed);
    const mm = Math.floor(remaining / 60);
    const ss = String(remaining % 60).padStart(2, '0');

    return (
      <Screen scroll={false}>
        <View style={{ paddingTop: space.xxl }}>
          <Row>
            <Caption>{condition ? condition : spec.distance}</Caption>
            <Text style={[t.h2, { color: c.accentDeep }]}>
              {mm}:{ss}
            </Text>
          </Row>

          <View style={{ marginTop: space.md }}>
            <MirrorSurface onModeResolved={onModeResolved} height={320} />
          </View>

          <Card tone="accent" style={{ marginTop: space.md, minHeight: 110 }}>
            <Body style={{ fontSize: 17, lineHeight: 26 }}>{prompts[idx]?.text}</Body>
          </Card>

          <Caption style={{ textAlign: 'center' }}>
            {mode === 'live'
              ? 'Nothing is recorded. There is no capture in this app.'
              : 'Text-guided session. The ratings are the same.'}
          </Caption>

          {/* Ending early is allowed and logged honestly — but it is not the default
              action, because leaving at peak distress is what makes exposure fail. */}
          <Button
            label="End early"
            variant="ghost"
            onPress={() => setStage('after')}
            style={{ marginTop: space.md }}
          />
        </View>
      </Screen>
    );
  }

  /* ---------- after ---------- */

  const completed = elapsed >= duration;
  const drop = before !== null && after !== null ? before - after : null;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Where is it now?</H1>
        <Card style={{ marginTop: space.lg }}>
          <Scale value={after} onChange={setAfter} lowLabel="None" highLabel="The worst it gets" />
        </Card>

        {drop !== null && (
          <Card tone="accent">
            {drop > 0 ? (
              <>
                <Text style={[t.display, { color: c.accentDeep }]}>−{drop}</Text>
                <Body style={{ marginTop: space.sm }}>
                  Distress fell {drop} {drop === 1 ? 'point' : 'points'} while you stayed and looked.
                  That is habituation — not bravery, and not the mirror being kind today.
                </Body>
              </>
            ) : (
              <Body>
                It did not fall this time. Single sessions vary a lot; the trend across
                repetitions is the thing that moves. The bars on the intro screen are where you
                will see it.
              </Body>
            )}
          </Card>
        )}

        {!completed && (
          <Caption style={{ marginBottom: space.md }}>
            You ended early. Logged as it happened — the record is only useful if it is accurate.
          </Caption>
        )}

        <Button
          label="Save"
          disabled={after === null}
          onPress={() => {
            addMirrorSession({
              phase: spec.phase,
              durationSeconds: elapsed,
              sudsBefore: before ?? 0,
              sudsAfter: after ?? 0,
              completed,
              ...(condition ? { condition } : {}),
            });
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}

/** Hand-rolled bars — no chart library anywhere in this app. */
function DeltaBars({ deltas }: { deltas: number[] }) {
  const c = useTheme();
  const max = Math.max(1, ...deltas.map((d) => Math.abs(d)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 70, marginTop: space.md }}>
      {[...deltas].reverse().map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <View
            style={{
              width: '100%',
              height: Math.max(3, (Math.abs(d) / max) * 52),
              backgroundColor: d > 0 ? c.accent : c.line,
              borderRadius: 3,
            }}
          />
          <Caption>{d > 0 ? `−${d}` : d === 0 ? '0' : `+${-d}`}</Caption>
        </View>
      ))}
    </View>
  );
}
