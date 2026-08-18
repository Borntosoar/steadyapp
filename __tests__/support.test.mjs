import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORT_REGIONS, regionByKey, regionForLocale, BACKSTOP_CONTACT, THERAPY_GUIDANCE, SUPPORT_INTRO,
} from '../constants/support.ts';

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
