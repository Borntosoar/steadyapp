/* Reading level.
 *
 * The target for every user-facing string in this app is an eighth-grade reading level,
 * which is roughly where general health writing has to sit to be understood by most
 * adults. It matters more here than in most apps: a lot of this text is read by somebody
 * anxious, and anxiety narrows working memory, so a sentence that is merely long becomes a
 * sentence that is not taken in at all.
 *
 * Flesch-Kincaid is a blunt instrument. It counts syllables and sentence length and knows
 * nothing about whether a word is familiar, so it can be gamed by chopping sentences up and
 * it can be fooled by a short sentence full of jargon. It is still worth enforcing, because
 * the two things it does measure — sentence length and word length — are the two things
 * that actually drift when copy gets rewritten in a hurry. */

/** Vowel-group syllable estimate. Wrong on some words, consistent enough to score text. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;

  const trimmed = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function countWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
}

export function countSentences(text: string): number {
  /* A colon or a bullet-style line break ends a thought as surely as a full stop does, and
     not counting them makes a list read as one enormous sentence. */
  const parts = text
    .split(/[.!?:;]+\s|\n+/)
    .map((s) => s.trim())
    .filter((s) => countWords(s).length > 0);
  return Math.max(1, parts.length);
}

/** Flesch-Kincaid grade level. Lower is easier. 8 or below is the target here. */
export function gradeLevel(text: string): number {
  const words = countWords(text);
  if (words.length === 0) return 0;
  const sentences = countSentences(text);
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

/** The longest sentence, in words. The single strongest driver of the score above, and the
 *  one worth reporting separately because it points straight at what to rewrite. */
export function longestSentence(text: string): { words: number; text: string } {
  let worst = { words: 0, text: '' };
  for (const s of text.split(/[.!?]+\s|\n+/)) {
    const n = countWords(s).length;
    if (n > worst.words) worst = { words: n, text: s.trim() };
  }
  return worst;
}
