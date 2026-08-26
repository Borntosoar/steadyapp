import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../components/ui';
import { space, type as t, TAB_BAR_HEIGHT, LAYOUT_MAX_WIDTH } from '../../constants/theme';

/* Bottom tab bar, drawn by hand rather than themed.
 *
 * Four destinations is the ceiling: this is used by people who are already spending too
 * much of the day deciding things about themselves, and a five-slot bar with a
 * decorative centre button would be one more decision per open. */

type IconProps = { active: boolean; color: string };

const Home = ({ color, active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 10.5 12 3.8l8.5 6.7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill={active ? color : 'none'}
      fillOpacity={active ? 0.16 : 0}
    />
  </Svg>
);

const Practice = ({ color, active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.2} stroke={color} strokeWidth={1.6} fill={active ? color : 'none'} fillOpacity={active ? 0.16 : 0} />
    <Circle cx={12} cy={12} r={2.6} fill={color} opacity={active ? 1 : 0.7} />
  </Svg>
);

const Progress = ({ color, active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3.5 16.5 9 10.8l3.6 3.4L20.5 6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.5 6h-4.4M20.5 6v4.4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    {active && <Circle cx={9} cy={10.8} r={2} fill={color} />}
  </Svg>
);

const Learn = ({ color, active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 5.2h6a2.4 2.4 0 0 1 2 1.2 2.4 2.4 0 0 1 2-1.2h6v13h-6a2.4 2.4 0 0 0-2 1.2 2.4 2.4 0 0 0-2-1.2H4z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill={active ? color : 'none'}
      fillOpacity={active ? 0.16 : 0}
    />
    <Path d="M12 6.4v12" stroke={color} strokeWidth={1.4} opacity={0.6} />
  </Svg>
);

const ICONS = { index: Home, practice: Practice, progress: Progress, learn: Learn } as const;
const LABELS = { index: 'Today', practice: 'Practice', progress: 'Progress', learn: 'Learn' } as const;

function TabBar({ state, navigation }: any) {
  const c = useTheme();
  const insets = useSafeAreaInsets();

  return (
    /* Frosted rather than a solid slab. On a translucent app a solid bar at the bottom
       reads as a different piece of software bolted to the screen.
       The gradient above it is what stops content being sliced mid-word by the bar's top
       edge — "Daily check-in" cut in half was visible on four different screens. */
    <BlurView
      intensity={64}
      tint={c.isDark ? 'dark' : 'light'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom,
        backgroundColor: c.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.lineStrong,
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', c.bg]}
        style={{ position: 'absolute', left: 0, right: 0, top: -28, height: 28 }}
      />
      <View
        style={{
          flexDirection: 'row',
          /* minHeight, NOT height. At 2.2x text the labels were pushed below a hard 64pt box
             and clipped at the screen edge; at 3.1x the row rendered as
             "TodayPra…Pro… Learn" — adjacent labels touching with no gutter, two ellipsised.
             Note the cap above is a no-op on the web build, which is a shipping target:
             react-native-web does not implement maxFontSizeMultiplier, so the caps in this
             app exist on one of two platforms. The container has to survive the uncapped
             case rather than trust a cap that is only sometimes there. */
          minHeight: TAB_BAR_HEIGHT,
          width: '100%',
          maxWidth: LAYOUT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: space.sm,
        }}
      >
        {state.routes.map((route: any, i: number) => {
          const focused = state.index === i;
          const Icon = ICONS[route.name as keyof typeof ICONS];
          const label = LABELS[route.name as keyof typeof LABELS];
          if (!Icon) return null;
          const color = focused ? c.accent : c.inkFaint;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
              /* A gutter per tab, so two labels can never abut even when both are at their
                 widest. */
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingTop: 6,
                paddingHorizontal: space.xs,
              }}
            >
              <Icon color={color} active={focused} />
              {/* Capped and single-line. The tab bar is fixed chrome sharing one row between
                  four labels: at large text sizes "Practice" and "Progress" run into each
                  other and become one unreadable word, which serves the person who needed the
                  bigger text worse than a slightly smaller label does.
                  The icon carries the meaning at any size, the accessibilityLabel above is
                  uncapped and complete for VoiceOver, and every destination is reachable from
                  the screens themselves as well as from here. */}
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
                /* 12, not 11. iOS HIG sets 12pt as the floor for legible text and this is a
                       hand-written override of `caption`, which is 13. */
                style={[t.caption, { color, fontSize: 12 }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      tabBar={(p) => <TabBar {...p} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="learn" />
    </Tabs>
  );
}
