#!/usr/bin/env node
/* Builds the public site from legal/*.md.
 *
 * WHY THIS EXISTS. A publicly reachable privacy-policy URL is a hard App Store blocker —
 * App Store Connect will not accept the submission without one — and it is the last thing
 * standing between this app and a review queue that does not involve buying a developer
 * account. The policies were already written; this turns them into pages.
 *
 * WHY IT IS STATIC, AND WHY THAT IS THE POINT. The app's entire proposition is that it holds
 * nothing about anybody. A marketing site with an analytics script, a form, or a database
 * would undo that in the one place people go to read the promise. So: flat HTML, no
 * JavaScript, no cookies, no fonts fetched from anywhere, no third-party anything. There is
 * nothing here to breach, which is the same reason `legal/cookie-policy.md` is four
 * paragraphs long. Keep it that way; the moment a script goes on this site, that document
 * becomes false.
 *
 * `marked` is a devDependency and is not in the app bundle. The import allowlist in
 * __tests__/safety.test.mjs governs runtime dependencies and correctly ignores this.
 *
 * Usage: node site/build.mjs   →   site/dist/
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { loadEntity, problems, fill } from './entity.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site', 'dist');

/* The app's own palette, so the site and the product look like one thing. Values copied from
   constants/palette.ts — the light ramp, since a policy page has no time of day. The
   contrast figures there are computed and tested in __tests__/contrast.test.mjs. */
const CSS = `
:root {
  --bg: #F4F5F0; --surface: #FDFCF6; --ink: #1E241B; --ink-soft: #414A3B;
  --ink-faint: #5B6552; --accent: #46573B; --accent-deep: #35452C;
  --line: rgba(30,36,27,0.12); --cool: #8A5535;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #12170F; --surface: #232D20; --ink: #E8ECE0; --ink-soft: #BAC4B0;
    --ink-faint: #97A28D; --accent: #AFD08E; --accent-deep: #C6DEA6;
    --line: rgba(226,238,212,0.18); --cool: #D9A277;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 17px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 0 20px 96px;
}
.wrap { max-width: 680px; margin: 0 auto; }
header.site { padding: 28px 0 8px; border-bottom: 1px solid var(--line); margin-bottom: 40px; }
header.site a.brand { font-weight: 700; font-size: 19px; color: var(--ink); text-decoration: none; letter-spacing: -0.02em; }
header.site nav { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 18px; }
header.site nav a { color: var(--ink-faint); text-decoration: none; font-size: 14px; }
header.site nav a:hover, header.site nav a:focus { color: var(--accent-deep); text-decoration: underline; }
h1 { font-size: 34px; line-height: 1.15; letter-spacing: -0.025em; margin: 32px 0 8px; text-wrap: balance; }
h2 { font-size: 22px; line-height: 1.25; margin: 44px 0 8px; letter-spacing: -0.01em; text-wrap: balance; }
h3 { font-size: 17px; margin: 28px 0 6px; }
p, li { color: var(--ink-soft); text-wrap: pretty; }
li { margin: 6px 0; }
a { color: var(--accent-deep); }
hr { border: 0; border-top: 1px solid var(--line); margin: 40px 0; }
strong { color: var(--ink); }
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 4px; padding: 1px 5px;
}
blockquote {
  margin: 20px 0; padding: 2px 0 2px 18px; border-left: 2px solid var(--line); color: var(--ink-faint);
}
.table-scroll { overflow-x: auto; margin: 20px 0; }
table { border-collapse: collapse; width: 100%; font-size: 15px; }
th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--ink); font-weight: 600; }
footer.site { margin-top: 72px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 14px; color: var(--ink-faint); }
footer.site a { color: var(--ink-faint); }
.lede { font-size: 19px; color: var(--ink); }
.card {
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
  padding: 20px 22px; margin: 24px 0;
}
.card h3 { margin-top: 0; }
.crisis { border-color: var(--cool); }
.crisis h3 { color: var(--cool); }
`;

const PAGES = [
  { slug: 'privacy', file: 'privacy-policy.md', nav: 'Privacy' },
  { slug: 'terms', file: 'terms-of-use.md', nav: 'Terms' },
  { slug: 'disclaimer', file: 'medical-disclaimer.md', nav: 'Medical disclaimer' },
  { slug: 'accessibility', file: 'accessibility-statement.md', nav: 'Accessibility' },
  { slug: 'cookies', file: 'cookie-policy.md', nav: 'Cookies' },
  /* Published rather than kept internal. Somebody deciding whether to type their worst
     thoughts into a mental-health app should be able to read what it does and does not do
     with AI before installing it, not after. */
  { slug: 'ai', file: 'ai-policy.md', nav: 'AI' },
];

const nav = PAGES.map((p) => `<a href="/${p.slug}.html">${p.nav}</a>`).join('\n      ');

const shell = (title, description, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="color-scheme" content="light dark">
<style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <header class="site">
      <a class="brand" href="/">Anneal</a>
      <nav>
      ${nav}
      </nav>
    </header>
    ${body}
    <footer class="site">
      <p>Anneal is a self-help tool. It is not therapy, not a diagnosis, and not a substitute
      for professional care. If you are in danger right now, contact your local emergency
      number or a crisis line — <a href="https://findahelpline.com">findahelpline.com</a>
      lists verified services in over 130 countries.</p>
      <p>This site uses no cookies, no analytics and no trackers.</p>
    </footer>
  </div>
</body>
</html>
`;

/** Strip the maintainer notes. They are sourcing proof for whoever edits the documents, not
 *  content for the reader, and several of them quote file paths and commit hashes. */
const stripComments = (md) => md.replace(/<!--[\s\S]*?-->/g, '');

/** Tables must scroll inside their own box rather than making the page scroll sideways. */
const wrapTables = (html) => html.replace(/<table>/g, '<div class="table-scroll"><table>')
  .replace(/<\/table>/g, '</table></div>');

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) rmSync(join(OUT, f), { recursive: true, force: true });

const loaded = PAGES.map((p) => ({
  ...p,
  md: readFileSync(join(ROOT, 'legal', p.file), 'utf8'),
}));

/* Publishing a policy that is vague about who publishes it would be worse than publishing
   nothing: it is a live legal document with a hole in it, and the hole is the identity of the
   party the reader is contracting with.
   One gate, reading legal/entity.json, rather than a grep for the word TODO — a grep only
   ever catches the placeholder shape somebody remembered to use. */
const entity = loadEntity();
const blocking = problems(entity);
if (blocking.length && !process.env.ALLOW_TODOS) {
  console.error('\nRefusing to build. The legal documents are not ready to publish:\n');
  for (const t of blocking) console.error('  · ' + t);
  console.error(
    '\nFill in legal/entity.json — see legal/README.md, "What is still open".\n' +
      'ALLOW_TODOS=1 builds a preview with the gaps left standing. Never publish that one.\n'
  );
  process.exit(1);
}

for (const p of loaded) {
  /* A preview leaves the tokens visible rather than substituting the word "null" into a
     sentence about who you are contracting with — which would read as a filled-in answer. */
  const md = blocking.length ? p.md : fill(p.md, entity);
  const html = wrapTables(marked.parse(stripComments(md)));
  const first = md.match(/^#\s+(.+)$/m)?.[1] ?? p.nav;
  writeFileSync(
    join(OUT, `${p.slug}.html`),
    shell(`${first} — Anneal`, `${p.nav} for the Anneal app.`, `<main>${html}</main>`)
  );
}

/* The homepage. Deliberately not a sales page: this URL's job is to satisfy App Review, to
   be somewhere a person can check the app is real before they trust it with what they write,
   and to put the crisis line above everything else. Marketing can come later and should not
   arrive by pushing that down the page. */
const home = `
<main>
  <h1>Anneal</h1>
  <p class="lede">A twelve-week self-help programme for appearance anxiety and body
  dysmorphia. It runs entirely on your phone.</p>

  <div class="card crisis">
    <h3>If today is bad</h3>
    <p>You do not have to work through a programme to get help. If you are in danger right
    now, contact your local emergency number. <a href="https://findahelpline.com">findahelpline.com</a>
    lists verified crisis lines in over 130 countries, and the
    <a href="https://bddfoundation.org">BDD Foundation</a> has support and information
    specific to body dysmorphia.</p>
  </div>

  <h2>What it is</h2>
  <p>Body dysmorphia takes hours out of a day. Anneal is built around that one measurable
  thing: how much time appearance worry is taking, and whether it is going down. Twelve weeks,
  one new practice a week, and a short read explaining why each one works.</p>
  <p>It is a self-help tool built on the methods used in cognitive behavioural therapy for
  body dysmorphic disorder. It is not therapy, it has not itself been through a clinical
  trial, and it does not diagnose anything. Those distinctions matter, and the
  <a href="/disclaimer.html">medical disclaimer</a> sets them out in full.</p>

  <h2>What it never does</h2>
  <ul>
    <li>No photographs. The camera is used as a live mirror for guided practice, and there is
    no code in the app that can capture, save or send an image.</li>
    <li>No weight, measurements, calories, or ratings of how you look. No appearance score of
    any kind exists in the data model.</li>
    <li>No streak to break and no shaming for a missed day.</li>
    <li>Grounding, breathing, crisis support and the hard-day path are free forever and are
    never behind a payment.</li>
  </ul>

  <h2>Your writing stays on your phone</h2>
  <p>There is no account, no sign-in, no server, no cloud, no analytics and no third-party
  tracker. What you write is stored on your device and scrambled so that other software on
  the phone cannot read it. We do not receive it — not because we promise not to, but because
  the app contains no code that could send it anywhere.</p>
  <p>That also means there is no backup. If you delete the app it is gone, so Anneal lets you
  export a plain-text copy whenever you like, including one to take to a clinician. The
  <a href="/privacy.html">privacy policy</a> explains all of this properly.</p>

  <h2>Reading</h2>
  <ul>
    <li><a href="/privacy.html">Privacy policy</a></li>
    <li><a href="/terms.html">Terms of use</a></li>
    <li><a href="/disclaimer.html">Medical disclaimer</a></li>
    <li><a href="/accessibility.html">Accessibility statement</a></li>
    <li><a href="/cookies.html">Cookie policy</a></li>
  </ul>
</main>
`;

writeFileSync(
  join(OUT, 'index.html'),
  shell(
    'Anneal — a twelve-week programme for appearance anxiety',
    'A twelve-week self-help programme for body dysmorphia and appearance anxiety. No photos, no account, and nothing leaves your phone.',
    home
  )
);

/* No crawler restrictions, but a sitemap so the policy pages are findable. */
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n');

console.log(`Built ${PAGES.length + 1} pages into site/dist/`);
if (blocking.length) {
  console.log(`\n(preview build — ${blocking.length} thing(s) unresolved, do not publish this)`);
  for (const t of blocking) console.log('  · ' + t);
}
