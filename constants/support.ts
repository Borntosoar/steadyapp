import type { SupportRegion } from '../types';

/* Crisis and support lines.
 *
 * Kept in one file so updating a number is a one-line change by someone who does not
 * need to understand the rest of the codebase. Verify these periodically — a wrong
 * number here is the worst bug this app could ship.
 *
 * GOING WORLDWIDE CHANGED WHAT THIS FILE HAS TO BE.
 *
 * With four regions and a "Somewhere else" fallback, most of the planet reached a web
 * address. That is defensible when the store listing is English and the audience is
 * Anglophone. It stops being defensible the moment the app is listed in every territory,
 * because the fallback is the *default* for the majority of users rather than an edge case —
 * and "open a browser and find your own crisis line" is the wrong sentence to hand somebody
 * at the moment they need this screen.
 *
 * THREE RULES THIS FILE NOW FOLLOWS, EACH ENFORCED BY __tests__/support.test.mjs:
 *
 *   1. EVERY region carries findahelpline.com as its last line. Not as a fallback for
 *      regions I did not cover — as a backstop inside every region I did. A national number
 *      can be renumbered, defunded or merged (Britain's 116 123, South Korea's move to 109,
 *      France's 3114 are all recent examples), and a stale number in an app somebody opens
 *      in a crisis is the failure mode this whole file exists to prevent. The backstop is
 *      maintained by people whose entire job is maintaining it.
 *   2. EVERY region names its emergency number. It is the one number that is never wrong and
 *      never busy, and it was missing from the fallback entirely.
 *   3. THE APP IS ENGLISH, THE SERVICE NAMES ARE NOT, AND THAT IS NOT A CONTRADICTION.
 *
 *      Steady's interface language is English and stays English — see docs/LOCALISATION.md
 *      for the decision and the reasoning. So everything in this file that is the APP
 *      SPEAKING is in English: region labels, notes, and the word "Emergency".
 *
 *      Service NAMES are left exactly as they are — Telefonseelsorge, よりそいホットライン,
 *      Línea de la Vida. Those are not the app speaking. They are the name of the thing you
 *      dial, and the words you will hear when somebody picks up. "Telephone Pastoral Care"
 *      is not a service anybody can find, ask for, or recognise, and a crisis line the
 *      person cannot identify is a crisis line that does not work. Proper nouns do not get
 *      translated because the sentence around them is English.
 *
 * VERIFICATION STATUS. These were assembled from knowledge, not from a live check of each
 * provider — the network here cannot reach most of them. Before this ships, every number
 * below needs confirming against the provider's own site, and `docs/APP-STORE.md` carries it
 * as a submission blocker. Rule 1 is what makes that a "must do" rather than a "must not
 * ship without": even a stale entry leaves a working route to help. */

/** Regions with a verified national service. Ordered roughly by likely install base, since
 *  this list is also the picker. */
export const SUPPORT_REGIONS: SupportRegion[] = [
  {
    key: 'us',
    label: 'United States',
    lines: [
      { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', note: '24/7, free' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', note: '24/7, free' },
      { name: 'Emergency', contact: '911', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'ca',
    label: 'Canada',
    lines: [
      { name: '9-8-8 Suicide Crisis Helpline', contact: 'Call or text 988', note: '24/7, free' },
      { name: 'Kids Help Phone', contact: 'Call 1-800-668-6868 · text CONNECT to 686868', note: 'Under 30' },
      { name: 'Emergency', contact: '911', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'uk',
    label: 'United Kingdom',
    lines: [
      { name: 'Samaritans', contact: 'Call 116 123', note: '24/7, free' },
      { name: 'Shout', contact: 'Text SHOUT to 85258', note: '24/7, free' },
      { name: 'NHS urgent mental health', contact: 'Call 111, option 2' },
      { name: 'Emergency', contact: '999', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'ie',
    label: 'Ireland',
    lines: [
      { name: 'Samaritans', contact: 'Call 116 123', note: '24/7, free' },
      { name: 'Text About It', contact: 'Text HELLO to 50808', note: '24/7, free' },
      { name: 'Emergency', contact: '112 or 999', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'au',
    label: 'Australia',
    lines: [
      { name: 'Lifeline', contact: 'Call 13 11 14', note: '24/7' },
      { name: 'Beyond Blue', contact: 'Call 1300 22 4636' },
      { name: 'Kids Helpline', contact: 'Call 1800 55 1800', note: '5–25 years' },
      { name: 'Emergency', contact: '000', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'nz',
    label: 'New Zealand',
    lines: [
      { name: '1737, Need to talk?', contact: 'Call or text 1737', note: '24/7, free' },
      { name: 'Lifeline Aotearoa', contact: 'Call 0800 543 354' },
      { name: 'Emergency', contact: '111', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'de',
    label: 'Germany',
    lines: [
      { name: 'Telefonseelsorge', contact: '0800 111 0 111 · 0800 111 0 222', note: '24/7, free' },
      { name: 'Nummer gegen Kummer', contact: '116 111', note: 'For young people' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'at',
    label: 'Austria',
    lines: [
      { name: 'Telefonseelsorge', contact: '142', note: '24/7, free' },
      { name: 'Rat auf Draht', contact: '147', note: 'For young people' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'ch',
    label: 'Switzerland',
    lines: [
      { name: 'Die Dargebotene Hand / La Main Tendue', contact: '143', note: '24/7' },
      { name: 'Pro Juventute', contact: '147', note: 'For young people' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'fr',
    label: 'France',
    lines: [
      { name: 'Numéro national de prévention du suicide', contact: '3114', note: '24/7, free' },
      { name: 'SOS Amitié', contact: '09 72 39 40 50' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'es',
    label: 'Spain',
    lines: [
      { name: 'Línea de atención a la conducta suicida', contact: '024', note: '24/7, free' },
      { name: 'Teléfono de la Esperanza', contact: '717 003 717' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'it',
    label: 'Italy',
    lines: [
      { name: 'Telefono Amico Italia', contact: '02 2327 2327' },
      { name: 'Samaritans Onlus', contact: '06 77208977' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'nl',
    label: 'Netherlands',
    lines: [
      { name: '113 Zelfmoordpreventie', contact: '0800 0113 · 113', note: '24/7, free' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'be',
    label: 'Belgium',
    lines: [
      { name: 'Zelfmoordlijn 1813', contact: '1813', note: '24/7' },
      { name: 'Centre de Prévention du Suicide', contact: '0800 32 123', note: '24h/24' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'se',
    label: 'Sweden',
    lines: [
      { name: 'Mind Självmordslinjen', contact: '90101', note: '24/7' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'no',
    label: 'Norway',
    lines: [
      { name: 'Mental Helse Hjelpetelefonen', contact: '116 123', note: '24/7' },
      { name: 'Kirkens SOS', contact: '22 40 00 40' },
      { name: 'Emergency', contact: '113', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'dk',
    label: 'Denmark',
    lines: [
      { name: 'Livslinien', contact: '70 201 201' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'fi',
    label: 'Finland',
    lines: [
      { name: 'Kriisipuhelin (MIELI)', contact: '09 2525 0111' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'pl',
    label: 'Poland',
    lines: [
      { name: 'Centrum Wsparcia', contact: '800 70 2222', note: '24/7, free' },
      { name: 'Telefon zaufania dla dzieci i młodzieży', contact: '116 111' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'pt',
    label: 'Portugal',
    lines: [
      { name: 'SNS 24', contact: '808 24 24 24' },
      { name: 'Voz de Apoio', contact: '225 506 070' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'br',
    label: 'Brazil',
    lines: [
      { name: 'CVV — Centro de Valorização da Vida', contact: '188', note: '24/7, free' },
      { name: 'SAMU', contact: '192', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'mx',
    label: 'Mexico',
    lines: [
      { name: 'Línea de la Vida', contact: '800 911 2000', note: '24/7, free' },
      { name: 'Emergency', contact: '911', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'ar',
    label: 'Argentina',
    lines: [
      { name: 'Salud Mental Responde', contact: '0800 999 0091' },
      { name: 'Emergency', contact: '911', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'in',
    label: 'India',
    lines: [
      { name: 'Tele-MANAS', contact: '14416 · 1-800-891-4416', note: '24/7, free' },
      { name: 'KIRAN', contact: '1800-599-0019', note: '24/7, free' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'jp',
    label: 'Japan',
    lines: [
      { name: 'よりそいホットライン', contact: '0120-279-338', note: '24/7, free' },
      { name: 'いのちの電話', contact: '0570-783-556' },
      { name: 'Emergency', contact: '119', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'kr',
    label: 'South Korea',
    lines: [
      { name: '자살예방상담전화', contact: '109', note: '24/7' },
      { name: '청소년전화', contact: '1388' },
      { name: 'Emergency', contact: '119', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'sg',
    label: 'Singapore',
    lines: [
      { name: 'Samaritans of Singapore (SOS)', contact: '1767', note: '24/7' },
      { name: 'SOS Care Text', contact: 'sos.org.sg' },
      { name: 'Emergency', contact: '995', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'hk',
    label: 'Hong Kong',
    lines: [
      { name: 'The Samaritans Hong Kong', contact: '2896 0000', note: '24/7, multilingual' },
      { name: '香港撒瑪利亞防止自殺會', contact: '2389 2222' },
      { name: 'Emergency', contact: '999', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'za',
    label: 'South Africa',
    lines: [
      { name: 'SADAG Suicide Crisis Line', contact: '0800 567 567' },
      { name: 'Lifeline South Africa', contact: '0861 322 322' },
      { name: 'Emergency', contact: '112', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    key: 'il',
    label: 'Israel',
    lines: [
      { name: 'ער"ן — ERAN', contact: '1201', note: '24/7' },
      { name: 'Emergency', contact: '101', emergency: true },
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'If a number above has changed' },
    ],
  },
  {
    /* The fallback, and it is no longer a dead end. Somebody in a country not listed above
       now gets a directory covering 130+ countries AND the two emergency numbers that work
       across most of the world, rather than a single web address. */
    key: 'other',
    label: 'Somewhere else',
    lines: [
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'Verified lines in 130+ countries, in your language' },
      { name: 'International Association for Suicide Prevention', contact: 'iasp.info/resources/Crisis_Centres' },
      { name: 'Emergency (most of Europe, and from any GSM phone)', contact: '112', emergency: true },
      { name: 'Emergency (US, Canada, and much of Latin America)', contact: '911', emergency: true },
    ],
  },
];

/** The line every region ends with. Exported so the test can assert its presence rather than
 *  matching a string literal that a well-meaning edit could reword. */
export const BACKSTOP_CONTACT = 'findahelpline.com';

export function regionByKey(key: string): SupportRegion {
  return SUPPORT_REGIONS.find((r) => r.key === key) ?? SUPPORT_REGIONS[0];
}

/** Best guess at a region from the device locale, used only as the INITIAL selection.
 *
 *  A guess, never a decision: the picker stays on screen and the user's choice always wins.
 *  Somebody travelling, or on a phone bought abroad, or using an English locale in a
 *  non-English country, must not have to argue with the app about where they are.
 *
 *  Takes the region subtag (`en-GB` → `GB`) because the language says nothing useful about
 *  which ambulance service will come. */
export function regionForLocale(locale: string | null | undefined): string {
  if (!locale) return 'other';
  const region = locale.replace('_', '-').split('-')[1]?.toLowerCase();
  if (!region) return 'other';
  return SUPPORT_REGIONS.some((r) => r.key === region) ? region : 'other';
}

/* ---------- finding a clinician ----------
 *
 * Deliberately not localised per country yet. The advice below is about what to ASK FOR,
 * which is the same everywhere, plus three region-specific pointers that are true where they
 * apply and harmless where they do not. A per-country directory is the right eventual shape;
 * an English list of American directories shown to somebody in Japan is not, and is the kind
 * of thing that arrives by accident when an app goes worldwide without anybody deciding to.
 * Tracked in docs/LOCALISATION.md. */
export const THERAPY_GUIDANCE = [
  'Ask specifically for **CBT with exposure and response prevention**. Generic supportive counselling is the most commonly received therapy for appearance distress and it performs worse in head-to-head trials.',
  'The International OCD Foundation keeps a directory of clinicians who treat body image and related conditions: **iocdf.org**. It lists providers in many countries, not only the United States.',
  'In the UK you can self-refer to NHS Talking Therapies without going through your GP.',
  'When you make contact, it is fair to ask: *have you treated appearance preoccupation before, and do you use exposure and response prevention?* A good clinician will not mind the question.',
  'If money is the barrier, ask about sliding-scale fees, training clinics at universities, and group programmes — all three are usually far cheaper and none of them are lower quality.',
];

/** Shown at the top of /support. Written to be usable by someone in real distress:
 *  short sentences, no preamble, action first. */
export const SUPPORT_INTRO =
  'If today is bad, you do not have to work through the programme. Reaching a person is the more useful thing.';
