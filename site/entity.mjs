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
};

/** The fields that must be answered before anything is published. `contactEmail` and
 *  `siteOrigin` are already known and are not in here; `quebecCounselConfirmed` is a gate
 *  rather than a field, handled separately below. */
export const REQUIRED = ['name', 'kind', 'address', 'province'];

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
