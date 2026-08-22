import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACTIONS, SLOTS, WEIGHT, CAPACITY, HAND_SIZE, deal, loadOf, holds, groundLine,
  KEPT_LABELS, KEPT_REPLY, nextSize,
} from '../content/groundwork.ts';
import {
  BELIEFS, FACTS, DISCOUNTS, STRUCK, OFFERED, factsFor, ballastLine, BALLAST_CLOSE,
} from '../content/ballast.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

/* Games three and four.
 *
 * Groundwork is behavioural activation and Ballast is a positive data log. Both have one
 * property that would still let them run perfectly while teaching the opposite of what they
 * claim, and most of what is checked here is that property. */

describe('Groundwork: the ground has to be able to give way', () => {
  test('the capacity is small enough that overloading is easy', () => {
    /* If the day holds everything, the game has nothing to show anybody. The whole lesson is
       that the plan was too big — graded task assignment only works when the grading bites. */
    assert.ok(CAPACITY < WEIGHT.large + WEIGHT.small,
      'a large action plus a small one fits, so the day can never be overloaded');
    assert.ok(CAPACITY >= WEIGHT.small * 3, 'three small things must fit, or nothing does');
  });

  test('one large action alone nearly fills the day', () => {
    const large = ACTIONS.find((a) => a.size === 'large');
    assert.ok(loadOf([large]) >= CAPACITY, 'a large thing is not heavy enough to teach anything');
  });

  test('three small ones hold and are the intended shape of a day', () => {
    const small = ACTIONS.filter((a) => a.size === 'small').slice(0, 3);
    assert.equal(holds(small), true);
  });

  test('every hand contains a way to succeed and a way to overreach', () => {
    /* A hand of six large actions is a game that cannot be won, which for this audience is
       worse than no game at all. A hand with no large one has no trap. */
    for (let i = 0; i < 40; i++) {
      const hand = deal(Math.random);
      assert.equal(hand.length, HAND_SIZE);
      assert.equal(new Set(hand.map((a) => a.id)).size, hand.length, 'a hand repeats an action');
      assert.ok(hand.filter((a) => a.size === 'small').length >= 3, 'no way to fill the day safely');
      assert.ok(hand.some((a) => a.size === 'large'), 'the trap is unreachable');
    }
  });

  test('deal is deterministic under an injected random', () => {
    assert.deepEqual(deal(seq(0.1, 0.7, 0.3, 0.9, 0.5)), deal(seq(0.1, 0.7, 0.3, 0.9, 0.5)));
  });

  test('the first rung is genuinely low', () => {
    /* The smallest actions have to be small enough to feel almost insulting. An action list
       somebody reads and thinks "not today" produces another failed day, which is the exact
       loop this game exists to interrupt. */
    const smalls = ACTIONS.filter((a) => a.size === 'small');
    assert.ok(smalls.length >= 5, 'not enough genuinely small things to offer');
    for (const a of smalls) {
      assert.ok(a.text.length <= 52, `"${a.text}" is a paragraph, not a first rung`);
    }
  });

  test('the actions cover more than one kind of narrowing', () => {
    /* A list that is six versions of "go outside" serves one person. Depression narrows
       movement, contact, care and making, and the hand should be able to reach each. */
    assert.ok(new Set(ACTIONS.map((a) => a.kind)).size >= 5);
  });

  test('the ground never says anything about the person', () => {
    const scolding = /\byou (are|have|should|need to|failed|never|always)\b/i;
    const lines = [
      groundLine([]),
      groundLine(ACTIONS.filter((a) => a.size === 'small').slice(0, 2)),
      groundLine([ACTIONS.find((a) => a.size === 'large'), ACTIONS.find((a) => a.size === 'medium')]),
    ];
    for (const l of lines) {
      assert.doesNotMatch(l, scolding, `the ground is talking about the person: "${l}"`);
      assert.ok(!l.includes('!'), `"${l}" shouts`);
    }
  });

  test('an overloaded day is described as a day, not as a mistake', () => {
    const over = groundLine([ACTIONS.find((a) => a.size === 'large'), ACTIONS.find((a) => a.size === 'medium')]);
    assert.match(over, /holds|more than/i);
    assert.doesNotMatch(over, /too ambitious|unrealistic|wrong|failed/i);
  });
});

describe('Groundwork: none of the three answers is a failure', () => {
  test('all three outcomes exist and are offered', () => {
    assert.deepEqual(Object.keys(KEPT_LABELS).sort(), ['did-not', 'happened', 'something-else']);
  });

  test('"something else did instead" is treated as a real outcome', () => {
    /* Behavioural activation is about the day having something chosen in it, not about
       compliance with a specific instruction. If this branch reads as a consolation prize
       the game has quietly become a to-do list with feelings. */
    const r = KEPT_REPLY['something-else'];
    assert.match(r, /counts/i);
    assert.doesNotMatch(r, /at least|never mind|do not worry|next time try/i);
  });

  test('a miss is answered as a fact about the size, never about the person', () => {
    const r = KEPT_REPLY['did-not'];
    assert.match(r, /too big|smaller|size/i, 'the reply does not point at the plan');
    assert.doesNotMatch(r, /\byou (failed|did not try|should have|need to)\b/i);
  });

  test('a hit is not congratulated into a streak', () => {
    assert.doesNotMatch(KEPT_REPLY.happened, /well done|great|proud|keep it up|streak/i);
  });

  test('the grading actually moves down after a miss, and only after a miss', () => {
    assert.equal(nextSize('large', 'did-not'), 'medium');
    assert.equal(nextSize('medium', 'did-not'), 'small');
    assert.equal(nextSize('small', 'did-not'), 'small', 'the first rung has no rung below it');
    for (const k of ['happened', 'something-else']) {
      assert.equal(nextSize('medium', k), 'medium');
    }
  });
});

describe('Ballast: the discounting is the game', () => {
  test('every belief has enough facts that genuinely bear on it', () => {
    /* A fact offered against a belief it has nothing to do with is what makes these
       exercises feel like a form, and it is also how the fallback in factsFor gets reached. */
    for (const b of BELIEFS) {
      const mine = FACTS.filter((f) => f.against.includes(b.id));
      assert.ok(mine.length >= 3, `"${b.text}" only has ${mine.length} facts against it`);
    }
  });

  test('factsFor never returns an empty screen and never repeats', () => {
    for (const b of BELIEFS) {
      const got = factsFor(b.id, seq(0.2, 0.8, 0.4, 0.6));
      assert.ok(got.length > 0 && got.length <= OFFERED);
      assert.equal(new Set(got.map((f) => f.id)).size, got.length);
    }
  });

  test('every fact is something the player did, not something they received', () => {
    /* A compliment or a piece of luck is not evidence against "I am useless" — it is
       evidence about somebody else. The log only works if the entries are actions. */
    for (const f of FACTS) {
      assert.match(f.text, /^You /, `"${f.text}" is not something they did`);
      assert.doesNotMatch(f.text, /\b(told you|said you were|thanked you|complimented)\b/i,
        `"${f.text}" is somebody else's opinion rather than an action`);
    }
  });

  test('every fact carries the sentence it would be thrown out with', () => {
    for (const f of FACTS) {
      assert.ok(DISCOUNTS[f.discount], `"${f.text}" has no discount, so there is nothing to play`);
    }
  });

  test('every discount has a reply, and every reply answers the discount', () => {
    /* NEVER PRAISE THE DEED. "Well done for replying to that message" hands the authority
       over what counts back to somebody outside the person, which is the exact thing this
       game exists to return to them. */
    for (const id of Object.keys(DISCOUNTS)) {
      const r = STRUCK[id];
      assert.ok(r && r.length > 80, `${id} has no real reply`);
      assert.doesNotMatch(r, /well done|good for you|proud of you|you should feel/i,
        `${id} praises the person instead of answering the discount`);
      assert.ok(!r.includes('!'), `${id} shouts`);
    }
  });

  test('nothing claims the belief has moved', () => {
    /* One session does not shift a global belief, and saying it has is the single most
       damaging sentence this game could produce. */
    const overclaim =
      /\b(you are not|that is not true|proves|disproves|see\?|belief is wrong|no longer)\b/i;
    const all = [
      ...Object.values(STRUCK),
      BALLAST_CLOSE,
      ballastLine(0, 3),
      ballastLine(1, 3),
      ballastLine(3, 3),
    ];
    for (const line of all) assert.doesNotMatch(line, overclaim, `overclaims: "${line}"`);
  });

  test('keeping nothing is a real outcome with something to say about it', () => {
    const none = ballastLine(0, 4);
    assert.ok(none.length > 60);
    assert.doesNotMatch(none, /\byou (failed|should|did not try)\b/i);
    assert.match(none, /filter|thrown out/i, 'it does not name what happened');
  });

  test('letting the discount stand is offered and is not punished', () => {
    /* A game whose only move is to disagree with yourself has replaced one voice telling you
       what to think with another. */
    const src = read('app/game/ballast.tsx');
    assert.match(src, /label="It stands"/, 'there is no way to leave a discount standing');
    assert.match(src, /onResolve\(false\)/);
  });
});

describe('both games are wired in and behave like the others', () => {
  test('the practice kinds survive a round trip through storage', () => {
    const union = read('types/index.ts').match(/export type PracticeKind =([\s\S]*?);/);
    const kinds = [...union[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    for (const k of ['groundwork', 'ballast']) assert.ok(kinds.includes(k));
    const accepted = read('lib/storage.ts').match(/const PRACTICE_KINDS[^=]*=\s*\[([\s\S]*?)\]/);
    const list = [...accepted[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    for (const k of kinds) assert.ok(list.includes(k), `"${k}" would be dropped on read`);
  });

  test('commitments survive a round trip too', () => {
    /* The second half of behavioural activation happens tomorrow. A game that forgets what
       it asked for only ever does the easy half. */
    const src = read('lib/storage.ts');
    assert.match(src, /commitments: rows\(p\.commitments/, 'commitments are dropped on read');
    assert.match(src, /commitments: \[\]/, 'there is no default for a fresh install');
  });

  test('both log a practice event and are reachable from Practice', () => {
    assert.match(read('app/game/groundwork.tsx'), /logPractice\('groundwork'\)/);
    assert.match(read('app/game/ballast.tsx'), /logPractice\('ballast'\)/);
    const practice = read('app/(tabs)/practice.tsx');
    assert.match(practice, /\/game\/groundwork/);
    assert.match(practice, /\/game\/ballast/);
  });

  test('both have a way out, and it is the same words as everywhere else', () => {
    for (const f of ['app/game/groundwork.tsx', 'app/game/ballast.tsx']) {
      const src = read(f);
      assert.match(src, /PASS_LABEL/, `${f} has no way out`);
      assert.match(src, /from '\.\.\/\.\.\/content\/toward\.ts'/,
        `${f} restates the exit wording instead of sharing it`);
    }
  });

  test('neither reaches for an error register', () => {
    for (const f of ['app/game/groundwork.tsx', 'app/game/ballast.tsx']) {
      const src = read(f);
      assert.doesNotMatch(src, /NotificationFeedbackType\.(Warning|Error)/, `${f} buzzes a correction`);
      assert.doesNotMatch(src, /c\.warn\b/, `${f} paints something in the warning colour`);
    }
  });

  test('neither puts a score on the ending', () => {
    for (const f of ['app/game/groundwork.tsx', 'app/game/ballast.tsx']) {
      const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.match(code, /figure=\{null\}/, `${f} has a figure on its ending`);
      assert.doesNotMatch(code, /figureUnit=["'`][^"'`]*%/, `${f} shows a percentage`);
    }
  });

  test('Groundwork asks about the last commitment before planning a new one', () => {
    /* Otherwise the game does the planning half twice and never finds out what happened,
       which is the half the evidence is actually about. */
    const src = read('app/game/groundwork.tsx');
    assert.match(src, /useState<Phase>\(open \? 'yesterday' : 'plan'\)/);
    assert.match(src, /commitments\.find\(\(x\) => !x\.kept\)/);
  });
});
