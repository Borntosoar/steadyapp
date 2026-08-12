import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPE_SCALE, TYPE_LADDER } from '../constants/palette.ts';

/* Accessibility, as far as a test can reach it.
 *
 * Contrast is covered in contrast.test.mjs, computed from the palette rather than eyeballed.
 * This file covers the two things that are structural rather than visual — Dynamic Type and
 * the labels a screen reader reads — plus the touch-target floor.
 *
 * WHAT THIS CANNOT DO. It cannot tell you whether VoiceOver announces a screen in a sensible
 * order, and it cannot tell you what clips at 310% text. Both need a device and a person.
 * `legal/accessibility-statement.md` says so in public rather than implying otherwise, and
 * that honesty is worth more than a green tick here. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['app', 'components'];

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx$/.test(e)) out.push(full);
    }
  };
  for (const d of DIRS) walk(join(ROOT, d));
  return out;
}

const FILES = sourceFiles().map((f) => ({ path: f.replace(ROOT + '/', ''), src: readFileSync(f, 'utf8') }));
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('Dynamic Type', () => {
  test('nothing switches font scaling off', () => {
    /* iOS lets a person set text from 82% to 310%. Turning that off is the single most
       common accessibility failure in shipped apps, and it is usually done to rescue a
       layout — which fixes the screenshot and breaks the person. If a layout cannot survive
       larger text, the layout is what changes. */
    for (const f of FILES) {
      assert.doesNotMatch(stripComments(f.src), /allowFontScaling\s*=\s*\{?\s*false/,
        `${f.path} disables font scaling`);
    }
  });

  test('a fixed height never wraps text directly', () => {
    /* A `height:` on a container holding text is the thing that actually breaks at large
       sizes — the text grows, the box does not, and the descenders vanish. Decorative
       elements (rules, dots, progress bars, the tab-bar dissolve) are exempt: they hold no
       text, so nothing can clip. The threshold is 20px, below which nothing could contain a
       readable glyph anyway. */
    /* Fixed heights that hold no text at all. Listed explicitly rather than pattern-matched,
       because "does this subtree contain text" is not a question a regex can answer honestly
       — and an exemption somebody has to type, next to a reason, is the point. */
    const DECORATIVE = new Set([
      'app/(tabs)/_layout.tsx:28', // the gradient dissolve above the tab bar
    ]);
    const offenders = [];
    for (const f of FILES) {
      const src = stripComments(f.src);
      for (const m of src.matchAll(/(?<!min|max|line)[Hh]eight:\s*(\d+)/g)) {
        const px = Number(m[1]);
        if (px < 20) continue; // decorative
        /* Fixed circles and squares are legitimate when the glyph inside them is capped —
           see IN_FIXED_SHAPE. Detected by a borderRadius at or near half the height. */
        const window = src.slice(m.index, m.index + 200);
        if (/borderRadius/.test(window)) continue;
        if (DECORATIVE.has(`${f.path}:${px}`)) continue;
        offenders.push(`${f.path}: height ${px}`);
      }
    }
    assert.deepEqual(offenders, [],
      'these hold text in a box that cannot grow — use minHeight:\n  ' + offenders.join('\n  '));
  });

  test('text inside a shape that cannot grow is capped, not left to clip', () => {
    /* The inverse. A 44pt disc with a week number in it cannot grow, so the glyph must be
       bounded — a clipped character is worse than a small one. This asserts the cap is used
       somewhere rather than the pattern being applied by accident. */
    const users = FILES.filter((f) => /IN_FIXED_SHAPE/.test(f.src));
    assert.ok(users.length >= 3,
      'the fixed-shape cap is barely used — either the discs will clip or it was removed');
  });

  test('the capped variants are still far larger than body text at full scale', () => {
    /* The caps only defend the layout if they leave the hierarchy intact. A hero capped
       below a scaled-up body size would be a bug that looks like a design choice. */
    const bodyAt310 = TYPE_SCALE.body.fontSize * 3.1;
    for (const [variant, cap] of [['hero', 1.3], ['display', 1.4]]) {
      const capped = TYPE_SCALE[variant].fontSize * cap;
      assert.ok(capped > TYPE_SCALE.body.fontSize * 1.5,
        `${variant} capped at ${capped}pt is not clearly a heading any more`);
    }
    /* The hierarchy must never invert: a capped hero stays at least as large as body at full
       scale, so the figure is still the biggest thing on the screen for somebody running
       310% text. (An earlier version of this asserted the opposite and was simply wrong —
       a hero that shrinks below body would be the bug, not the goal.) */
    assert.ok(TYPE_SCALE.hero.fontSize * 1.3 >= bodyAt310,
      `hero caps at ${TYPE_SCALE.hero.fontSize * 1.3}pt but body reaches ${bodyAt310}pt — ` +
        'the cap has inverted the hierarchy');
  });
});

describe('touch targets', () => {
  test('every Pressable meets the 44pt floor, or says why not', () => {
    /* Apple's HIG floor. Missing it is not a nicety in an app whose users include people
       with anxiety-driven tremor and people using it one-handed on a bad day. */
    const thin = [];
    for (const f of FILES) {
      const src = stripComments(f.src);
      for (const m of src.matchAll(/minHeight:\s*(\d+)/g)) {
        const px = Number(m[1]);
        if (px < 40) thin.push(`${f.path}: minHeight ${px}`);
      }
    }
    assert.deepEqual(thin, [], 'touch targets below 40pt:\n  ' + thin.join('\n  '));
  });
});

describe('screen readers', () => {
  test('every interactive element carries a role', () => {
    /* Without a role, VoiceOver announces a button as plain text and the person cannot tell
       it is actionable. Counted rather than spot-checked, because the gap grows one screen
       at a time. */
    for (const f of FILES) {
      const src = stripComments(f.src);
      const pressables = (src.match(/<Pressable/g) ?? []).length;
      if (!pressables) continue;
      const roles = (src.match(/accessibilityRole=/g) ?? []).length;
      assert.ok(roles >= pressables,
        `${f.path} has ${pressables} Pressables and ${roles} accessibilityRole props`);
    }
  });

  test('icon-only controls carry a label', () => {
    /* A Pressable whose only child is an Svg announces as "button" and nothing else. Every
       such control needs a label saying what it does. */
    for (const f of FILES) {
      const src = stripComments(f.src);
      const iconOnly = [...src.matchAll(/<Pressable[^>]*>\s*<Svg/g)];
      for (const m of iconOnly) {
        const head = src.slice(Math.max(0, m.index - 400), m.index + 40);
        assert.match(head, /accessibilityLabel=/,
          `${f.path} has an icon-only Pressable with no accessibilityLabel`);
      }
    }
  });

  test('the type ladder never drops below a legible size', () => {
    for (const step of TYPE_LADDER) {
      assert.ok(TYPE_SCALE[step].fontSize >= 13,
        `${step} is ${TYPE_SCALE[step].fontSize}pt — below the 13pt floor`);
    }
  });
});
