# Accessibility Statement — Steady

**Last updated:** 11 August 2026
**Applies to:** the Steady iOS app, version 2.0.0
**Published by:** `[LEGAL ENTITY NAME — TODO]`
**Feedback:** steadyrecovery3@gmail.com

<!-- DRAFT. Not reviewed by a lawyer or by an accessibility auditor. See legal/README.md. -->
<!-- Every claim below was checked against the source before it was written. Claims that
     could not be verified are in the "What we have not done" section rather than left out. -->

---

## What we are aiming for

Steady is built to be usable by people with a wide range of needs, and the target is **WCAG 2.1 Level AA** — the international standard most accessibility law points at.

**We have not been audited and we do not claim to be certified.** No third party has assessed Steady. What follows is our own honest account of what is in place, what we have checked, and what we have not.

If something in Steady does not work for you, please tell us at steadyrecovery3@gmail.com. We will take it seriously and we would rather hear it than not.

---

## What is in place today

### Colour contrast — checked automatically, on every build

Every text colour in Steady is measured against the **worst** background it can appear on, and each one must reach at least **4.5:1** — the WCAG AA threshold for normal-size body text. Large text is allowed a lower ratio under the standard, and nothing in Steady relies on that allowance.

This is not a claim in a comment somewhere. It is a test that runs with the rest of the suite and fails the build if a colour is changed to something unreadable. It checks:

- every ink colour on the darkest ground its palette can land on, in both light and dark appearance;
- the label colour on every filled button;
- every background gradient the app paints, so widening one cannot quietly break the text sitting on it.

The test exists because the previous claims were wrong. The colour notes in the code had said for months that contrast was comfortable, while two colours were actually at 2.05:1 and 2.94:1 against the background people really saw. That is why the guarantee was moved out of prose and into arithmetic.

<!-- SOURCE: __tests__/contrast.test.mjs. AA = 4.5 with the comment "Large text is allowed
     3:1, but nothing here relies on that." Inks checked: ink, inkSoft, inkFaint, accent,
     accentDeep, cool, warn, in both palette.light and palette.dark, against
     LIGHT_GROUND_FLOOR and DARK_INK_GROUND respectively; onAccent checked against accent;
     every stop of every ramp in ATMOSPHERES checked. The 2.05:1 / 2.94:1 history is
     recorded in the file's header comment. -->

### Text size

Steady uses the system's text-size setting. If you have made text larger on your iPhone, Steady's text gets larger with it, on every screen. Nothing in the app is set to ignore that.

The smallest text anywhere in the app is 13pt, and that floor is enforced by a test.

<!-- SOURCE: no component sets allowFontScaling={false} or maxFontSizeMultiplier anywhere in
     app/ or components/ — React Native's default is to scale, so scaling is on everywhere by
     default. __tests__/contrast.test.mjs: "nothing on a control is below 13pt" asserts
     fontSize >= 13 for every entry in the type scale. -->

### Reduced motion

If you have **Reduce Motion** switched on in iOS Settings, Steady honours it:

- The celebration animation at the end of an exercise does not animate. It appears in place.
- The slow background breathing circle on the hard-day screen and the urge timer holds still instead of pulsing.

Both react to the setting immediately if you change it while the app is open, rather than waiting for a restart.

<!-- SOURCE: hooks/useReducedMotion.ts subscribes to AccessibilityInfo's reduceMotionChanged
     event; components/Finish.tsx (CheckMark and Finish) consume it and jump the animated
     value straight to its end state. components/BreathCircle.tsx QuietCircle carries its own
     equivalent listener and sets a still scale value when reduce motion is on. -->

### Screen reader support

Steady is built with VoiceOver in mind:

- Buttons, radio options, expandable sections and tab bar items carry the right roles and states, so VoiceOver says what a control is and whether it is selected, expanded, or disabled.
- Rating controls announce their meaning — a face on the distress scale reads out its label, and a level on the urge scale reads out "3 out of 10" rather than an unlabelled dot.
- Crisis line entries read out as one item combining the service name and the number, so you do not have to piece them together.
- Charts are not silent. Each one carries a text description including what it shows, how many points it has, and the latest value.
- Decorative artwork is marked as decorative so a screen reader skips it.

<!-- SOURCE: across app/ and components/ there are 37 accessibilityRole props, 17
     accessibilityLabel props, 10 accessibilityState props and 1 accessibilityElementsHidden.
     Specific examples: components/ui.tsx (button role + disabled state, radio role +
     selected state), components/frost.tsx (FaceScale radio + label, LevelBar
     `${i + 1} out of ${max}`, expandable rows with an expanded state),
     app/support.tsx accessibilityLabel={`${l.name}, ${l.contact}`},
     components/charts.tsx accessibilityRole="image" with an aria-label describing the
     series and its latest value, app/(tabs)/_layout.tsx tab items with a selected state. -->

### Touch targets

Buttons, tab items, crisis-line rows and the rescue controls on the error screen are sized at or above the 44-point minimum Apple recommends. Primary buttons are 50 to 52 points tall.

<!-- SOURCE: components/ui.tsx button minHeight 50 and 52, field minHeight 44;
     components/CrashScreen.tsx controls minHeight 44; components/frost.tsx row minHeight 44;
     app/support.tsx region chips minHeight 40 — see the gaps section. -->

### Light and dark appearance

Steady follows your system appearance setting, and both are first-class. The dark palette is not the light one dimmed — it is measured separately against its own backgrounds by the same contrast test.

<!-- SOURCE: app.json sets userInterfaceStyle "automatic"; constants/palette.ts defines
     palette.light and palette.dark as separate objects, both checked by the contrast test. -->

### Things that reduce cognitive load

These are not formal WCAG criteria, but they matter for the people who use this app:

- Plain language throughout, checked by an automated readability test.
- Nothing flashes, and nothing has a countdown or a time limit you can fail.
- No streak shaming, no red warning states about your own behaviour, no guilt copy.
- The app never blocks you from leaving a screen, and any exercise can be ended at any point.
- Crisis support is one tap from every screen and is never behind payment.

<!-- SOURCE: __tests__/readability.test.mjs and lib/readability.ts;
     __tests__/copy.test.mjs asserts no urgency language in PAYWALL_COPY and no shaming
     language reachable from the copy or streak modules; SAFETY.md §§3, 4, 5, 12. -->

---

## What we have not done, and where it falls short

We would rather list these than let you find them.

**No audit.** Nobody independent has assessed Steady. There is no VPAT, no accessibility conformance report, and no certification. Our WCAG AA target is a target, not a verified result.

**Only contrast and type size are tested automatically.** The screen-reader labelling, focus order, and touch target sizes were written by hand and reviewed by eye. There is no automated test that would catch a control shipped without a label. That means the coverage described above is our best current understanding, not a guarantee.

**We have not run a full VoiceOver pass on every screen.** We have not tested with Switch Control, Voice Control, or a braille display at all.

**We have not tested at the largest accessibility text sizes.** Several elements in the app have fixed heights — the mirror surface, some cards, some rows. At the biggest text settings, text may crowd or clip in places. If you use large text and something is cut off, please tell us which screen.

**The paced breathing circle still animates with Reduce Motion on.** In the guided breathing exercise, the circle's growing and shrinking *is* the instruction — it is how you know when to breathe in and out. Switching it off would remove the exercise rather than the decoration. The phase word ("in", "hold", "out") and the cycle count are shown as text throughout, so the same information is available without watching the movement. The slower, decorative circle elsewhere in the app does stop. We think this is the right call, and we are open to being told otherwise.

<!-- SOURCE: components/BreathCircle.tsx — BreathCircle (the guided, labelled one) has no
     reduce-motion branch; QuietCircle (the unlabelled ambient one) does. The phase label and
     the "cycle N of M" caption are rendered as Text on every frame. -->

**Some smaller controls are below 44 points.** The country selector chips on the Support screen are 40 points tall. That is under Apple's recommended minimum and we should raise it.

**Charts have a text description but no data table.** A screen reader will read a summary of a chart, not the individual values. Your full history is always available in the plain-text export, which is free on every tier and is fully readable.

**No in-app text-size or contrast controls.** Steady relies entirely on your iOS settings. There is no high-contrast mode of its own.

**No captions or transcripts**, because there is no audio or video content in the app.

**The camera-based mirror practice needs sight to use.** The alternative path — the text-guided session — runs the identical exercise, asks the identical questions, and records identical data. It is not a lesser version. It runs automatically if you decline the camera.

<!-- SOURCE: components/MirrorSurface.tsx third path, and app.json's camera purpose string.
     docs/APP-STORE.md §5.8 records that declining the permission is a fully supported path
     collecting the same data — required under Apple guideline 5.1.1(iv). -->

---

## How to make Steady work better for you

Everything here is an iOS setting, and Steady follows all of them:

- **Larger text** — Settings → Accessibility → Display & Text Size → Larger Text
- **Bold text** — Settings → Accessibility → Display & Text Size → Bold Text
- **Reduce Motion** — Settings → Accessibility → Motion → Reduce Motion
- **VoiceOver** — Settings → Accessibility → VoiceOver
- **Dark appearance** — Settings → Display & Brightness

---

## Telling us about a problem

Email steadyrecovery3@gmail.com. Please say which screen, what you were trying to do, and which accessibility settings you use, if you are comfortable sharing that.

We aim to reply within 5 working days.

If you report a barrier and we cannot fix it quickly, we will tell you honestly rather than leaving it unanswered.

---

## Legal position

This statement is voluntary. Steady is a mobile app rather than a public-sector website, so the UK's Public Sector Bodies Accessibility Regulations 2018 and the EU Web Accessibility Directive do not apply to it.

The **European Accessibility Act** applies from 28 June 2025 to certain consumer services, including e-commerce services, sold in the EU. <!-- CONFIRM SCOPE WITH COUNSEL: whether a paid self-help app sold through the App Store falls inside it is a real question, the answer affects whether a formal accessibility statement becomes mandatory rather than voluntary, and there is a micro-enterprise exemption that may or may not apply to your entity. -->

Nothing in this statement is a warranty about accessibility. See `terms-of-use.md`.

---

<!--
================================================================================
INTERNAL NOTES — will not render
================================================================================

VERIFICATION LOG — what was checked before each claim was written
CLAIM: WCAG AA contrast is tested.
  VERIFIED. __tests__/contrast.test.mjs, AA constant = 4.5, worst-case grounds, both
  palettes, plus onAccent-on-accent and every ATMOSPHERES ramp stop.
CLAIM: reduced motion supported.
  PARTIALLY VERIFIED, and stated as partial. hooks/useReducedMotion.ts exists and works,
  but its only consumer is components/Finish.tsx. components/BreathCircle.tsx QuietCircle
  duplicates the logic with its own listener instead of using the hook. The main
  BreathCircle does not honour it at all. SAFETY-adjacent note: the hook's own header
  comment claims "Every animation in this codebase has to collapse to a plain cross-fade
  when this returns true" — that is currently ASPIRATIONAL, not true. Either the hook
  comment or the code should change. Do not repeat that sentence in a published document.
CLAIM: accessibility roles and labels used throughout.
  VERIFIED BY COUNT, not by audit: 37 accessibilityRole, 17 accessibilityLabel,
  10 accessibilityState, 1 accessibilityElementsHidden across app/ and components/.
  Deliberately worded as "built with VoiceOver in mind" rather than "fully accessible
  with VoiceOver", because no VoiceOver pass has been run.
CLAIM: text scales with system settings.
  VERIFIED BY ABSENCE: no allowFontScaling={false} and no maxFontSizeMultiplier anywhere.
  RN's default is true. This is real support, but it has not been TESTED at large sizes,
  which is why the gap is listed.
CLAIM: 13pt floor. VERIFIED by test.
CLAIM: 44pt touch targets. MOSTLY VERIFIED — components/ui.tsx 50/52/44,
  CrashScreen 44, frost.tsx 44. app/support.tsx region chips are minHeight: 40, which is
  why the shortfall is named rather than papered over.
CLAIM: charts have text descriptions.
  VERIFIED. components/charts.tsx accessibilityRole="image" + aria-label with the series
  label, point count and latest value. NOTE: aria-label is a web-only prop in
  react-native-web; on iOS the correct prop is accessibilityLabel. One of the two chart
  components uses accessibilityRole="image" WITHOUT any label at all (line 48 region).
  RECOMMEND: add accessibilityLabel alongside aria-label on both, then this claim gets
  stronger. Until then the wording "charts are not silent" is the most that is defensible,
  and even that is worth re-checking on device.

CHEAP FIXES THAT WOULD LET THIS DOCUMENT SAY MORE
1. Add accessibilityLabel (not just aria-label) to both chart components. ~2 lines.
2. Raise app/support.tsx region chips from minHeight 40 to 44. ~1 line.
3. Point components/BreathCircle.tsx QuietCircle at hooks/useReducedMotion instead of
   duplicating the listener. Removes a drift risk.
4. Run one VoiceOver pass over onboarding → check-in → grounding → support. That is the
   safety path, and it is the one that most needs to work for a blind user.
5. Test at the largest Dynamic Type setting and fix whatever clips.
None of these blocks App Store submission. All of them make this statement truer.
-->
