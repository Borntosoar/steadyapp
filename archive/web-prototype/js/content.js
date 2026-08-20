/* Steady — content layer.
   Psychoeducation, exercise protocols, and measures.

   Every figure cited here is traceable to the evidence base in
   .claude/skills/bdd-expert/references/. Where evidence is thin the copy says so —
   overclaiming is how a body-image tool loses the only thing it has, which is
   being believed. */

const CONTENT = {};

/* ---------- psychoeducation ----------
   Ordered deliberately. The first three do the heavy lifting: people improve most
   on discovering their experience is a known mechanism rather than a character defect. */

CONTENT.LEARN = [
  {
    id: 'not-vanity',
    title: "This isn't vanity",
    minutes: 2,
    body: `<p>Vanity is liking how you look. What you're doing is the opposite — a preoccupation that hurts and eats hours.</p>
    <p>Body dysmorphic disorder sits in the <b>obsessive-compulsive</b> chapter of the DSM-5, nowhere near narcissism. It shares genetic variance with OCD symptoms. The architecture is identical: intrusive thought → distress → compulsion → brief relief → stronger urge next time. Appearance is just the content.</p>
    <p>It affects about <b>2% of adults</b> — more common than anorexia or schizophrenia. In dermatology and cosmetic surgery clinics it runs near <b>20%</b>.</p>
    <p>One finding worth sitting with: people with BDD rate their own attractiveness <i>significantly lower</i> than independent observers rate them — while rating other people's attractive faces <i>higher</i> than controls do. The distortion is specific, and it points inward. That isn't self-absorption. It's a self-directed perceptual bias.</p>`
  },
  {
    id: 'the-loop',
    title: 'The loop that keeps it running',
    minutes: 3,
    body: `<p>Checking feels like it should settle the anxiety. It reliably does the opposite.</p>
    <ul>
      <li><b>Trigger</b> — a reflection, a photo, a passing thought</li>
      <li><b>Appearance thought</b> — "something is wrong"</li>
      <li><b>Distress</b> — it spikes</li>
      <li><b>Compulsion</b> — mirror, camera, pinching, measuring, asking, comparing</li>
      <li><b>Brief relief</b> — seconds to minutes</li>
      <li><b>Stronger urge next time</b> — the brain just learned relief requires checking</li>
    </ul>
    <p>This has been measured directly. Veale and Riley studied 52 people with BDD against 55 controls. Checking sessions ran <b>up to 170 minutes</b>. Attention went to specific features, and to an internal <i>felt sense</i> rather than the actual reflection. And distress was <b>higher afterward — around 18% higher</b>.</p>
    <p>Checking is not neutral data collection. It's the accelerator.</p>`
  },
  {
    id: 'attention',
    title: 'Why it looks worse the more you look',
    minutes: 3,
    body: `<p>Sustained close inspection of any feature, on any face, makes it look stranger and more significant. That's a property of perception, not evidence of a flaw.</p>
    <p>There's imaging work behind this. Feusner and colleagues at UCLA found that in BDD, visual processing skews toward <b>local detail</b> at the expense of the global, holistic view — reduced activity in the systems carrying low-spatial-frequency information, which is what conveys the whole. Symptom severity tracks inversely with activity in those holistic-processing regions.</p>
    <p>The finding that makes it convincing: the same pattern shows up for photographs of <b>houses</b>. It's a processing style, not something self-specific or imaginary.</p>
    <p><b>What this means for you:</b> something in how you're processing the image genuinely is different. What it isn't is a <i>more accurate</i> view. This is why "just look and reassure yourself" fails as a strategy, and why perceptual retraining — practising the wide view — is a real intervention rather than a relaxation exercise.</p>
    <p class="confidence">Confidence: the processing difference is replicated. Whether it <i>causes</i> BDD or results from years of detailed scrutiny is unresolved.</p>`
  },
  {
    id: 'comparison',
    title: 'Comparison is a rigged sample',
    minutes: 2,
    body: `<p>Comparison feels like gathering evidence. It isn't — the sampling is rigged three ways:</p>
    <ul>
      <li>Your all-day unedited self against someone's best, filtered, best-lit frame</li>
      <li>Your most disliked feature against their best one</li>
      <li>Only the instances that confirm the fear get counted</li>
    </ul>
    <p>The output points the same direction no matter what you actually look like. That's a property of the method, not a fact about you.</p>
    <p>On social media specifically, the honest version: experimental exposure to appearance-ideal images has a <b>measurable negative effect on how you feel about your body right then</b>, and image-based platform use correlates with dysmorphic symptoms — especially when the motive for using them is appearance-related. Whether it <i>causes</i> the disorder is unresolved, and the longitudinal effects are small. BDD was described in the 1890s. More accelerant than origin.</p>`
  },
  {
    id: 'reassurance',
    title: 'Why asking never settles it',
    minutes: 2,
    body: `<p>You've probably run this experiment already: you asked someone, they answered, and it didn't hold.</p>
    <p>That isn't because they lied. It's what the loop does with answers. A positive answer gets discounted — <i>they're just being nice, they didn't look properly</i>. A negative answer is catastrophic. There's no version that helps.</p>
    <p>Reassurance also does something quieter and worse: it hands the verdict on your body to an outside judge. Treatment works by dismantling exactly that arrangement.</p>
    <p>This is why the app won't rate you, and won't tell you that you look fine either. "You look completely normal" is reassurance wearing a different coat. The goal isn't convincing you that you look acceptable — it's <b>making appearance stop being the thing that decides whether you're acceptable</b>.</p>`
  },
  {
    id: 'surgery',
    title: 'What cosmetic procedures actually do',
    minutes: 3,
    body: `<p>If you're considering a procedure, you should have this number before you decide, because most people never get it.</p>
    <p>Crerand, Menard and Phillips tracked surgical and minimally invasive cosmetic procedures in people with BDD. <b>Only about 2.3% produced long-term improvement in overall BDD symptoms.</b> Roughly a quarter improved preoccupation with the specific feature treated — but the concern usually relocated to another body part. The most common outcome was no change. Some people got worse.</p>
    <p>The contrast matters: people <i>without</i> BDD generally do feel better about their bodies after cosmetic procedures. The failure is BDD-specific.</p>
    <p>Which points at the real question. Is the distress <i>about</i> the feature, or is the feature where the distress currently lives? If it's the second, a procedure changes the address and not much else.</p>
    <p>This isn't an instruction. It's the sequencing that makes sense: get a proper assessment first. If it's negative you've lost a few weeks. If it's positive you've avoided something irreversible with roughly a 1-in-40 chance of helping.</p>`
  },
  {
    id: 'treatment',
    title: 'What actually works',
    minutes: 3,
    body: `<p>Two treatments have randomized evidence behind them.</p>
    <p><b>CBT built specifically for BDD.</b> Across 7 randomized trials (N=299), the pooled effect against waitlist or placebo therapy was <b>d = −1.22</b> — large. It also improved insight. In Wilhelm's trial, about half responded by week 12 and roughly <b>81% by week 22</b>. The components that matter: exposure with response prevention, perceptual retraining, and cognitive work on appearance-contingent self-worth.</p>
    <p><b>SSRIs.</b> In the fluoxetine trial, 53% responded versus 18% on placebo. Two details clinicians often miss: BDD generally needs <b>higher doses and longer trials</b> than other conditions — 12 to 16 weeks — and in that trial the drug didn't separate from placebo until <b>week 8</b>. Six weeks at a starting dose is a common under-trial that gets misread as "medication doesn't work for me."</p>
    <p><b>If you've tried therapy and it didn't help</b>, check what kind. In the one head-to-head trial, BDD-specific CBT beat supportive psychotherapy — and supportive therapy is what most people with BDD actually receive.</p>
    <p>Notably absent from the evidence: rating yourself, scoring your face, or tracking whether you improved today.</p>`
  },
  {
    id: 'hope',
    title: 'The honest prognosis',
    minutes: 2,
    body: `<p>Untreated, this is chronic. In a 4-year prospective study, the probability of full remission was <b>0.20</b>, and full-or-partial <b>0.55</b>. At one-year follow-up, over 90% hadn't been symptom-free for even eight consecutive weeks.</p>
    <p>Treated, the picture changes substantially — the numbers in the previous card.</p>
    <p>So here's the honest framing: <b>this is one of the more treatable serious psychiatric conditions, and one of the least treated.</b> Only about <b>15%</b> of people with BDD have ever been diagnosed with it. Under 40% have had any mental health treatment at all. The barriers are shame, not knowing it's a recognised condition, and preferring cosmetic routes.</p>
    <p>The gap is recognition and access — not the absence of something that works. That's a genuinely hopeful thing to know, and it doesn't require overselling anything.</p>`
  },
  {
    id: 'when-to-get-help',
    title: 'When to involve a professional',
    minutes: 2,
    body: `<p>Worth reaching out — ideally to someone who treats BDD specifically — if any of these fit:</p>
    <ul>
      <li>Appearance thoughts take an hour or more of most days</li>
      <li>You're avoiding school, work, photos, or people</li>
      <li>Checking, grooming, or camouflaging rituals are hard to stop</li>
      <li>You're considering cosmetic procedures to fix distress rather than a clear medical issue</li>
      <li>You're restricting food, over-exercising, or using substances to change your body</li>
      <li>You've had thoughts of hurting yourself</li>
    </ul>
    <p>On that last one, plainly: BDD carries markedly elevated suicide risk. In a 4-year prospective study, a mean of <b>57.8% of participants reported suicidal ideation per year</b> and 2.6% attempted per year. If that's where you are, that's the thing to deal with first — not your appearance.</p>
    <p>The International OCD Foundation (iocdf.org) keeps a directory of BDD specialists.</p>`
  },
  {
    id: 'for-family',
    title: 'If someone you love has this',
    minutes: 3,
    body: `<p>The two most natural responses are the two least helpful.</p>
    <p><b>Stop:</b> giving reassurance, however sincere — every "you look fine" feeds the loop. Debating whether the flaw is real; you can't win, and winning would still leave appearance as the arbiter. Funding cosmetic procedures. Accommodating the avoidance (making excuses, covering, letting them skip everything) — family accommodation predicts worse outcomes across OCD-spectrum conditions.</p>
    <p><b>Start:</b> responding to the distress instead of the content — <i>"that sounds exhausting, I'm here."</i> Raising treatment in terms of the suffering and the lost time, never the appearance: <i>"you're spending three hours a day fighting this and it's making you miserable — that's what I want to help with."</i> Learning the mechanism so their explanations don't sound like excuses.</p>
    <p>Pushing hard increases concealment. Persistent, warm and non-escalating has better odds.</p>
    <p>And ask directly about suicidal thoughts if you're worried. Asking does not plant the idea — that's well established.</p>`
  }
];

/* ---------- weekly severity measure ----------
   ORIGINAL instrument. Deliberately NOT the BDD-YBOCS, which is a copyrighted,
   rater-administered clinical scale — reproducing it in a self-help app would be both
   a licensing problem and a clinical misuse.

   It covers the same six domains the field considers load-bearing (time, distress,
   interference, resistance, control, avoidance) so the trend is meaningful, and it is
   labelled throughout as a self-report tracker rather than a diagnostic score. */

CONTENT.SEVERITY_ITEMS = [
  { id: 'time_thoughts', text: 'Over the past week, how much of your day did appearance thoughts occupy?',
    labels: ['None', 'Under 1 hr/day', '1–3 hrs/day', '3–8 hrs/day', 'More than 8 hrs/day'] },
  { id: 'distress', text: 'How much distress did those thoughts cause?',
    labels: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
  { id: 'interference_thoughts', text: 'How much did they interfere with work, study, or being with people?',
    labels: ['Not at all', 'Slightly', 'Moderately', 'A lot', 'Completely'] },
  { id: 'resistance', text: 'When the thoughts came, how much did you try to turn your attention elsewhere?',
    labels: ['Always tried', 'Usually tried', 'Sometimes tried', 'Rarely tried', 'Never tried'] },
  { id: 'time_behaviours', text: 'How much time went into appearance behaviours — checking, grooming, camouflaging, comparing, seeking reassurance?',
    labels: ['None', 'Under 1 hr/day', '1–3 hrs/day', '3–8 hrs/day', 'More than 8 hrs/day'] },
  { id: 'control', text: 'How much control did you have over those behaviours?',
    labels: ['Complete control', 'Much control', 'Some control', 'Little control', 'No control'] },
  { id: 'avoidance', text: 'How much did you avoid situations because of how you thought you looked?',
    labels: ['No avoidance', 'Slight', 'Moderate', 'A lot', 'Avoided almost everything'] },
  { id: 'interference_behaviours', text: 'How much did the behaviours themselves get in the way of your day?',
    labels: ['Not at all', 'Slightly', 'Moderately', 'A lot', 'Completely'] }
];

CONTENT.SEVERITY_MAX = CONTENT.SEVERITY_ITEMS.length * 4; // 32

/* Belief conviction, tracked separately. Modelled on the construct the Brown Assessment
   of Beliefs Scale measures — how firmly the appearance belief is held. Tracked apart from
   severity because CBT improves insight on its own (d = -0.56), and watching conviction
   loosen is often the first visible movement. */
CONTENT.CONVICTION_ITEM = {
  text: 'How convinced are you right now that your appearance concern is accurate — that others see the flaw the way you do?',
  labels: ['Not at all convinced', 'Slightly', 'Moderately', 'Very convinced', 'Completely certain']
};

/* Risk item. Never scored, never trended, never gamified. Its only job is to open a door. */
CONTENT.RISK_ITEM = {
  text: 'In the past week, have you had thoughts of hurting yourself, or that you would be better off not here?',
  options: ['No', 'Yes']
};

/* ---------- cognitive ---------- */

CONTENT.DISTORTIONS = [
  { name: 'All-or-nothing thinking', hint: 'Perfect or hideous, with nothing in between.' },
  { name: 'Mind reading', hint: 'Assuming you know what they noticed and thought.' },
  { name: 'Catastrophizing', hint: 'One glance becomes a ruined life.' },
  { name: 'Emotional reasoning', hint: 'It feels true, so it must be true.' },
  { name: 'Mental filter', hint: 'One data point counted, the rest discarded.' },
  { name: 'Should statements', hint: 'Rules about how you ought to look.' },
  { name: 'Labeling', hint: 'A whole person reduced to one feature.' },
  { name: 'Comparison trap', hint: 'Your worst against their best.' },
  { name: 'Fortune telling', hint: 'Predicting the rejection before it happens.' }
];

/* Cognitive restructuring works on the belief under the thought, not the feature.
   The target is never "my nose is fine" — it's "my nose isn't what decides whether I'm acceptable." */
CONTENT.CORE_BELIEF_PROMPTS = [
  'If that thought were completely true, what would it mean about you?',
  'And if that were true, what would that mean?',
  'Whose voice does this sound like?',
  'What would you have to believe about worth for this to feel this urgent?'
];

/* ---------- compulsions ---------- */

CONTENT.COMPULSIONS = [
  'Mirror checking', 'Photographing myself', 'Comparing to someone', 'Seeking reassurance',
  'Camouflaging (clothing, makeup, hair, posture)', 'Skin picking', 'Measuring or pinching',
  'Grooming rituals', 'Researching procedures', 'Scrolling appearance content', 'Avoiding a situation'
];

/* ---------- ERP ----------
   The app helps someone build and climb a hierarchy; it does not prescribe one.
   Framed as behavioural experiments with an explicit prediction, which outperforms
   pure habituation. */

CONTENT.ERP_SUGGESTIONS = [
  'Leave the house without checking the mirror first',
  'Go out in bright daylight',
  'Let someone take a photo of me',
  'Sit facing into the room rather than away',
  'Go without the item I use to camouflage',
  'Keep my hair off my face for an hour',
  'Eat in front of other people',
  'Go to the gym / pool',
  'Hold eye contact through a whole conversation',
  'Post a photo without editing it',
  'Go a full day without asking anyone how I look'
];

CONTENT.ERP_RULES = [
  'Name the prediction first — what specifically do you expect to happen?',
  'Then drop the compulsion: no checking, no adjusting, no asking, no comparing.',
  'Stay until the distress starts to fall on its own, or the situation ends.',
  'Afterwards, write what actually happened — not what it felt like.'
];

/* ---------- perceptual retraining ----------
   The distinctive BDD component and the one non-specialists most often omit.
   Targets the local-detail bias: whole-body coverage, neutral description,
   conversational distance, fixed duration. */

CONTENT.MIRROR_PROTOCOL = {
  rules: [
    'Stand at conversational distance — arm\'s length or further. Not close.',
    'Set the timer and stop when it ends, even if you want longer.',
    'Describe out loud, factually. "Dark hair, shoulder length." Not "greasy", not "wrong".',
    'Cover your whole appearance, top to bottom.',
    'Give your disliked area exactly the same time as everything else. No more, no less.',
    'No adjusting, touching, angling, or leaning in.',
    'If an evaluation slips out, say the neutral version and carry on.'
  ],
  regions: [
    { region: 'Hair', prompt: 'Colour, length, texture, where it sits.' },
    { region: 'Forehead and eyebrows', prompt: 'Shape, colour, spacing.' },
    { region: 'Eyes', prompt: 'Colour, shape, position.' },
    { region: 'Nose', prompt: 'Length, width, shape. Factual words only.' },
    { region: 'Cheeks and jaw', prompt: 'Contour, colour, texture.' },
    { region: 'Mouth and chin', prompt: 'Shape, colour, proportion.' },
    { region: 'Skin overall', prompt: 'Tone, texture, variation.' },
    { region: 'Neck and shoulders', prompt: 'Line, width, posture.' },
    { region: 'Torso', prompt: 'Shape, proportion, how clothing sits.' },
    { region: 'Arms and hands', prompt: 'Length, shape, colour.' },
    { region: 'Legs and feet', prompt: 'Length, shape, how you stand.' },
    { region: 'Whole body at once', prompt: 'Step back. Take in all of it together, not part by part.' }
  ],
  neutralSwaps: [
    ['huge', 'large'], ['tiny', 'small'], ['disgusting', 'a texture I dislike'],
    ['deformed', 'asymmetric'], ['hideous', 'not what I prefer'], ['gross', 'shiny'],
    ['fat', 'wide'], ['ugly', 'not to my taste']
  ]
};

/* ---------- exercises ---------- */

CONTENT.EXERCISES = [
  { id: 'urgesurf', title: 'Urge surfing', tag: '5 min', kind: 'urge',
    desc: 'Ride out a checking or comparison urge without acting. Rate it before and after and watch what happens.' },
  { id: 'mirror', title: 'Perceptual retraining', tag: '3–5 min', kind: 'mirror',
    desc: 'The core BDD exercise. Practise the wide, neutral view instead of the zoomed-in one.' },
  { id: 'delay', title: 'Delay the check', tag: '2–30 min', kind: 'delay',
    desc: 'Postpone the compulsion. You only have to outlast one urge to learn it falls on its own.' },
  { id: 'widen', title: 'Attention widening', tag: '3 min', kind: 'steps',
    desc: 'Shift from self-focused to outward attention — the same principle used in social anxiety treatment.',
    steps: [
      'Notice you\'re zoomed in — on a feature, or on how you\'re coming across.',
      'Pick an object nearby and describe it in detail: colour, texture, edges.',
      'Widen out: name three sounds you can hear right now.',
      'Widen again: what is actually happening in this room?',
      'Return to what you were doing, attention pointed outward.',
      'It will snap back. Widen again. That snapping back and widening is the rep.'
    ] },
  { id: 'senses', title: '5-4-3-2-1 grounding', tag: '3 min', kind: 'senses',
    desc: 'Pull attention out of your head and into the room. Good for an acute spike.' },
  { id: 'breath', title: 'Box breathing', tag: '2 min', kind: 'breath',
    desc: 'Settles the physical end of anxiety. Not a treatment — a way to get steady enough to do one.' },
  { id: 'friend', title: "A friend's voice", tag: '4 min', kind: 'steps',
    desc: 'Test the double standard directly. Usually the fastest way to see it.',
    steps: [
      'Write the harsh thought in the exact words your mind used.',
      'Imagine a close friend said that same sentence about themselves.',
      'What would you actually say back? Say it out loud.',
      'Now say that response to yourself, using your own name.',
      'Notice the resistance — "but it\'s different for me". That\'s the double standard showing.',
      'Keep the friend\'s version. You don\'t have to believe it yet.'
    ] }
];

/* ---------- crisis ---------- */

CONTENT.CRISIS = [
  { region: 'United States', detail: '988 Suicide & Crisis Lifeline — call or text <b>988</b>' },
  { region: 'United States', detail: 'Crisis Text Line — text <b>HOME</b> to <b>741741</b>' },
  { region: 'Canada', detail: '<b>1-833-456-4566</b> · Kids Help Phone <b>1-800-668-6868</b>' },
  { region: 'UK & Ireland', detail: 'Samaritans — <b>116 123</b>' },
  { region: 'Anywhere', detail: 'findahelpline.com' },
  { region: 'BDD specialists', detail: 'iocdf.org keeps a directory of clinicians who treat BDD' }
];
