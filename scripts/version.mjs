#!/usr/bin/env node
/* The one place a version or a build number changes.
 *
 * WHY THIS IS A SCRIPT AND NOT `autoIncrement`.
 *
 * EAS offers to do this for you, two ways, and both were wrong for this repository:
 *
 *   · `appVersionSource: "remote"` — which is what eas.json said — keeps the build number in
 *     EAS's database. Nothing in the repository can then answer "what build is 2.0.0?", the
 *     value in app.json becomes decorative, and `scripts/preflight.mjs` would be checking a
 *     number that has no relationship to the binary. It is also the only copy: recreate the
 *     EAS project, or move off EAS, and the counter starts again — below numbers already
 *     uploaded to App Store Connect, which then refuses every build until you guess your way
 *     back past the highest one.
 *   · `appVersionSource: "local"` with `autoIncrement: true` — increments app.json ON THE
 *     BUILD MACHINE. In CI that machine is a container that is deleted afterwards, so the
 *     shipped number never reaches git and the tag no longer describes what was built.
 *
 * Both trade an auditable release for one saved keystroke. This app has no server, no
 * analytics and no crash reporter, so if a customer reports something the only evidence
 * available is the build number they can read in the App Store and whatever git says about
 * it. That link has to hold.
 *
 * So: the numbers live in app.json, they change in a commit, and the commit is what gets
 * tagged. One keystroke, and the repository stays the record.
 *
 * THE TWO NUMBERS, because they are routinely confused:
 *
 *   version      CFBundleShortVersionString — "2.0.1". Customers see it. May repeat across
 *                builds. Also package.json and package-lock.json, kept equal so there is one
 *                answer, and the release tag is "v" plus this.
 *   buildNumber  CFBundleVersion — "7". Nobody sees it except TestFlight and the crash
 *                reports Apple sends. Must be strictly greater than every build already
 *                uploaded, or App Store Connect rejects the upload AFTER the build has been
 *                made and processed. android.versionCode is kept in lockstep so there is one
 *                number per build rather than two.
 *
 * Usage:
 *   npm run version:set                  # print what is set now
 *   npm run version:set -- build         # next build of the same version (TestFlight iteration)
 *   npm run version:set -- 2.1.0         # new customer-visible version, and the next build
 *
 * Neither form commits or tags. docs/DEPLOY.md §6 has the sequence; doing it here would mean
 * a script that can push a release, which is not a thing that should exist for a one-person
 * team with one Apple account.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = (rel) => join(ROOT, rel);
const readJson = (rel) => JSON.parse(readFileSync(path(rel), 'utf8'));

/** Rewrite JSON preserving two-space indentation and the trailing newline, so a version bump
 *  is a one-line diff rather than a reformat of package-lock.json. */
const writeJson = (rel, value) => writeFileSync(path(rel), JSON.stringify(value, null, 2) + '\n');

const app = readJson('app.json');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');

const current = {
  version: app.expo.version,
  build: Number(app.expo.ios?.buildNumber ?? 0),
};

const arg = process.argv[2];

if (!arg) {
  console.log(`version      ${current.version}   (app.json, package.json, package-lock.json)`);
  console.log(`buildNumber  ${current.build}       (ios.buildNumber, android.versionCode)`);
  console.log(`release tag  v${current.version}`);
  console.log('\nnpm run version:set -- build      next build of this version');
  console.log('npm run version:set -- 2.1.0      new version, and the next build');
  process.exit(0);
}

if (arg !== 'build' && !/^\d+\.\d+\.\d+$/.test(arg)) {
  console.error(
    `Not a version: "${arg}". Use three dot-separated numbers (2.1.0) or the word "build".\n` +
      'Apple accepts up to three components in CFBundleShortVersionString and nothing else — ' +
      'no "-beta", no fourth number.'
  );
  process.exit(1);
}

const version = arg === 'build' ? current.version : arg;

/* Refusing to go backwards. A lower version than the one already on the store is accepted by
   the JSON and rejected by App Store Connect, and by then a build exists. */
if (arg !== 'build') {
  const [a, b] = [version, current.version].map((v) => v.split('.').map(Number));
  const compared = a.findIndex((n, i) => n !== b[i]);
  const lower = compared !== -1 && a[compared] < b[compared];
  if (lower) {
    console.error(
      `${version} is lower than the current ${current.version}. App Store Connect will not ` +
        'accept a version below the one already published. If this is a correction, say so ' +
        'out loud and edit app.json by hand.'
    );
    process.exit(1);
  }
}

const build = current.build + 1;

app.expo.version = version;
app.expo.ios = { ...app.expo.ios, buildNumber: String(build) };
app.expo.android = { ...app.expo.android, versionCode: build };
pkg.version = version;
lock.version = version;
if (lock.packages?.['']) lock.packages[''].version = version;

writeJson('app.json', app);
writeJson('package.json', pkg);
writeJson('package-lock.json', lock);

console.log(`version      ${current.version} → ${version}`);
console.log(`buildNumber  ${current.build} → ${build}`);
console.log(
  `\nNext: npm run preflight -- --tag v${version}\n` +
    `      git commit -am "Release ${version} (build ${build})"\n` +
    `      git tag v${version} && git push --follow-tags\n`
);
