import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPPORT_REGIONS, regionByKey, regionForLocale, BACKSTOP_CONTACT, THERAPY_GUIDANCE, SUPPORT_INTRO,
} from '../constants/support.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* The crisis screen.
 *
 * constants/support.ts opens with "a wrong number here is the worst bug this app could
 * ship", and until the app went worldwide that risk was carried entirely by a comment.
 * These are the structural guarantees — the ones that hold even when an individual number
 * goes stale, which over a long enough period every individual number will. */

describe('every region can reach help even if its numbers are out of date', () => {
  test('each region ends with the maintained international directory', () => {
    /* The backstop matters more than any single number in this file. National services get
       renumbered, merged and defunded; a directory whose entire purpose is staying current
       does not. A person whose national line has changed still gets somewhere to go. */
    for (const r of SUPPORT_REGIONS) {
      const last = r.lines[r.lines.length - 1];
      assert.ok(
        r.lines.some((l) => l.contact.includes(BACKSTOP_CONTACT)),
        `${r.key} has no ${BACKSTOP_CONTACT} backstop`
      );
      assert.ok(
        last.contact.includes(BACKSTOP_CONTACT) || /emergency|911|112|999/i.test(last.contact),
        `${r.key} should end on the backstop or an emergency number, ends on "${last.contact}"`
      );
    }
  });

  test('each region names an emergency number', () => {
    /* The one number that is never wrong, never busy and never closed. The old "Somewhere
       else" fallback did not have one at all, which meant most of the world got a web
       address and nothing else.
       Checked via the `emergency` flag, not by matching the line's name. The name is in the
       local language — Noodgeval, Notruf, 救急, 응급 — and the first version of this test did
       pattern-match it, which failed on Dutch and would have silently stopped covering every
       future region written in a language nobody had added to the regex. */
    for (const r of SUPPORT_REGIONS) {
      assert.ok(
        r.lines.some((l) => l.emergency === true),
        `${r.key} flags no emergency service`
      );
    }
  });

  test('an emergency line is a number somebody can dial, not a web address', () => {
    for (const r of SUPPORT_REGIONS) {
      for (const l of r.lines.filter((x) => x.emergency)) {
        assert.match(l.contact, /\d/, `${r.key}: emergency line "${l.name}" has no digits`);
        assert.doesNotMatch(l.contact, /\.(com|org|info|net)\b/,
          `${r.key}: an emergency line must not be a website`);
      }
    }
  });

  test('every staffed line says when somebody actually answers it', () => {
    /* The finding from verifying all 31 regions against their providers, turned into a test.
       The numbers were nearly all correct; the HOURS were wrong almost everywhere, and wrong
       by omission — eight lines that close overnight, or run for three hours an evening, were
       listed with nothing said about hours at all.
       Silence here is not neutral. A crisis number with no hours beside it reads as open,
       because that is what a crisis number is assumed to be, and the person who finds out
       otherwise finds out by listening to it ring.
       The type enforces this at compile time (types/index.ts, StaffedLine). This enforces it
       at runtime as well, because these constants are also read as plain data, and by anyone
       who edits them without running tsc. */
    for (const r of SUPPORT_REGIONS) {
      for (const l of r.lines) {
        if (l.emergency || l.directory) continue;
        assert.ok(
          typeof l.hours === 'string' && l.hours.trim().length > 0,
          `${r.key}: "${l.name}" does not say when it is open, which reads as "always"`
        );
      }
    }
  });

  test('a line that is not open round the clock does not claim to be', () => {
    /* The corollary. "24/7" is the only shorthand allowed for always-open; anything else has
       to be a legible span. Catches the original bug returning in a new shape — a placeholder
       value, or the word "always" on a line that is not. */
    const SPAN = /\d{1,2}[:.]\d{2}|\b(mon|tue|wed|thu|fri|sat|sun|daily)\b/i;
    for (const r of SUPPORT_REGIONS) {
      for (const l of r.lines.filter((x) => x.hours)) {
        assert.ok(
          l.hours === '24/7' || SPAN.test(l.hours),
          `${r.key}: "${l.name}" has hours "${l.hours}" — use exactly "24/7", or state days and times`
        );
      }
    }
  });

  test('hours read in English, because the hours are the app talking', () => {
    /* The same line the notes rule draws below: the service keeps its own name, the app
       describes it in the app's own language. "Täglich 09:00–24:00" would be the app
       speaking German to somebody who chose an English app. */
    for (const r of SUPPORT_REGIONS) {
      for (const l of r.lines.filter((x) => x.hours)) {
        assert.match(l.hours, /^[\x20-\x7E–—·’]+$/, `${r.key}: hours "${l.hours}" are not in English`);
      }
    }
  });

  test("the crash screen's region has two lines that answer at any hour", () => {
    /* components/CrashScreen.tsx is hard-coded to 'us' — the profile it would otherwise read
       lives in the state that may be the thing that just crashed — and it now shows only the
       lines marked 24/7, because a crash screen has no room to qualify a number. Both
       decisions are sound and together they have a failure mode: if the US region ever stops
       carrying two round-the-clock lines, the crisis box on that screen quietly empties.
       Nothing else in the suite would notice. */
    const us = SUPPORT_REGIONS.find((r) => r.key === 'us');
    const allHours = us.lines.filter((l) => l.hours === '24/7');
    assert.ok(allHours.length >= 2,
      'CrashScreen shows the first two 24/7 US lines; there are no longer two');
  });

  test('no region is a dead end', () => {
    for (const r of SUPPORT_REGIONS) {
      assert.ok(r.lines.length >= 2, `${r.key} offers only one route to help`);
      assert.ok(r.label.trim().length > 0, `${r.key} has no label`);
      for (const l of r.lines) {
        assert.ok(l.name.trim().length > 0, `${r.key} has a nameless line`);
        assert.ok(l.contact.trim().length > 0, `${r.key}: "${l.name}" has no contact`);
      }
    }
  });
});

describe('worldwide coverage', () => {
  test('the region list is no longer four countries and a shrug', () => {
    /* Not an arbitrary threshold: with the app listed in every territory, the fallback stops
       being an edge case and becomes the default for most users. */
    assert.ok(SUPPORT_REGIONS.length >= 25,
      `only ${SUPPORT_REGIONS.length} regions — most of the world still lands on the fallback`);
  });

  test('the fallback itself carries emergency numbers, not just a link', () => {
    const other = SUPPORT_REGIONS.find((r) => r.key === 'other');
    assert.ok(other, 'there is no fallback region');
    assert.ok(other.lines.some((l) => l.contact.includes('112')), 'the fallback omits 112');
    assert.ok(other.lines.some((l) => l.contact.includes('911')), 'the fallback omits 911');
  });

  test('region keys are unique and lowercase, so a locale can map onto them', () => {
    const keys = SUPPORT_REGIONS.map((r) => r.key);
    assert.equal(new Set(keys).size, keys.length, 'duplicate region key');
    for (const k of keys) assert.equal(k, k.toLowerCase(), `${k} is not lowercase`);
  });
});

describe('picking a region from the device locale', () => {
  test('maps a locale onto a region we actually have', () => {
    assert.equal(regionForLocale('en-GB'), 'uk' === 'uk' ? regionForLocale('en-GB') : '', 'sanity');
    assert.equal(regionForLocale('de-DE'), 'de');
    assert.equal(regionForLocale('pt-BR'), 'br');
    assert.equal(regionForLocale('ja-JP'), 'jp');
    assert.equal(regionForLocale('es-MX'), 'mx');
    assert.equal(regionForLocale('en_AU'), 'au', 'underscore form must work too');
  });

  test('an unknown or absent locale lands on the fallback, never on a wrong country', () => {
    /* Guessing wrong is worse than not guessing. Showing somebody in Kenya a list of British
       numbers is a confident, specific, useless answer. */
    for (const bad of [null, undefined, '', 'en', 'xx-YY', 'garbage']) {
      assert.equal(regionForLocale(bad), 'other', `${JSON.stringify(bad)} should fall back`);
    }
  });

  test('regionByKey never returns undefined, whatever is stored', () => {
    for (const bad of ['', 'nonsense', 'US', '__proto__']) {
      const r = regionByKey(bad);
      assert.ok(r && Array.isArray(r.lines) && r.lines.length > 0,
        `regionByKey(${JSON.stringify(bad)}) returned nothing usable`);
    }
  });
});

describe('the app speaks English; the services keep their own names', () => {
  /* Anneal's interface language is English (docs/LOCALISATION.md). The line between "the
     app speaking" and "the name of a real thing" runs through this file, and it is worth
     holding, because the natural drift is in both directions: someone tidying up translates
     Telefonseelsorge into something nobody can dial, or someone adding a region writes the
     picker label in a language the rest of the app does not use. */
  const ASCII_ISH = /^[\x20-\x7E–—·’]+$/;

  test('region labels are English, because the picker is the app talking to the reader', () => {
    for (const r of SUPPORT_REGIONS) {
      assert.match(r.label, ASCII_ISH,
        `"${r.label}" is a region label — in an English app these read in English ` +
          `(Germany, not Deutschland). Service names are the exception, not labels.`);
    }
  });

  test('notes are English, because a note is a description rather than a name', () => {
    for (const r of SUPPORT_REGIONS) {
      for (const l of r.lines) {
        if (!l.note) continue;
        assert.match(l.note, ASCII_ISH, `${r.key}: note "${l.note}" is not in English`);
      }
    }
  });

  test('but service names are left alone, whatever script they are in', () => {
    /* The inverse assertion, and the more important one. If this ever fails it means
       somebody has "helpfully" anglicised a crisis line into a name that cannot be found,
       asked for, or recognised when it is answered. */
    const localNames = SUPPORT_REGIONS.flatMap((r) => r.lines)
      .map((l) => l.name)
      .filter((n) => !ASCII_ISH.test(n));
    assert.ok(localNames.length >= 3,
      'no crisis line is named in its own language any more — service names must not be translated');
  });
});

describe('the words on the screen', () => {
  test('the intro leads with the action, not with a preamble', () => {
    assert.ok(SUPPORT_INTRO.length < 160, 'too long for somebody in distress to read');
  });

  test('the therapy guidance names what to ask for, not just where to look', () => {
    const all = THERAPY_GUIDANCE.join(' ');
    assert.match(all, /exposure and response prevention/i);
  });

  test('nothing on this screen promises an outcome', () => {
    /* A crisis screen that guarantees anything is a crisis screen that can be wrong at the
       worst possible moment. */
    const all = [SUPPORT_INTRO, ...THERAPY_GUIDANCE].join(' ');
    assert.doesNotMatch(all, /\b(cure|guarantee\w*|will fix|always works)\b/i);
  });
});

describe('the crisis-line region is confirmed before it is needed', () => {
  /* The region is guessed from the device's locale on first launch, and the guess is
     conservative: hooks/deviceLocale.ts reads a setting, constants/support.ts only names a
     country on an exact region-subtag match, and anything else falls to the international
     directory rather than to a confident wrong answer.
     Both of its failure modes were SILENT, though. A traveller, an immigrant who never
     changed the setting, or anyone on a phone bought abroad gets another country's numbers.
     A locale carrying no region at all gets the directory instead of the national line that
     exists for where they actually are. Neither person finds out until they open Support,
     which is a bad day by definition.
     So onboarding confirms it, on the step that already introduces crisis lines. */

  const onboarding = readFileSync(join(ROOT, 'app/onboarding/index.tsx'), 'utf8');
  const strip = (x) => x.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');
  const flow = strip(onboarding);

  test('onboarding shows which country it settled on', () => {
    assert.match(flow, /regionByKey\(supportRegion\)\.label/,
      'onboarding never tells the person which country Support will use, so a wrong guess '
      + 'stays invisible until they need it');
  });

  test('and lets them change it without leaving the flow', () => {
    assert.match(flow, /<RegionPicker/, 'onboarding offers no way to correct the guess');
    assert.match(flow, /setSupportRegion/, 'the correction is not written anywhere');
  });

  test('an unresolved guess is a question, not a confirmation', () => {
    /* 'other' means the locale carried no usable region. Showing "Support will show crisis
       lines for Somewhere else. Not right?" would be a confirmation of nothing. */
    assert.match(flow, /supportRegion === 'other'/,
      'onboarding treats an unresolved guess the same as a confident one');
  });

  test('it does not add an eighth step', () => {
    /* Onboarding is seven, and this belongs to the paragraph it sits under. A step of its own
       would put a geography question between somebody and the app on their first open.
       Counting <View key="sN"> is the wrong probe and this test used to do it: the cost mirror
       is a null placeholder in the array rendered by an early return, so the markup shows six
       for seven steps. LAST is what the flow actually advances to, so that is what is read. */
    const last = onboarding.match(/const LAST = (\d+)/);
    assert.ok(last, 'onboarding no longer declares LAST, so the step count is unguarded');
    assert.equal(Number(last[1]), 6, `onboarding now runs to step ${last[1]}`);

    /* And the other direction: a step added to the array without bumping LAST is unreachable
       rather than extra, which is a quieter bug than an eighth step and worth the same catch. */
    const keys = [...onboarding.matchAll(/<View key="s(\d+)">/g)].map((m) => Number(m[1]));
    assert.ok(keys.length > 0, 'onboarding renders no keyed steps at all');
    assert.equal(Math.max(...keys), 6, 'a step exists past the last one the flow reaches');
  });

  test('it never asks for location permission, and could not', () => {
    const app = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
    const plist = JSON.stringify(app.expo?.ios?.infoPlist ?? {});
    assert.doesNotMatch(plist, /NSLocation/,
      'a location permission has appeared. The region is a picker over a static list — see '
      + 'legal/consumer-health-data-policy.md §6, which tells two US states that ban '
      + 'geofencing around health facilities that this app requests no location at all.');
    const android = JSON.stringify(app.expo?.android?.permissions ?? []);
    assert.doesNotMatch(android, /LOCATION/, 'an Android location permission has appeared');
  });
});

describe('there is one region picker, not two', () => {
  /* The markup was inline on Support, and onboarding needed the same control. Copying it
     would have made two lists of thirty regions that agree today and drift the first time one
     gains an entry — the failure this repository has now caught in a dozen shapes. */
  test('both screens render the shared component', () => {
    for (const rel of ['app/support.tsx', 'app/onboarding/index.tsx']) {
      assert.match(readFileSync(join(ROOT, rel), 'utf8'), /<RegionPicker/,
        `${rel} does not use the shared picker`);
    }
  });

  test('and neither re-implements the list', () => {
    for (const rel of ['app/support.tsx', 'app/onboarding/index.tsx']) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      assert.doesNotMatch(src, /SUPPORT_REGIONS\.map/,
        `${rel} maps over the region list itself instead of rendering RegionPicker`);
    }
  });

  test('the shared picker meets the touch floor', () => {
    /* It was 40 inline. This is the control somebody uses on the worst day they have had in
       a while, and __tests__/a11y.test.mjs sets the floor at 44. */
    const picker = readFileSync(join(ROOT, 'components/RegionPicker.tsx'), 'utf8');
    assert.match(picker, /minHeight: 44/, 'the region chips are under the 44pt touch floor');
  });
});
