import type { SupportRegion, DirectoryLine } from '../types';

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
 *      Anneal's interface language is English and stays English — see docs/LOCALISATION.md
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
 *   4. EVERY STAFFED LINE STATES ITS HOURS. Not as a nicety — the type will not compile
 *      without it. See the note on `StaffedLine` in types/index.ts for why.
 *
 * VERIFICATION STATUS: checked 12 August 2026, all 31 regions, against providers and
 * national health services directly.
 *
 * WHAT THAT PASS ACTUALLY FOUND, because it was not what I expected. The numbers were very
 * nearly all correct. The AVAILABILITY was wrong almost everywhere, and it was wrong by
 * omission rather than by error — a line with no hours beside it reads as always open, and
 * eight of these were not:
 *
 *   Denmark   Livslinien closes 05:00–09:00        Germany   116 111 is Mon–Sat afternoons
 *   Portugal  Voz de Apoio runs 21:00–24:00        Italy     Telefono Amico stops midnight
 *   Japan     いのちの電話 stops at 22:00            Italy     Samaritans Onlus 13:00–22:00
 *
 * Two substantive corrections beyond hours: India's KIRAN has been merged into Tele-MANAS
 * and is gone, and Argentina's 0800 999 0091 is real but was filed here under the name of a
 * different, Buenos-Aires-only service.
 *
 * RE-VERIFY ANNUALLY, and after any news of a national line changing. Rule 1 is what makes
 * that a "must do" rather than a "must not ship without": even a stale entry leaves a
 * working route to help. */

/** The last line of every region. One object rather than thirty-one copies, so that the day
 *  this directory changes hands or changes address it is a single edit — which is the same
 *  argument that put it in every region in the first place. */
const BACKSTOP: DirectoryLine = {
  name: 'Find a helpline',
  contact: 'findahelpline.com',
  note: 'If a number above has changed',
  directory: true,
};

/** Regions with a verified national service. Ordered roughly by likely install base, since
 *  this list is also the picker. */
export const SUPPORT_REGIONS: SupportRegion[] = [
  {
    key: 'us',
    label: 'United States',
    lines: [
      { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', hours: '24/7', note: 'Free. Press 1 for the Veterans Crisis Line' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', hours: '24/7', note: 'Free' },
      { name: 'Emergency', contact: '911', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'ca',
    label: 'Canada',
    lines: [
      { name: '9-8-8 Suicide Crisis Helpline', contact: 'Call or text 988', hours: '24/7', note: 'Free, English and French' },
      /* No age ceiling stated. Kids Help Phone is described variously as up to 20, up to 25
         and up to 29 depending on the service and the source, and a number in this app is
         not the place to find out you have aged out of it. "For young people" is true under
         every reading of their own material. */
      { name: 'Kids Help Phone', contact: 'Call 1-800-668-6868 · text CONNECT to 686868', hours: '24/7', note: 'For young people' },
      { name: 'Emergency', contact: '911', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'uk',
    label: 'United Kingdom',
    lines: [
      { name: 'Samaritans', contact: 'Call 116 123', hours: '24/7', note: 'Free' },
      { name: 'Shout', contact: 'Text SHOUT to 85258', hours: '24/7', note: 'Free' },
      { name: 'NHS urgent mental health', contact: 'Call 111, option 2', hours: '24/7', note: 'Free' },
      { name: 'Emergency', contact: '999', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'ie',
    label: 'Ireland',
    lines: [
      { name: 'Samaritans', contact: 'Call 116 123', hours: '24/7', note: 'Freephone' },
      { name: 'Text About It', contact: 'Text HELLO to 50808', hours: '24/7', note: 'Free' },
      { name: 'Emergency', contact: '112 or 999', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'au',
    label: 'Australia',
    lines: [
      { name: 'Lifeline', contact: 'Call 13 11 14 · text 0477 13 11 14', hours: '24/7' },
      { name: 'Beyond Blue', contact: 'Call 1300 22 4636', hours: '24/7' },
      { name: 'Kids Helpline', contact: 'Call 1800 55 1800', hours: '24/7', note: 'Free, ages 5 to 25' },
      { name: 'Emergency', contact: '000', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'nz',
    label: 'New Zealand',
    lines: [
      { name: '1737, Need to talk?', contact: 'Call or text 1737', hours: '24/7', note: 'Free' },
      { name: 'Lifeline Aotearoa', contact: 'Call 0800 543 354 · text HELP to 4357', hours: '24/7' },
      { name: 'Emergency', contact: '111', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'de',
    label: 'Germany',
    lines: [
      { name: 'Telefonseelsorge', contact: '0800 111 0 111 · 0800 111 0 222 · 116 123', hours: '24/7', note: 'Free' },
      /* NOT round the clock, and it was listed here as though it were. Mon-Sat afternoons
         only — the parents' line is a different number again, deliberately left out rather
         than crowd this list. */
      { name: 'Nummer gegen Kummer', contact: '116 111', hours: 'Mon–Sat, 14:00–20:00', note: 'Free, for young people' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'at',
    label: 'Austria',
    lines: [
      { name: 'Telefonseelsorge', contact: '142', hours: '24/7', note: 'Free' },
      { name: 'Rat auf Draht', contact: '147', hours: '24/7', note: 'Free, for young people' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'ch',
    label: 'Switzerland',
    lines: [
      { name: 'Die Dargebotene Hand / La Main Tendue', contact: '143', hours: '24/7' },
      { name: 'Pro Juventute', contact: '147', hours: '24/7', note: 'Free, for young people' },
      { name: 'Emergency', contact: '144 ambulance · 112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'fr',
    label: 'France',
    lines: [
      { name: 'Numéro national de prévention du suicide', contact: '3114', hours: '24/7', note: 'Free' },
      { name: 'SOS Amitié', contact: '09 72 39 40 50', hours: '24/7' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'es',
    label: 'Spain',
    lines: [
      { name: 'Línea de atención a la conducta suicida', contact: '024', hours: '24/7', note: 'Free' },
      { name: 'Teléfono de la Esperanza', contact: '717 003 717', hours: '24/7' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'it',
    label: 'Italy',
    /* Italy has no 24-hour national line, which is exactly the fact this file used to hide.
       Both entries carried no hours and read as always-on; neither is. */
    lines: [
      { name: 'Telefono Amico Italia', contact: '02 2327 2327', hours: 'Daily, 09:00–24:00' },
      { name: 'Samaritans Onlus', contact: '800 86 00 22 · 06 77208977', hours: 'Daily, 13:00–22:00' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'nl',
    label: 'Netherlands',
    lines: [
      { name: '113 Zelfmoordpreventie', contact: '0800 0113 · 113', hours: '24/7', note: 'Free' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'be',
    label: 'Belgium',
    lines: [
      { name: 'Zelfmoordlijn 1813', contact: '1813', hours: '24/7' },
      { name: 'Centre de Prévention du Suicide', contact: '0800 32 123', hours: '24/7' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'se',
    label: 'Sweden',
    lines: [
      { name: 'Mind Självmordslinjen', contact: '90101', hours: '24/7' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'no',
    label: 'Norway',
    lines: [
      { name: 'Mental Helse Hjelpetelefonen', contact: '116 123', hours: '24/7', note: 'Free' },
      { name: 'Kirkens SOS', contact: '22 40 00 40', hours: '24/7' },
      { name: 'Emergency', contact: '113 ambulance · 112 police', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'dk',
    label: 'Denmark',
    lines: [
      /* Four hours a night with nobody on the phone, and this said nothing. Livslinien
         extended to 09:00–05:00 on 1 July 2026; before that it opened at 11:00. */
      { name: 'Livslinien', contact: '70 201 201', hours: 'Daily, 09:00–05:00' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'fi',
    label: 'Finland',
    lines: [
      { name: 'Kriisipuhelin (MIELI)', contact: '09 2525 0111', hours: '24/7', note: 'Also answers in Swedish, English, Arabic, Ukrainian and Russian' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'pl',
    label: 'Poland',
    lines: [
      { name: 'Centrum Wsparcia', contact: '800 70 2222', hours: '24/7', note: 'Free' },
      { name: 'Telefon zaufania dla dzieci i młodzieży', contact: '116 111', hours: '24/7', note: 'Free, for young people' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'pt',
    label: 'Portugal',
    lines: [
      /* "Option 4" is not a detail. Without it this number is a general health line and the
         person has to explain themselves to get transferred. */
      { name: 'SNS 24, psychological support', contact: '808 24 24 24, option 4', hours: '24/7' },
      { name: 'Voz de Apoio', contact: '225 506 070', hours: 'Daily, 21:00–24:00' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'br',
    label: 'Brazil',
    lines: [
      { name: 'CVV — Centro de Valorização da Vida', contact: '188', hours: '24/7', note: 'Free' },
      { name: 'SAMU', contact: '192', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'mx',
    label: 'Mexico',
    lines: [
      { name: 'Línea de la Vida', contact: '800 911 2000', hours: '24/7', note: 'Free' },
      { name: 'Emergency', contact: '911', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'ar',
    label: 'Argentina',
    lines: [
      /* The number was right and the name was not. "Salud Mental Responde" is a different
         service on a different number (0800-333-1665) covering Buenos Aires only, and
         somebody ringing this one and asking for it by that name would be confusing both
         parties at the worst possible moment. */
      { name: 'Línea Nacional de Salud Mental', contact: '0800 999 0091', hours: '24/7', note: 'Free' },
      { name: 'Emergency', contact: '911', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'in',
    label: 'India',
    lines: [
      /* KIRAN (1800-599-0019) was listed here as a second national line. It has been merged
         into Tele-MANAS and no longer stands on its own. */
      { name: 'Tele-MANAS', contact: '14416 · 1-800-891-4416', hours: '24/7', note: 'Free, in 20+ languages' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'jp',
    label: 'Japan',
    lines: [
      { name: 'よりそいホットライン', contact: '0120-279-338', hours: '24/7', note: 'Free' },
      /* Two numbers for one service, and the free one is open the fewest hours. Both were
         previously represented by a single entry with no hours at all. */
      { name: 'いのちの電話', contact: '0570-783-556', hours: 'Daily, 10:00–22:00', note: 'Call charges apply' },
      { name: 'いのちの電話 (toll-free)', contact: '0120-783-556', hours: 'Daily, 16:00–21:00', note: 'Free' },
      { name: 'Emergency', contact: '119', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'kr',
    label: 'South Korea',
    lines: [
      { name: '자살예방상담전화', contact: '109', hours: '24/7' },
      { name: '청소년전화', contact: '1388', hours: '24/7', note: 'For young people' },
      { name: 'Emergency', contact: '119', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'sg',
    label: 'Singapore',
    lines: [
      { name: 'Samaritans of Singapore (SOS)', contact: '1767', hours: '24/7' },
      { name: 'SOS CareText', contact: 'WhatsApp 9151 1767', hours: '24/7' },
      { name: 'Emergency', contact: '995', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'hk',
    label: 'Hong Kong',
    lines: [
      { name: 'The Samaritans Hong Kong', contact: '2896 0000', hours: '24/7', note: 'Multilingual' },
      { name: '香港撒瑪利亞防止自殺會', contact: '2389 2222', hours: '24/7' },
      { name: 'Emergency', contact: '999', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'za',
    label: 'South Africa',
    lines: [
      { name: 'SADAG Suicide Crisis Line', contact: '0800 567 567', hours: '24/7', note: 'Free' },
      { name: 'Lifeline South Africa', contact: '0861 322 322', hours: '24/7' },
      { name: 'Emergency', contact: '112', emergency: true },
      BACKSTOP,
    ],
  },
  {
    key: 'il',
    label: 'Israel',
    lines: [
      { name: 'ער"ן — ERAN', contact: '1201', hours: '24/7' },
      { name: 'Emergency', contact: '101', emergency: true },
      BACKSTOP,
    ],
  },
  {
    /* The fallback, and it is no longer a dead end. Somebody in a country not listed above
       now gets a directory covering 130+ countries AND the two emergency numbers that work
       across most of the world, rather than a single web address. */
    key: 'other',
    label: 'Somewhere else',
    lines: [
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'Verified lines in 130+ countries, in your language', directory: true },
      { name: 'International Association for Suicide Prevention', contact: 'iasp.info/resources/Crisis_Centres', directory: true },
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
