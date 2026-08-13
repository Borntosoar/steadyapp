/* Who publishes Steady, resolved once and substituted into the legal documents.
 *
 * WHY THIS EXISTS. Before it did, the publisher's identity appeared as
 * `[LEGAL ENTITY NAME — TODO]` in eight places across five documents, and the registered
 * address in two more. That is not a formatting problem. Filling those in by hand is nine
 * separate opportunities to typo a legal name, and — the failure that actually matters —
 * every later change to the entity has to find all nine again. A privacy policy naming one
 * company and terms of use naming another is a real defect in a real legal document, and
 * nothing in the repository would have noticed.
 *
 * So the documents now carry tokens and the facts live in legal/entity.json. One edit, one
 * place, and the checks below make a partial fill impossible to publish.
 *
 * WHY NULL RATHER THAN A PLACEHOLDER STRING. A null is a question that has not been answered.
 * A string like "Steady Inc." is an answer, and a wrong one — it reads as filled-in to every
 * subsequent reader, including whichever lawyer reviews this. Nothing here invents a fact
 * about a legal entity that does not exist yet.
 *
 * Loadable in bare Node with no dependencies, so __tests__/legal.test.mjs can check the
 * documents and the data agree without running a build. */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LEGAL_DIR = join(ROOT, 'legal');

/** The tokens the documents may use, and what each one is for.
 *
 *  An allowlist, not a free substitution over whatever `entity.json` happens to contain.
 *  A document that referred to `{{ENTITY_EMAIL}}` when the field is called `contactEmail`
 *  would otherwise render the braces to a reader as though they were prose. */
export const TOKENS = {
  ENTITY_NAME: 'name',
  ENTITY_ADDRESS: 'address',
  PROVINCE: 'province',
  CONTACT_EMAIL: 'contactEmail',
  SITE_ORIGIN: 'siteOrigin',
};

/** The app's own name, read from app.json rather than repeated here. Used to catch the
 *  mistake described at `legalNameProblems` below: writing the brand into the field that
 *  has to hold a legal person. */
export function appName(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo.name;
}

/** Suffixes that mark a Canadian corporate name. Federal incorporation and every province
 *  require the name to end in some member of this set (or its French equivalent), so a
 *  corporate name without one is not yet a corporate name. */
const CORPORATE_SUFFIXES = [
  'inc', 'inc.', 'incorporated', 'ltd', 'ltd.', 'limited', 'corp', 'corp.', 'corporation',
  'ltée', 'ltée.', 'limitée', 'ulc', 'société',
];

/** How "this human trades under this name" is written — which is what a sole proprietor's
 *  legal name looks like when they publish under a brand rather than under their own name. */
const TRADE_NAME_FORMS = [
  'carrying on business as', 'operating as', 'o/a', 'c.o.b.', 'doing business as', 'd/b/a',
];

/** The fields that must be answered before anything is published. `contactEmail` is already
 *  known and is not in here; `quebecCounselConfirmed` is a gate rather than a field, handled
 *  separately below.
 *
 *  `siteOrigin` joined this list when Steady became its own entity. It had been
 *  `borntosoar.github.io/steadyapp` in `constants/links.ts` and `steadyapp.co` here — two
 *  different answers, neither checked against the other, one of them a URL under an account
 *  belonging to a different company. It is the address printed in the cookie policy and the
 *  address the app's own privacy link opens, so it has to be one answer and it has to be
 *  one this entity controls. */
export const REQUIRED = ['name', 'kind', 'address', 'province', 'siteOrigin'];

/** Canada's provinces and territories, spelled as the documents will print them. Checked
 *  rather than accepted freely, because "ON" or "Ontario, Canada" in a choice-of-law clause
 *  is the kind of thing that reads fine and is wrong. */
export const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut',
  'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

export const KINDS = ['sole proprietorship', 'corporation'];

export function loadEntity(dir = LEGAL_DIR) {
  return JSON.parse(readFileSync(join(dir, 'entity.json'), 'utf8'));
}

/** Every `{{TOKEN}}` that actually appears in the legal documents, with the files it is in. */
export function tokensUsed(dir = LEGAL_DIR) {
  const used = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const md = readFileSync(join(dir, file), 'utf8');
    for (const m of md.matchAll(/\{\{([A-Z_]+)\}\}/g)) {
      if (!used.has(m[1])) used.set(m[1], new Set());
      used.get(m[1]).add(file);
    }
  }
  return used;
}

/** Whether `name` is a name a contract can actually be against.
 *
 *  THE MISTAKE THIS CATCHES. The decision "publish this under a separate entity called
 *  Steady" is a decision about a brand. `name` is not the brand — it is the party to a
 *  contract, and terms of use are only enforceable by, and against, a legal person that
 *  exists. "Steady" on its own is neither: until a corporation of that name is registered
 *  or a human declares they trade under it, there is nobody on the other side of §42 of the
 *  terms. A privacy policy naming a company that does not exist is not a smaller problem
 *  than one naming the wrong company; PIPEDA's accountability section needs somebody real to
 *  be accountable.
 *
 *  So the brand alone is rejected, and each kind is held to the shape its own name takes:
 *  a corporation ends in a legal suffix, a sole proprietor is a human — either under their
 *  own name, or their own name plus the trade name they operate under.
 *
 *  Deliberately shallow. It cannot know whether the name is registered, whether it survived
 *  a NUANS search, or whether somebody else holds the trademark. It only refuses the one
 *  error that looks completely finished on the page. */
export function legalNameProblems(entity, root = ROOT) {
  const out = [];
  const name = typeof entity.name === 'string' ? entity.name.trim() : '';
  if (!name) return out;

  const brand = appName(root);
  if (name.toLowerCase() === brand.toLowerCase()) {
    out.push(
      `entity.json: "${name}" is the app's name, not a legal entity. A contract needs a ` +
        `party that exists: either a registered corporation ("${brand} Technologies Inc.") ` +
        `or the human behind it ("Firstname Lastname, carrying on business as ${brand}"). ` +
        `See legal/README.md §3.`
    );
    return out;
  }

  const lower = name.toLowerCase();
  const lastWord = lower.split(/\s+/).pop();

  if (entity.kind === 'corporation' && !CORPORATE_SUFFIXES.includes(lastWord)) {
    out.push(
      `entity.json: kind is "corporation" but "${name}" does not end in a legal suffix ` +
        `(Inc., Ltd., Corp., Limited, Ltée …). Use the name exactly as it appears on the ` +
        `certificate of incorporation — it is printed verbatim into the terms.`
    );
  }

  if (entity.kind === 'sole proprietorship') {
    const usesTradeName = TRADE_NAME_FORMS.some((f) => lower.includes(f));
    if (CORPORATE_SUFFIXES.includes(lastWord)) {
      out.push(
        `entity.json: kind is "sole proprietorship" but "${name}" ends in a corporate ` +
          `suffix. A sole proprietorship has no separate legal personality — the party is ` +
          `the individual. Either set kind to "corporation" or name the human.`
      );
    } else if (lower.includes(brand.toLowerCase()) && !usesTradeName) {
      out.push(
        `entity.json: kind is "sole proprietorship" and "${name}" carries the brand without ` +
          `naming the person behind it. Write it as "Firstname Lastname, carrying on ` +
          `business as ${brand}" so the contract has a party.`
      );
    }
  }

  return out;
}

/** Everything wrong with the current entity.json, as a list of sentences a person can act on.
 *
 *  Returns [] when it is publishable. Deliberately reports ALL of them rather than the first:
 *  someone filling this in wants the whole remaining list, not one round trip per field. */
export function problems(entity, dir = LEGAL_DIR) {
  const out = [];

  for (const field of REQUIRED) {
    if (entity[field] === null || entity[field] === undefined || entity[field] === '') {
      out.push(`entity.json: "${field}" is still unanswered.`);
    }
  }

  if (entity.province && !PROVINCES.includes(entity.province)) {
    out.push(
      `entity.json: province "${entity.province}" is not one of the thirteen, spelled in full ` +
        `(e.g. "British Columbia", not "BC"). It is printed verbatim into the governing-law clause.`
    );
  }

  if (entity.kind && !KINDS.includes(entity.kind)) {
    out.push(`entity.json: kind must be one of ${KINDS.map((k) => `"${k}"`).join(' or ')}.`);
  }

  out.push(...legalNameProblems(entity));

  /* Quebec is a different legal package, not a different word in the same one.
   *
   * The Charter of the French Language as amended by Bill 96 requires consumer contracts to
   * be available in French; Law 25 imposes privacy duties beyond PIPEDA including a named,
   * published privacy officer; and Quebec's Consumer Protection Act restricts liability
   * language that is unremarkable in the rest of Canada. This repository's documents are
   * English-only and written to PIPEDA. Publishing them under a Quebec choice of law without
   * a lawyer having looked would be shipping a known defect in a legal document.
   *
   * A flag rather than an attempt, because writing French consumer-contract text and a Law 25
   * privacy programme is not something to improvise. */
  if (entity.province === 'Quebec' && entity.quebecCounselConfirmed !== true) {
    out.push(
      'Quebec: these documents are English-only and written to PIPEDA. Bill 96 (French ' +
        'consumer contracts), Law 25 (privacy duties beyond PIPEDA, including a published ' +
        'privacy officer) and the Consumer Protection Act (liability language) all apply and ' +
        'none is addressed here. See legal/README.md. Set "quebecCounselConfirmed": true only ' +
        'once a lawyer has actually reviewed it.'
    );
  }

  const known = new Set(Object.keys(TOKENS));
  for (const [token, files] of tokensUsed(dir)) {
    if (!known.has(token)) {
      out.push(
        `{{${token}}} in ${[...files].join(', ')} is not a known token. ` +
          `Known: ${[...known].map((k) => `{{${k}}}`).join(', ')}.`
      );
    }
  }

  return out;
}

/** Substitute the tokens. Throws rather than leaving a `{{...}}` in a published document —
 *  braces rendered to a reader in a privacy policy look exactly like the software failure
 *  they are. */
export function fill(md, entity) {
  let out = md;
  for (const [token, field] of Object.entries(TOKENS)) {
    out = out.replaceAll(`{{${token}}}`, String(entity[field]));
  }
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) throw new Error(`unsubstituted token ${leftover[0]}`);
  return out;
}
