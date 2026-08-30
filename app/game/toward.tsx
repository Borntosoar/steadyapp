import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, BodySm, Caption, H2, Button, useTheme } from '../../components/ui';
import { Frost, TopBar, Steps } from '../../components/frost';
import { Finish } from '../../components/Finish';
import { Atmosphere } from '../../components/Atmosphere';
import { Motif } from '../../components/Motif';
import { groundFor } from '../../lib/motif.ts';
import type { AtmosphereKey } from '../../constants/theme';
import { space, radius, type as t, LAYOUT_MAX_WIDTH } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { haptic } from '../../hooks/haptics';
import {
  VALUES, VALUES_TO_PICK, PASS_LABEL, PASS_ACKNOWLEDGEMENT,
  situationFor, optionsFor, runScenes, tallyByValue, actionFor, labelFor,
  type TowardOption, type Value, type TowardScene,
} from '../../content/toward.ts';

/* Toward — the ACT game.
 *
 * Pick two things that matter. Then five moments, each with a thought pinned above it that
 * is never argued with and never goes away, and three ways past it: one that buys relief and
 * two that cost something and move.
 *
 * THE THING THIS SCREEN MUST NOT DO, and every decision below follows from it: it must not
 * score somebody's life. No percentage, no accuracy, no tally of how often they avoided.
 * The away move is written and coloured as what it actually is — effective, cheap, the
 * reason anyone does it — and the cost lands later, as the scene coming back bigger, rather
 * than as a verdict at the moment of choosing. A game where avoidance is obviously the wrong
 * button teaches nothing, because in life it never looks like the wrong button.
 *
 * WHY THE COLOURS ARE GREEN AND ROSE AND NOT GREEN AND RED. Rose is the palette's emotion
 * colour: it marks the relief taken, which is a real thing a person felt and not a mistake
 * they made. Green marks a move toward what they said matters. The moment those two read as
 * right and wrong, this stops being an ACT game and becomes a compliance meter.
 *
 * WHY IT IS NOT CURVEBALL AGAIN. Curveball asks whether a thought is accurate. This one
 * never asks. The intro says so out loud, because a player who has done both should know the
 * two skills are different rather than assume the app contradicted itself. */

type Phase = 'values' | 'scene' | 'done';

export default function Toward() {
  const router = useRouter();
  const c = useTheme();
  const logPractice = useStore((s) => s.logPractice);

  const firstName = useStore((st) => st.profile.firstName);

  const [phase, setPhase] = useState<Phase>('values');
  const [chosen, setChosen] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<TowardOption[]>([]);
  /* Passes are held separately from picks and are never folded into them, so no arithmetic
     anywhere can accidentally start treating a pass as a choice. */
  const [passed, setPassed] = useState(0);

  /* ⚠ THE RUN IS A DRAW, NOT A WALK OF `SCENES`.
     This read `SCENES[Math.min(index, SCENES.length - 1)]` — all five, in the order they
     are written, every single time. Curveball has drawn 4 of 7 at random since it shipped;
     this game walked its whole list, so the second run anybody played was the first run
     again in the same sequence, one hundred per cent of it.
     Drawn once per mount and held: recomputing on render would reshuffle the run under the
     player between scenes, which is the bug the memo exists to prevent rather than a
     performance nicety. */
  const scenes = useMemo<TowardScene[]>(() => runScenes(), []);
  const scene = scenes[Math.min(index, scenes.length - 1)];
  const awayCount = picks.filter((p) => p.move === 'away').length;
  const ground = groundFor(scene.mood, c.isDark);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Atmosphere
        variant={ground}
        rounded="none"
        scrim={false}
        style={StyleSheet.absoluteFill as never}
      />
      <Motif kind={scene.motif} seed={scene.id} color={c.ink} isDark={c.isDark} insetTop={110} />

      {phase === 'values' && (
        <PickValues
          firstName={firstName}
          chosen={chosen}
          onToggle={(k) =>
            setChosen((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k].slice(-VALUES_TO_PICK)))
          }
          onStart={() => setPhase('scene')}
          onBack={() => router.back()}
        />
      )}

      {phase === 'scene' && (
        <Moment
          key={scene.id}
          scene={scene}
          awayCount={awayCount}
          index={index}
          total={scenes.length}
          onBack={() => router.back()}
          onPick={(option) => {
            setPicks((p) => [...p, option]);
            /* Feedback marks what the player did, never which one they should have done.
               Both moves tap, because both are choices somebody made. */
            haptic.select();
          }}
          onPass={() => setPassed((n) => n + 1)}
          onNext={() => {
            if (index + 1 < scenes.length) setIndex(index + 1);
            else {
              logPractice('toward');
              setPhase('done');
            }
          }}
        />
      )}

      {phase === 'done' && (
        <Done picks={picks} passed={passed} chosen={chosen} ground={ground} onDone={() => router.back()} />
      )}
    </View>
  );
}

/* ---------- the transparent stage ----------
 *
 * Same reason as in the CBT game: `Screen` paints an opaque background over the full frame,
 * which would build the scene's ground and then cover it. */

function Stage({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View
      style={{
        flex: scroll ? undefined : 1,
        width: '100%',
        maxWidth: LAYOUT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: space.lg,
      }}
    >
      {children}
    </View>
  );
  if (!scroll) return <View style={{ flex: 1, paddingTop: insets.top }}>{inner}</View>;
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  );
}

/* ---------- what matters ---------- */

function PickValues({
  firstName, chosen, onToggle, onStart, onBack,
}: {
  firstName?: string;
  chosen: string[];
  onToggle: (key: string) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const c = useTheme();
  const ready = chosen.length === VALUES_TO_PICK;

  return (
    <Stage>
      <TopBar onBack={onBack} title="Toward" />

      <View style={{ gap: space.md, paddingTop: space.lg, paddingBottom: space.xl }}>
        {/* The app has known this person's name since onboarding and uses it on the home
            screen and in the check-in. Both games were addressing a generic "you", which is
            the difference between a piece of software and somebody talking to you. Once, at
            the start — the brief is explicit that the voice is present but not needy. */}
        <H2>{firstName ? `Pick two things that matter, ${firstName}.` : 'Pick two things that matter to you.'}</H2>
        <Body>
          Then five moments. Each one has a thought in it that you do not have to argue with,
          and a way past it that costs something.
        </Body>
        {/* Said plainly, because somebody who has played Curveball has been taught the
            opposite move and should not be left to guess whether the app contradicted
            itself. */}
        <BodySm>
          Curveball asks whether a thought is true. This one never does. Sometimes checking a
          thought is the move, and sometimes the checking is the thing keeping you still.
        </BodySm>
      </View>

      <View style={{ gap: space.sm }}>
        {VALUES.map((v) => {
          const on = chosen.includes(v.key);
          return (
            <Pressable
              key={v.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={v.label}
              onPress={() => {
                onToggle(v.key);
                haptic.select();
              }}
              style={{
                backgroundColor: on ? c.accentDim : c.surfaceSolid,
                borderColor: on ? c.accent : c.line,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderRadius: radius.md,
                paddingVertical: space.lg,
                paddingHorizontal: space.lg,
                minHeight: 56,
                justifyContent: 'center',
              }}
            >
              <Text style={[t.body, { color: c.ink }]}>{v.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingTop: space.xl, gap: space.sm }}>
        <Button label={ready ? 'Start' : `Pick ${VALUES_TO_PICK - chosen.length} more`} onPress={onStart} disabled={!ready} />
        <Caption style={{ textAlign: 'center' }}>
          Nothing here is saved anywhere. Pick different ones next time.
        </Caption>
      </View>
    </Stage>
  );
}

/* ---------- one moment ---------- */

function Moment({
  scene, awayCount, index, total, onBack, onPick, onPass, onNext,
}: {
  scene: TowardScene;
  awayCount: number;
  index: number;
  total: number;
  onBack: () => void;
  onPick: (o: TowardOption) => void;
  onPass: () => void;
  onNext: () => void;
}) {
  const c = useTheme();
  /* Order shuffled once per scene, so the away move is never in the same slot twice. A
     player learns a position far faster than they learn a distinction. */
  const options = useMemo(() => optionsFor(scene), [scene.id]);
  const [picked, setPicked] = useState<TowardOption | null>(null);
  const [passed, setPassed] = useState(false);

  const escalated = awayCount >= 2;

  return (
    <Stage>
      <TopBar onBack={onBack} />
      <Steps total={total} current={index} />

      <View style={{ gap: space.sm, paddingTop: space.lg }}>
        {escalated && <Caption>Later</Caption>}
        <Body>{situationFor(scene, awayCount)}</Body>
      </View>

      {/* The thought sits above every option and stays there after the pick. It is never
          disproved and never removed — that is the difference between this game and the
          other one, and it is carried by the layout rather than by a sentence about it. */}
      <View style={{ paddingTop: space.lg }}>
        <Frost>
          <Caption>The thought in the room</Caption>
          <Body style={{ paddingTop: space.xs }}>{scene.thought}</Body>
        </Frost>
      </View>

      <View style={{ gap: space.sm, paddingTop: space.lg }}>
        {options.map((o) => {
          const isPick = picked?.text === o.text;
          const revealed = picked !== null;
          /* Green for a move toward what matters, rose for relief taken. Never red, never a
             tick and a cross. Both are things a person did. */
          const tone = o.move === 'toward' ? c.accent : c.rose;
          const tint = o.move === 'toward' ? c.accentDim : c.roseDim;

          if (passed) return null;
          if (revealed && !isPick) return null;

          return (
            <Pressable
              key={o.text}
              accessibilityRole="button"
              disabled={revealed}
              onPress={() => {
                setPicked(o);
                onPick(o);
              }}
              style={{
                backgroundColor: c.surfaceSolid,
                borderColor: isPick ? tone : c.line,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderRadius: radius.md,
                overflow: 'hidden',
              }}
            >
              {isPick && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
              )}
              <View style={{ padding: space.lg, gap: space.sm }}>
                <Text style={[t.body, { color: c.ink }]}>{o.text}</Text>
                {isPick && (
                  <>
                    <Text style={[t.label, { color: tone }]}>
                      {o.move === 'toward'
                        ? `Toward ${labelFor(o.value ?? '').toLowerCase()}`
                        : 'Relief, and it works'}
                    </Text>
                    <Text style={[t.bodySm, { color: c.inkSoft }]}>{o.after}</Text>
                  </>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* THE WAY OUT.
          Offered before a choice is made and never after, so it reads as a door rather than
          as an undo. It is a ghost button on purpose: present, findable, and not competing
          with the options — somebody who needs it will find it, and somebody who does not
          should barely register it. A pass asks nothing, explains nothing and counts as
          nothing. See content/toward.ts for why that last part is the whole point. */}
      {!picked && !passed && (
        <View style={{ paddingTop: space.lg, alignItems: 'center' }}>
          <Button
            label={PASS_LABEL}
            variant="ghost"
            onPress={() => {
              setPassed(true);
              onPass();
            }}
          />
        </View>
      )}

      {passed && (
        <View style={{ paddingTop: space.lg, gap: space.sm }}>
          <BodySm>{PASS_ACKNOWLEDGEMENT}</BodySm>
        </View>
      )}

      {(picked || passed) && (
        <View style={{ paddingTop: space.xl }}>
          <Button label={index + 1 < total ? 'Next' : 'Finish'} onPress={onNext} />
        </View>
      )}
    </Stage>
  );
}

/* ---------- the end ---------- */

function Done({
  picks, passed, chosen, ground, onDone,
}: {
  picks: TowardOption[];
  /** Scenes left alone. Never a move, never scored — see content/toward.ts. */
  passed: number;
  chosen: string[];
  ground: AtmosphereKey;
  onDone: () => void;
}) {
  const c = useTheme();
  const tally = tallyByValue(picks, chosen);
  const action: Value | null = actionFor(tally, chosen);

  /* THE FIGURE IS DERIVED FROM THE ROWS, not counted separately, and that is a fix rather
     than a preference. It used to be every toward move in the run while the rows below
     counted only the two values the player picked — so a run that moved once toward
     something unchosen printed "1 move toward what matters" directly above "0 moves" and
     "0 moves". One screen contradicting itself, and the contradiction was in the number the
     eye lands on first.
     Still not a percentage and not a score out of five: five is not the good outcome here
     and one is not the bad one. The count is a fact about the run and the sentence under it
     is where the meaning is. */
  const served = chosen.reduce((n, k) => n + (tally[k] ?? 0), 0);
  const toward = picks.filter((p) => p.move === 'toward').length;
  const elsewhere = toward - served;

  /* Three bands, because two put a run that took relief four times out of five under a
     headline congratulating it for paying the cost. */
  const headline =
    picks.length === 0
      ? 'You looked at them. That counts.'
      : served === 0 && elsewhere > 0
        ? 'Your moves went somewhere you did not name.'
        : served === 0
          ? 'You took the easier road each time, and it worked each time.'
          : served * 2 <= picks.length
            ? 'Mostly the easier road, and once not.'
            : 'None of that was free, and you did it anyway.';

  const body =
    picks.length === 0
      ? 'Reading them through is a real thing to have done. Some days that is the whole of it.'
      : served === 0 && elsewhere > 0
        ? 'Worth sitting with rather than fixing. What you move toward when nobody is asking may be truer than the two you named at the start.'
        : served === 0
          ? 'That is worth knowing, not fixing. Stepping around things works — that is the whole difficulty with it.'
          : served * 2 <= picks.length
            ? 'The ones you stepped around are still where you left them. The one you did not is the one that moved.'
            : 'Hard, most likely, and none of it came with a reward attached. That is the difference between a move and a mood.';

  return (
    <Finish
      /* Scenes seen, not scenes played. Passing all five and reading "0 moments" tells
         somebody the time they spent did not happen. */
      eyebrow={`${picks.length + passed} moments`}
      figure={served}
      figureUnit={served === 1 ? 'move toward what matters' : 'moves toward what matters'}
      headline={headline}
      body={body}
      onDone={onDone}
      doneLabel="Done"
      variant={ground}
    >
      <View style={{ gap: space.md, paddingTop: space.lg, width: '100%' }}>
        {chosen.map((key) => (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: space.md,
            }}
          >
            <Text style={[t.bodySm, { color: c.ink, flex: 1 }]}>{labelFor(key)}</Text>
            <Text style={[t.label, { color: tally[key] ? c.accent : c.inkFaint }]}>
              {tally[key] === 1 ? '1 move' : `${tally[key] ?? 0} moves`}
            </Text>
          </View>
        ))}

        {passed > 0 && (
          /* Noticed once, in plain words, and never discussed. A pass that gets commented on
             is a pass somebody will not take twice. */
          <Text style={[t.bodySm, { color: c.inkFaint }]}>
            {passed === 1 ? 'One you left alone.' : `${passed} you left alone.`}
          </Text>
        )}

        {elsewhere > 0 && (
          /* Moves toward something they did not name. Reported rather than corrected — in
             ACT a value you act on without having listed it is data about what you actually
             care about, which is more useful than the list. */
          <Text style={[t.bodySm, { color: c.inkFaint }]}>
            {elsewhere === 1
              ? 'One more move went toward something you did not pick.'
              : `${elsewhere} more moves went toward things you did not pick.`}
          </Text>
        )}

        {action && (
          <View
            style={{
              backgroundColor: c.surfaceSolid,
              borderRadius: radius.card,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.lineStrong,
              padding: space.lg,
              gap: space.xs,
              marginTop: space.sm,
            }}
          >
            <Text style={[t.label, { color: c.inkFaint }]}>One thing, this week</Text>
            <Text style={[t.body, { color: c.ink }]}>{action.committed}</Text>
          </View>
        )}
      </View>
    </Finish>
  );
}
