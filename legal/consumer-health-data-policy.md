# Consumer Health Data Privacy Policy — {{APP_NAME}}

**Last updated:** 26 August 2026
**Publisher:** {{ENTITY_NAME}}
**Contact:** {{CONTACT_EMAIL}}

<!-- DRAFT. Not reviewed by a lawyer. See legal/README.md before publishing. -->
<!-- WHY THIS IS A SEPARATE FILE AND NOT A SECTION OF THE PRIVACY POLICY.

     Washington's My Health My Data Act (RCW 19.373.020) requires the consumer health data
     policy to be "prominently published" as a "separate and distinct link" on the homepage,
     and — the part that decides the structure — provides that it MAY NOT CONTAIN INFORMATION
     NOT REQUIRED BY the Act. Folding this into privacy-policy.md would be non-compliant on
     its face in both directions: it would not be a distinct link, and it would be full of
     material the section is not allowed to carry.

     So this file answers the statute's list, in the statute's order, and nothing else. Every
     substantive answer is "none", which is why it is one page. That is the point: the whole
     document is cheap, and the statute it satisfies carries a PRIVATE RIGHT OF ACTION with
     treble damages and fee-shifting.

     Nevada SB 370 (NRS 603A.400-.550) requires a substantively parallel published policy and
     is satisfied by the same document. Nevada is Attorney-General-only.

     ⚠ THE OPEN QUESTION THIS DOCUMENT DOES NOT RESOLVE, AND COUNSEL MUST.
     MHMDA defines "collect" as "to buy, rent, access, retain, receive, acquire, infer,
     derive, or otherwise process consumer health data in any manner". Whether that reaches
     data that is only ever written, encrypted and read on the consumer's own phone is
     genuinely unsettled. The argument that it does not is control-based and is the same
     reasoning the Seventh Circuit applied to BIPA's verbs. The argument that it does rests on
     "infer, derive, or otherwise process ... in any manner", and on the regulated-entity test
     asking who determines the purposes and means — which is the publisher, not the user.
     Publishing this document does not concede the point. It is written so that the answer
     does not matter: if the Act applies, this satisfies it; if it does not, nothing here is
     untrue. That is the cheapest available position and it is why this exists before anybody
     has decided. -->

---

## What this document is

Washington State and Nevada have laws about **consumer health data** specifically, separate
from ordinary privacy law. Both require an app that could hold such data to publish a policy
answering a particular set of questions. This is that policy.

It is deliberately short, and it is short for one reason: {{APP_NAME}} has no server, no
account, and no way to receive what you write. Every answer below follows from that.

If you want the fuller picture of how the app handles what you write — the encryption, the
export, what happens when you delete — that is in the [privacy policy](/privacy.html). This
document answers only what these two laws ask.

---

## 1. What consumer health data {{APP_NAME}} collects, and why

**None reaches us.**

{{APP_NAME}} is a self-help app for appearance anxiety. Using it, you may write down things
that would be consumer health data if anyone else could see them: how many minutes a day
appearance worry takes, notes about urges and what you did instead, thought records, answers
to an opening survey including a question about whether you are thinking about hurting
yourself, and a written plan for a bad stretch.

**All of it is created and kept on your own phone.** It is encrypted there. It is never
transmitted to us, because the app contains no code that could transmit it — there is no
network request anywhere in it, and a test in the source refuses to build if one is added.

So: we collect no consumer health data, for no purpose, because there is no mechanism by which
we could.

---

## 2. The sources it is collected from

**None**, following from section 1. What you write comes from you, and stays where you wrote
it.

---

## 3. What consumer health data is shared, and with whom

**None, with nobody.**

No advertising network. No analytics provider. No data broker. No AI service — see the
[AI policy](/ai.html), which states in full that nothing you write is sent to a model and that
no model runs on your phone. No affiliate. Nobody.

We do not sell consumer health data. There is nothing to sell and no mechanism to sell it
with. We have never done so and the app would have to be rebuilt to make it possible.

---

## 4. The categories of third parties and affiliates it is shared with

**None.**

When paid subscriptions are switched on, our payment processor will handle the subscription
itself — whether one is active, and when it renews. **That is purchase information, not health
data.** It carries nothing about what you have written, because what you have written never
leaves your phone for anyone, including us. If that ever changes, this document changes in the
same release, and so does the privacy policy and the App Store privacy label.

---

## 5. How to exercise your rights

Both laws give you rights over consumer health data a company holds about you. Because we hold
none, most of them resolve to the same short answer — but here is how to use each one, and
what will happen.

**The right to confirm whether we collect, share or sell your consumer health data, and to
access it.** Email {{CONTACT_EMAIL}}. We will confirm, in writing, that we hold none. We
cannot send you your data because we do not have it — but you can export all of it yourself,
at any time, from the Progress screen in the app. That export is free, it is not behind the
subscription, and it is the complete file rather than a summary.

**The right to a list of the third parties your data has been shared with.** Email
{{CONTACT_EMAIL}}. The list is empty, and we will say so in writing.

**The right to withdraw consent to collection or sharing.** There is no collection to withdraw
consent to. If you would like to stop using {{APP_NAME}} entirely, "Delete everything" on the
Progress screen erases what is on your phone — including exports the app made and the key that
decrypted your writing — and deleting the app removes the rest. Neither requires asking us.

**The right to have your consumer health data deleted.** Same answer, and it is faster than
writing to us: "Delete everything" on the Progress screen. We cannot delete what you write
because we never had it. If you have emailed us and want that email deleted, say so and we
will delete it.

**How we respond.** To {{CONTACT_EMAIL}}, from a person, within the periods those laws
require — 45 days in Washington, extendable once where the law allows, and we will not use the
extension for an answer this short. If we refuse a request we will say why, and Washington
gives you an appeal, which is also just an email to the same address.

**You will never be charged, refused service, or given a worse version of {{APP_NAME}} for
making any of these requests.** There is no version to give you: the app does not know whether
you have written to us.

---

## 6. Geofencing

{{APP_NAME}} does not use one, and could not.

Washington and Nevada both prohibit geofencing around health-care facilities. The app requests
**no location permission at all** — not "when in use", not ever — and contains no location
code. It does not know where you are, and there is no setting that would change that.

---

## 7. If any of this stops being true

Every statement here follows from the app having no server and making no network request. That
is a structural fact rather than a policy, and it is held in place by a test that fails the
build if a network call is added.

If it ever changes, this document is rewritten in the same release, not afterwards — alongside
the privacy policy, the App Store privacy label, and the consent the app would have to ask you
for first.

---

<!-- LOAD-BEARING. Each of these is false the day the corresponding thing changes:

     §1 "no network request anywhere in it"   — __tests__/safety.test.mjs, egress guards
     §3 "no AI service"                        — __tests__/ai.test.mjs
     §5 "export is free, not behind the subscription" — lib/entitlement.ts ALWAYS_FREE
     §5 "Delete everything ... including exports and the key" — wipeState + forgetDeviceKey
     §6 "no location permission at all"        — app.json has no location entry

     WHAT IS NOT COVERED HERE and must be decided separately: whether this document needs a
     French version for Quebec (Charter art. 52), and whether the publisher should be
     incorporated before shipping into Washington at all — MHMDA's private right of action
     with treble damages and fee-shifting reaches a sole proprietor's personal assets. See
     legal/README.md §3.2, which frames that choice as cost-and-speed; on these facts it is a
     compliance control. -->
