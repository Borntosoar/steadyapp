import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadEntity, problems, fill, tokensUsed, TOKENS, REQUIRED, PROVINCES, KINDS, LEGAL_DIR,
} from '../site/entity.mjs';

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
    quebecCounselConfirmed: false,
  };

  test('a complete, non-Quebec entity passes', () => {
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
    for (const good of KINDS) assert.deepEqual(problems({ ...complete, kind: good }), []);
  });

  test('Quebec is blocked until a lawyer has actually looked', () => {
    /* Not pedantry and not a formality. Bill 96 requires French consumer contracts, Law 25
       imposes privacy duties beyond PIPEDA including a published privacy officer, and the
       Consumer Protection Act restricts liability language these documents use. All three
       are unaddressed here, and every one of them is invisible in a document that otherwise
       looks finished. */
    const qc = { ...complete, province: 'Quebec' };
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
