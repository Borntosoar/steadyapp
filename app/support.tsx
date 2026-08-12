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
              accessibilityLabel={`${l.name}, ${l.contact}`}
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
            accessibilityLabel="What Steady is and is not, opens in your browser"
            onPress={() => Linking.openURL(LINKS.disclaimer).catch(() => {})}
            style={({ pressed }) => ({ paddingTop: space.lg, paddingBottom: space.md, minHeight: 44, opacity: pressed ? 0.6 : 1 })}
          >
            <BodySm style={{ color: c.inkSoft, textDecorationLine: 'underline' }}>
              What Steady is, and what it is not
            </BodySm>
          </Pressable>
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
