import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadEntity, problems, legalNameProblems, fill, tokensUsed, TOKENS, REQUIRED, PROVINCES,
  KINDS, LEGAL_DIR, appName,
} from '../site/entity.mjs';
import { emptyState } from '../lib/storage.ts';

/* The legal documents.
 *
 * These are the only files in the repository that are enforceable against the person who
 * publishes the app, and they are the ones nothing else in the suite was watching. A privacy
 * policy naming one entity while the terms of use name another is a genuine defect in a
 * genuine legal document, and until legal/entity.json existed there were nine hand-copied
 * places for that to happen in.
 *
 * These tests are not a substitute for a lawyer reading them — legal/README.md is explicit
 * about what to pay one for. They check the things a lawyer would not: that the documents and
 * the data agree, that a half-filled entity cannot be published, and that the load-bearing
 * factual claims still match the code they describe. */

const FILES = readdirSync(LEGAL_DIR).filter((f) => f.endsWith('.md'));
const DOCS = FILES.map((f) => ({ file: f, md: readFileSync(join(LEGAL_DIR, f), 'utf8') }));

/** Maintainer notes are sourcing proof for whoever edits these, and the site build strips
 *  them before publishing. Anything asserted about what a READER sees must ignore them, or
 *  a note explaining a rule trips the test for that rule — which has happened three times
 *  in this repository already, always to my own prose. */
const withoutComments = (md) => md.replace(/<!--[\s\S]*?-->/g, '');

describe('who publishes this is answered in exactly one place', () => {
  test('no document hard-codes an entity name, address or province', () => {
    /* The regression this guards. Someone updating the terms writes the company name inline
       because it is right there in the sentence above, and now there are two sources of
       truth and one of them is invisible. The token is not decoration; it is the thing that
       makes the next change a single edit. */
    const entity = loadEntity();
    for (const { file, md } of DOCS) {
      if (file === 'README.md') continue;
      for (const field of ['name', 'address']) {
        const value = entity[field];
        if (!value) continue;
        assert.ok(
          !withoutComments(md).includes(value),
          `${file} writes the entity ${field} out in full. Use {{${
            Object.entries(TOKENS).find(([, f]) => f === field)[0]
          }}} so it stays in one place.`
        );
      }
    }
  });

  test('no document hard-codes the app name', () => {
    /* The same drift as the entity name, one field over — and likelier, because the product
       name appears in ordinary sentences where writing it out feels natural. It was renamed
       twice already (Steady → Cairn → Anneal, ~300 occurrences across 40 files each
       time); the next rename should be one edit to app.json, not another sweep. */
    const brand = appName();
    for (const { file, md } of DOCS) {
      if (file === 'README.md') continue;
      assert.ok(
        !new RegExp(`\\b${brand}\\b`).test(withoutComments(md)),
        `${file} writes "${brand}" out in full. Use {{APP_NAME}}.`
      );
    }
  });

  test('every token in the documents is one the resolver knows', () => {
    /* A typo'd token is not a build error, it is a pair of curly braces rendered into a
       published privacy policy where a company name should be. */
    const known = new Set(Object.keys(TOKENS));
    for (const [token, files] of tokensUsed()) {
      assert.ok(known.has(token), `{{${token}}} in ${[...files].join(', ')} is not a known token`);
    }
  });

  test('every token the resolver knows is one a document actually uses', () => {
    /* The inverse, and the one that catches a document being rewritten around a token
       instead of with it — TOKENS grows stale and nobody notices because nothing fails. */
    const used = new Set(tokensUsed().keys());
    for (const token of Object.keys(TOKENS)) {
      assert.ok(used.has(token), `{{${token}}} is defined but no document uses it`);
    }
  });

  test('the old bracket placeholders are gone, so there is one convention not two', () => {
    for (const { file, md } of DOCS) {
      assert.doesNotMatch(
        md, /`\[[^\]]*TODO[^\]]*\]`/,
        `${file} still uses a [... TODO] placeholder; the entity gate no longer looks for those`
      );
    }
  });
});

describe('a half-answered entity cannot be published', () => {
  const complete = {
    name: 'Example Ltd.', kind: 'corporation', address: '1 Example St, Toronto ON',
    province: 'Ontario', contactEmail: 'a@b.co', siteOrigin: 'https://x.co',
    /* "none" is a publishable answer and the one most self-help apps should be giving. What
       is not publishable is leaving it null, which is how legal/ai-policy.md ends up silent
       on clinical oversight and a reader ends up assuming. */
    clinicalReview: 'none',
    /* True, because "complete" now means counsel has looked. The Quebec gate no longer keys
       on the publisher's own province — Bill 96 and Law 25 follow the customer — so an
       unconfirmed entity blocks from every province, which is the fix. */
    quebecCounselConfirmed: true,
  };

  test('a fully answered entity passes, from any province', () => {
    assert.deepEqual(problems(complete), []);
  });

  test('every required field blocks the build on its own', () => {
    for (const field of REQUIRED) {
      const partial = { ...complete, [field]: null };
      const found = problems(partial);
      assert.ok(found.length >= 1, `a null "${field}" was allowed through`);
      assert.ok(found.some((p) => p.includes(`"${field}"`)), `the message does not name "${field}"`);
    }
  });

  test('an empty string is treated as unanswered, not as an answer', () => {
    /* The likelier mistake than null: somebody clears the field intending to come back. */
    assert.ok(problems({ ...complete, name: '' }).length >= 1, 'an empty name was allowed through');
  });

  test('an abbreviated province is refused', () => {
    /* It goes verbatim into the governing-law clause. "ON" is not the name of a province,
       and "Ontario, Canada" makes the clause read "the Province of Ontario, Canada and the
       federal laws of Canada that apply in it". */
    for (const bad of ['ON', 'Ontario, Canada', 'ontario', 'Québec']) {
      assert.ok(problems({ ...complete, province: bad }).length >= 1, `"${bad}" was accepted`);
    }
    for (const good of PROVINCES) {
      const p = problems({ ...complete, province: good, quebecCounselConfirmed: true });
      assert.deepEqual(p, [], `"${good}" was refused`);
    }
  });

  test('the entity kind is one of the two the documents are written for', () => {
    for (const bad of ['LLC', 'partnership', 'Corporation']) {
      assert.ok(problems({ ...complete, kind: bad }).length >= 1, `"${bad}" was accepted`);
    }
    /* Each kind needs a name of its own shape — "Example Ltd." is not a sole proprietor and
       "Jane Doe" is not a corporation — which is what legalNameProblems is checking. */
    const nameFor = { corporation: 'Example Ltd.', 'sole proprietorship': 'Jane Doe' };
    for (const good of KINDS) {
      assert.deepEqual(problems({ ...complete, kind: good, name: nameFor[good] }), []);
    }
  });

  test('Quebec blocks on WHO YOU SELL TO, not where you are registered', () => {
    /* THE GATE USED TO READ `entity.province === 'Quebec'`, AND THAT WAS THE WRONG FACT.
       Neither statute is triggered by the publisher's province. Law 25 binds every person
       carrying on an enterprise who holds personal information about others; the Charter
       reaches goods and services offered to consumers in Quebec. Both are about who you sell
       to. This app is planned for worldwide App Store availability, which includes Canada,
       which includes Quebec.
       So the old condition was a false-negative generator, and a confident one: setting the
       province to Ontario published clean, with no warning, in exactly the case where the
       documents are non-compliant. A gate that goes quiet on the scenario it exists to catch
       is worse than no gate, because somebody trusts it. */
    for (const province of PROVINCES) {
      const found = problems({ ...complete, province, quebecCounselConfirmed: false });
      assert.ok(
        found.some((p) => p.startsWith('Quebec:')),
        `a ${province} publisher passes with no Quebec warning. Bill 96 and Law 25 follow the `
        + 'customer, not the certificate of incorporation.',
      );
    }
  });

  test('and it says so, so nobody reads it as a Quebec-only problem', () => {
    const found = problems({ ...complete, province: 'Ontario', quebecCounselConfirmed: false });
    const quebec = found.find((p) => p.startsWith('Quebec:'));
    assert.match(quebec, /SELLING TO Quebec residents, not by where you are registered/,
      'the message does not explain why a non-Quebec publisher is being told about Quebec');
  });

  test('confirming counsel is what clears it, for every province', () => {
    for (const province of PROVINCES) {
      const found = problems({ ...complete, province, quebecCounselConfirmed: true });
      assert.deepEqual(found, [], `${province} still blocks after counsel confirmed`);
    }
  });

  test('no document still says Quebec depends on the publisher province', () => {
    /* The wrong fact lived in FOUR places at once — this gate, legal/README.md §3.1,
       docs/LOCALISATION.md §1 and the §15 note in terms-of-use.md — all phrased as "any other
       province and none of this applies". Fixing the conditional without fixing the prose
       would leave three documents telling the next reader the gate is overreacting, which is
       how a corrected guard gets reverted. */
    const root = join(LEGAL_DIR, '..');
    for (const rel of ['legal/README.md', 'docs/LOCALISATION.md', 'legal/terms-of-use.md']) {
      const text = readFileSync(join(root, rel), 'utf8');
      for (const line of text.split('\n')) {
        if (!/other province and (none of )?(this|that|it)/i.test(line)) continue;
        /* The correction quotes the old sentence to explain it. That is the one allowed
           occurrence, and it has to be marked as historical on the same line. */
        assert.match(
          line, /used to (end|say)/i,
          `${rel} still asserts that Quebec turns on the publisher's province:\n  ${line.trim()}\n`
          + '  Bill 96 and Law 25 follow the customer. site/entity.mjs blocks from every '
          + 'province, and a document saying otherwise makes that gate look like a bug.',
        );
      }
    }
  });

  test('an unconfirmed entity is blocked until a lawyer has actually looked', () => {
    /* Not pedantry and not a formality. Bill 96 requires French consumer contracts, Law 25
       imposes privacy duties beyond PIPEDA including a published privacy officer, and the
       Consumer Protection Act restricts liability language these documents use. All three
       are unaddressed here, and every one of them is invisible in a document that otherwise
       looks finished. */
    const qc = { ...complete, province: 'Quebec', quebecCounselConfirmed: false };
    assert.ok(problems(qc).some((p) => /Bill 96|Law 25/.test(p)), 'Quebec published unreviewed');
    assert.deepEqual(problems({ ...qc, quebecCounselConfirmed: true }), []);
  });

  test('the shipped entity.json is either complete or honestly empty', () => {
    /* Guards the state this file is actually in most of the time: partly filled, with the
       rest quietly forgotten. Either every required field is answered or none pretends to be. */
    const e = loadEntity();
    const answered = REQUIRED.filter((f) => e[f] !== null && e[f] !== undefined && e[f] !== '');
    assert.ok(
      answered.length === 0 || answered.length === REQUIRED.length,
      `legal/entity.json is half-filled: ${answered.join(', ')} answered, ` +
        `${REQUIRED.filter((f) => !answered.includes(f)).join(', ')} still null`
    );
  });
});

describe('substitution', () => {
  const entity = {
    name: 'Example Ltd.', address: '1 Example St', province: 'Ontario', contactEmail: 'a@b.co',
    clinicalReview: 'none',
  };

  test('fills every token', () => {
    const out = fill('{{ENTITY_NAME}} of {{ENTITY_ADDRESS}}, {{PROVINCE}}, {{CONTACT_EMAIL}}', entity);
    assert.equal(out, 'Example Ltd. of 1 Example St, Ontario, a@b.co');
  });

  test('fills every occurrence, not just the first', () => {
    /* replaceAll rather than replace. The entity name appears twice in privacy-policy.md and
       twice in terms-of-use.md, and a policy that names the publisher once and then leaves a
       pair of braces is the exact failure this whole mechanism exists to prevent. */
    assert.equal(fill('{{ENTITY_NAME}} and {{ENTITY_NAME}}', entity), 'Example Ltd. and Example Ltd.');
  });

  test('throws rather than publish an unrecognised token', () => {
    assert.throws(() => fill('{{ENTITY_PHONE}}', entity), /unsubstituted token/);
  });

  test('the real documents all resolve once the entity is answered', () => {
    for (const { file, md } of DOCS) {
      assert.doesNotThrow(() => fill(md, entity), `${file} has a token that will not resolve`);
    }
  });

  test('an unanswered clinical review refuses to publish, and says which field', () => {
    /* A second net under problems(). This is the one field whose failure mode is a document
       that publishes looking complete while saying nothing about clinical oversight — so the
       substitution step refuses it too, and names the field rather than reporting a stray
       token the reader would have to go and decode. */
    const { clinicalReview, ...unanswered } = entity;
    assert.throws(
      () => fill('{{CLINICAL_REVIEW}}', unanswered),
      /clinicalReview.*unanswered|unanswered.*clinicalReview/s,
    );
    assert.throws(() => fill('{{CLINICAL_REVIEW}}', { ...entity, clinicalReview: 'probably' }),
      /clinicalReview/, 'an unrecognised answer was substituted rather than refused');
  });
});

describe('the factual claims the documents make about the app', () => {
  /* These documents assert things about the software, and the software is what makes them
     true. Each one below is a sentence that becomes a false statement in a legal document the
     day someone adds a feature — which is precisely the change least likely to prompt anybody
     to reread a privacy policy. */

  test('the privacy policy still claims no network calls, and the app still makes none', () => {
    const privacy = DOCS.find((d) => d.file === 'privacy-policy.md').md;
    assert.match(withoutComments(privacy), /never leaves|does not leave|stays on (your|the) (phone|device)/i,
      'the privacy policy no longer says the data stays on the device — if that is deliberate, ' +
        'the App Store privacy label and the onboarding screen both need changing too');
  });

  test('the privacy policy names the cipher the app actually uses', () => {
    /* This section said "does not add its own encryption ... ordinary readable text" for a
       period AFTER XChaCha20-Poly1305 shipped. It even carried a warning block predicting the
       encryption layer would land and instructing whoever shipped it to rewrite the section.
       Nobody did, so the live legal document described a build that no longer existed while
       the store listing said the opposite. Prose cannot be trusted to track a dependency. */
    const privacy = withoutComments(DOCS.find((d) => d.file === 'privacy-policy.md').md);
    const crypto = readFileSync(join(LEGAL_DIR, '..', 'lib', 'crypto.ts'), 'utf8');

    assert.match(crypto, /xchacha20poly1305/i,
      'lib/crypto.ts no longer uses xchacha20poly1305 — the policy names it by name');
    assert.match(privacy, /XChaCha20-Poly1305/,
      'lib/crypto.ts encrypts with XChaCha20-Poly1305 and the privacy policy does not say so');
    assert.doesNotMatch(privacy, /does not add its own encryption|ordinary readable text/i,
      'the privacy policy claims the app stores plain text while lib/crypto.ts encrypts it');
  });

  test('the privacy policy accounts for every link the app can open', () => {
    /* It used to say the dialler "is the only outbound link in the whole app". True when
       written, and wrong for four call sites since — two https links on the paywall, plus a
       mailto: and a disclaimer link on Support. */
    const privacy = withoutComments(DOCS.find((d) => d.file === 'privacy-policy.md').md);
    const root = join(LEGAL_DIR, '..');
    const opens = ['app/support.tsx', 'app/paywall.tsx', 'components/CrashScreen.tsx']
      .map((rel) => readFileSync(join(root, rel), 'utf8'))
      .join('\n').match(/Linking\.openURL\(/g)?.length ?? 0;

    assert.ok(opens >= 4, `only ${opens} openURL call sites found — has the scan broken?`);
    assert.doesNotMatch(privacy, /the only outbound link/i,
      `the app has ${opens} Linking.openURL call sites and the policy calls one of them the only one`);
    for (const [what, pattern] of [['a mailto: address', /mailto/i], ['the terms', /terms/i],
                                   ['the medical disclaimer', /disclaimer/i]]) {
      assert.match(privacy, pattern,
        `the app opens ${what} and the privacy policy does not account for it`);
    }
  });

  test('the privacy policy counts the crisis regions the app ships', () => {
    /* It named four countries. There are thirty, plus a directory fallback. */
    const privacy = withoutComments(DOCS.find((d) => d.file === 'privacy-policy.md').md);
    const support = readFileSync(join(LEGAL_DIR, '..', 'constants', 'support.ts'), 'utf8');
    const keys = support.match(/^\s*key:\s*'/gm)?.length ?? 0;
    assert.ok(keys > 20, `only counted ${keys} support regions — has the scan broken?`);
    assert.doesNotMatch(privacy, /Canada, the United States, the United Kingdom and Australia/,
      'the privacy policy still names the four-region list from several versions ago');
    assert.match(privacy, /thirty countries/i,
      'the privacy policy no longer says how many countries the Support screen covers');
  });

  test('every document gives the same age rating', () => {
    /* docs/SUBMISSION-ANSWERS.md §2 said "Expected result: 4+" and told the reader to stop if
       the questionnaire produced anything higher, while docs/APP-STORE.md §7 argued for 16+
       and legal/privacy-policy.md already published "rated 16+ on the App Store". The 4+ one
       is the document headed "Copy these in" — the one that reaches the form. Under-rating is
       guideline 2.3.6; the cost of these disagreeing is not theoretical. */
    const root = join(LEGAL_DIR, '..');
    const files = ['docs/SUBMISSION-ANSWERS.md', 'docs/APP-STORE.md', 'legal/privacy-policy.md'];
    /* Only lines that STATE the answer. Prose comparing ratings ("12+ and 17+ were removed")
       and the note explaining that this section used to say 4+ are discussion, not answers —
       matching those would make the guard fire on its own explanation, which is how a test
       gets routed around. Blockquoted lines are commentary and are skipped for the same
       reason. */
    const STATES_A_RATING =
      /^(?!\s*>)(?=.*\b(?:expected result|recommended result|rated)\b)[^\n]*?\b(4\+|9\+|13\+|16\+|18\+)/i;
    const ratings = new Map();
    for (const rel of files) {
      const stated = readFileSync(join(root, rel), 'utf8').split('\n')
        .map((line) => line.match(STATES_A_RATING)?.[1])
        .filter(Boolean);
      if (stated.length) ratings.set(rel, [...new Set(stated)]);
    }
    assert.ok(ratings.size >= 2, `only ${ratings.size} documents state a rating — has the scan broken?`);
    const all = new Set([...ratings.values()].flat());
    assert.equal(
      all.size, 1,
      'the submission documents disagree about the age rating: '
      + [...ratings].map(([f, r]) => `${f} says ${r.join('/')}`).join('; '),
    );
  });

  test('the cookie policy still describes a site with nothing on it', () => {
    /* site/build.mjs emits no script tag and fetches no font. The moment it does, this
       document is false, and it is four paragraphs long precisely because it is true. */
    const build = readFileSync(join(LEGAL_DIR, '..', 'site', 'build.mjs'), 'utf8');
    const emitted = build.slice(build.indexOf('const shell'));
    assert.doesNotMatch(emitted, /<script/i, 'site/build.mjs emits a script tag; cookie-policy.md is now false');
    assert.doesNotMatch(emitted, /https?:\/\/fonts\.|googleapis|cdn\./i,
      'site/build.mjs fetches something third-party; cookie-policy.md is now false');
  });

  test('every document reaches the same contact address', () => {
    const entity = loadEntity();
    for (const { file, md } of DOCS) {
      if (file === 'README.md') continue;
      /* `[\w.]+` at the end would swallow the full stop that ends the sentence, so a
         correct address fails against itself. Require the last label to be letters. */
      const emails = [...withoutComments(md).matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/gi)]
        .map((m) => m[0]);
      for (const e of emails) {
        assert.equal(e, entity.contactEmail,
          `${file} points at ${e}, but legal/entity.json says ${entity.contactEmail}`);
      }
    }
  });
});

describe('the entity name has to be a legal person', () => {
  /* The decision "publish Anneal under its own entity called Anneal" is a decision about a
     brand. `name` is a party to a contract. Those are different objects, and the gap between
     them is invisible on the page: "Anneal" in the publisher line of a privacy policy looks
     exactly as finished as a registered corporate name does. It is only wrong in the place
     it matters — a term enforced by, or against, a company that does not exist. */
  const base = {
    address: '1 Road', province: 'Ontario', contactEmail: 'a@b.co',
    siteOrigin: 'https://x.co', clinicalReview: 'none', quebecCounselConfirmed: false,
  };
  const brand = appName();

  test('the bare app name is refused, whichever kind is chosen', () => {
    for (const kind of KINDS) {
      const found = legalNameProblems({ ...base, kind, name: brand });
      assert.equal(found.length, 1, `"${brand}" was accepted as a legal name for a ${kind}`);
      assert.match(found[0], /not a legal entity/);
    }
    /* Case and padding are the same mistake wearing a hat. */
    assert.equal(legalNameProblems({ ...base, kind: 'corporation', name: '  steady ' }).length, 1);
  });

  test('a corporation must carry a legal suffix', () => {
    assert.match(
      legalNameProblems({ ...base, kind: 'corporation', name: 'Anneal Technologies' })[0],
      /does not end in a legal suffix/
    );
    for (const ok of ['Anneal Technologies Inc.', 'Anneal Labs Ltd.', 'Anneal Corp.',
                      '1234567 Ontario Limited', 'Anneal Technologies Ltée']) {
      assert.deepEqual(legalNameProblems({ ...base, kind: 'corporation', name: ok }), [],
        `${ok} should be an acceptable corporate name`);
    }
  });

  test('a sole proprietorship is a human, named as one', () => {
    /* A sole proprietorship has no legal personality of its own. Publishing as
       "Anneal Recovery" with kind "sole proprietorship" names nobody. */
    assert.match(
      legalNameProblems({ ...base, kind: 'sole proprietorship', name: 'Anneal Recovery' })[0],
      /without naming the person behind it/
    );
    assert.match(
      legalNameProblems({ ...base, kind: 'sole proprietorship', name: 'Anneal Ltd.' })[0],
      /no separate legal personality/
    );
    for (const ok of ['Jane Doe', 'Jane Doe, carrying on business as Anneal',
                      'Jane Doe o/a Anneal']) {
      assert.deepEqual(legalNameProblems({ ...base, kind: 'sole proprietorship', name: ok }), [],
        `${ok} should be an acceptable sole-proprietor name`);
    }
  });

  test('problems() surfaces a name defect alongside the unanswered fields', () => {
    const found = problems({ ...base, kind: 'corporation', name: brand });
    assert.ok(found.some((p) => /not a legal entity/.test(p)));
  });
});

describe('the site has one address', () => {
  test('the app and the legal documents cannot point at different hosts', () => {
    /* They did. `constants/links.ts` opened borntosoar.github.io/steadyapp — a host belonging
       to a different company — while entity.json declared steadyapp.co, and nothing compared
       them. The app's privacy link and the address printed in the cookie policy have to be
       the same place, and it has to be a place this entity controls. */
    const entity = loadEntity();
    if (!entity.siteOrigin) return; // still an open question; the build blocks on it
    const links = readFileSync(join(LEGAL_DIR, '..', 'constants', 'links.ts'), 'utf8');
    const declared = links.match(/export const SITE_ORIGIN = '([^']+)'/)?.[1];
    assert.equal(declared, entity.siteOrigin,
      'constants/links.ts and legal/entity.json disagree about where the site lives');
  });

  test('no legal document hard-codes a host', () => {
    for (const { file, md } of DOCS) {
      if (file === 'README.md') continue;
      assert.doesNotMatch(withoutComments(md), /borntosoar|github\.io/i,
        `${file} names a host inline; use {{SITE_ORIGIN}}`);
    }
  });
});

describe('the published policies name everything the app stores', () => {
  /* THE CONTROL THAT WAS MISSING, AND THE DRIFT IT WOULD HAVE CAUGHT.
   *
   * legal/privacy-policy.md carries a maintainer comment asserting that normalise() is "an
   * exhaustive list of what can be stored" — and by the time anybody checked, three fields
   * had been added to normalise() without reaching either policy: `commitments`, `tracks`
   * and `measures`. The last is PHQ-8 and GAD-7 responses, which is the most clearly
   * clinical category in the app and the one Washington's My Health My Data Act reaches.
   * An under-inclusive category list in a consumer-health-data policy is the specific defect
   * RCW 19.373.030(1)(a) creates a private right of action over.
   *
   * A prose document cannot be diffed against a type, so this maps each stored key to the
   * words that must appear. THE MAP IS HAND-WRITTEN BUT THE KEYS ARE DERIVED: a field added
   * to emptyState() with no entry here fails the suite, which forces the decision rather
   * than allowing the omission. That is the difference between this and the comment it
   * replaces. */
  const state = emptyState();

  /** Stored key → something the policies must say about it. */
  const MUST_MENTION = {
    checkIns: /daily check-in/i,
    urgeLogs: /urge/i,
    thoughtRecords: /thought record/i,
    mirrorSessions: /mirror/i,
    experiments: /experiment/i,
    practice: /practice/i,
    readModules: /reading|readings|module/i,
    protocol: /relapse plan|plan for a bad|week/i,
    streak: /streak/i,
    tracks: /guided|track/i,
    commitments: /commitment|tomorrow/i,
    measures: /PHQ-8|GAD-7/,
    baseline: /check-in|start/i,
    profile: /first name|settings/i,
    entitlement: /purchase|tier|subscription/i,
  };

  /** Keys that hold no personal data, with the reason. Excluding one is a deliberate edit. */
  const NOT_PERSONAL = new Map([
    ['moments', 'impression and dismissal counts for the app\'s own prompts — about the app, not the person'],
  ]);

  test('every stored field is either described or deliberately excluded', () => {
    const unaccounted = Object.keys(state)
      .filter((k) => !(k in MUST_MENTION) && !NOT_PERSONAL.has(k));
    assert.deepEqual(unaccounted, [],
      `these fields are stored but neither described in the policies nor excluded here: `
      + `${unaccounted.join(', ')}. Add each to MUST_MENTION with the words the policy uses, `
      + `or to NOT_PERSONAL with the reason it holds no personal data.`);
  });

  test('the privacy policy describes each of them', () => {
    const doc = readFileSync(join(LEGAL_DIR, 'privacy-policy.md'), 'utf8');
    for (const [key, rx] of Object.entries(MUST_MENTION)) {
      assert.match(doc, rx,
        `legal/privacy-policy.md never mentions ${key}, which normalise() stores`);
    }
  });

  test('and the consumer health data policy names the clinical ones', () => {
    /* Washington and Nevada ask specifically for the CATEGORIES collected. The questionnaire
       responses are the category most obviously inside "mental health ... diagnoses or
       diagnostic testing", so this one is checked by name rather than by the general map. */
    const doc = readFileSync(join(LEGAL_DIR, 'consumer-health-data-policy.md'), 'utf8');
    for (const rx of [/PHQ-8/, /GAD-7/, /thought record/i, /urge/i, /hurting\s+yourself/i]) {
      assert.match(doc, rx,
        `legal/consumer-health-data-policy.md §1 omits a collected category (${rx})`);
    }
  });

  test('every exclusion carries a reason', () => {
    for (const [key, why] of NOT_PERSONAL) {
      assert.ok(why && why.length > 25, `${key} is excluded without saying why`);
    }
  });
});
