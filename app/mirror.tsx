import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card, Button, H1, H2, H3, Body, BodySm, Caption, Chip, Row, Rule, useTheme,
} from '../components/ui';
import { MirrorSurface, type MirrorMode } from '../components/MirrorSurface';
import { Frost, Ground, FaceScale, TopBar, Explain } from '../components/frost';
import { NAMES, EXPLAIN } from '../content/names';
import { Finish } from '../components/Finish';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { mirrorSpecForWeek, MIRROR_UNLOCK_WEEK } from '../lib/protocol';
import { isGated, effectiveWeek } from '../lib/entitlement';
import { useEntitlement } from '../hooks/useEntitlement';
import {
  MIRROR_RULES, DISTANCE_RATIONALE, NEUTRAL_SWAPS, promptsForPhase, CONDITION_SUGGESTIONS,
} from '../constants/mirrorPrompts';

type Stage = 'intro' | 'condition' | 'before' | 'session' | 'after' | 'finished';

/** One prompt every 25 seconds — inside the 20–30s band, and a clean divisor of the
 *  90s / 180s / 300s / 480s durations. */
const PROMPT_INTERVAL = 25;

export default function Mirror() {
  const c = useTheme();
  const router = useRouter();

  const { entitled } = useEntitlement();
  const reached = useStore((s) => s.protocol.currentWeek);
  /* Clamped, like every other screen that reads a week. Belt and braces here rather than a
     live fix: `isGated` below already turns a free user away, so in practice this only ever
     runs for somebody entitled, where the clamp is the identity. It is here so the invariant
     is uniform — every reader of the protocol week goes through one function — which is what
     the test enforces, and what stops the next screen from being the exception. */
  const week = effectiveWeek(reached, entitled);
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

  /* ---------- the entitlement boundary ----------
   *
   * This screen had no entitlement check at all, while TIER_COMPARISON in lib/entitlement.ts
   * lists mirror practice as paid. The only thing standing in front of it was the week-4
   * protocol gate, and the app's own custom scheme made it directly addressable:
   * `anneal:///mirror` from any other app on the device opened the flagship paid feature.
   *
   * It routes through `isGated` rather than reading `entitled` inline, which is what
   * lib/entitlement.ts has always claimed happens — "the single place that decides". It was
   * not true: `isGated` and `weekGated` had zero production call sites, so the one consumer
   * of that module was the ALWAYS_FREE_ROUTES half. A policy function nobody calls is how
   * the free-route half silently rots later, and that half is the safety guarantee. Both
   * halves are live now — `weekGated` and its read-time clamp landed on Today, Practice
   * and Learn, so the module's policy surface is called rather than merely documented.
   *
   * Ordered before the week gate deliberately. "You have not reached this yet" is the more
   * useful sentence when both are true, and a free user genuinely cannot reach week 4 now
   * that `effectiveWeek` holds them at one — so anybody who gets past this line has paid,
   * and anybody stopped by it has hit the paid boundary rather than a pacing one. */
  if (isGated('/mirror', entitled)) {
    return (
      <Ground>
        <View style={{ marginTop: space.xxxl }}>
          <Caption>Part of Anneal+</Caption>
          <H1 style={{ marginTop: space.xs }}>Mirror practice</H1>
          <Body style={{ marginTop: space.md }}>
            Standing in front of a mirror on purpose, for a set time, without checking or
            fixing. It is the part of the programme that changes the most, and it is the part
            that needs the rest of the weeks underneath it first.
          </Body>
          <BodySm style={{ marginTop: space.md, color: c.cool }}>
            Calming down, checking in, the hard-day path and crisis support are not affected.
            Those are free forever and are not part of this.
          </BodySm>

          <View style={{ marginTop: space.xxl }}>
            <Button label="See Anneal+" onPress={() => router.push('/paywall')} />
            <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.xs }} />
          </View>
        </View>
      </Ground>
    );
  }

  /* ---------- locked ---------- */

  if (!spec) {
    return (
      <Ground>
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
      </Ground>
    );
  }

  /* ---------- intro ---------- */

  if (stage === 'intro') {
    const deltas = sessions
      .filter((s) => typeof s.sudsAfter === 'number')
      .slice(0, 8)
      .map((s) => s.sudsBefore - s.sudsAfter);

    return (
      <Ground>
        <View style={{ marginTop: space.xxl }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Caption>Week {week}</Caption>
              <H1>Mirror practice</H1>
            </View>
            <Chip label={`Phase ${spec.phase}`} tone="accent" />
          </Row>

          <View style={{ marginTop: space.xl }}>
            <Rule />
            <Row style={{ paddingVertical: space.lg, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Caption>Length</Caption>
                <Text style={[t.h1, { color: c.ink, marginTop: 2 }]}>
                  {duration >= 60 ? `${Math.round(duration / 60)}` : `${duration}`}
                  <Text style={[t.h3, { color: c.inkSoft }]}>{duration >= 60 ? ' min' : 's'}</Text>
                </Text>
              </View>
              <View style={{ flex: 1.4 }}>
                <Caption>Distance</Caption>
                <BodySm style={{ color: c.ink, marginTop: 4 }}>{spec.distance}</BodySm>
              </View>
            </Row>
            <Rule />
            <Caption style={{ marginTop: space.md }}>{spec.conditions}</Caption>
          </View>

          <View style={{ marginTop: space.xxl }}>
            <H2>The rules</H2>
            {MIRROR_RULES.map((r, i) => (
              <Row key={i} style={{ alignItems: 'flex-start', marginTop: space.md }}>
                <Text style={[t.label, { color: c.accentDeep, width: 20 }]}>{i + 1}</Text>
                <BodySm style={{ flex: 1, color: c.ink }}>{r}</BodySm>
              </Row>
            ))}
          </View>

          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Why distance</H2>
            <BodySm style={{ marginTop: space.sm, color: c.ink }}>{DISTANCE_RATIONALE}</BodySm>
          </View>

          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Swap the word, keep going</H2>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
              {NEUTRAL_SWAPS.map(([a, b]) => (
                <View
                  key={a}
                  style={{
                    backgroundColor: c.surfaceStrong,
                    borderRadius: radius.pill,
                    paddingVertical: 5,
                    paddingHorizontal: space.md,
                  }}
                >
                  <Caption>
                    {a} → {b}
                  </Caption>
                </View>
              ))}
            </View>
          </View>

          {deltas.length > 0 && (
            <View style={{ marginTop: space.xxl }}>
              <Rule />
              <H2 style={{ marginTop: space.lg }}>Your last sessions</H2>
              <Caption style={{ marginTop: space.xs }}>
                How far it fell from start to end. Higher bars are better.
              </Caption>
              <DeltaBars deltas={deltas} />
            </View>
          )}

          <View style={{ marginTop: space.xxl }}>
            <Button
              label="Begin"
              onPress={() => setStage(spec.requiresCondition ? 'condition' : 'before')}
            />
            <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.xs }} />
          </View>
        </View>
      </Ground>
    );
  }

  /* ---------- condition (phase 3) ---------- */

  if (stage === 'condition') {
    const options = [...new Set([...avoidedConditions, ...CONDITION_SUGGESTIONS])];
    return (
      <Ground>
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
                    backgroundColor: on ? c.accentDim : c.surface,
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
      </Ground>
    );
  }

  /* ---------- before ---------- */

  if (stage === 'before') {
    return (
      <Ground>
        <View style={{ marginTop: space.xxl }}>
          <H1>Before you start</H1>
          <Body style={{ marginTop: space.sm, color: c.inkSoft }}>
            How bad does it feel right now? This is the number the session moves.
          </Body>
          <View style={{ marginTop: space.xl }}>
            <FaceScale value={before} onChange={setBefore} />
          </View>
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
      </Ground>
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
      <Ground>
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
      </Ground>
    );
  }

  /* ---------- finished ----------
   *
   * This used to be `router.replace('/')` — the app would drop you back on the home screen
   * with no acknowledgement at all, straight after the single hardest thing it asks anyone
   * to do. */

  if (stage === 'finished') {
    const moved = before !== null && after !== null ? before - after : null;
    const sessionCount = sessions.length;
    return (
      <Finish
        eyebrow="You stayed and looked"
        figure={sessionCount}
        figureUnit={sessionCount === 1 ? 'session' : 'sessions'}
        headline={sessionCount === 1 ? 'That was the first one' : 'That is another one done'}
        body={
          moved !== null && moved > 0
            ? `Distress fell ${moved} ${moved === 1 ? 'point' : 'points'} while you stayed. That is what getting used to something looks like.`
            : 'It did not fall this time. Single sessions vary a lot. The change shows up across a run of them, not in any one.'
        }
        onDone={() => router.replace('/')}
      />
    );
  }

  /* ---------- after ---------- */

  const completed = elapsed >= duration;
  const drop = before !== null && after !== null ? before - after : null;

  return (
    <Ground>
      <View style={{ marginTop: space.xxl }}>
        <H1>Where is it now?</H1>
        <Card style={{ marginTop: space.lg }}>
          <FaceScale value={after} onChange={setAfter} />
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
            You ended early. It is logged as it happened. The record is only useful if it is true.
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
            setStage('finished');
          }}
        />
      </View>
    </Ground>
  );
}

/** Hand-rolled bars — no chart library anywhere in this app. */
function DeltaBars({ deltas }: { deltas: number[] }) {
  const c = useTheme();
  const max = Math.max(1, ...deltas.map((d) => Math.abs(d)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 70, marginTop: space.md }}>
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
