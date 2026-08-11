/* Encryption at rest — the pure half.
 *
 * WHAT THIS DEFENDS AGAINST, AND WHAT IT DOES NOT
 *
 * Everything this app holds is on the device: a journal about somebody's body, distress
 * ratings, and a crisis plan naming who they would tell. Until now that sat in AsyncStorage
 * as plaintext JSON, protected only by the OS sandbox and iOS's default data-protection
 * class — which unlocks at first unlock after boot and does not re-lock when the screen does.
 *
 * That defends against a stranger picking up a locked phone, which is the common case. It
 * does not defend against forensic extraction, a jailbroken device, or anyone with file-level
 * access to the container. Those are the threats this file exists for.
 *
 * It does NOT defend against somebody holding the unlocked phone with the app open. Nothing
 * can, short of a second passcode, and this app is not adding one — a person reaching for the
 * hard-day path at 2am must not meet a lock screen. That trade is deliberate.
 *
 * WHY XCHACHA20-POLY1305 RATHER THAN AES-GCM
 *
 * There is no AES available: expo-crypto ships a CSPRNG and hashes, not a cipher, and React
 * Native has no crypto.subtle. So the cipher is pure JavaScript, and in pure JavaScript AES
 * is slow — there is no AES-NI to reach. ChaCha20 was designed to be fast in software, which
 * is exactly the situation here. XChaCha's 24-byte nonce is the other reason: it is large
 * enough to be generated at random for every single write with no meaningful collision risk,
 * so this file never has to maintain a counter, and a counter that resets is the classic way
 * a construction like this fails. Poly1305 makes it authenticated, so a tampered payload is
 * detected rather than silently decrypted into nonsense.
 *
 * NOTHING IN THIS FILE MAY IMPORT REACT, THE STORE, OR expo-secure-store. It is pure so it
 * can be tested under bare Node, which is the only way the round trip and — more importantly
 * — the failure paths get exercised at all. Key custody lives in hooks/deviceKey.ts, on the
 * other side of the seam.
 */

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

/** Bytes in the key. 256 bits. */
export const KEY_BYTES = 32;
/** Bytes in the nonce. XChaCha's extended nonce, random per write. */
export const NONCE_BYTES = 24;

/** Envelope version. Sits outside the ciphertext so the format can change without a
 *  decryption attempt being needed to work out which format it is. */
export const CIPHER_VERSION = 1;

export interface SealedPayload {
  /** Envelope version. Present only on encrypted payloads — its absence is how a plaintext
   *  payload from an older build is recognised. */
  e: number;
  /** Base64 nonce. */
  n: string;
  /** Base64 ciphertext, Poly1305 tag included. */
  c: string;
}

/* Base64 without Buffer and without atob/btoa.
 *
 * Bare Node has Buffer, Hermes has neither Buffer nor a reliable global atob, and
 * react-native-web has atob but chokes on the high bytes a cipher produces. Writing the 30
 * lines is less risk than depending on which of three runtimes is underneath. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const cc = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : B64[((b & 15) << 2) | ((cc ?? 0) >> 6)];
    out += cc === undefined ? '=' : B64[cc & 63];
  }
  return out;
}

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array((clean.length * 3) >> 2);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2]);
    const d = B64.indexOf(clean[i + 3]);
    out[p++] = (a << 2) | (b >> 4);
    if (c >= 0) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (d >= 0) out[p++] = ((c & 3) << 6) | d;
  }
  return out.subarray(0, p);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Encrypt a UTF-8 string. `nonce` is injected rather than generated here so this stays pure
 * and so the tests can pin a known vector; callers pass 24 CSPRNG bytes.
 */
export function seal(plaintext: string, key: Uint8Array, nonce: Uint8Array): SealedPayload {
  if (key.length !== KEY_BYTES) throw new Error(`key must be ${KEY_BYTES} bytes`);
  if (nonce.length !== NONCE_BYTES) throw new Error(`nonce must be ${NONCE_BYTES} bytes`);
  const ct = xchacha20poly1305(key, nonce).encrypt(enc.encode(plaintext));
  return { e: CIPHER_VERSION, n: toBase64(nonce), c: toBase64(ct) };
}

/**
 * Decrypt. Returns null on ANY failure — wrong key, tampered bytes, truncated payload,
 * malformed envelope.
 *
 * Null means "could not read this", which the storage layer must treat exactly as it treats
 * an unparseable payload: quarantine the bytes, lock writes, and degrade. It must never be
 * treated as "there was nothing there". The difference matters more here than anywhere else
 * in the app — an empty state that gets written back over a recoverable payload is how
 * encryption turns a bad day into permanent loss, and it is the single most likely way for
 * adding encryption to make this app worse rather than better.
 */
export function open(payload: unknown, key: Uint8Array): string | null {
  if (!isSealed(payload)) return null;
  if (key.length !== KEY_BYTES) return null;
  try {
    const nonce = fromBase64(payload.n);
    if (nonce.length !== NONCE_BYTES) return null;
    const pt = xchacha20poly1305(key, nonce).decrypt(fromBase64(payload.c));
    return dec.decode(pt);
  } catch {
    // Poly1305 throws on a bad tag. That is the library working, not an error to surface.
    return null;
  }
}

/** Is this an encrypted envelope, as opposed to a plaintext payload from an older build?
 *
 *  This is what makes the upgrade transparent: an existing user's plaintext blob is read as
 *  it always was, then re-written sealed on the next save. Nobody is asked anything and
 *  nothing is lost in the transition. */
export function isSealed(v: unknown): v is SealedPayload {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return typeof p.e === 'number' && typeof p.n === 'string' && typeof p.c === 'string';
}
