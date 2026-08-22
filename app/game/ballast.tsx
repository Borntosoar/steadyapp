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
  BELIEFS, DISCOUNTS, STRUCK, factsFor, ballastLine, BALLAST_CLOSE,
  type Belief, type Fact,
} from '../../content/ballast.ts';
import { PASS_LABEL, PASS_ACKNOWLEDGEMENT } from '../../content/toward.ts';

/* Ballast — a positive data log, built around the thing that normally stops one working.
 *
 * Pick the sentence you carry. Pick out the small things that actually happened. Then each
 * one comes back with the line your mind would use to throw it away — already written — and
 * the only move is to let it stand or strike it out.
 *
 * WHY THE DISCOUNT IS THE GAME AND THE COLLECTING IS NOT. Every app that asks you to list
 * good things is doing the collecting half. It does nothing, because the belief does not
 * live in the absence of evidence — it lives in the filter that deletes the evidence on the
 * way past. Putting the filter's own sentence on screen, in print, is most of the effect;
 * being allowed to strike it out is the rest.
 *
 * WHAT THIS SCREEN MUST NEVER DO. Praise the deed. "Well done for replying to that message"
 * hands the authority over what counts back to somebody outside the person, which is exactly
 * what this game is trying to return to them. Every reply here answers the DISCOUNT, not the
 * action. And nothing anywhere claims the belief has moved — one session does not do that,
 * and saying it would be the most damaging sentence available here. */

type Phase = 'belief' | 'facts' | 'sorting' | 'done';

export default function Ballast() {
  const router = useRouter();
  const c = useTheme();
  const logPractice = useStore((s) => s.logPractice);

  const [phase, setPhase] = useState<Phase>('belief');
  const [belief, setBelief] = useState<Belief | null>(null);
  const [picked, setPicked] = useState<Fact[]>([]);
  const [index, setIndex] = useState(0);
  const [kept, setKept] = useState<Fact[]>([]);

  const facts = useMemo(() => (belief ? factsFor(belief.id) : []), [belief?.id]);
  const ground = groundFor(belief?.mood ?? 'evening', c.isDark);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere variant={ground} rounded="none" scrim={false} style={StyleSheet.absoluteFill as never} />
      <Motif
        kind={belief?.motif ?? 'rings'}
        seed={belief?.id ?? 'ballast'}
        color={c.ink}
        isDark={c.isDark}
        insetTop={110}
      />

      {phase === 'belief' && (
        <PickBelief
          onBack={() => router.back()}
          onPick={(b) => {
            haptic.select();
            setBelief(b);
            setPhase('facts');
          }}
        />
      )}

      {phase === 'facts' && belief && (
        <PickFacts
          belief={belief}
          facts={facts}
          picked={picked}
          onBack={() => router.back()}
          onToggle={(f) => {
            haptic.select();
            setPicked((p) => (p.some((x) => x.id === f.id) ? p.filter((x) => x.id !== f.id) : [...p, f]));
          }}
          onDone={() => {
            if (!picked.length) {
              logPractice('ballast');
              setPhase('done');
              return;
            }
            setPhase('sorting');
          }}
        />
      )}

      {phase === 'sorting' && belief && (
        <Sorting
          key={picked[index]?.id}
          fact={picked[index]}
          onBack={() => router.back()}
          onResolve={(keep) => {
            if (keep) setKept((k) => [...k, picked[index]]);
            if (index + 1 < picked.length) setIndex(index + 1);
            else {
              logPractice('ballast');
              setPhase('done');
            }
          }}
        />
      )}

      {phase === 'done' && (
        <Finish
          eyebrow={belief ? belief.text : 'Ballast'}
          figure={null}
          headline={ballastLine(kept.length, picked.length)}
          body={BALLAST_CLOSE}
          onDone={() => router.back()}
          doneLabel="Done"
          variant={ground}
        >
          {kept.length > 0 && (
            <View style={{ paddingTop: space.lg, width: '100%', gap: space.sm }}>
              {kept.map((f) => (
                <Text key={f.id} style={[t.bodySm, { color: c.ink }]}>
                  {f.text}
                </Text>
              ))}
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

/* ---------- the sentence ---------- */

function PickBelief({ onBack, onPick }: { onBack: () => void; onPick: (b: Belief) => void }) {
  const c = useTheme();
  return (
    <Stage>
      <TopBar onBack={onBack} title="Ballast" />
      <View style={{ gap: space.sm, paddingTop: space.xl, paddingBottom: space.lg }}>
        <H2>Which one do you say to yourself?</H2>
        <BodySm>Whichever is closest. It is not going anywhere by the end of this.</BodySm>
      </View>

      <View style={{ gap: space.sm }}>
        {BELIEFS.map((b) => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.text}
            onPress={() => onPick(b)}
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
            <Text style={[t.body, { color: c.ink }]}>{b.text}</Text>
          </Pressable>
        ))}
        <View style={{ paddingTop: space.md, alignItems: 'center' }}>
          <Button label={PASS_LABEL} variant="ghost" onPress={onBack} />
        </View>
      </View>
    </Stage>
  );
}

/* ---------- what actually happened ---------- */

function PickFacts({
  belief, facts, picked, onBack, onToggle, onDone,
}: {
  belief: Belief;
  facts: Fact[];
  picked: Fact[];
  onBack: () => void;
  onToggle: (f: Fact) => void;
  onDone: () => void;
}) {
  const c = useTheme();
  return (
    <Stage>
      <TopBar onBack={onBack} />
      <View style={{ gap: space.md, paddingTop: space.xl }}>
        <Frost>
          <Caption>The sentence</Caption>
          <Body style={{ paddingTop: space.xs }}>{belief.text}</Body>
        </Frost>
        <H2>Which of these happened?</H2>
        <BodySm>In the last week or so. Only the ones that are actually true.</BodySm>
      </View>

      <View style={{ gap: space.sm, paddingTop: space.lg }}>
        {facts.map((f) => {
          const on = picked.some((x) => x.id === f.id);
          return (
            <Pressable
              key={f.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={f.text}
              onPress={() => onToggle(f)}
              style={{
                backgroundColor: on ? c.accentDim : c.surfaceSolid,
                borderColor: on ? c.accent : c.line,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderRadius: radius.md,
                padding: space.lg,
                minHeight: 54,
                justifyContent: 'center',
              }}
            >
              <Text style={[t.body, { color: c.ink }]}>{f.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingTop: space.xl }}>
        <Button
          label={picked.length ? 'Those ones' : 'None of them'}
          onPress={onDone}
          variant={picked.length ? 'primary' : 'secondary'}
        />
      </View>
    </Stage>
  );
}

/* ---------- the sorting, which is the game ---------- */

function Sorting({
  fact, onBack, onResolve,
}: { fact: Fact; onBack: () => void; onResolve: (keep: boolean) => void }) {
  const c = useTheme();
  const [struck, setStruck] = useState(false);

  return (
    <Stage>
      <TopBar onBack={onBack} />
      <View style={{ gap: space.md, paddingTop: space.xl }}>
        <Caption>This one</Caption>
        <Frost>
          <Body>{fact.text}</Body>
        </Frost>
      </View>

      {/* The discount, in print, in the app's hand rather than the player's. Seeing your own
          throw-it-away sentence written down by somebody else is most of what this game
          does; it stops being weather and starts being a claim you could examine. */}
      <View style={{ paddingTop: space.xl, gap: space.sm }}>
        <Caption>And straight after it</Caption>
        <View
          style={{
            padding: space.lg,
            borderRadius: radius.md,
            backgroundColor: c.surfaceSolid,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: struck ? c.line : c.rose,
          }}
        >
          <Text
            style={[
              t.body,
              {
                color: struck ? c.inkFaint : c.ink,
                textDecorationLine: struck ? 'line-through' : 'none',
              },
            ]}
          >
            {DISCOUNTS[fact.discount]}
          </Text>
        </View>
      </View>

      {!struck && (
        <View style={{ paddingTop: space.xl, gap: space.sm }}>
          <Button
            label="Strike it out"
            onPress={() => {
              haptic.select();
              setStruck(true);
            }}
          />
          {/* Letting it stand is a real option and is not punished. A game where the only
              move is to disagree with yourself is a game that has replaced one voice telling
              you what to think with another. */}
          <Button label="It stands" variant="secondary" onPress={() => onResolve(false)} />
        </View>
      )}

      {struck && (
        <View style={{ paddingTop: space.xl, gap: space.lg }}>
          <Text style={[t.body, { color: c.ink }]}>{STRUCK[fact.discount]}</Text>
          <Button label="Next" onPress={() => onResolve(true)} />
        </View>
      )}
    </Stage>
  );
}
