#!/usr/bin/env node
/* The app icon.
 *
 * A hard submission blocker: app.json sets an adaptive-icon background colour and no icon at
 * all, so there is nothing to upload. Generated rather than drawn because it needs to exist
 * at several sizes, stay in sync with the palette, and be regenerable when either changes.
 *
 * WHAT IT IS. A single line settling — the same idea as the product. Appearance worry is a
 * jagged line; the work is the same line becoming level. It is drawn as a descending curve
 * that flattens, on the app's own ground, with nothing else in the frame.
 *
 * WHAT IT DELIBERATELY IS NOT. No face, no mirror, no silhouette, no body, no eye. Every
 * obvious icon for this category is a picture of the thing the app refuses to be about, and
 * an icon showing a face on somebody's home screen also tells anyone glancing at their phone
 * what they are dealing with. This has to sit on a home screen without disclosing anything —
 * SAFETY.md's concealment argument applies to the icon as much as to a referral scheme.
 *
 * No text either: at 60pt a word is unreadable, and Apple rejects icons that rely on it.
 *
 *   node scripts/icon.mjs           # writes assets/icon.png and the variants
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');

/* From constants/palette.ts. The deep ground, because an icon sits against an unknown
   wallpaper and a pale one disappears against half of them. */
const GROUND_TOP = '#2F4529';
const GROUND_BOTTOM = '#16211A';
const LINE = '#C6DEA6';

/** The settling line. Starts jagged, ends level — drawn as one path so it reads as one
 *  movement rather than a chart. */
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${GROUND_TOP}"/>
      <stop offset="1" stop-color="${GROUND_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <!-- A damped oscillation resolving into a flat line. The amplitude has to fall HARD —
       roughly halving each swing — or at 60pt it reads as a scribble rather than as
       something settling, which is the entire idea. The straight run at the end is the
       payoff and needs to be long enough to register as deliberate. -->
  <path
    d="M 148 512
       C 200 190, 268 190, 320 512
       C 366 800, 430 800, 478 512
       C 516 356, 572 356, 610 512
       C 640 632, 688 632, 718 512
       C 740 452, 778 452, 800 512
       L 876 512"
    fill="none"
    stroke="${LINE}"
    stroke-width="62"
    stroke-linecap="round"
    stroke-linejoin="round"/>
</svg>`;

/* iOS wants one 1024 marketing icon; Expo generates the rest. The extra sizes are for the
   web manifest and for looking at it small, which is the only size that matters — an icon
   that only works at 1024 is an icon nobody has checked. */
const SIZES = [
  ['icon.png', 1024],
  ['adaptive-icon.png', 1024],
  ['favicon.png', 48],
  ['icon-180.png', 180],
  ['icon-120.png', 120],
  ['icon-60.png', 60],
];

async function loadPlaywright() {
  for (const c of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
    if (!c) continue;
    try {
      return await import(c.startsWith('/') ? pathToFileURL(c).href : c);
    } catch { /* next */ }
  }
  console.error('Could not load playwright. See scripts/screenshots.mjs for the options.');
  process.exit(1);
}

const { chromium } = await loadPlaywright();
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

for (const [file, size] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: size, height: size } });
  const page = await ctx.newPage();
  /* No transparency anywhere: iOS rejects an icon with an alpha channel outright, and the
     rounding is applied by the system rather than by the asset. */
  await page.setContent(
    `<body style="margin:0;background:${GROUND_BOTTOM}">${svg(size)}</body>`,
    { waitUntil: 'load' }
  );
  await page.screenshot({ path: join(OUT, file), omitBackground: false });
  await ctx.close();
  console.log(`${file}  ${size}x${size}`);
}

/* The splash uses the same mark on the same ground, so launching the app is continuous with
   tapping the icon rather than a cut to a different-looking screen. */
writeFileSync(join(OUT, 'splash-icon.svg'), svg(1024).trim());

await browser.close();
console.log(`\nWrote ${SIZES.length} icons to assets/`);
