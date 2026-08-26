import React from 'react';
import { View, Linking, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Button, H1, H2, H3, Body, BodySm, Caption, Rule, useTheme,
} from '../components/ui';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { SUPPORT_REGIONS, regionByKey, THERAPY_GUIDANCE, SUPPORT_INTRO } from '../constants/support';
import { LINKS, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../constants/links';
import { Frost, ListRow } from '../components/frost';
import { NAMES } from '../content/names';

/* Free, always, and never gated. Action first — someone reading this may be in real
 * distress, so the numbers come before any explanation, and nothing on the way to them
 * is decorative. */

export default function Support() {
  const c = useTheme();
  const router = useRouter();
  const region = useStore((s) => s.profile.supportRegion);
  const setSupportRegion = useStore((s) => s.setSupportRegion);
  const active = regionByKey(region);

  const dial = (contact: string) => {
    const digits = contact.replace(/[^\d+]/g, '');
    if (!digits || Platform.OS === 'web') return;
    Linking.openURL(`tel:${digits}`).catch(() => {});
  };

  return (
    <Screen>
      <View style={{ marginTop: space.xxl }}>
        <H1>Support</H1>
        <Body style={{ marginTop: space.md }}>{SUPPORT_INTRO}</Body>

        {/* Emergency block is the one place `warn` carries a whole surface. It is not an
            action to weigh against the others, so it does not look like them. */}
        <View
          style={{
            marginTop: space.xl,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: c.warn,
            padding: space.lg,
          }}
        >
          <H3 style={{ color: c.warn }}>If you are in danger right now</H3>
          <BodySm style={{ marginTop: space.xs, color: c.ink }}>
            Contact your local emergency number. That is the right call and it is not an
            overreaction.
          </BodySm>
        </View>

        {/* CALMING DOWN, FROM THE ONE SCREEN THAT IS ALWAYS ONE TAP AWAY.
            SAFETY.md §4 promises grounding, breathing, the hard-day path and the daily
            check-in are "reachable in two taps or fewer from any screen", and
            docs/SUBMISSION-ANSWERS.md tells App Review they are reachable "via the Support
            control in the top right". Neither was true: this screen held crisis lines, a
            therapist section and an email link, and nothing else. From Learn or Progress,
            breathing was three taps; from inside a module, four.
            The Support pill is one tap from everywhere, so putting the tools here is what
            makes the sentence true rather than what makes it shorter — and somebody who
            opened this screen in distress is exactly who wants them.
            Direct routes, not the grounding menu: a menu would put these back at three. */}
        <Caption style={{ marginTop: space.xxl, marginBottom: space.sm }}>
          Before you call, or instead
        </Caption>
        <Frost>
          {[
            { title: 'Slow your breathing', sub: 'About eighty seconds', route: '/grounding?tool=breath', glyph: 'rings' as const },
            { title: 'Name five things', sub: 'About two minutes. No timer, no rush', route: '/grounding?tool=senses', glyph: 'senses' as const },
            { title: 'Today is a hard day', sub: 'Nothing is required of you', route: '/grounding?mode=hard', glyph: 'wave' as const },
            { title: NAMES.checkin.title, sub: NAMES.checkin.sub, route: '/checkin', glyph: 'plus' as const },
          ].map((r, i) => (
            <ListRow
              key={r.route}
              glyph={r.glyph}
              title={r.title}
              sub={r.sub}
              first={i === 0}
              onPress={() => router.push(r.route)}
            />
          ))}
        </Frost>
        <Caption style={{ marginTop: space.sm }}>
          These are free forever, and they never need a subscription.
        </Caption>

        <Caption style={{ marginTop: space.xxl, marginBottom: space.sm }}>Where are you?</Caption>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {SUPPORT_REGIONS.map((r) => {
            const on = r.key === region;
            return (
              <Pressable
                key={r.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setSupportRegion(r.key)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: space.md,
                  borderRadius: radius.pill,
                  backgroundColor: on ? c.accent : c.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: on ? c.accent : c.line,
                  minHeight: 40,
                  justifyContent: 'center',
                }}
              >
                <Text style={[t.bodySm, { color: on ? c.onAccent : c.inkSoft, fontWeight: on ? '600' : '400' }]}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: space.xxl }}>
          <Rule />
          <H2 style={{ marginTop: space.lg }}>{active.label}</H2>
          {active.lines.map((l, i) => (
            <Pressable
              key={i}
              accessibilityRole={Platform.OS === 'web' ? 'text' : 'button'}
              /* Hours belong in the spoken label too, and before the note. Somebody using
                 VoiceOver at 4am needs to hear "daily, 10:00 to 22:00" while deciding
                 whether to dial, not discover it from a phone that rings out. */
              accessibilityLabel={[l.name, l.contact, l.hours, l.note].filter(Boolean).join(', ')}
              onPress={() => dial(l.contact)}
              style={({ pressed }) => ({
                paddingVertical: space.lg,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: c.line,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <H3>{l.name}</H3>
              <Text style={[t.h2, { color: c.accentDeep, marginTop: 2 }]}>{l.contact}</Text>
              {/* Two lines, not one joined by a separator. At large text sizes a middot
                  between them wraps onto its own line and sits there as an orphan; and the
                  hours are the thing being read, so they get the row. */}
              {l.hours ? (
                <Text style={[t.caption, { color: c.inkSoft, fontWeight: '600', marginTop: 3 }]}>
                  {l.hours}
                </Text>
              ) : null}
              {l.note ? <Caption style={{ marginTop: 2 }}>{l.note}</Caption> : null}
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: space.xxl }}>
          <Rule />
          <H2 style={{ marginTop: space.lg }}>Tell one person today</H2>
          <Body style={{ marginTop: space.sm }}>
            You do not have to explain the whole thing, and you do not have to say it well. "I have
            been having a hard time with how I feel about myself and it is taking up a lot of my
            head" is enough of an opening.
          </Body>
          <BodySm style={{ marginTop: space.md }}>
            Appearance distress is unusually private — most people carrying it have never said it out
            loud to anyone. Saying it once to one person changes what is possible next.
          </BodySm>
        </View>

        <View style={{ marginTop: space.xxl }}>
          <Rule />
          <H2 style={{ marginTop: space.lg }}>Finding a therapist</H2>
          {THERAPY_GUIDANCE.map((g, i) => (
            <Body key={i} style={{ marginTop: space.md, color: c.inkSoft }}>
              {g.replace(/\*\*/g, '')}
            </Body>
          ))}
        </View>

        {/* ---------- reaching us ----------
            Last on the screen, deliberately. Everything above is about reaching a person who
            can help right now; this is about the software, and it must not compete for
            attention with a crisis line.

            It exists because without it there was no route out of the app at all. Somebody
            who hit a bug, lost writing, or wanted to say that the mirror exercise made things
            worse had exactly one channel: the public review page. That is the worst possible
            place for the first report of a real problem — slow, one-directional, and it costs
            a rating for something that might have been fixable in a day. */}
        <View style={{ marginTop: space.xxl }}>
          <Rule />
          <H2 style={{ marginTop: space.lg }}>Something wrong with the app?</H2>
          <BodySm style={{ marginTop: space.sm }}>
            Bugs, lost writing, or anything in here that made things worse rather than better.
            We would much rather hear it than not.
          </BodySm>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
            onPress={() => Linking.openURL(SUPPORT_MAILTO).catch(() => {})}
            style={({ pressed }) => ({ paddingVertical: space.md, minHeight: 44, opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[t.h3, { color: c.accentDeep, textDecorationLine: 'underline' }]}>
              {SUPPORT_EMAIL}
            </Text>
          </Pressable>
          {/* Said plainly, because on this screen of all screens somebody could reasonably
              assume otherwise. */}
          <Caption>
            This is an email address, not a crisis line. One person reads it, and not always
            the same day — if today is urgent, use the numbers above.
          </Caption>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="What Anneal is and is not, opens in your browser"
            onPress={() => Linking.openURL(LINKS.disclaimer).catch(() => {})}
            style={({ pressed }) => ({ paddingTop: space.lg, paddingBottom: space.md, minHeight: 44, opacity: pressed ? 0.6 : 1 })}
          >
            <BodySm style={{ color: c.inkSoft, textDecorationLine: 'underline' }}>
              What Anneal is, and what it is not
            </BodySm>
          </Pressable>

          {/* THE POLICIES, REACHABLE WITHOUT OPENING THE PAYWALL.
              They used to be linked from exactly one place in the app: the purchase screen.
              So somebody who never considered paying never saw them.
              (Naming that file here would trip the never-sell grep three files over, which is
              matching raw source on purpose — the point of that guard is that this screen
              cannot mention the subject at all, and a comment is not an exception.) Apple wants them
              reachable in-app, and Washington's My Health My Data Act wants the health-data
              policy "prominently published". A person who has come to the Support screen is
              also the likeliest person to want to know what this app does with what they
              wrote. */}
          {[
            { label: 'Privacy policy', url: LINKS.privacy },
            { label: 'What Anneal does with your health data', url: LINKS.healthData },
            { label: 'AI in Anneal, and where there is none', url: LINKS.ai },
            { label: 'Terms of use', url: LINKS.terms },
          ].map((l) => (
            <Pressable
              key={l.url}
              accessibilityRole="link"
              accessibilityLabel={`${l.label}, opens in your browser`}
              onPress={() => Linking.openURL(l.url).catch(() => {})}
              style={({ pressed }) => ({ paddingVertical: space.sm, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <BodySm style={{ color: c.inkSoft, textDecorationLine: 'underline' }}>{l.label}</BodySm>
            </Pressable>
          ))}
        </View>

        <Button
          label="Back"
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginTop: space.xxl, alignSelf: 'flex-start' }}
        />
      </View>
    </Screen>
  );
}
