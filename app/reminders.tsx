import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, H1, H2, Body, BodySm, useTheme } from '../components/ui';
import { Ground, TopBar } from '../components/frost';
import { SUPPORT_PILL_CLEARANCE } from './_layout';
import { space, radius, type as t } from '../constants/theme';
import { useStore } from '../store/useStore';
import { haptic } from '../hooks/haptics';
import { useNotifications } from '../hooks/useNotifications';
import { NOTIFY_COPY } from '../content/copy';
import { TIME_CHOICES, timeLabel, suggestedTime } from '../lib/notify';

/* Reminders — the ask, and the settings, on one screen.
 *
 * ⚠ IT IS NOT IN ONBOARDING, AND THAT IS THE WHOLE DESIGN. `lib/notify.ts` rule 6 has the
 * reasoning: the OS permission sheet can be shown once, a "no" is close to permanent, and
 * asking at install asks somebody to agree to be interrupted later by a thing they have not
 * used yet. `askOwed()` gates this on one completed practice day, and the Today screen routes
 * here after that — once.
 *
 * "NONE" IS AT THE SAME WEIGHT AS A TIME, not a greyed-out link under a bright button. A
 * person who does not want to be contacted by an app about appearance worry has made a
 * reasonable decision and the screen should not make it look like the wrong one.
 *
 * THE OS IS ASKED ONLY AFTER THEY PICK A TIME. Tapping "No reminders" never opens the system
 * sheet at all, so the permission stays unspent and someone who changes their mind in March
 * still gets a real prompt rather than a dead one. */

export default function Reminders() {
  const router = useRouter();
  const c = useTheme();
  const notify = useStore((s) => s.notify);
  const profile = useStore((s) => s.profile);
  const setNotify = useStore((s) => s.setNotify);
  const { request, sync, clear } = useNotifications();

  const [choice, setChoice] = useState<number | null>(
    notify.dailyTime ?? suggestedTime(profile.survey?.worst),
  );
  const [denied, setDenied] = useState(false);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  /* Stamped whether they said yes or no. `askedAt` records that the QUESTION was put, which
     is what stops it being put again — rule 7. */
  const stamp = () => new Date().toISOString();

  const accept = async () => {
    haptic.commit();
    const ok = await request();
    if (!ok) {
      /* The OS said no, or could not be asked. Recorded honestly rather than left looking
         like it worked: nothing will fire, and the screen says so instead of the person
         discovering it by nothing happening for a week. */
      setNotify({ permitted: false, dailyTime: null, askedAt: stamp() });
      setDenied(true);
      return;
    }
    const next = { permitted: true, dailyTime: choice, groundwork: notify.groundwork, askedAt: stamp() };
    setNotify(next);
    await sync(useStore.getState() as never, { ...notify, ...next });
    leave();
  };

  const decline = async () => {
    haptic.select();
    setNotify({ permitted: false, dailyTime: null, askedAt: stamp() });
    /* Nothing was ever scheduled if they never accepted, but this also covers somebody
       arriving from Settings to turn reminders off after having had them on. */
    await clear();
    leave();
  };

  if (denied) {
    return (
      <Ground>
        <TopBar onBack={leave} />
        <View>
          <H1 style={{ paddingRight: SUPPORT_PILL_CLEARANCE }}>Your phone said no</H1>
          <Body style={{ marginTop: space.md }}>
            Notifications are switched off for Anneal in your phone's settings, so nothing can
            be sent. Everything else works exactly the same.
          </Body>
          <BodySm style={{ marginTop: space.md, color: c.inkSoft }}>
            If you change your mind, it is under Settings, then Anneal, then Notifications. The
            app will not ask you again.
          </BodySm>
          <Button label="Done" onPress={leave} style={{ marginTop: space.xl }} />
        </View>
      </Ground>
    );
  }

  return (
    <Ground>
      <TopBar onBack={leave} />
      <View>
        <H1 style={{ paddingRight: SUPPORT_PILL_CLEARANCE }}>{NOTIFY_COPY.ask.title}</H1>
        <Body style={{ marginTop: space.md }}>{NOTIFY_COPY.ask.body}</Body>

        <H2 style={{ marginTop: space.xl }}>{NOTIFY_COPY.settings.title}</H2>
        <BodySm style={{ marginTop: space.xs, color: c.inkSoft }}>
          {NOTIFY_COPY.settings.body}
        </BodySm>

        {/* Four times, not a wheel. The difference between 18:00 and 18:15 is not one anybody
            can feel, and a 1,440-option picker is a settings screen rather than a choice. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg }}>
          {TIME_CHOICES.map((m) => {
            const on = choice === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Remind me at ${timeLabel(m)}`}
                onPress={() => { haptic.select(); setChoice(m); }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: space.lg,
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: on ? c.accent : c.line,
                  backgroundColor: on ? c.accentDim : 'transparent',
                }}
              >
                <Text style={[t.label, { color: on ? c.accentDeep : c.ink }]}>{timeLabel(m)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button label={NOTIFY_COPY.ask.accept} onPress={accept} style={{ marginTop: space.xl }} />

        {/* ⚠ A REAL BUTTON, NOT A TEXT LINK, and that is a correction made from a screenshot.
            The first version put this in `Pressable` + `Text` under a filled primary — which
            is the standard "secondary" treatment everywhere else in this app and is exactly
            right for a secondary action. Declining to be contacted by a mental-health app is
            not a secondary action. It is the other half of a genuine question, and rendering
            it a weight class down tells somebody which answer the app wants.
            Same component, same height, same hit area; only the fill differs, because two
            identical filled buttons would be a different problem. */}
        <Button
          label={NOTIFY_COPY.ask.decline}
          variant="secondary"
          onPress={decline}
          style={{ marginTop: space.sm }}
        />
      </View>
    </Ground>
  );
}
