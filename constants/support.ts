import type { SupportRegion } from '../types';

/* Crisis and support lines.
 *
 * Kept in one file so updating a number is a one-line change by someone who does not
 * need to understand the rest of the codebase. Verify these periodically — a wrong
 * number here is the worst bug this app could ship. */

export const SUPPORT_REGIONS: SupportRegion[] = [
  {
    key: 'ca',
    label: 'Canada',
    lines: [
      { name: '9-8-8 Suicide Crisis Helpline', contact: 'Call or text 988', note: '24/7, free' },
      { name: 'Kids Help Phone', contact: 'Call 1-800-668-6868 · text CONNECT to 686868', note: 'Under 30' },
      { name: 'Emergency', contact: '911' },
    ],
  },
  {
    key: 'us',
    label: 'United States',
    lines: [
      { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', note: '24/7, free' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', note: '24/7, free' },
      { name: 'Emergency', contact: '911' },
    ],
  },
  {
    key: 'uk',
    label: 'United Kingdom',
    lines: [
      { name: 'Samaritans', contact: 'Call 116 123', note: '24/7, free' },
      { name: 'Shout', contact: 'Text SHOUT to 85258', note: '24/7, free' },
      { name: 'NHS urgent mental health', contact: 'Call 111, option 2' },
      { name: 'Emergency', contact: '999' },
    ],
  },
  {
    key: 'au',
    label: 'Australia',
    lines: [
      { name: 'Lifeline', contact: 'Call 13 11 14', note: '24/7' },
      { name: 'Beyond Blue', contact: 'Call 1300 22 4636' },
      { name: 'Kids Helpline', contact: 'Call 1800 55 1800', note: '5–25 years' },
      { name: 'Emergency', contact: '000' },
    ],
  },
  {
    key: 'other',
    label: 'Somewhere else',
    lines: [
      { name: 'Find a helpline', contact: 'findahelpline.com', note: 'Verified lines in 130+ countries' },
      { name: 'International Association for Suicide Prevention', contact: 'iasp.info/resources/Crisis_Centres' },
    ],
  },
];

export function regionByKey(key: string): SupportRegion {
  return SUPPORT_REGIONS.find((r) => r.key === key) ?? SUPPORT_REGIONS[1];
}

/** Guidance on finding a therapist who actually treats this, not generic counselling. */
export const THERAPY_GUIDANCE = [
  'Ask specifically for **CBT with exposure and response prevention**. Generic supportive counselling is the most commonly received therapy for appearance distress and it performs worse in head-to-head trials.',
  'The International OCD Foundation keeps a directory of clinicians who treat body image and related conditions: **iocdf.org**.',
  'In the UK you can self-refer to NHS Talking Therapies without going through your GP.',
  'When you make contact, it is fair to ask: *have you treated appearance preoccupation before, and do you use exposure and response prevention?* A good clinician will not mind the question.',
  'If money is the barrier, ask about sliding-scale fees, training clinics at universities, and group programmes — all three are usually far cheaper and none of them are lower quality.',
];

/** Shown at the top of /support. Written to be usable by someone in real distress:
 *  short sentences, no preamble, action first. */
export const SUPPORT_INTRO =
  'If today is bad, you do not have to work through the programme. Reaching a person is the more useful thing.';
