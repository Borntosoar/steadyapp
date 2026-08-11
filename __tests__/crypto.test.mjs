import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  seal, open, isSealed, toBase64, fromBase64, KEY_BYTES, NONCE_BYTES, CIPHER_VERSION,
} from '../lib/crypto.ts';

/* Encryption at rest.
 *
 * The round trip is the easy half. The half that matters is what happens when it FAILS,
 * because this app has no server and no backup: a decrypt failure that reads as "there was
 * nothing there" gets an empty state written back over a recoverable payload, and somebody's
 * journal is gone permanently. Adding encryption is only an improvement if the failure paths
 * are exactly right, so most of this file is about them. */

const key = () => new Uint8Array(KEY_BYTES).fill(7);
const nonce = () => new Uint8Array(NONCE_BYTES).fill(3);

describe('base64 survives the bytes a cipher actually produces', () => {
  test('round trips every byte value', () => {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    assert.deepEqual(Array.from(fromBase64(toBase64(all))), Array.from(all));
  });

  test('round trips every length modulo 3, where the padding cases live', () => {
    for (let n = 0; n < 12; n++) {
      const b = new Uint8Array(n);
      for (let i = 0; i < n; i++) b[i] = (i * 37 + 11) & 255;
      assert.deepEqual(Array.from(fromBase64(toBase64(b))), Array.from(b), `length ${n}`);
    }
  });

  test('agrees with Buffer, which is the reference the app cannot use at runtime', () => {
    const b = new Uint8Array([0, 1, 127, 128, 200, 255, 42]);
    assert.equal(toBase64(b), Buffer.from(b).toString('base64'));
  });
});

describe('the round trip', () => {
  test('a sealed string comes back exactly', () => {
    const s = 'Everything I wrote today, including the things I would not say out loud.';
    assert.equal(open(seal(s, key(), nonce()), key()), s);
  });

  test('unicode, emoji and newlines survive', () => {
    const s = 'line one\nline two\t— dash — café 🫥 日本語\r\nend';
    assert.equal(open(seal(s, key(), nonce()), key()), s);
  });

  test('an empty string is not the same as a failure', () => {
    const sealed = seal('', key(), nonce());
    assert.equal(open(sealed, key()), '', 'an empty journal must decrypt to "", not to null');
  });

  test('a realistic payload round trips', () => {
    const big = JSON.stringify({ notes: Array.from({ length: 2000 }, (_, i) => `entry ${i} ${'x'.repeat(80)}`) });
    assert.equal(open(seal(big, key(), nonce()), key()), big);
  });

  test('a fresh nonce produces different ciphertext for identical input', () => {
    const a = seal('same', key(), new Uint8Array(NONCE_BYTES).fill(1));
    const b = seal('same', key(), new Uint8Array(NONCE_BYTES).fill(2));
    assert.notEqual(a.c, b.c, 'identical plaintext under a reused nonce leaks equality');
  });
});

describe('every failure returns null, and null must never be read as "empty"', () => {
  test('the wrong key does not decrypt', () => {
    const sealed = seal('secret', key(), nonce());
    assert.equal(open(sealed, new Uint8Array(KEY_BYTES).fill(9)), null);
  });

  test('tampered ciphertext is detected rather than silently decrypted', () => {
    const sealed = seal('secret', key(), nonce());
    const bytes = fromBase64(sealed.c);
    bytes[0] ^= 1;
    assert.equal(open({ ...sealed, c: toBase64(bytes) }, key()), null);
  });

  test('a tampered nonce is detected', () => {
    const sealed = seal('secret', key(), nonce());
    const n = fromBase64(sealed.n);
    n[0] ^= 1;
    assert.equal(open({ ...sealed, n: toBase64(n) }, key()), null);
  });

  test('truncated ciphertext does not throw', () => {
    const sealed = seal('secret', key(), nonce());
    assert.equal(open({ ...sealed, c: sealed.c.slice(0, 8) }, key()), null);
  });

  test('a malformed envelope does not throw', () => {
    for (const bad of [null, undefined, 0, '', 'nope', [], {}, { e: 1 }, { e: 1, n: 'x' }, { n: 'a', c: 'b' }]) {
      assert.equal(open(bad, key()), null, `open(${JSON.stringify(bad)}) should be null`);
    }
  });

  test('a wrong-sized key is refused rather than used', () => {
    const sealed = seal('secret', key(), nonce());
    assert.equal(open(sealed, new Uint8Array(16)), null);
    assert.throws(() => seal('x', new Uint8Array(16), nonce()));
    assert.throws(() => seal('x', key(), new Uint8Array(8)));
  });
});

describe('an existing plaintext install is recognised, not destroyed', () => {
  test('a plaintext envelope is not mistaken for an encrypted one', () => {
    // What every current user has on disk today.
    assert.equal(isSealed({ v: 4, data: { checkIns: [] } }), false);
    assert.equal(isSealed({}), false);
    assert.equal(isSealed(null), false);
  });

  test('an encrypted envelope is recognised', () => {
    const sealed = seal('x', key(), nonce());
    assert.equal(isSealed(sealed), true);
    assert.equal(sealed.e, CIPHER_VERSION);
  });

  test('the envelope carries no plaintext', () => {
    /* A version number and a nonce are fine in the clear. Anything else in the envelope
       would be metadata leaking beside the thing it describes. */
    const sealed = seal('the quick brown fox', key(), nonce());
    assert.deepEqual(Object.keys(sealed).sort(), ['c', 'e', 'n']);
    assert.doesNotMatch(JSON.stringify(sealed), /quick|brown|fox/);
  });
});
