# Going worldwide

The decision is worldwide availability. This is what that actually breaks down into, what is
done, and where I stopped and why.

---

## 1. Two different things called "worldwide"

**Availability** is a distribution decision and it is a good one. The App Store sells in 175
territories; there is no reason to withhold this from any of them, and the marginal cost is
zero. Done, and the work below is what it implies.

**Governing law is a separate decision, and it is now made: CANADA.**

`legal/terms-of-use.md` §15 uses the standard Canadian construction — the law of a named
province plus the federal laws of Canada that apply in it — with **non-exclusive**
jurisdiction. Non-exclusive matters here: an exclusive clause would tell a customer in
Australia that a Canadian courtroom is their only route, which is unenforceable against a
consumer and a bad sentence to put in a mental-health product. The clause also states
explicitly that local consumer rights are unaffected, because in the EU, the UK, Australia
and Canada itself they cannot be contracted around whatever the document says.

**One field remains: the province.** In Canada contract law and consumer protection are
provincial, so "the laws of Canada" is not a complete choice of law.

⚠ **If the province is Quebec, the English-only decision in §3 collides with the law.** The
Charter of the French Language, as amended by Bill 96, requires consumer contracts and
related documentation to be available in French. That would mean a French version of the
terms and privacy policy at minimum, and arguably of the app's consumer-facing text — which
is the one scenario in which the localisation question in §3 stops being a growth decision
and becomes a compliance one. Any other province and it does not arise.

---

## 2. Crisis lines: done, and this was the urgent part

This is where worldwide availability actually hurt someone, so it went first.

Before: four countries and a "Somewhere else" entry pointing at one web address. That is
defensible when the listing is English-only. The moment the app is in every territory, the
fallback stops being an edge case and becomes the **default for most users** — and "open a
browser and find your own crisis line" is the wrong sentence to hand somebody at the moment
they open that screen. The default region was also hard-coded to `us`, so a person in Germany
having a bad day was being shown 911.

Now: **31 regions**, each with national services in the local language, plus three structural
rules enforced by `__tests__/support.test.mjs`:

1. **Every region carries `findahelpline.com` as a backstop** — not as a fallback for regions
   I did not cover, but *inside* every region I did. National numbers get renumbered, merged
   and defunded; the directory's whole job is staying current. This is what makes a stale
   entry a degradation rather than a dead end.
2. **Every region flags an emergency number**, structurally (`emergency: true`), not by
   matching the line's name. The first version of that test pattern-matched names and failed
   on Dutch — and would have silently stopped covering every future region written in a
   language nobody had added to the regex.
3. **Nothing is machine-translated.** Services are named as they are actually known —
   Telefonseelsorge, よりそいホットライン, Línea de la Vida — because that is what somebody
   will recognise and what they will hear when they call.

The region is now guessed from the device locale on first launch only (`hooks/deviceLocale.ts`),
never overriding a stored choice, and an unrecognised locale lands on the international
directory rather than on a confident wrong country.

**Before ship:** every number needs confirming against its provider. Rule 1 is why that is a
"must do" and not a "cannot ship without" — a stale entry still leaves a working route.

---

## 3. Translating the app: DECIDED — English only

**The decision is English.** One interface language, available in every territory. This is a
normal, coherent App Store configuration and it is the right one for now.

What that means concretely, and what it does not:

- The interface, the twelve modules, the crisis copy and the store listing are English.
- The app is still listed and sold **worldwide**. Availability and listing language are
  separate settings; a person in Germany can find, buy and use it.
- The **crisis lines are not English-only** and must not become so. 31 regions, national
  services named as they are actually known. An English app that hands you your own
  country's crisis line is coherent; an English app that hands a German 911 is not. See §2.
- Region labels, notes and the word "Emergency" ARE English, because that is the app
  speaking. Service names are left in their own language, because those are the words you
  will hear when somebody answers the phone. `__tests__/support.test.mjs` holds both halves
  of that line, in both directions — it fails if a label drifts out of English, and it also
  fails if every service name gets anglicised.

The rest of this section is the reasoning that led here, kept because the question will come
back the first time somebody looks at the non-English App Store markets.

### The objection that is specific to this app

`docs/GROWTH.md` §2.6 puts it precisely, and it is the single best observation in that
document:

> `__tests__/copy.test.mjs` and `__tests__/readability.test.mjs` enforce Anneal's tone — no
> shaming language, no appearance evaluation, no treatment claims, eighth-grade reading level
> — **using English-language pattern matching.** Translate the app and the entire enforcement
> mechanism silently stops covering the shipped product.

SAFETY.md's central claim is that the rules are tests rather than review notes. Ship a
machine-translated Spanish build and that claim becomes false in Spanish, quietly, with every
test still green. The app would *look* as safe as it does now and would not be.

### What specifically goes wrong

- **The disclaimer.** "Anneal is not therapy and has not been trialled" is a legal position.
  A translation that softens it into "Anneal is a treatment" is a medical claim in a
  jurisdiction whose regulator did not read the English.
- **The crisis copy.** The hard-day path is written to be usable by somebody in real
  distress. Tone is the entire design, and tone is what machine translation loses first.
- **Reading level.** The 8th-grade constraint is enforced by a Flesch-Kincaid implementation
  that is English-specific. German compounds and Japanese have no equivalent metric in
  `lib/readability.ts`.
- **The module content.** ~12,000 words of clinically-informed prose about a condition where
  the wrong phrasing reinforces the very comparison the exercise exists to interrupt.

### What it actually costs

`docs/GROWTH.md` §2.6, which I agree with: **$4,000–$6,000 per language** — professional
translation of ~18,000 words, plus a clinician who speaks the language reviewing it, plus
per-locale test work. Not $0 and a translation API.

### The recommendation, which is now the decision

**English only for launch.** If a second language is ever added, pick it from App Store
Connect's territory breakdown — which arrives free, with no analytics SDK, once there are
installs. Let the data choose rather than guessing now, and do one, not four.

### What to build first, if that day comes

In this order, because it front-loads the safety-critical and cheap parts:

1. **Extract strings into a locale table.** `content/*.ts` is already the single source for
   all copy, which is most of this job done. It becomes `content/en/*.ts` plus a typed key
   union, so a missing translation is a compile error rather than a blank screen.
2. **Make the safety tests locale-parameterised.** Every rule in `copy.test.mjs` gets a
   per-language word list, and the suite runs once per shipped locale. A language cannot ship
   until its list exists. This is the piece that keeps SAFETY.md true.
3. **Ship the crisis screen and the disclaimer first, alone.** They are short, they are the
   highest-stakes text in the app, and they are worth human translation even for a locale
   where the rest stays English. An app that is English throughout but hands you your own
   country's crisis line in your own language is a coherent product; one where the module
   text is fluent and the crisis line is wrong is not.
4. **Then the modules**, professionally translated and clinically reviewed.

---

## 4. Store listing localisation

`fastlane/metadata/` currently holds `en-US` only. Listing metadata is short, cheap to
translate well, and is the one place localisation pays off before the app itself is
translated: an app listed in German with an English UI still ranks and still converts, and
several categories of user will happily use an English app they found in their own language.

`__tests__/store-metadata.test.mjs` reads whatever locale folders exist and applies the
treatment-vocabulary, safety and field-limit rules to all of them. Adding `de-DE` therefore
gets checked automatically — except for the vocabulary lists, which are English. That gap is
the same one as §3.2 and gets closed the same way.

---

## 5. What is done

- [x] **Interface language decided: English, worldwide availability**
- [x] `primary_locale.txt` = `en-US`, single locale folder, with the reasoning recorded
- [x] Region labels and notes in English; service names left in their own language, both
      directions enforced by test
- [x] 31 crisis regions with national services, up from 4
- [x] `findahelpline.com` backstop in every region
- [x] Emergency number flagged structurally in every region
- [x] Device-locale region guess on first launch, never overriding a choice
- [x] `__tests__/support.test.mjs` — 13 tests holding all of the above
- [x] Store metadata test reads any locale folder

## 6. What is not, and what it needs

- [ ] **Governing law jurisdiction** — one word from you, blocks the legal site and submission
- [ ] Verify all 31 regions' numbers against their providers
Deferred by decision, not outstanding:

- String extraction into a locale table
- Locale-parameterised safety and readability tests
- A second interface language
- Per-locale store listings — the cheapest first step if a market ever justifies it
