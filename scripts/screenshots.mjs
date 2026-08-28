#!/usr/bin/env node
/* App Store screenshots, and the visual check before a change ships.
 *
 * WHY THIS IS IN THE REPO. It existed as throwaway scripts in a scratch directory, which
 * meant every visual verification started by rewriting the seed data, and the seed data is
 * most of the work: the app shows almost nothing useful until somebody has a baseline, a
 * fortnight of check-ins and a few urges behind them. Uncommitted, it also could not run in
 * CI and could not be trusted to be the same twice.
 *
 * WHAT IT IS NOT. This is not a replacement for looking at the app on a phone, and the
 * output is the WEB build rendered in Chromium — close to iOS but not identical (fonts,
 * blur, and the safe-area insets all differ). It is the fast loop, not the final word.
 *
 * SEED DATA IS FICTIONAL AND SAYS SO. The strings below are invented for a demo and must
 * stay obviously invented. Screenshots on a store listing showing plausible-looking private
 * writing about somebody's body would be a bad thing to publish even if it were fabricated,
 * so what appears is deliberately mundane.
 *
 *   node scripts/screenshots.mjs                 # default set, light + dark
 *   node scripts/screenshots.mjs --store         # App Store sizes, light only
 *   node scripts/screenshots.mjs --out ./shots   # somewhere else
 *   node scripts/screenshots.mjs --unentitled    # paywall shows the offer, not "you have it"
 *   node scripts/screenshots.mjs --full          # whole scroll height, for review not listing
 *
 * Requires a built web export and a static server:
 *   npx expo export -p web --output-dir dist && npx serve -s dist -l 8091
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const BASE = opt('base', 'http://localhost:8091');
const OUT = opt('out', join(process.cwd(), 'screenshots'));
const STORE = flag('store');

/* The purchase screen cannot be reached with the default seed, because that seed is entitled
   so the paid surfaces render — and an entitled user sees "You have Anneal+", not the offer.
   That left the single highest-leverage screen in the app unscreenshottable, which is a poor
   thing to be unable to look at. `--unentitled` seeds source 'none' instead.

   Not the default: a store listing whose screenshots are mostly paywall sells nothing, and
   Guideline 3.1.2 is happier when the listing leads with the product. */
const UNENTITLED = flag('unentitled');

/* Capture a long screen in successive frames rather than one viewport. Useless for a store
   listing, which wants exact device frames, but it is the only way to review a screen that
   runs past the fold — on the paywall, everything below it is the pricing and the legal
   links, which is the part worth checking.

   NOT Playwright's `fullPage`. React Native Web scrolls inside a div rather than the
   document, so the document is exactly one viewport tall: `fullPage: true` returns a normal
   screenshot and reports success, which is the worst way for an option to fail. This finds
   the real scroller and steps through it. */
const FULL = flag('full');
const MAX_FRAMES = 8;

/* App Store Connect accepts one 6.9" set and derives the rest, as of the 2024 change. The
   6.5" entry stays because a listing that predates that still has the slot, and regenerating
   both costs nothing. Points, not pixels — deviceScaleFactor does the rest. */
const DEVICES = STORE
  ? [
      { name: '6.9in', width: 440, height: 956, scale: 3 }, // 1320 x 2868
      { name: '6.5in', width: 414, height: 896, scale: 3 }, // 1242 x 2688
    ]
  : [{ name: 'iphone', width: 393, height: 852, scale: 2 }];

const SCHEMES = STORE ? ['light'] : ['light', 'dark'];

const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
const day = (d) => iso(d).slice(0, 10);

/** A person four weeks in who is doing the work and whose number has moved. Everything here
 *  is invented. */
const seed = () => ({
  profile: {
    firstName: 'Sam',
    onboardedAt: iso(30),
    disclaimerAcceptedAt: iso(30),
    supportRegion: 'us',
  },
  baseline: { capturedAt: iso(30), preoccupationMinutes: 240, urge: 8, avoidance: 'significant', suds: 8 },
  checkIns: Array.from({ length: 16 }, (_, n) => ({
    id: `c${n}`,
    date: day(n),
    preoccupationMinutes: 130 - (n % 5) * 12,
    urge: 4 + (n % 3),
    avoidance: n % 4 === 0 ? 'none' : 'small',
    suds: 3 + (n % 4),
  })),
  urgeLogs: [0, 2, 4, 6, 9].map((n) => ({
    id: `u${n}`,
    date: iso(n),
    trigger: 'Passed a shop window',
    wantedTo: 'Stop and check',
    intensityBefore: 7,
    intensityAfter: 3,
    resisted: true,
  })),
  thoughtRecords: [0, 5].map((n) => ({
    id: `t${n}`,
    date: day(n),
    situation: 'A meeting at work',
    emotion: 'anxious',
    emotionIntensity: 75,
    automaticThought: 'Everyone was looking',
    distortions: ['Mind reading'],
    evidenceFor: 'It felt that way',
    evidenceAgainst: 'Nobody said anything, and the meeting ran normally',
    balancedThought: 'It felt true and it was not checkable',
    reRatedIntensity: 40,
  })),
  mirrorSessions: [2, 6].map((n) => ({
    id: `m${n}`, date: day(n), phase: 1, durationSeconds: 90, sudsBefore: 7, sudsAfter: 4, completed: true,
  })),
  experiments: [],
  practice: [0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15].map((n) => ({
    id: `p${n}`, date: day(n), kind: 'checkin',
  })),
  streak: { current: 4, longest: 11, freezesRemaining: 2, lastPracticeDate: day(0), frozenDates: [] },
  protocol: {
    currentWeek: 4,
    weekPracticeDates: [day(0), day(1), day(2)],
    completedWeeks: [1, 2, 3],
    avoidedConditions: [],
  },
  readModules: ['m1', 'm2', 'm3'],
  /* Two of the seven done, so the track overview renders with real state: filled seedling
     dots, a finished row, the next one outlined and the rest dimmed. Seeded by day id rather
     than by index, because that is how lib/track.ts stores it. */
  tracks: { breakup: { startedAt: iso(9), done: ['getting-through', 'what-narrowed'] } },
  moments: {},
  /* Entitled, so the paid surfaces render. A store listing showing a paywall on every screen
     sells nothing. `--unentitled` flips this to show the purchase screen instead. */
  entitlement: UNENTITLED
    ? { source: 'none', plan: null, expiresAt: null, verifiedAt: null }
    : { source: 'purchase', plan: 'yearly', expiresAt: null, verifiedAt: iso(1) },
});

/** Route, filename, and how long to let the artwork settle. */
const SHOTS = [
  { route: '/', name: '01-today' },
  { route: '/progress', name: '02-progress' },
  { route: '/checkin', name: '03-checkin' },
  { route: '/urges', name: '04-urges' },
  { route: '/grounding', name: '05-calm' },
  { route: '/learn', name: '06-learn' },
  { route: '/practice', name: '07-practice' },
  { route: '/support', name: '08-support' },
  { route: '/journal', name: '09-journal' },
  { route: '/paywall', name: '10-paywall' },
  { route: '/track/breakup', name: '11-track' },
  { route: '/mirror', name: '12-mirror' },
  { route: '/plan', name: '13-plan' },
  { route: '/measure', name: '18-measure' },
  { route: '/still', name: '19-still' },
  { route: '/game/curveball', name: '14-curveball' },
  { route: '/game/toward', name: '15-toward' },
  { route: '/game/ballast', name: '16-ballast' },
  { route: '/game/groundwork', name: '17-groundwork' },
];

/* THIS LIST DRIFTED, WHICH IS WHY THERE IS A TEST. The four games, the mirror and the
   relapse plan all shipped while it still named eleven screens, so the one tool that exists
   to look at the app could not see a third of it — and nobody found out, because a list
   that is too short does not fail, it just shows less. __tests__/screens.test.mjs derives
   the routes from app/ and requires each one to be listed or deliberately excluded. */

const chromiumPath =
  process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Playwright is not a dependency of this app and should not become one — it would be a large
   addition to the manifest that the import allowlist governs, for a tool that never ships.
   So resolve it from wherever it happens to be: a local install, a global one, or a path
   given explicitly. NODE_PATH does not apply to ESM imports, which is the trap here. */
async function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.mjs',
    '/usr/lib/node_modules/playwright/index.mjs',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      return await import(c.startsWith('/') ? pathToFileURL(c).href : c);
    } catch {
      /* try the next one */
    }
  }
  console.error(
    'Could not load playwright. Install it (`npm i -D playwright`) or set PLAYWRIGHT_MODULE\n' +
      'to the path of its index.mjs. It is intentionally not a dependency of this app.'
  );
  process.exit(1);
}

const { pathToFileURL } = await import('node:url');
const { chromium } = await loadPlaywright();

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromiumPath,
  args: ['--no-sandbox'],
});

let failures = 0;

for (const device of DEVICES) {
  for (const scheme of SCHEMES) {
    const ctx = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.scale,
      colorScheme: scheme,
      reducedMotion: 'reduce', // deterministic frames; the app honours it via useReducedMotion
    });
    const page = await ctx.newPage();

    /* Page errors are collected rather than ignored. A screenshot run that silently captures
       a broken screen is worse than one that fails, because the broken screen is what ends
       up on the listing. */
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      (s) => localStorage.setItem('steady.state.v2', JSON.stringify({ v: 4, data: s })),
      seed()
    );

    for (const shot of SHOTS) {
      await page.goto(BASE + shot.route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2200);
      const file = join(OUT, `${device.name}-${scheme}-${shot.name}.png`);
      if (FULL) {
        const steps = await page.evaluate((cap) => {
          const scrollable = [...document.querySelectorAll('*')].filter((el) => {
            const oy = getComputedStyle(el).overflowY;
            return el.scrollHeight > el.clientHeight + 8 && (oy === 'auto' || oy === 'scroll');
          });
          if (!scrollable.length) return 1;
          const el = scrollable.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
          el.setAttribute('data-shot-scroller', '');
          return Math.min(cap, Math.ceil(el.scrollHeight / el.clientHeight));
        }, MAX_FRAMES);

        for (let i = 0; i < steps; i += 1) {
          await page.evaluate((n) => {
            const el = document.querySelector('[data-shot-scroller]');
            if (el) el.scrollTop = n * el.clientHeight;
          }, i);
          await page.waitForTimeout(500);
          const part = file.replace(/\.png$/, steps > 1 ? `-${i + 1}.png` : '.png');
          await page.screenshot({ path: part });
        }
        process.stdout.write(`${device.name}/${scheme}  ${shot.name} (${steps} frames)\n`);
        continue;
      }
      await page.screenshot({ path: file });
      process.stdout.write(`${device.name}/${scheme}  ${shot.name}\n`);
    }

    if (errors.length) {
      failures += errors.length;
      console.error(`\n  page errors in ${device.name}/${scheme}:`);
      for (const e of new Set(errors)) console.error('    ' + e);
    }

    await ctx.close();
  }
}

await browser.close();

console.log(`\nWrote ${DEVICES.length * SCHEMES.length * SHOTS.length} screenshots to ${OUT}`);
if (failures) {
  console.error(`\n${failures} page error(s) during capture — do not ship these images.`);
  process.exit(1);
}
