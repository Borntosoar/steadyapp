import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { gradeLevel, longestSentence, countWords } from '../lib/readability.ts';

const copy = await import('../content/copy.ts');
const ex = await import('../content/exercises.ts');
const modules = await import('../content/modules.ts');

/* Reading level, enforced.
 *
 * The brief was "fix writing so an 8th grader would understand". That is a real
 * requirement rather than a style note: the median adult reads at roughly this level, and
 * a person reading this app is usually anxious, which narrows working memory further. Copy
 * that has to be re-read is copy that gets closed.
 *
 * This test exists because the reading level will drift. It always does — somebody adds a
 * careful qualifier, then another, and eighteen months later the app is a pamphlet again.
 * The grep-style copy tests in copy.test.mjs stop the tone regressing; this one stops the
 * register regressing. */

const TARGET_GRADE = 8;

/* Sentence length is capped everywhere, including the teaching modules. It is the one
   measure that is always within a writer's control and it is what actually breaks
   comprehension: a forty-word sentence has to be held in working memory whole.
   A colon or a semicolon ends a clause as surely as a full stop does, so a genuine list
   is not counted as one enormous sentence. */
const SENTENCE_MAX_WORDS = 30;

/* The per-sentence GRADE ceiling applies to interface microcopy only.
 *
 * Flesch-Kincaid punishes any short sentence containing a long word, so "Reassurance is a
 * checking behaviour that uses another person as the mirror" scores at grade 13 despite
 * being twelve plain words. Microcopy can always be rewritten around that. Teaching
 * material cannot: naming a mechanism is the entire job of a module, and "negative
 * reinforcement" has no shorter true synonym. Modules are held to the passage-level target
 * above and to the sentence-length cap, which is the honest line to draw. */
const SENTENCE_MIN_WORDS = 10;
const SENTENCE_MAX_GRADE = 10;

function harvest(v, out = [], seen = new Set()) {
  if (v == null) return out;
  if (typeof v === 'string') {
    out.push(v);
    return out;
  }
  if (typeof v === 'function') {
    for (const args of [[1], [3], [{ minutesPerDay: 40, urgesLogged: 12, urgesResisted: 9, mirrorBefore: 7, mirrorAfter: 4 }]]) {
      try {
        harvest(v(...args), out, seen);
      } catch {
        /* wrong arg shape — another will match */
      }
    }
    return out;
  }
  if (typeof v !== 'object' || seen.has(v)) return out;
  seen.add(v);
  for (const k of Object.keys(v)) harvest(v[k], out, seen);
  return out;
}

describe('the formula behaves', () => {
  test('scores plain writing low and dense writing high', () => {
    assert.ok(gradeLevel('The cat sat on the mat. It was a warm day.') < 4);
    assert.ok(
      gradeLevel(
        'Notwithstanding the aforementioned considerations, the implementation of comprehensive methodological frameworks necessitates substantial organisational recalibration.'
      ) > 12
    );
  });
});

/* Each exported group is scored as a passage. Scoring the whole file at once would let one
   very plain group hide a dense one. */
const GROUPS = [
  ['STREAK_COPY', copy.STREAK_COPY],
  ['RECLAIMED_COPY', copy.RECLAIMED_COPY],
  ['insightsSummary', copy.insightsSummary],
  ['PAYWALL_COPY', copy.PAYWALL_COPY],
  ['MOMENT_COPY', copy.MOMENT_COPY],
  ['STORAGE_COPY', copy.STORAGE_COPY],
  ['DISCLAIMER', copy.DISCLAIMER],
  ['CONTENT_FOOTER', copy.CONTENT_FOOTER],
  ['SENSES_STEPS', ex.SENSES_STEPS],
  ['BREATH', ex.BREATH],
  ['WIDENING', ex.WIDENING],
  ['VALUES_ANCHOR', ex.VALUES_ANCHOR],
  ['URGE_SURF', ex.URGE_SURF],
  ['HARD_DAY', ex.HARD_DAY],
  ['THOUGHT_RECORD_STEPS', ex.THOUGHT_RECORD_STEPS],
  ['EXPERIMENT_COPY', ex.EXPERIMENT_COPY],
];

/* Each of the twelve modules is scored on its own. Averaged together, one very plain
   module hides a dense one, and a reader only ever meets them one at a time. */
for (const m of modules.MODULES) GROUPS.push([`module: ${m.title}`, m]);

describe('every group of copy reads at eighth grade or below', () => {
  for (const [name, group] of GROUPS) {
    test(name, () => {
      const strings = harvest(group);
      assert.ok(strings.length > 0, `${name} produced no strings`);
      const passage = strings.join(' ');
      const g = gradeLevel(passage);
      const worst = longestSentence(passage);
      assert.ok(
        g <= TARGET_GRADE,
        `${name} reads at grade ${g.toFixed(1)}. Longest sentence is ${worst.words} words: "${worst.text.slice(0, 120)}"`
      );
    });
  }
});

describe('no single sentence is a wall', () => {
  const MICROCOPY = [...harvest(copy), ...harvest(ex)];
  const EVERYTHING = [...MICROCOPY, ...harvest(modules.MODULES)];

  test('every sentence in the app stays under thirty words', () => {
    for (const s of EVERYTHING) {
      /* Markdown emphasis markers sit between the full stop and the space (`sentence.* Next`),
         so the terminator class has to step over them or a run of short emphasised clauses
         is counted as one enormous sentence. */
      for (const sentence of s.split(/[.!?:;]+[*_]*[\s"']|\n+/)) {
        const n = countWords(sentence).length;
        assert.ok(n <= SENTENCE_MAX_WORDS, `${n}-word sentence: "${sentence.slice(0, 160)}"`);
      }
    }
  });

  test('no sentence of interface microcopy is far above the target', () => {
    for (const s of MICROCOPY) {
      for (const sentence of s.split(/[.!?]+\s/)) {
        if (countWords(sentence).length < SENTENCE_MIN_WORDS) continue;
        const g = gradeLevel(sentence);
        assert.ok(
          g <= SENTENCE_MAX_GRADE,
          `grade ${g.toFixed(1)}: "${sentence.trim().slice(0, 140)}"`
        );
      }
    }
  });
});
