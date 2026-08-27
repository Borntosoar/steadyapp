import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* The visual check has to be able to see the whole app.
 *
 * scripts/screenshots.mjs is the fast loop before a change ships, and its route list is
 * hand-written. It drifted: four games, the mirror and the relapse plan all shipped while it
 * still named eleven screens, so a third of the app was invisible to the only tool that
 * looks at it. Nothing failed, because a list that is too short does not fail — it just
 * quietly shows less, which is the exact shape of every stale guard in this repository.
 *
 * So the routes are derived from app/ here and the list is required to match. */

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

/** Every file route under app/, as the URL expo-router serves it at. */
function routesFromApp() {
  return walk(join(ROOT, 'app'))
    .filter((p) => /\.tsx$/.test(p))
    .map((p) => p.slice(join(ROOT, 'app').length + 1).replace(/\.tsx$/, ''))
    /* Layouts render other routes rather than being one. */
    .filter((r) => !/(^|\/)_layout$/.test(r))
    /* (tabs) is a routing group, not a path segment, and index is the group's root. */
    .map((r) => r.replace(/\(tabs\)\//, '').replace(/(^|\/)index$/, '$1'))
    .map((r) => (r === '' ? '/' : `/${r.replace(/\/$/, '')}`))
    .sort();
}

/* Screens the shot list is allowed not to carry, each with the reason. Anything else that is
   missing is drift, not a decision. Kept here rather than in the script so that excluding a
   screen is a deliberate edit to a test rather than a quiet omission from a list. */
const EXCLUDED = new Map([
  ['/onboarding', 'runs once on a fresh install; covered by __tests__/support.test.mjs and a browser walk'],
  ['/onboarding/survey', 'reached only from within onboarding'],
  ['/module/[slug]', 'dynamic; /learn shows the index and a module is a content shot, not a screen shot'],
  ['/track/[id]', 'dynamic; the list names /track/breakup concretely instead'],
]);

const shots = readFileSync(join(ROOT, 'scripts/screenshots.mjs'), 'utf8');
const listed = [...shots.matchAll(/\{\s*route:\s*'([^']+)'/g)].map((m) => m[1]);

describe('the screenshot script can see the whole app', () => {
  test('every route is either shot or deliberately excluded', () => {
    const covered = new Set(listed);
    const missing = routesFromApp().filter((r) => {
      if (EXCLUDED.has(r)) return false;
      if (covered.has(r)) return false;
      /* A dynamic route is covered by any concrete instance of it: /track/[id] by
         /track/breakup. Match on the static prefix rather than on the literal path. */
      const prefix = r.replace(/\/\[[^\]]+\]$/, '/');
      return !r.includes('[') || ![...covered].some((c) => c.startsWith(prefix));
    });
    assert.deepEqual(missing, [],
      `these screens exist but the visual check never renders them: ${missing.join(', ')}. `
      + 'Add them to SHOTS in scripts/screenshots.mjs, or to EXCLUDED here with the reason.');
  });

  test('and does not name routes that no longer exist', () => {
    /* The other direction. A renamed screen leaves a shot pointing at a 404, and expo-router
       serves its not-found page rather than erroring, so the run stays green and produces a
       picture of nothing. */
    const real = new Set(routesFromApp());
    const dead = listed.filter((r) => {
      if (real.has(r)) return false;
      /* Concrete instances of dynamic routes: /track/breakup satisfies /track/[id]. */
      return ![...real].some((x) => {
        const rx = new RegExp(`^${x.replace(/\[[^\]]+\]/g, '[^/]+')}$`);
        return rx.test(r);
      });
    });
    assert.deepEqual(dead, [], `the shot list points at routes that do not exist: ${dead.join(', ')}`);
  });

  test('every exclusion carries a reason', () => {
    for (const [route, why] of EXCLUDED) {
      assert.ok(why && why.length > 20, `${route} is excluded without saying why`);
    }
  });
});
