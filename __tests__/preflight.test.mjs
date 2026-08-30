import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  siteOriginBlockers, pageBlockers, versionBlockers, metadataBlockers, revenueCatBlockers,
  trialBlockers, compareSemver, METADATA_LIMITS,
} from '../scripts/preflight.mjs';

/* The release gate, tested against a repository that is deliberately broken.
 *
 * WHY THIS EXISTS. scripts/preflight.mjs is the only thing standing between a tag and a build
 * that cannot be submitted, and it has the failure mode every guard in this repository has
 * already had at least once: it passes because it is looking at nothing.
 * __tests__/brand.test.mjs is here because two renames disarmed three medical-claim greps and
 * all three went on reporting green for weeks — a test that matches nothing always passes.
 *
 * A preflight is worse than a test in that respect, because it is only ever run at the moment
 * somebody wants a yes. Nobody breaks the repository to see whether the gate notices. So the
 * gate is fed broken inputs here instead, once, in a file that runs on every push.
 *
 * WHAT IS DELIBERATELY NOT HERE. Nothing asserts the current repository passes preflight — it
 * does not, and it must not: RevenueCat is stubbed and legal/entity.json is unanswered, which
 * are two of the three items in docs/READINESS.md "Next, in order". A test that required a
 * clean preflight would have to be deleted or weakened by the person clearing those, which
 * is the same as not having it. These tests check that the gate can say no. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('the site origin the app opens and the one the documents name', () => {
  test('a mismatch is caught', () => {
    /* legal/README.md §3.5: the repository held two different answers at once —
       borntosoar.github.io/steadyapp in constants/links.ts and steadyapp.co in entity.json,
       the first a host belonging to a different company — and nothing compared them. */
    const out = siteOriginBlockers('https://a.example', 'https://b.example');
    assert.equal(out.length, 1);
    assert.match(out[0], /entity\.json is the source of truth/);
  });

  test('an unanswered siteOrigin is itself the blocker', () => {
    /* The App Store Connect field is mandatory. "Not decided yet" and "not shippable" are
       the same state here, and the message has to say which document says so. */
    const out = siteOriginBlockers('https://a.example', null);
    assert.equal(out.length, 1);
    assert.match(out[0], /5\.2/);
  });

  test('http and a trailing slash are both caught', () => {
    assert.equal(siteOriginBlockers('http://a.example/', 'http://a.example/').length, 2);
  });

  test('agreement passes', () => {
    assert.deepEqual(siteOriginBlockers('https://a.example', 'https://a.example'), []);
  });
});

describe('a published legal page', () => {
  const body = 'x'.repeat(600);

  test('a 404 is a blocker, because Apple loads the URL', () => {
    assert.match(pageBlockers('u', { ok: false, status: 404, body: '' })[0], /HTTP 404/);
  });

  test('an unsubstituted token is a blocker even though the page loads', () => {
    /* The specific accident: site/build.mjs run with ALLOW_TODOS=1 produces a preview with
       the tokens left standing, and it looks like a finished site until you read it. A live
       privacy policy that renders {{ENTITY_NAME}} to a customer is worse than no page. */
    const out = pageBlockers('u', { ok: true, status: 200, body: body + '{{ENTITY_NAME}}' });
    assert.match(out[0], /unsubstituted token/);
  });

  test('the word null in the rendered text is a blocker', () => {
    /* What a missing entity.json field looks like after String(undefined) substitution: a
       sentence about who you are contracting with, naming nobody, that reads as finished. */
    const out = pageBlockers('u', { ok: true, status: 200, body: `<p>Published by null</p>${body}` });
    assert.match(out[0], /"null"/);
  });

  test('a real page passes', () => {
    assert.deepEqual(pageBlockers('u', { ok: true, status: 200, body }), []);
  });
});

describe('version and build number', () => {
  const ok = {
    app: { expo: { version: '2.0.0', ios: { buildNumber: '3' }, android: { versionCode: 3 } } },
    pkg: { version: '2.0.0' },
    lock: { version: '2.0.0', packages: { '': { version: '2.0.0' } } },
    eas: { cli: { appVersionSource: 'local' }, build: { production: {} } },
    tag: 'v2.0.0',
    previous: { expo: { version: '1.9.0', ios: { buildNumber: '2' } } },
  };

  test('the coherent case passes', () => {
    assert.deepEqual(versionBlockers(ok), []);
  });

  test('a build number that does not advance is caught', () => {
    /* The expensive one. App Store Connect rejects a duplicate CFBundleVersion at UPLOAD,
       which is after twenty to forty minutes of build and ten more of processing. There is
       no cheaper place to find this out than before the build starts. */
    const out = versionBlockers({
      ...ok,
      app: { expo: { version: '2.0.0', ios: { buildNumber: '2' }, android: { versionCode: 2 } } },
    });
    assert.equal(out.length, 1);
    assert.match(out[0], /not greater than 2/);
  });

  test('a tag that does not match app.json is caught', () => {
    const out = versionBlockers({ ...ok, tag: 'v2.0.1' });
    assert.match(out[0], /Expected "v2\.0\.0"/);
  });

  test('remote versioning is caught, because it makes every other check here meaningless', () => {
    /* eas.json shipped with appVersionSource "remote". Under it the build number comes from
       EAS's database and app.json's copy is decorative — so a green "build number advanced"
       would be a statement about a file nothing reads. */
    const out = versionBlockers({ ...ok, eas: { cli: { appVersionSource: 'remote' }, build: {} } });
    assert.equal(out.length, 1);
    assert.match(out[0], /decorative/);
  });

  test('autoIncrement on any profile is caught', () => {
    /* It increments on the build machine. In CI that machine is deleted afterwards, so the
       number that shipped never reaches git and the tag stops describing the binary. */
    const out = versionBlockers({
      ...ok,
      eas: { cli: { appVersionSource: 'local' }, build: { production: { autoIncrement: true } } },
    });
    assert.match(out[0], /never reaches git/);
  });

  test('package.json and package-lock.json drifting from app.json is caught', () => {
    const out = versionBlockers({ ...ok, pkg: { version: '1.9.0' } });
    assert.equal(out.length, 1);
    assert.match(out[0], /package\.json version "1\.9\.0"/);
  });

  test('a build number with a leading zero or a non-string is caught', () => {
    /* CFBundleVersion is a string in the plist. "01" sorts below "1" nowhere useful and is
       the sort of thing that is only noticed by the upload. */
    for (const buildNumber of ['01', 3, '', null]) {
      const out = versionBlockers({
        ...ok,
        app: { expo: { version: '2.0.0', ios: { buildNumber }, android: { versionCode: 3 } } },
        previous: null,
      });
      assert.ok(out.some((b) => /buildNumber/.test(b)), `${JSON.stringify(buildNumber)} passed`);
    }
  });

  test('iOS and Android build numbers are held in lockstep', () => {
    const out = versionBlockers({
      ...ok,
      app: { expo: { version: '2.0.0', ios: { buildNumber: '3' }, android: { versionCode: 2 } } },
    });
    assert.match(out[0], /diverged/);
  });

  test('semver compares by component, not by string', () => {
    /* "2.10.0" < "2.9.0" as strings, which is how a release goes backwards without anyone
       noticing until the store refuses it. */
    assert.ok(compareSemver('2.10.0', '2.9.0') > 0);
    assert.equal(compareSemver('2.0.0', '2.0.0'), 0);
  });
});

describe('the store listing against Apple\'s field limits', () => {
  const listing = {
    'name.txt': 'Anneal: Body Image Anxiety',
    'subtitle.txt': 'Hours back from mirror worry',
    'keywords.txt': 'bdd,dysmorphia',
    'description.txt': 'Hours back.',
    'primary_category.txt': 'Health & Fitness',
  };

  test('the real listing in this repository fits every limit', () => {
    /* Not a fixture. If somebody edits fastlane/metadata past a limit, this fails on the
       push rather than at upload — the metadata is only validated by App Store Connect at
       the point of submission, which is the most expensive possible moment. */
    const files = {};
    for (const f of Object.keys(METADATA_LIMITS)) {
      try {
        files[f] = readFileSync(join(ROOT, 'fastlane', 'metadata', 'en-US', f), 'utf8');
      } catch {
        files[f] = null;
      }
    }
    const overLong = metadataBlockers(files, { siteOrigin: 'https://a.example' })
      .filter((b) => /characters|whitespace|space after a comma/.test(b));
    assert.deepEqual(overLong, []);
  });

  test('one character over the limit is caught', () => {
    const out = metadataBlockers({ ...listing, 'name.txt': 'x'.repeat(31) });
    assert.match(out[0], /31 characters; Apple's limit is 30/);
  });

  test('a trailing newline is forgiven and other trailing whitespace is not', () => {
    /* Every editor adds the newline; fastlane strips it. Two spaces before it is a character
       spent on nothing in a field where every character is currency. */
    assert.deepEqual(metadataBlockers({ ...listing, 'name.txt': 'Anneal\n' }), []);
    assert.equal(metadataBlockers({ ...listing, 'name.txt': 'Anneal  \n' }).length, 1);
  });

  test('a missing required field is caught', () => {
    const out = metadataBlockers({ ...listing, 'description.txt': null });
    assert.match(out[0], /description\.txt is missing/);
  });

  test('a placeholder URL from the drafts is caught', () => {
    /* docs/APP-STORE.md §3 carries the description draft with
       https://example.com/steady/privacy in it and a sentence underneath saying to replace
       it. That sentence is the entire safeguard today, and sentences do not run. */
    const out = metadataBlockers(
      { ...listing, 'description.txt': 'Privacy policy: https://example.com/steady/privacy' },
      { siteOrigin: 'https://anneal.example' }
    );
    assert.equal(out.length, 1);
    assert.match(out[0], /example\.com/);
  });

  test("Apple's own EULA URL is allowed, since it is the recommended terms link", () => {
    const out = metadataBlockers(
      {
        ...listing,
        'description.txt':
          'Terms: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
      },
      { siteOrigin: 'https://anneal.example' }
    );
    assert.deepEqual(out, []);
  });
});

describe('payments are real before anything is submitted', () => {
  test('a stub is detected', () => {
    /* ⚠ THIS USED TO READ THE REAL hooks/useEntitlement.ts AND ASSERT IT WAS BROKEN. It was
       described as "the live state as of writing", and it was — purchase() was a local flag
       that unlocked content with no receipt, which is the Guideline 2.1 rejection
       docs/APP-STORE.md §5.3 warns about. Then the SDK was wired and this failed, because a
       test pinned to a defect is a test that fails when the defect is fixed.
       It tests the RULE now, against a synthetic stub. The repository's own state is pinned
       separately below, where a regression reads as a regression. */
    const out = revenueCatBlockers({
      hookSource: '/* REVENUECAT INTEGRATION POINT */ async function f() { return null; }',
      dependencies: { expo: '~57.0.0' },
      privacyPolicy: 'irrelevant while it is stubbed',
    });
    assert.equal(out.length, 1);
    assert.match(out[0], /Guideline 2\.1/);
  });

  test('and this repository is no longer one', () => {
    /* The other direction, and the one that matters day to day: the SDK is imported, the
       markers are gone, and the privacy policy names RevenueCat in the same submission.
       Reading the real files on purpose — this is the assertion that catches somebody
       reverting the integration or dropping the policy paragraph. */
    const out = revenueCatBlockers({
      hookSource: readFileSync(join(ROOT, 'hooks', 'useEntitlement.ts'), 'utf8'),
      dependencies: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).dependencies,
      privacyPolicy: readFileSync(join(ROOT, 'legal', 'privacy-policy.md'), 'utf8'),
    });
    assert.deepEqual(out, [], 'payments have gone back to being a local flag');
  });

  test('installing the SDK without updating the privacy policy is also a blocker', () => {
    /* The half that gets forgotten, because it feels like paperwork after the code works.
       The moment the SDK is in the build, purchase history and an app user ID leave the
       device and the "Data Not Collected" label becomes false — a 5.1.1 problem and one of
       the faster routes to removal. §5.7 says: same submission, not afterwards. */
    const out = revenueCatBlockers({
      hookSource: "import Purchases from 'react-native-purchases';",
      dependencies: { 'react-native-purchases': '^9.0.0' },
      privacyPolicy: 'Nothing leaves your device.',
    });
    assert.equal(out.length, 1);
    assert.match(out[0], /SAME SUBMISSION/);
  });

  test('wired, declared, and it passes', () => {
    const out = revenueCatBlockers({
      hookSource: "import Purchases from 'react-native-purchases';",
      dependencies: { 'react-native-purchases': '^9.0.0' },
      privacyPolicy: 'Purchases are processed through RevenueCat, which receives …',
    });
    assert.deepEqual(out, []);
  });
});

describe('the free trial is a duration the store can sell', () => {
  test('21 days is rejected', () => {
    /* The original value in this app, and the reason the check exists: App Store Connect
       sells 3 days, 1 week, 2 weeks, 1/2/3/6 months and 1 year. 21 days is not on the list,
       so the listing would promise a trial the store cannot configure. */
    assert.match(trialBlockers(21)[0], /cannot\s+sell/);
  });

  test('the 30 days this app grants is accepted', () => {
    assert.deepEqual(trialBlockers(30), []);
  });
});
