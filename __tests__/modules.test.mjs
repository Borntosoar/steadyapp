import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const { MODULES, moduleBySlug, freeModules } = await import('../content/modules.ts');
const { parseInline } = await import('../lib/inline.ts');
const { MIRROR_UNLOCK_WEEK, phaseForWeek } = await import('../lib/protocol.ts');

const words = (m) => [...m.body, m.takeaway].join(' ').split(/\s+/).filter(Boolean).length;

describe('module set structure', () => {
  test('there are exactly 12 modules, on the intended uneven cadence', () => {
    assert.equal(MODULES.length, 12);
    // Week 1 carries three modules (the free tier); weeks 4-12 carry one each. Weeks 2
    // and 3 are consolidation — the protocol runs them without new reading.
    assert.deepEqual(
      MODULES.map((m) => m.week),
      [1, 1, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
    assert.ok(MODULES.every((m) => m.week >= 1 && m.week <= 12));
  });

  test('the Learn header states that cadence, and states it correctly', () => {
    /* The header said "Twelve short reads, one a week" while the three cards directly below
       it all read "Week 1" — a claim the reader can disprove by looking at the same screen.
       The numbers here are derived from MODULES rather than typed, so changing the module
       set fails this test instead of quietly making the sentence false again. */
    const src = readFileSync(join(ROOT, 'app/(tabs)/learn.tsx'), 'utf8');
    const header = src.replace(/\/\*[\s\S]*?\*\//g, '').match(/Twelve short reads[^<]*/)?.[0];
    assert.ok(header, 'the Learn header sentence has moved or been reworded past recognition');
    const flat = header.replace(/\s+/g, ' ').replace(/&apos;/g, "'");

    const firstWeek = MODULES.filter((m) => m.week === MODULES[0].week).length;
    const resumesAt = MODULES.find((m) => m.week !== MODULES[0].week).week;
    const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
                 'eight', 'nine', 'ten', 'eleven', 'twelve'];

    assert.match(flat, new RegExp(`^${NUM[MODULES.length]} short reads`, 'i'),
      `the header states a total that is not ${MODULES.length}`);
    assert.match(flat, new RegExp(`\\b${NUM[firstWeek]} to start\\b`, 'i'),
      `week one carries ${firstWeek} reads and the header does not say so`);
    assert.match(flat, new RegExp(`from week ${NUM[resumesAt]}\\b`, 'i'),
      `reading resumes at week ${resumesAt} and the header does not say so`);

    /* And the specific false version must not come back. Weeks 2 and 3 carry no reading by
       design, so an unqualified "one a week" is wrong however it is phrased. */
    assert.doesNotMatch(flat, /reads, one a week/i,
      'the header claims one read a week again — weeks 2 and 3 have none');
  });

  test('modules are ordered so "next module" walks forward', () => {
    for (let i = 1; i < MODULES.length; i++) {
      assert.ok(MODULES[i].week >= MODULES[i - 1].week, `out of order at index ${i}`);
    }
  });

  test('slugs are unique and url-safe', () => {
    const slugs = MODULES.map((m) => m.slug);
    assert.equal(new Set(slugs).size, 12);
    for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/, `bad slug: ${s}`);
  });

  test('exactly week one is free — the paywall starts at week 2', () => {
    const free = freeModules();
    assert.equal(free.length, 3);
    assert.ok(free.every((m) => m.week === 1));
  });

  test('phases line up with the protocol banding', () => {
    const expected = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };
    for (const m of MODULES) {
      assert.ok(expected[m.phase].includes(m.week), `week ${m.week} in phase ${m.phase}`);
    }
  });

  test('lookup by slug works for every module', () => {
    for (const m of MODULES) assert.equal(moduleBySlug(m.slug)?.title, m.title);
    assert.equal(moduleBySlug('does-not-exist'), undefined);
  });
});

describe('content is real, not filler', () => {
  test('every module is substantial prose', () => {
    for (const m of MODULES) {
      const n = words(m);
      assert.ok(n >= 380, `${m.slug} is only ${n} words — too thin`);
      assert.ok(m.body.length >= 6, `${m.slug} has only ${m.body.length} paragraphs`);
    }
  });

  test('no lorem ipsum or placeholder text anywhere', () => {
    const junk = /lorem ipsum|placeholder|TODO|TBD|coming soon|FIXME|\[insert/i;
    for (const m of MODULES) {
      assert.doesNotMatch(m.title, junk, m.slug);
      assert.doesNotMatch(m.takeaway, junk, m.slug);
      for (const p of m.body) assert.doesNotMatch(p, junk, `${m.slug}: ${p.slice(0, 60)}`);
    }
  });

  test('every module ends with an actionable takeaway', () => {
    for (const m of MODULES) {
      assert.ok(m.takeaway.length > 25, `${m.slug} takeaway too short`);
    }
  });
});

describe('editorial safety rules', () => {
  const all = MODULES.flatMap((m) => [m.title, m.takeaway, ...m.body]);

  test('no treatment or cure claims', () => {
    // The app is a self-help tool. Claiming it treats or cures anything is both false and
    // a regulatory problem, so it is asserted rather than trusted to review.
    const claims = /\b(this app|anneal) (treats|cures|will cure|will treat|heals)\b|\bguaranteed to (fix|cure|work)\b|\bclinically proven\b/i;
    for (const s of all) assert.doesNotMatch(s, claims, `treatment claim: "${s.slice(0, 80)}"`);
  });

  test('no appearance advice', () => {
    const advice = /\byou (should|could) (try|consider) (losing|gaining|changing your)\b|\bto look better\b|\bimprove your appearance\b|\bmore attractive if you\b/i;
    for (const s of all) assert.doesNotMatch(s, advice, `appearance advice: "${s.slice(0, 80)}"`);
  });

  test('no numbers about bodies', () => {
    // Weights, measurements, sizes, BMI. Numbers about hours and studies are fine and
    // are the point; numbers about bodies are the thing that must never appear.
    const bodyNumbers = /\b\d+\s?(kg|lbs?|pounds|stone|cm|inches|inch)\b|\bBMI\b|\bsize \d+\b|\b\d+\s?calories\b/i;
    for (const s of all) assert.doesNotMatch(s, bodyNumbers, `body number: "${s.slice(0, 80)}"`);
  });

  test('written in second person', () => {
    for (const m of MODULES) {
      const joined = m.body.join(' ');
      assert.match(joined, /\byou\b|\byour\b/i, `${m.slug} never addresses the reader`);
    }
  });

  test('the module that must mention crisis support does so', () => {
    const last = moduleBySlug('when-self-help-isnt-enough');
    const joined = [last.title, ...last.body].join(' ');
    assert.match(joined, /crisis line|emergency service|Support tab/i);
    assert.match(joined, /harming yourself|hurting yourself/i);
  });
});

describe('inline emphasis parser', () => {
  test('plain text passes through untouched', () => {
    assert.deepEqual(parseInline('hello there'), [{ text: 'hello there' }]);
  });

  test('parses bold', () => {
    assert.deepEqual(parseInline('a **b** c'), [
      { text: 'a ' },
      { text: 'b', bold: true },
      { text: ' c' },
    ]);
  });

  test('parses italic', () => {
    assert.deepEqual(parseInline('a *b* c'), [
      { text: 'a ' },
      { text: 'b', italic: true },
      { text: ' c' },
    ]);
  });

  test('bold wins over italic so ** is never read as two italics', () => {
    const toks = parseInline('**inspection creates flaws.**');
    assert.equal(toks.length, 1);
    assert.equal(toks[0].bold, true);
    assert.equal(toks[0].text, 'inspection creates flaws.');
  });

  test('an unmatched marker renders literally rather than eating the paragraph', () => {
    const toks = parseInline('a * b');
    assert.equal(toks.map((t) => t.text).join(''), 'a * b');
  });

  test('round-trips every paragraph in the real content without losing characters', () => {
    for (const m of MODULES) {
      for (const p of [...m.body, m.takeaway]) {
        const rebuilt = parseInline(p).map((t) => t.text).join('');
        const stripped = p.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
        assert.equal(rebuilt, stripped, `lost text in ${m.slug}`);
      }
    }
  });
});

/* ---------- reading experience ----------
 *
 * The fields below drive how a module renders. They are pointers into `body`, which means
 * every one of them can silently go stale when a paragraph is added or removed — a
 * pull-quote drifts onto the wrong paragraph, a section header lands mid-argument. None of
 * that throws at runtime; it just quietly renders wrong. So it is tested. */

describe('the reading experience data stays in step with the prose', () => {
  test('every module has a kicker that fits a list row', () => {
    for (const m of MODULES) {
      assert.ok(m.kicker, `${m.title} has no kicker`);
      /* 68 is what fits on two lines in a Learn row at iPhone width. Longer than that and
         the row truncates mid-sentence, which is worse than a shorter line. */
      assert.ok(m.kicker.length <= 68, `${m.title} kicker is ${m.kicker.length} chars and will truncate: "${m.kicker}"`);
      assert.ok(!m.kicker.includes('!'), `${m.title} kicker shouts`);
    }
  });

  test('every pull-quote is verbatim from its own module', () => {
    /* The point of pinning it to a substring: a pull-quote is emphasis, not authorship.
       If somebody can type new copy into this field it becomes a second, unreviewed voice
       in the middle of a reviewed piece. */
    for (const m of MODULES) {
      if (!m.pullquote) continue;
      const plain = m.body.join(' ').replace(/\*/g, '');
      assert.ok(
        plain.includes(m.pullquote.text),
        `${m.title}: pull-quote is not a sentence from the module — "${m.pullquote.text}"`
      );
      assert.ok(
        m.pullquote.text.length <= 130,
        `${m.title}: pull-quote is ${m.pullquote.text.length} chars. A five-line pull-quote is a paragraph in a bigger font.`
      );
      assert.ok(
        m.pullquote.after >= 0 && m.pullquote.after < m.body.length,
        `${m.title}: pull-quote points at paragraph ${m.pullquote.after}, which does not exist`
      );
    }
  });

  test('section landmarks point at real paragraphs, and never at the first', () => {
    for (const m of MODULES) {
      for (const sec of m.sections ?? []) {
        assert.ok(sec.at > 0, `${m.title}: a section at index 0 duplicates the title`);
        assert.ok(sec.at < m.body.length, `${m.title}: section "${sec.label}" points past the end`);
      }
    }
  });

  test('no takeaway sends anybody to the paywall', () => {
    /* A module is teaching material. Ending one on a sales route would make the whole
       twelve-week read feel like a funnel, which is the thing this product is not. */
    for (const m of MODULES) {
      if (!m.action) continue;
      assert.doesNotMatch(m.action.route, /paywall/, `${m.title} sells at the end of a read`);
    }
  });

  test('no takeaway opens an exercise that is still locked that week', () => {
    /* A button that routes somewhere the reader cannot go yet is worse than no button. */
    for (const m of MODULES) {
      if (!m.action) continue;
      if (m.action.route.startsWith('/mirror')) {
        assert.ok(
          m.week >= MIRROR_UNLOCK_WEEK,
          `${m.title} (week ${m.week}) opens mirror practice, which unlocks in week ${MIRROR_UNLOCK_WEEK}`
        );
      }
      if (m.action.thing === 'experiment') {
        assert.ok(
          phaseForWeek(m.week).id >= 3,
          `${m.title} (week ${m.week}) opens prediction testing, which is not open until part 3`
        );
      }
    }
  });

  test('every takeaway either acts or explains itself', () => {
    for (const m of MODULES) {
      assert.ok(
        m.action || m.actionNote,
        `${m.title} ends by telling somebody to do something with no way to do it and no reason why not`
      );
    }
  });
});
