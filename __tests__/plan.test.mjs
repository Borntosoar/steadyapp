import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const { PLAN_SECTIONS } = await import('../types/index.ts');
const { PLAN_SECTION_COPY, PLAN_INTRO } = await import('../content/exercises.ts');
const { NAMES } = await import('../content/names.ts');
const { MODULES } = await import('../content/modules.ts');
const { normalise, emptyState, exportText } = await import('../lib/storage.ts');

/* The plan.
 *
 * This is the largest thing the app claimed to have and did not. Six places sold it —
 * NAMES.plan.title "Write your plan", two module action buttons, the Progress backup copy,
 * the delete confirmation, and the App Store description — while `setRelapsePlan` had zero
 * call sites and no screen existed. The two action buttons navigated to the journal and to
 * another article.
 *
 * These tests hold the three joins that made it false: the copy to the data, the data to the
 * screen, and the screen to the routes that claim to reach it. */

describe('the plan has as many sections as everything says it has', () => {
  test('six, in the type, the copy and the module', () => {
    assert.equal(PLAN_SECTIONS.length, 6);
    assert.equal(PLAN_SECTION_COPY.length, PLAN_SECTIONS.length,
      'the section list and the section copy have drifted apart');
  });

  test('the copy is in the same order as the type, and covers it exactly', () => {
    assert.deepEqual(PLAN_SECTION_COPY.map((s) => s.key), [...PLAN_SECTIONS]);
  });

  test('every section has a prompt, a placeholder and guidance', () => {
    for (const s of PLAN_SECTION_COPY) {
      for (const field of ['title', 'prompt', 'placeholder', 'help']) {
        assert.ok(s[field] && s[field].trim().length > 3,
          `section "${s.key}" has no usable ${field}`);
      }
      assert.ok(s.lines >= 4, `section "${s.key}" opens at ${s.lines} lines, which looks like an afterthought`);
    }
  });

  test('the row subtitle states the number of sections there are', () => {
    /* NAMES.plan.sub said "Six sections" while the type had four fields. Derived now. */
    const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    assert.match(NAMES.plan.sub, new RegExp(`^${WORD[PLAN_SECTIONS.length]} sections`, 'i'),
      `there are ${PLAN_SECTIONS.length} sections and the row says "${NAMES.plan.sub}"`);
  });

  test('the module that teaches it names the same number', () => {
    const mod = MODULES.find((m) => m.slug === 'your-own-plan');
    assert.ok(mod, 'the plan module has been renamed or removed');
    const prose = [...mod.body, mod.takeaway, ...(mod.sections ?? []).map((s) => s.label)].join(' ');
    assert.match(prose, /six sections/i,
      'the module no longer says six sections, and six is what the app implements');
    /* And it numbers them 1..6 in the body, which is where the field titles come from. */
    for (let n = 1; n <= PLAN_SECTIONS.length; n += 1) {
      assert.ok(mod.body.some((b) => b.startsWith(`**${n}.`)),
        `the module body has no section ${n}, but the screen renders one`);
    }
  });

  test('the screen headings match the module headings word for word', () => {
    /* Somebody who has just read "Your fire exit" should recognise every field. A screen that
       renames the sections makes the reading feel like it was about something else. */
    const mod = MODULES.find((m) => m.slug === 'your-own-plan');
    for (const s of PLAN_SECTION_COPY) {
      const inModule = mod.body.some((b) => b.toLowerCase().includes(s.title.toLowerCase()));
      assert.ok(inModule, `the screen says "${s.title}" and the module never uses that heading`);
    }
  });
});

describe('the plan is actually reachable and actually written', () => {
  test('setRelapsePlan has a call site', () => {
    /* The whole defect in one assertion. It had none. */
    const callers = ['app', 'components']
      .flatMap((d) => walk(join(ROOT, d)))
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => /setRelapsePlan\s*\(/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1));
    assert.ok(callers.length > 0,
      'nothing writes a relapse plan, so every promise the app makes about one is false');
  });

  test('the screen exists and writes every section', () => {
    const src = read('app/plan.tsx');
    for (const k of PLAN_SECTIONS) {
      assert.ok(src.includes(k) || src.includes('PLAN_SECTION_COPY'),
        `app/plan.tsx never handles the "${k}" section`);
    }
    assert.match(src, /setRelapsePlan\(/, 'the plan screen never saves');
  });

  test('every button labelled "Write your plan" goes to the plan', () => {
    /* Both module actions used to point elsewhere: one at /journal, which offers a thought
       record and an experiment, and one at another article. */
    for (const m of MODULES) {
      if (m.action?.thing !== 'plan') continue;
      assert.equal(m.action.route, '/plan',
        `module "${m.slug}" has a button reading "${NAMES.plan.title}" pointing at ${m.action.route}`);
    }
  });

  test('Practice offers it too, so it can be revised without re-opening the article', () => {
    assert.match(read('app/(tabs)/practice.tsx'), /route: '\/plan'/,
      'the plan is only reachable from the module that told you to write it');
  });
});

describe('what is written survives storage and comes out in the export', () => {
  const filled = () => {
    const s = emptyState();
    s.protocol.relapsePlan = {
      earlyWarnings: 'Checking after I leave.',
      triggers: 'Short sleep.',
      firstMoves: '1. Check in.\n2. Breathe.\n3. Text Dani.',
      notDoing: 'Cancel plans.',
      whoToTell: 'Dani, by text.',
      myLine: 'If I miss work two days running.',
      updatedAt: '2026-08-26T00:00:00.000Z',
    };
    return s;
  };

  test('normalise keeps all six', () => {
    const out = normalise(filled());
    for (const k of PLAN_SECTIONS) {
      assert.ok(out.protocol.relapsePlan[k], `normalise dropped "${k}"`);
    }
  });

  test('the export contains every section a person wrote', () => {
    const text = exportText(filled());
    for (const s of PLAN_SECTION_COPY) {
      assert.ok(text.includes(s.title), `the export omits "${s.title}"`);
    }
    assert.ok(text.includes('Text Dani.'), 'the export lost a line inside a multi-line section');
  });

  test('an old four-field plan is carried across rather than discarded', () => {
    /* The shape that shipped before this screen existed. Nothing wrote one, so in practice
       this migrates nobody — but a type that shipped is a shape an imported backup can carry,
       and silently discarding somebody's relapse plan is not a thing to do on a guess. */
    const out = normalise({
      ...emptyState(),
      protocol: {
        currentWeek: 11, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [],
        relapsePlan: {
          earlyWarnings: 'Old warnings.', whatHelps: 'Old help.',
          whoToTell: 'Old person.', firstStep: 'Old step.',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });
    const p = out.protocol.relapsePlan;
    assert.ok(p, 'the old shape was dropped entirely');
    assert.equal(p.earlyWarnings, 'Old warnings.');
    assert.equal(p.whoToTell, 'Old person.');
    assert.match(p.firstMoves, /Old help\./, 'whatHelps was discarded instead of carried into firstMoves');
    assert.match(p.firstMoves, /Old step\./, 'firstStep was discarded');
  });

  test('an empty plan is not stored as a plan', () => {
    const out = normalise(emptyState());
    assert.equal(out.protocol.relapsePlan, undefined,
      'an untouched plan is being persisted, which makes "you have a plan" true for everybody');
  });
});

describe('the plan does not put a billing state in front of a crisis line', () => {
  test('it points at Support, and never at the paywall', () => {
    /* SAFETY.md §4. The last section asks somebody to name the point at which this app stops
       being the right tool — which makes it the one writing surface where a person may be
       sitting with exactly that thought. */
    const src = read('app/plan.tsx');
    assert.match(src, /'\/support'/, 'the plan screen offers no route to crisis support');
    assert.doesNotMatch(src, /paywall|isGated|weekGated|effectiveWeek/,
      'the plan screen consults a billing state');
  });
});

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
