import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from './ui';
import { space, radius, type as t } from '../constants/theme';
import { SUPPORT_REGIONS } from '../constants/support';

/* Which country's crisis lines to show.
 *
 * ONE PICKER, TWO PLACES. This markup lived inline on the Support screen and onboarding
 * needed the same thing. Copying it would have made two lists of thirty regions that agree
 * today and drift the first time one gains an entry — which is the failure this repository
 * has caught in a dozen other shapes. So it moved here and Support renders this.
 *
 * It never asks for location permission and never could: the whole list is static, the
 * selection is a key in local storage, and app.json requests no location entitlement on
 * either platform. See legal/consumer-health-data-policy.md §6, which says so to the two US
 * states that ban geofencing around health facilities. */
export function RegionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {SUPPORT_REGIONS.map((r) => {
        const on = r.key === value;
        return (
          <Pressable
            key={r.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Show crisis lines for ${r.label}`}
            onPress={() => onChange(r.key)}
            style={{
              paddingVertical: 9,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              backgroundColor: on ? c.accent : c.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: on ? c.accent : c.line,
              /* 44, not 40. The iOS touch floor, and this is the control somebody uses on
                 the worst day they have had in a while. */
              minHeight: 44,
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
  );
}
