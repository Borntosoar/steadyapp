import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text, Animated, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Card, Button, H1, H3, BodySm, Caption, Label, Rule, useTheme,
  IN_FIXED_SHAPE,
} from '../../components/ui';
import { Frost, CircleButton, IconBadge } from '../../components/frost';
import { CheckMark } from '../../components/Finish';
import { Atmosphere } from '../../components/Atmosphere';
import { RichText, parseInline } from '../../components/RichText';
import {
  space, radius, type as t, LAYOUT_MAX_WIDTH, READ_MAX_WIDTH, type AtmosphereKey,
} from '../../constants/theme';
import { moduleBySlug, MODULES, CONTENT_DISCLAIMER, type LearnModule } from '../../content/modules';
import { NAMES } from '../../content/names';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../hooks/useEntitlement';

/* A module, as something to read.
 *
 * It used to be a title on artwork and then eight to twelve paragraphs at the same size,
 * across a 428px measure — roughly eighty characters a line, well outside the range where
 * reading speed holds up. Every paragraph looked identical to every other, so a piece with
 * a lede, an argument and a close read as one undifferentiated block, and the takeaway told
 * you to go and do something the app could simply have opened for you.
 *
 * Four changes, none of which needed new prose written:
 *   1. A narrower, larger reading column.
 *   2. Three levels of emphasis — the opening line, one pull-quote, the closing line — all
 *      lifted from sentences the writer had already made load-bearing.
 *   3. Landmarks, so a nine-hundred-word screen reads as three short ones.
 *   4. A takeaway that is a button to the exercise it describes.
 *
 * NO ENTRANCE ANIMATION ON PROSE, for anybody, reduced motion or not. Text that is not
 * there when you look at it is a reading failure, and the pieces most likely to be opened
 * on a bad evening are exactly the ones where a swooping screen is least welcome. */

/* Deep ramps only. The module title is set in white directly on the artwork, so a pale
   ramp here is a contrast failure rather than a mood choice. */
const PHASE_ART: Record<number, AtmosphereKey> = { 1: 'night', 2: 'grove', 3: 'emberDeep', 4: 'night' };

export default function LearnModuleScreen() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const markModuleRead = useStore((s) => s.markModuleRead);
  const { entitled } = useEntitlement();

  const mod = moduleBySlug(String(slug));
  const locked = mod ? !mod.free && !entitled : false;

  /* "Read" used to mean "opened".
   *
   * markModuleRead fired on mount, so the count on the Learn tab went up before a word had
   * been read. Read count also feeds the recommended action on Today, which means opening
   * a module by accident could change what the app told you to do next. It now fires when
   * the takeaway comes into view. Somebody who thumbs straight to the bottom counts as
   * having read it; the alternative is policing, and this app does not police. */
  const [reachedEnd, setReachedEnd] = useState(false);
  const takeawayY = useRef(0);
  const heroH = useRef(1);
  const progress = useRef(new Animated.Value(0)).current;
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    if (mod && !locked && reachedEnd) markModuleRead(mod.slug);
  }, [mod, locked, reachedEnd, markModuleRead]);

  if (!mod) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <H1>Not found</H1>
          <Button
            label="Back to Learn"
            variant="secondary"
            onPress={() => router.replace('/learn')}
            style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
          />
        </View>
      </Screen>
    );
  }

  if (locked) {
    return (
      <Screen>
        <View style={{ marginTop: space.xxxl }}>
          <Caption>Week {mod.week}</Caption>
          <H1 style={{ marginTop: space.xs }}>{mod.title}</H1>
          <BodySm style={{ marginTop: space.sm }}>{mod.kicker}</BodySm>
          <Card tone="accent" style={{ marginTop: space.lg }}>
            <RichText>
              This one is part of Anneal+. Week one is free, and so is every calming exercise
              and all crisis support. Those never go behind anything.
            </RichText>
          </Card>
          <Button label="See Anneal+" onPress={() => router.push('/paywall')} />
          <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.sm }} />
        </View>
      </Screen>
    );
  }

  const idx = MODULES.findIndex((m) => m.slug === mod.slug);
  const next = MODULES[idx + 1];
  const nextLocked = next ? !next.free && !entitled : false;
  const sectionAt = new Map((mod.sections ?? []).map((x) => [x.at, x]));
  const lastIdx = mod.body.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent: n }) => {
          const y = n.contentOffset.y;
          setBarVisible(y > heroH.current * 0.8);

          /* The denominator is the top of the takeaway, not the bottom of the scroll view.
             A bar that cannot reach the end because of a disclaimer below the fold reports
             failure at the exact moment somebody finishes. */
          const end = Math.max(1, takeawayY.current - n.layoutMeasurement.height + space.xxl);
          progress.setValue(Math.max(0, Math.min(1, y / end)));

          if (y + n.layoutMeasurement.height >= takeawayY.current + 40) setReachedEnd(true);
        }}
      >
        <View style={{ width: '100%', maxWidth: LAYOUT_MAX_WIDTH }}>
          {/* Title on the artwork, so a module opens like a chapter rather than a settings
              row. Bottom-aligned in a fixed band, so a two-word title does not leave a squat
              one and a seven-word title does not push the prose off the screen. */}
          <Atmosphere
            variant={PHASE_ART[mod.phase]}
            lightX={0.66}
            rounded="none"
            style={{ minHeight: 236 + insets.top, justifyContent: 'flex-end' }}
          >
            <View
              onLayout={(e) => {
                heroH.current = Math.max(1, e.nativeEvent.layout.height);
              }}
              style={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.lg, paddingBottom: space.xl }}
            >
              <View style={{ alignSelf: 'flex-start', marginBottom: space.lg }}>
                <CircleButton
                  icon="back"
                  size={40}
                  tone="ghost"
                  label="Back to Learn"
                  onPress={() => router.back()}
                />
              </View>

              <Text style={[t.caption, { color: 'rgba(255,255,255,0.72)' }]}>
                Week {mod.week} · {mod.minutes} min read
              </Text>
              <Text style={[t.display, { color: '#fff', marginTop: space.sm, maxWidth: 320 }]}>
                {mod.title}
              </Text>
              <Text style={[t.bodySm, { color: 'rgba(255,255,255,0.86)', marginTop: space.md, maxWidth: 300 }]}>
                {mod.kicker}
              </Text>
            </View>
          </Atmosphere>

          {/* ---------- the reading column ---------- */}
          <View style={{ width: '100%', maxWidth: READ_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg }}>
            {mod.body.map((p, i) => {
              const sec = sectionAt.get(i);
              return (
                <View key={i}>
                  {sec && <SectionHead label={sec.label} />}
                  {!sec?.replaces && <Paragraph text={p} first={i === 0} last={i === lastIdx} />}
                  {mod.pullquote?.after === i && <PullQuote text={mod.pullquote.text} />}
                </View>
              );
            })}

            {/* ---------- the ending ---------- */}
            <View
              onLayout={(e) => {
                takeawayY.current = e.nativeEvent.layout.y;
              }}
            >
              <Rule style={{ marginTop: space.xl }} />

              <Frost style={{ marginTop: space.xl }}>
                <Label style={{ color: c.accentDeep }}>One thing to try</Label>
                <View style={{ marginTop: space.sm }}>
                  <RichText size="read">{mod.takeaway}</RichText>
                </View>
                {mod.action ? (
                  <Button
                    label={NAMES[mod.action.thing].title}
                    onPress={() => router.push(mod.action!.route)}
                    style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
                  />
                ) : mod.actionNote ? (
                  <Caption style={{ marginTop: space.md }}>{mod.actionNote}</Caption>
                ) : null}
              </Frost>

              {/* Closes in place rather than taking over the screen. A full Finish frame is
                  the payoff for sitting through an urge or standing in front of a mirror;
                  handing reading the same frame devalues it for both. */}
              {reachedEnd && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xl }}>
                  <CheckMark size={40} color={c.cool} delay={120} />
                  <Text style={[t.h3, { color: c.inkSoft, flex: 1 }]}>{closingLine(mod)}</Text>
                </View>
              )}

              {next && (
                <Frost
                  style={{ marginTop: space.xl }}
                  onPress={() => router.replace(nextLocked ? '/paywall' : `/module/${next.slug}`)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: c.accentDim,
                      }}
                    >
                      <Text maxFontSizeMultiplier={IN_FIXED_SHAPE} style={[t.label, { color: c.accentDeep }]}>{next.week}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Caption>{nextLocked ? 'Next · Anneal+' : 'Next'}</Caption>
                      <H3 style={{ marginTop: 2 }}>{next.title}</H3>
                      <Caption style={{ marginTop: 2 }} numberOfLines={2}>
                        {next.kicker}
                      </Caption>
                    </View>
                    <IconBadge icon="arrow" size={40} />
                  </View>
                </Frost>
              )}

              <Button
                label="All twelve"
                variant="ghost"
                onPress={() => router.replace('/learn')}
                style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
              />

              <BodySm style={{ marginTop: space.xl, color: c.inkFaint }}>{CONTENT_DISCLAIMER}</BodySm>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* How much is left.
       *
       * A creeping bar is the wrong answer for a form with known steps — which is why Steps
       * exists and is segmented — and the right one for reading, where position is
       * continuous and "how much of this is left" is the actual question. It tracks the
       * finger, so it is direct manipulation rather than animation and needs no
       * reduced-motion path of its own. It appears only once the artwork has scrolled off,
       * because before that there is nothing to report. */}
      {barVisible && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: c.line,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: 3,
              width: '100%',
              backgroundColor: c.isDark ? c.accent : c.accentDeep,
              borderRadius: radius.pill,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-LAYOUT_MAX_WIDTH * 2, 0],
                  }),
                },
              ],
            }}
          />
        </View>
      )}
    </View>
  );
}

/* ---------- pieces ---------- */

/** The opening and closing lines carry the most attention on any text screen, and both used
 *  to be set identically to paragraph nine. Every module already lands on a deliberate first
 *  and last sentence; this only stops throwing that away. */
function Paragraph({ text, first, last }: { text: string; first: boolean; last: boolean }) {
  const c = useTheme();
  const tokens = parseInline(text);

  /* Seven of the twelve modules already write their lists as "**Lead-in.** the rest", which
     renders as an undifferentiated paragraph. Free structure, previously unused. */
  if (tokens[0]?.bold) {
    const [lead, ...rest] = tokens;
    return (
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.lg }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginTop: 11 }} />
        <View style={{ flex: 1 }}>
          <Text style={[t.h3, { color: c.ink }]}>{lead.text.trim()}</Text>
          <Text style={[t.read, { color: c.inkSoft, marginTop: space.xs }]}>
            {rest.map((tok, i) => (
              <Text
                key={i}
                style={{ fontStyle: tok.italic ? 'italic' : 'normal', fontWeight: tok.bold ? '700' : '400' }}
              >
                {tok.text}
              </Text>
            ))}
          </Text>
        </View>
      </View>
    );
  }

  if (first) {
    return <Text style={[t.h2, { color: c.ink, marginTop: space.xxl, marginBottom: space.xl }]}>{text}</Text>;
  }
  if (last) {
    return <Text style={[t.h2, { color: c.inkSoft, marginTop: space.xl, marginBottom: space.lg }]}>{text}</Text>;
  }
  return (
    <View style={{ marginBottom: space.xl }}>
      <RichText size="read">{text}</RichText>
    </View>
  );
}

function SectionHead({ label }: { label: string }) {
  const c = useTheme();
  return (
    <View style={{ marginTop: space.xxl, marginBottom: space.lg }}>
      <Text accessibilityRole="header" style={[t.label, { color: c.accentDeep }]}>
        {label}
      </Text>
      <Rule style={{ marginTop: space.sm }} />
    </View>
  );
}

/** Always a sentence lifted verbatim from the prose above it, which is why it is hidden from
 *  screen readers: it is visual emphasis, not content, and hearing it twice is worse than
 *  not hearing it at all. */
function PullQuote({ text }: { text: string }) {
  const c = useTheme();
  return (
    <View
      /* Hidden from screen readers on the platforms that support it. The quote is a
         sentence lifted verbatim from the paragraph above, so announcing it reads the same
         line twice — it is visual emphasis, not content. Both props are native-only; web
         passes them through to the DOM and warns. */
      {...(Platform.OS === 'web'
        ? {}
        : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const })}
      style={{
        marginVertical: space.xxl,
        paddingLeft: space.lg,
        borderLeftWidth: 3,
        borderLeftColor: c.accent,
      }}
    >
      <Text style={[t.h1, { color: c.accentDeep }]}>{text}</Text>
    </View>
  );
}

function closingLine(mod: LearnModule): string {
  if (mod.slug === 'why-your-brain-zooms-in') return 'That is the first one.';
  if (mod.slug === 'when-self-help-isnt-enough') return 'That is all twelve reads.';
  return `Week ${mod.week} read.`;
}
