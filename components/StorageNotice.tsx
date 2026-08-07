import React from 'react';
import { View, StyleSheet } from 'react-native';
import { H3, BodySm, Button, useTheme } from './ui';
import { space, radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { STORAGE_COPY } from '../content/copy.ts';

/* The surface for the two ways persistence can stop working.
 *
 * `lib/storage.ts` detects both and `store/useStore.ts` tracks them, but until this
 * existed nothing told the user — which made the detection worse than useless, because the
 * code carried a comment arguing "the caller needs to know" while no caller did anything.
 * Somebody could journal for weeks with every entry looking saved, and lose all of it on
 * the next cold start with no explanation available to them.
 *
 * Renders nothing at all when storage is healthy, which is almost always.
 *
 * Deliberately NOT modal, and deliberately not on a safety surface. Someone opening
 * grounding at 2am does not need a storage warning between them and a breathing exercise.
 * It appears on Today and Progress, and on Progress it sits directly above the backup
 * button that resolves it. */
export function StorageNotice({ onBackup }: { onBackup?: () => void }) {
  const c = useTheme();
  const loadOk = useStore((s) => s.loadOk);
  const saveOk = useStore((s) => s.saveOk);
  const quarantinedAt = useStore((s) => s.quarantinedAt);

  if (loadOk && saveOk) return null;

  const copy = !loadOk
    ? quarantinedAt
      ? STORAGE_COPY.unreadable
      : STORAGE_COPY.locked
    : STORAGE_COPY.cannotSave;

  const showBackup = loadOk && !saveOk && !!onBackup;

  return (
    <View
      style={{
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.lineStrong,
        backgroundColor: c.surface,
        padding: space.lg,
      }}
    >
      {/* Warn colour on the marker only, not the whole surface. This is information the
          user needs, not an emergency to be shouted at somebody who may already be having
          a bad day. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.warn }} />
        <H3>{copy.title}</H3>
      </View>
      <BodySm style={{ marginTop: space.sm, color: c.ink }}>{copy.body}</BodySm>
      {showBackup && (
        <Button
          label={STORAGE_COPY.cannotSave.action}
          variant="secondary"
          onPress={onBackup}
          style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
        />
      )}
    </View>
  );
}
