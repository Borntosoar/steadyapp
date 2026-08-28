import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, BREATHE, RESET, FLOAT, MODE_BY_NAME, modeByKey } from '../content/still.ts';
import { FEATURED_CALM } from '../content/survey.ts';
import {
  CYCLE_SECONDS, cyclesFor, actualSeconds, hasHold, resetStepAt, modeFromName, modeFromParam,
} from '../lib/still.ts';
import { ALWAYS_FREE_ROUTES } from '../lib/entitlement.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

/* Still.
 *
 * The first block is the one that matters most, because it is the bug that made this section
 * exist: the survey has always named one of three modes to every person who finishes it, and
 * for months none of the three was a place you could go. */

describe('every mode the survey promises is a mode that exists', () => {
  test('FEATURED_CALM only ever names something real', () => {
    /* THE ORIGINAL BUG. content/survey.ts maps each "when is it worst" answer to Breathe,
       Reset or Float, and app/onboarding/survey.tsx prints it verbatim to everybody:
       "Float — free, always, and never behind a week". A new answer added to that map with a
       name nothing implements would put a fourth invented mode on the same screen. */
    for (const [answer, name] of Object.entries(FEATURED_CALM)) {
      assert.ok(Object.prototype.hasOwnProperty.call(MODE_BY_NAME, name),
        `the survey answer "${answer}" promises a mode called "${name}", and no such mode `
        + `exists in content/still.ts. Every name FEATURED_CALM produces is printed to the `
        + `user on the screen where they decide whether to trust this app.`);
      const key = MODE_BY_NAME[name];
      assert.ok(MODES.some((m) => m.key === key), `"${name}" maps to a key with no mode`);
    }
  });

  test('and the mode is titled the same word the survey used', () => {
    /* Otherwise the survey says "Float" and the section calls it something else, which reads
       as the app having forgotten what it offered ninety seconds ago. */
    for (const [name, key] of Object.entries(MODE_BY_NAME)) {
      assert.equal(modeByKey(key).title, name,
        `the survey calls it "${name}" and the mode is titled "${modeByKey(key).title}"`);
    }
  });

  test('the survey still prints the promise, so this guard has something to protect', () => {
    /* If the line is ever deleted from the survey, the block above keeps passing while
       protecting nothing — the shape of stale guard this repository has already found a
       dozen times. */
    assert.match(src('app/onboarding/survey.tsx'), /plan\.calm/,
      'the survey no longer names a calm mode; if that is deliberate, this whole describe '
      + 'block is now guarding a promise nobody makes');
  });

  test('there are exactly three modes, which is what the brief asks for', () => {
    assert.equal(MODES.length, 3);
    assert.deepEqual(MODES.map((m) => m.key), ['breathe', 'reset', 'float']);
  });
});

describe('Breathe is a pace somebody can sit in, not 4-7-8', () => {
  /* THIS IS A SAFETY RULE, NOT A PREFERENCE. content/exercises.ts BREATH is 4-7-8 for four
     cycles and its own outro says "Four cycles is enough. More isn't better." Running that
     for the two-to-five minutes this mode offers would contradict the app's own safety copy
     inside the same build. */
  test('there is no hold phase', () => {
    assert.equal(hasHold(), false,
      'a hold has been added to Breathe. A long hold is a short intervention — see the outro '
      + 'in content/exercises.ts BREATH, which this would contradict.');
    assert.ok(!('hold' in BREATHE));
  });

  test('the exhale is longer than the inhale', () => {
    assert.ok(BREATHE.exhale > BREATHE.inhale,
      'the out breath is no longer the longer half, which is the whole mechanism');
  });

  test('the pace lands near six breaths a minute', () => {
    /* Resonant breathing is roughly 5–6 breaths per minute. Outside that band this stops
       being the sustainable pattern and becomes something else wearing its name. */
    const perMinute = 60 / CYCLE_SECONDS;
    assert.ok(perMinute >= 5 && perMinute <= 7, `${perMinute} breaths per minute is outside 5–7`);
  });

  test('the offered lengths are the two to five minutes the brief asks for', () => {
    assert.deepEqual([...BREATHE.minutes], [2, 3, 5]);
  });
});

describe('a session is never longer than the length somebody chose', () => {
  test('cycles are floored, never rounded up', () => {
    /* Rounding up makes a "two minute" session longer than two minutes, and it is longest
       for whoever picked the shortest option — the person least able to sit through it.
       ⚠ THIS MUST BE TESTED ON A LENGTH THAT DOES NOT DIVIDE EVENLY. The first version of
       this test looped over BREATHE.minutes and asserted `actualSeconds(m) <= m * 60`, which
       proved nothing: 2, 3 and 5 minutes are 120, 180 and 300 seconds, every one an exact
       multiple of the ten-second cycle, so floor and ceil returned the same number for all
       three. Mutating floor→ceil left the suite green. */
    assert.equal(cyclesFor(1.75), 10,
      '105 seconds is ten and a half cycles and must floor to ten, not round to eleven');
    assert.ok(actualSeconds(1.75) <= 1.75 * 60,
      'a session runs longer than the length it was asked for');

    for (const m of BREATHE.minutes) {
      assert.ok(actualSeconds(m) <= m * 60,
        `${m} minutes actually runs ${actualSeconds(m)}s, which is longer than asked for`);
    }
  });

  test('and never so short it is not the session at all', () => {
    for (const m of [...BREATHE.minutes, 1.75, 4.4]) {
      assert.ok(actualSeconds(m) >= m * 60 - CYCLE_SECONDS,
        `${m} minutes runs ${actualSeconds(m)}s, more than one cycle short`);
    }
  });

  test('a nonsense length still yields a runnable session rather than an empty one', () => {
    /* The tiny-but-positive case is the one the floor at 1 actually protects, and the first
       version of this test missed it: 0, -5, NaN and Infinity all hit the early return above
       `Math.max(1, ...)`, so mutating that floor to 0 left the suite green. */
    assert.ok(cyclesFor(0.05) >= 1,
      'three seconds produced a zero-cycle breathing exercise — a screen that ends as it opens');
    for (const bad of [0, -5, NaN, Infinity]) {
      assert.ok(cyclesFor(bad) >= 1, `${bad} produced a zero-cycle breathing exercise`);
    }
  });
});

describe('Reset says what it is and never why it works', () => {
  /* docs/DIRECTION.md §9.2: the NSDR dopamine claim traces to an n=8 uncontrolled 2002 study
     that never measured what it is cited for. §9.3: NSDR and yoga nidra stay as PRACTICES and
     every mechanism claim attached to them in the brief comes out. */
  const CLAIMS = /dopamine|neurotransmitter|Stanford|Huberman|rewire|reset your brain|restores?\s+your\s+\w+\s+levels/i;

  test('no mechanism claim appears anywhere in the Still copy or screen', () => {
    for (const rel of ['content/still.ts', 'lib/still.ts', 'app/still.tsx']) {
      assert.doesNotMatch(stripComments(src(rel)), CLAIMS,
        `${rel} makes a mechanism claim about NSDR. docs/DIRECTION.md §9.2 explains why the `
        + `practice stays and the claim does not.`);
    }
  });

  test('the script is positioned by fraction, so both lengths run one script', () => {
    /* Two scripts for ten and twenty minutes would be two things to edit and would drift. */
    for (const s of RESET.steps) {
      assert.ok(typeof s.at === 'number' && s.at >= 0 && s.at <= 1,
        `a Reset step is positioned at ${s.at}, which is not a fraction of the session`);
    }
  });

  test('the script is in order and starts at the beginning', () => {
    const ats = RESET.steps.map((s) => s.at);
    assert.deepEqual(ats, [...ats].sort((a, b) => a - b), 'the Reset steps are out of order');
    assert.equal(ats[0], 0, 'the script does not start at the start');
  });

  test('both lengths reach the last line', () => {
    for (const m of RESET.minutes) {
      const total = m * 60;
      const last = RESET.steps[RESET.steps.length - 1].text;
      assert.equal(resetStepAt(total - 1, total), last,
        `a ${m}-minute Reset never reaches its final line`);
    }
  });

  test('it opens on nothing rather than on an instruction', () => {
    /* Before the first step there is no line. A body scan that opens mid-sentence is a
       screen shouting at somebody who has just lain down. */
    assert.equal(resetStepAt(-1, 600), null);
  });

  test('junk timings return null rather than a wrong line', () => {
    for (const [e, t] of [[NaN, 600], [10, 0], [10, NaN], [10, -1]]) {
      assert.equal(resetStepAt(e, t), null, `resetStepAt(${e}, ${t}) did not return null`);
    }
  });
});

describe('Float gets out of the way', () => {
  test('it has no script and no timer', () => {
    assert.ok(!('steps' in FLOAT), 'Float has gained a script');
    assert.ok(!('minutes' in FLOAT) && !('totalSeconds' in FLOAT), 'Float has gained a length');
  });

  test('the screen shows no elapsed time', () => {
    /* A clock turns an open-ended session into something somebody can be behind on, which is
       the opposite of what this mode is. */
    const float = src('app/still.tsx').slice(src('app/still.tsx').indexOf('function FloatMode'));
    assert.doesNotMatch(stripComments(float), /elapsed|setInterval|Date\.now/,
      'Float is counting something. It is meant to count nothing.');
  });

  test('but leaving is always visible', () => {
    const float = src('app/still.tsx').slice(src('app/still.tsx').indexOf('function FloatMode'));
    assert.match(float, /accessibilityLabel="Leave"/,
      'Float has no visible way out, which makes leaving a puzzle');
  });
});

describe('Still is free and does not gate', () => {
  test('the route is on the always-free list', () => {
    assert.ok(ALWAYS_FREE_ROUTES.includes('/still'),
      'Still is gateable. The survey promises one of its modes by name to everybody.');
  });

  test('the screen consults no billing state', () => {
    const s = src('app/still.tsx');
    for (const term of ['entitled', 'paywall', 'useEntitlement', 'isEntitled', 'Anneal+']) {
      assert.ok(!s.includes(term), `app/still.tsx references ${term}`);
    }
  });

  test('nothing here is scored, logged as practice, or completable', () => {
    /* A completion mark on a meditation is the app asking to be thanked, and it makes a
       section whose point is that nothing is asked into one more thing to keep up. */
    const s = stripComments(src('app/still.tsx'));
    for (const term of ['recordPractice', 'registerPractice', 'streak', 'CheckMark', 'momentActed']) {
      assert.ok(!s.includes(term), `app/still.tsx uses ${term} — Still must not be scored`);
    }
  });
});

describe('Calm down is not absorbed into Still', () => {
  /* SAFETY.md §4 and __tests__/safety.test.mjs both name app/grounding.tsx. Still is the
     longer thing beside it, not a replacement, and folding one into the other would move the
     free-forever guarantee onto a file the safety suite does not grep. */
  test('grounding still offers its four short tools and the hard-day path', () => {
    /* Each tool needs BOTH an entry somebody can tap and a branch that renders it. The first
       version grepped the file for `'widen'` and passed while the dispatch was broken, because
       the name also appears in the menu list, in a type and in a comment — four times in all.
       A tool present in the menu with no handler is a row that does nothing. */
    const g = src('app/grounding.tsx');

    /* `values` is the dispatcher's fallthrough — `return <Values …>` with no `tool ===` test —
       so it is reachable without a branch of its own. Named here rather than quietly excused,
       so that if the fallthrough ever changes to something else this exception is the thing
       that has to be edited. */
    const RENDERED_BY_FALLTHROUGH = new Set(['values']);
    assert.match(g, /return <Values\b/, 'the Calm down fallthrough no longer renders Values');

    for (const tool of ['breath', 'senses', 'widen', 'values']) {
      assert.match(g, new RegExp(`k: '${tool}'`),
        `app/grounding.tsx no longer offers ${tool} in the Calm down menu`);
      if (RENDERED_BY_FALLTHROUGH.has(tool)) continue;
      assert.match(g, new RegExp(`tool === '${tool}'`),
        `app/grounding.tsx menu offers ${tool} but nothing renders it — a row that does nothing`);
    }
    assert.match(g, /onPick\('hardday'\)/, 'the hard-day path is no longer reachable');
    assert.match(g, /tool === 'hardday'/, 'the hard-day path is offered but never rendered');
  });

  test('and 4-7-8 stays where it was', () => {
    const ex = src('content/exercises.ts');
    assert.match(ex, /hold: 7/, 'BREATH is no longer 4-7-8, which Calm down depends on');
  });
});

describe('a mode name from a stale link lands somewhere calm', () => {
  test('an unknown name falls to Breathe rather than throwing', () => {
    for (const bad of ['Nonsense', '', null, undefined, 'constructor', '__proto__']) {
      assert.equal(modeFromName(bad), 'breathe', `modeFromName(${String(bad)}) misbehaved`);
    }
  });

  test('a known name resolves', () => {
    assert.equal(modeFromName('Float'), 'float');
    assert.equal(modeFromName('Reset'), 'reset');
  });

  test('a query param is validated against the closed set', () => {
    assert.equal(modeFromParam('float'), 'float');
    for (const bad of ['Float', 'sleep', '', null, undefined, '__proto__']) {
      assert.equal(modeFromParam(bad), null, `modeFromParam(${String(bad)}) let something through`);
    }
  });
});
