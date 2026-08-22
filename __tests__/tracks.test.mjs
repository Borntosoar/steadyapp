import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TRACKS, BREAKUP, trackById, tracksFor, TRACK_CAVEAT, TRACK_CLOSE,
} from '../content/tracks.ts';
import {
  emptyTrack, isOpen, nextDay, isComplete, progressOf, markDone, openTrack,
} from '../lib/track.ts';
import { MOODS } from '../lib/motif.ts';
import { REFLECTION } from '../content/survey.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

/* Guided tracks, and the breakup one in particular.
 *
 * content/tracks.ts states five refusals in its header. A header is a comment and a comment
 * is not a constraint, so each of them is checked here — these are the failure modes that
 * would still ship a track that runs perfectly and hurts somebody. */

const prose = (d) => [d.title, d.about, d.game.focus, d.game.label, d.practice.label, d.hold];
const allProse = TRACKS.flatMap((t) => [t.title, t.blurb, ...t.days.flatMap(prose)]);

describe('the shape of a track', () => {
  test('every track has a stable id, days with unique ids, and a blurb', () => {
    assert.equal(new Set(TRACKS.map((t) => t.id)).size, TRACKS.length);
    for (const t of TRACKS) {
      assert.ok(t.days.length >= 3, `${t.id} is too short to be a sequence`);
      assert.equal(new Set(t.days.map((d) => d.id)).size, t.days.length,
        `${t.id} has duplicate day ids — progress would be ambiguous`);
      assert.ok(t.blurb.length > 60, `${t.id} does not say what it is`);
    }
  });

  test('no day id is a number, so days can be reordered without stranding anybody', () => {
    /* Refusal 5, at the data layer. lib/track.ts stores progress as a set of these ids
       precisely so inserting a day cannot move everybody who is mid-track — an id like
       "3" would quietly reintroduce the index. */
    for (const t of TRACKS) {
      for (const d of t.days) {
        assert.doesNotMatch(d.id, /^\d+$/, `${t.id}/${d.id} is an index wearing an id`);
        assert.match(d.id, /^[a-z][a-z-]*$/, `${t.id}/${d.id} is not a slug`);
      }
    }
  });

  test('every day carries one game, one practice and one thing to hold', () => {
    for (const t of TRACKS) {
      for (const d of t.days) {
        assert.ok(d.game.route && d.game.label && d.game.focus, `${d.id} has half a game`);
        assert.ok(d.practice.route && d.practice.label, `${d.id} has half a practice`);
        assert.ok(d.hold.length > 15, `${d.id} has nothing to hold`);
        assert.ok(d.mood in MOODS, `${d.id} has no ground`);
        assert.ok(d.motif, `${d.id} has no motif`);
      }
    }
  });

  test('every route a track links to is a screen that exists', () => {
    /* A dead link on day five of somebody's worst month is not a 404, it is the app
       breaking its own promise at the point they had started to trust it. */
    for (const t of TRACKS) {
      for (const d of t.days) {
        for (const route of [d.game.route, d.practice.route]) {
          const path = route.split('?')[0].replace(/^\//, '');
          assert.ok(existsSync(join(ROOT, 'app', `${path}.tsx`)),
            `${t.id}/${d.id} links to ${route}, which is not a screen`);
        }
      }
    }
  });

  test('every query parameter a track passes is actually read by the screen it opens', () => {
    /* This caught a real one: day one asked for `?clock=off` and app/game/curveball.tsx
       read no parameters at all, so the acute-week day quietly opened with a stopwatch on.
       A parameter nothing reads is a lie told in a place nobody looks. */
    for (const t of TRACKS) {
      for (const d of t.days) {
        for (const route of [d.game.route, d.practice.route]) {
          const [path, query] = route.split('?');
          if (!query) continue;
          const src = read(join('app', `${path.replace(/^\//, '')}.tsx`));
          for (const pair of query.split('&')) {
            const key = pair.split('=')[0];
            assert.match(src, new RegExp(`\\b${key}\\b`),
              `${t.id}/${d.id} passes ?${key}= and ${path} never reads it`);
          }
        }
      }
    }
  });

  test('the practice deep links name a real tool', () => {
    const src = read('app/grounding.tsx');
    const union = src.slice(src.indexOf('type Tool ='), src.indexOf(';', src.indexOf('type Tool =')));
    for (const t of TRACKS) {
      for (const d of t.days) {
        const tool = new URL(`app:${d.practice.route}`).searchParams.get('tool');
        if (!tool) continue;
        assert.match(union, new RegExp(`'${tool}'`), `${d.id} opens a tool that does not exist`);
      }
    }
  });
});

describe('refusal 1 — no timeline, ever', () => {
  test('nothing anywhere promises a duration or a date', () => {
    /* The eleven-week figure everybody quotes is from undergraduates rating their worst
       breakup. It is not a prognosis, and a promised date that passes converts an ordinary
       bad month into evidence that something is wrong with you. */
    const bad = /\b(in (a few |two |three |six )?(days|weeks|months)|by (day|week) \d|\d+[- ](day|week)s? (program|programme|plan|challenge)|within \w+ weeks|takes about \w+ (weeks|months))\b/i;
    for (const s of allProse) {
      assert.doesNotMatch(s, bad, `promises a timeline: "${s}"`);
    }
  });

  test('no day is labelled by number and no day counts the others', () => {
    /* "Day 3 of 7" is a schedule, and refusal 5 says the third one you did is not the third
       day since it happened. What is forbidden is a day NUMBERED — "Day three", "Week 2" —
       not the words themselves: the last day of the breakup track is called "The next week"
       because the week ahead is its subject, which is the opposite of a schedule. References
       to a neighbouring day by name are fine too, and there is one on purpose. */
    const numbered = /\b(day|week)s?\s*(\d|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;
    for (const t of TRACKS) {
      for (const d of t.days) {
        assert.doesNotMatch(d.title, numbered, `"${d.title}" is a label on a calendar`);
        assert.doesNotMatch(d.title, /\d/, `"${d.title}" is numbered`);
        assert.doesNotMatch([d.about, d.hold, d.game.focus].join(' '), /\d+ of \d+|day \d|week \d/i,
          `${d.id} counts`);
      }
    }
  });

  test('the caveat says outright that it is not a treatment and not a timetable', () => {
    assert.match(TRACK_CAVEAT, /not a treatment/i);
    assert.match(TRACK_CAVEAT, /timetable|schedule|timeline/i);
    assert.match(TRACK_CAVEAT, /behind/i, 'nothing tells somebody slow that they are not late');
  });

  test('the screen states that there is no schedule and shows no counter', () => {
    /* CSS dimensions are stripped first — `width: '100%'` is a layout rule, not a progress
       readout, and matching it would make this assertion unpassable rather than strict. */
    const src = read('app/track/[id].tsx').replace(/\s+/g, ' ').replace(/'\d+%'/g, "''");
    assert.match(src, /No schedule/i);
    assert.doesNotMatch(src, /\{\s*done\s*\}\s*of\s*\{\s*total\s*\}/, 'a counter is a schedule');
    assert.doesNotMatch(src, /%/, 'a percentage is a schedule with a decimal point');
    assert.match(src, /function Seedling/, 'the growing element is gone');
  });

  test('progress is never computed from elapsed time', () => {
    /* The whole reason lib/track.ts stores startedAt and then refuses to use it. Somebody
       who opens this three weeks late is not on day one, and somebody who misses four days
       is not behind. */
    const src = read('lib/track.ts').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const fn of ['isOpen', 'nextDay', 'isComplete', 'progressOf']) {
      const body = src.slice(src.indexOf(`function ${fn}`), src.indexOf('\n}', src.indexOf(`function ${fn}`)));
      assert.doesNotMatch(body, /startedAt|Date|now\(\)/,
        `${fn} unlocks on the calendar rather than on what somebody has done`);
    }
  });
});

describe('refusal 2 — nothing here asks for daily writing about the breakup', () => {
  test('every day gives a question to hold and none of them asks for an entry', () => {
    const submit = /\b(write (it |them )?down|journal|log (it|this)|type|describe in|record your|entry|save your answer)\b/i;
    for (const t of TRACKS) {
      for (const d of t.days) {
        assert.doesNotMatch(d.hold, submit, `${d.id} asks for writing: "${d.hold}"`);
        assert.doesNotMatch(d.about, submit, `${d.id} asks for writing`);
      }
    }
  });

  test('the day screen has no text field under the question', () => {
    /* Rumination maintains dissolution distress, and repeated structured reflection has
       been found to make things worse for people already high in it — which is exactly who
       downloads a breakup app. The app cannot screen for that, so it does not hand anybody
       a daily reprocessing task and hope. */
    const src = read('app/track/[id].tsx');
    assert.doesNotMatch(src, /TextInput|onChangeText/,
      'there is somewhere to type, and the app cannot tell who should not');
  });
});

describe('refusal 3 — no advice about anybody\'s actual life', () => {
  test('nothing instructs somebody to cut contact, block or delete', () => {
    /* Shared housing, children, work, a person who is still a friend. The app cannot see
       any of it. Day six describes what tends to restart the clock and stops there. */
    const advice = /\b(block (them|their|the)|delete (the |their |every )?(photo|picture|message|number)|go no.contact|cut them off|unfollow|stop replying|never (speak|contact|text)|you should|you need to|you must)\b/i;
    for (const s of allProse) {
      assert.doesNotMatch(s, advice, `tells somebody what to do about their life: "${s}"`);
    }
  });

  test('the day about triggers describes and does not prescribe', () => {
    const day = BREAKUP.days.find((d) => d.id === 'what-restarts-it');
    assert.ok(day, 'the day about what restarts it is gone');
    assert.match(day.about, /not something an app can|is not something|leaves? the decision|not.*opinion/i,
      'it stopped saying that the decision is not the app\'s');
  });
});

describe('refusal 4 — no assumptions about the shape of the relationship', () => {
  test('nothing assumes who left', () => {
    const left = /\b(they left|when they left|being (left|dumped)|your ex (left|walked)|they walked out|they ended it|you were (left|dumped|rejected))\b/i;
    for (const s of allProse) assert.doesNotMatch(s, left, `assumes who left: "${s}"`);
  });

  test('nothing assumes a gender, a marriage, a length or a living arrangement', () => {
    const shape = /\b(husband|wife|boyfriend|girlfriend|fianc\w+|marriage|married|divorce|he |she |his |her |years together|moved out|your home)\b/i;
    for (const s of allProse) assert.doesNotMatch(s, shape, `assumes a shape: "${s}"`);
  });

  test('nothing calls the other person "your ex" or names the relationship type', () => {
    for (const s of allProse) {
      assert.doesNotMatch(s, /\byour ex\b|\bex-partner\b|\bthe relationship you\b/i, `"${s}"`);
    }
  });

  test('and nothing shouts, diagnoses or promises an outcome', () => {
    /* No bare `you have` here, unlike the survey's version of this check. Naming a condition
       is already forbidden outright on the line below, so `you have` adds no coverage and
       does catch ordinary English — it failed on "what would you have said about it in a bad
       week", which is a question about their own memory and precisely what day three is for. */
    const bad = /\b(depress\w*|anxiety|disorder|diagnos\w*|trauma|will (get better|heal|improve)|cure|closure guaranteed)\b/i;
    for (const s of allProse.concat([TRACK_CAVEAT, TRACK_CLOSE])) {
      assert.doesNotMatch(s, bad, `"${s}"`);
      assert.ok(!s.includes('!'), `shouts: "${s}"`);
    }
  });
});

describe('the closing screen does not congratulate somebody for finishing grief', () => {
  test('it is not a celebration', () => {
    assert.doesNotMatch(TRACK_CLOSE, /\b(congratulations|well done|you did it|complete|completed|graduated|success)\b/i);
    assert.match(TRACK_CLOSE, /not finished|none of it is finished|not how this works/i,
      'it implies the thing the track is about is over');
  });
});

describe('the breakup sequence itself', () => {
  test('seven days, in the order the arc describes', () => {
    assert.deepEqual(BREAKUP.days.map((d) => d.id), [
      'getting-through', 'what-narrowed', 'the-edit', 'who-now',
      'the-voice', 'what-restarts-it', 'the-next-week',
    ]);
  });

  test('it opens on getting through rather than on understanding', () => {
    assert.match(BREAKUP.days[0].about, /getting through|not understanding/i);
  });

  test('a repeated game is pointed somewhere different each time', () => {
    /* Four games over seven days means repeats. A repeat with the same focus is padding. */
    const byRoute = new Map();
    for (const d of BREAKUP.days) {
      const route = d.game.route.split('?')[0];
      const seen = byRoute.get(route) ?? [];
      seen.push(d.game.focus);
      byRoute.set(route, seen);
    }
    for (const [route, focuses] of byRoute) {
      assert.equal(new Set(focuses).size, focuses.length,
        `${route} appears twice with the same instruction`);
    }
  });

  test('it is offered to the survey shapes it is for, and they all exist', () => {
    assert.ok(BREAKUP.forCarrying.length > 0);
    for (const key of BREAKUP.forCarrying) {
      assert.ok(REFLECTION[key], `offered to "${key}", which no survey answer produces`);
    }
    for (const key of BREAKUP.forCarrying) {
      assert.ok(tracksFor(key).some((t) => t.id === 'breakup'));
    }
    assert.deepEqual(tracksFor('not-a-shape'), []);
  });
});

describe('progress through a track', () => {
  const s0 = emptyTrack('2026-01-01T00:00:00.000Z');

  test('only the first day is open at the start', () => {
    assert.equal(nextDay(BREAKUP, s0).id, 'getting-through');
    assert.equal(isOpen(BREAKUP, s0, 'getting-through'), true);
    assert.equal(isOpen(BREAKUP, s0, 'what-narrowed'), false);
    assert.equal(isComplete(BREAKUP, s0), false);
    assert.deepEqual(progressOf(BREAKUP, s0), { done: 0, total: 7 });
  });

  test('finishing one opens the next, and the finished one stays open', () => {
    const s1 = markDone(s0, 'getting-through');
    assert.equal(isOpen(BREAKUP, s1, 'getting-through'), true, 'a done day cannot be reopened');
    assert.equal(isOpen(BREAKUP, s1, 'what-narrowed'), true);
    assert.equal(isOpen(BREAKUP, s1, 'the-edit'), false);
  });

  test('marking the same day twice is a double tap, not two days', () => {
    const once = markDone(s0, 'getting-through');
    const twice = markDone(once, 'getting-through');
    assert.equal(twice.done.length, 1);
    assert.equal(twice, once, 'it allocated a new state for nothing');
  });

  test('there is no cap — three in an evening is allowed', () => {
    /* A cap is the app deciding it knows the right pace for somebody's worst month. Every
       other refusal in this product points the same way: the skip, the pass, the no-clock. */
    const src = read('lib/track.ts');
    assert.doesNotMatch(src, /perDay|dailyLimit|cooldown|lockUntil|MAX_PER/i);
    let s = s0;
    for (const d of BREAKUP.days) s = markDone(s, d.id);
    assert.equal(isComplete(BREAKUP, s), true);
    assert.deepEqual(progressOf(BREAKUP, s), { done: 7, total: 7 });
  });

  test('an id no longer in the content cannot leave somebody at eight of seven', () => {
    const s = { startedAt: s0.startedAt, done: [...BREAKUP.days.map((d) => d.id), 'a-day-that-was-cut'] };
    assert.deepEqual(progressOf(BREAKUP, s), { done: 7, total: 7 });
  });

  test('an unknown track id resolves to nothing rather than throwing', () => {
    /* This comes off a URL. app/track/[id].tsx renders "That one is not here." */
    assert.equal(trackById('nonsense'), null);
    assert.equal(openTrack('nonsense', {}), null);
    assert.equal(openTrack('', {}), null);
  });

  test('a track opened for the first time gets a state rather than a crash', () => {
    const resolved = openTrack('breakup', {});
    assert.equal(resolved.track.id, 'breakup');
    assert.deepEqual(resolved.state.done, []);
    assert.ok(resolved.state.startedAt);
  });
});

describe('the track is stored on the device and nowhere else', () => {
  test('progress survives a round trip through normalise', () => {
    const src = read('lib/storage.ts');
    assert.match(src, /tracks:/, 'track progress is dropped on the next read');
  });

  test('nothing in the track path reaches the network', () => {
    for (const f of ['content/tracks.ts', 'lib/track.ts', 'app/track/[id].tsx']) {
      assert.doesNotMatch(read(f), /\bfetch\(|XMLHttpRequest|axios|https?:\/\/(?!\s)/,
        `${f} makes a network call`);
    }
  });

  test('content and lib stay loadable under bare Node', () => {
    for (const f of ['content/tracks.ts', 'lib/track.ts']) {
      assert.doesNotMatch(read(f), /from 'react|from "react/, `${f} imports React`);
    }
  });
});
