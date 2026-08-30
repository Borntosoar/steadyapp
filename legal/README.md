# Legal and policy set

**These are drafts, not legal advice.** They were written against the actual source — every
factual claim about what Anneal does was checked in the code rather than assumed — but
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
| `ai-policy.md` | No AI in the product; the content was AI-drafted. Both, plainly. | No, but publish it anyway |
| `consumer-health-data-policy.md` | Washington MHMDA / Nevada SB 370. Must be its own homepage link. | **Yes, if selling into WA or NV** |

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
- **Hosting:** static, no cookies. **Which host is now an open question** — see §3.5.
- **Publisher: Anneal's own entity, separate from SOAR.** Anneal is not published under the
  SOAR entity or its Apple Developer account. This settles ownership; it does not settle the
  entity's *name* — see §3.2, and the two places SOAR's identity is still baked into the
  build at §3.6.
- **Retention of purchase records:** six years, per the CRA's general rule for business
  records.

## US and Canadian review, August 2026 — what it found

Three reviews ran over the document set and the code: one on US federal and state law, one on
Canadian federal and provincial law, one on the app's real attack surface. What follows is the
short version; the fixes are in the git history and the open items are in §3 and §5.

**The document set was built for the wrong US regime.** It carries a CCPA section, and CCPA is
the one US law that almost certainly never applies — a pre-revenue publisher meets none of its
three thresholds. The six that plausibly DO apply — Washington's My Health My Data Act, Nevada
SB 370, Connecticut SB 3, the Texas and Utah App Store Accountability Acts, and the FTC Health
Breach Notification Rule — appeared nowhere in this folder. `consumer-health-data-policy.md`
now covers the first two. The others are in §5.

**The Quebec gate was checking the wrong fact, and it was a false-negative generator.** It
fired only when `province === 'Quebec'`. Neither Bill 96 nor Law 25 is triggered by where the
publisher is registered — Law 25 binds anyone carrying on an enterprise who holds personal
information, and the Charter reaches goods offered to consumers in Quebec. Both follow the
customer. Worldwide App Store availability includes Canada, which includes Quebec. So setting
the province to Ontario published clean, with no warning, in precisely the case where these
documents are non-compliant. Fixed: it now blocks from every province until counsel confirms.

**The privacy policy said the journal was plain text, months after the encryption shipped.**
Its own break-risk list had predicted that exact drift. Predicting is not preventing, so it is
a test now — the policy must name the cipher `lib/crypto.ts` actually uses.

**The camera position is stronger than the documents claimed, and is now stated properly.**
BIPA, CUBI and Washington's biometric statute all turn on a template being created, not on a
camera being on. The app creates none — no detection, no landmarking, no ref on the
CameraView, so `takePictureAsync` is structurally unreachable. That is a real defence and it is
now written in the statutory phrase, with four tests that fire if anybody adds face processing.

**Nothing in the attack-surface review was a break.** Every deep-link parameter is validated
against a closed set; the one mount-time write is guarded by an in-memory flag a URL cannot
forge; `normalise()` is a real allowlist and prototype pollution is unreachable; there is no
OTA path and three separate mechanisms stop one reappearing. Six findings, all hardening:
the app-switcher snapshot, the keyboard cache on the relapse plan, an unvalidated provider
response, an unpinned release CLI, an inherited backup default, and a note on `importJson`.

---

## 3. What is still open

Everything else is written. Nothing fake was invented, so these are the whole remaining gap.

**They all live in `legal/entity.json`**, and the documents fill themselves from it — they
carry `{{ENTITY_NAME}}`, `{{ENTITY_ADDRESS}}`, `{{PROVINCE}}`, `{{CONTACT_EMAIL}}` and
`{{SITE_ORIGIN}}` rather than the text. Not tidiness: the publisher's identity was written out by hand in **nineteen**
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

   ⚠ **Quebec applies whatever this field says, and that is not what this paragraph used to
   claim.** It used to end "Any other province and none of this applies", and
   `site/entity.mjs` gated on the same wrong fact — so setting the province to Ontario
   published clean, with no warning, in exactly the case where these documents are
   non-compliant. Neither statute follows the publisher. Law 25 binds any person carrying on
   an enterprise who holds personal information about others; the Charter of the French
   Language reaches goods and services offered to consumers **in** Quebec. Both follow the
   customer, and worldwide App Store availability includes Quebec.

   So: the Charter as amended by Bill 96 requires consumer contracts and related documentation
   to be available in French — which collides directly with the English-only decision in
   `docs/LOCALISATION.md` §3. Law 25 adds privacy duties beyond PIPEDA, including a published
   privacy officer. Quebec consumer law restricts liability language that is fine elsewhere in
   Canada. The build blocks on all three, from every province, until ONE of two separate
   fields is set — and they are separate now precisely because they are different facts:

   - `quebecCounselConfirmed` — a lawyer has read these documents against Bill 96, Law 25 and
     the Consumer Protection Act. This makes the documents fit for Quebec.
   - `canadaExcluded` — the app is not sold in Canada, so Quebec never sees them. Cheaper,
     immediate, and it makes the documents no better.

   There used to be one field, named for the first, and somebody taking the second route had
   to assert that a lawyer had reviewed the documents in order to record that none had. A
   boolean that has to be lied to is not evidence of anything.

   ⚠ **Setting `canadaExcluded` also requires `docs/SUBMISSION-ANSWERS.md` to say Canada is
   excluded**, and `problems()` checks it. The exclusion only becomes true in App Store
   Connect's territory list, which no test can reach; what a test can do is insist the claim
   appears in the document somebody actually types into that form.

   ⚠ **AND EXCLUDING CANADA HAS A CONSEQUENCE NOBODY HAS PRICED.** `legal/terms-of-use.md`
   §15 chooses the law of `{{PROVINCE}}` plus the federal laws of Canada, and §1 of this file
   explains why the province is required rather than pedantic. A Canadian publisher who
   excludes Canada is choosing the governing law of a country they have decided not to sell
   in, and — more to the point — cannot sell to anyone where they live. That may still be the
   right trade while the documents are English-only and PIPEDA-shaped, but it is a bigger
   decision than "skip one market" and it should be made knowing that.

2. **Legal entity name.** ⚠ **"Anneal" is not an answer to this field, and the build now
   says so.** The brand and the party to a contract are different objects. Terms of use are
   enforceable by and against a *legal person that exists*; "Anneal" on its own is neither a
   registered corporation nor a human, so a contract naming it has nobody on the other side,
   and PIPEDA's accountability section has nobody to be accountable. `legalNameProblems()`
   in `site/entity.mjs` rejects the bare app name outright, requires a corporate name to end
   in a real suffix, and requires a sole proprietorship to name the human. It cannot check
   registration, a NUANS search, or the trademark — only the error that looks finished.

   Turning "Anneal" into a legal name means picking one of two shapes. **This used to be
   written here as a cost-and-speed choice with the veil as a trailing clause, and that is the
   wrong frame.** On the US facts it is the single largest financial exposure in this
   repository, and it should go to counsel in those terms rather than as an admin question.

   **What is actually behind the choice.** This app is sold into all fifty states, and it holds
   exactly the category of data that two US regimes attach private rights of action to:

   - **Washington's My Health My Data Act.** A violation is a per se Consumer Protection Act
     violation under RCW 19.86, which means a private suit, treble damages, attorney's fees,
     and class treatment. Washington is the live one — whether the Act reaches data that never
     leaves the phone is genuinely unsettled (see §5 and
     `consumer-health-data-policy.md`), and "unsettled" is not the same as "safe".
   - **Illinois BIPA**, at $1,000 negligent and $5,000 intentional **per violation**, with a
     private right of action. This one does **not** apply today and the app is built so it
     does not — no template, no face geometry, no ref on the camera. It is listed because it
     is one feature away, and because per-violation statutory damages aggregate across a class
     in a way ordinary damages do not.

   A sole proprietor has personal assets behind both. That is the decision, and it is not
   about filing fees.

   **What incorporation does and does not buy.** It puts a company between a claim and the
   founder's house, which is the whole point and is worth real money here. It does **not** make
   the founder untouchable: a director or officer can still be personally liable for their own
   tortious acts, so incorporating is not a licence to be careless about what the app claims or
   how it handles data. It is a limit on the blast radius, not an exemption. Ask counsel where
   the line sits for a solo founder who is also the developer, because that is this case.

   The two shapes:

   - **Incorporate** — `Anneal Inc.` or `Anneal Technologies Inc.`, whichever survives a NUANS
     name search. Try the bare form first: "Anneal" is a rare word commercially, which is why
     it was chosen. Note that the same was said of the previous name and turned out to be
     wrong on the App Store, so treat this as worth testing rather than assuming. Apple's
     Organization account requirement (`docs/APP-STORE.md` §5.1) effectively forces this
     anyway, since the D-U-N-S number it needs in practice means a corporation — and that
     number takes weeks, so it is worth starting before it is the last thing standing.
     **The practical forcing function and the risk argument point the same way, which is
     unusual and makes this an easy decision to make early.**
   - **Sole proprietorship with a registered trade name** — the party is you, written
     `Firstname Lastname, carrying on business as Anneal`. Faster and cheaper today. There is
     no corporate veil, so everything in the paragraphs above lands on the founder personally,
     and there is a second cost: §3.3 already notes that a sole proprietor's registered address
     is normally their home, and that address goes in published legal documents for a
     body-dysmorphia app. Choosing this shape is choosing both of those, and it is a defensible
     choice for a pre-revenue product — but it should be a chosen one.

   Separately: the App Store name `Anneal` has to be free. A web search on 2026-08-18 found
   **no App Store app of that name at all**, which is why it is the name — but that is not an
   authoritative check. `scripts/check-name.mjs` queries Apple's search API and RDAP directly
   and could not run in the sandbox this was renamed in, so run it somewhere with outbound
   HTTPS. Reserve the name in App Store Connect as soon as it looks clear (free, and it holds
   it), and do a CIPO trademark search before the name is printed on a contract.
   `docs/APP-STORE.md` §1 records what was found for each name considered.

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

4. **Entity kind.** `"sole proprietorship"` or `"corporation"`, matching the choice in §3.2.
   It is a separate field because the name check depends on it.

5. **Site origin.** Where the published documents actually live. This became an open question
   the moment Anneal stopped being a SOAR product: the repo held **two different answers**,
   `https://borntosoar.github.io/steadyapp` in `constants/links.ts` and `https://steadyapp.co`
   in `entity.json`, with nothing comparing them. The first is a host belonging to a different
   company. This is the address the app's own privacy link opens and the address printed in
   the first line of the cookie policy, so it has to be one answer, and one this entity
   controls. `__tests__/legal.test.mjs` now fails if the two disagree once the field is
   answered.

### 3.6 Where SOAR was baked in

- **`app.json` → `bundleIdentifier` and `package` are `com.anneal.app`.** ✅ Decided. They
  were `com.borntosoar.steady` — reverse-DNS under SOAR's domain, on an app that is neither
  SOAR's nor called Steady. Changed **before the first submission**, which was the only
  window: a bundle identifier is permanent afterwards. It cannot be renamed, it binds the app
  to the Apple account that first registers it, and changing it later means a new App Store
  listing with no reviews and no downloads.

  Two things to know about the value. It is **not verified as unique** — bundle IDs are
  first-come across the whole store and the check needs App Store Connect, so confirm it when
  registering the App ID. And by reverse-DNS convention it implies control of `anneal.com`;
  Apple does not check domain ownership, so this is cosmetic, but if the entity ends up on
  `anneal.app` instead, the convention reads slightly off. `__tests__/store-metadata.test.mjs`
  now fails if it drifts back to a former name.
- **`README.md`** still clones from `Borntosoar/steadyapp`. Cosmetic, but it is where a new
  contributor forms their first idea of who owns this.

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
2. **The medical-device line.** Anneal is self-help built on CBT/ERP methods, offered to a
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

---

## What these reviews did NOT do, and must not be read as having done

Three things, and the distinction matters more than the list.

**No French translation was written, and none should be improvised.** If counsel concludes
Quebec applies, `terms-of-use.md` and `privacy-policy.md` need professional French versions —
Charter art. 55 requires a contract of adhesion to be drawn up in French and *remitted to and
examined by* the other party before they may bind themselves in another language. Machine
translation is the wrong tool twice over: it produces consumer-contract text nobody has
verified, and `docs/LOCALISATION.md` §3 makes the separate point that translating the app's
copy silently voids the English-pattern-matching safety tests in `__tests__/copy.test.mjs`,
which is what currently stops treatment claims shipping. Budget for a translator or exclude
Canada from the listing. Those are the two real options.

**No legal conclusion was reached about whether the on-device data is "collected".** It is the
question underneath PIPEDA, Law 25, MHMDA and CTDPA all at once, and there is no Canadian or
Washington authority squarely on it. The argument that it is not is control-based and good; the
counter-argument is that MHMDA reaches "infer, derive, or otherwise process ... in any manner"
and that the publisher determines the purposes and means regardless of who holds the bytes.
Everything written here is drafted so the answer does not change it. That is deliberate, and it
is not the same as the answer being known.

**No incorporation decision was made, and it is not an administrative one.** §3.2 frames sole
proprietorship versus incorporation as cost and speed. On the US facts it is the largest
financial exposure in this repository: MHMDA's private right of action carries treble damages
and fee-shifting, BIPA carries $1,000/$5,000 per violation, and both are class-action shapes.
A sole proprietor selling a body-dysmorphia app into fifty states has personal assets behind
every one of them. Treat incorporation as a compliance control and ask counsel in those terms.

**And the standing caveat, which has not moved.** Nobody who wrote any of this is a lawyer.
Every document in this folder is a draft checked against the source code, which is a different
and much smaller thing than legal review. §5 lists what to buy an hour of a professional's time
for; the three items above are now at the top of it.
