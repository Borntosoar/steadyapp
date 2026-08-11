import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/* Encryption at rest, through the real storage layer.
 *
 * lib/crypto.ts is unit-tested on its own. This file tests the thing that actually matters:
 * that loadState and saveState fail in the RIGHT DIRECTION. There is no server and no
 * backup, so the dangerous outcome is never "we could not read it" — it is "we could not
 * read it, so we returned an empty state, and then wrote that empty state over the bytes".
 * That is how adding encryption makes an app worse than not having it.
 *
 * AsyncStorage is stubbed through the module cache before lib/storage.ts is imported. */

const store = new Map();
let failNextRead = false;

const mockAsyncStorage = {
  async getItem(k) {
    if (failNextRead) {
      failNextRead = false;
      throw new Error('storage unavailable');
    }
    return store.has(k) ? store.get(k) : null;
  },
  async setItem(k, v) { store.set(k, v); },
  async removeItem(k) { store.delete(k); },
  async getAllKeys() { return [...store.keys()]; },
  async multiRemove(keys) { for (const k of keys) store.delete(k); },
};

const { register } = await import('node:module');
const { pathToFileURL } = await import('node:url');
register(
  `data:text/javascript,
   export async function resolve(spec, ctx, next) {
     if (spec === '@react-native-async-storage/async-storage') {
       return { url: 'mock:async-storage', shortCircuit: true };
     }
     return next(spec, ctx);
   }
   export async function load(url, ctx, next) {
     if (url === 'mock:async-storage') {
       return { format: 'module', shortCircuit: true,
         source: 'const s = globalThis.__MOCK_ASYNC_STORAGE__; export default s;' };
     }
     return next(url, ctx);
   }`,
  pathToFileURL('./')
);
globalThis.__MOCK_ASYNC_STORAGE__ = mockAsyncStorage;

const {
  loadState, saveState, wipeState, configureCrypto, isEncryptionActive,
  emptyState, STORAGE_KEY, QUARANTINE_PREFIX,
} = await import('../lib/storage.ts');
const { isSealed, KEY_BYTES, NONCE_BYTES } = await import('../lib/crypto.ts');

/** Deterministic stand-in for expo-crypto's CSPRNG. Fine here; never in the app. */
let counter = 0;
const fakeRandom = (n) => {
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = (counter * 31 + i * 17) & 255;
  counter++;
  return b;
};

const KEY_A = new Uint8Array(KEY_BYTES).fill(11);
const KEY_B = new Uint8Array(KEY_BYTES).fill(22);

const withKey = (key) => configureCrypto({ key, randomBytes: fakeRandom, nonceBytes: NONCE_BYTES });

const quarantineKeys = () => [...store.keys()].filter((k) => k.startsWith(QUARANTINE_PREFIX));

beforeEach(() => {
  store.clear();
  failNextRead = false;
  counter = 0;
  withKey(null);
});

describe('the encrypted round trip', () => {
  test('what lands on disk is not readable as the journal', async () => {
    withKey(KEY_A);
    const s = emptyState();
    s.thoughtRecords = [{
      id: 't1', date: '2026-01-02', situation: 'the changing room mirror',
      emotion: 'shame', emotionIntensity: 80, automaticThought: 'everyone noticed',
      distortions: [], evidenceFor: '', evidenceAgainst: '', balancedThought: '', reRatedIntensity: 40,
    }];
    assert.equal(await saveState(s), true);

    const onDisk = store.get(STORAGE_KEY);
    assert.doesNotMatch(onDisk, /changing room|shame|everyone noticed/,
      'the journal is legible on disk');
    assert.equal(isSealed(JSON.parse(onDisk)), true);
  });

  test('and it reads back exactly', async () => {
    withKey(KEY_A);
    const s = emptyState();
    s.checkIns = [{ id: 'c', date: '2026-01-02', preoccupationMinutes: 120, urge: 5, avoidance: 'small', suds: 5 }];
    await saveState(s);

    const { state, ok } = await loadState();
    assert.equal(ok, true);
    assert.equal(state.checkIns.length, 1);
    assert.equal(state.checkIns[0].preoccupationMinutes, 120);
  });

  test('a fresh install with a key is not mistaken for anything', async () => {
    withKey(KEY_A);
    const { state, ok } = await loadState();
    assert.equal(ok, true);
    assert.deepEqual(state.checkIns, []);
    assert.equal(quarantineKeys().length, 0, 'nothing to quarantine on a fresh install');
  });
});

describe('the upgrade from an existing plaintext install is transparent', () => {
  test('a plaintext payload written by an older build still reads', async () => {
    // Exactly what is on disk for every current user.
    store.set(STORAGE_KEY, JSON.stringify({
      v: 4,
      data: { ...emptyState(), checkIns: [{ id: 'c', date: '2026-01-02', preoccupationMinutes: 90, urge: 4, avoidance: 'none', suds: 3 }] },
    }));
    withKey(KEY_A);

    const { state, ok } = await loadState();
    assert.equal(ok, true, 'an existing install must not be quarantined by the upgrade');
    assert.equal(state.checkIns[0].preoccupationMinutes, 90);
    assert.equal(quarantineKeys().length, 0);
  });

  test('and the next save seals it, with no migration step and nothing asked of anybody', async () => {
    store.set(STORAGE_KEY, JSON.stringify({ v: 4, data: emptyState() }));
    withKey(KEY_A);
    const { state } = await loadState();
    await saveState(state);
    assert.equal(isSealed(JSON.parse(store.get(STORAGE_KEY))), true);
  });
});

describe('failure goes toward keeping the bytes, never toward overwriting them', () => {
  test('a sealed payload with NO key is quarantined, not read as empty', async () => {
    /* The keychain was unreachable this launch. If this returned `ok: true` with an empty
       state, the next mutation would write that blank over a perfectly good journal that a
       later launch could have decrypted. */
    withKey(KEY_A);
    await saveState(emptyState());
    const sealed = store.get(STORAGE_KEY);

    withKey(null);
    const { ok, quarantinedAt } = await loadState();
    assert.equal(ok, false, 'writes must be locked when the payload cannot be read');
    assert.ok(quarantinedAt, 'the bytes must be kept');
    assert.equal(store.get(quarantinedAt), sealed, 'the quarantined copy must be byte-identical');
  });

  test('the WRONG key is quarantined, not read as empty', async () => {
    withKey(KEY_A);
    await saveState(emptyState());

    withKey(KEY_B);
    const { ok, quarantinedAt } = await loadState();
    assert.equal(ok, false);
    assert.ok(quarantinedAt);
  });

  test('tampered ciphertext is quarantined', async () => {
    withKey(KEY_A);
    await saveState(emptyState());
    const env = JSON.parse(store.get(STORAGE_KEY));
    env.c = env.c.slice(0, -6) + 'AAAAAA';
    store.set(STORAGE_KEY, JSON.stringify(env));

    const { ok } = await loadState();
    assert.equal(ok, false, 'a tampered payload must not be accepted');
  });

  test('a locked-out load never writes anything', async () => {
    withKey(KEY_A);
    await saveState(emptyState());
    const before = store.get(STORAGE_KEY);

    withKey(null);
    await loadState();
    assert.equal(store.get(STORAGE_KEY), before,
      'the original bytes must be untouched after a failed read');
  });

  test('a read that throws is not a fresh install', async () => {
    withKey(KEY_A);
    failNextRead = true;
    const { ok } = await loadState();
    assert.equal(ok, false);
  });
});

describe('the honest-state accessors', () => {
  test('isEncryptionActive reports what is actually happening', async () => {
    withKey(null);
    assert.equal(isEncryptionActive(), false);
    withKey(KEY_A);
    assert.equal(isEncryptionActive(), true);
  });

  test('without a key, saving still works rather than losing the entry', async () => {
    /* Refusing to write would mean a keychain hiccup silently stops somebody recording
       anything, in an app people open on their worst days. Plaintext is the lesser harm and
       it is surfaced rather than hidden. */
    withKey(null);
    assert.equal(await saveState(emptyState()), true);
    assert.equal(isSealed(JSON.parse(store.get(STORAGE_KEY))), false);
  });
});

describe('delete my data means all of it', () => {
  test('wipeState removes the quarantined copies too', async () => {
    withKey(KEY_A);
    await saveState(emptyState());
    withKey(null);
    await loadState(); // produces a quarantine copy
    assert.ok(quarantineKeys().length > 0, 'precondition: something was quarantined');

    await wipeState();
    assert.equal(store.get(STORAGE_KEY), undefined);
    assert.equal(quarantineKeys().length, 0,
      'quarantined payloads are full plaintext copies of the journal and must not survive a wipe');
  });
});
