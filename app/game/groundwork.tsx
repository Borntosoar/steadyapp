import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, BodySm, Caption, H2, Button, useTheme } from '../../components/ui';
import { Frost, TopBar } from '../../components/frost';
import { Finish } from '../../components/Finish';
import { Atmosphere } from '../../components/Atmosphere';
import { Motif } from '../../components/Motif';
import { groundFor } from '../../lib/motif.ts';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { haptic } from '../../hooks/haptics';
import {
  deal, loadOf, holds, groundLine, CAPACITY, WEIGHT,
  KEPT_LABELS, KEPT_REPLY, type Action, type Kept,
} from '../../content/groundwork.ts';
import { PASS_LABEL, PASS_ACKNOWLEDGEMENT } from '../../content/toward.ts';

/* Groundwork — behavioural activation.
 *
 * Two halves, and the second one is the important one.
 *
 *   TODAY. Lay out tomorrow. A hand of ordinary actions, each with a weight, and a ground
 *   that holds four. Three small things fit. One large thing plus anything does not, and it
 *   gives way in front of you before you have committed to it. Nobody is told they
 *   overreached — that is the difference between a mechanic and a scold.
 *
 *   TOMORROW. It asks what happened. Three answers, and none of them is a failure: it
 *   happened, it did not, or something else did instead. A "no" is answered with a question
 *   about the SIZE of the thing, because the size is what the plan got wrong. The person is
 *   never the variable.
 *
 * WHY THE WEIGHTS ARE IN content/groundwork.ts AND NOT HERE. They are the lesson. Graded task
 * assignment only works if the grading is real, so the capacity is content rather than a
 * layout constant somebody tunes to make the screen feel nicer. */

type Phase = 'yesterday' | 'plan' | 'keep' | 'done';

export default function Groundwork() {
  const router = useRouter();
  const c = useTheme();
  const logPractice = useStore((s) => s.logPractice);
  const keepCommitment = useStore((s) => s.keepCommitment);
  const answerCommitment = useStore((s) => s.answerCommitment);
  const commitments = useStore((s) => s.commitments);

  /* The oldest unanswered commitment, if there is one. Asked before anything else, because
     a game that plans a new day without ever asking about the last one is doing the easy
     half of this twice. */
  const open = useMemo(() => commitments.find((x) => !x.kept) ?? null, [commitments]);

  const [phase, setPhase] = useState<Phase>(open ? 'yesterday' : 'plan');
  const [placed, setPlaced] = useState<Action[]>([]);
  const [kept, setKept] = useState<Action | null>(null);

  const hand = useMemo(() => deal(), []);
  const ground = groundFor(phase === 'yesterday' ? 'evening' : 'morning', c.isDark);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere variant={ground} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />
      <Motif kind="paths" seed={phase} color={c.ink} isDark={c.isDark} insetTop={110} />

      {phase === 'yesterday' && open && (
        <Yesterday
          action={open.action}
          onBack={() => router.back()}
          onAnswer={(k) => {
            answerCommitment(open.id, k);
            setPhase('plan');
          }}
        />
      )}

      {phase === 'plan' && (
        <Plan
          hand={hand}
          placed={placed}
          onBack={() => router.back()}
          onToggle={(a) => {
            haptic.select();
            setPlaced((p) =>
              p.some((x) => x.id === a.id) ? p.filter((x) => x.id !== a.id) : [...p, a],
            );
          }}
          onDone={() => setPhase('keep')}
        />
      )}

      {phase === 'keep' && (
        <KeepOne
          placed={placed}
          onBack={() => router.back()}
          onKeep={(a) => {
            keepCommitment(a.text, a.size);
            logPractice('groundwork');
            setKept(a);
            setPhase('done');
          }}
        />
      )}

      {phase === 'done' && (
        <Finish
          eyebrow="Tomorrow"
          figure={null}
          headline={kept ? 'One thing, written down.' : 'Nothing kept.'}
          body={
            kept
              ? 'It will ask what happened next time you open this. Whatever the answer is, it is information about the size of the thing.'
              : 'That is allowed. The ground is still there tomorrow.'
          }
          onDone={() => router.back()}
          doneLabel="Done"
          variant={ground}
        >
          {kept && (
            <View style={{ paddingTop: space.lg, width: '100%' }}>
              <Frost>
                <Body>{kept.text}</Body>
              </Frost>
            </View>
          )}
        </Finish>
      )}
    </View>
  );
}

/* ---------- layout ---------- */

function Stage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: '100%',
          maxWidth: LAYOUT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: space.lg,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}

/* ---------- what happened to the last one ---------- */

function Yesterday({
  action, onBack, onAnswer,
}: { action: string; onBack: () => void; onAnswer: (k: Kept) => void }) {
  const c = useTheme();
  const [answered, setAnswered] = useState<Kept | null>(null);

  return (
    <Stage>
      <TopBar onBack={onBack} />
      <View style={{ gap: space.md, paddingTop: space.xl }}>
        <Caption>Last time you kept this</Caption>
        <Frost>
          <Body>{action}</Body>
        </Frost>
        {!answered && <BodySm>No wrong answer here. It is a fact about the plan.</BodySm>}
      </View>

      {!answered && (
        <View style={{ gap: space.sm, paddingTop: space.xl }}>
          {(Object.keys(KEPT_LABELS) as Kept[]).map((k) => (
            <Pressable
              key={k}
              accessibilityRole="button"
              onPress={() => {
                haptic.select();
                setAnswered(k);
              }}
              style={{
                backgroundColor: c.surfaceSolid,
                borderColor: c.line,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderRadius: radius.md,
                padding: space.lg,
                minHeight: 54,
                justifyContent: 'center',
              }}
            >
              <Text style={[t.body, { color: c.ink }]}>{KEPT_LABELS[k]}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {answered && (
        <View style={{ gap: space.lg, paddingTop: space.xl }}>
          <Text style={[t.body, { color: c.ink }]}>{KEPT_REPLY[answered]}</Text>
          <Button label="Lay out tomorrow" onPress={() => onAnswer(answered)} />
        </View>
      )}
    </Stage>
  );
}

/* ---------- laying out tomorrow ---------- */

function Plan({
  hand, placed, onBack, onToggle, onDone,
}: {
  hand: Action[];
  placed: Action[];
  onBack: () => void;
  onToggle: (a: Action) => void;
  onDone: () => void;
}) {
  const c = useTheme();
  const load = loadOf(placed);
  const over = !holds(placed);

  return (
    <Stage>
      <TopBar onBack={onBack} />
      <View style={{ gap: space.sm, paddingTop: space.xl }}>
        <H2>Lay out tomorrow.</H2>
        <BodySm>Pick what you think fits. You can take things off again.</BodySm>
      </View>

      {/* THE GROUND. The whole mechanism is in this bar: it fills, and when the day is
          overloaded it does not turn red or say anything about the person — it stops being
          continuous, which reads as giving way. Nobody has committed to anything yet, so the
          lesson costs nothing when it lands. */}
      <View style={{ paddingTop: space.xl, gap: space.sm }}>
        <View
          style={{
            height: 10,
            borderRadius: radius.pill,
            backgroundColor: c.surfaceStrong,
            flexDirection: 'row',
            gap: 3,
            padding: 2,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: Math.max(CAPACITY, load) }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                borderRadius: radius.pill,
                backgroundColor:
                  i >= load ? 'transparent' : i >= CAPACITY ? c.rose : c.accent,
              }}
            />
          ))}
        </View>
        <Caption style={{ color: over ? c.rose : c.inkFaint }}>{groundLine(placed)}</Caption>
      </View>

      <View style={{ gap: space.sm, paddingTop: space.lg }}>
        {hand.map((a) => {
          const on = placed.some((x) => x.id === a.id);
          return (
            <Pressable
              key={a.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${a.text}. Weight ${WEIGHT[a.size]}.`}
              onPress={() => onToggle(a)}
              style={{
                backgroundColor: on ? c.accentDim : c.surfaceSolid,
                borderColor: on ? c.accent : c.line,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderRadius: radius.md,
                padding: space.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
              }}
            >
              <Text style={[t.body, { color: c.ink, flex: 1 }]}>{a.text}</Text>
              {/* Weight shown as pips rather than the word "large". A label ranks the
                  action; pips describe what it costs to start, which is the only thing the
                  size means here. */}
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {Array.from({ length: WEIGHT[a.size] }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: on ? c.accent : c.inkFaint,
                    }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingTop: space.xl, gap: space.sm }}>
        <Button
          label={placed.length ? 'That is tomorrow' : 'Nothing tomorrow'}
          onPress={onDone}
        />
      </View>
    </Stage>
  );
}

/* ---------- keeping one ----------
 *
 * The plan is not the intervention; the one thing that actually gets done is. So the session
 * ends by narrowing to a single action, and the smallest one is offered first — not because
 * ambition is bad but because the first rung has to be low enough that missing it is not
 * available as more evidence. */

function KeepOne({
  placed, onBack, onKeep,
}: { placed: Action[]; onBack: () => void; onKeep: (a: Action) => void }) {
  const c = useTheme();
  const sorted = [...placed].sort((a, b) => WEIGHT[a.size] - WEIGHT[b.size]);

  if (!placed.length) {
    return (
      <Stage>
        <TopBar onBack={onBack} />
        <View style={{ gap: space.lg, paddingTop: space.xxl }}>
          <H2>Nothing on it.</H2>
          <BodySm>{PASS_ACKNOWLEDGEMENT}</BodySm>
          <Button label="Done" onPress={onBack} />
        </View>
      </Stage>
    );
  }

  return (
    <Stage>
      <TopBar onBack={onBack} />
      <View style={{ gap: space.sm, paddingTop: space.xl }}>
        <H2>Keep one.</H2>
        <BodySm>
          The rest can happen or not. This is the one it will ask about, so the smallest is
          usually the right answer.
        </BodySm>
      </View>

      <View style={{ gap: space.sm, paddingTop: space.lg }}>
        {sorted.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            onPress={() => onKeep(a)}
            style={{
              backgroundColor: c.surfaceSolid,
              borderColor: c.line,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderRadius: radius.md,
              padding: space.lg,
              minHeight: 54,
              justifyContent: 'center',
            }}
          >
            <Text style={[t.body, { color: c.ink }]}>{a.text}</Text>
          </Pressable>
        ))}
        <View style={{ paddingTop: space.md, alignItems: 'center' }}>
          <Button label={PASS_LABEL} variant="ghost" onPress={onBack} />
        </View>
      </View>
    </Stage>
  );
}
