import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, H1, H2, Body, BodySm, Caption, useTheme } from '../components/ui';
import { Frost, Ground, TopBar, ListRow, type GlyphKind } from '../components/frost';
import { BreathCircle, QuietCircle } from '../components/BreathCircle';
import { space, radius, type as t } from '../constants/theme';
import { haptic } from '../hooks/haptics';
import {
  MODES, BREATHE, RESET, FLOAT, modeByKey,
  STILL_TITLE, STILL_INTRO, STILL_NOT_THE_POINT, type StillMode,
} from '../content/still.ts';
import { cyclesFor, resetStepAt, modeFromParam } from '../lib/still.ts';

/* Still.
 *
 * THIS SHIPPED AS A BUG FIX. `content/survey.ts` has always mapped every "when is it worst"
 * answer to one of Breathe, Reset and Float, and the survey's closing screen prints it to
 * everybody: "Float — free, always, and never behind a week". None of the three existed. The
 * screen that names it is the one where somebody decides whether to trust the app.
 *
 * IT DOES NOT REPLACE CALM DOWN, and must not. `app/grounding.tsx` is four short grounding
 * tools plus the hard-day path; it carries the free-forever guarantee in SAFETY.md §4 and
 * __tests__/safety.test.mjs greps it by name. This is the longer, quieter thing beside it.
 *
 * NOTHING HERE IS SCORED, LOGGED AS PRACTICE, OR CAN BE FAILED. Deliberately: the brief asks
 * for a section that gets out of the way, and a completion mark on a meditation is the app
 * asking to be thanked. No practice event is recorded and no streak moves. That is also why
 * Float has no elapsed-time readout — a clock turns an open session into something somebody
 * can be behind on.
 *
 * FREE, ALWAYS. Consults no billing state, same as Calm down and Support. */

export default function Still() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  /* Validated against the closed set rather than parsed and trusted, like every other query
     param in this app. An unknown mode opens the menu rather than guessing. */
  const initial = useMemo(() => modeFromParam(params.mode), [params.mode]);
  const [mode, setMode] = useState<StillMode | null>(initial);

  const back = () => {
    if (mode) setMode(null);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (mode === 'breathe') return <BreatheMode onBack={back} />;
  if (mode === 'reset') return <ResetMode onBack={back} />;
  if (mode === 'float') return <FloatMode onBack={back} />;
  return <Menu onPick={setMode} onBack={back} />;
}

/* ---------- menu ---------- */

const GLYPHS: Record<StillMode, GlyphKind> = {
  breathe: 'rings',
  reset: 'wave',
  float: 'anchor',
};

function Menu({ onPick, onBack }: { onPick: (m: StillMode) => void; onBack: () => void }) {
  return (
    <Ground>
      <TopBar onBack={onBack} />
      <H1 style={{ marginTop: space.lg }}>{STILL_TITLE}</H1>
      <BodySm style={{ marginTop: space.sm, marginBottom: space.xl }}>{STILL_INTRO}</BodySm>

      <Frost>
        {MODES.map((m, i) => (
          <ListRow
            key={m.key}
            glyph={GLYPHS[m.key]}
            title={m.title}
            sub={`${m.length} · ${m.blurb}`}
            first={i === 0}
            onPress={() => onPick(m.key)}
          />
        ))}
      </Frost>

      <Caption style={{ marginTop: space.lg }}>{STILL_NOT_THE_POINT}</Caption>
    </Ground>
  );
}

/* ---------- a shared length picker ----------
 *
 * Two modes need one and they were briefly written twice. One list of lengths, one control:
 * the duplicate-list failure has been found in this repository often enough that writing the
 * second copy is no longer a defensible starting point. */

function Lengths({
  options,
  value,
  onChange,
}: {
  options: readonly number[];
  value: number;
  onChange: (n: number) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
      {options.map((n) => {
        const on = n === value;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${n} minutes`}
            onPress={() => {
              haptic.select();
              onChange(n);
            }}
            style={{
              minHeight: 44,
              minWidth: 72,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              backgroundColor: on ? c.accent : c.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: on ? c.accent : c.line,
            }}
          >
            <Text style={[t.bodySm, { color: on ? c.onAccent : c.inkSoft, fontWeight: on ? '600' : '400' }]}>
              {n} min
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The closing beat every mode shares. No completion mark and no "well done" — see the
 *  header. It says what happened and offers the way out. */
function Outro({ line, onBack }: { line: string; onBack: () => void }) {
  return (
    <Ground>
      <TopBar onBack={onBack} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <H2>{line}</H2>
        <Button label="Done" onPress={onBack} style={{ marginTop: space.xl }} />
      </View>
    </Ground>
  );
}

/* ---------- Breathe ---------- */

function BreatheMode({ onBack }: { onBack: () => void }) {
  const c = useTheme();
  const m = modeByKey('breathe');
  const [minutes, setMinutes] = useState<number>(BREATHE.minutes[0]);
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');

  /* Built once per run and held, so a re-render cannot hand BreathCircle a fresh object and
     restart the pacing mid-breath. The circle guards this itself with a ref; not creating the
     garbage in the first place is the belt to that brace. */
  const pattern = useMemo(
    () => ({
      inhale: BREATHE.inhale,
      exhale: BREATHE.exhale,
      cycles: cyclesFor(minutes),
      during: BREATHE.during,
      /* No hold, and therefore no hold label. See content/still.ts — this is not 4-7-8. */
      phaseLabels: { inhale: 'In', exhale: 'Out' },
    }),
    [minutes],
  );

  if (phase === 'done') return <Outro line={BREATHE.outro} onBack={onBack} />;

  if (phase === 'intro') {
    return (
      <Ground>
        <TopBar onBack={onBack} title={m.title} />
        <H1 style={{ marginTop: space.lg }}>{m.title}</H1>
        <Body style={{ marginTop: space.md }}>{m.intro}</Body>

        <Caption style={{ marginTop: space.xl }}>How long</Caption>
        <Lengths options={BREATHE.minutes} value={minutes} onChange={setMinutes} />
        <Caption style={{ marginTop: space.sm }}>{BREATHE.pace}</Caption>

        <Button label="Start" onPress={() => setPhase('running')} style={{ marginTop: space.xl }} />
      </Ground>
    );
  }

  return (
    <Ground>
      <TopBar onBack={onBack} title={m.title} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BreathCircle pattern={pattern} onDone={() => setPhase('done')} />
      </View>
      {/* Leaving is a plain control at full weight, never a confirm. Urge surfing asks twice
          on purpose because leaving early IS the urge; there is nothing to resist here. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop and go back"
        onPress={onBack}
        style={({ pressed }) => ({
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.lg,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text style={[t.label, { color: c.inkSoft }]}>Stop</Text>
      </Pressable>
    </Ground>
  );
}

/* ---------- Reset ---------- */

function ResetMode({ onBack }: { onBack: () => void }) {
  const c = useTheme();
  const m = modeByKey('reset');
  const [minutes, setMinutes] = useState<number>(RESET.minutes[0]);
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [elapsed, setElapsed] = useState(0);

  const total = minutes * 60;

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const started = Date.now();
    /* Wall-clock rather than a tick counter. A counter drifts, and on a screen somebody may
       leave in their pocket for twenty minutes it drifts a lot — the script would finish
       minutes after the timer it is pinned to. */
    const id = setInterval(() => {
      const secs = (Date.now() - started) / 1000;
      if (secs >= total) {
        setPhase('done');
        return;
      }
      setElapsed(secs);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, total]);

  if (phase === 'done') return <Outro line={RESET.outro} onBack={onBack} />;

  if (phase === 'intro') {
    return (
      <Ground>
        <TopBar onBack={onBack} title={m.title} />
        <H1 style={{ marginTop: space.lg }}>{m.title}</H1>
        <Body style={{ marginTop: space.md }}>{m.intro}</Body>
        <Body style={{ marginTop: space.md }}>{RESET.setup}</Body>

        <Caption style={{ marginTop: space.xl }}>How long</Caption>
        <Lengths options={RESET.minutes} value={minutes} onChange={setMinutes} />

        <Button label="Start" onPress={() => setPhase('running')} style={{ marginTop: space.xl }} />
      </Ground>
    );
  }

  const line = resetStepAt(elapsed, total);

  return (
    <Ground>
      <TopBar onBack={onBack} title={m.title} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <QuietCircle size={160} />
        {/* One line at a time, centred, large enough to read lying down with the phone at
            arm's length — which is the posture the setup copy asks for. */}
        <H2 style={{ marginTop: space.xxl, textAlign: 'center' }}>{line ?? ''}</H2>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop and go back"
        onPress={onBack}
        style={({ pressed }) => ({
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.lg,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text style={[t.label, { color: c.inkSoft }]}>Stop</Text>
      </Pressable>
    </Ground>
  );
}

/* ---------- Float ---------- */

function FloatMode({ onBack }: { onBack: () => void }) {
  const c = useTheme();
  const m = modeByKey('float');
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <Ground>
        <TopBar onBack={onBack} title={m.title} />
        <H1 style={{ marginTop: space.lg }}>{m.title}</H1>
        <Body style={{ marginTop: space.md }}>{m.intro}</Body>
        <Caption style={{ marginTop: space.lg }}>{FLOAT.opening}</Caption>
        <Button label="Start" onPress={() => setStarted(true)} style={{ marginTop: space.xl }} />
      </Ground>
    );
  }

  /* NO TIMER, NO COUNT, NO SCRIPT, AND NO ELAPSED READOUT. The brief asks for the app to get
     out of the way, and a clock is the app staying in the room. The only text is the way
     out, which has to be visible or leaving becomes a puzzle. */
  return (
    <Ground>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <QuietCircle size={240} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Leave"
        onPress={onBack}
        style={({ pressed }) => ({
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.xl,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text style={[t.label, { color: c.inkSoft }]}>Leave</Text>
      </Pressable>
    </Ground>
  );
}
