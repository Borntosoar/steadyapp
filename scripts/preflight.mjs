#!/usr/bin/env node
/* Everything that has to be true before a release build is worth starting.
 *
 * WHY THIS EXISTS. The blockers in docs/READINESS.md and docs/APP-STORE.md §5 are real, they
 * are written down, and they are spread across four documents and a checklist of forty-one
 * boxes. A release attempt that trips one of them does not fail quickly: `eas build` runs for
 * twenty to forty minutes, TestFlight processing takes longer, and App Review takes a day or
 * more. So the cost of finding out late is not a red X — it is a day, or a rejection on
 * record against the account. Every check below is one that can be answered in under a
 * second from a laptop, and every one of them corresponds to a line somebody has already
 * written down as a blocker.
 *
 * IT INVENTS NO BLOCKERS. Each check cites the document it comes from. If a check is not
 * traceable to docs/READINESS.md, docs/APP-STORE.md §5 or legal/README.md §3, it does not
 * belong here.
 *
 * IT CANNOT CHECK THE THINGS THAT ACTUALLY BLOCK THIS APP TODAY. The D-U-N-S number, the
 * Apple Organization enrolment, the App Store Connect app record, the age-rating
 * questionnaire and the App Privacy label all live inside Apple's web forms. Nothing here
 * can see them, and a script that pretended otherwise — an "I confirm" environment variable,
 * a checkbox file in the repo — would be worse than silence, because it would be set once
 * and never re-read. They are printed at the end as a list, unchecked and honest about it.
 *
 * A DISARMED CHECK IS A FAILING CHECK. Several values are read out of TypeScript source by
 * pattern (SITE_ORIGIN, PRICING.trialDays). __tests__/brand.test.mjs is in this repository
 * because two renames disarmed three safety greps and they went on passing for weeks. So
 * every pattern here reports "could not find" as a blocker in its own right, never as a
 * silent pass.
 *
 * EXIT CODES
 *   0  every check ran and passed
 *   1  at least one blocker — the messages say what to do
 *   2  the run was incomplete (--offline, or a check could not be performed). Not a pass:
 *      an unfinished preflight must not be able to satisfy a CI gate by accident.
 *
 * Usage:
 *   npm run preflight                       # full run, needs outbound HTTPS
 *   npm run preflight -- --tag v2.0.1       # also checks the tag against app.json
 *   npm run preflight -- --offline          # skips the two network checks; exits 2
 *
 * Plain Node, no dependencies, like everything else in scripts/.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadEntity, problems as entityProblems } from '../site/entity.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

/** Read a value out of a source file by pattern, and treat a miss as a finding.
 *
 *  The alternative — returning undefined and comparing it to something — is how a check
 *  stops checking. See the header. */
function scrape(rel, pattern, what) {
  let text;
  try {
    text = read(rel);
  } catch {
    return { error: `${rel} is missing, so ${what} cannot be checked.` };
  }
  const m = text.match(pattern);
  if (!m) {
    return {
      error:
        `${rel} no longer matches the pattern that reads ${what} ` +
        `(${pattern}). The check is disarmed until the pattern in scripts/preflight.mjs ` +
        `is updated — do not assume it passed.`,
    };
  }
  return { value: m[1] };
}

/* ------------------------------------------------------------------ pure checks
 * Everything below takes its inputs as arguments so __tests__/preflight.test.mjs can run it
 * against fixtures rather than against whatever the repository happens to contain today.
 * A gate that can only be exercised by breaking the repository is a gate nobody exercises. */

/** constants/links.ts and legal/entity.json must name the same origin.
 *
 *  legal/README.md §3.5: the repo held two different answers, one of them a GitHub Pages URL
 *  under an account belonging to a different company, and nothing compared them. That is the
 *  address the app's own privacy link opens and the address printed in the cookie policy.
 *  __tests__/legal.test.mjs compares them once the field is answered; here an unanswered
 *  field is itself the blocker, because you cannot ship without one. */
export function siteOriginBlockers(declared, entitySiteOrigin) {
  const out = [];
  if (!entitySiteOrigin) {
    out.push(
      'legal/entity.json: "siteOrigin" is unanswered, so there is no address the privacy ' +
        'policy can be published at. App Store Connect will not accept the submission ' +
        'without a reachable privacy-policy URL (docs/APP-STORE.md §5.2).'
    );
  }
  if (!declared) return out;
  if (!/^https:\/\//.test(declared)) {
    out.push(`constants/links.ts: SITE_ORIGIN "${declared}" is not https.`);
  }
  if (declared.endsWith('/')) {
    out.push(
      `constants/links.ts: SITE_ORIGIN "${declared}" ends in a slash, so every link built ` +
        'from it has a double slash in the path.'
    );
  }
  if (entitySiteOrigin && declared !== entitySiteOrigin) {
    out.push(
      `constants/links.ts SITE_ORIGIN is "${declared}" but legal/entity.json siteOrigin is ` +
        `"${entitySiteOrigin}". The app would open one host while the legal documents name ` +
        'another. One of them is wrong; entity.json is the source of truth.'
    );
  }
  return out;
}

/** What a fetched legal page has to look like to count as published.
 *
 *  Not just a 200. A page that renders `{{ENTITY_NAME}}` to a reader is a live legal
 *  document with a hole in it, which site/build.mjs exists to prevent and which nothing
 *  would catch after a preview build was published by hand. */
export function pageBlockers(url, { ok, status, body, error }) {
  if (error) return [`${url} could not be fetched: ${error}`];
  if (!ok) return [`${url} returned HTTP ${status}. Apple requires a URL that loads without a login.`];
  const out = [];
  const token = body.match(/\{\{[A-Z_]+\}\}/);
  if (token) {
    out.push(
      `${url} still contains ${token[0]} — an unsubstituted token in a published legal ` +
        'document. It was built with ALLOW_TODOS=1; deploy-site.yml builds without it for ' +
        'exactly this reason.'
    );
  }
  if (/\bnull\b/.test(body.replace(/<[^>]+>/g, ' '))) {
    out.push(
      `${url} contains the word "null" in its rendered text, which is what a missing ` +
        'entity.json field looks like after substitution.'
    );
  }
  if (body.length < 500) out.push(`${url} returned ${body.length} bytes — that is not a policy.`);
  return out;
}

/** Version and build number, held to the one rule Apple actually enforces.
 *
 *  CFBundleShortVersionString (app.json → expo.version) is what customers see and may repeat
 *  across builds. CFBundleVersion (expo.ios.buildNumber) must be strictly greater than every
 *  build already uploaded for that version, or App Store Connect rejects the upload after
 *  the build has already been made and processed — twenty minutes of build plus ten of
 *  processing to learn something arithmetic.
 *
 *  `previous` is app.json as it stood at the previous release tag, so the monotonicity check
 *  needs no state outside git. See docs/DEPLOY.md §6 for why this is a script rather than
 *  EAS autoIncrement. */
export function versionBlockers({ app, pkg, lock, eas, tag, previous }) {
  const out = [];
  const version = app?.expo?.version;
  const build = app?.expo?.ios?.buildNumber;
  const code = app?.expo?.android?.versionCode;

  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    out.push(
      `app.json: expo.version is "${version}". Apple wants up to three dot-separated ` +
        'numbers; use x.y.z so the tag, the lockfile and the store agree on one shape.'
    );
  }
  if (pkg?.version !== version) {
    out.push(`package.json version "${pkg?.version}" does not match app.json "${version}".`);
  }
  if (lock?.version !== version || lock?.packages?.['']?.version !== version) {
    out.push(
      `package-lock.json still says "${lock?.version}" where app.json says "${version}". ` +
        'Run `npm run version:set -- ' + version + '` rather than editing the files by hand.'
    );
  }

  if (typeof build !== 'string' || !/^[1-9]\d*$/.test(build)) {
    out.push(
      `app.json: expo.ios.buildNumber is ${JSON.stringify(build)}. It must be a string ` +
        'holding a positive integer with no leading zero — it is CFBundleVersion, and it is ' +
        'the number TestFlight refuses a duplicate of.'
    );
  }
  if (typeof code !== 'number' || !Number.isInteger(code) || code < 1) {
    out.push(`app.json: expo.android.versionCode is ${JSON.stringify(code)}; it must be a positive integer.`);
  }
  if (typeof build === 'string' && typeof code === 'number' && Number(build) !== code) {
    out.push(
      `app.json: ios.buildNumber (${build}) and android.versionCode (${code}) have diverged. ` +
        'They are kept in lockstep so there is one number to reason about per build.'
    );
  }

  /* The two eas.json settings that decide whether any of the above means anything. */
  if (eas?.cli?.appVersionSource !== 'local') {
    out.push(
      `eas.json: cli.appVersionSource is "${eas?.cli?.appVersionSource}". With anything but ` +
        '"local" the build number comes from EAS\'s servers and the value in app.json is ' +
        'decorative — including the one this check just verified. docs/DEPLOY.md §6.'
    );
  }
  for (const [name, profile] of Object.entries(eas?.build ?? {})) {
    if (profile?.autoIncrement) {
      out.push(
        `eas.json: build.${name}.autoIncrement is set. The incremented value is written on ` +
          'the build machine and never reaches git, so the repository stops recording what ' +
          'was shipped. scripts/version.mjs does this in a commit instead.'
      );
    }
  }

  if (tag) {
    if (tag !== `v${version}`) {
      out.push(
        `the tag is "${tag}" but app.json says version "${version}". A tag that does not ` +
          `match the binary it built is a release nobody can reconstruct. Expected "v${version}".`
      );
    }
  }

  if (previous) {
    const prevVersion = previous?.expo?.version;
    const prevBuild = Number(previous?.expo?.ios?.buildNumber ?? 0);
    if (Number(build) <= prevBuild) {
      out.push(
        `build number ${build} is not greater than ${prevBuild}, which shipped at the ` +
          'previous tag. App Store Connect rejects a duplicate CFBundleVersion after the ' +
          'build has been made. Run `npm run version:set -- build`.'
      );
    }
    if (prevVersion && compareSemver(version, prevVersion) < 0) {
      out.push(`app.json version ${version} is lower than the previous release ${prevVersion}.`);
    }
  }

  return out;
}

/** Numeric semver compare, three components, no pre-release handling — the version check
 *  above already rejects anything that is not x.y.z. */
export function compareSemver(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

/** Apple's character limits, and the traps that live just underneath them.
 *
 *  __tests__/store-metadata.test.mjs already holds this metadata to the vocabulary rules and
 *  to the app's real prices and trial length. This is the other half — the limits, the
 *  required files, and the placeholder URL — checked at release time because a listing that
 *  is 31 characters long is not rejected by the store, it is silently truncated by fastlane
 *  or refused at upload, after the build. */
export const METADATA_LIMITS = {
  'name.txt': 30,
  'subtitle.txt': 30,
  'keywords.txt': 100,
  'promotional_text.txt': 170,
  'description.txt': 4000,
  'release_notes.txt': 4000,
};

/** Fields with no listing without them. `promotional_text` and `release_notes` are optional
 *  for a first submission — release notes are only shown on an update. */
export const METADATA_REQUIRED = [
  'name.txt', 'subtitle.txt', 'keywords.txt', 'description.txt', 'primary_category.txt',
];

export function metadataBlockers(files, { siteOrigin } = {}) {
  const out = [];

  for (const f of METADATA_REQUIRED) {
    if (files[f] == null || files[f].trim() === '') {
      out.push(`fastlane/metadata/en-US/${f} is missing or empty; App Store Connect requires it.`);
    }
  }

  for (const [f, limit] of Object.entries(METADATA_LIMITS)) {
    const raw = files[f];
    if (raw == null) continue;
    /* One trailing newline is an editor artefact rather than a character Apple charges for,
       but anything else in a length-capped field is spending currency on whitespace — the
       same rule __tests__/store-metadata.test.mjs asserts on the short fields. */
    const text = raw.replace(/\n$/, '');
    if (text.length > limit) {
      out.push(`fastlane/metadata/en-US/${f} is ${text.length} characters; Apple's limit is ${limit}.`);
    }
    if (limit <= 100 && text !== text.trimEnd()) {
      out.push(`fastlane/metadata/en-US/${f} has trailing whitespace, which costs a character.`);
    }
  }

  if (files['keywords.txt'] && /,\s/.test(files['keywords.txt'])) {
    out.push('fastlane/metadata/en-US/keywords.txt has a space after a comma, which Apple charges for.');
  }

  /* The URL trap. docs/APP-STORE.md §3 carries a description draft containing
     `https://example.com/steady/privacy`, and the instruction to replace it before
     submission is a sentence in a document — which is exactly the kind of instruction that
     gets missed when the draft is pasted into the listing. */
  for (const [f, text] of Object.entries(files)) {
    if (text == null) continue;
    for (const url of text.match(/https?:\/\/[^\s)>"']+/g) ?? []) {
      let host;
      try {
        host = new URL(url).host;
      } catch {
        out.push(`fastlane/metadata/en-US/${f} contains "${url}", which is not a valid URL.`);
        continue;
      }
      const mine = siteOrigin ? new URL(siteOrigin).host : null;
      const allowed = host === mine || host === 'www.apple.com' || host === 'apple.com';
      if (!allowed) {
        out.push(
          `fastlane/metadata/en-US/${f} links to ${url}. The only hosts a listing should ` +
            `name are this app's own site (${mine ?? 'unanswered — legal/entity.json'}) and ` +
            "Apple's standard EULA."
        );
      }
    }
  }

  return out;
}

/** Is RevenueCat actually wired, or still the stub with the marker on it.
 *
 *  docs/APP-STORE.md §5.3: `purchase()` and `restore()` are local flags behind a
 *  `// REVENUECAT INTEGRATION POINT` marker. Submitting that is a Guideline 2.1 rejection and
 *  arguably 3.1.1, because paid content is being unlocked without in-app purchase. It is
 *  item 3 in docs/READINESS.md's "Next, in order".
 *
 *  The second half matters as much and is easier to forget: the moment the SDK is in the
 *  build, purchase history and an app user ID leave the device, so the privacy policy and
 *  the App Privacy label stop being true (§5.7). The label lives in App Store Connect and
 *  cannot be checked from here; the policy is in this repository and can. */
export function revenueCatBlockers({ hookSource, dependencies, privacyPolicy }) {
  const out = [];
  const installed = Object.keys(dependencies ?? {}).some((d) => /purchases/i.test(d));
  const marked = /REVENUECAT INTEGRATION POINT/.test(hookSource ?? '');
  const imported = /from ['"]react-native-purchases['"]/.test(hookSource ?? '');

  if (!installed || !imported || marked) {
    out.push(
      'RevenueCat is not wired. hooks/useEntitlement.ts still ' +
        (marked ? 'carries the REVENUECAT INTEGRATION POINT markers' : 'does not import the SDK') +
        (installed ? '' : ' and react-native-purchases is not in package.json') +
        '. purchase() and restore() are local flags: content unlocks with no receipt and no ' +
        'StoreKit. That is a Guideline 2.1 rejection (docs/APP-STORE.md §5.3) and item 3 of ' +
        'docs/READINESS.md "Next, in order".'
    );
    return out;
  }

  if (privacyPolicy != null && !/revenuecat/i.test(privacyPolicy)) {
    out.push(
      'react-native-purchases is installed but legal/privacy-policy.md never names ' +
        'RevenueCat. Purchase history and an app user ID now leave the device, so the policy ' +
        'and the App Privacy label must both say so IN THE SAME SUBMISSION as the SDK ' +
        '(docs/APP-STORE.md §5.7). A label that understates collection is a 5.1.1 problem.'
    );
  }
  return out;
}

/** The introductory-offer durations App Store Connect will actually sell.
 *  docs/APP-STORE.md pre-submission checklist: "Free trial configured at a duration App Store
 *  Connect sells. 21 days is not a purchasable duration." */
export const PURCHASABLE_TRIAL_DAYS = [3, 7, 14, 30, 60, 90, 180, 365];

export function trialBlockers(trialDays) {
  if (PURCHASABLE_TRIAL_DAYS.includes(trialDays)) return [];
  return [
    `lib/entitlement.ts: PRICING.trialDays is ${trialDays}, which App Store Connect cannot ` +
      `sell. The purchasable durations are ${PURCHASABLE_TRIAL_DAYS.join(', ')} days ` +
      '(3 days, 1 week, 2 weeks, 1/2/3/6 months, 1 year).',
  ];
}

/** Icon and splash sources, read straight out of the PNG header.
 *
 *  docs/READINESS.md §1.7 lists "App icon, every size" as a hard submission blocker, and
 *  notes it was missing entirely at one point. Expo generates the sizes from these files, so
 *  what has to be true here is that the sources exist, are square, and are big enough to
 *  generate the 1024px marketing icon from. */
export function pngProblems(rel, buffer) {
  if (!buffer) return [`${rel} is referenced by app.json and does not exist.`];
  const png = buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG';
  if (!png) return [`${rel} is not a PNG.`];
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), colorType: buffer[25] };
}

/* ------------------------------------------------------------------ the run */

async function fetchPage(url, timeout = 15_000) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeout) });
    return { ok: res.ok, status: res.status, body: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, body: '', error: e.message };
  }
}

/** app.json as it stood at the previous release tag, or null if this is the first.
 *
 *  Needs tags in the working copy: a shallow CI checkout has none, which is why
 *  .github/workflows/release.yml sets fetch-depth 0 and fetch-tags. If they are absent this
 *  returns null and the monotonicity check reports itself as skipped rather than passing. */
function previousRelease(currentTag) {
  const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  let tags;
  try {
    tags = git(['tag', '--list', 'v*', '--sort=-v:refname']).split('\n').filter(Boolean);
  } catch {
    return { skipped: 'git is not available here' };
  }
  const earlier = tags.filter((t) => t !== currentTag);
  /* NO EARLIER TAG MEANS THE CHECK CANNOT RUN, AND THAT IS NOT A PASS.
     This used to return `{ tag: null, app: null }`, which reaches `check()` with no blockers
     and no `skipped` — so the report printed a clean tick for a monotonicity check that had
     compared nothing. The law stated at the top of this file is that a disarmed check is a
     failing check; this was the one place that broke it.
     It matters most at exactly zero tags, which is where the repo is. docs/DEPLOY.md §7.1 has
     the first production build run by hand from a laptop to create signing credentials —
     outside this pipeline, so preflight never sees it — and that build uploads CFBundleVersion
     1. Nobody tags a credentials bootstrap. The next real release then builds buildNumber 1
     again and App Store Connect rejects it as a duplicate, twenty to forty minutes after the
     build started, which is the precise cost this check exists to avoid. */
  if (!earlier.length) {
    return {
      skipped:
        'there is no earlier v* tag, so the build number cannot be checked for monotonicity. '
        + 'If a build has already been uploaded by hand (docs/DEPLOY.md §7.1), tag that commit '
        + 'so this check has a floor to compare against.',
    };
  }
  const tag = earlier[0];
  try {
    return { tag, app: JSON.parse(git(['show', `${tag}:app.json`])) };
  } catch {
    return { skipped: `${tag} exists but app.json could not be read from it` };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const offline = args.includes('--offline');
  const tagArg = args.indexOf('--tag');
  /* GITHUB_REF_NAME is the branch on a push and the tag on a tag push, so it is only a tag
     when GITHUB_REF_TYPE says so. Reading it unconditionally would compare app.json's
     version against the string "main" on every dry run. */
  const envTag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : null;
  const tag = (tagArg >= 0 ? args[tagArg + 1] : envTag) || null;

  const results = [];
  const check = (title, blockers, skipped = null) => results.push({ title, blockers, skipped });

  /* 1 — the entity. legal/entity.json is the single source, and site/build.mjs already
     refuses to publish while any field is null. Reused rather than re-implemented: a second
     opinion about what "complete" means is a second thing to keep in step. */
  const entity = loadEntity();
  check('legal/entity.json is answered', entityProblems(entity));

  /* 2 — the app and the documents point at the same host. */
  const declared = scrape('constants/links.ts', /export const SITE_ORIGIN = '([^']+)'/, 'SITE_ORIGIN');
  check(
    'constants/links.ts and entity.json agree on the site',
    declared.error ? [declared.error] : siteOriginBlockers(declared.value, entity.siteOrigin)
  );

  /* 3 — the URLs the app itself opens, and that App Store Connect will not accept a
     submission without. Both are on the paywall (app/paywall.tsx → LINKS). */
  const origin = entity.siteOrigin || declared.value;
  if (offline) {
    check('the privacy policy and terms are reachable', [], '--offline');
  } else if (!origin) {
    check('the privacy policy and terms are reachable', [], 'no site origin to fetch');
  } else {
    const blockers = [];
    for (const path of ['/privacy.html', '/terms.html']) {
      const url = `${origin}${path}`;
      blockers.push(...pageBlockers(url, await fetchPage(url)));
    }
    check('the privacy policy and terms are reachable', blockers);
  }

  /* 4 — version and build number. */
  const app = readJson('app.json');
  const previous = previousRelease(tag);
  check(
    'version and build number are coherent',
    versionBlockers({
      app,
      pkg: readJson('package.json'),
      lock: readJson('package-lock.json'),
      eas: readJson('eas.json'),
      tag,
      previous: previous.app,
    }),
    previous.skipped ?? null
  );

  /* 5 — former names. Run rather than re-implemented: __tests__/brand.test.mjs holds the
     patterns, the allowlist and the reasoning for every entry on it, and a second copy of
     that list here would rot in exactly the way that test exists to describe. It runs in
     about a second and preflight has to stand alone on a laptop where nobody ran npm test. */
  let brandBlockers = [];
  try {
    execFileSync(process.execPath, ['--test', '__tests__/brand.test.mjs'], {
      cwd: ROOT,
      stdio: 'pipe',
    });
  } catch (e) {
    const failed = String(e.stdout ?? '')
      .split('\n')
      .filter((l) => /^not ok /.test(l.trim()))
      .map((l) => l.trim().replace(/^not ok \d+ - /, ''));
    brandBlockers = [
      'a former app name survives on a surface a user or a reviewer reads: ' +
        (failed.join(', ') || 'see `node --test __tests__/brand.test.mjs`'),
    ];
  }
  check('no former app name survives (__tests__/brand.test.mjs)', brandBlockers);

  /* 6 — payments are real. */
  check(
    'RevenueCat is wired, not stubbed',
    revenueCatBlockers({
      hookSource: read('hooks/useEntitlement.ts'),
      dependencies: readJson('package.json').dependencies,
      privacyPolicy: read('legal/privacy-policy.md'),
    })
  );

  /* 7 — the trial length is one the store can sell. */
  const trial = scrape('lib/entitlement.ts', /trialDays:\s*(\d+)/, 'PRICING.trialDays');
  check(
    'the free trial is a duration App Store Connect sells',
    trial.error ? [trial.error] : trialBlockers(Number(trial.value))
  );

  /* 8 — the listing fits in Apple's fields. */
  const metaDir = join('fastlane', 'metadata', 'en-US');
  const files = {};
  for (const f of [...Object.keys(METADATA_LIMITS), 'primary_category.txt']) {
    files[f] = existsSync(join(ROOT, metaDir, f)) ? read(join(metaDir, f)) : null;
  }
  check('the store listing fits Apple\'s fields', metadataBlockers(files, { siteOrigin: origin }));

  /* 9 — the icon exists and can generate what Apple asks for. */
  const assetBlockers = [];
  const assets = [
    app.expo.icon,
    app.expo.splash?.image,
    app.expo.android?.adaptiveIcon?.foregroundImage,
    app.expo.web?.favicon,
  ].filter(Boolean);
  for (const rel of [...new Set(assets)]) {
    const path = join(ROOT, rel.replace(/^\.\//, ''));
    const buf = existsSync(path) ? readFileSync(path) : null;
    const info = pngProblems(rel, buf);
    if (Array.isArray(info)) {
      assetBlockers.push(...info);
      continue;
    }
    const isIcon = rel === app.expo.icon || rel === app.expo.android?.adaptiveIcon?.foregroundImage;
    if (isIcon && (info.width !== info.height || info.width < 1024)) {
      assetBlockers.push(
        `${rel} is ${info.width}×${info.height}. The App Store icon is 1024×1024 and Expo ` +
          'generates every size from this file, so it has to be square and at least that big.'
      );
    }
    if (isIcon && (info.colorType === 4 || info.colorType === 6)) {
      assetBlockers.push(
        `${rel} has an alpha channel. Apple rejects an App Store icon with transparency; ` +
          'flatten it onto the background colour rather than relying on the build to.'
      );
    }
  }
  check('the icon and splash sources exist and are the right shape', assetBlockers);

  /* ------------------------------------------------------------------ report */

  const failed = results.filter((r) => r.blockers.length);
  const skipped = results.filter((r) => !r.blockers.length && r.skipped);

  console.log('');
  for (const r of results) {
    const mark = r.blockers.length ? '✗' : r.skipped ? '–' : '✓';
    console.log(`${mark} ${r.title}${!r.blockers.length && r.skipped ? `  (skipped: ${r.skipped})` : ''}`);
    for (const b of r.blockers) console.log(`    · ${b}`);
  }

  /* The list nothing in this repository can check. Printed every run, deliberately without a
     way to tick it off: the moment it has a checkbox it becomes a checkbox somebody ticked
     once in March. docs/DEPLOY.md §2 has the ordering and the lead times. */
  console.log(`
Not checkable from here — confirm by hand before submitting (docs/DEPLOY.md §2):
  · Apple Developer Program enrolment is an Organization, not an Individual  (§5.1 — weeks)
  · The D-U-N-S number exists and matches the entity in legal/entity.json
  · An App Store Connect app record exists for com.anneal.app, and the name is free
  · The age-rating questionnaire is answered — docs/SUBMISSION-ANSWERS.md §2
  · The App Privacy label matches what the binary does — docs/SUBMISSION-ANSWERS.md §3
  · App Review notes are pasted in, including the hardship path and the camera alternative
  · Screenshots contain no human face, and the captions match the app as it ships
  · A device pass: VoiceOver announcement order, cold-start time, binary size`);

  if (failed.length) {
    console.log(`\n${failed.length} blocker group(s). Nothing is built until they are clear.\n`);
    process.exit(1);
  }
  if (skipped.length) {
    console.log(
      `\nEverything that ran passed, but ${skipped.length} check(s) did not run` +
        `${offline ? ' (--offline)' : ''}. An incomplete preflight is not a pass — exit 2.\n`
    );
    process.exit(2);
  }
  console.log('\nAll release blockers this repository can see are clear.\n');
}

/* Importable by the test suite without running. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
