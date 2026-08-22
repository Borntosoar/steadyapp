/* Fisher-Yates, with the random source injected.
 *
 * WHY THIS IS NOT `sort(() => Math.random() - 0.5)`. That trick is the one every prototype
 * reaches for and it is measurably biased — the comparator is inconsistent, so the sort's
 * behaviour depends on its algorithm, and some permutations come up several times more
 * often than others. In a game that means the same distractor keeps landing in the same
 * slot, which a player learns without noticing and which quietly stops the exercise being
 * an exercise.
 *
 * WHY THE RANDOM SOURCE IS A PARAMETER. A shuffle only ever called with a live
 * `Math.random` is a shuffle nobody can test. Every caller in the app passes nothing and
 * gets `Math.random`; every caller in the suite passes a fixed sequence and gets a
 * deterministic result.
 *
 * Lives in lib/ rather than beside one game because two games need it, and the second copy
 * is where the bias comes back. lib/ is required to stay loadable under bare Node — no
 * react-native imports, ever — which is enforced by __tests__/safety.test.mjs. */

export type Rand = () => number;

export function shuffle<T>(items: readonly T[], rand: Rand = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
