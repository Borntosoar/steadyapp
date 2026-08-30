import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VALUES, SCENES, ESCALATE_AT, VALUES_TO_PICK, SCENES_PER_RUN,
  situationFor, optionsFor, runScenes, tallyByValue, actionFor, labelFor,
} from '../content/toward.ts';
import { MOODS } from '../lib/motif.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const KEYS = new Set(VALUES.map((v) => v.key));

/* The rules that make Toward an ACT game rather than a quiz with softer wording.
 *
 * Every one of these is a property that would still "work" if broken — the game would run,
 * the screens would render, and it would be teaching something other than what it claims. */

describe('the structure of a moment', () => {
  test('there are enough scenes to be worth a run', () => {
    assert.ok(SCENES.length >= 5);
    assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  });

  for (const s of SCENES) {
    describe(s.id, () => {
      test('offers exactly one away move', () => {
        /* Two away moves and the scene becomes a choice between comforts; none and it
           becomes a quiz with the answer showing. */
        const away = s.options.filter((o) => o.move === 'away');
        assert.equal(away.length, 1, `${away.length} away moves`);
      });

      test('offers at least two toward moves, serving different values', () => {
        /* The interesting choice in this game is between two things that both matter, not
           between a value and nothing. */
        const toward = s.options.filter((o) => o.move === 'toward');
        assert.ok(toward.length >= 2, `only ${toward.length} toward moves`);
        assert.equal(new Set(toward.map((o) => o.value)).size, toward.length,
          'two toward moves serve the same value, so the choice between them is cosmetic');
      });

      test('the away move actually buys something', () => {
        /* THE RULE THIS GAME LIVES OR DIES ON. Avoidance has to be written as effective,
           because it is — that is the entire reason people do it. An away move with zero
           relief is a wrong button, and a game where avoidance is obviously the wrong button
           teaches nothing, since in life it never looks like one. */
        const away = s.options.find((o) => o.move === 'away');
        assert.ok(away.relief > 0,
          'the away move offers no relief, which makes it a trap rather than a temptation');
      });

      test('a toward move never buys more relief than the away move', () => {
        const away = s.options.find((o) => o.move === 'away');
        for (const o of s.options.filter((x) => x.move === 'toward')) {
          assert.ok(o.relief < away.relief,
            `"${o.text}" is more comfortable than avoiding, which inverts the whole mechanic`);
        }
      });

      test('every toward move names a value that exists', () => {
        for (const o of s.options.filter((x) => x.move === 'toward')) {
          assert.ok(KEYS.has(o.value), `"${o.value}" is not a value the player can pick`);
        }
      });

      test('the away move serves no value', () => {
        const away = s.options.find((o) => o.move === 'away');
        assert.equal(away.value, null, 'an away move that serves a value is not an away move');
      });

      test('every option explains itself without passing judgement', () => {
        for (const o of s.options) {
          assert.ok(o.after.length > 60, `"${o.text}" has no real account of what it cost`);
        }
      });

      test('the thought is never resolved by the copy', () => {
        /* Defusion, not restructuring. If an `after` line disproves the thought, this has
           quietly become Curveball with longer sentences. */
        const banned = /\bnot true\b|\bisn'?t true\b|\buntrue\b|\bwrong about\b|\bevidence (?:for|against)\b/i;
        for (const o of s.options) {
          assert.doesNotMatch(o.after, banned,
            `"${o.after}" argues with the thought, which is the other game's move`);
        }
      });

      test('it has a bigger version of itself for later', () => {
        assert.ok(s.escalated.length > 40);
        assert.notEqual(s.escalated, s.situation);
      });

      test('it declares a ground', () => {
        assert.ok(s.mood in MOODS, `mood "${s.mood}" is not defined`);
        assert.ok(typeof s.motif === 'string' && s.motif);
      });

      test('nothing shouts and nothing shames', () => {
        const shaming = /\byou failed\b|\bfailure\b|\byou'?re behind\b|\bdisappoint|\bshould have\b/i;
        const own = [s.situation, s.escalated, ...s.options.map((o) => o.after)];
        for (const line of own) {
          assert.ok(!line.includes('!'), `shouts: "${line}"`);
          assert.doesNotMatch(line, shaming, `the app's own voice shames: "${line}"`);
        }
      });
    });
  }
});

describe('values and the scenes agree with each other', () => {
  test('value keys are unique', () => {
    assert.equal(new Set(VALUES.map((v) => v.key)).size, VALUES.length);
  });

  test('every value can actually be moved toward', () => {
    /* A value with no toward move anywhere is a value the ending has nothing to say about —
       the player picks it, plays five scenes, and is told they made no moves toward the
       thing they said mattered most. That is the one way this game could leave somebody
       worse off than it found them. */
    const served = new Set(SCENES.flatMap((s) => s.options.map((o) => o.value)).filter(Boolean));
    for (const v of VALUES) {
      assert.ok(served.has(v.key),
        `"${v.label}" can be picked but never served, so picking it guarantees a zero`);
    }
  });

  test('every value has a committed action small enough to do this week', () => {
    for (const v of VALUES) {
      assert.ok(v.committed.length > 50, `${v.key} has no real action`);
      assert.doesNotMatch(v.committed, /every day|daily|each day/i,
        'a committed action that needs a streak is a habit, not a next step');
    }
  });

  test('there are more values than the player picks', () => {
    assert.ok(VALUES.length > VALUES_TO_PICK * 2);
  });

  test('labelFor never returns undefined', () => {
    for (const v of VALUES) assert.equal(labelFor(v.key), v.label);
    assert.equal(labelFor('nonexistent'), 'nonexistent');
  });
});

describe('avoidance compounds instead of being marked wrong', () => {
  test('a clean run never sees the escalated text', () => {
    for (const s of SCENES) {
      assert.equal(situationFor(s, 0), s.situation);
      assert.equal(situationFor(s, ESCALATE_AT - 1), s.situation);
    }
  });

  test('it arrives once enough has been stepped around', () => {
    for (const s of SCENES) {
      assert.equal(situationFor(s, ESCALATE_AT), s.escalated);
      assert.equal(situationFor(s, ESCALATE_AT + 3), s.escalated);
    }
  });

  test('the threshold is reachable but not immediate', () => {
    assert.ok(ESCALATE_AT >= 2, 'one away move should not change the world');
    assert.ok(ESCALATE_AT < SCENES.length, 'the escalation can never be seen');
  });
});

describe('the ending reports rather than scores', () => {
  const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

  test('the tally only counts values the player chose', () => {
    const picks = SCENES.flatMap((s) => s.options.filter((o) => o.move === 'toward'));
    const tally = tallyByValue(picks, ['connection']);
    assert.deepEqual(Object.keys(tally), ['connection']);
    assert.ok(tally.connection > 0);
  });

  test('away moves count toward nothing', () => {
    const away = SCENES.map((s) => s.options.find((o) => o.move === 'away'));
    assert.deepEqual(tallyByValue(away, ['connection', 'health']), { connection: 0, health: 0 });
  });

  test('the committed action goes to the value that went unserved', () => {
    /* Never the best-served one. Telling somebody to keep doing the thing they already did
       is an ending that was not paying attention. */
    const picks = SCENES
      .flatMap((s) => s.options)
      .filter((o) => o.value === 'connection');
    const chosen = ['connection', 'health'];
    const action = actionFor(tallyByValue(picks, chosen), chosen);
    assert.equal(action.key, 'health');
  });

  test('it still returns something when nothing was served', () => {
    const chosen = ['making', 'growth'];
    const action = actionFor(tallyByValue([], chosen), chosen);
    assert.ok(chosen.includes(action.key));
  });

  test('it returns null rather than throwing when no values were picked', () => {
    assert.equal(actionFor({}, []), null);
  });

  test('option order is shuffled, so the away move is not always in slot one', () => {
    const a = optionsFor(SCENES[0], seq(0.9, 0.1, 0.5)).map((o) => o.text);
    const b = optionsFor(SCENES[0], seq(0.1, 0.8, 0.3)).map((o) => o.text);
    assert.deepEqual([...a].sort(), [...b].sort());
    assert.equal(a.length, SCENES[0].options.length);
  });
});

describe('the game is wired in and says what it is', () => {
  test("'toward' survives a round trip through storage", () => {
    const union = read('types/index.ts').match(/export type PracticeKind =([\s\S]*?);/);
    const kinds = [...union[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    assert.ok(kinds.includes('toward'));
    const accepted = read('lib/storage.ts').match(/const PRACTICE_KINDS[^=]*=\s*\[([\s\S]*?)\]/);
    const list = [...accepted[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    for (const k of kinds) assert.ok(list.includes(k), `"${k}" would be dropped on read`);
  });

  test('the screen logs the session and is reachable from Practice', () => {
    assert.match(read('app/game/toward.tsx'), /logPractice\('toward'\)/);
    assert.match(read('app/(tabs)/practice.tsx'), /\/game\/toward/);
  });

  test('the screen tells the player how this differs from Curveball', () => {
    /* Somebody who has played both has been taught opposite moves. Leaving them to work out
       that the app has not contradicted itself is leaving the most interesting thing in the
       product undelivered. */
    assert.match(read('app/game/toward.tsx'), /Curveball asks whether a thought is true/);
  });

  test('relief is never coloured as an error', () => {
    /* Rose is the palette's emotion colour and marks the relief taken. The moment relief
       reads as red, the game has become a compliance meter. */
    const src = read('app/game/toward.tsx');
    assert.match(src, /c\.rose/, 'relief has no colour of its own');
    assert.doesNotMatch(src, /c\.warn/, 'relief is being painted in the warning colour');
    assert.doesNotMatch(src, /NotificationFeedbackType\.(Warning|Error)/);
  });

  test('the headline figure is derived from the rows beneath it', () => {
    /* The defect this locks out shipped to a screenshot: the figure counted every toward
       move in the run while the rows counted only the two values the player picked, so a run
       that moved once toward something unchosen printed "1 move toward what matters"
       directly above "0 moves" and "0 moves". */
    const src = read('app/game/toward.tsx');
    assert.match(src, /const served = chosen\.reduce\(\(n, k\) => n \+ \(tally\[k\] \?\? 0\), 0\)/,
      'the ending no longer derives its figure from the same tally the rows use');
    assert.match(src, /figure=\{served\}/,
      'the figure is being counted separately from the rows again');
  });

  test('no percentage or score reaches the ending', () => {
    /* Comments stripped first. The file's own header says "no percentage, no accuracy",
       explaining the rule, and the first version of this test failed on that sentence —
       a guard that cannot tell an explanation from a violation. */
    const code = read('app/game/toward.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(code, /figureUnit=["'`][^"'`]*%|Math\.round\([^)]*\/[^)]*\* *100/,
      "this game does not score somebody's life choices");
  });
});


describe('a run is a draw, not a walk of the whole list', () => {
  /* ⚠ THE DEFECT THIS REPLACES. `app/game/toward.tsx` read
     `SCENES[Math.min(index, SCENES.length - 1)]` and stepped to the end — all five scenes,
     in the order they are written, every run. So the second run anybody played was the
     first run again, identically, and a player learned the answers rather than the skill.
     Curveball has drawn 4 of 7 at random since it shipped; this game was never given the
     same treatment because it was designed as one arc and the assumption outlived that.

     These are properties rather than examples: a fixed seed proving one particular draw
     would pass just as happily against a function that returns the first three every time. */

  /** A deterministic Rand, so a draw can be asserted rather than sampled.
   *
   *  ⚠ MULBERRY32, NOT THE LCG `__tests__/fuzz.test.mjs` USES, and the difference is the
   *  reason this comment exists rather than a style preference.
   *
   *  The first draft used the same `s * 1664525 + 1013904223` step. It is a perfectly good
   *  generator for the way the fuzzer uses it — ONE long chain from ONE seed — and it is
   *  correct there. It is wrong here, because these tests take a SINGLE draw from each of
   *  many sequential seeds, and an LCG's first output is almost linear in its seed: seeds 1,
   *  2, 3 … 400 produced 0.2364, 0.2368, 0.2372 … 0.3911, every one of which floors to the
   *  same index. So "every scene can be drawn across 400 seeds" explored one path 400 times
   *  and failed, and the failure looked exactly like a biased shuffle in lib/shuffle.ts.
   *  It was not; Fisher-Yates there is correct and the test was lying about its own coverage.
   *
   *  Mulberry32 avalanches the seed before the first output, which is the property a
   *  seed-per-iteration test needs and the one a plain LCG does not have. */
  const seeded = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  test('the generator these tests use actually varies with its seed', () => {
    /* The guard on the guards. Every property below samples one draw per seed, so a
       generator whose first output barely moves would let all of them pass vacuously — which
       is what happened, and it is the same class of defect as the fuzzer's object-passed-to-a
       -boolean bug recorded in __tests__/fuzz.test.mjs. Checked directly rather than assumed. */
    const firsts = new Set();
    for (let seed = 1; seed <= 200; seed += 1) firsts.add(Math.floor(seeded(seed)() * SCENES.length));
    assert.equal(firsts.size, SCENES.length,
      'sequential seeds do not reach every starting index — the properties below prove nothing');
  });

  test('a run is shorter than the whole list', () => {
    /* The point of the change. If this ever equals SCENES.length again the walk is back,
       whatever the call site looks like. */
    assert.ok(SCENES_PER_RUN < SCENES.length,
      `a run plays ${SCENES_PER_RUN} of ${SCENES.length} scenes, which is the whole list again`);
  });

  test('long enough for the escalation to land somewhere a player can use it', () => {
    /* Away moves compound and ESCALATE_AT turns the later scenes over. With a run of two the
       escalation could only ever arrive on the final scene, which is the one place it can
       teach nothing — there is no later choice left to make differently. */
    assert.ok(SCENES_PER_RUN > ESCALATE_AT,
      'the escalated form can only ever appear on the last scene of a run');
  });

  test('a run never repeats a scene', () => {
    /* Answering from memory inside a single sitting is the failure this game is least able
       to survive: the whole mechanic is choosing with the thought still in the room. */
    for (let seed = 1; seed <= 50; seed += 1) {
      const run = runScenes(SCENES_PER_RUN, seeded(seed));
      assert.equal(new Set(run.map((s) => s.id)).size, run.length, `seed ${seed} repeated a scene`);
    }
  });

  test('every scene can be drawn, so no scene is unreachable', () => {
    /* A shuffle that never returns the last element is a real and quiet bug — the scene is
       authored, tested by every structural rule above, and never seen by anybody. */
    const seen = new Set();
    for (let seed = 1; seed <= 400; seed += 1) {
      runScenes(SCENES_PER_RUN, seeded(seed)).forEach((s) => seen.add(s.id));
    }
    assert.deepEqual([...seen].sort(), SCENES.map((s) => s.id).sort(),
      'some scenes are never drawn');
  });

  test('the order varies, so the second run is not the first one again', () => {
    /* The property the old code failed. Not "is it random" — just that two runs are not
       forced to be the same sequence. */
    const runs = new Set();
    for (let seed = 1; seed <= 60; seed += 1) {
      runs.add(runScenes(SCENES_PER_RUN, seeded(seed)).map((s) => s.id).join(','));
    }
    assert.ok(runs.size > 1, 'every run produces the same sequence');
  });

  test('asking for more than exists returns what exists rather than repeating', () => {
    const run = runScenes(SCENES.length + 5, seeded(7));
    assert.equal(run.length, SCENES.length);
    assert.equal(new Set(run.map((s) => s.id)).size, SCENES.length);
  });

  test('the screen draws its run instead of indexing the module list', () => {
    /* The pin. `runScenes` imported but never called, or called and then ignored in favour
       of SCENES, is exactly how this regresses while the content-side tests above stay
       green. Comments stripped so a commented-out call cannot satisfy it — the same hole
       __tests__/entitlement.test.mjs found in its own pin helper. */
    const code = read('app/game/toward.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(?<!:)\/\/.*$/gm, '');
    assert.match(code, /useMemo<TowardScene\[\]>\(\(\) => runScenes\(\), \[\]\)/,
      'the run is no longer drawn once per mount');
    assert.doesNotMatch(code, /\bSCENES\b/,
      'the screen reads the whole scene list again instead of its own drawn run');
  });
});
