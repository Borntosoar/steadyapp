import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* The SAFETY.md constraints, as a test.
 *
 * SAFETY.md documents them and explains why; this file makes them fail a build. A rule
 * that lives only in a markdown file is a rule that gets removed by someone who never
 * opened it. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['app', 'components', 'lib', 'store', 'content', 'types', 'constants'];

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(e)) out.push(full);
    }
  };
  for (const d of DIRS) walk(join(ROOT, d));
  return out;
}

const FILES = sourceFiles().map((f) => ({ path: f.replace(ROOT + '/', ''), src: readFileSync(f, 'utf8') }));

describe('the source tree is what SAFETY.md says it is', () => {
  test('there are source files to check', () => {
    assert.ok(FILES.length > 20, `only found ${FILES.length} source files`);
  });

  // SAFETY.md §1
  test('no still-image capture API appears anywhere', () => {
    const forbidden = /takePicture|savePhoto|captureRef|toDataURL|MediaLibrary|getScreenshot|ImagePicker/i;
    for (const f of FILES) {
      assert.doesNotMatch(f.src, forbidden, `capture API referenced in ${f.path}`);
    }
  });

  // SAFETY.md §2
  test('no appearance or body metric fields exist', () => {
    // Matches identifier-ish usage, not prose in a comment explaining the ban.
    const forbidden = /\b(bmi|bodyFat|waistSize|attractivenessScore|hotnessScore|appearanceScore|lookScore|percentileRank)\b/i;
    for (const f of FILES) {
      assert.doesNotMatch(f.src, forbidden, `appearance metric in ${f.path}`);
    }
  });

  test('no weight, calorie or measurement field on any type', () => {
    const types = FILES.find((f) => f.path === 'types/index.ts');
    const declarations = types.src
      .split('\n')
      .filter((l) => /^\s{2}\w+[?]?:/.test(l))
      .join('\n');
    assert.doesNotMatch(declarations, /weight|calorie|bmi|measurement|photo|image|uri/i);
  });

  // SAFETY.md §6
  test('storage makes no network call', () => {
    const storage = FILES.find((f) => f.path === 'lib/storage.ts');
    assert.doesNotMatch(storage.src, /\bfetch\(|XMLHttpRequest|axios|WebSocket|https?:\/\//);
  });

  test('no analytics or tracking SDK is imported anywhere', () => {
    const trackers = /from ['"](@?)(segment|amplitude|mixpanel|firebase|@sentry|posthog|@amplitude)/i;
    for (const f of FILES) {
      assert.doesNotMatch(f.src, trackers, `tracker imported in ${f.path}`);
    }
  });

  // SAFETY.md §4
  test('the always-free route list still contains every safety surface', () => {
    const ent = FILES.find((f) => f.path === 'lib/entitlement.ts');
    for (const route of ['/grounding', '/support', '/checkin', '/']) {
      assert.match(ent.src, new RegExp(`'${route}'`), `${route} missing from ALWAYS_FREE_ROUTES`);
    }
  });

  test('the persistent Support button is still mounted in the root layout', () => {
    const layout = FILES.find((f) => f.path === 'app/_layout.tsx');
    assert.match(layout.src, /SupportBar/);
    assert.match(layout.src, /router\.push\('\/support'\)/);
  });

  // SAFETY.md §9 and §10
  test('mirror practice is still locked before the unlock week', () => {
    const protocol = FILES.find((f) => f.path === 'lib/protocol.ts');
    assert.match(protocol.src, /if \(week < MIRROR_UNLOCK_WEEK\) return null/);
  });

  test('week unlocking still takes no date parameter', () => {
    const protocol = FILES.find((f) => f.path === 'lib/protocol.ts');
    const sig = protocol.src.match(/export function isWeekUnlocked\(([^)]*)\)/)[1];
    assert.doesNotMatch(sig, /date|now|Date/i, `isWeekUnlocked gained a time input: ${sig}`);
  });

  // SAFETY.md §11
  test('completing an experiment cannot rewrite the prediction', () => {
    const store = FILES.find((f) => f.path === 'store/useStore.ts');
    const fn = store.src.slice(store.src.indexOf('completeExperiment:'));
    const body = fn.slice(0, fn.indexOf('markModuleRead'));
    assert.doesNotMatch(body, /prediction|likelihoodBefore|avoiding/,
      'completeExperiment touches a pre-event field');
  });
});

describe('SAFETY.md itself stays in place', () => {
  const safety = readFileSync(join(ROOT, 'SAFETY.md'), 'utf8');

  test('documents every numbered constraint', () => {
    for (let i = 1; i <= 11; i++) {
      assert.match(safety, new RegExp(`^## ${i}\\.`, 'm'), `missing constraint ${i}`);
    }
  });

  test('is substantial rather than a stub', () => {
    assert.ok(safety.split(/\s+/).length > 900, 'SAFETY.md is too thin to be useful');
  });
});
