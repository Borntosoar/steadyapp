import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { KEY_BYTES, NONCE_BYTES, toBase64, fromBase64 } from '../lib/crypto.ts';
import { configureCrypto } from '../lib/storage';

/* Key custody.
 *
 * Lives here rather than in lib/ because expo-secure-store is a native module and lib/ has
 * to stay loadable under bare `node --test` — that constraint is what makes the cipher and
 * every one of its failure paths testable at all. lib/crypto.ts is pure; this file is the
 * only thing that touches the keychain.
 *
 * WHERE THE KEY LIVES. iOS Keychain, via expo-secure-store, with
 * WHEN_UNLOCKED_THIS_DEVICE_ONLY:
 *
 *   - `WHEN_UNLOCKED` because the app only ever reads state while somebody is using it.
 *     There is no background work and no notification handler that needs the journal at
 *     3am, so the key can stay unavailable whenever the phone is locked. That is what makes
 *     this worth doing: at rest and locked, the payload is genuinely opaque.
 *   - `THIS_DEVICE_ONLY` because it must not sync to iCloud Keychain. A key that syncs is a
 *     key on Apple's servers, and "nothing leaves this phone" is the promise on screen one.
 *     It also means the key and the data die together when the app is deleted, which keeps
 *     "if you delete the app it is gone" true rather than leaving an orphaned key behind.
 *
 * THE FAILURE THAT WOULD MAKE THIS WORSE THAN NO ENCRYPTION. If key retrieval fails and the
 * app responds by generating a NEW key, every existing byte becomes permanently unreadable —
 * encryption turning a recoverable situation into total loss, in an app with no backup. So
 * `ensureDeviceKey` distinguishes three outcomes and never conflates them:
 *
 *   'created'   there was no key and there was no data either: a fresh install.
 *   'loaded'    the existing key came back. The normal path.
 *   'unavailable' the keychain could not be reached. Do NOT mint a key. Do NOT decrypt.
 *                 Storage will refuse to read a sealed payload without a key and will
 *                 quarantine it instead, which keeps the bytes intact for a later attempt.
 */

/** Keychain account name. Changing this strands every existing key, and with it every
 *  existing journal. It does not change. */
const KEY_ID = 'steady.device.key.v1';

export type KeyOutcome = 'created' | 'loaded' | 'unavailable';

/** Read the device key, creating one only when the keychain is reachable and empty.
 *
 *  Returns the outcome so the caller can tell "fresh install" from "we could not ask",
 *  which are the two cases that look identical from the outside and must never be treated
 *  the same way. */
export async function ensureDeviceKey(): Promise<{ outcome: KeyOutcome; key: Uint8Array | null }> {
  let existing: string | null = null;
  try {
    existing = await SecureStore.getItemAsync(KEY_ID, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    /* Reaching the keychain failed. This is the branch that must not mint a key: a transient
       failure plus a new key equals a permanently unreadable journal. */
    return { outcome: 'unavailable', key: null };
  }

  if (existing) {
    const key = fromBase64(existing);
    // A key of the wrong length is not a key. Treat it as unavailable rather than padding it
    // into something that would decrypt nothing and then overwrite everything.
    if (key.length !== KEY_BYTES) return { outcome: 'unavailable', key: null };
    return { outcome: 'loaded', key };
  }

  const fresh = Crypto.getRandomBytes(KEY_BYTES);
  try {
    await SecureStore.setItemAsync(KEY_ID, toBase64(fresh), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    /* We could read but not write. Encrypting with a key we failed to store would make the
       very next launch unable to read what this one wrote. */
    return { outcome: 'unavailable', key: null };
  }
  return { outcome: 'created', key: fresh };
}

/**
 * Called once, before hydration, from the root layout. After this resolves the storage layer
 * either has a key and encrypts, or knows it has none and refuses to guess.
 */
export async function initDeviceCrypto(): Promise<KeyOutcome> {
  const { outcome, key } = await ensureDeviceKey();
  configureCrypto({
    key,
    /* The CSPRNG, injected for the same reason the key is: lib/ cannot import a native
       module. A fresh 24-byte nonce per write means the cipher never needs a counter, and a
       counter that resets is the classic way this construction fails. */
    randomBytes: (n: number) => Crypto.getRandomBytes(n),
    nonceBytes: NONCE_BYTES,
  });
  return outcome;
}

/** Forget the device key.
 *
 *  Called only from `reset()`, after `wipeState()`. "Delete everything" left the 256-bit key
 *  sitting in the Keychain, and the reasoning at the top of this file — "the key and the data
 *  die together when the app is deleted" — is wrong about iOS on its own terms: Keychain items
 *  survive an uninstall. AsyncStorage does die with the app, so the conclusion held by
 *  accident, but the key did not die with it.
 *
 *  A key with no ciphertext is inert, so this is tidiness rather than a breach — until a
 *  sealed byte survives somewhere it should not (a `multiRemove` that failed halfway, an
 *  encrypted device backup of the container), at which point the key needed to read it is
 *  still on the phone after the user was told everything was gone.
 *
 *  Deliberately silent and best-effort. A Keychain that cannot be reached must not turn a
 *  successful "delete everything" into a visible failure — the journal is already gone by the
 *  time this runs, and that is the part the user asked for. The next launch takes the
 *  `'created'` path and mints a fresh key. */
export async function forgetDeviceKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_ID, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    /* nothing useful to do, and nothing worth telling the user about */
  }
}
