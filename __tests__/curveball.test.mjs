import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCENES, SCENES_PER_SESSION, MIN_BALANCED_PER_SCENE,
  shuffle, sessionScenes, nameOptions, reframeTarget,
} from '../content/curveball.ts';
import { DISTORTIONS } from '../content/exercises.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = new Set(DISTORTIONS.map((d) => d.name));

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

      test('the reframe quotes a thought this scene actually contains, and a bent one', () => {
        const target = reframeTarget(s);
        assert.notEqual(target.distortion, null,
          'the reframe phase is about a distorted thought; this one is balanced');
      });

      test('exactly one reframe option is accurate', () => {
        const right = s.reframe.options.filter((o) => o.accurate);
        assert.equal(right.length, 1, `${right.length} accurate options`);
        assert.ok(s.reframe.options.length >= 3, 'two options is a coin flip');
      });

      test('every reframe option explains itself, wrong ones included', () => {
        for (const o of s.reframe.options) {
          assert.ok(o.why.length > 40,
            `"${o.text}" has no real explanation — a plausible wrong answer left ` +
            `unexplained is a plausible wrong answer the player takes home`);
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
      for (const o of s.reframe.options) {
        if (o.text.includes('!')) {
          assert.equal(o.accurate, false,
            'an exclamation mark on the correct reframe reads as cheerfulness, which is ' +
            'the exact failure the wrong answers are there to demonstrate');
        }
        assert.ok(!o.why.includes('!'), `explanation shouts: "${o.why}"`);
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
        ...s.reframe.options.flatMap((o) => [o.text, o.why]),
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

  test('name options always contain the true answer and never contain it twice', () => {
    for (const s of SCENES) {
      const target = reframeTarget(s);
      const opts = nameOptions(target.distortion, seq(0.3, 0.7, 0.1, 0.9));
      assert.equal(opts.length, 3);
      assert.equal(opts.filter((o) => o === target.distortion).length, 1);
      assert.equal(new Set(opts).size, 3, 'a repeated distractor makes two answers look true');
      for (const o of opts) assert.ok(NAMES.has(o), `"${o}" is not a real distortion`);
    }
  });

  test('reframeTarget throws rather than returning undefined on a broken scene', () => {
    assert.throws(
      () => reframeTarget({
        id: 'broken',
        scene: 'x',
        thoughts: [{ text: 'a', distortion: null }],
        reframe: { quote: 'not present', options: [] },
      }),
      /does not contain/,
    );
  });
});

describe('the game is wired into the rest of the app', () => {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');

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
    const phases = ['function Intro', 'function Intercept', 'function NameIt', 'function Reframe'];
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
