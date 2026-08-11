# Cookie Policy — Steady website

**Last updated:** 11 August 2026
**Applies to:** `[WEBSITE DOMAIN — TODO]`, the marketing and legal-documents website for Steady.
**Published by:** `[LEGAL ENTITY NAME — TODO]`
**Contact:** steadyrecovery3@gmail.com

<!-- DRAFT. Not reviewed by a lawyer. See legal/README.md before publishing. -->

---

## This is about the website, not the app

**The Steady iOS app has no cookies, no web tracking, and no analytics of any kind.** It is not a web page and there is nothing on your phone for this policy to describe. See `privacy-policy.md` for how the app works.

This page is only about the website where these documents are hosted.

<!-- SOURCE: no analytics SDK, no web view, and no tracking library appears in package.json;
     the only outbound links in the app are tel: links (app/support.tsx,
     components/CrashScreen.tsx). app.json declares NSPrivacyTracking: false with an empty
     NSPrivacyTrackingDomains array. -->

---

## What cookies are

A cookie is a small file a website asks your browser to keep. Most sites use them to remember you, to keep you signed in, or to watch what you do across pages and sites.

Similar technologies do the same job by other means — local storage, session storage, tracking pixels, web beacons, browser fingerprinting. Where this page says "cookies", it means all of them.

---

## What this website uses

**Nothing.**

`[WEBSITE DOMAIN — TODO]` is a set of static pages. It sets no cookies, uses no local storage, runs no analytics, loads no tracking pixels, embeds no advertising, and has no sign-in.

There is no cookie banner because there is nothing to consent to. If you ever see a cookie banner on this site, something has changed and this page is out of date — please tell us.

> ⚠ **Only true if you keep it true.** This claim breaks the moment anyone adds Google Analytics, Plausible, a Meta or TikTok pixel, an embedded YouTube or Vimeo player, a Google Font loaded from Google's servers, a Calendly or Typeform embed, a Substack or Mailchimp signup widget, a live-chat widget, or an A/B testing tool. Several of those set cookies or make third-party requests without anyone noticing. Every one of them makes this page wrong, and most of them need a consent banner in the UK and EU. See the checklist at the bottom.

---

## What your browser and our host still do

Even with no cookies at all, a few things happen automatically. Being straight about them:

**Your browser** keeps its own cache of pages and images so the site loads faster next time. That is your browser's behaviour, not ours, and you can clear it in your browser settings.

**Our web host** GitHub Pages receives the ordinary information any web server receives when you request a page: your IP address, the page you asked for, the time, your browser type, and the page you came from. This is how the internet works and it cannot be switched off without switching off the website.

We do not use these logs to build a profile of you, we do not combine them with anything else, and we do not sell or share them. GitHub does not expose these logs to us and states a maximum retention of 14 days — for example, GitHub Pages, Cloudflare Pages, Netlify and Vercel each keep server logs for their own security and abuse-prevention purposes under their own privacy policies, and you should link the right one here.

---

## How to control cookies anyway

You do not need to do anything on this site. But if you want to control cookies generally, every major browser lets you block or delete them:

- **Safari** — Settings → Safari → Privacy & Security
- **Chrome** — Settings → Privacy and security → Third-party cookies
- **Firefox** — Settings → Privacy & Security
- **Edge** — Settings → Cookies and site permissions

Blocking all cookies will break many other websites. It will not break this one.

---

## Changes

If we ever add anything to this site that sets a cookie or tracks anything, we will update this page **before** it goes live, and — where the law requires it — ask for your consent first rather than assuming it.

---

## Contact

steadyrecovery3@gmail.com

---

<!--
================================================================================
INTERNAL NOTES — will not render
================================================================================

WHY THIS DOCUMENT IS THIS SHORT
A cookie policy longer than the site it describes reads as boilerplate, and boilerplate
that describes cookies the site does not set is a factual misstatement — regulators have
taken issue with exactly that. The whole value of this page is that it is honest and can
be verified in ten seconds by opening the browser's storage inspector.

BEFORE YOU ADD ANYTHING TO THE MARKETING SITE, CHECK
[ ] Does it set a cookie or write to local/session storage?
[ ] Does it make a request to a third-party domain? (fonts, embeds, CDNs, form widgets)
[ ] Does it need consent under the UK PECR / EU ePrivacy Directive? Analytics and
    marketing cookies do. Strictly necessary ones do not.
[ ] If yes to any: this page must be rewritten to list the cookie, its purpose, its
    duration and who sets it, AND a consent banner with a genuine reject option is needed
    before the cookie is set. "Accept or leave" is not consent under GDPR.
[ ] Update privacy-policy.md too — a site with analytics collects personal data, which
    contradicts the "we collect nothing" claim that the app's policy is built on. That
    contradiction is the real risk here, not the cookie itself.

RELATED, AND EASY TO MISS
The Steady repo can build a web version of the app (react-native-web, app.json
web.output "single", and a built dist/ directory exists). If a playable web build is ever
hosted at this domain, this page is no longer accurate: the web build persists the same
journal data in the browser's localStorage. That is not a cookie, but it is exactly the
kind of thing a regulator and a customer would expect this page to mention. It would also
need its own section in privacy-policy.md, because none of the iOS-specific protections
described there (app sandbox, iOS file protection, backup exclusion) apply in a browser.

TODO BEFORE PUBLISHING
[ ] Website domain
[ ] Hosting provider name + link to its privacy policy
[ ] Server log retention period
[ ] Confirm with the host that no analytics is enabled by default (Vercel and Netlify
    both offer analytics that can be switched on with one click, and Vercel's is
    cookieless but still processes visitor data)
-->
