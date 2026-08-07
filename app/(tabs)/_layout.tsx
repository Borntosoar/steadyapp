import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom,
        backgroundColor: c.bgDeep,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.line,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          height: TAB_BAR_HEIGHT,
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
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 6 }}
            >
              <Icon color={color} active={focused} />
              <Text style={[t.caption, { color, fontSize: 11 }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
