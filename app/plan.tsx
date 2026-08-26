import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, H1, H2, BodySm, Caption, useTheme } from '../components/ui';
import { Frost, Ground, TopBar } from '../components/frost';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { PLAN_SECTION_COPY, PLAN_INTRO } from '../content/exercises.ts';
import { PLAN_SECTIONS, type RelapsePlan } from '../types';
import { formatLogDate } from '../lib/dates';

/* The plan.
 *
 * THIS SCREEN DID NOT EXIST, AND SIX PLACES SOLD IT. `NAMES.plan.title` is "Write your plan",
 * two modules render that as their action button, the Progress screen promised the backup
 * "contains everything you have written, including your plan", the delete confirmation
 * promised to erase it, and the App Store description pitched "a written plan for the weeks
 * that go badly" as part of weeks 10-12. `setRelapsePlan` had zero call sites. The two action
 * buttons navigated to the journal — which offers a thought record and an experiment, neither
 * of which is a plan — and to another article.
 *
 * WHY IT IS ONE SCROLL AND NOT A STEPPED FLOW. Every other writing surface here is stepped,
 * because a thought record is a sequence you complete once. A plan is a document you come back
 * to and revise, and half of it is only answerable after you have read the other half — the
 * "what I will not do" section is much easier once you have written your triggers down. Steps
 * would also mean an unfinished plan is a flow you abandoned rather than a document with gaps,
 * and an unfinished plan is the normal state of this thing for a while.
 *
 * IT SAVES AS YOU GO, and it never blocks on being complete. The module's takeaway says
 * "Finish all six sections. Don't leave it half-written" — that is the right thing to ask of a
 * reader and the wrong thing for a screen to enforce, because a plan with two sections written
 * is worth more on a bad day than a plan that was never started. */

/** Roughly one line of body text. A section asking for three ranked actions needs to LOOK
 *  like it wants three, so each field opens at its own height rather than one shared default.
 *  The smallest field here is four lines, so no input is anywhere near the 44pt touch floor —
 *  written as a named constant because `minHeight: 24 * lines` reads to a source grep as a
 *  24pt target, and __tests__/a11y.test.mjs was right to ask. */
const LINE = 24;

type Draft = Omit<RelapsePlan, 'updatedAt'>;

const EMPTY: Draft = {
  earlyWarnings: '', triggers: '', firstMoves: '', notDoing: '', whoToTell: '', myLine: '',
};

export default function Plan() {
  const c = useTheme();
  const router = useRouter();
  const saved = useStore((s) => s.protocol.relapsePlan);
  const setRelapsePlan = useStore((s) => s.setRelapsePlan);

  const [draft, setDraft] = useState<Draft>(() => {
    if (!saved) return EMPTY;
    const { updatedAt, ...rest } = saved;
    return rest;
  });
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  const written = PLAN_SECTIONS.filter((k) => draft[k].trim()).length;

  const set = (key: keyof Draft, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    /* Written on every keystroke rather than on a Save button. The store debounces its own
       persistence, and the alternative — a plan lost because somebody backed out of the screen
       — is the single worst outcome for a document whose entire purpose is being there later. */
    setRelapsePlan(next);
  };

  return (
    <Ground>
      <TopBar onBack={() => router.back()} title="My plan" />

      <H1 style={{ marginTop: space.lg }}>Your fire exit</H1>
      <BodySm style={{ marginTop: space.sm }}>{PLAN_INTRO}</BodySm>

      {/* Progress as a fact, never as a bar to fill. Six of six is not a badge and two of six
          is not a failure — the count is here so somebody returning knows where they were. */}
      <Caption style={{ marginTop: space.md }}>
        {written === 0
          ? `Nothing written yet. ${PLAN_SECTIONS.length} sections.`
          : `${written} of ${PLAN_SECTIONS.length} written${
              saved?.updatedAt ? ` · last changed ${formatLogDate(saved.updatedAt)}` : ''
            }`}
      </Caption>

      {PLAN_SECTION_COPY.map((section, i) => {
        const key = section.key as keyof Draft;
        const helpOpen = openHelp === section.key;
        return (
          <Frost key={section.key} style={{ marginTop: i === 0 ? space.xl : space.lg }}>
            <H2>{`${i + 1}. ${section.title}`}</H2>
            <BodySm style={{ marginTop: space.xs }}>{section.prompt}</BodySm>

            <TextInput
              value={draft[key]}
              onChangeText={(v) => set(key, v)}
              placeholder={section.placeholder}
              placeholderTextColor={c.inkFaint}
              multiline
              accessibilityLabel={`${section.title}. ${section.prompt}`}
              style={[
                t.body,
                {
                  color: c.ink,
                  backgroundColor: c.surfaceStrong,
                  borderRadius: radius.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.lineStrong,
                  padding: space.md,
                  marginTop: space.md,
                  minHeight: section.lines * LINE,
                  /* In the style rather than as a prop. As a prop, react-native-web forwards
                     it to the DOM node and React logs a non-boolean-attribute warning on
                     every render; as a style it still does its job on Android and is inert
                     on the other two. */
                  textAlignVertical: 'top',
                },
              ]}
            />

            {/* Folded away by default. Six sections each carrying a paragraph of guidance is a
                wall of instruction on a screen whose job is to be written in. */}
            <Pressable
              onPress={() => setOpenHelp(helpOpen ? null : section.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: helpOpen }}
              accessibilityLabel={`What goes here, for ${section.title}`}
              style={{ marginTop: space.md, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={[t.caption, { color: c.accentDeep }]}>
                {helpOpen ? 'Hide' : 'What goes here'}
              </Text>
            </Pressable>
            {helpOpen && <BodySm style={{ marginTop: space.xs }}>{section.help}</BodySm>}
          </Frost>
        );
      })}

      {/* SAFETY.md §4. The last section asks somebody to name the point at which this app is
          not the right tool, which means it is the one place in the writing surfaces where a
          person may be sitting with exactly that thought while typing. Crisis support is one
          tap from every screen in the app already; it is repeated here in words rather than
          left to the floating pill, because a pill is something you have to already know
          about. Never gated — this screen is week eleven of a paid programme, and the line
          below is not part of what is being sold. */}
      <Frost style={{ marginTop: space.xl }}>
        <Caption>If writing that last section brought something up</Caption>
        <BodySm style={{ marginTop: space.xs }}>
          Crisis lines for your region are on the Support screen, always, whatever your plan
          says. You do not have to be at your line to use them.
        </BodySm>
        <Button
          label="Support"
          variant="secondary"
          onPress={() => router.push('/support')}
          style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        />
      </Frost>

      <Caption style={{ marginTop: space.xl, marginBottom: space.xxxl }}>
        Saved as you type, on this phone only. It comes out with your backup on the Progress
        screen, and Delete everything erases it along with the rest.
      </Caption>
    </Ground>
  );
}
