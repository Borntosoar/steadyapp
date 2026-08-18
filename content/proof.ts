/* Evidence, standing in for social proof.
 *
 * Anneal has no users, no ratings and no analytics, so it has no social proof — and it is
 * not going to invent any. Fabricated review counts are the single most common lie on a
 * paywall and they are aimed, here, at somebody who came to this app because they cannot
 * trust their own read on reality. That is not a trade worth making at any conversion rate.
 *
 * What Anneal does have is a real evidence base for the METHOD. In a low-trust category
 * that converts better than testimonials anyway, on the condition that it is exact.
 *
 * THE RULE: every claim below is about the published literature. None is about Anneal.
 * The qualifier travels with them wherever they are rendered — see PROOF_QUALIFIER, which
 * safety.test.mjs checks is present on any screen that renders PROOF_POINTS.
 *
 * Figures are graded in the bdd-expert skill, references/evidence-base.md. Do not add a
 * line here that is not graded there. */

export interface ProofPoint {
  stat: string;
  claim: string;
  /** Where it comes from, in the form a person could actually go and look up. */
  source: string;
}

export const PROOF_POINTS: ProofPoint[] = [
  {
    stat: 'd = 1.22',
    claim:
      'Cognitive behavioural therapy for body dysmorphic disorder showed a large effect against control conditions in a meta-analysis of seven randomised trials.',
    source: 'Harrison et al., meta-analysis, 7 RCTs, N = 299',
  },
  {
    stat: '12 weeks',
    claim:
      'In treatment trials, around half of people responding do so by about week twelve, and the proportion keeps climbing well past that point. Slow is normal; slow is not the same as not working.',
    source: 'Wilhelm et al., CBT for BDD',
  },
  {
    stat: '2 in 100',
    claim:
      'Roughly two people in a hundred meet criteria for body dysmorphic disorder, at close to the same rate in men and women. It is about as common as obsessive-compulsive disorder, and far less often named.',
    source: 'Population surveys: Rief 1.7%, Buhlmann 1.8%, Koran 2.4%',
  },
  {
    stat: 'Attention',
    claim:
      'Mirror gazing and detail-focused inspection reliably increase distress rather than settling it, which is why the exercises here train where attention goes instead of arguing with how you look.',
    source: 'Veale & Riley, mirror gazing in BDD',
  },
];

/** Travels with PROOF_POINTS wherever they appear. Non-negotiable. */
export const PROOF_QUALIFIER =
  'Anneal is not therapy and has not itself been trialled. These are findings about the methods the exercises are built from.';

/* ---------- the plateau ----------
 *
 * Weeks 5 to 8 are where behaviour-change products lose people: the first gain has landed,
 * the next one has not arrived, and the customer concludes it stopped working. In this
 * protocol that stretch is real rather than imagined — response rates keep climbing long
 * past week twelve.
 *
 * Named in week four, before they reach it. An expected plateau is a stage somebody rides
 * out. An unexpected one is a cancellation. */

export const PLATEAU_NOTICE = {
  title: 'The next few weeks are the flat bit',
  body: 'Somewhere around week five the fast early change usually stops and the numbers sit still for a while. It is the most common point to conclude this is not working, and it is the point where the evidence says to keep going — in the trials, people kept responding long after week twelve. If it goes flat, that is the middle, not the end.',
};
