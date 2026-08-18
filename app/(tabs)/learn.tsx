import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Button, H1, H2, H3, BodySm, Caption, Chip, useTheme, IN_FIXED_SHAPE } from '../../components/ui';
import { Frost, Ground, IconBadge } from '../../components/frost';
import { space, type as t } from '../../constants/theme';
import { MODULES, CONTENT_DISCLAIMER } from '../../content/modules';
import { PHASES } from '../../lib/protocol';
import { useStore } from '../../store/useStore';
import { useEntitlement } from '../../hooks/useEntitlement';

/* Learn.
 *
 * The week number in a disc, not a gradient thumbnail. Twelve blurred gradients down a
 * reading list told you nothing about which module you were looking at; the number tells
 * you exactly where in the twelve weeks it sits, which is the only thing the thumbnail
 * position was ever standing in for. */

export default function LearnIndex() {
  const c = useTheme();
  const router = useRouter();
  const readModules = useStore((s) => s.readModules);
  const currentWeek = useStore((s) => s.protocol.currentWeek);
  const { entitled } = useEntitlement();

  const readCount = MODULES.filter((m) => readModules.includes(m.slug)).length;

  /* Where to pick up.
   *
   * A list of twelve rows differentiated only by a title and a week number gives somebody
   * no reason to open any particular one, so the most common outcome is that they open
   * none. This card supplies the default: the first thing they have not read that is
   * actually available to them, phrased forward. It never says what they have missed. */
  const open = (m: (typeof MODULES)[number]) => m.free || entitled;
  const unread = MODULES.filter((m) => !readModules.includes(m.slug) && open(m));
  const resume = unread.find((m) => m.week <= currentWeek) ?? unread[0];

  return (
    <Ground tabBarSpace>
      <H1 style={{ marginTop: space.xl }}>Learn</H1>
      <BodySm style={{ marginTop: space.sm }}>
        Twelve short reads, one a week. Each one explains why that week&apos;s practice works,
        so you understand it instead of just following it.
      </BodySm>

      {resume ? (
        <Frost style={{ marginTop: space.lg }} onPress={() => router.push(`/module/${resume.slug}`)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <View style={{ flex: 1 }}>
              <Caption style={{ color: c.accentDeep }}>
                {readCount === 0 ? 'Start here' : `Where you left off · ${readCount} of ${MODULES.length} read`}
              </Caption>
              <H2 style={{ marginTop: 2 }}>{resume.title}</H2>
              <BodySm style={{ marginTop: space.xs }}>{resume.kicker}</BodySm>
              <Caption style={{ marginTop: space.xs }}>
                Week {resume.week} · {resume.minutes} min read
              </Caption>
            </View>
            <IconBadge icon="arrow" />
          </View>
        </Frost>
      ) : (
        <Caption style={{ marginTop: space.lg }}>
          All {MODULES.length} read. They stay here for whenever you want them again.
        </Caption>
      )}

      {PHASES.map((phase) => {
        const mods = MODULES.filter((m) => m.phase === phase.id);
        if (!mods.length) return null;
        return (
          <View key={phase.id} style={{ marginTop: space.xl }}>
            <Caption style={{ marginBottom: space.sm }}>
              Part {phase.id}. {phase.name}
            </Caption>

            <Frost>
              {mods.map((m, i) => {
                const locked = !m.free && !entitled;
                const read = readModules.includes(m.slug);
                const ahead = m.week > currentWeek && !m.free;
                return (
                  <Pressable
                    key={m.slug}
                    accessibilityRole="button"
                    accessibilityLabel={`${m.title}${locked ? ', part of Anneal plus' : ''}${read ? ', read' : ''}`}
                    onPress={() => router.push(locked ? '/paywall' : `/module/${m.slug}`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.lg,
                      paddingVertical: space.md,
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: c.line,
                      opacity: pressed ? 0.85 : locked ? 0.66 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: read ? c.cool : c.accentDim,
                      }}
                    >
                      {read ? (
                        <Svg width={16} height={16} viewBox="0 0 16 16">
                          <Path
                            d="M3.4 8.4 6.5 11.4 12.6 5"
                            stroke={c.onAccent}
                            strokeWidth={2.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </Svg>
                      ) : (
                        <Text maxFontSizeMultiplier={IN_FIXED_SHAPE} style={[t.label, { color: c.accentDeep }]}>{m.week}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <H3>{m.title}</H3>
                      {/* The one line that says why this one is worth opening. Twelve titles
                          and twelve week numbers are not twelve reasons. */}
                      <BodySm style={{ marginTop: 2 }} numberOfLines={2}>
                        {m.kicker}
                      </BodySm>
                      <Caption style={{ marginTop: space.xs }}>
                        Week {m.week} · {m.minutes} min read
                      </Caption>
                    </View>

                    {locked ? (
                      <Chip label="Anneal+" tone="accent" />
                    ) : m.free ? (
                      <Chip label="Free" tone="cool" />
                    ) : ahead ? (
                      /* Was "Ahead", which reads as a judgement about pace. A week number is
                         a fact, and it matches how a locked row is labelled everywhere else. */
                      <Chip label={`Week ${m.week}`} />
                    ) : (
                      <Text style={[t.body, { color: c.inkFaint }]}>›</Text>
                    )}
                  </Pressable>
                );
              })}
            </Frost>
          </View>
        );
      })}

      {!entitled && (
        <Frost style={{ marginTop: space.xl }}>
          <H2>Weeks 2 to 12</H2>
          <BodySm style={{ marginTop: space.xs }}>
            Week one&apos;s three reads stay free forever. So does every calming exercise and all
            crisis support.
          </BodySm>
          <Button
            label="See Anneal+"
            onPress={() => router.push('/paywall')}
            style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
          />
        </Frost>
      )}

      <Caption style={{ marginTop: space.xl }}>{CONTENT_DISCLAIMER}</Caption>
    </Ground>
  );
}
