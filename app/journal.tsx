import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Button, Field, H1, H2, H3, Body, BodySm, Caption, Chip, Label, Row, Rule, Scale, useTheme,
} from '../components/ui';
import { Atmosphere } from '../components/Atmosphere';
import {
  space, radius, type as t, LAYOUT_MAX_WIDTH, type AtmosphereKey,
} from '../constants/theme';
import { useStore } from '../store/useStore';
import { FREE_LIMITS } from '../lib/entitlement';
import { useEntitlement } from '../hooks/useEntitlement';
import {
  THOUGHT_RECORD_STEPS, THOUGHT_RECORD_CLOSING, DISTORTIONS, EXPERIMENT_FIELDS, EXPERIMENT_COPY,
} from '../content/exercises.ts';
import { phaseForWeek } from '../lib/protocol';

type View_ = 'home' | 'record' | 'experiment';

/** Full-frame close for a finished piece of work. Both flows end on one of these: the
 *  moment a thought moved is the moment worth giving the whole screen to, and it is what
 *  brings somebody back to do the next one. */
function Finish({
  eyebrow,
  figure,
  headline,
  body,
  onDone,
  art = 'night',
}: {
  eyebrow: string;
  figure?: string;
  headline: string;
  body: string;
  onDone: () => void;
  art?: AtmosphereKey;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bgDeep }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH, flex: 1 }}>
          <Atmosphere variant={art} rounded="none" style={{ flex: 1, minHeight: 440 }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'flex-end',
                paddingTop: insets.top + space.xxxl,
                paddingHorizontal: space.lg,
                paddingBottom: space.xl,
              }}
            >
              <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)' }]}>{eyebrow}</Text>
              {figure ? (
                <Text style={[t.hero, { color: '#fff', marginTop: space.sm }]}>{figure}</Text>
              ) : null}
              <Text style={[t.h2, { color: '#fff', marginTop: figure ? space.xs : space.sm }]}>{headline}</Text>
              <Text style={[t.body, { color: 'rgba(255,255,255,0.82)', marginTop: space.md }]}>{body}</Text>
            </View>
          </Atmosphere>
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: insets.bottom + space.xl }}>
            <Button label="Done" onPress={onDone} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Step counter shared by both flows. */
function Steps({ n, i }: { n: number; i: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginTop: space.lg, marginBottom: space.xl }}>
      {Array.from({ length: n }, (_, k) => (
        <View
          key={k}
          style={{
            flex: 1,
            height: 3,
            borderRadius: radius.pill,
            backgroundColor: k <= i ? c.accent : c.surfaceStrong,
          }}
        />
      ))}
    </View>
  );
}

export default function Journal() {
  const c = useTheme();
  const router = useRouter();
  const week = useStore((s) => s.protocol.currentWeek);
  const records = useStore((s) => s.thoughtRecords);
  const experiments = useStore((s) => s.experiments);
  const [view, setView] = useState<View_>('home');

  const phase = phaseForWeek(week);
  const experimentsUnlocked = phase.id >= 3;

  if (view === 'record') return <ThoughtRecord onDone={() => setView('home')} />;
  if (view === 'experiment') return <Experiment onDone={() => setView('home')} />;

  const thisMonth = records.filter((r) => r.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const pending = experiments.find((e) => !e.outcome);

  const moved = records.filter((r) => r.emotionIntensity > r.reRatedIntensity).length;

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Journal</H1>
        <BodySm style={{ marginTop: space.sm }}>
          Thought records take a thought apart. Experiments test one against reality. Both are
          writing, and the writing is the part that works.
        </BodySm>

        {records.length > 0 && (
          <View style={{ marginTop: space.xl }}>
            <Rule />
            <Row style={{ paddingVertical: space.lg, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Text style={[t.hero, { color: c.ink }]}>{records.length}</Text>
                <Caption style={{ marginTop: 2 }}>
                  thought{records.length === 1 ? '' : 's'} taken apart
                </Caption>
              </View>
              {moved > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={[t.h1, { color: c.cool }]}>{moved}</Text>
                  <Caption style={{ marginTop: 2 }}>came down after</Caption>
                </View>
              )}
            </Row>
            <Rule />
          </View>
        )}

        {pending && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setView('experiment')}
            style={({ pressed }) => ({
              marginTop: space.xl,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: c.accent,
              backgroundColor: c.accentDim,
              padding: space.lg,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Label style={{ color: c.accentDeep }}>An experiment is waiting on you</Label>
            <BodySm style={{ marginTop: space.xs, color: c.ink }}>{pending.avoiding}</BodySm>
            <Caption style={{ marginTop: space.sm }}>Record what actually happened ›</Caption>
          </Pressable>
        )}

        <View style={{ marginTop: space.xl }}>
          <ToolRow
            title="Thought record"
            sub="Seven questions, one per screen. Roughly five minutes."
            art="night"
            onPress={() => setView('record')}
          />
          <ToolRow
            title="Behavioural experiment"
            sub="Predict what will happen, do the avoided thing, record what actually did."
            art="day"
            lock={experimentsUnlocked ? undefined : 'Week 7'}
            onPress={() => experimentsUnlocked && setView('experiment')}
          />
        </View>

        {experiments.length > 0 && (
          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Past experiments</H2>
            <BodySm style={{ marginTop: space.xs, marginBottom: space.md }}>
              {EXPERIMENT_COPY.archiveIntro}
            </BodySm>
            {experiments.slice(0, 10).map((e) => (
              <View
                key={e.id}
                style={{
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.line,
                  paddingVertical: space.md,
                }}
              >
                <Caption>{e.date}</Caption>
                <BodySm style={{ color: c.ink, marginTop: 2 }}>{e.avoiding}</BodySm>
                {e.outcome ? (
                  <Row style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Caption>Predicted</Caption>
                      <BodySm>{e.prediction}</BodySm>
                      <Caption style={{ marginTop: 2 }}>{e.likelihoodBefore}% likely</Caption>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Caption>Happened</Caption>
                      <BodySm>{e.outcome}</BodySm>
                      {typeof e.likelihoodAfter === 'number' && (
                        <Caption style={{ marginTop: 2, color: c.cool }}>now {e.likelihoodAfter}%</Caption>
                      )}
                    </View>
                  </Row>
                ) : (
                  <Caption style={{ marginTop: space.xs }}>Waiting on the outcome</Caption>
                )}
              </View>
            ))}
          </View>
        )}

        {records.length > 0 && (
          <View style={{ marginTop: space.xxl }}>
            <Rule />
            <H2 style={{ marginTop: space.lg }}>Recent records</H2>
            {records.slice(0, 8).map((r) => (
              <View
                key={r.id}
                style={{
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.line,
                  paddingVertical: space.md,
                }}
              >
                <Row>
                  <Caption>{r.date}</Caption>
                  <Caption>
                    {r.emotion} {r.emotionIntensity} → {r.reRatedIntensity}
                  </Caption>
                </Row>
                <BodySm style={{ color: c.ink, marginTop: 2 }}>{r.automaticThought}</BodySm>
                {r.balancedThought ? (
                  <BodySm style={{ marginTop: space.xs }}>→ {r.balancedThought}</BodySm>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Caption style={{ marginTop: space.xxl }}>
          {thisMonth.length} record{thisMonth.length === 1 ? '' : 's'} this month
        </Caption>
        <Button
          label="Back"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        />
      </View>
    </Screen>
  );
}

function ToolRow({
  title,
  sub,
  art,
  lock,
  onPress,
}: {
  title: string;
  sub: string;
  art: AtmosphereKey;
  lock?: string;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${lock ? `, opens week ${lock}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.lg,
        paddingVertical: space.md,
        opacity: pressed ? 0.85 : lock ? 0.62 : 1,
      })}
    >
      <Atmosphere variant={art} lightX={0.4} rounded="md" scrim={false} style={{ width: 64, height: 64 }} />
      <View style={{ flex: 1 }}>
        <Row>
          <H3 style={{ flex: 1 }}>{title}</H3>
          {lock ? <Chip label={lock} /> : null}
        </Row>
        <BodySm style={{ marginTop: 2 }}>{sub}</BodySm>
      </View>
      {!lock && <Text style={[t.body, { color: c.inkFaint }]}>›</Text>}
    </Pressable>
  );
}

/* ---------- thought record ---------- */

function ThoughtRecord({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const router = useRouter();
  const add = useStore((s) => s.addThoughtRecord);
  const records = useStore((s) => s.thoughtRecords);
  const { entitled } = useEntitlement();

  const [i, setI] = useState(0);
  const [text, setText] = useState<Record<string, string>>({});
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [reRated, setReRated] = useState<number | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [openDef, setOpenDef] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const thisMonth = records.filter((r) => r.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const overLimit = !entitled && thisMonth.length >= FREE_LIMITS.thoughtRecordsPerMonth;

  /* A legitimate upgrade surface: the customer is standing at a stated boundary, having
     used the thing enough to hit it. Written as a fact with a door, not as a loss —
     nothing here is taken away, and the sentence about what stays free is not a consolation
     prize, it is the actual deal. */
  if (overLimit) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <Caption>Free tier</Caption>
          <H1 style={{ marginTop: space.xs }}>
            That is {FREE_LIMITS.thoughtRecordsPerMonth} records this month
          </H1>
          <Body style={{ marginTop: space.md }}>
            {FREE_LIMITS.thoughtRecordsPerMonth} a month is what the free tier includes, and you
            have used them. They reset at the start of next month, and everything you have
            written stays exactly where it is.
          </Body>
          <BodySm style={{ marginTop: space.md, color: c.cool }}>
            Check-ins, grounding, the hard-day path and crisis support are unaffected. Those are
            free forever and are not part of this.
          </BodySm>

          <View style={{ marginTop: space.xxl }}>
            <Button label="See Steady+" onPress={() => router.push('/paywall')} />
            <Button label="Back" variant="ghost" onPress={onDone} style={{ marginTop: space.xs }} />
          </View>
        </View>
      </Screen>
    );
  }

  if (saved) {
    const moved = (intensity ?? 0) - (reRated ?? 0);
    return (
      <Finish
        eyebrow="Thought record saved"
        figure={moved > 0 ? `−${moved}` : undefined}
        headline={moved > 0 ? 'It moved' : 'Recorded'}
        body={THOUGHT_RECORD_CLOSING}
        onDone={onDone}
      />
    );
  }

  const step = THOUGHT_RECORD_STEPS[i];
  const last = i === THOUGHT_RECORD_STEPS.length - 1;

  const valid =
    step.kind === 'emotion'
      ? emotion.trim().length > 0 && intensity !== null
      : step.kind === 'rating'
        ? reRated !== null
        : step.kind === 'distortions'
          ? true
          : (text[step.key] ?? '').trim().length > 0;

  const save = () => {
    add({
      situation: text.situation ?? '',
      emotion: emotion.trim(),
      emotionIntensity: intensity ?? 0,
      automaticThought: text.automaticThought ?? '',
      distortions: picked,
      evidenceFor: text.evidenceFor ?? '',
      evidenceAgainst: text.evidenceAgainst ?? '',
      balancedThought: text.balancedThought ?? '',
      reRatedIntensity: reRated ?? 0,
    });
    setSaved(true);
  };

  return (
    <Screen>
      <View style={{ marginTop: space.xl }}>
        <Steps n={THOUGHT_RECORD_STEPS.length} i={i} />
        <Caption>
          {i + 1} of {THOUGHT_RECORD_STEPS.length}
        </Caption>
        <H1 style={{ marginTop: space.xs, marginBottom: space.xl }}>{step.question}</H1>

        {step.kind === 'text' && (
          <TextInput
            value={text[step.key] ?? ''}
            onChangeText={(v) => setText({ ...text, [step.key]: v })}
            multiline
            placeholder="Write as much or as little as you want"
            placeholderTextColor={c.inkFaint}
            style={[inputStyle(c), { minHeight: 130, textAlignVertical: 'top' }]}
          />
        )}

        {step.kind === 'emotion' && (
          <>
            <TextInput
              value={emotion}
              onChangeText={setEmotion}
              placeholder="shame, anxiety, disgust, dread"
              placeholderTextColor={c.inkFaint}
              style={inputStyle(c)}
            />
            <View style={{ marginTop: space.xl }}>
              <H3>Intensity</H3>
              <Caption style={{ marginTop: 2, marginBottom: space.md }}>
                Tap 0–10. This records as 0–100.
              </Caption>
              <Scale value={intensity} onChange={setIntensity} min={0} max={10} lowLabel="0" highLabel="100" />
            </View>
          </>
        )}

        {step.kind === 'rating' && (
          <Scale value={reRated} onChange={setReRated} min={0} max={10} lowLabel="0" highLabel="100" />
        )}

        {step.kind === 'distortions' && (
          <View style={{ gap: space.sm }}>
            {DISTORTIONS.map((d) => {
              const on = picked.includes(d.name);
              const open = openDef === d.name;
              return (
                <Pressable
                  key={d.name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setPicked(on ? picked.filter((x) => x !== d.name) : [...picked, d.name])}
                  onLongPress={() => setOpenDef(open ? null : d.name)}
                  style={{
                    borderWidth: on ? 1.5 : StyleSheet.hairlineWidth,
                    borderColor: on ? c.accent : c.line,
                    backgroundColor: on ? c.accentDim : 'transparent',
                    borderRadius: radius.md,
                    padding: space.md,
                  }}
                >
                  <Row>
                    <BodySm style={{ flex: 1, color: on ? c.accentDeep : c.ink }}>{d.name}</BodySm>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`What is ${d.name}`}
                      onPress={() => setOpenDef(open ? null : d.name)}
                      hitSlop={10}
                    >
                      <Caption>{open ? 'hide' : 'what?'}</Caption>
                    </Pressable>
                  </Row>
                  {open && <Caption style={{ marginTop: space.xs }}>{d.definition}</Caption>}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: space.xxl }}>
          <Button label={last ? 'Save' : 'Next'} disabled={!valid} onPress={() => (last ? save() : setI(i + 1))} />
          <Button
            label={i === 0 ? 'Cancel' : 'Back'}
            variant="ghost"
            onPress={() => (i === 0 ? onDone() : setI(i - 1))}
            style={{ marginTop: space.xs }}
          />
        </View>
      </View>
    </Screen>
  );
}

/* ---------- behavioural experiment ---------- */

function Experiment({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const experiments = useStore((s) => s.experiments);
  const addExperiment = useStore((s) => s.addExperiment);
  const completeExperiment = useStore((s) => s.completeExperiment);

  const pending = experiments.find((e) => !e.outcome);
  const [i, setI] = useState(0);
  const [vals, setVals] = useState<Record<string, string | number>>({});
  const [done, setDone] = useState<null | { movedTo: number; from: number }>(null);

  // If an experiment is waiting on its outcome, resume there rather than starting a new
  // one — the whole design depends on the prediction being fixed before the event.
  const fields = pending
    ? EXPERIMENT_FIELDS.filter((f) => f.afterEvent)
    : EXPERIMENT_FIELDS.filter((f) => !f.afterEvent);

  const field = fields[i];
  const last = i === fields.length - 1;
  const val = vals[field.key];
  const valid = field.kind === 'percent' ? typeof val === 'number' : String(val ?? '').trim().length > 0;

  if (done) {
    const drop = done.from - done.movedTo;
    return (
      <Finish
        eyebrow="Experiment closed"
        figure={drop > 0 ? `${done.from}% → ${done.movedTo}%` : undefined}
        headline={drop > 0 ? 'The prediction was high' : 'Recorded'}
        body={
          drop > 0
            ? 'That gap is the useful part. You did the avoided thing and the thing you were braced for did not arrive at the size you expected. One of these does not settle it. A run of them does.'
            : 'Recorded exactly as it happened. Experiments that do not go the predicted way are still evidence, and they are the ones worth keeping.'
        }
        art="day"
        onDone={onDone}
      />
    );
  }

  const submit = () => {
    if (pending) {
      const after = Number(vals.likelihoodAfter ?? 0);
      completeExperiment(pending.id, {
        outcome: String(vals.outcome ?? ''),
        comparison: String(vals.comparison ?? ''),
        likelihoodAfter: after,
        conclusion: String(vals.conclusion ?? ''),
      });
      setDone({ from: pending.likelihoodBefore, movedTo: after });
      return;
    }
    addExperiment({
      avoiding: String(vals.avoiding ?? ''),
      prediction: String(vals.prediction ?? ''),
      likelihoodBefore: Number(vals.likelihoodBefore ?? 0),
      safetyBehavioursDropped: String(vals.safetyBehavioursDropped ?? ''),
    });
    onDone();
  };

  return (
    <Screen>
      <View style={{ marginTop: space.xl }}>
        <Steps n={fields.length} i={i} />
        <Caption>
          {pending ? 'Recording the outcome' : 'Setting it up'} · {i + 1} of {fields.length}
        </Caption>
        <H1 style={{ marginTop: space.xs }}>{field.question}</H1>
        {field.hint ? <BodySm style={{ marginTop: space.sm }}>{field.hint}</BodySm> : null}

        {pending && i === 0 && (
          <View
            style={{
              marginTop: space.lg,
              borderRadius: radius.card,
              backgroundColor: c.accentDim,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.line,
              padding: space.lg,
            }}
          >
            <Label style={{ color: c.accentDeep }}>You predicted</Label>
            <Body style={{ marginTop: space.xs }}>{pending.prediction}</Body>
            <Caption style={{ marginTop: space.xs }}>{pending.likelihoodBefore}% likely</Caption>
          </View>
        )}

        <View style={{ marginTop: space.xl }}>
          {field.kind === 'text' ? (
            <TextInput
              value={String(vals[field.key] ?? '')}
              onChangeText={(v) => setVals({ ...vals, [field.key]: v })}
              multiline
              placeholder="Write as much or as little as you want"
              placeholderTextColor={c.inkFaint}
              style={[inputStyle(c), { minHeight: 130, textAlignVertical: 'top' }]}
            />
          ) : (
            <>
              <Scale
                value={typeof val === 'number' ? Math.round(val / 10) : null}
                onChange={(n) => setVals({ ...vals, [field.key]: n * 10 })}
                min={0}
                max={10}
                lowLabel="0%"
                highLabel="100%"
              />
              <Caption style={{ marginTop: space.sm }}>
                {typeof val === 'number' ? `${val}%` : 'Tap a number'}
              </Caption>
            </>
          )}
        </View>

        {!pending && last && (
          <View style={{ marginTop: space.xl }}>
            <Rule />
            <Body style={{ marginTop: space.lg }}>{EXPERIMENT_COPY.doItNow}</Body>
          </View>
        )}

        <View style={{ marginTop: space.xxl }}>
          <Button
            label={last ? (pending ? 'Save' : 'Save and go do it') : 'Next'}
            disabled={!valid}
            onPress={() => (last ? submit() : setI(i + 1))}
          />
          <Button
            label={i === 0 ? 'Cancel' : 'Back'}
            variant="ghost"
            onPress={() => (i === 0 ? onDone() : setI(i - 1))}
            style={{ marginTop: space.xs }}
          />
        </View>
      </View>
    </Screen>
  );
}

function inputStyle(c: ReturnType<typeof useTheme>) {
  return {
    ...t.body,
    marginTop: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.lineStrong,
    paddingVertical: space.sm,
    color: c.ink,
    minHeight: 48,
  };
}
