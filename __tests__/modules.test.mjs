import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { MODULES, moduleBySlug, freeModules } = await import('../content/modules.ts');
const { parseInline } = await import('../lib/inline.ts');

const words = (m) => [...m.body, m.takeaway].join(' ').split(/\s+/).filter(Boolean).length;

describe('module set structure', () => {
  test('there are exactly 12 modules and every week 1-12 is covered', () => {
    assert.equal(MODULES.length, 12);
    // Week 1 carries three modules (the free tier); weeks 4-12 carry one each. Weeks 2
    // and 3 are consolidation — the protocol runs them without new reading.
    assert.deepEqual(
      MODULES.map((m) => m.week),
      [1, 1, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
    assert.ok(MODULES.every((m) => m.week >= 1 && m.week <= 12));
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
    const claims = /\b(this app|steady) (treats|cures|will cure|will treat|heals)\b|\bguaranteed to (fix|cure|work)\b|\bclinically proven\b/i;
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
