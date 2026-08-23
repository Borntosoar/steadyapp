import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TRACKS, BREAKUP, FLAT, SPIRALS,
  trackById, tracksFor, TRACK_CAVEAT, TRACK_CLOSE, closeFor, daysWord,
} from '../content/tracks.ts';
import {
  emptyTrack, isOpen, nextDay, isComplete, progressOf, markDone, openTrack,
} from '../lib/track.ts';
import { MOODS } from '../lib/motif.ts';
import { REFLECTION } from '../content/survey.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

/* Guided tracks.
 *
 * content/tracks.ts states five refusals in its header that apply to every track, and five
 * more specific to the flat one. A header is a comment and a comment is not a constraint, so
 * each of them is checked here — these are the failure modes that would still ship a track
 * that runs perfectly and hurts somebody.
 *
 * Everything not in a track-specific block runs against EVERY track. That is deliberate: the
 * refusals were written for the breakup track and every one of them turned out to be worth
 * holding the second one to as well. */

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

const prose = (d) => [d.title, d.about, d.game.focus, d.game.label, d.practice.label, d.hold];
const proseOf = (t) => [t.title, t.blurb, closeFor(t), ...t.days.flatMap(prose)];
const allProse = TRACKS.flatMap(proseOf);

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

  test('and no track predicts how anybody is going to feel', () => {
    /* Written for the flat track, where promising the feeling back sets up a failed
       prediction the person reads as being about them. It generalises: no track knows how
       any week is going to go, and every one of them is talking to somebody who has already
       been promised this by something else. */
    const promise = /\b(you will (feel|enjoy|want|start)|it will (lift|pass|come back|get easier|stop)|things will (feel|get)|you'?ll (feel|enjoy|be))\b/i;
    for (const s of allProse.concat([TRACK_CAVEAT, TRACK_CLOSE])) {
      assert.doesNotMatch(s, promise, `promises a feeling: "${s}"`);
    }
  });
});

describe('the closing screen does not congratulate somebody for finishing', () => {
  const closes = [['fallback', TRACK_CLOSE], ...TRACKS.map((t) => [t.id, closeFor(t)])];

  for (const [name, close] of closes) {
    test(`${name}: it is not a celebration`, () => {
      /* Finishing a track is not finishing the thing the track is about. "Congratulations,
         you have completed After It Ended" is the cruellest available version of this
         screen, and on the flat track a congratulation is also a claim that the feeling came
         back — refusal 10, which it explicitly does not promise. */
      assert.doesNotMatch(close, /\b(congratulations|well done|you did it|complete|completed|graduated|success)\b/i);
      assert.match(close, /not finished|none of it is finished|not how this works/i,
        'it implies the thing the track is about is over');
    });
  }

  test('the fallback names no number, so a shorter track cannot inherit a wrong one', () => {
    /* It used to open "That is the seven", true of the only track that existed and a lie the
       first time one is five days long. */
    assert.doesNotMatch(TRACK_CLOSE, /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  });

  test('a close that does name a number names the right one', () => {
    const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    for (const t of TRACKS) {
      const found = closeFor(t).toLowerCase().match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/g) ?? [];
      for (const f of found) {
        const n = WORDS[f] ?? Number(f);
        assert.equal(n, t.days.length,
          `${t.id} has ${t.days.length} days and its close says "${f}"`);
      }
    }
  });

  test('the screens count the days rather than spelling the number out', () => {
    /* Three places said "seven" because both tracks happen to have seven days: the shared
       close, the Practice row, and the survey result. All three would have been quietly
       wrong the first time a track was five days long, and none of them would have failed a
       test. The count is data; the screens ask for it. */
    for (const f of ['app/onboarding/survey.tsx', 'app/(tabs)/practice.tsx']) {
      assert.match(read(f), /daysWord\(/, `${f} does not get the count from the track`);
    }
  });

  test('the count reads as a word, and still matches', () => {
    for (const t of TRACKS) assert.equal(daysWord(t), NUMBER_WORDS[t.days.length]);
    assert.equal(daysWord({ days: new Array(5) }), 'five');
    assert.equal(daysWord({ days: new Array(12) }), '12', 'spelling past ten stops helping');
  });

  test('every track either writes its own close or takes the fallback', () => {
    for (const t of TRACKS) {
      assert.ok(closeFor(t).length > 60, `${t.id} closes on nothing`);
    }
    assert.equal(closeFor({ days: [] }), TRACK_CLOSE);
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

/* ──────────────────────────────────────────────────────────────────────────────────────
 * The flat track's own five. Each is a way this specific track could be actively harmful
 * rather than merely useless, which is why they are checked rather than trusted. */

const flatProse = proseOf(FLAT);

describe('refusal 6 — it never tells somebody flat to do things they enjoy', () => {
  test('nothing anywhere suggests picking enjoyable activities', () => {
    /* The presenting problem restated as the cure. Somebody here has already been told this
       by everyone, and hearing it from an app is a reason to close the app. */
    const enjoy = /\b(do (things|something) (you|that you) (enjoy|like|love)|things you enjoy|something fun|treat yourself|do what makes you happy|find joy|pick something you like)\b/i;
    for (const s of flatProse) assert.doesNotMatch(s, enjoy, `tells a flat person to enjoy something: "${s}"`);
  });

  test('the track says outright that it does not ask anybody to enjoy anything', () => {
    assert.match(FLAT.blurb, /enjoy/i, 'the promise not to is the first thing it should say');
    assert.match(FLAT.blurb, /nothing in here asks|does not ask/i);
  });

  test('the instructions are about size and about doing it first, not about wanting to', () => {
    const joined = FLAT.days.map((d) => d.game.focus).join(' ');
    assert.match(joined, /smallest|small/i, 'size is the mechanism and it is not mentioned');
    assert.match(FLAT.days[0].about, /wait until you feel like it|backwards|doing comes first/i);
  });
});

describe('refusal 7 — no sleep, diet or exercise advice', () => {
  test('nothing prescribes a routine everybody has already been told about', () => {
    /* Being unable to do these is part of what flat IS. Repeating them makes the app one more
       voice on that list. */
    const lifestyle = /\b(get (some |more )?(sleep|rest)|eight hours|sleep hygiene|go to bed|wake up (early|earlier)|go for a (run|walk|jog)|exercise|work out|eat (better|properly|well)|drink water|get (some )?(sunlight|fresh air)|screen time)\b/i;
    for (const s of flatProse) assert.doesNotMatch(s, lifestyle, `lifestyle advice: "${s}"`);
  });
});

describe('refusal 8 — no gratitude and no bright side', () => {
  test('nothing asks anybody to be grateful or to look on the bright side', () => {
    /* A gratitude prompt handed to somebody flat reads as an accusation: the implication is
       that the problem is insufficient noticing. */
    const bright = /\b(grateful|gratitude|thankful|count your blessings|bright side|silver lining|look on the|positive(s| things| side)|three good things|cheer up|stay positive)\b/i;
    for (const s of flatProse) assert.doesNotMatch(s, bright, `gratitude or brightness: "${s}"`);
  });

  test('the registering day works on discounting, not on noticing harder', () => {
    const day = FLAT.days.find((d) => d.id === 'not-landing');
    assert.ok(day, 'the day about things not registering is gone');
    assert.match(`${day.about} ${day.game.focus}`, /filed|strike|striking|did not count|discount/i);
    assert.equal(day.game.route.split('?')[0], '/game/ballast', 'it stopped using the positive data log');
  });
});

describe('refusal 9 — a missed plan is about the size of the step', () => {
  test('behavioural activation carries the track rather than appearing once', () => {
    /* One exposure to the mechanism is a demonstration, not a method. */
    const groundwork = FLAT.days.filter((d) => d.game.route.startsWith('/game/groundwork'));
    assert.ok(groundwork.length >= 3, `Groundwork appears ${groundwork.length} times, which is a sampler`);
    assert.equal(FLAT.days[0].game.route.split('?')[0], '/game/groundwork', 'the track does not open on the mechanism');
  });

  test('nothing in the track frames a miss as effort, discipline or willpower', () => {
    const blame = /\b(willpower|discipline|motivation is|lazy|excuses|push through|try harder|commit to|stick with it|consistency)\b/i;
    for (const s of flatProse) assert.doesNotMatch(s, blame, `blames the person: "${s}"`);
  });

  test('and the game it leans on still answers a miss with a size', () => {
    /* Checked in content/groundwork.ts rather than restated here, because the track inherits
       whatever that file does — if the reply to a miss ever becomes about the person, this
       track is the loudest place that would be felt. */
    const src = read('content/groundwork.ts');
    assert.match(src, /nextSize/, 'the smaller-next-step rule is gone');
    assert.doesNotMatch(src, /\b(try harder|willpower|discipline|you failed)\b/i);
  });
});

describe('refusal 10 — it does not promise the feeling comes back', () => {
  /* The "no predicted feeling" guard that started here now runs over every track, in the
     shared block above. What is left is the part specific to this one. */

  test('the close says the flat part comes back and offers the method instead', () => {
    assert.match(FLAT.close, /comes back/i);
    assert.match(FLAT.close, /method/i);
  });

  test('and the track says which way round doing and wanting go', () => {
    const day = FLAT.days.find((d) => d.id === 'the-wanting');
    assert.ok(day, 'the day about wanting is gone');
    assert.match(day.about, /looking forward|come apart|absence of/i);
  });
});

describe('the flat sequence itself', () => {
  test('seven days, in the order the header describes', () => {
    assert.deepEqual(FLAT.days.map((d) => d.id), [
      'the-first-move', 'the-wanting', 'what-fell-off', 'not-landing',
      'the-first-hour', 'other-people', 'when-it-dips',
    ]);
  });

  test('it is offered to the survey shapes it names, and they all exist', () => {
    for (const key of FLAT.forCarrying) {
      assert.ok(REFLECTION[key], `offered to "${key}", which no survey answer produces`);
      assert.ok(tracksFor(key).some((t) => t.id === 'flat'));
    }
  });

  test('the two tracks do not both claim the same survey shape', () => {
    /* The survey result offers `tracksFor(carrying)[0]`, so an overlap would make which one
       gets named depend on the order of an array. */
    const claimed = new Set();
    for (const t of TRACKS) {
      for (const key of t.forCarrying) {
        assert.ok(!claimed.has(key), `"${key}" is claimed by more than one track`);
        claimed.add(key);
      }
    }
  });

  test('the worst-hour day opens without a stopwatch', () => {
    const day = FLAT.days.find((d) => d.id === 'the-first-hour');
    assert.match(day.game.route, /clock=off/);
  });
});

/* ──────────────────────────────────────────────────────────────────────────────────────
 * The spirals track's own five. This is the shape where a well-meaning app does the most
 * damage, because every obvious feature for it — the worry diary, the thought record, the
 * reassuring line — is the maintaining behaviour with a nicer interface. */

const spiralProse = proseOf(SPIRALS);

describe('refusal 11 — no thought-challenging and no evidence-for-and-against', () => {
  test('nothing asks anybody to examine, rate or rebut the content', () => {
    /* Somebody here will do a thought record for an hour and call it progress, because it
       feels exactly like what they were already doing. An app cannot supervise the
       difference between examining a thought once and examining it all evening. */
    const examine = /\b(evidence (for|against)|challenge (the|that|your|a) thought|is (the|that|it) (thought )?(true|realistic|accurate)|how likely|reframe|thought record|balanced thought|dispute|weigh (it|the evidence)|rate how)\b/i;
    for (const s of spiralProse) assert.doesNotMatch(s, examine, `hands them more thinking: "${s}"`);
  });

  test('the track says outright that the topic is not the target', () => {
    assert.match(SPIRALS.blurb, /not one asks what you were thinking about|topic was never the problem/i);
    assert.match(SPIRALS.days[0].about, /topic changes|shape never does|answering is the habit/i);
  });

  test('the game that does check thoughts is used for the discrimination, not for a rebuttal', () => {
    /* Curveball is a thought-checking game in a track that refuses thought-checking, so its
       appearances have to earn it: the useful learning here is that the uncheckable ones are
       the ones somebody has been trying to check, and that one let past is still one got
       through. Neither focus asks for an argument with the thought. */
    const cb = SPIRALS.days.filter((d) => d.game.route.startsWith('/game/curveball'));
    assert.equal(cb.length, 2, 'the deliberate two became something else');
    assert.match(cb[0].game.focus, /cannot be checked/i);
    assert.match(cb[1].game.focus, /letting past|did not settle/i);
  });

  test('Toward carries the track, because its mechanic is the move', () => {
    /* Its own header: the thought is pinned above the choices, never argued with, never
       disproved, and still there when the scene ends. */
    const toward = SPIRALS.days.filter((d) => d.game.route.startsWith('/game/toward'));
    assert.ok(toward.length >= 3, `Toward appears ${toward.length} times, which is a sampler`);
    assert.equal(SPIRALS.days[0].game.route, '/game/toward', 'the track does not open on the mechanism');
  });
});

describe('refusal 12 — no suppression, and it says so out loud', () => {
  test('nothing tells anybody to stop, clear, block or push the thought away', () => {
    const suppress = /\b(stop thinking|don'?t think about|clear your (mind|head)|empty your (mind|head)|push (it|them|the thought) (away|out)|block (it|them|the thought)|think about something else|distract yourself|just relax)\b/i;
    for (const s of spiralProse) assert.doesNotMatch(s, suppress, `prescribes suppression: "${s}"`);
  });

  test('and it names suppression as the thing that does not hold', () => {
    /* Naming it matters. Somebody who has been failing at suppression for years has been
       reading that as a fact about themselves. */
    const day = SPIRALS.days.find((d) => d.id === 'trying-not-to');
    assert.ok(day, 'the day about suppression is gone');
    assert.match(day.about, /already tried not having|makes more of it/i);
    assert.match(day.about, /checking whether it worked|more attention/i);
  });
});

describe('refusal 13 — no reassurance, and it never answers the question', () => {
  test('nothing anywhere tells somebody it will probably be fine', () => {
    /* Worry is a search for certainty and reassurance is the behaviour that maintains it.
       This is the easiest sentence for a mental health app to produce by accident. */
    const reassure = /\b(it will be (fine|okay|ok|alright)|everything will be|probably (fine|nothing|won'?t|will not)|most likely (fine|nothing)|nothing bad (will|is going)|you'?re safe|it'?s not that bad|try not to worry|no need to worry|there is nothing to worry)\b/i;
    for (const s of spiralProse) assert.doesNotMatch(s, reassure, `reassures: "${s}"`);
  });

  test('every question the track asks is left open', () => {
    /* The holds are questions to carry. On this track in particular, a question the app then
       answers is the app doing the checking on somebody's behalf. */
    for (const d of SPIRALS.days) {
      assert.match(d.hold, /\?$/, `${d.id} states rather than asks: "${d.hold}"`);
    }
  });
});

describe('refusal 14 — no worry diary and no scheduled worry period', () => {
  test('postponement is a move here, never an appointment', () => {
    /* A standing daily appointment to worry is still a standing daily appointment to worry,
       and that is the version that survives contact with an unsupervised app. */
    const diary = /\b(worry (log|diary|journal|period|time|window|slot)|scheduled worry|set (aside )?(a )?time to worry|write (down )?(your|the|any) worr|list your worr)\b/i;
    for (const s of spiralProse) assert.doesNotMatch(s, diary, `schedules worry: "${s}"`);
  });

  test('the postponement day describes putting it down rather than booking it in', () => {
    const day = SPIRALS.days.find((d) => d.id === 'putting-it-down');
    assert.ok(day, 'the day about postponement is gone');
    assert.match(day.about, /putting it down|until later/i);
    assert.match(day.about, /does not survive the trip|worth the time/i);
  });
});

describe('refusal 15 — it does not promise quiet', () => {
  test('nothing offers a quiet mind, a clear head or an off switch', () => {
    const quiet = /\b(quiet mind|calm mind|peaceful mind|peace of mind|clear head|inner peace|stop the thoughts|make it stop|switch (it|your (brain|mind)) off|turn it off|silence the)\b/i;
    for (const s of spiralProse) assert.doesNotMatch(s, quiet, `promises quiet: "${s}"`);
  });

  test('the close says what changes instead, and it is not the volume', () => {
    assert.match(SPIRALS.close, /quiet was never the target|does not go quiet/i);
    assert.match(SPIRALS.close, /how long/i, 'it stopped naming the thing that actually moves');
  });
});

describe('the spirals sequence itself', () => {
  test('seven days, in the order the header describes', () => {
    assert.deepEqual(SPIRALS.days.map((d) => d.id), [
      'the-shape', 'what-it-is-for', 'why-and-what', 'putting-it-down',
      'the-empty-room', 'trying-not-to', 'when-it-starts',
    ]);
  });

  test('it opens on the process rather than on any topic', () => {
    assert.match(SPIRALS.days[0].about, /shape never does|the answering is/i);
  });

  test('the day about what the worrying is for is actually about that', () => {
    /* The least-known and most useful thing in the track: nobody keeps doing something that
       does nothing, and the belief that it is preparing you is why it does not stop. */
    const day = SPIRALS.days.find((d) => d.id === 'what-it-is-for');
    assert.match(day.about, /preparing|responsible|caught out/i);
    assert.match(day.hold, /doing for you/i);
  });

  test('the concreteness day contrasts why with what', () => {
    const day = SPIRALS.days.find((d) => d.id === 'why-and-what');
    assert.match(day.about, /start with why|no bottom/i);
    assert.match(day.about, /what exactly|what specifically/i);
  });

  test('Ballast is deliberately absent, and no day pretends otherwise', () => {
    /* Its beliefs are all about self-worth and none of them is a belief about thinking.
       Three games used properly beats four used decoratively. */
    assert.ok(!SPIRALS.days.some((d) => d.game.route.startsWith('/game/ballast')));
    assert.equal(new Set(SPIRALS.days.map((d) => d.game.route.split('?')[0])).size, 3);
  });

  test('the day about the empty hours opens without a stopwatch', () => {
    const day = SPIRALS.days.find((d) => d.id === 'the-empty-room');
    assert.match(day.game.route, /clock=off/);
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
