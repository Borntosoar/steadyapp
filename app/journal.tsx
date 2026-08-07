import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Card, Button, H1, H2, H3, Body, BodySm, Caption, Chip, Row, Scale, useTheme,
} from '../components/ui';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useEntitlement, FREE_LIMITS } from '../lib/entitlement';
import {
  THOUGHT_RECORD_STEPS, THOUGHT_RECORD_CLOSING, DISTORTIONS, EXPERIMENT_FIELDS, EXPERIMENT_COPY,
} from '../content/exercises.ts';
import { phaseForWeek } from '../lib/protocol';

type View_ = 'home' | 'record' | 'experiment' | 'archive';

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

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Journal</H1>
        <BodySm style={{ marginTop: space.sm, marginBottom: space.lg }}>
          Thought records take a thought apart. Experiments test one against reality.
        </BodySm>

        <Card>
          <H3>Thought record</H3>
          <BodySm style={{ marginTop: space.xs }}>
            Seven questions, one per screen. Roughly five minutes.
          </BodySm>
          <Button label="Start a record" onPress={() => setView('record')} style={{ marginTop: space.md }} />
        </Card>

        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <H3>Behavioural experiment</H3>
              <BodySm style={{ marginTop: space.xs }}>
                Predict what will happen, do the avoided thing, record what actually did.
              </BodySm>
            </View>
            {!experimentsUnlocked && <Chip label={`Week 7`} />}
          </Row>
          <Button
            label={experimentsUnlocked ? 'Start an experiment' : 'Opens in phase 3'}
            variant={experimentsUnlocked ? 'primary' : 'secondary'}
            disabled={!experimentsUnlocked}
            onPress={() => setView('experiment')}
            style={{ marginTop: space.md }}
          />
        </Card>

        {experiments.length > 0 && (
          <Card>
            <H3>Past experiments</H3>
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
                        <Caption style={{ marginTop: 2 }}>now {e.likelihoodAfter}%</Caption>
                      )}
                    </View>
                  </Row>
                ) : (
                  <Caption style={{ marginTop: space.xs }}>Waiting on the outcome</Caption>
                )}
              </View>
            ))}
          </Card>
        )}

        {records.length > 0 && (
          <Card>
            <H3>Recent records</H3>
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
          </Card>
        )}

        <Caption>
          {thisMonth.length} record{thisMonth.length === 1 ? '' : 's'} this month
        </Caption>
        <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.md }} />
      </View>
    </Screen>
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

  if (overLimit) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>Records this month</H1>
          <Card tone="accent" style={{ marginTop: space.lg }}>
            <Body>
              The free tier includes {FREE_LIMITS.thoughtRecordsPerMonth} thought records a month
              and you have used them. Grounding, check-ins, and support are unaffected — those stay
              free.
            </Body>
          </Card>
          <Button label="See Steady+" onPress={() => router.push('/paywall')} />
          <Button label="Back" variant="ghost" onPress={onDone} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  if (saved) {
    const moved = (intensity ?? 0) - (reRated ?? 0);
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          {moved > 0 ? (
            <>
              <Text style={[t.display, { color: c.accentDeep }]}>−{moved}</Text>
              <H2 style={{ marginTop: space.sm }}>It moved</H2>
            </>
          ) : (
            <H2>Recorded</H2>
          )}
          <Body style={{ marginTop: space.md, color: c.inkSoft }}>{THOUGHT_RECORD_CLOSING}</Body>
          <Button label="Done" onPress={onDone} style={{ marginTop: space.xl }} />
        </View>
      </Screen>
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
      <View style={{ marginTop: space.xxl }}>
        <Caption>
          {i + 1} of {THOUGHT_RECORD_STEPS.length}
        </Caption>
        <H2 style={{ marginTop: space.xs, marginBottom: space.lg }}>{step.question}</H2>

        <Card>
          {step.kind === 'text' && (
            <TextInput
              value={text[step.key] ?? ''}
              onChangeText={(v) => setText({ ...text, [step.key]: v })}
              multiline
              placeholder="Write as much or as little as you want"
              placeholderTextColor={c.inkFaint}
              style={[inputStyle(c), { minHeight: 110, textAlignVertical: 'top' }]}
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
              <View style={{ marginTop: space.lg }}>
                <Caption>Intensity</Caption>
                <View style={{ marginTop: space.sm }}>
                  <Scale value={intensity} onChange={setIntensity} min={0} max={10} lowLabel="0" highLabel="100" />
                </View>
                <Caption>Tap 0–10; this records as 0–100.</Caption>
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
                    onPress={() =>
                      setPicked(on ? picked.filter((x) => x !== d.name) : [...picked, d.name])
                    }
                    onLongPress={() => setOpenDef(open ? null : d.name)}
                    style={{
                      borderWidth: on ? 1.5 : StyleSheet.hairlineWidth,
                      borderColor: on ? c.accent : c.line,
                      backgroundColor: on ? c.accentDim : c.bg,
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
        </Card>

        <Button
          label={last ? 'Save' : 'Next'}
          disabled={!valid}
          onPress={() => (last ? save() : setI(i + 1))}
        />
        <Button
          label={i === 0 ? 'Cancel' : 'Back'}
          variant="ghost"
          onPress={() => (i === 0 ? onDone() : setI(i - 1))}
          style={{ marginTop: space.sm }}
        />
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

  // If an experiment is waiting on its outcome, resume there rather than starting a new
  // one — the whole design depends on the prediction being fixed before the event.
  const fields = pending
    ? EXPERIMENT_FIELDS.filter((f) => f.afterEvent)
    : EXPERIMENT_FIELDS.filter((f) => !f.afterEvent);

  const field = fields[i];
  const last = i === fields.length - 1;
  const val = vals[field.key];
  const valid = field.kind === 'percent' ? typeof val === 'number' : String(val ?? '').trim().length > 0;

  const submit = () => {
    if (pending) {
      completeExperiment(pending.id, {
        outcome: String(vals.outcome ?? ''),
        comparison: String(vals.comparison ?? ''),
        likelihoodAfter: Number(vals.likelihoodAfter ?? 0),
        conclusion: String(vals.conclusion ?? ''),
      });
    } else {
      addExperiment({
        avoiding: String(vals.avoiding ?? ''),
        prediction: String(vals.prediction ?? ''),
        likelihoodBefore: Number(vals.likelihoodBefore ?? 0),
        safetyBehavioursDropped: String(vals.safetyBehavioursDropped ?? ''),
      });
    }
    onDone();
  };

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <Caption>
          {pending ? 'Recording the outcome' : 'Setting it up'} · {i + 1} of {fields.length}
        </Caption>
        <H2 style={{ marginTop: space.xs }}>{field.question}</H2>
        {field.hint ? (
          <BodySm style={{ marginTop: space.sm }}>{field.hint}</BodySm>
        ) : null}

        {pending && i === 0 && (
          <Card tone="accent" style={{ marginTop: space.md }}>
            <Caption>You predicted</Caption>
            <Body style={{ marginTop: space.xs }}>{pending.prediction}</Body>
            <Caption style={{ marginTop: space.xs }}>{pending.likelihoodBefore}% likely</Caption>
          </Card>
        )}

        <Card style={{ marginTop: space.md }}>
          {field.kind === 'text' ? (
            <TextInput
              value={String(vals[field.key] ?? '')}
              onChangeText={(v) => setVals({ ...vals, [field.key]: v })}
              multiline
              placeholderTextColor={c.inkFaint}
              style={[inputStyle(c), { minHeight: 110, textAlignVertical: 'top' }]}
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
        </Card>

        {!pending && last && (
          <Card tone="accent">
            <Body>{EXPERIMENT_COPY.doItNow}</Body>
          </Card>
        )}

        <Button
          label={last ? (pending ? 'Save' : 'Save and go do it') : 'Next'}
          disabled={!valid}
          onPress={() => (last ? submit() : setI(i + 1))}
        />
        <Button
          label={i === 0 ? 'Cancel' : 'Back'}
          variant="ghost"
          onPress={() => (i === 0 ? onDone() : setI(i - 1))}
          style={{ marginTop: space.sm }}
        />
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
