import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { gradeLevel, longestSentence, countWords } from '../lib/readability.ts';

const copy = await import('../content/copy.ts');
const ex = await import('../content/exercises.ts');
const modules = await import('../content/modules.ts');
/* The two games were never in this file, so their register was never measured against the
   rest of the app's. They happen to pass — but "happens to" is the state this whole suite
   exists to replace. */
const cb = await import('../content/curveball.ts');
const tw = await import('../content/toward.ts');
const gw = await import('../content/groundwork.ts');
const bl = await import('../content/ballast.ts');
const sv = await import('../content/survey.ts');
const tr = await import('../content/tracks.ts');

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

/* One group per game scene, for the same reason the modules are scored one at a time: a
   reader meets exactly one scene at a time, and averaging seven of them lets a dense one
   hide behind six plain ones.
   PROSE ONLY, AND THAT IS A CORRECTION. These were registered as whole objects, so the
   harvester swept up ids, moods and motif names too — `smallHours loops letdown` joined into
   one unpunctuated 167-word run and scored grade 68. The games passed anyway, by luck: they
   happen to carry enough real sentences to drown their own ids. That is not a measurement.
   Only strings somebody actually reads are scored now. */
const prose = (...xs) => xs.flat().filter(Boolean);

for (const s of cb.SCENES) {
  GROUPS.push([`curveball: ${s.id}`, prose(
    s.scene,
    s.thoughts.map((t) => t.text),
    s.next.options.map((o) => [o.text, o.outcome]),
  )]);
}
for (const s of tw.SCENES) {
  GROUPS.push([`toward: ${s.id}`, prose(
    s.situation, s.escalated, s.thought,
    s.options.map((o) => [o.text, o.after]),
  )]);
}
GROUPS.push(['toward: values', prose(tw.VALUES.map((v) => [v.label, v.committed]))]);
GROUPS.push(['groundwork: actions', prose(gw.ACTIONS.map((a) => a.text))]);
GROUPS.push(['groundwork: replies', prose(
  Object.values(gw.KEPT_LABELS), Object.values(gw.KEPT_REPLY),
)]);
GROUPS.push(['ballast: beliefs and facts', prose(
  bl.BELIEFS.map((b) => b.text), bl.FACTS.map((f) => f.text),
)]);
GROUPS.push(['ballast: discounts and replies', prose(
  Object.values(bl.DISCOUNTS), Object.values(bl.STRUCK), bl.BALLAST_CLOSE,
)]);
GROUPS.push(['survey: questions', prose(
  sv.QUESTIONS.map((q) => [q.ask, q.note, ...q.tiles.map((t) => t.label)]),
  Object.values(sv.REFLECTION),
)]);
/* One group per track day, for the same reason as the game scenes and the modules: a day is
   the unit somebody actually reads, and averaging seven of them lets a dense one hide. The
   track days are the densest prose in the app outside the teaching modules — every one of
   them explains a mechanism — so this is the group most likely to drift. */
for (const t of tr.TRACKS) {
  for (const d of t.days) {
    GROUPS.push([`track ${t.id}: ${d.id}`, prose(
      d.title, d.about, d.game.focus, d.game.label, d.practice.label, d.hold,
    )]);
  }
  GROUPS.push([`track ${t.id}: framing`, prose(t.title, t.blurb, tr.TRACK_CAVEAT, tr.closeFor(t))]);
}

describe('every group of copy reads at eighth grade or below', () => {
  for (const [name, group] of GROUPS) {
    test(name, () => {
      const strings = harvest(group);
      assert.ok(strings.length > 0, `${name} produced no strings`);
      /* Each string is a thing somebody reads on its own — a tile, an option, a paragraph —
         so each is terminated before the join. Without this a list of short unpunctuated
         labels becomes one enormous sentence: "Open a window and stand at it for a minute
         Make a drink and finish it sitting down Put shoes on..." scored as 108 words and
         grade 42, which measures the join rather than the copy. Prose blocks already end in
         a full stop, so this changes nothing for them. */
      const passage = strings.map((x) => (/[.!?:;]$/.test(x.trim()) ? x : `${x}.`)).join(' ');
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
