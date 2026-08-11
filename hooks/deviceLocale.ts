import { NativeModules, Platform } from 'react-native';

/* What language and country is this phone set to?
 *
 * Read at first launch for exactly one purpose: choosing which crisis lines to show before
 * the person has told us where they are. That default used to be hard-coded to the United
 * States, which is a defensible guess for an English-only listing and an indefensible one
 * for an app available in every territory — a person in Germany opening the support screen
 * on a bad day was being handed 911.
 *
 * A GUESS, NEVER A DECISION. The picker stays on the support screen and a stored choice
 * always wins. Someone travelling, on a phone bought abroad, or running an English locale in
 * a non-English country must never have to argue with the app about where they are. An
 * unrecognised locale falls through to the international directory rather than to a
 * confident wrong answer — see regionForLocale in constants/support.ts.
 *
 * NOTHING IS SENT ANYWHERE. This reads a device setting and uses it locally, in the same
 * process, to pick an entry from a static list. It is not an identifier and it is not
 * stored beyond the region key the user could have picked by hand anyway.
 *
 * expo-localization is deliberately NOT a dependency for this. It would be a whole native
 * module, added to a manifest the import allowlist governs, to read a string that both
 * platforms already expose. */
export function deviceLocale(): string | null {
  try {
    if (Platform.OS === 'web') {
      return typeof navigator !== 'undefined' ? navigator.language ?? null : null;
    }
    if (Platform.OS === 'ios') {
      const s = NativeModules.SettingsManager?.settings;
      /* AppleLocale on older iOS, AppleLanguages[0] on newer. Both can be absent in a
         simulator or a stripped build, hence the chain and the fallback. */
      return s?.AppleLocale ?? s?.AppleLanguages?.[0] ?? null;
    }
    return NativeModules.I18nManager?.localeIdentifier ?? null;
  } catch {
    /* A missing native module must never be the reason somebody cannot open the app. The
       caller treats null as "no idea", which lands on the international directory. */
    return null;
  }
}
