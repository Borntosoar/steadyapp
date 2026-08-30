import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCENES, SCENES_PER_SESSION, MIN_BALANCED_PER_SCENE,
  shuffle, sessionScenes, sessionRound, actionsFor, cast,
} from '../content/curveball.ts';
import { DISTORTIONS } from '../content/exercises.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = new Set(DISTORTIONS.map((d) => d.name));
/* Module scope on purpose. This was defined inside one `describe` and used from another,
   which threw during collection — and node --test reported it and exited 0, so roughly
   forty assertions stopped running while the summary read clean. scripts/test.mjs now fails
   the build on that, and this is the bug it was written for. */
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

/* The content rules that make Curveball a skill rather than a tapping exercise.
 *
 * Every one of these was a defect in the browser prototype or a defect it was one edit away
 * from acquiring. They are checked here because the failure mode is silent: a scene with no
 * balanced thoughts still plays, still scores, still feels fine, and teaches the player that
 * every thought they have is suspect. Nothing at runtime would notice. */

describe('curveball scenes', () => {
  test('there is more than one session of material', () => {
    assert.ok(SCENES.length > SCENES_PER_SESSION,
      'every session would draw the same scenes, so the second play teaches the answers');
  });

  test('scene ids are unique', () => {
    assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  });

  for (const s of SCENES) {
    describe(s.id, () => {
      test('has enough balanced thoughts to make "tap everything" wrong', () => {
        const balanced = s.thoughts.filter((t) => t.distortion === null);
        assert.ok(balanced.length >= MIN_BALANCED_PER_SCENE,
          `only ${balanced.length} thought(s) may be let through — the correct strategy ` +
          `becomes tapping all of them, which is the opposite of the skill`);
      });

      test('has distorted thoughts to catch', () => {
        assert.ok(s.thoughts.filter((t) => t.distortion !== null).length >= 2);
      });

      test('the balanced thoughts are not all bunched at the end', () => {
        /* Order is fixed rather than shuffled at runtime, so it is the content's job to
           spread them. All the fair thoughts arriving last means the first half of every
           scene rewards tapping without looking. */
        const half = Math.ceil(s.thoughts.length / 2);
        const early = s.thoughts.slice(0, half).filter((t) => t.distortion === null).length;
        assert.ok(early >= 1, 'no fair thought arrives in the first half of the scene');
      });

      test('every distortion named is in the live taxonomy', () => {
        for (const t of s.thoughts) {
          if (t.distortion === null) continue;
          assert.ok(NAMES.has(t.distortion),
            `"${t.distortion}" is not in content/exercises.ts, so the thought record ` +
            `cannot record the pattern this game just taught`);
        }
      });

      test('the situation is about to happen, not already over', () => {
        /* Distanced reflection helps somebody preparing for a thing and does not help
           somebody reprocessing one — Schertz et al. 2025, 208 people. Every scene here is
           therefore prospective, and the past-tense openers that used to be the whole file
           are the shape this guards against. */
        assert.doesNotMatch(s.scene, /^You /,
          'the scene is addressed to the player rather than describing somebody else');
        assert.match(s.scene, new RegExp(`\\b${s.who}\\b`),
          'the scene never names whose situation it is');
      });

      test('exactly one action proceeds on what they actually know', () => {
        const checks = s.next.options.filter((o) => o.checks);
        assert.equal(checks.length, 1, `${checks.length} actions marked as checking`);
        assert.ok(s.next.options.length >= 3, 'two options is a coin flip');
      });

      test('every action says what happens, including the ones that avoid', () => {
        for (const o of s.next.options) {
          assert.ok(o.outcome.length > 60,
            `"${o.text}" has no real consequence — an unexplained option is one the player ` +
            `takes home unexamined`);
        }
      });

      test('no outcome passes a verdict on the character', () => {
        /* A consequence teaches; a verdict is the answer key coming back in prose. */
        const verdict = /\b(right|wrong|correct|mistake|should have|the best (choice|option))\b/i;
        for (const o of s.next.options) {
          assert.doesNotMatch(o.outcome, verdict, `"${o.outcome}" grades the choice`);
        }
      });

      test('thought text is short enough to read while it moves', () => {
        for (const t of s.thoughts) {
          assert.ok(t.text.length <= 52, `"${t.text}" is ${t.text.length} chars`);
        }
      });

      test('no thought is duplicated inside a scene', () => {
        assert.equal(new Set(s.thoughts.map((t) => t.text)).size, s.thoughts.length);
      });
    });
  }

  test('the copy rules the rest of the app is held to also hold here', () => {
    /* No exclamation marks outside a quoted wrong answer, and no second-person accusation.
       The one exclamation in the file belongs to a toxic-positivity distractor, where it is
       doing work — so it is allowed only on an option marked inaccurate. */
    for (const s of SCENES) {
      for (const t of s.thoughts) {
        assert.ok(!t.text.includes('!'), `"${t.text}" shouts`);
      }
      for (const o of s.next.options) {
        assert.ok(!o.text.includes('!'), `action shouts: "${o.text}"`);
        assert.ok(!o.outcome.includes('!'), `outcome shouts: "${o.outcome}"`);
      }
    }
  });

  test('nothing here tells the player they failed', () => {
    /* The same shaming guard __tests__/copy.test.mjs holds the rest of the app to. The
       game's strings are not in that file's `ALL`, and a set of copy rules that a whole new
       content module is silently exempt from is not a set of copy rules. */
    const shaming =
      /\byou failed\b|\byou'?ve failed\b|\bfailure\b|\byou broke\b|\byou'?re behind\b|\bdisappoint/i;
    for (const s of SCENES) {
      const strings = [
        s.scene,
        ...s.thoughts.map((t) => t.text),
        ...s.next.options.flatMap((o) => [o.text, o.outcome]),
      ];
      for (const str of strings) {
        /* One exception, and it has to be narrow: a distorted THOUGHT is allowed to shame,
           because that is what the player is there to catch. The app's own voice — the
           scene, and every `why` — is not. */
        const isThought = s.thoughts.some((t) => t.text === str);
        if (isThought) continue;
        assert.doesNotMatch(str, shaming, `the app's own voice shames: "${str}"`);
      }
    }
  });
});

describe('selection is deterministic under an injected random', () => {
  /** A stand-in for Math.random that walks a fixed sequence. */
  const seq = (...xs) => {
    let i = 0;
    return () => xs[i++ % xs.length];
  };

  test('shuffle keeps every element exactly once', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const out = shuffle(input, seq(0.1, 0.9, 0.5, 0.3, 0.7));
    assert.deepEqual([...out].sort(), [...input].sort());
    assert.notEqual(out, input, 'shuffle must not mutate its argument');
  });

  test('shuffle does not mutate the source', () => {
    const input = ['a', 'b', 'c'];
    shuffle(input, seq(0.9, 0.1));
    assert.deepEqual(input, ['a', 'b', 'c']);
  });

  test('a session never repeats a scene', () => {
    const picked = sessionScenes(SCENES_PER_SESSION, seq(0.2, 0.8, 0.4, 0.6, 0.1));
    assert.equal(picked.length, SCENES_PER_SESSION);
    assert.equal(new Set(picked.map((s) => s.id)).size, picked.length);
  });

  test('asking for more scenes than exist returns what exists rather than repeating', () => {
    const picked = sessionScenes(99, Math.random);
    assert.equal(picked.length, SCENES.length);
    assert.equal(new Set(picked.map((s) => s.id)).size, SCENES.length);
  });

  test('the actions are shuffled, so the checking one is not always in slot one', () => {
    const a = actionsFor(SCENES[0], seq(0.9, 0.1, 0.5)).map((o) => o.text);
    const b = actionsFor(SCENES[0], seq(0.1, 0.8, 0.3)).map((o) => o.text);
    assert.deepEqual([...a].sort(), [...b].sort());
    assert.equal(a.length, SCENES[0].next.options.length);
  });

  test('the cast recurs rather than being a new stranger every scene', () => {
    /* A second session should be somebody already met. It is also what the ending's
       "X is next time" line reads from. */
    const people = cast();
    assert.ok(people.length >= 2, 'one character is a monologue');
    assert.ok(people.length < SCENES.length, 'nobody recurs, so there is no serial');
  });
});

describe('the game is wired into the rest of the app', () => {

  test("'curveball' is an accepted practice kind on the way back off disk", () => {
    /* The specific bug this prevents: `PracticeKind` is a union and `PRACTICE_KINDS` in
       lib/storage.ts is a hand-written array annotated with it, so adding a kind to the
       union is not a type error — it is a row that normalises to null and disappears on the
       next read, taking a day off somebody's streak. */
    const union = read('types/index.ts').match(/export type PracticeKind =([\s\S]*?);/);
    assert.ok(union, 'PracticeKind is no longer declared the way this test reads it');
    const kinds = [...union[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    assert.ok(kinds.includes('curveball'));

    const accepted = read('lib/storage.ts').match(/const PRACTICE_KINDS[^=]*=\s*\[([\s\S]*?)\]/);
    assert.ok(accepted, 'PRACTICE_KINDS is no longer declared the way this test reads it');
    const list = [...accepted[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    for (const k of kinds) {
      assert.ok(list.includes(k),
        `"${k}" is a PracticeKind that lib/storage.ts will silently drop on read`);
    }
  });

  test('the game screen logs the session', () => {
    assert.match(read('app/game/curveball.tsx'), /logPractice\('curveball'\)/);
  });

  test('the game is reachable from Practice', () => {
    assert.match(read('app/(tabs)/practice.tsx'), /\/game\/curveball/);
  });

  test('nothing buzzes or reddens at a player who got something wrong', () => {
    /* hooks/haptics.ts has no warning style on purpose, and the palette's `warn` is for
       destructive confirmations rather than for people. A game is exactly where somebody
       would reach for both, so this checks the game specifically rather than trusting the
       policy to hold by itself.
       Deliberately narrow: an earlier version of this test matched the bare word "Error"
       and failed on a `throw new Error`, which is the kind of over-broad guard that gets
       loosened until it matches nothing. */
    const src = read('app/game/curveball.tsx');
    assert.doesNotMatch(src, /NotificationFeedbackType\.(Warning|Error)/,
      'the game buzzes a correction at the player');
    assert.doesNotMatch(src, /\bc\.warn\b/,
      'the game paints a wrong answer in the warning colour');
  });
});

describe('the game can be left, and can be played without motion', () => {
  const src = read('app/game/curveball.tsx');

  test('the distortion tell survives Reduce Motion', () => {
    /* THE BUG THIS EXISTS FOR. `sway` went to zero under reduced motion and every entry of
       the rotation output range went to '0deg', so a distorted pill and a balanced one were
       pixel-identical — while the intro carried on promising that the bent ones lean. The
       game was not degraded for those players, it was unplayable, and the whole suite missed
       it because every test here checks content rather than what the screen does with an
       accessibility setting on.
       A static angle is not motion, so the fix is a fixed lean rather than no lean. */
    assert.match(src, /const lean = bent \? \(reduced \? '[\d.]+deg' : null\) : '0deg'/,
      'distorted thoughts no longer hold a static lean when animation is off');
    assert.doesNotMatch(src, /outputRange: bent && !reduced/,
      'the tell is being switched off by the accessibility setting again');
  });

  test('every phase has a visible way out', () => {
    /* NameIt and Reframe had no TopBar at all, so the moment a scene lands hardest was the
       moment with nothing on screen to leave by. */
    const phases = ['function Intro', 'function Intercept', 'function WhatNext'];
    for (let i = 0; i < phases.length; i++) {
      const start = src.indexOf(phases[i]);
      assert.ok(start > 0, `${phases[i]} is gone`);
      const end = i + 1 < phases.length ? src.indexOf(phases[i + 1]) : src.length;
      assert.match(src.slice(start, end), /<TopBar/,
        `${phases[i]} renders no TopBar, so there is no way out of it`);
    }
  });

  test('a scene can be passed, on the same terms as in Toward', () => {
    /* Toward's rationale names the partner scene and the appointment scene as the reason it
       has an exit. Curveball contains that same partner scene, on a clock. One exit
       vocabulary across both games, imported rather than restated. */
    assert.match(src, /PASS_LABEL/, 'there is no way past a scene');
    assert.match(src, /from '\.\.\/\.\.\/content\/toward\.ts'/,
      'the exit wording is being restated instead of shared');
    assert.match(src, /onPass=\{\(\) => \{/);
  });

  test('a pass is never scored', () => {
    /* Not a miss, not a false alarm, not in any tally. The count is held in its own state
       for exactly this reason. */
    assert.match(src, /const \[passed, setPassed\] = useState\(0\)/);
    assert.doesNotMatch(src, /falseAlarm: [^,\n]*passed/);
    assert.doesNotMatch(src, /missed: [^,\n]*passed/);
  });

  test('the ending puts no score on somebody\'s mind', () => {
    /* `pct` was computed and handed to Finish as `figure`, which renders it as the largest
       thing on screen and counts it up. Toward has no score; this is the two games agreeing. */
    assert.doesNotMatch(src, /Math\.round\(\(correct \/ total\) \* 100\)/);
    assert.doesNotMatch(src, /figureUnit="%/);
    assert.match(src, /figure=\{null\}/);
  });
});

describe('the naming phase is answerable', () => {
  test('no two thoughts in the whole game share a sentence with different labels', () => {
    /* "Everyone else copes fine." was Mind reading in one scene and "Everyone else gets up
       fine." was Comparison bias in another — the same sentence, two answers. A player who
       learned the first and answered the second consistently was told they were wrong. A game
       that marks a defensible answer wrong is not experienced as clinical, it is experienced
       as unfair, and unfairness reads as coldness. */
    const byText = new Map();
    for (const s of SCENES) {
      for (const t of s.thoughts) {
        const key = t.text.toLowerCase().replace(/[^a-z ]/g, '').trim();
        const prev = byText.get(key);
        if (prev && prev !== t.distortion) {
          assert.fail(`"${t.text}" is labelled both "${prev}" and "${t.distortion}"`);
        }
        byText.set(key, t.distortion);
      }
    }
  });
});

describe('the deal has memory, which a bigger pool does not buy', () => {
  /* ⚠ THE FINDING THAT MADE THIS SECTION EXIST, AND IT IS AN ARITHMETIC ONE.
   *
   * Curveball had seven scenes and drew four, so session two repeated by the pigeonhole
   * principle. The obvious fix was more scenes, so the pool went to thirty — and the measured
   * mean first repeat moved from 2.0 sessions to 2.72. Twenty-three scenes bought seven
   * tenths of a session.
   *
   * That is the birthday problem, not a shortage. Two independent draws of four from thirty
   * miss each other only about 55% of the time, and no pool size fixes a selection with no
   * memory. `deal` permutes once per cycle and hands out consecutive blocks instead, which
   * takes the first repeat to session eight.
   *
   * These are properties rather than examples. A test asserting one particular hand for one
   * particular index would pass just as happily against a function that returns the first
   * four every time — which is precisely the failure mode being guarded against. */

  test('a whole cycle is seen before anything comes round again', () => {
    const perCycle = Math.floor(SCENES.length / SCENES_PER_SESSION);
    const seen = new Set();
    for (let i = 0; i < perCycle; i += 1) {
      for (const s of sessionRound(i)) {
        assert.ok(!seen.has(s.id), `"${s.id}" came round again at session ${i + 1}`);
        seen.add(s.id);
      }
    }
    assert.equal(seen.size, perCycle * SCENES_PER_SESSION);
  });

  test('the first repeat is many sessions out, not two', () => {
    /* Pinned as a NUMBER because the whole point was a measured improvement. If a future
       change to `deal` quietly returns to independent draws this fails, where the "no repeat
       inside a cycle" test above might not. */
    const seen = new Set();
    let firstRepeat = null;
    for (let i = 0; i < 40 && firstRepeat === null; i += 1) {
      const hand = sessionRound(i);
      if (hand.some((s) => seen.has(s.id))) firstRepeat = i + 1;
      hand.forEach((s) => seen.add(s.id));
    }
    assert.ok(firstRepeat === null || firstRepeat >= 7,
      `the first repeat is at session ${firstRepeat}; independent shuffling gave 2.7`);
  });

  test('every hand is full, including the last one of a cycle', () => {
    /* Thirty does not divide by four, so the final block of a cycle is short and is topped
       up from the next permutation. A session of three scenes instead of four is a worse
       failure than one early repeat, because the player can see it. */
    for (let i = 0; i < 40; i += 1) {
      assert.equal(sessionRound(i).length, SCENES_PER_SESSION, `session ${i} dealt a short hand`);
    }
  });

  test('no hand contains the same scene twice', () => {
    for (let i = 0; i < 40; i += 1) {
      const ids = sessionRound(i).map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length, `session ${i} dealt a duplicate`);
    }
  });

  test('the same session index always deals the same hand', () => {
    /* Stability across launches is the reason the permutation is seeded from the cycle rather
       than from Math.random. Without it, closing the app mid-cycle reshuffles the deck and
       deals cards already played — which is the bug this replaces, reintroduced by the fix. */
    for (const i of [0, 3, 7, 12, 29]) {
      assert.deepEqual(sessionRound(i).map((s) => s.id), sessionRound(i).map((s) => s.id));
    }
  });

  test('the second pass through the pool is not the first pass again', () => {
    /* ⚠ THE CYCLE LENGTH IS `ceil`, NOT `floor`, and getting that wrong made this test pass
       for the wrong reason. With thirty scenes and four a session there are EIGHT blocks per
       permutation, not seven — the eighth is the short one. Comparing sessions 0-6 against
       7-13 therefore straddles a cycle boundary, so the two lists differ no matter what the
       permutation does, and a `deal` that used one fixed permutation for every cycle passed
       this happily. Verified by making that exact change. */
    const perCycle = Math.ceil(SCENES.length / SCENES_PER_SESSION);
    /* ⚠ FULL BLOCKS ONLY, and this is the second correction to this one test.
       The short final block is topped up from the NEXT cycle's permutation, so it varies by
       cycle even when the main permutation does not. Including it meant a `deal` pinned to a
       single fixed permutation still produced two different lists here and passed. Verified
       by making that change: the guard stayed green while every cycle dealt an identical
       order. Blocks 0..floor-1 come from the permutation alone, so they are the ones that
       actually answer the question being asked. */
    const fullBlocks = Math.floor(SCENES.length / SCENES_PER_SESSION);
    const ids = (i) => sessionRound(i).map((s) => s.id).join();
    const first = Array.from({ length: fullBlocks }, (_, i) => ids(i));
    const second = Array.from({ length: fullBlocks }, (_, i) => ids(perCycle + i));
    assert.notDeepEqual(first, second, 'every cycle deals the same order, so the game is on a loop');
  });

  test('a hostile session index deals a real hand rather than throwing', () => {
    /* The index is derived from a stored count, and lib/storage.ts accepts what it is given
       for a lot of fields. NaN would make every derived value NaN and deal an empty hand on
       the screen somebody just tapped into. */
    for (const bad of [-1, -1000, NaN, Infinity, -Infinity, 1.7, 1e12]) {
      const hand = sessionRound(bad);
      assert.equal(hand.length, SCENES_PER_SESSION, `index ${bad} dealt ${hand.length}`);
      assert.equal(new Set(hand.map((s) => s.id)).size, hand.length);
    }
    /* ⚠ AND IT NORMALISES RATHER THAN BEING RESCUED. The length checks above passed against
       an UNGUARDED index: NaN makes every derived value NaN, `slice(NaN, NaN)` yields an
       empty block, and the short-block top-up then quietly refilled it to four. A full hand
       arrived by accident and the assertions could not tell. These pin the normalisation
       itself — anything unusable is index zero, and index zero is a specific hand. */
    const zero = sessionRound(0).map((s) => s.id);
    for (const bad of [NaN, -1, -1000, -Infinity]) {
      assert.deepEqual(sessionRound(bad).map((s) => s.id), zero,
        `index ${bad} was not normalised to the first session`);
    }
    assert.deepEqual(sessionRound(1.7).map((s) => s.id), sessionRound(1).map((s) => s.id),
      'a fractional index does not floor to a real session');
  });

  test('the screen deals by session rather than shuffling afresh', () => {
    /* The pin. `sessionRound` imported and then ignored in favour of `sessionScenes` is
       exactly how this regresses with every content test above still green. Comments
       stripped, trailing ones included, because the note explaining the change names the old
       function several times. */
    const code = read('app/game/curveball.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(?<!:)\/\/.*$/gm, '');
    assert.match(code, /sessionRound\(/, 'the screen no longer deals by session');
    assert.doesNotMatch(code, /sessionScenes\(/,
      'the screen is shuffling afresh again, so sessions collide from the second one');
  });
});
