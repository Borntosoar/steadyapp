import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* The App Store listing, as a test.
 *
 * docs/GROWTH.md §7 closed with: "copy.test.mjs does not cover store metadata, so this is a
 * discipline problem, not a test problem." It was right, and the fix is to move the listing
 * out of a web dashboard nobody can diff and into files that a build can read.
 *
 * The listing is the first thing an App Review reader sees and the only Steady copy most
 * people will ever read. Every rule the app's own copy is held to should apply to it, and
 * until now none did. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'fastlane', 'metadata', 'en-US');

const read = (f) => (existsSync(join(DIR, f)) ? readFileSync(join(DIR, f), 'utf8') : null);

const name = read('name.txt');
const subtitle = read('subtitle.txt');
const keywords = read('keywords.txt');
/* Not written yet — drafts live in docs/APP-STORE.md §3. The vocabulary tests below pick
   these up automatically the moment they exist, which is the whole reason they are read
   optionally rather than skipped by name. */
const optional = ['description.txt', 'promotional_text.txt', 'release_notes.txt'];

const ALL = [
  ['name.txt', name],
  ['subtitle.txt', subtitle],
  ['keywords.txt', keywords],
  ...optional.map((f) => [f, read(f)]),
].filter(([, v]) => v !== null);

describe('the listing exists in the repository, not only in a dashboard', () => {
  test('the three indexed fields are present', () => {
    assert.ok(name, 'fastlane/metadata/en-US/name.txt is missing');
    assert.ok(subtitle, 'subtitle.txt is missing');
    assert.ok(keywords, 'keywords.txt is missing');
  });

  test('no field has a trailing newline that Apple would count as a character', () => {
    for (const [f, v] of ALL) {
      assert.equal(v, v.trimEnd(), `${f} has trailing whitespace, which costs a character`);
    }
  });
});

describe('Apple field limits', () => {
  test('name and subtitle are within 30 characters', () => {
    assert.ok(name.length <= 30, `name is ${name.length} chars`);
    assert.ok(subtitle.length <= 30, `subtitle is ${subtitle.length} chars`);
  });

  test('the keyword field is within 100 characters', () => {
    assert.ok(keywords.length <= 100, `keywords is ${keywords.length} chars`);
  });

  test('the keyword field wastes no characters on spaces after commas', () => {
    assert.doesNotMatch(keywords, /,\s/, 'a space after a comma is a character Apple charges for');
  });
});

describe('no treatment or efficacy claim anywhere in the listing', () => {
  /* Guideline 1.4.1, and — separately and more importantly — these words would be false.
     Steady is self-help built on methods that have been trialled; it has not itself been
     trialled. docs/APP-STORE.md §5.5. */
  const CLAIMS =
    /\b(treat|treats|treatment|therapy|therapeutic|cure|cures|heal|heals|clinically|clinical|diagnos\w*|medical|prescri\w*|proven|guarantee\w*|evidence-based)\b/i;

  test('every metadata field is free of treatment vocabulary', () => {
    for (const [f, v] of ALL) {
      assert.doesNotMatch(v, CLAIMS, `${f} contains a treatment or efficacy claim`);
    }
  });

  test('and free of the unverifiable superlatives Guideline 2.3.7 rejects', () => {
    for (const [f, v] of ALL) {
      assert.doesNotMatch(v, /\b(#1|number one|best|world'?s|leading|most effective)\b/i,
        `${f} makes an unverifiable claim`);
    }
  });
});

describe('SAFETY.md applies to the listing as much as to the app', () => {
  test('no eating-disorder or weight vocabulary', () => {
    /* The app has no eating-disorder content and bans weight and calorie data outright.
       This traffic converts once, badly, and irrelevant traffic that does not convert
       damages rankings — quite apart from being the wrong people to bring here. */
    for (const [f, v] of ALL) {
      assert.doesNotMatch(v, /\b(eating|anorexi\w*|bulimi\w*|calorie\w*|weight|diet|slim|thin)\b/i,
        `${f} targets an audience this app has no content for`);
    }
  });

  test('no appearance-improvement or beauty vocabulary', () => {
    /* The opposite intent to this app's. A listing that reaches somebody looking for a
       filter has reached the wrong person in the most costly possible way. */
    for (const [f, v] of ALL) {
      assert.doesNotMatch(v, /\b(selfie|glowup|glow up|beauty|makeover|filter|retouch|flawless)\b/i,
        `${f} collides with the beauty category`);
    }
  });

  test('nothing promises a photo feature the app refuses to have', () => {
    for (const [f, v] of ALL) {
      assert.doesNotMatch(v, /\b(photo|picture|before and after|progress pic\w*)\b/i,
        `${f} implies a photo feature that does not and must not exist`);
    }
  });
});

describe('the keyword field earns its characters', () => {
  const terms = keywords.split(',').filter(Boolean);

  test('nothing is repeated from the name or subtitle', () => {
    /* Apple already indexes those fields. A repeat is a wasted character, and characters are
       the entire currency of this field. */
    const used = new Set(
      `${name} ${subtitle}`.toLowerCase().match(/[a-z]+/g) ?? []
    );
    for (const term of terms) {
      assert.ok(!used.has(term.toLowerCase()),
        `"${term}" is already indexed via the name or subtitle`);
    }
  });

  test('no duplicates within the field', () => {
    assert.equal(new Set(terms.map((t) => t.toLowerCase())).size, terms.length);
  });

  test('no category words, which the category already provides', () => {
    for (const dead of ['health', 'fitness', 'app', 'ios', 'iphone', 'free']) {
      assert.ok(!terms.map((t) => t.toLowerCase()).includes(dead),
        `"${dead}" is indexed by the category or is a dead term`);
    }
  });
});

describe('the category choice', () => {
  test('Health & Fitness, never Medical', () => {
    /* The Medical category invites Guideline 1.4.1 scrutiny by default and buys nothing in
       return. docs/APP-STORE.md §5.5. */
    const cat = read('primary_category.txt');
    assert.ok(cat, 'primary_category.txt is missing');
    assert.doesNotMatch(cat, /medical/i, 'the Medical category invites 1.4.1 review for no gain');
    assert.match(cat, /health/i);
  });
});
