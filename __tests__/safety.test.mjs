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

/* ---------- monetisation ----------
 *
 * The commercial rules from .claude/skills/value-first-growth, made executable. Growth
 * pressure is real and it arrives later, quietly, in a pull request that looks reasonable.
 * These are the lines that should cost somebody a failing build to cross. */

describe('the money never touches the safety surfaces', () => {
  /* Screens somebody reaches while distressed. No upsell, no upgrade link, no Steady+
     mention, in any state, including after a completed exercise. */
  const SACRED = ['app/grounding.tsx', 'app/support.tsx', 'app/urges.tsx'];

  for (const path of SACRED) {
    test(`${path} contains no upgrade surface`, () => {
      const f = FILES.find((x) => x.path === path);
      assert.ok(f, `${path} is missing`);
      assert.doesNotMatch(f.src, /\/paywall|Steady\+|useEntitlement|PRICING/,
        `${path} is a screen people reach at their worst — it must never sell anything`);
    });
  }

  test('the always-free routes are still free in code, not only in prose', () => {
    const ent = FILES.find((f) => f.path === 'lib/entitlement.ts');
    for (const route of ['/grounding', '/support', '/checkin']) {
      assert.ok(ent.src.includes(`'${route}'`), `${route} dropped out of ALWAYS_FREE_ROUTES`);
    }
  });

  /* Behavioural rather than a grep. The scheduler is the only thing in the app allowed to
     start a conversation the user did not, so it is worth testing what it actually does
     with a person who is having a bad week rather than what its source looks like. */
  test('a hard day silences every commercial and advocacy moment', async () => {
    const { nextMoment } = await import('../lib/moments.ts');
    const { baseAppState, qualifiedForAsk } = await import('./helpers/state.mjs');

    const ok = nextMoment(qualifiedForAsk(baseAppState()));
    assert.equal(ok?.id, 'week-one-ask', 'the ask should be eligible in the control case');

    // Same state, plus a hard-day tap today.
    const hard = baseAppState();
    hard.practice.push({ id: 'hd', date: new Date().toISOString().slice(0, 10), kind: 'hard-day' });
    assert.equal(nextMoment(qualifiedForAsk(hard)), null,
      'an upgrade prompt fired on the day somebody tapped "today is a hard day"');

    // Same state, plus a high distress rating today.
    const distressed = baseAppState();
    distressed.checkIns[0].suds = 9;
    assert.equal(nextMoment(qualifiedForAsk(distressed)), null,
      'an upgrade prompt fired on a day rated 9 out of 10 for distress');

    // Same state, plus a significant-avoidance day.
    const avoiding = baseAppState();
    avoiding.checkIns[0].avoidance = 'significant';
    assert.equal(nextMoment(qualifiedForAsk(avoiding)), null,
      'an upgrade prompt fired on a day appearance worry cancelled something');
  });

  test('a trial-ending notice still fires on a hard day', async () => {
    const { nextMoment } = await import('../lib/moments.ts');
    const { baseAppState, qualifiedForAsk } = await import('./helpers/state.mjs');

    const s = baseAppState();
    s.entitled = true;
    s.practice.push({ id: 'hd', date: new Date().toISOString().slice(0, 10), kind: 'hard-day' });
    const started = new Date();
    started.setDate(started.getDate() - 13);
    s.trialStartedAt = started.toISOString();

    const m = nextMoment({ ...qualifiedForAsk(s), trialStartedAt: s.trialStartedAt, trialDays: 14 });
    assert.equal(m?.id, 'trial-ending',
      'money is about to leave this person\'s account and the app promised to warn them');
  });

  test('the scheduler is the only thing that starts an unprompted conversation', () => {
    // If a screen grew its own prompt, it would bypass the daily budget and the distress
    // suppression without anybody noticing. MomentCard is the only renderer.
    for (const f of FILES) {
      if (f.path === 'components/MomentCard.tsx') continue; // the one renderer
      if (f.path.startsWith('content/')) continue; // where the words are defined
      assert.doesNotMatch(f.src, /MOMENT_COPY/,
        `${f.path} renders moment copy directly instead of going through the scheduler`);
    }
  });

  test('no countdown, expiry or scarcity language anywhere', () => {
    for (const f of FILES) {
      assert.doesNotMatch(
        f.src,
        /(offer|deal|discount)\s+(ends|expires)|limited time|spots? left|act now|last chance/i,
        `${f.path} contains manufactured urgency`
      );
    }
  });

  test('no fabricated social proof', () => {
    for (const f of FILES) {
      // Ratings, review counts, and "join N people" claims about users Steady lacks.
      assert.doesNotMatch(f.src, /rated \d|\d[\d,.]*\+? (users|reviews|ratings|members)|join \d/i,
        `${f.path} claims social proof this app cannot substantiate`);
    }
  });

  test('the evidence qualifier travels with every screen that renders proof points', () => {
    for (const f of FILES) {
      if (f.path.startsWith('content/')) continue;
      if (!/PROOF_POINTS/.test(f.src)) continue;
      assert.match(f.src, /PROOF_QUALIFIER/,
        `${f.path} renders evidence without the "not therapy, not trialled" qualifier`);
    }
  });

  test('the trial states a date and promises a reminder', () => {
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /trialEndDate\(/, 'the paywall shows no trial end date');
    assert.match(pay.src, /remind you/i, 'the paywall does not promise a trial reminder');
  });

  test('the paywall dismiss says what it does, and does not shame', () => {
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /accessibilityLabel="Close"/, 'no plainly labelled dismiss');
    assert.doesNotMatch(pay.src, /no thanks,? i|i don'?t want|stay stuck/i, 'the paywall confirmshames');
  });

  /* Run the real function over every bucket rather than regexing the file: what matters is
     what a customer can actually be shown, and a source grep also trips over the apostrophes
     in the comments explaining why these rules exist. */
  test('the cost mirror promises nothing and compares nobody, at every input', async () => {
    const { costMirror, COST_MIRROR_FOOTER } = await import('../lib/cost.ts');
    const { PREOCCUPATION_MINUTES, PREOCCUPATION_BUCKETS } = await import('../types/index.ts');

    const shown = [COST_MIRROR_FOOTER];
    for (const bucket of PREOCCUPATION_BUCKETS) {
      const m = costMirror({
        capturedAt: new Date().toISOString(),
        preoccupationMinutes: PREOCCUPATION_MINUTES[bucket],
        urge: 5,
        avoidance: 'small',
        suds: 5,
      });
      shown.push(m.headline, m.sub);
    }
    const empty = costMirror(null);
    shown.push(empty.headline, empty.sub);

    for (const s of shown) {
      assert.doesNotMatch(s, /you (will|could|can|might) (get|win|save|reclaim|feel|be)|guarantee|proven to/i,
        `cost mirror makes a promise: "${s}"`);
      assert.doesNotMatch(s, /percentile|than (most|other|average)|better than|compared to (other|most)|average person/i,
        `cost mirror compares the user to other people: "${s}"`);
      assert.doesNotMatch(s, /!/, `cost mirror editorialises: "${s}"`);
      assert.doesNotMatch(s, /shocking|huge|terrible|awful|wasted|waste/i,
        `cost mirror editorialises: "${s}"`);
    }
  });

  test('the cost mirror stays quiet when there is nothing worth stating', async () => {
    const { costMirror } = await import('../lib/cost.ts');
    const low = costMirror({
      capturedAt: new Date().toISOString(),
      preoccupationMinutes: 8,
      urge: 2,
      avoidance: 'none',
      suds: 2,
    });
    assert.equal(low.worthShowing, false,
      'below ~15 min/day, presenting a cost figure would be manufacturing a problem to sell against');
  });
});

describe('SAFETY.md itself stays in place', () => {
  const safety = readFileSync(join(ROOT, 'SAFETY.md'), 'utf8');

  test('documents every numbered constraint', () => {
    for (let i = 1; i <= 13; i++) {
      assert.match(safety, new RegExp(`^## ${i}\\.`, 'm'), `missing constraint ${i}`);
    }
  });

  test('is substantial rather than a stub', () => {
    assert.ok(safety.split(/\s+/).length > 900, 'SAFETY.md is too thin to be useful');
  });
});
