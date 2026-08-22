import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const names = await import('../content/names.ts');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* One name per thing.
 *
 * The app used to call the same activity three different things depending on which screen
 * you were on: "Ride out an urge" opened a screen titled "Urges" whose finish talked about
 * surfing; "Take a thought apart" opened "Write it out" and saved a "thought record".
 * Every individual word was fine. The effect was an app nobody could build a map of,
 * because the landmarks were renamed between glances.
 *
 * This test is what stops it happening again. It is a grep, and a grep is the right shape
 * here — the failure mode is somebody typing a perfectly reasonable synonym into one screen
 * without knowing what the other five call it. */

function screenFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      if (statSync(full).isDirectory()) walk(full);
      else if (full.endsWith('.tsx')) out.push(full);
    }
  };
  walk(join(ROOT, 'app'));
  walk(join(ROOT, 'components'));
  return out.map((f) => ({ path: f.replace(ROOT + '/', ''), src: readFileSync(f, 'utf8') }));
}

const FILES = screenFiles();

/* Terms retired from the interface, with what replaced each one.
 *
 * These are not banned from the codebase — `urge` is a fine variable name and the teaching
 * modules are allowed to name the clinical concept, because explaining it is their job.
 * They are banned from the strings a person reads on a control. */
const RETIRED = [
  ['urge surfing', 'Ride out an urge'],
  ['thought record', 'Take a thought apart'],
  ['behavioural experiment', 'Test a prediction'],
  ['behavioral experiment', 'Test a prediction'],
  ['SUDS', 'how hard the day was'],
  ['preoccupation', 'time spent thinking about how you look'],
  ['free tier', 'the free part'],
];

/* Only look at text a person actually reads: JSX text nodes and the string props that end
 * up on screen. Comments and identifiers are deliberately out of scope. */
function userFacingStrings(src) {
  const out = [];
  const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  for (const m of withoutComments.matchAll(/>\s*([^<>{}\n][^<>{}]{3,200}?)\s*</g)) {
    /* TypeScript generics look exactly like JSX brackets, so `useState<number | null>(null)`
       through to the next `<` gets captured as if it were prose. Rendered text never
       contains a semicolon or an equals sign; code between two angle brackets almost
       always does. */
    if (/[;=]/.test(m[1])) continue;
    out.push(m[1]);
  }
  for (const m of withoutComments.matchAll(
    /(?:label|title|sub|hint|placeholder|lowLabel|highLabel|note|eyebrow|headline|body|doneLabel|figureUnit|accessibilityLabel)\s*[=:]\s*["']([^"']{3,200})["']/g
  )) {
    out.push(m[1]);
  }
  return out;
}

describe('every thing in the app has exactly one name', () => {
  for (const [term, replacement] of RETIRED) {
    test(`no screen says "${term}"`, () => {
      for (const f of FILES) {
        for (const s of userFacingStrings(f.src)) {
          assert.ok(
            !s.toLowerCase().includes(term.toLowerCase()),
            `${f.path} shows "${term}" to the user. Use "${replacement}" — see content/names.ts.`
          );
        }
      }
    });
  }

  test('the names file covers every activity the app can log', () => {
    /* PracticeKind is what the store records. If a kind exists with no name beside it,
       something is being counted that the interface cannot say out loud. */
    const types = readFileSync(join(ROOT, 'types/index.ts'), 'utf8');
    const block = types.slice(types.indexOf('export type PracticeKind'));
    const kinds = [...block.slice(0, block.indexOf(';')).matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    const covered = {
      checkin: 'checkin', 'thought-record': 'thought', grounding: 'calm', mirror: 'mirror',
      urge: 'urge', experiment: 'experiment', 'hard-day': 'calm', curveball: 'curveball',
      toward: 'toward', groundwork: 'groundwork', ballast: 'ballast',
    };
    for (const k of kinds) {
      assert.ok(covered[k], `PracticeKind "${k}" has no entry in content/names.ts`);
      assert.ok(names.NAMES[covered[k]], `names.ts is missing "${covered[k]}"`);
    }
  });
});

describe('the names themselves are usable', () => {
  test('every title is a verb phrase a person would say out loud', () => {
    for (const [key, n] of Object.entries(names.NAMES)) {
      assert.ok(n.title.length <= 24, `${key} title is too long for a row: "${n.title}"`);
      assert.ok(!/[A-Z]{3,}/.test(n.title), `${key} title shouts: "${n.title}"`);
    }
  });

  test('singular and plural forms differ', () => {
    for (const [key, n] of Object.entries(names.NAMES)) {
      assert.notEqual(n.unit, n.unitPlural, `${key} has the same singular and plural`);
    }
  });

  test('countOf agrees on one', () => {
    assert.equal(names.countOf('checkin', 1), '1 check-in');
    assert.equal(names.countOf('checkin', 3), '3 check-ins');
  });
});

describe('the teaching modules do not refer to themselves by number', () => {
  test('no module cross-references another by "Module N" or "Phase N"', async () => {
    /* "From Module 10" and "you'll need it in Phase 4" are the app's filing system, not
       anything a reader recognises — and both silently become wrong the moment a module is
       renumbered or reordered, which is a thing that happens. Refer to a week, or to what
       the piece was about. */
    const modules = await import('../content/modules.ts');
    for (const m of modules.MODULES) {
      const text = [...m.body, m.takeaway, m.title].join(' ');
      assert.doesNotMatch(
        text,
        /\b(module|phase)\s+\d/i,
        `"${m.title}" refers to another piece by number. Name the week or the idea instead.`
      );
    }
  });
});

describe('every number on screen can be explained', () => {
  test('each explanation answers a question, in full sentences', () => {
    for (const [key, e] of Object.entries(names.EXPLAIN)) {
      assert.ok(e.q.endsWith('?'), `EXPLAIN.${key} does not ask a question: "${e.q}"`);
      assert.ok(e.a.length > 80, `EXPLAIN.${key} is too thin to be worth a tap`);
      assert.ok(/[.]$/.test(e.a), `EXPLAIN.${key} does not end in a full stop`);
    }
  });

  test('the hours explanation says what the comparison is against', () => {
    /* The single most-asked question about this app is "back from what?". If that answer
       ever stops naming the starting point, the headline figure is unexplained again. */
    assert.match(names.EXPLAIN.hours.a, /started/i);
  });

  test('no explanation makes a claim about how anybody looks', () => {
    const appearance = /you look (fine|good|great|okay|normal)|you are (beautiful|attractive)/i;
    for (const [key, e] of Object.entries(names.EXPLAIN)) {
      assert.doesNotMatch(`${e.q} ${e.a}`, appearance, `EXPLAIN.${key} evaluates appearance`);
    }
  });
});
