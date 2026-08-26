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
const { practiceTarget, recordPracticeDay } = await import('../lib/protocol.ts');

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

describe('onboarding stores the two answers it says it uses', () => {
  /* Step five reads: "Two answers, both of them yours, and both get used. The first sets your
     week. The second is what you will see on the days it is hard to start."
     Neither was stored. `completeOnboarding` took a baseline and a name; `days` and `wantBack`
     were local state that went out of scope on navigation. "The first sets your week" was
     false twice over — PRACTICE_DAYS_PER_WEEK was a hard 4, so picking "Two days a week" left
     somebody held to double what they said they could manage, on a screen that had just told
     them to answer for a bad week. */

  const onboarding = read('app/onboarding/index.tsx');

  test('the flow passes both answers to the store', () => {
    assert.match(onboarding, /completeOnboarding\([\s\S]{0,700}?practiceDaysPerWeek/,
      'onboarding still drops the practice-days answer on the floor');
    assert.match(onboarding, /completeOnboarding\([\s\S]{0,700}?wantBack/,
      'onboarding still drops the "what would you do with it" answer');
  });

  test('the store writes them onto the profile', () => {
    const store = read('store/useStore.ts');
    /* The IMPLEMENTATION, not the interface. `completeOnboarding: (` matches the type
       declaration first, which names the fields whether or not anything writes them — so this
       guard passed with the persistence deleted until a mutation proved it. */
    const at = store.indexOf('completeOnboarding: (baseline, firstName, commitment) => {');
    assert.ok(at > 0, 'completeOnboarding no longer takes the commitment answers');
    const body = store.slice(at, store.indexOf('\n  },', at));
    assert.match(body, /practiceDaysPerWeek/, 'completeOnboarding does not persist the practice target');
    assert.match(body, /wantBack/, 'completeOnboarding does not persist what they want back');
  });

  test('the practice target is what the week actually advances on', () => {
    /* The claim is "the first sets your week", so the number has to reach the two functions
       that decide when a week is done. */
    const protocol = read('lib/protocol.ts');
    assert.match(protocol, /export function practiceTarget/, 'there is no per-person target');
    assert.match(protocol, /recordPracticeDay\([^)]*perWeek/, 'advancing a week ignores the answer');
    assert.match(read('store/useStore.ts'), /recordPracticeDay\([\s\S]{0,120}?practiceDaysPerWeek/,
      'the store advances the week without passing the target');
  });

  test('a corrupt target cannot advance the protocol on an empty week', () => {
    /* It arrives from stored JSON. A 0 would make `done >= required` true immediately. */
    for (const [input, want] of [[0, 1], [-4, 1], [99, 7], [2.4, 2], [NaN, 4], [undefined, 4]]) {
      assert.equal(practiceTarget(input), want, `practiceTarget(${input}) should clamp to ${want}`);
    }
  });

  test('somebody who answered two days completes a week in two', () => {
    let state = { currentWeek: 1, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] };
    state = recordPracticeDay(state, '2026-08-24', 2);
    assert.equal(state.currentWeek, 1, 'one day should not finish a two-day week');
    state = recordPracticeDay(state, '2026-08-25', 2);
    assert.equal(state.currentWeek, 2, 'two days did not complete a two-day week');
    assert.deepEqual(state.completedWeeks, [1]);
  });

  test('and the default is unchanged for everybody who onboarded before this', () => {
    let state = { currentWeek: 1, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] };
    for (const d of ['2026-08-21', '2026-08-22', '2026-08-23']) state = recordPracticeDay(state, d);
    assert.equal(state.currentWeek, 1, 'three days completed a week with no answer stored');
    state = recordPracticeDay(state, '2026-08-24');
    assert.equal(state.currentWeek, 2, 'the four-day default no longer applies');
  });

  test('what they want back is shown on the day it was promised for', () => {
    /* "what you will see on the days it is hard to start" — that is the hard-day screen. */
    const grounding = read('app/grounding.tsx');
    assert.match(grounding, /s\.profile\.wantBack/, 'it is not read from the profile');
    /* The RENDER, not just the mention. Reading it into a variable and never drawing it is
       the state this whole section exists to prevent, and greping for the identifier alone
       passed with the render replaced by `{false ? (` — proved by mutation. */
    assert.match(grounding, /\{wantBack \? \(/,
      'wantBack is read but never conditionally rendered on the hard-day screen');
    assert.match(grounding, /\{wantBack\}/, 'the value itself is never drawn');
  });

  test('it is quoted, never scored', () => {
    /* SAFETY.md tone: the app does not tell somebody whether they are living up to their own
       sentence. It hands it back and says nothing about it. */
    const grounding = read('app/grounding.tsx');
    const near = grounding.slice(Math.max(0, grounding.indexOf('{wantBack ?') - 700),
                                 grounding.indexOf('{wantBack ?') + 700);
    assert.doesNotMatch(near, /still|yet|closer|progress|on track|remember why/i,
      'the hard-day screen editorialises about what they wanted back');
  });
});

describe('the numbers in the store listing and the paywall match the code', () => {
  /* All four of these were found by sweeping user-facing strings against the data behind
     them, and all four are the same shape as the Learn header: a claim a reader or a reviewer
     can check, that nothing was holding to the thing it describes. */

  test('the listing counts countries, not regions', () => {
    /* SUPPORT_REGIONS has 31 entries, but the 31st is key 'other' / "Somewhere else", which
       IS the international directory. The listing said "31 countries and a verified
       international directory", counting the directory twice. */
    const support = readFileSync(join(ROOT, 'constants/support.ts'), 'utf8');
    const keys = [...support.matchAll(/^\s*key:\s*'([^']+)'/gm)].map((m) => m[1]);
    const countries = keys.filter((k) => k !== 'other').length;
    assert.ok(countries > 20, `only counted ${countries} regions — has the scan broken?`);
    const listing = readFileSync(join(ROOT, 'fastlane/metadata/en-US/description.txt'), 'utf8');
    assert.match(listing, new RegExp(`Crisis lines for ${countries} countries`),
      `there are ${countries} countries plus a directory, and the listing says something else`);
  });

  test('the release notes do not sell a cadence the app does not have', () => {
    /* "Twelve weeks, one practice a week" — the same claim the Learn header had to drop.
       PRACTICE_DAYS_PER_WEEK is 4, and the modules are not one a week either. */
    const notes = readFileSync(join(ROOT, 'fastlane/metadata/en-US/release_notes.txt'), 'utf8');
    assert.doesNotMatch(notes, /one practice a week/i,
      'the release notes claim one practice a week; the protocol asks for four days');
  });

  test('nothing claims cancelling is fewer taps than subscribing', () => {
    /* Subscribing is one tap — yearly is pre-selected and the button is the whole flow.
       Cancelling on iOS is six screens deep in Settings. It was a claim about money, on the
       screen asking for the money, and no code in this repository can make it true. */
    /* Comments stripped first. Both files now carry a note explaining what the line used to
       say, and a guard that fires on its own explanation is a guard people delete. */
    const strip = (x) => x.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, '');
    for (const rel of ['app/paywall.tsx', 'content/copy.ts']) {
      assert.doesNotMatch(strip(readFileSync(join(ROOT, rel), 'utf8')),
        /fewer taps than (it took to|signing up)/i,
        `${rel} claims cancelling takes fewer taps than subscribing`);
    }
  });

  test('every statement of the trial-reminder window matches when it fires', () => {
    /* lib/moments.ts fires on `left <= 2`. The user-facing string said two days and was
       right; three separate code comments said three days, which is how the string gets
       "corrected" to the wrong number by the next person to touch it. */
    const moments = readFileSync(join(ROOT, 'lib/moments.ts'), 'utf8');
    const window = moments.match(/left <= (\d+) && left >= 0/);
    assert.ok(window, 'the trial-ending window is no longer readable by this test');
    const days = Number(window[1]);
    const WORD = ['zero', 'one', 'two', 'three', 'four'];
    for (const rel of ['app/paywall.tsx', 'content/copy.ts', 'components/MomentCard.tsx']) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      for (const [, said] of src.matchAll(/last (\w+) days/gi)) {
        assert.equal(said.toLowerCase(), WORD[days],
          `${rel} says the reminder covers the last ${said} days; it fires on the last ${WORD[days]}`);
      }
    }
  });

  test('the reminder says where it actually appears', () => {
    /* It said "a reminder here", on the paywall. MomentCard renders on Today. */
    const paywall = readFileSync(join(ROOT, 'app/paywall.tsx'), 'utf8');
    assert.doesNotMatch(paywall, /a reminder here in the last/i,
      'the paywall says the trial reminder appears on the paywall; it appears on Today');
  });
});
