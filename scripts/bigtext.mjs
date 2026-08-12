#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/* Simulate iOS Dynamic Type on the web build, and find what clips.
 *
 * iOS lets a person set text anywhere from 82% to 310%. That setting is invisible to the
 * developer, which is why Dynamic Type is the most common accessibility failure in shipped
 * apps: it only ever breaks for somebody else.
 *
 * HOW. react-native-web emits fixed px, so the browser's own font-size setting does nothing.
 * This multiplies every rendered font-size and line-height, then looks for elements whose
 * content overflows a box that hides overflow.
 *
 * WHAT IT CANNOT SEE. `maxFontSizeMultiplier` is a React Native prop, not CSS, so this
 * harness blows past every cap the app sets and reports the UNCAPPED worst case. It is
 * strictly harsher than a real device, which is the useful direction to be wrong in. Read
 * the output beside the MAX_SCALE table in components/ui.tsx.
 *
 * Elements DESIGNED to truncate — anything with an ellipsis or a line clamp, which is how
 * `numberOfLines` renders — are excluded. Those are a decision, not a defect, and counting
 * them buries the real findings in noise.
 *
 * It cannot tell you whether VoiceOver reads a screen in a sensible order. Nothing short of
 * a device and a person can.
 *
 *   node scripts/bigtext.mjs                    # 2.2x
 *   SCALE=3.1 node scripts/bigtext.mjs          # iOS maximum
 *   BASE=http://localhost:8081 node scripts/bigtext.mjs
 *
 * Needs a built web export being served; see scripts/screenshots.mjs for the same setup. */

async function loadPlaywright() {
  for (const c of [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.mjs',
  ]) {
    if (!c) continue;
    try {
      return await import(c.startsWith('/') ? pathToFileURL(c).href : c);
    } catch {
      /* try the next one */
    }
  }
  console.error('Could not load playwright. See scripts/screenshots.mjs for the options.');
  process.exit(1);
}

const { chromium } = await loadPlaywright();

const BASE = process.env.BASE ?? 'http://localhost:8121';
const SCALE = Number(process.env.SCALE ?? 2.2);
const OUT = process.env.OUT ?? join(process.cwd(), 'screenshots');
const ROUTES = ['/', '/progress', '/checkin', '/learn', '/support', '/practice'];

mkdirSync(OUT, { recursive: true });

const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
const day = (d) => iso(d).slice(0, 10);

/** Enough state that the screens have something to lay out. Invented, and mundane on
 *  purpose — see the note in scripts/screenshots.mjs. */
const seed = {
  profile: { firstName: 'Sam', onboardedAt: iso(30), disclaimerAcceptedAt: iso(30), supportRegion: 'ca' },
  baseline: { capturedAt: iso(30), preoccupationMinutes: 240, urge: 8, avoidance: 'significant', suds: 8 },
  checkIns: [0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
    id: 'c' + n, date: day(n), preoccupationMinutes: 120, urge: 5, avoidance: 'small', suds: 4,
  })),
  urgeLogs: [0, 2].map((n) => ({
    id: 'u' + n, date: iso(n), trigger: 'Shop window', wantedTo: 'Check',
    intensityBefore: 7, intensityAfter: 4, resisted: true,
  })),
  thoughtRecords: [], mirrorSessions: [], experiments: [],
  practice: [0, 1, 2, 3].map((n) => ({ id: 'p' + n, date: day(n), kind: 'checkin' })),
  streak: { current: 4, longest: 9, freezesRemaining: 2, lastPracticeDate: day(0), frozenDates: [] },
  protocol: { currentWeek: 3, weekPracticeDates: [day(0)], completedWeeks: [1, 2], avoidedConditions: [] },
  readModules: ['m1'], moments: {},
  entitlement: { source: 'purchase', plan: 'yearly', expiresAt: null, verifiedAt: iso(1) },
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.evaluate(
  (s) => localStorage.setItem('steady.state.v2', JSON.stringify({ v: 4, data: s })),
  seed
);

let total = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);

  const result = await page.evaluate((scale) => {
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs) el.style.fontSize = `${fs * scale}px`;
      const lh = parseFloat(cs.lineHeight);
      if (lh) el.style.lineHeight = `${lh * scale}px`;
    }

    const clipped = [];
    for (const el of document.querySelectorAll('div,span')) {
      const cs = getComputedStyle(el);
      if (cs.overflowY !== 'hidden') continue;
      // Designed to truncate — `numberOfLines` renders as one of these. Not a defect.
      if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none') continue;
      if (el.scrollHeight > el.clientHeight + 2) {
        clipped.push((el.innerText || '').slice(0, 40).replace(/\s+/g, ' ').trim());
      }
    }
    return {
      clipped: clipped.filter(Boolean).slice(0, 5),
      overflowsSideways: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  }, SCALE);

  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(OUT, `bigtext-${SCALE}x-${route.replace(/\W/g, '_') || 'home'}.png`),
  });

  total += result.clipped.length;
  console.log(
    `${route.padEnd(11)} clipped:${String(result.clipped.length).padEnd(3)}` +
      ` sideways:${result.overflowsSideways}` +
      (result.clipped.length ? `  → ${result.clipped.join(' | ')}` : '')
  );
}

console.log(`\n${SCALE}x · ${total} clipped region(s) · page errors: ${errors.length || 'none'}`);
await browser.close();
if (total > 0 || errors.length) process.exitCode = 1;
