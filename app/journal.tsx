import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Field, H1, H2, H3, Body, BodySm, Caption, Chip, Label, Row, Rule, useTheme,
} from '../components/ui';
import { Frost, Ground, ListRow, LevelBar, Steps, TopBar, Explain, STRENGTH_WORDS, CHANCE_WORDS } from '../components/frost';
import { Finish } from '../components/Finish';
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
import { formatLogDate } from '../lib/dates';
import { NAMES, EXPLAIN } from '../content/names';

type View_ = 'home' | 'record' | 'experiment';

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
    <Ground>
      <TopBar onBack={() => router.back()} />

      <H1 style={{ marginTop: space.lg }}>Writing</H1>
      <BodySm style={{ marginTop: space.sm }}>
        One of these takes a single thought apart. The other tests what you think will
        happen against what actually does. Both are writing, and the writing is the part
        that works.
      </BodySm>

      {records.length > 0 && (
        <Frost style={{ marginTop: space.xl }}>
          <Row style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.hero, { color: c.ink, fontSize: 52, lineHeight: 56 }]}>{records.length}</Text>
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
        </Frost>
      )}

      {pending && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setView('experiment')}
          style={({ pressed }) => ({
            marginTop: space.md,
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
          <Caption style={{ marginTop: space.sm }}>Write down what actually happened ›</Caption>
        </Pressable>
      )}

      <Frost style={{ marginTop: space.md }}>
        <ListRow
          glyph="page"
          title={NAMES.thought.title}
          sub={NAMES.thought.sub}
          first
          onPress={() => setView('record')}
        />
        <ListRow
          glyph="flask"
          title={NAMES.experiment.title}
          sub={NAMES.experiment.sub}
          lock={experimentsUnlocked ? undefined : 'Week 7'}
          onPress={() => experimentsUnlocked && setView('experiment')}
        />
      </Frost>

      {experiments.length > 0 && (
        <View style={{ marginTop: space.xl }}>
          <H2>Predictions you have tested</H2>
          <BodySm style={{ marginTop: space.xs, marginBottom: space.sm }}>
            {EXPERIMENT_COPY.archiveIntro}
          </BodySm>
          <Frost>
            {experiments.slice(0, 10).map((e, i) => (
              <View
                key={e.id}
                style={{
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: c.line,
                  paddingVertical: space.md,
                }}
              >
                <Caption>{formatLogDate(e.date)}</Caption>
                <BodySm style={{ color: c.ink, marginTop: 2 }}>{e.avoiding}</BodySm>
                {e.outcome ? (
                  <Row style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Caption>You guessed</Caption>
                      <BodySm>{e.prediction}</BodySm>
                      <Caption style={{ marginTop: 2 }}>{e.likelihoodBefore}% likely</Caption>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Caption>What happened</Caption>
                      <BodySm>{e.outcome}</BodySm>
                      {typeof e.likelihoodAfter === 'number' && (
                        <Caption style={{ marginTop: 2, color: c.cool }}>now {e.likelihoodAfter}%</Caption>
                      )}
                    </View>
                  </Row>
                ) : (
                  <Caption style={{ marginTop: space.xs }}>Waiting on what happens</Caption>
                )}
              </View>
            ))}
          </Frost>
        </View>
      )}

      {records.length > 0 && (
        <View style={{ marginTop: space.xl }}>
          <H2>Thoughts you have taken apart</H2>
          <Frost style={{ marginTop: space.sm }}>
            {records.slice(0, 8).map((r, i) => (
              <View
                key={r.id}
                style={{
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: c.line,
                  paddingVertical: space.md,
                }}
              >
                <Row>
                  <Caption>{formatLogDate(r.date)}</Caption>
                  <Caption>
                    {r.emotion}, {r.emotionIntensity} to {r.reRatedIntensity}
                  </Caption>
                </Row>
                <BodySm style={{ color: c.ink, marginTop: 2 }}>{r.automaticThought}</BodySm>
                {r.balancedThought ? (
                  <BodySm style={{ marginTop: space.xs }}>→ {r.balancedThought}</BodySm>
                ) : null}
              </View>
            ))}
          </Frost>
        </View>
      )}

      <Caption style={{ marginTop: space.xl }}>
        {thisMonth.length} record{thisMonth.length === 1 ? '' : 's'} this month
      </Caption>
    </Ground>
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
      <Ground>
        <View style={{ marginTop: space.xxxl }}>
          <Caption>The free part</Caption>
          <H1 style={{ marginTop: space.xs }}>
            That is {FREE_LIMITS.thoughtRecordsPerMonth} records this month
          </H1>
          <Body style={{ marginTop: space.md }}>
            {FREE_LIMITS.thoughtRecordsPerMonth} a month is what the free part includes, and you
            have used them. They start again at the beginning of next month. Everything you
            have written stays exactly where it is.
          </Body>
          <BodySm style={{ marginTop: space.md, color: c.cool }}>
            Checking in, calming down, the hard-day path and crisis support are not affected.
            Those are free forever and are not part of this.
          </BodySm>

          <View style={{ marginTop: space.xxl }}>
            <Button label="See Steady+" onPress={() => router.push('/paywall')} />
            <Button label="Back" variant="ghost" onPress={onDone} style={{ marginTop: space.xs }} />
          </View>
        </View>
      </Ground>
    );
  }

  if (saved) {
    const moved = (intensity ?? 0) - (reRated ?? 0);
    return (
      <Finish
        eyebrow="Saved"
        figureText={moved > 0 ? `−${moved}` : undefined}
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
    <Ground>
      <View style={{ marginTop: space.xl }}>
        <Steps total={THOUGHT_RECORD_STEPS.length} current={i} />
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
              {/* The old caption here read "Tap 0-10. This records as 0-100." That is a
                  storage detail, and putting it on screen asks the reader to hold two
                  scales in their head to answer one question. */}
              <H3>How strong was it?</H3>
              <View style={{ marginTop: space.md }}>
                <LevelBar value={intensity} onChange={setIntensity} words={STRENGTH_WORDS} />
              </View>
            </View>
          </>
        )}

        {step.kind === 'rating' && (
          <LevelBar value={reRated} onChange={setReRated} words={STRENGTH_WORDS} />
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
    </Ground>
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
        eyebrow="Prediction tested"
        figureText={drop > 0 ? `${done.from}% → ${done.movedTo}%` : undefined}
        headline={drop > 0 ? 'The prediction was high' : 'Recorded'}
        body={
          drop > 0
            ? 'That gap is the useful part. You did the avoided thing and the thing you were braced for did not arrive at the size you expected. One of these does not settle it. A run of them does.'
            : 'Recorded exactly as it happened. Experiments that do not go the predicted way are still evidence, and they are the ones worth keeping.'
        }
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
    <Ground>
      <View style={{ marginTop: space.xl }}>
        <Steps total={fields.length} current={i} />
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
              <LevelBar
                value={typeof val === 'number' ? Math.round(val / 10) : null}
                onChange={(n) => setVals({ ...vals, [field.key]: n * 10 })}
                words={CHANCE_WORDS}
              />
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
    </Ground>
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
