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

/** A deterministic Rand from an integer seed.
 *
 *  ⚠ MULBERRY32, NOT A PLAIN LCG, and the difference matters for exactly the use below.
 *  An LCG's first output is close to linear in its seed — seeds 1, 2, 3 produce 0.2364,
 *  0.2368, 0.2372 — so seeding one per cycle and taking a few draws would make consecutive
 *  cycles near-identical orderings. That was found the hard way in a test that claimed to
 *  explore four hundred seeds and explored one. Mulberry32 avalanches the seed before its
 *  first output, which is the property a seed-per-cycle caller needs.
 *
 *  Deterministic on purpose: the same cycle must produce the same ordering on every launch,
 *  or a person who closes the app mid-cycle gets a reshuffled deck and repeats. */
export function seeded(seed: number): Rand {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deal `n` items for session `index`, dealing the whole pool before repeating any of it.
 *
 * ⚠ THE PROBLEM THIS SOLVES IS NOT A SHORTAGE OF CONTENT, and that is worth stating because
 * the obvious fix is the wrong one.
 *
 * Curveball drew four scenes from a freshly shuffled pool every session — INDEPENDENTLY, with
 * no memory. At seven scenes that repeated on session two by the pigeonhole principle. So the
 * pool went to thirty, and the measured mean first repeat moved from 2.0 sessions to 2.72.
 * Twenty-three scenes bought seven tenths of a session, because independent draws collide on
 * the birthday problem's schedule regardless of how big the pool is: two draws of four from
 * thirty miss each other only about 55% of the time.
 *
 * A pool with no memory cannot be fixed by making it bigger. So the deal has memory instead:
 * the pool is permuted once per CYCLE and handed out in consecutive blocks, which means every
 * item is seen once before any is seen twice. Thirty scenes at four a session becomes seven
 * genuinely fresh sessions rather than two and a bit.
 *
 * The permutation is seeded from the cycle number rather than from `Math.random`, so it is
 * stable across launches — otherwise closing the app mid-cycle reshuffles the deck and deals
 * cards already played. Each cycle gets a different order, so the second pass through the
 * pool is not the first pass again.
 *
 * The last block of a cycle is short when the pool does not divide evenly; it is topped up
 * from the NEXT cycle's permutation rather than left short, because a session with three
 * scenes instead of four is a worse failure than one early repeat every seventh session. */
export function deal<T>(items: readonly T[], n: number, index: number): T[] {
  if (!Array.isArray(items) || items.length === 0 || n <= 0) return [];
  const size = Math.min(n, items.length);
  const perCycle = Math.ceil(items.length / size);
  /* `index` arrives from a stored count and may be anything a hand-edited payload contains.
     Floored, non-negative, finite — an index of NaN would otherwise make every derived value
     NaN and deal an empty hand. */
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const cycle = Math.floor(i / perCycle);
  const block = i % perCycle;

  const order = shuffle(items, seeded(cycle + 1));
  const out = order.slice(block * size, block * size + size);
  if (out.length === size) return out;

  /* Short final block. Topped up from the next cycle, skipping anything already in hand. */
  const next = shuffle(items, seeded(cycle + 2));
  for (const item of next) {
    if (out.length === size) break;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
