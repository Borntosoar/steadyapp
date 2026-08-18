#!/usr/bin/env node
/* Screens candidate app names against the two things that can kill one late.
 *
 * WHY THIS EXISTS. An App Store name has to be unique across the entire store, and the
 * rejection arrives after the icon, the screenshots, the legal documents and the entity
 * have all been built around it. The same is true of a domain: `legal/entity.json` prints
 * the site origin into the cookie policy and the app's own privacy link, so discovering
 * the domain is gone is a change to a legal document, not a change to a DNS record.
 *
 * Both are cheap to check and expensive to assume. This checks them.
 *
 * WHAT IT IS NOT. Neither signal is authoritative:
 *
 *   · **App Store Connect is the only authority on a name.** A name can be *reserved* by
 *     another developer and attached to an app that was never published — invisible to the
 *     search API, and still enough to block you. A clean result here means "no shipped app
 *     is using this", which is most of the risk but not all of it. Reserve the name in App
 *     Store Connect the moment you are serious; it costs nothing and holds it.
 *   · **This is not a trademark search.** A free domain and a free store name tell you
 *     nothing about whether somebody holds a mark in this class. For Canada that is the
 *     CIPO database; for the US, TESS. Do that before the name goes on a contract.
 *
 * Usage:
 *   node scripts/check-name.mjs                    # the shortlist below
 *   node scripts/check-name.mjs Tarn Ballast Keel  # your own
 *
 * Needs outbound HTTPS to itunes.apple.com and rdap.org. Sandboxed CI will not have it —
 * the run degrades to "unreachable" rather than lying, which is the only safe failure.
 */

const CANDIDATES = [
  /* Plain and steady — the first pass. */
  'Ballast', 'Keel', 'Elsewhere', 'Slackwater', 'Plumbline',
  /* More presence: a picture behind the word, without the mystical vocabulary that would
     undercut the clinician and academic channels this product depends on. */
  'Cairn', 'Lodestar', 'Stillpoint', 'Anneal', 'Fathom', 'Meridian', 'Solace', 'Nocturne',
];

/** Domains worth holding for an app like this. `.app` is a real TLD, enforces HTTPS, and is
 *  far less squatted than `.com`; `.co` is the usual fallback. */
const TLDS = ['com', 'co', 'app'];

const TIMEOUT = 12_000;

/** Apps whose name is the candidate, or begins with it followed by a separator — the
 *  "Brand: Keywords" shape the store listing itself uses, and the shape that actually
 *  collides. A substring match anywhere would flag "Anneal" against "Unsteady Hands" and
 *  drown the signal. */
function collides(trackName, name) {
  const a = trackName.trim().toLowerCase();
  const b = name.trim().toLowerCase();
  if (a === b) return true;
  return a.startsWith(b) && /^[\s:–—-]/.test(a.slice(b.length));
}

async function storeCollisions(name) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}` +
    `&entity=software&limit=200&country=CA`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`itunes ${res.status}`);
  /* The endpoint answers with `text/javascript`, so res.json() refuses it. */
  const { results = [] } = JSON.parse(await res.text());
  return results
    .filter((r) => collides(r.trackName ?? '', name))
    .map((r) => `${r.trackName} — ${r.sellerName ?? 'unknown seller'}`);
}

/** RDAP is the registries' own protocol and replaces WHOIS. 404 means no registration
 *  exists, which is as close to "available" as anything outside a registrar's cart. */
async function domainTaken(domain) {
  const res = await fetch(`https://rdap.org/domain/${domain}`, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { accept: 'application/rdap+json' },
  });
  if (res.status === 404) return false;
  if (res.ok) return true;
  throw new Error(`rdap ${res.status}`);
}

async function attempt(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    return { ok: false, why: err.name === 'TimeoutError' ? 'timeout' : err.message };
  }
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : CANDIDATES;
let anyUnreachable = false;

for (const name of names) {
  const [store, ...domains] = await Promise.all([
    attempt(() => storeCollisions(name)),
    ...TLDS.map((tld) => attempt(() => domainTaken(`${name.toLowerCase()}.${tld}`))),
  ]);

  const storeLine = store.ok
    ? (store.value.length ? `✗ ${store.value.length} shipped app(s)` : '✓ clear')
    : `? unreachable (${store.why})`;

  const domainLine = domains.map((d, i) => {
    if (!d.ok) return `${TLDS[i]}:?`;
    return `${TLDS[i]}:${d.value ? '✗' : '✓'}`;
  }).join('  ');

  if (!store.ok || domains.some((d) => !d.ok)) anyUnreachable = true;

  console.log(`\n${name.padEnd(12)} store ${storeLine.padEnd(26)} ${domainLine}`);
  if (store.ok) for (const hit of store.value.slice(0, 5)) console.log(`             · ${hit}`);
}

console.log(
  '\n✓ = free, ✗ = taken, ? = could not check.' +
  '\nA clear store result is not a reservation and not a trademark search — see the note at' +
  '\nthe top of this file before committing to a name.'
);

if (anyUnreachable) {
  console.log(
    '\nSome checks could not run. That is a network restriction, not a clean result —' +
    '\nre-run somewhere with outbound HTTPS before trusting the table above.'
  );
  process.exitCode = 2;
}
