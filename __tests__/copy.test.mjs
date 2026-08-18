import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const copy = await import('../content/copy.ts');
const ex = await import('../content/exercises.ts');

/* Walk every exported string in a module, including inside objects and arrays, and
 * including the output of any string-returning function called with representative
 * arguments. The point is that adding a new string somewhere in content/ cannot escape
 * the tone rules just because nobody remembered to add it to a list. */
function harvest(mod) {
  const out = [];
  const seen = new Set();

  const visit = (v) => {
    if (v == null) return;
    if (typeof v === 'string') {
      out.push(v);
      return;
    }
    if (typeof v === 'function') {
      // Call with a few shapes so template strings get exercised.
      for (const args of [[1], [0], [3], [{ minutesPerDay: 40, urgesLogged: 12, urgesResisted: 9, mirrorBefore: 7, mirrorAfter: 4 }]]) {
        try {
          const r = v(...args);
          if (typeof r === 'string') out.push(r);
          else if (r && typeof r === 'object') visit(r);
        } catch {
          /* wrong arg shape for this fn — fine, another shape will match */
        }
      }
      return;
    }
    if (typeof v !== 'object') return;
    if (seen.has(v)) return;
    seen.add(v);
    for (const k of Object.keys(v)) visit(v[k]);
  };

  visit(mod);
  return out;
}

const COPY_STRINGS = harvest(copy);
const EX_STRINGS = harvest(ex);
const ALL = [...COPY_STRINGS, ...EX_STRINGS];

describe('harvesting works', () => {
  test('finds a meaningful number of strings in both modules', () => {
    assert.ok(COPY_STRINGS.length > 15, `only found ${COPY_STRINGS.length} copy strings`);
    assert.ok(EX_STRINGS.length > 40, `only found ${EX_STRINGS.length} exercise strings`);
  });
});

describe('tone rules across every user-facing string', () => {
  test('no exclamation marks anywhere', () => {
    // Brightness is the wrong register for someone opening this while distressed.
    for (const s of ALL) assert.ok(!s.includes('!'), `exclamation mark in: "${s.slice(0, 70)}"`);
  });

  test('never tells the user they failed', () => {
    const shaming =
      /\byou failed\b|\byou'?ve failed\b|\bfailure\b|\byou broke\b|\bbroke your streak\b|\bstreak lost\b|\byou missed\b|\byou'?re behind\b|\bshould have\b|\bdisappoint/i;
    for (const s of ALL) assert.doesNotMatch(s, shaming, `shaming: "${s.slice(0, 90)}"`);
  });

  test('never evaluates or reassures about appearance', () => {
    const appearance =
      /\byou look (fine|good|great|okay|normal|beautiful|attractive)\b|\bnothing'?s wrong with (your|how you)\b|\byou'?re (beautiful|attractive|not ugly)\b|\brate your (face|appearance|looks)\b/i;
    for (const s of ALL) assert.doesNotMatch(s, appearance, `appearance claim: "${s.slice(0, 90)}"`);
  });

  test('no numbers about bodies', () => {
    const bodyNumbers = /\b\d+\s?(kg|lbs?|pounds|stone|cm|inches)\b|\bBMI\b|\bsize \d+\b|\b\d+\s?calories\b/i;
    for (const s of ALL) assert.doesNotMatch(s, bodyNumbers, `body number: "${s.slice(0, 90)}"`);
  });

  test('no treatment or cure claims', () => {
    const claims =
      /\b(steady|this app) (treats|cures|heals|will fix)\b|\bclinically proven\b|\bguaranteed to (work|help|fix)\b/i;
    for (const s of ALL) assert.doesNotMatch(s, claims, `treatment claim: "${s.slice(0, 90)}"`);
  });

  test('no dark-pattern urgency in the paywall', () => {
    const urgency = /hurry|limited time|expires|last chance|only \d+ (left|spots)|act now|don'?t miss/i;
    for (const s of harvest(copy.PAYWALL_COPY)) {
      assert.doesNotMatch(s, urgency, `urgency: "${s}"`);
    }
  });
});

describe('specific promises the copy makes', () => {
  test('the disclaimer states what Anneal is not, and points at Support', () => {
    assert.match(copy.DISCLAIMER, /isn'?t therapy/i);
    assert.match(copy.DISCLAIMER, /diagnosis/i);
    assert.match(copy.DISCLAIMER, /Support tab/i);
  });

  test('the paywall promises the free tier explicitly', () => {
    /* Assert the promise, not the vocabulary. Pinning the word "grounding" made a rename
       that the whole app agreed on look like a safety regression — the guarantee is that
       the calming exercises, the check-in and crisis support are named as free, whatever
       this release happens to call them. */
    assert.match(copy.PAYWALL_COPY.freeLine, /free, always/i);
    assert.match(copy.PAYWALL_COPY.freeLine, /grounding|calm/i);
    assert.match(copy.PAYWALL_COPY.freeLine, /check-in/i);
    assert.match(copy.PAYWALL_COPY.freeLine, /support/i);
  });

  test('hardship access asks for nothing', () => {
    const h = copy.PAYWALL_COPY.hardship;
    const joined = `${h.link} ${h.title} ${h.body} ${h.confirm}`;
    assert.match(joined, /no form/i);
    assert.match(joined, /no questions/i);
    assert.doesNotMatch(joined, /proof|verify|evidence|eligib|apply|application/i);
  });

  test('the missed-day strings keep the door open', () => {
    assert.match(copy.STREAK_COPY.missedWithFreeze, /intact/i);
    assert.match(copy.STREAK_COPY.missedNoFreeze, /starting again/i);
    assert.match(copy.STREAK_COPY.missedNoFreeze, /same as anyone/i);
  });

  test('milestones celebrate attendance', () => {
    for (const n of [7, 30, 100]) {
      assert.ok(copy.STREAK_COPY.milestones[n], `missing milestone ${n}`);
    }
    assert.match(copy.STREAK_COPY.milestones[7], /showing up/i);
  });
});

describe('exercise scripts are complete and correctly timed', () => {
  test('5-4-3-2-1 counts down 5,4,3,2,1 with an intro and a close', () => {
    const counts = ex.SENSES_STEPS.map((s) => s.count);
    assert.deepEqual(counts, [null, 5, 4, 3, 2, 1, null]);
  });

  test('4-7-8 timings are exactly 4, 7 and 8 over four cycles', () => {
    assert.equal(ex.BREATH.inhale, 4);
    assert.equal(ex.BREATH.hold, 7);
    assert.equal(ex.BREATH.exhale, 8);
    assert.equal(ex.BREATH.cycles, 4);
    // 4 cycles x 19s = 76s, which is the "≈80s" in the brief.
    assert.equal((ex.BREATH.inhale + ex.BREATH.hold + ex.BREATH.exhale) * ex.BREATH.cycles, 76);
    assert.equal(ex.BREATH.during.length, 4);
  });

  test('urge surfing runs 3 minutes with a cue every 30 seconds', () => {
    assert.equal(ex.URGE_SURF.totalSeconds, 180);
    assert.deepEqual(ex.URGE_SURF.steps.map((s) => s.at), [0, 30, 60, 90, 120, 150]);
  });

  test('urge surfing requires a confirm to leave early, and does not punish leaving', () => {
    const c = ex.URGE_SURF.exitConfirm;
    assert.ok(c.stay && c.leave);
    assert.match(c.body, /no penalty/i);
  });

  test('attention widening is 60s with a prompt every 15s', () => {
    assert.equal(ex.WIDENING.totalSeconds, 60);
    assert.deepEqual(ex.WIDENING.steps.map((s) => s.at), [0, 15, 30, 45]);
  });

  test('the hard-day path offers all four options and never demands a make-up task', () => {
    assert.deepEqual(ex.HARD_DAY.options.map((o) => o.key), ['breathe', 'ground', 'sit', 'talk']);
    assert.match(ex.HARD_DAY.opening, /nothing is required/i);
    assert.match(ex.HARD_DAY.close, /intact/i);
    assert.equal(ex.HARD_DAY.sit.totalSeconds, 120);
    assert.equal(ex.HARD_DAY.sit.midpoint.at, 60);
    assert.equal(ex.HARD_DAY.sit.midpoint.text, 'Still here.');
  });

  test('the experiment captures the prediction before the outcome', () => {
    const keys = ex.EXPERIMENT_FIELDS.map((f) => f.key);
    assert.ok(keys.indexOf('prediction') < keys.indexOf('outcome'));
    assert.ok(keys.indexOf('likelihoodBefore') < keys.indexOf('likelihoodAfter'));
    // Prediction fields must not be marked afterEvent, or the form would let someone
    // write the prediction once they already know what happened.
    const pred = ex.EXPERIMENT_FIELDS.find((f) => f.key === 'prediction');
    assert.notEqual(pred.afterEvent, true);
  });

  test('the thought record ends by re-rating and does not demand zero', () => {
    const last = ex.THOUGHT_RECORD_STEPS[ex.THOUGHT_RECORD_STEPS.length - 1];
    assert.equal(last.kind, 'rating');
    assert.match(ex.THOUGHT_RECORD_CLOSING, /doesn'?t have to drop to zero/i);
  });

  test('there are 12 distortions, each with a real definition', () => {
    assert.equal(ex.DISTORTIONS.length, 12);
    for (const d of ex.DISTORTIONS) {
      assert.ok(d.definition.length > 40, `${d.name} definition too thin`);
    }
    assert.equal(new Set(ex.DISTORTIONS.map((d) => d.name)).size, 12);
  });
});
