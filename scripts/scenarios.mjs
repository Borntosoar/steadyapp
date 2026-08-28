#!/usr/bin/env node
/* Scenario simulation — the app under conditions nobody writes an example test for.
 *
 * The unit suite proves the pure functions. This drives the REAL app in a browser through
 * states a person can actually arrive in: a corrupted store, a backup from a future build, a
 * subscription that lapsed, a hand-edited week, a hostile deep link. Each scenario asserts
 * the app is still usable and — the invariant that outranks all others — that a crisis line
 * is still reachable.
 *
 * Every scenario runs in its own browser context. Sharing one races the app's own debounced
 * writes against the seeding, which has already produced a false green in this project.
 *
 *   npx expo start --web --port 8081        # or a built export on any port
 *   node scripts/scenarios.mjs              # BASE= to point elsewhere, OUT= for screenshots
 *
 * MUTATION-VERIFIED, because a scenario suite that has never failed proves nothing. Reverting
 * the currentWeek clamp fails S3 and S4; neutering the global Support control fails every
 * scenario that asserts a crisis line is reachable (S1, S2, S4, S5, S7, S9) and leaves the
 * three that do not check it green. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BASE ?? 'http://localhost:8081';
const OUT = process.env.OUT ?? process.cwd();
const KEY = 'steady.state.v2';
const results = [];

const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
const goodState = (over = {}) => ({
  profile: { firstName: 'Sam', onboardedAt: iso(40), disclaimerAcceptedAt: iso(40), supportRegion: 'us' },
  baseline: { capturedAt: iso(40), preoccupationMinutes: 200, urge: 7, avoidance: 'small', suds: 7 },
  checkIns: [], urgeLogs: [], thoughtRecords: [], mirrorSessions: [], experiments: [],
  practice: [], commitments: [], tracks: {}, readModules: [], moments: {}, measures: [],
  streak: { current: 3, longest: 5, freezesRemaining: 2, lastPracticeDate: null, frozenDates: [] },
  protocol: { currentWeek: 3, weekPracticeDates: [], completedWeeks: [1, 2], avoidedConditions: [] },
  entitlement: { source: 'purchase', plan: 'yearly', expiresAt: null, verifiedAt: iso(1) },
  ...over,
});

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});

/** Run one scenario in a clean context. `seed` is written verbatim to localStorage. */
async function scenario(name, { raw, seed, run }) {
  const errs = [];
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 }, colorScheme: 'light', reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(`pageerror: ${String(e).slice(0, 160)}`));
  page.on('console', (m) => {
    const x = m.text();
    if (m.type() === 'error' && !/non-boolean attribute|Failed to load resource/.test(x)) {
      errs.push(`console: ${x.slice(0, 140)}`);
    }
  });
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const payload = raw !== undefined ? raw : (seed !== undefined ? JSON.stringify({ v: 5, data: seed }) : null);
    await page.evaluate(([k, p]) => {
      localStorage.clear();
      if (p !== null) localStorage.setItem(k, p);
    }, [KEY, payload]);
    await run(page, errs);
  } catch (e) {
    errs.push(`threw: ${String(e).slice(0, 200)}`);
  }
  await ctx.close();
  results.push({ name, errs });
  console.log(`${errs.length ? 'FAIL' : 'PASS'}  ${name}${errs.length ? '\n      ' + errs.join('\n      ') : ''}`);
}

const text = async (p) => (await p.locator('body').innerText());
const settle = (p, ms = 2400) => p.waitForTimeout(ms);

/** The invariant that outranks everything: a crisis line is reachable. */
async function crisisReachable(page, errs, from) {
  await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle' });
  await settle(page);
  const support = page.getByText('Support', { exact: true }).first();
  if (await support.count() === 0) { errs.push(`no Support control on ${from}`); return; }
  await support.click().catch((e) => errs.push(`${from}: cannot tap Support: ${e.message.slice(0, 60)}`));
  await settle(page, 2000);
  const t = await text(page);
  /* A real, dialable number — not merely the word "crisis". */
  if (!/988|116 123|1-800|Text HOME|741741|findahelpline/i.test(t)) {
    errs.push(`${from}: Support opened with no reachable number: ${t.slice(0, 120).replace(/\n/g, ' ')}`);
  }
  if (/Anneal\+|Unlock|Subscribe|Upgrade|Start free trial/i.test(t)) {
    errs.push(`${from}: a billing offer appeared on the crisis screen`);
  }
}

/* ---------- S1: a store containing invalid JSON ---------- */
await scenario('S1  corrupt store — invalid JSON', {
  raw: '{"v":5,"data":{ this is not json',
  async run(page, errs) {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await settle(page);
    const t = await text(page);
    if (t.trim().length < 30) errs.push('the app rendered nothing at all');
    /* Must NOT silently present an empty journal — that is the read-failure-becomes-data-loss
       path lib/storage.ts is built to prevent. */
    const quarantined = await page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.startsWith('steady.unreadable.')));
    const original = await page.evaluate((k) => localStorage.getItem(k), KEY);
    if (!quarantined && original === null) errs.push('the unreadable payload was discarded without quarantine');
    await page.screenshot({ path: `${OUT}/sc-s1.png` });
    await crisisReachable(page, errs, '/');
  },
});

/* ---------- S2: a backup written by a NEWER build ---------- */
await scenario('S2  payload from a future build (v99)', {
  raw: JSON.stringify({ v: 99, data: goodState() }),
  async run(page, errs) {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await settle(page);
    const t = await text(page);
    if (t.trim().length < 30) errs.push('the app rendered nothing');
    /* The v99 bytes must survive. Overwriting them with a v5 normalise is the exact data
       loss isFromNewerBuild exists to stop. */
    const after = await page.evaluate((k) => localStorage.getItem(k), KEY);
    const quarantined = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith('steady.unreadable.')));
    const preserved = (after && after.includes('"v":99')) || quarantined.length > 0;
    if (!preserved) errs.push('a v99 payload was neither preserved nor quarantined — data lost on downgrade');
    await crisisReachable(page, errs, '/');
  },
});

/* ---------- S3: a hand-edited week far outside the protocol ---------- */
await scenario('S3  hand-edited protocol week (999)', {
  seed: goodState({ protocol: { currentWeek: 999, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] } }),
  async run(page, errs) {
    await page.goto(`${BASE}/practice`, { waitUntil: 'networkidle' });
    await settle(page);
    const t = await text(page);
    if (/999/.test(t)) errs.push('the Practice screen shows week 999');
    const m = t.match(/Week (\-?\d+) of 12/);
    if (!m) errs.push(`no legible week on Practice: ${t.slice(0, 100).replace(/\n/g, ' ')}`);
    else {
      const w = Number(m[1]);
      if (w < 1 || w > 12) errs.push(`Practice shows week ${w}, outside 1..12`);
    }
    await page.screenshot({ path: `${OUT}/sc-s3.png` });
  },
});

/* ---------- S4: a negative week, which used to pass the free-tier clamp ---------- */
await scenario('S4  negative protocol week (-5)', {
  seed: goodState({
    protocol: { currentWeek: -5, weekPracticeDates: [], completedWeeks: [], avoidedConditions: [] },
    entitlement: { source: 'none', plan: null, expiresAt: null, verifiedAt: null },
  }),
  async run(page, errs) {
    await page.goto(`${BASE}/practice`, { waitUntil: 'networkidle' });
    await settle(page);
    const t = await text(page);
    if (/Week -\d/.test(t)) errs.push('the Practice screen shows a negative week');
    await crisisReachable(page, errs, '/practice');
  },
});

/* ---------- S5: the subscription lapsed ---------- */
await scenario('S5  lapsed subscription', {
  seed: goodState({
    entitlement: { source: 'purchase', plan: 'yearly', expiresAt: iso(3), verifiedAt: iso(3) },
  }),
  async run(page, errs) {
    for (const route of ['/', '/grounding', '/support', '/checkin', '/still', '/measure']) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await settle(page, 1800);
      const t = await text(page);
      if (t.trim().length < 20) errs.push(`${route} rendered nothing for a lapsed user`);
      if (/Unlock|Subscribe|Start free trial/i.test(t) && route !== '/paywall') {
        errs.push(`${route} shows a purchase prompt to a lapsed user — this route is free forever`);
      }
    }
    await crisisReachable(page, errs, '/');
  },
});

/* ---------- S6: hostile deep links ---------- */
await scenario('S6  hostile deep links', {
  seed: goodState(),
  async run(page, errs) {
    const links = [
      '/still?mode=__proto__', '/still?mode=constructor', '/still?mode=', '/still?mode=999',
      '/measure?milestone=__proto__', '/measure?milestone=-1', '/measure?milestone=1e308',
      '/grounding?mode=__proto__', '/grounding?tool=constructor',
      '/track/__proto__', '/track/does-not-exist',
      '/module/__proto__', '/module/nope',
    ];
    for (const l of links) {
      await page.goto(`${BASE}${l}`, { waitUntil: 'networkidle' });
      await settle(page, 1500);
      const t = await text(page);
      if (t.trim().length < 20) errs.push(`${l} rendered a blank screen`);
    }
  },
});

/* ---------- S7: two taps to a crisis line, from everywhere ---------- */
await scenario('S7  crisis reachable from every screen', {
  seed: goodState({ entitlement: { source: 'none', plan: null, expiresAt: null, verifiedAt: null } }),
  async run(page, errs) {
    for (const route of ['/', '/practice', '/progress', '/learn', '/checkin', '/urges',
      '/journal', '/still', '/measure', '/plan', '/paywall', '/game/curveball']) {
      await crisisReachable(page, errs, route);
    }
  },
});

/* ---------- S8: the day-30 re-measure actually comes due ---------- */
await scenario('S8  day-30 re-measure is offered', {
  seed: goodState({
    measures: [{
      id: 'b', takenAt: iso(31),
      phq8: [1, 1, 1, 1, 1, 1, 1, 1], gad7: [1, 1, 1, 1, 1, 1, 1].slice(0, 7),
      milestone: null,
    }],
  }),
  async run(page, errs) {
    await page.goto(`${BASE}/measure?milestone=30`, { waitUntil: 'networkidle' });
    await settle(page);
    const t = await text(page);
    if (!/Same fifteen questions/.test(t)) {
      errs.push(`the day-30 ask did not render its own copy: ${t.slice(0, 110).replace(/\n/g, ' ')}`);
    }
    await page.screenshot({ path: `${OUT}/sc-s8.png` });
  },
});

/* ---------- S9: a completely empty store ---------- */
await scenario('S9  first launch, nothing stored', {
  raw: undefined,
  async run(page, errs) {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await settle(page);
    const t = await text(page);
    if (t.trim().length < 30) errs.push('a fresh install rendered nothing');
    /* Crisis support must be reachable BEFORE onboarding is finished — somebody can install
       this app in the state that makes them install this app. */
    await crisisReachable(page, errs, '/onboarding');
  },
});

await browser.close();

const failed = results.filter((r) => r.errs.length);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
process.exit(failed.length ? 1 : 0);
