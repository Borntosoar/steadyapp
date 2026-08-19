import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRICING } from '../lib/entitlement.ts';
import { SUPPORT_REGIONS } from '../constants/support.ts';

/* The App Store listing, as a test.
 *
 * docs/GROWTH.md §7 closed with: "copy.test.mjs does not cover store metadata, so this is a
 * discipline problem, not a test problem." It was right, and the fix is to move the listing
 * out of a web dashboard nobody can diff and into files that a build can read.
 *
 * The listing is the first thing an App Review reader sees and the only Anneal copy most
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

  test('no length-capped field has a trailing newline Apple would count', () => {
    /* Only the short indexed fields. In `name`, `subtitle` and `keywords` every character is
       currency and a stray newline spends one for nothing. The description and release notes
       are prose with a hard cap far above their length, and demanding they not end in a
       newline is fighting every text editor for no benefit. */
    for (const f of ['name.txt', 'subtitle.txt', 'keywords.txt', 'primary_category.txt']) {
      const v = read(f);
      if (v === null) continue;
      assert.equal(v, v.trimEnd(), `${f} has trailing whitespace, which costs a character`);
    }
  });

  test('the description fits, and its first 125 characters earn the tap', () => {
    /* Apple's cap is 4000. The number that actually matters is 125: on an iPhone that is
       roughly what shows before "more", and it is the only part most people read. */
    const d = read('description.txt');
    if (!d) return;
    assert.ok(d.length <= 4000, `description is ${d.length} chars, over Apple's 4000 limit`);
    const fold = d.slice(0, 125);
    assert.doesNotMatch(fold, /\bAnneal is an? (app|tool)\b/i,
      'the visible fragment opens by describing the category rather than the problem');
    assert.match(fold, /hours/i, 'the hours idea is the whole pitch and it is not above the fold');
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
     Anneal is self-help built on methods that have been trialled; it has not itself been
     trialled. docs/APP-STORE.md §5.5.
   *
   * A CLAIM AND ITS DENIAL USE THE SAME WORDS, which the first version of this test did not
   * account for. It failed on the description's own disclaimer — "not therapy, not a
   * diagnosis, not medical advice … does not treat or cure anything" — which is the single
   * most important paragraph on the listing and the one App Review most wants to see. A test
   * that forbids the disclaimer is a test that makes the listing worse.
   *
   * So the unit is the sentence, and a sentence carrying a negation is read as a disclaimer.
   * The hole this leaves is a sentence that both claims and negates ("Anneal treats body
   * dysmorphia and does not cost much") — narrow, contrived, and vastly preferable to either
   * blanket-allowing the vocabulary or blanket-banning the disclaimer. */
  const CLAIMS =
    /\b(treat|treats|treatment|therapy|therapeutic|cure|cures|heal|heals|clinically|clinical|diagnos\w*|medical|prescri\w*|proven|guarantee\w*|evidence-based)\b/i;
  const NEGATED = /\b(not|no|never|without|nothing|neither|nor|cannot|does ?n[o']t|is ?n[o']t)\b/i;

  /** Sentences that ASSERT one of the claim words, ignoring those that deny it. */
  const claimingSentences = (text) =>
    text
      .split(/(?<=[.!?])\s+|\n+/)
      .filter((s) => CLAIMS.test(s) && !NEGATED.test(s));

  test('every metadata field is free of asserted treatment vocabulary', () => {
    for (const [f, v] of ALL) {
      const bad = claimingSentences(v);
      assert.deepEqual(bad, [], `${f} asserts a treatment or efficacy claim: ${bad.join(' / ')}`);
    }
  });

  test('the description carries the disclaimer rather than merely avoiding the words', () => {
    /* The inverse, and the one that protects the user rather than the developer. Guideline
       1.4.1 wants the limits stated, not just unclaimed. */
    const d = read('description.txt');
    if (!d) return;
    assert.match(d, /not therapy/i, 'the description does not say it is not therapy');
    assert.match(d, /not a diagnosis/i, 'the description does not disclaim diagnosis');
    assert.match(d, /self-help/i, 'the description does not say what it actually is');
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
    /* Same negation rule as the treatment claims above, and for the same reason: "there is
       no photo capture" is the sentence this app most wants on its listing, and the first
       version of this test banned it. */
    const PHOTO = /\b(photo|picture|before[- ]and[- ]after|progress pic\w*|selfie)\b/i;
    const NEG = /\b(not|no|never|without|nothing|neither|nor)\b/i;
    for (const [f, v] of ALL) {
      const asserting = v
        .split(/(?<=[.!?])\s+|\n+/)
        .filter((s) => PHOTO.test(s) && !NEG.test(s));
      assert.deepEqual(asserting, [],
        `${f} implies a photo feature that does not and must not exist: ${asserting.join(' / ')}`);
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

describe('the listing describes the app that actually exists', () => {
  /* The listing is the one piece of copy in this repo that lives outside the app and can
     therefore drift from it without anything breaking. It already had: it advertised a
     14-day trial after the trial became 30 days, and "crisis lines for Canada, the US, the
     UK and Australia" after that became 31 regions. Nobody would have noticed until a
     customer was charged two weeks earlier than the store told them — which is a refund, a
     one-star review and a 2.3 metadata-accuracy problem in one. */
  test('the advertised trial length is the one the app grants', () => {
    const d = read('description.txt');
    if (!d) return;
    const advertised = [...d.matchAll(/(\d+)[- ]day free trial/gi)].map((m) => Number(m[1]));
    assert.ok(advertised.length > 0, 'the description never states the trial length');
    for (const n of advertised) {
      assert.equal(n, PRICING.trialDays,
        `the listing advertises a ${n}-day trial; PRICING.trialDays is ${PRICING.trialDays}`);
    }
  });

  test('the advertised prices are the ones on the paywall', () => {
    const d = read('description.txt');
    if (!d) return;
    for (const price of [PRICING.yearly, PRICING.monthly, PRICING.lifetime]) {
      const amount = price.match(/\$[\d.]+/)?.[0];
      assert.ok(amount && d.includes(amount),
        `the listing does not mention ${amount}, which the paywall charges`);
    }
  });

  test('the advertised crisis coverage is not smaller than what ships', () => {
    const d = read('description.txt');
    if (!d) return;
    const claimed = Number(d.match(/Crisis lines for (\d+) countries/i)?.[1] ?? 0);
    assert.ok(claimed > 0, 'the description does not state the crisis coverage');
    assert.ok(
      claimed <= SUPPORT_REGIONS.length,
      `the listing claims ${claimed} countries; constants/support.ts has ${SUPPORT_REGIONS.length}`
    );
  });

  test('nothing on the listing calls the one-off plan a lifetime', () => {
    /* Same rule as the app's own strings. App Review rejects the word. */
    for (const [f, v] of ALL) {
      assert.doesNotMatch(v, /\blifetime\b/i, `${f} says "lifetime"`);
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

describe('the bundle identifier', () => {
  /* A bundle ID is the one string in this repository that genuinely cannot be changed after
     the first submission. It cannot be renamed, it binds the app to whichever Apple account
     registers it first, and changing it later means a new App Store listing that starts at
     zero reviews and zero downloads. It was `com.borntosoar.steady` — another company's
     reverse-DNS namespace, carrying a name the app has since been renamed away from twice —
     and it was fixed in the only window that existed for fixing it. */
  const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;

  test('iOS and Android agree', () => {
    assert.equal(app.ios.bundleIdentifier, app.android.package);
  });

  test('it does not reference another company or a former name', () => {
    for (const stale of ['borntosoar', 'steady', 'cairn']) {
      assert.doesNotMatch(app.ios.bundleIdentifier, new RegExp(stale, 'i'),
        `the bundle ID still contains "${stale}"`);
    }
  });
});
