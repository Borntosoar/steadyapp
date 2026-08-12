# Legal and policy set

**These are drafts, not legal advice.** They were written against the actual source — every
factual claim about what Steady does was checked in the code rather than assumed — but
neither the person who wrote them nor the person reading them is a lawyer. Have a qualified
solicitor or attorney review them before publication. §5 below lists the specific questions
worth paying for, so the review is an hour rather than a project.

---

## What each document is

| File | What it is | Needs a public URL before submission? |
| --- | --- | --- |
| `privacy-policy.md` | GDPR / UK GDPR / CCPA / PIPEDA privacy notice | **Yes — hard App Store blocker** |
| `terms-of-use.md` | EULA and subscription terms | Yes (or use Apple's standard EULA — see below) |
| `medical-disclaimer.md` | Not therapy, not a diagnosis, not a medical device | Recommended, and also belongs in-app |
| `cookie-policy.md` | Marketing site only. The app has no cookies. | Only once a site exists |
| `accessibility-statement.md` | What is supported, and the gaps, stated honestly | No, but publish it anyway |

## Why the privacy policy is unusual, and why that is worth protecting

Most privacy policies are long because the product collects a lot. This one is mostly a
description of an absence: no account, no server, no analytics, no tracker, no personal data
reaching the operator at all. Verified in code, and enforced by `__tests__/safety.test.mjs`,
which now checks every third-party import against an allowlist and fails the build on
anything new.

That is a genuine commercial asset, not just a compliance convenience. It is the reason the
GDPR and CCPA sections are short, the reason there is no data-processing agreement to sign,
the reason there is no breach-notification exposure worth the name, and — per
`docs/GROWTH.md` — the reason institutional buyers who cannot touch a data-collecting app
can touch this one.

**It is also the most fragile thing in the repo.** Adding a backend, an analytics SDK, or
accounts makes several sentences in `privacy-policy.md` false on the day it ships. Each
document flags its own load-bearing sentences in an HTML comment at the end. Read those
before changing anything about data handling.

## Decided

- **Governing law: Canada.** Terms §15 uses the standard Canadian construction — the law of a
  named province plus the federal laws of Canada applying in it — with **non-exclusive**
  jurisdiction, so no customer anywhere is told a Canadian courtroom is their only route. No
  arbitration clause and no class-action waiver; see §15 for why not.
- **Privacy: PIPEDA is the primary regime**, with GDPR, UK GDPR and CCPA sections retained
  because the app is sold worldwide. The accountable individual under PIPEDA is the
  developer.
- **Contact:** steadyrecovery3@gmail.com, used throughout.
- **Effective dates:** set.
- **Hosting:** GitHub Pages, static, no cookies.
- **Retention of purchase records:** six years, per the CRA's general rule for business
  records.

## The three fields still open

Everything else is written. Nothing fake was invented, so these are the whole remaining gap.

**They all live in `legal/entity.json`**, and the documents fill themselves from it — they
carry `{{ENTITY_NAME}}`, `{{ENTITY_ADDRESS}}`, `{{PROVINCE}}` and `{{CONTACT_EMAIL}}` rather
than the text. Not tidiness: the publisher's identity was written out by hand in **nineteen**
places across five documents, and a privacy policy naming one entity while the terms of use
name another is a real defect in a real contract that nothing here would have caught. Now it
is one edit in one file.

`node site/build.mjs` **refuses to run** while any value is null, while a province is
abbreviated, or while the province is Quebec and nobody has confirmed a lawyer looked.
`ALLOW_TODOS=1` builds a preview with the gaps left standing; never publish that one.
`__tests__/legal.test.mjs` holds the documents and the data to each other, and fails if a
future edit writes the entity name back into a document inline.

1. **Province.** Required, and not pedantry: in Canada, contract law and consumer protection
   are **provincial**. "The laws of Canada" is not a complete choice of law. Use the province
   where the entity is registered or where you are resident. Spell it in full — it is printed
   verbatim into the governing-law clause, and the build rejects `ON`.

   ⚠ **If the answer is Quebec, three things change.** The Charter of the French Language (as
   amended by Bill 96) requires consumer contracts and related documentation to be available
   in French — which collides directly with the English-only decision in
   `docs/LOCALISATION.md` §3 and needs resolving before launch. Quebec's Law 25 adds privacy
   duties beyond PIPEDA, including a published privacy officer. And Quebec consumer law
   restricts some liability language that is fine elsewhere in Canada. Any other province and
   none of this applies.

2. **Legal entity name.** Sole proprietorship or an incorporated company? It changes the
   liability position, not just the wording — and Apple's Organization account requirement
   (`docs/APP-STORE.md` §5.1) usually implies a registered company with a D-U-N-S number, so
   the two decisions are really one.

3. **Registered address.** Follows from the entity — with one thing worth deciding
   deliberately rather than by default.

   A sole proprietor's registered address is normally their **home address**, and this one
   does not stay private: it is printed in the privacy policy and the terms, on a public URL,
   attached to an app about body dysmorphia. That is a real exposure to a real person, and
   it is the sort of thing that is obvious only after it is already indexed.

   Three ways out, all ordinary: incorporate and use the corporation's registered office;
   use a registered-agent or virtual-office address (roughly $200–400/yr in Canada, and it
   is what the service is for); or a commercial mailbox, though note that some registries and
   some of Apple's checks will not accept a PO box. Whatever is chosen has to be an address
   where legal notice can actually reach you — that is what it is for.

## Publishing

A privacy policy URL is a hard blocker: App Store Connect will not accept the submission
without one, and `docs/APP-STORE.md` §5.2 lists it as outstanding. It must be a live,
publicly reachable URL that does not require a login.

The cheapest correct answer is a static site — GitHub Pages, Cloudflare Pages or Netlify,
free tier, no server, no database. That keeps the marketing site the same shape as the app:
nothing to breach. `cookie-policy.md` assumes exactly this and stops being accurate if you
put an analytics script on it.

Once the URLs exist, two things must happen in the app, and `docs/APP-STORE.md` §5.4 tracks
both:

- **Privacy policy and Terms links on the paywall**, adjacent to the purchase button. This is
  the remaining half of guideline 3.1.2; the auto-renewal disclosure half is already done via
  `RENEWAL_TERMS` in `lib/entitlement.ts`.
- **The same URLs in App Store Connect** (Privacy Policy URL field, and the EULA field).

### Apple's standard EULA

Apple's standard licence agreement
(`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`) is acceptable and
removes the need to host your own. `terms-of-use.md` exists anyway because the standard EULA
says nothing about the hardship tier, the crisis-line disclaimer, or the acceptable-use
questions specific to this app. **Recommendation:** use the custom terms, and treat the
standard EULA as the fallback if review of the custom one slips.

## Checklist

- [ ] Legal entity decided and named throughout
- [ ] Governing law and jurisdiction chosen
- [ ] Contact email live and monitored
- [ ] Effective dates set
- [ ] Reviewed by a qualified lawyer (see below)
- [ ] Hosted at public URLs
- [ ] Privacy policy URL in App Store Connect
- [ ] EULA URL (or Apple's standard) in App Store Connect
- [ ] Both linked on the paywall in-app
- [ ] Medical disclaimer reachable in-app, not only on the web

## The questions worth paying a lawyer for

Everything else in these documents is boilerplate a competent lawyer will skim. These five
are the ones specific to this product, and they are where the money is well spent:

1. **Crisis-line liability.** The app lists third-party helplines it does not operate, cannot
   guarantee are staffed, and cannot guarantee are correct in every country. What is the
   exposure, and does the disclaimer in `medical-disclaimer.md` actually reduce it?
2. **The medical-device line.** Steady is self-help built on CBT/ERP methods, offered to a
   population with a recognised diagnosis. Where exactly does it sit relative to UK MHRA and
   EU MDR software-as-a-medical-device rules, and does any copy in `content/modules.ts` or
   `content/proof.ts` push it across?
3. **The hardship tier.** Three months free, no questions, no form. Any consumer-law or tax
   consequence to giving away a paid service without collecting a reason?
4. **Sixteen-plus, and what happens when a fifteen-year-old uses it anyway.** The age rating
   is a control, not a wall. What is required, and is anything more needed under the UK
   Children's Code?
5. **Whether "no data leaves the device" removes the controller obligations it appears to.**
   The answer is probably mostly yes, and it is worth an hour of a professional's time to
   know exactly which duties survive rather than assuming.
