import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Former names must not survive in anything a user or a reviewer reads.
 *
 * WHY THIS EXISTS, AND WHAT IT COST TO LEARN. The app was renamed twice — Steady → Cairn →
 * Anneal — with roughly 300 occurrences across 40 files each time. Both sweeps used a
 * case-SENSITIVE pattern, and the verification afterwards used the same pattern, so it
 * confirmed its own blind spot and reported clean twice. What actually survived:
 *
 *   · `STEADY+` in the App Store description — the paid tier, in the listing, named after
 *     an app that no longer exists. Reviewer-facing.
 *   · The medical-claim guards in __tests__/copy.test.mjs, __tests__/modules.test.mjs and
 *     legal/medical-disclaimer.md. Each matches `/\b(steady|this app) (treats|cures…)/i`,
 *     so renaming the product silently disarmed them: they went on searching for a product
 *     name that appears in none of the strings they check. Those are the guards against
 *     the medical claims that get an app rejected under Guideline 5.1 and raise a
 *     regulatory question beyond it. They passed for two renames because a test that
 *     matches nothing always passes.
 *
 * That second failure is the point. A stale brand string in prose is embarrassing; a stale
 * brand string inside a safety regex is a disarmed safety check that still reports green.
 *
 * SCOPE. Only files a user, a reviewer, or a court reads. Docs, tests and commit history
 * discuss the renames as history and must stay free to name the old names. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Surfaces where a former name is a defect rather than a historical note. */
const WATCHED = /^(app|components|content|constants|lib|hooks|fastlane\/metadata)\//;
const WATCHED_LEGAL = /^legal\/.*\.md$/;

/** Former names, matched case-insensitively — the whole lesson of this file. `cairn` is
 *  matched as a bare word; `steady` only in shapes a brand takes, since "steady" is also an
 *  ordinary English adjective this app has every right to use about breathing. */
const STALE = [
  /\bcairn\b/i,
  /\bsteady\s*\+/i,
  /\bsteady[_-]/i,
  /STEADY/,
  /\bSteady\b/,
];

/** Deliberate survivors, each with the reason it is not a defect. Kept as exact substrings
 *  so adding one is a visible decision rather than a loosened pattern. */
const ALLOWED = [
  // Addresses real data lives at. Renaming these orphans every existing user's record —
  // see the note in lib/storage.ts and the guards in __tests__/storage.test.mjs.
  'steady.state.v2',
  'steady.unreadable.',
  'steady.device.key.v1',
  // A real mailbox that receives real mail. Changing it loses support email.
  'steadyrecovery3@gmail.com',
  // A real URL under an account that still hosts the site. Still an open decision —
  // legal/entity.json → siteOrigin.
  'borntosoar.github.io/steadyapp',
  // In-app purchase identifiers, created in App Store Connect before the rename. Exactly the
  // same case as the storage keys above: they are addresses that already exist, and a product
  // id cannot be renamed without orphaning every purchase made against it. Listed one by one
  // rather than as a `steady_plus_` prefix, so a NEW product cannot inherit the exemption by
  // being named to match. See docs/SUBMISSION-ANSWERS.md §5.
  'steady_plus_yearly',
  'steady_plus_monthly',
  'steady_plus_onetime',
  // The rename history, recorded on purpose at the definitions it explains.
  'Steady → Cairn → Anneal',
  'The app was called Steady, then briefly Cairn, before it was called Anneal',
  'neither SOAR\'s nor called Steady',
];

const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && (WATCHED.test(f) || WATCHED_LEGAL.test(f)));

describe('no former name survives on a surface anyone reads', () => {
  test('git ls-files actually matched the surfaces this is meant to watch', () => {
    /* A scan that silently matches nothing is the exact failure this file exists to catch,
       so it is not allowed to happen to the scan itself. */
    assert.ok(files.length > 20, `only ${files.length} files scanned — the globs are wrong`);
    assert.ok(files.some((f) => f.startsWith('fastlane/metadata/')),
      'the App Store metadata is not being scanned, and it is where the last one hid');
  });

  for (const file of files) {
    test(file, () => {
      /* Whitespace-collapsed before the allowlist is applied. A comment explaining the
         rename wraps across lines, so an exact substring would miss it and the entry would
         look wrong rather than the matching being wrong — which is how allowlists rot into
         widened patterns. */
      let text = readFileSync(join(ROOT, file), 'utf8').replace(/\s+/g, ' ');
      for (const ok of ALLOWED) text = text.split(ok.replace(/\s+/g, ' ')).join('');
      for (const pattern of STALE) {
        const hit = text.match(pattern);
        assert.equal(hit, null,
          `${file} still contains "${hit?.[0]}". If it is deliberate, add the exact string ` +
          `to ALLOWED in this file with the reason — do not widen the pattern.`);
      }
    });
  }
});

describe('the medical-claim guards name the current product', () => {
  /* The specific regression above: these three guards match on the brand word, so a rename
     disarms them while they keep passing. Asserting the current name appears inside each
     pattern is the only thing that would have noticed. */
  const brand = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo.name.toLowerCase();

  for (const file of [
    '__tests__/copy.test.mjs',
    '__tests__/modules.test.mjs',
    'legal/medical-disclaimer.md',
  ]) {
    test(`${file} guards against claims about "${brand}"`, () => {
      const text = readFileSync(join(ROOT, file), 'utf8');
      const claimGuard = text.match(/\/\\b\(([^)]*)\)\s\(treats/);
      assert.ok(claimGuard, `${file} no longer has a recognisable treatment-claim guard`);
      assert.ok(claimGuard[1].toLowerCase().includes(brand),
        `${file} guards against claims about "${claimGuard[1]}" but the app is called ` +
        `"${brand}". The guard matches nothing and passes for that reason.`);
    });
  }
});
