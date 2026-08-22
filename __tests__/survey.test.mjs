import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { QUESTIONS, MAX_QUESTIONS, CRISIS_TILE, REFLECTION, FEATURED_CALM } from '../content/survey.ts';
import {
  planFor, isCrisis, carryingOf, toneOf, orderOf, stageOf, progress, STONES, STAGES, STAGE_AT,
} from '../lib/plan.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

/* The opening survey.
 *
 * Most of what is checked here is a promise rather than a behaviour, which is why it is
 * checked at all: a survey that quietly starts diagnosing, or that dresses a crisis answer
 * as a mood tile, would still run perfectly. */

describe('the shape of the survey', () => {
  test('three questions, and never more than five', () => {
    assert.ok(QUESTIONS.length <= MAX_QUESTIONS, 'a survey this long is a form');
    assert.equal(QUESTIONS.length, 3, 'the brief asks for three ideally');
  });

  test('question ids are unique and every question has tiles', () => {
    assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
    for (const q of QUESTIONS) {
      assert.ok(q.tiles.length >= 4, `${q.id} has too few answers to be a real question`);
      assert.equal(new Set(q.tiles.map((t) => t.key)).size, q.tiles.length);
    }
  });

  test('the first question is open and warm rather than a checklist', () => {
    assert.match(QUESTIONS[0].ask, /what brought you here/i);
  });

  test('one question asks what has already been tried', () => {
    /* The brief is right that this is the most useful question in the survey, and the reason
       is tone: somebody who has been through therapy and three apps has heard every gentle
       sentence this app could produce. */
    assert.ok(QUESTIONS.some((q) => /tried/i.test(q.ask)), 'nothing asks about prior attempts');
  });

  test('every answer is an experience, never a condition', () => {
    /* NEVER ASK FOR A DIAGNOSIS. The single most important content rule in this file, and
       the easiest to break by accident the first time somebody adds a tile. */
    const clinical =
      /\b(depress\w*|anxiety|anxious|PTSD|trauma|bipolar|OCD|ADHD|BPD|disorder|diagnos\w*|clinical|symptom)\b/i;
    for (const q of QUESTIONS) {
      for (const tile of q.tiles) {
        assert.doesNotMatch(tile.label, clinical,
          `"${tile.label}" names a condition. Ask about experience instead.`);
      }
      assert.doesNotMatch(q.ask, clinical, `"${q.ask}" names a condition`);
    }
  });

  test('no sliders, no scales, no numbers to pick', () => {
    const scale = /\b(scale|rate|out of ten|1-10|1 to 10|score)\b/i;
    for (const q of QUESTIONS) {
      assert.doesNotMatch(q.ask, scale, `"${q.ask}" asks for a rating`);
      for (const tile of q.tiles) assert.doesNotMatch(tile.label, scale);
    }
  });

  test('nothing shouts', () => {
    for (const q of QUESTIONS) {
      assert.ok(!q.ask.includes('!'));
      for (const tile of q.tiles) assert.ok(!tile.label.includes('!'));
    }
  });

  test('every tile is a landscape — a ground and a mark on it', () => {
    /* The brief asks for texture tiles rather than text buttons or emoji, and the app has
       the machinery already. A tile with no mood is a text button. */
    for (const q of QUESTIONS) {
      for (const tile of q.tiles) {
        assert.ok(tile.mood, `"${tile.label}" has no ground`);
        assert.ok(tile.motif, `"${tile.label}" has no motif`);
      }
    }
  });
});

describe('crisis is an explicit answer and is never inferred', () => {
  test('the option exists, in the first question, in plain words', () => {
    const tile = QUESTIONS[0].tiles.find((t) => t.key === CRISIS_TILE);
    assert.ok(tile, 'there is no way to say this');
    assert.match(tile.label, /hurting myself|harm/i,
      'the wording is too oblique for somebody to recognise as theirs');
  });

  test('it is the last option, so nothing is browsed past to reach the others', () => {
    assert.equal(QUESTIONS[0].tiles[QUESTIONS[0].tiles.length - 1].key, CRISIS_TILE);
  });

  test('choosing it produces no plan, no stone and no reflection', () => {
    assert.equal(isCrisis({ brought: CRISIS_TILE }), true);
    for (const a of [{}, { brought: 'spirals' }, { brought: 'loss', tried: 'lots' }]) {
      assert.equal(isCrisis(a), false);
    }
  });

  test('the screen routes it straight to support and stops', () => {
    const src = read('app/onboarding/survey.tsx');
    const branch = src.slice(src.indexOf('if (tile.key === CRISIS_TILE)'), src.indexOf('if (step + 1'));
    assert.match(branch, /router\.replace\('\/support'\)/, 'it does not open support');
    assert.match(branch, /return;/, 'the survey carries on afterwards');
    assert.doesNotMatch(branch, /saveSurvey/, 'it stores the answer before leaving');
  });

  test('nothing anywhere tries to detect crisis from wording', () => {
    /* Risk classification from free text or play patterns is unvalidated, and a false
       positive throws a crisis screen at somebody who is fine and teaches them the app is
       reading them. The 31 regions in constants/support.ts are one tap from every screen. */
    for (const f of ['content/survey.ts', 'lib/plan.ts', 'app/onboarding/survey.tsx']) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      assert.doesNotMatch(src, /\b(detect|classif|riskScore|sentiment|analyse|analyze)\w*\(/i,
        `${f} appears to be inferring risk rather than reading an explicit answer`);
    }
  });
});

describe('the result reflects rather than labels', () => {
  test('every shape somebody can land on has a reflection', () => {
    for (const q of QUESTIONS[0].tiles) {
      if (q.key === CRISIS_TILE) continue;
      assert.ok(REFLECTION[q.key], `"${q.label}" leads to a blank result screen`);
    }
  });

  test('no reflection names a condition or promises an outcome', () => {
    const bad =
      /\b(depress\w*|anxiety|disorder|diagnos\w*|you have\b|will get better|will improve|cure|treat)\b/i;
    for (const [k, line] of Object.entries(REFLECTION)) {
      assert.doesNotMatch(line, bad, `${k}: "${line}"`);
      assert.ok(!line.includes('!'), `${k} shouts`);
      assert.ok(line.length > 60, `${k} is too thin to land`);
    }
  });

  test('the result screen says plainly what the app is not', () => {
    /* Whitespace collapsed first. JSX wraps prose across lines, so "stays on this phone"
       is "stays on\n            this phone" in the source and an exact match misses it —
       the same trap __tests__/brand.test.mjs was written for, one file over. */
    const src = read('app/onboarding/survey.tsx').replace(/\s+/g, ' ');
    assert.match(src, /not therapy/i);
    assert.match(src, /does not diagnose/i);
    assert.match(src, /stays on this phone|stays on the phone/i);
  });

  test('there is an escape hatch on every question', () => {
    const src = read('app/onboarding/survey.tsx');
    assert.match(src, /Just let me look around/);
    assert.match(src, /const skip = \(\) => \{/);
  });

  test('no progress bar counting down', () => {
    const src = read('app/onboarding/survey.tsx');
    assert.doesNotMatch(src, /\d+ of \{|of \{QUESTIONS\.length\}/, 'a counter is a form');
    assert.match(src, /function Seedling/, 'the growing element is gone');
  });
});

describe('what the answers configure, and what they must not', () => {
  test('an unknown or missing answer never throws', () => {
    for (const a of [{}, { brought: 'nonsense' }, { brought: null }, { worst: 'never' }]) {
      const p = planFor(a);
      assert.ok(p.reflection && p.stone && p.calm && p.order.length === 2);
    }
  });

  test('loss is always the quiet voice, whatever else was said', () => {
    /* There is no version of brisk that is right in the first weeks after somebody dies. */
    for (const tried of ['first', 'some', 'apps', 'therapy', 'lots']) {
      assert.equal(toneOf({ brought: 'loss', tried }), 'quiet');
    }
  });

  test('somebody who has tried everything gets the direct voice', () => {
    assert.equal(toneOf({ brought: 'spirals', tried: 'lots' }), 'direct');
    assert.equal(toneOf({ brought: 'spirals', tried: 'apps' }), 'direct');
    assert.equal(toneOf({ brought: 'spirals', tried: 'first' }), 'plain');
  });

  test('no answer ever hides a game', () => {
    /* Order only, per the founder's choice. Hiding a game behind a survey answer means
       somebody who tapped quickly at 2am has a smaller app forever. */
    const routes = new Set();
    for (const brought of Object.keys(REFLECTION)) {
      const o = orderOf({ brought });
      assert.equal(o.length, 2, `${brought} sees fewer games than somebody else`);
      o.forEach((r) => routes.add(r));
    }
    assert.deepEqual([...routes].sort(), ['/game/curveball', '/game/toward']);
  });

  test('every "when is it worst" answer picks a real calm-down mode', () => {
    const modes = new Set(['Breathe', 'Reset', 'Float']);
    const worstQ = QUESTIONS.find((q) => /worst/i.test(q.ask));
    for (const tile of worstQ.tiles) {
      assert.ok(modes.has(FEATURED_CALM[tile.key]), `"${tile.label}" features nothing`);
    }
  });

  test('carrying is a shape of experience and is never shown as a word', () => {
    /* It picks a tone and an order. If it ever reaches a screen as text it has become a
       label, which is the one thing the brief forbids outright. */
    const src = read('app/onboarding/survey.tsx');
    assert.doesNotMatch(src, /\{plan\.carrying\}/, 'the shape is being rendered at somebody');
    assert.equal(carryingOf({ brought: 'spirals' }), 'spirals');
    assert.equal(carryingOf({ brought: 'not-a-key' }), 'looking');
  });
});

describe('the stone is a memento, not a currency', () => {
  test('every shape has a stone, and none of them is a level name', () => {
    for (const key of Object.keys(REFLECTION)) {
      const s = STONES[key];
      assert.ok(s, `${key} has no stone`);
      assert.doesNotMatch(s.name, /\b(tier|level|rank|grade)\b|\d/i,
        `"${s.name}" is a level with a mineral costume on`);
      assert.ok(s.line.length > 40);
    }
  });

  test('rarity comes from where somebody started, never from how they are doing', () => {
    /* A stone awarded for being less unwell is a scoreboard with better manners. Rarity is
       therefore a property of the answer, and `progress` cannot reach it. */
    const src = read('lib/plan.ts').replace(/\/\*[\s\S]*?\*\//g, '');
    const fn = src.slice(src.indexOf('export function progress'));
    assert.doesNotMatch(fn, /rarity/, 'progression is changing how rare somebody is');
  });

  test('the stone is given for arriving, not for completing anything', () => {
    /* planFor takes three answers and no history. If it ever needed a count of days or
       sessions, the memento would have become a contingent reward — which is the mechanic
       Deci 1999 and Six et al. 2021 are both against, and the reason Curveball's score was
       deleted. */
    const p = planFor({ brought: 'loss' });
    assert.equal(p.stone.name, 'Obsidian');
    assert.equal(planFor.length, 1, 'planFor now needs more than the answers');
  });

  test('progression is a record of days and nothing is ever spent or lost', () => {
    assert.equal(stageOf(0), STAGES[0]);
    assert.equal(stageOf(STAGE_AT[1]), STAGES[1]);
    assert.equal(stageOf(STAGE_AT[2]), STAGES[2]);
    assert.equal(stageOf(STAGE_AT[3]), STAGES[3]);
    /* Never completes and never goes backwards. A progression that finishes tells somebody
       there is a point at which they are done. */
    assert.equal(stageOf(100000), STAGES[STAGES.length - 1]);
    let prev = -1;
    for (let d = 0; d < 400; d++) {
      const i = STAGES.indexOf(stageOf(d));
      assert.ok(i >= prev, `stage went backwards at ${d} days`);
      prev = i;
    }
  });

  test('two things in one day is worth what one thing is', () => {
    /* `progress` takes days, not actions. An app that pays per action rewards staying in it
       longer, which is the opposite of the point. */
    assert.deepEqual(progress(STONES.flat, 7).stage, progress(STONES.flat, 7).stage);
    assert.equal(progress.length, 2);
  });
});

describe('the survey is stored on the device and nowhere else', () => {
  test('the answers survive a round trip through normalise', () => {
    const src = read('lib/storage.ts');
    assert.match(src, /survey: \{/, 'the survey is dropped on the next read');
    assert.match(src, /carrying/, 'the resolved shape is dropped on the next read');
  });

  test('nothing in the survey path reaches the network', () => {
    for (const f of ['content/survey.ts', 'lib/plan.ts', 'app/onboarding/survey.tsx']) {
      assert.doesNotMatch(read(f), /\bfetch\(|XMLHttpRequest|axios|https?:\/\/(?!\s)/,
        `${f} makes a network call with the most sensitive data in the app`);
    }
  });
});
