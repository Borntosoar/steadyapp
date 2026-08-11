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

## Decisions only you can make

These appear as `[... — TODO]` placeholders. Nothing fake was invented, so the documents are
publishable the moment these are filled in and not before.

1. **Legal entity name.** Sole trader, or a limited company / LLC? This changes the liability
   position, not only the wording. Worth deciding before launch rather than after.
2. **Governing law and jurisdiction.** Deliberately left blank. It follows from where you are
   and where the entity is registered; picking one to fill a gap would be worse than leaving
   it visible.
3. **Contact email.** Needs to be one you will actually read — it is the data-subject-rights
   address and the App Review contact. A forwarding alias is fine.
4. **Effective date.** Set on the day you publish, not today.
5. **Hosting.** See below.

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
