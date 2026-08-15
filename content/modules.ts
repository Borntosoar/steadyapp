/* Learn modules — seed content.
 *
 * Week 1's three modules are free forever. The rest unlock with Cairn+.
 *
 * Editorial rules these were written to, worth preserving in any future module:
 *   - second person, warm, plain language
 *   - no treatment claims ("many people find", never "treats" or "cures")
 *   - no appearance advice, and no numbers about bodies
 *   - the mechanism first, the instruction second
 *
 * `body` paragraphs support **bold** and *italic* only; see components/RichText.tsx. */

export interface LearnModule {
  slug: string;
  title: string;
  phase: 1 | 2 | 3 | 4;
  week: number;
  minutes: number;
  free: boolean;
  body: string[];
  /** The closing action. Rendered as its own card so it doesn't get lost in prose. */
  takeaway: string;

  /* ---- reading experience ----
   * All additive. `body` stays a plain array of paragraphs so this file reads as prose and
   * the existing content tests keep working; everything below points AT it by index. */

  /** One line, the reason to open it. Shown on the Learn row, under the hero title, and on
   *  the next-module card. Also the natural source for store-screenshot copy. */
  kicker: string;

  /** Landmarks in a nine-hundred-word screen. `at` is the body index a section begins at.
   *  Never index 0 — the title already labels the opening.
   *
   *  `replaces` is for the several modules that already write their own section headings as
   *  prose ("So what *is* real?", "Do this properly:"). A styled header above one of those
   *  prints the same words twice, so there the header takes the paragraph's place. */
  sections?: { at: number; label: string; replaces?: true }[];

  /** At most one. `text` must be a verbatim fragment of a body paragraph, which a test
   *  enforces, so a pull-quote can never quietly become new unreviewed copy. */
  pullquote?: { after: number; text: string };

  /** What the takeaway does. Omitted where no honest target exists yet. */
  action?: { thing: ActionThing; route: string };
  /** Shown in place of a button. A fact, never a tease. */
  actionNote?: string;
}

/** Keys into content/names.ts. Every module button takes its label from there rather than
 *  inventing one, which is the only thing keeping twelve buttons from becoming twelve new
 *  names for six features. */
export type ActionThing = 'urge' | 'mirror' | 'thought' | 'experiment' | 'calm' | 'checkin' | 'hours' | 'plan';

export const MODULES: LearnModule[] = [
  {
    slug: 'why-your-brain-zooms-in',
    kicker: 'You take in other people whole. You take yourself apart.',
    sections: [{ at: 5, label: 'How much anyone actually notices' }, { at: 9, label: 'Why this can change' }],
    pullquote: { after: 4, text: "You're not comparing your face to their face. You're comparing your face under a microscope to their face at a glance." },
    action: { thing: 'checkin', route: '/checkin' },
    title: 'Why your brain zooms in',
    phase: 1,
    week: 1,
    minutes: 4,
    free: true,
    body: [
      "There's a specific thing your brain does when you look at yourself, and it isn't the thing it does when it looks at anyone else.",
      "When you look at another person's face, you take it in whole. It happens fast — a fraction of a second — and you come away with a general impression. Friendly. Tired. Familiar. You almost never register the individual parts. Ask someone to describe the nose of a friend they've known for a decade and they'll struggle.",
      "When you look at yourself, especially if you've been worrying about how you look, your brain switches modes. It stops taking in the whole and starts examining the parts. One at a time. Up close. It stops seeing a face and starts inspecting a surface. Researchers have a name for that: detail-focused processing. It turns up again and again in appearance anxiety, which means what you are doing is a known thing, not a fault in you.",
      "Here's why that matters so much: **inspection creates flaws.** Not metaphorically — perceptually. Any surface examined closely enough looks irregular. Skin has texture. Faces are asymmetrical, all of them, every single one. When you scan yourself part by part, you are running a search that is guaranteed to find something. Then you hold what you found against your whole-face impression of other people. Nobody ever inspected them that way.",
      "You're not comparing your face to their face. You're comparing your face under a microscope to their face at a glance.",
      "Something else is going on at the same time. People badly overestimate how much anyone else notices about them. In the first studies on this, people wearing something embarrassing on purpose guessed that about half the room would clock it. The real figure was nearer a fifth. That is for something obvious. Researchers call it the spotlight effect.",
      "The thing you've been thinking about all morning — the thing you checked four times before leaving — most people did not see it. Not because they're being kind. Because they were thinking about themselves.",
      "None of this means your perception is broken or that you're imagining things. Your eyes work. What's happening is that your *attention* has developed a habit, and the habit produces a distorted read.",
      "It's worth saying plainly who this happens to, because a lot of people rule themselves out. Surveys of the general population put it at close to the same rate in men and women. Neither group is the exception here, and the gap is far smaller than almost anyone assumes. What differs is where the attention lands. Hairline, skin, nose, teeth, build, stomach, chest, height, a scar, something nobody else has ever mentioned: the feature varies enormously between people, and it often moves over a lifetime in the same person. The loop underneath it doesn't vary at all. That's the reason one set of practices works across all of it.",
      "The good news, and it's the whole reason this app exists: attention is trainable. It's one of the most trainable things about the human mind. You have spent months or years practising a particular way of looking at yourself. That practice is why it feels automatic. The next twelve weeks are practice in the other direction.",
      "You don't need to change how you look to change what you see. You need to change how you look *at it*.",
    ],
    takeaway:
      'The next time you catch yourself examining one feature, notice how close you are. Physically. Distance is a variable, and it’s one you control.',
  },

  {
    slug: 'why-checking-makes-it-worse',
    kicker: 'It works for ninety seconds. That is the trap.',
    sections: [{ at: 6, label: 'What it costs you' }, { at: 8, label: 'The way out' }],
    pullquote: { after: 8, text: "the relief has to be given up before the anxiety goes down." },
    action: { thing: 'urge', route: '/urges' },
    title: 'Why checking makes it worse',
    phase: 1,
    week: 1,
    minutes: 4,
    free: true,
    body: [
      "Checking feels like it should help. That's the trap — it isn't irrational, it's a mechanism that works beautifully for about ninety seconds and then charges you interest.",
      "Here's the loop:",
      'Something triggers the worry. You feel anxiety rise. You check — a mirror, a window, a phone camera, a quick touch to your face. For a moment you get relief, or at least certainty, or at least *something*. The anxiety drops.',
      'And your brain records that.',
      'What it records is not "I checked and I was fine." What it records is: **checking is what makes fear go away.** Take away something that hurts, and whatever you did just before gets stronger. That is the most powerful kind of learning there is. It has a name: negative reinforcement. Every compulsion in every anxiety problem is built this way.',
      'So the next time the worry appears, the urge to check arrives faster and louder. And because the relief only ever lasts minutes, you check again. And again. People who track this honestly are often shocked at the count — twenty, forty, a hundred times a day, most of it below the level of conscious decision.',
      "Now put that on top of what you read about zooming in. Every check is another round of close-up, part-by-part inspection. So checking doesn't just fail to reassure you — it actively manufactures new things to worry about. There's research on this: people asked to gaze at themselves in a mirror for a prolonged period end up *more* dissatisfied than people who glanced briefly. Same face. Same mirror. The looking did it.",
      "There is a third cost and it is the one people underrate. Checking is expensive in time and attention. It breaks your day into pieces. You cannot really be in a conversation while part of you is running a check on your jaw. The hours you lose are not just the minutes at the mirror.",
      "Here's what has to happen, and it's uncomfortable: **the relief has to be given up before the anxiety goes down.** Not after. The order feels wrong and it's the opposite of what your instincts will tell you. You resist the check, the anxiety stays high for a while, and then — this is the part you have to experience rather than be told — it comes down anyway. On its own. Without you doing anything.",
      'Every time that happens, your brain updates. Slowly. Reluctantly. But it updates, and the urge weakens.',
      "This week you're not going to stop checking. You're just going to count. That's it. Counting is not a small step — most people have never seen the real number, and seeing it changes something.",
    ],
    takeaway: 'After a check, time how long the relief lasts before the doubt comes back.',
  },

  {
    slug: 'mirrors-cameras-and-the-lie-of-the-reflection',
    kicker: 'Same face, different glass, different verdict.',
    sections: [{ at: 2, label: 'What a phone camera does' }, { at: 5, label: 'So what is real?', replaces: true }],
    pullquote: { after: 8, text: "The tool you have been using to collect evidence about yourself is faulty" },
    actionNote: 'Mirror practice opens in week 4.',
    title: 'Why mirrors and cameras lie',
    phase: 1,
    week: 1,
    minutes: 4,
    free: true,
    body: [
      "You have probably looked fine in one mirror, then looked in another an hour later and could not stand it. You decided something about you had changed. Nothing about you had changed.",
      'A reflective surface is not a neutral instrument. Think about what actually changes from one to the next. How flat the glass is. How good the coating is. The colour of the light. Whether it comes from above, the side or behind. How far back you stand. The angle of your head. How long you look. Change any one of those and the image changes. Change several and you may as well be looking at a different picture.',
      'Cameras are worse, and phone cameras are worst of all.',
      'The front camera on a phone uses a very wide lens, held very close. Up close, a wide lens makes whatever is nearest the glass look bigger. It makes everything behind it look smaller. This is a real, measured effect, and it is why photographers stand further back. Your selfie camera is not a mirror. It is not what someone across the room sees. It bends the picture, and it bends it in one direction: toward the exact features people worry about.',
      'Then there is what happens when you look for a long time. Stare at your reflection without a break and it starts to come apart. Features seem to move. The face starts to look odd, or not quite yours. This is well documented, and it happens to people with no worries about how they look at all. It is a quirk of how eyes and brains work under a long stare. If it has happened to you, you may have decided something upsetting about your face. What you actually found was a limit of human sight.',
      'So what *is* real?',
      'The closest thing to an honest read is how you look from a few feet away, in normal light, for as long as a normal person looks at you. That is about two seconds, once. Then they go back to thinking about themselves.',
      'That is the picture other people have of you. It is not the picture you have of you. Yours was built up close, in changing light, held for minutes at a time, with an anxious search running underneath. Of course the two do not match.',
      'This is not a pep talk. It is a technical point. The tool you have been using to collect evidence about yourself is faulty, and you have been treating what it says as fact.',
      'Later on you will use a mirror on purpose. At a set distance, for a set time, looking in a set way. Used like that it stops being an alarm and turns back into a piece of glass.',
    ],
    takeaway:
      'Count how many reflective surfaces you pass in a normal day. Most people find the number is far higher than they’d guess.',
  },

  {
    slug: 'the-feed-is-not-a-sample-of-reality',
    kicker: 'All of you, against a stranger’s best two seconds.',
    sections: [{ at: 2, label: 'What you are comparing against' }, { at: 5, label: 'Practical, not preachy', replaces: true }],
    pullquote: { after: 4, text: "everything you know about yourself, every doubt and every bad morning, against another person’s most controlled two seconds" },
    action: { thing: 'urge', route: '/urges' },
    /* Was "Your feed is not real life" — the single most over-used sentence in this
       category, and generic the moment somebody screenshots it. The module's actual insight
       is sharper and is already in its own body text. */
    title: 'You vs. their best two seconds',
    phase: 2,
    week: 4,
    minutes: 4,
    free: false,
    body: [
      'You already know social media is edited. It does not help. Knowing a photo is filtered does not stop the comparison landing. Comparing is not a decision you make. It is automatic, it happens in under a second, and it does not check where the picture came from.',
      'It is still worth being clear about what you are comparing yourself to. The gap is bigger than most people think.',
      'One posted photo is usually the winner out of dozens or hundreds of near-identical shots. Chosen light. Chosen angle. Taken by someone who knows their angles. Then edited, sometimes a lot, with tools that reshape a face and leave no trace. Add paid lighting, styling, and often work that is never mentioned. What lands in your hand is a built object. It does not match any person standing in a room.',
      'Then there is who you see at all. This is not a random sample of people. It is the small share who post, sorted by a system that chases attention. Attention is not the same as true, and it is not the same as good for you. Posts that make people feel behind hold attention well, so the system learns to send more of them. Your feed is a machine that got very good at finding the images that make you feel one particular way.',
      'Underneath all of it is one built-in problem. You compare everything you know about yourself, every doubt and every bad morning, against another person\u2019s most controlled two seconds. That is not a fair match. It is also the only match you can make, because you cannot see inside them and they do not post that part.',
      'Practical, not moralistic:',
      '**Unfollow by feeling, not by category.** Don’t decide which accounts are "bad." Notice which ones you feel worse after, and remove those. Ten minutes of this is worth more than any amount of willpower.',
      '**Watch the scroll after a check.** Comparison scrolling and checking feed each other. If you notice you reach for the phone right after a mirror, that’s a loop worth breaking at either end.',
      '**Put something in the way.** Log out. Move the app off the home screen. Turn the display grey. Small obstacles beat willpower, because they stop you before the automatic part starts.',
      "You don't have to quit anything. You do have to stop treating the feed as information about how people look.",
    ],
    takeaway:
      'After ten minutes of scrolling, rate your distress. Then rate it again after ten minutes of something with no faces in it.',
  },

  {
    slug: 'distress-and-appearance-are-two-different-variables',
    kicker: 'The most important idea here, and the least obvious one.',
    sections: [{ at: 2, label: 'Two lines of evidence', replaces: true }, { at: 7, label: 'Why this is good news', replaces: true }],
    pullquote: { after: 5, text: "If distress were caused by appearance, changing appearance would reliably reduce distress." },
    action: { thing: 'thought', route: '/journal' },
    title: 'How you feel is not how you look',
    phase: 2,
    week: 5,
    minutes: 4,
    free: false,
    body: [
      "This is the most important idea in the programme, and it's the least intuitive.",
      'Appearance anxiety rests on one idea: that how you look is what hurts. Change the feature and the pain goes. It sounds reasonable. It can also be tested, it has been tested, and it does not hold up.',
      'Two lines of evidence.',
      'First. How much a person hates how they look tells you very little about how they look to anyone else. People in severe appearance distress are usually rated as ordinary or good-looking by strangers. Not now and then. Most of the time. What is felt inside and what is seen outside come apart.',
      'Second, and this one matters more. When the feature does change, the pain often does not. Clinicians in this field report the same thing again and again. Somebody gets the change they were certain would fix it. There is a short stretch of relief. Then the worry moves, either back to the same feature or on to a new one. This is why good cosmetic surgeons screen for body dysmorphic disorder and turn people down. They have seen it enough times to know the operation is not the treatment.',
      "If distress were caused by appearance, changing appearance would reliably reduce distress. It doesn't reliably do that. So something else is generating it.",
      'That something is the pattern you have been reading about. Attention that zooms in. Checking that makes its own evidence. Comparing yourself against built images. Avoiding the things that would prove any of it wrong. Those are the real inputs.',
      "Here's why this is good news rather than bleak news.",
      'If how you look were the cause, you would be stuck with something costly, permanent, painful and mostly out of your hands. Instead the cause is a set of learned habits. Habits are the most changeable thing in this whole picture. Hard, slow and uncomfortable to change, yes. But you can change them, and you can do it without permission, money or a surgeon.',
      "It also reframes what progress means. You are not waiting to look different. You're not waiting to feel beautiful — that's not the target and it never was. The target is that this takes up less of you. Fewer hours. Less grip. The thought can show up and not run the day.",
      "That's a real outcome and it's measurable, which is why this app measures it.",
    ],
    takeaway:
      'If the feature you worry about changed overnight, write down what you’d do differently tomorrow. Keep that list. You will need it near the end.',
  },

  {
    slug: 'what-exposure-actually-does',
    kicker: 'Anxiety has a shape. Few people stay to see the end of it.',
    sections: [{ at: 3, label: 'The two things that change', replaces: true }, { at: 6, label: 'Why the details matter', replaces: true }],
    pullquote: { after: 7, text: "Leaving while anxiety is still climbing teaches escape. Staying until it falls teaches tolerance." },
    action: { thing: 'urge', route: '/urges' },
    /* "Facing it" is a pronoun standing on its own; outside the list it does not say what
       "it" is. This is the module's own closing line, and it is the sentence somebody
       halfway through a hard exposure actually needs. */
    title: 'Worse before better',
    phase: 2,
    week: 6,
    minutes: 4,
    free: false,
    body: [
      'Anxiety has a shape. It rises, it peaks, and if nothing is done to escape it, it comes down.',
      'That last part is the piece almost nobody experiences, because escape happens first. You leave the situation, you check, you fix, you cancel — and the anxiety drops immediately. Which teaches your brain the wrong lesson: *the escape saved me.* The alternative never gets tested.',
      "Facing it on purpose is how you test the other path. You go into the situation, you do not do the thing that gets you out of it, and you stay long enough to find out what actually happens.",
      'Two things happen when you do that repeatedly.',
      "The first is that your body’s alarm gets quieter each time. The tenth go really does set off less of a reaction than the first. That part happens on its own, and it is why the numbers in this app fall. The word for it is habituation.",
      "The second matters more, and it is about what you learn. Before you go in you are holding a prediction, usually one you never say out loud. *People will stare. Someone will say something. I will not be able to stand it. I will fall apart.* Then you do it and the prediction does not come true. Not because you were brave. Because it was never right in the first place. Enough wrong predictions and the belief underneath starts to give. Researchers call this expectancy violation.",
      'This is why the details matter so much:',
      '**Stay past the peak.** Leaving while anxiety is still climbing teaches escape. Staying until it falls teaches tolerance. If you can only manage ninety seconds, that’s fine — but end it at ninety seconds because the timer said so, not because the fear said so.',
      '**Drop the props.** Going out but keeping your hair over your face. Turning away from the light. Not meeting anyone’s eye. These look like coping and they work like escape. They let you walk away thinking *I only got through that because of the hair*, so nothing sticks.',
      '**Predict first.** Write down what you think will happen before you go in. Check it after. The written record is what changes the belief; memory will quietly rewrite the prediction to match the outcome.',
      '**Repeat.** One exposure is an anecdote. Repetition is what rewires.',
      'Mirror practice in this app is this, with a structure around it. So is the three-minute urge timer. So is any time you do the thing you have been dodging and write down what really happened.',
      "It will feel worse before it feels better. That's not a sign it's going wrong. That is what it feels like when it's going right.",
    ],
    takeaway: 'Pick something small you’ve been avoiding. Predict what will happen. Do it. Compare.',
  },

  {
    slug: 'self-compassion-without-lying-to-yourself',
    kicker: 'You do not have to like how you look to stop being cruel about it.',
    sections: [{ at: 2, label: 'Three parts', replaces: true }],
    pullquote: { after: 6, text: "You stop grading yourself." },
    action: { thing: 'thought', route: '/journal' },
    title: 'Being kind without lying to yourself',
    phase: 3,
    week: 7,
    minutes: 4,
    free: false,
    body: [
      "Being told to love your body when you don't is useless, and often makes things worse — now you've failed at the thing *and* failed at feeling good about it.",
      "Self-compassion isn't that. It has nothing to do with convincing yourself you find your appearance beautiful. You can be entirely neutral or even unhappy about how you look and still treat yourself decently. Those are separate.",
      'Three parts, all practical.',
      '**Kindness instead of attack.** Notice how you talk to yourself after a bad mirror moment. Say it out loud sometime. Most people find they’re using language they would not use to anyone they know. The test is simple and it works: if a close friend said this exact thing about themselves, what would you say back? Now say that. Not because it’s nicer — because it’s more accurate. Your inner voice is not a neutral observer. It’s a biased one, and it’s biased in one direction only.',
      '**Common humanity instead of isolation.** Appearance anxiety is intensely lonely. It carries a conviction that you’re uniquely afflicted and everyone else is at ease in their body. They aren’t. Enormous numbers of people are running some version of this, silently, including people you’d assume have no reason to. The silence is the problem, not the evidence.',
      '**Watch the thought instead of standing inside it.** A thought like *everyone noticed* turns up feeling like a fact. It is not one. There is a real skill in spotting a thought as a thought. Name it, let it sit there, do not argue with it and do not obey it. Arguing keeps you tangled in it. You do not have to win. You have to not join in.',
      "There is evidence that this works better than self-esteem for body image, and the reason makes sense. Self-esteem asks you to rate yourself well, which means the rating machine is still switched on. This switches it off instead. You stop grading yourself.",
      'One warning. This is not permission to dodge things. "I am being kind to myself, so I will skip the hard bit" is the anxiety talking in a softer voice. The kind thing and the comfortable thing are often not the same. Most of the time this looks like doing the hard exercise, then not being cruel about how it went.',
    ],
    takeaway:
      'Write down your harshest recurring self-statement. Underneath, write what you’d say to a friend who said it. Read the second one twice.',
  },

  {
    slug: 'the-hours-question',
    kicker: 'You get the hours back. Something moves into them. Decide what.',
    sections: [{ at: 4, label: 'Where the hours go' }, { at: 6, label: 'Do this properly', replaces: true }],
    pullquote: { after: 1, text: "Twenty hours a week is a part-time job." },
    action: { thing: 'hours', route: '/progress' },
    /* Did not say what the question was. The real point — reclaimed time refills with the
       old worry unless something is deliberately put in it — is more useful stated flat. */
    title: 'Free time does not stay free',
    phase: 3,
    week: 8,
    minutes: 4,
    free: false,
    body: [
      "By now you have a number. Hours per week that appearance worry has been taking from you. For most people it's between ten and thirty. Some of you are looking at more.",
      "Sit with the size of that. Twenty hours a week is a part-time job. Over a year it's more than a thousand hours. It's a language. It's a business. It's a body of work, or a set of friendships, or a hundred evenings you were actually present for.",
      "That's not said to make you feel worse about time already spent. It's said because the hours are the point, and because of what happens next.",
      '**A vacuum refills.** This is the thing that catches people out. You reduce the checking, the preoccupation drops, and now there’s unstructured time and attention where the worry used to be — and worry is very good at reclaiming empty space. If nothing moves into the gap, the old pattern moves back in.',
      'So the reclaimed hours need a destination, chosen in advance.',
      'This is where what you care about comes in, as a planning tool rather than a nice idea. It is not a goal. A goal can be finished. A direction is something you keep walking in. "Get fit" is a goal. "Look after my body" is a direction. "Have more friends" is a goal. "Be someone people can count on" is a direction. Directions never get ticked off, which is exactly why they keep working.',
      'Do this properly:',
      '**One.** Write down five things that would matter to you if appearance were entirely off the table. Not achievements — directions. Making things. Being outdoors. Knowing your family. Being good at something difficult.',
      '**Two.** For each, write one concrete action that takes under an hour and could be done this week.',
      '**Three.** Schedule one of them into a slot where you’d normally have been checking, scrolling, or getting ready. Not extra time — *that* time. The swap is the exercise.',
      '**Four.** After you do it, come back and log it. Cairn tracks hours reclaimed; you should know what they went into.',
      "There is a second effect worth naming. Appearance anxiety shrinks who you are down to one thing. Doing what you care about puts the other things back. Someone who is a good friend, and is building something, and is getting better at a skill is standing on more than one leg. That protects you, and it lasts longer than any single exercise in here.",
    ],
    takeaway: 'Pick the smallest item on your list and do it before the day ends.',
  },

  {
    slug: 'reassurance-is-checking-with-extra-steps',
    kicker: 'Same loop as a mirror, and it costs you the person too.',
    sections: [{ at: 5, label: 'What to do instead', replaces: true }],
    pullquote: { after: 2, text: "There’s no response available to them that resolves anything" },
    action: { thing: 'experiment', route: '/journal' },
    title: 'Asking other people is checking too',
    phase: 3,
    week: 9,
    minutes: 4,
    free: false,
    body: [
      '"Does this look okay?" "Be honest — can you see it?" "Are you sure?"',
      'Asking someone is checking. It just uses a person instead of a mirror. It runs the same loop. The worry rises, you ask, you get relief, the relief runs out, and you ask more often. It also has two costs the mirror does not have.',
      '**The answer can never satisfy.** If they say you look fine, you can discount it — they’re being kind, they didn’t look properly, they’d say that anyway. If they hesitate for half a second you’ll treat that as the real answer. There’s no response available to them that resolves anything, which is why you have to ask again an hour later.',
      '**It damages the relationship.** The people who love you want to help, so they answer, every time, for months. Eventually they get worn down, or frustrated, or start giving flat answers that you correctly read as flat, which makes it worse. Nobody involved understands why being kind stopped working. It stopped working because reassurance was never the treatment — it was the compulsion, and they were unknowingly supplying it.',
      'The quiet versions count too. Fishing. Running yourself down so somebody argues back. Sending a photo to a group chat "for an opinion". Asking a friend to look at one feature under good light.',
      'What to do instead:',
      '**Have the conversation once, in advance, calmly.** Pick the one or two people who get asked most. Explain what’s happening and ask them explicitly to stop answering. Give them a line to use — something warm and non-negotiable, agreed by both of you: *"I’m not going to answer that one, because we agreed I shouldn’t. I love you. Want to go for a walk?"*',
      'That script matters. It has to be affectionate and it has to hold. Delivered coldly it feels like rejection; delivered with a hedge it becomes an answer.',
      '**Warn them what happens next.** When they stop, your anxiety will go up. This is expected and it’s the mechanism working. Tell them in advance so they don’t interpret your distress as evidence they’ve been cruel and cave on day three.',
      '**Log it anyway.** Every time you feel the pull to ask and do not, write it down. It counts exactly the same as not checking a mirror, because it is the same thing.',
    ],
    takeaway: 'Have the conversation with one person. One is enough to start.',
  },

  {
    slug: 'setbacks-are-data',
    kicker: 'One bad week is not the thing coming back. Reading it that way is.',
    sections: [{ at: 4, label: 'Setbacks are triggered, not random' }, { at: 7, label: 'What to do when it happens', replaces: true }],
    pullquote: { after: 2, text: "Almost every relapse starts as a lapse that got read as a disaster." },
    action: { thing: 'plan', route: '/module/your-own-plan' },
    /* "X is information" is a wellness cliché, and it still leads with the negative word.
       The real content is a distinction most readers do not know exists, and it is the exact
       sentence that intercepts "I have ruined everything". */
    title: 'A lapse is not a relapse',
    phase: 4,
    week: 10,
    minutes: 4,
    free: false,
    body: [
      'At some point in the next few months you will have a week where it all comes back. The checking, the hours, the grip. It will feel like proof that none of this worked.',
      "It isn't proof of anything except that you're human and the pattern is old.",
      "There's a useful distinction: a lapse and a relapse. A lapse is a bad day or a bad week — the old behaviour returns temporarily. A relapse is a full return to the old baseline, sustained. Almost every relapse starts as a lapse that got read as a disaster. *I have undone everything. I am back to square one. There is no point going on.* Reading it that way is what turns three bad days into three bad months. It is the part that makes you stop practising.",
      "You are not back at square one. The learning doesn't delete. Everything you've built through repetition is still there — it's just currently drowned out by a spike in anxiety. When the spike passes, the skills are where you left them.",
      "Setbacks also tend to be triggered rather than random, which means they're informative. Common ones:",
      'Poor sleep. High stress or a deadline. Illness. Hormonal cycles. A breakup or rejection. Being photographed. An event you have to get dressed for. Seeing someone from the past. Heavy scrolling. Any big life transition.',
      'If you can name your triggers, a setback stops being a mysterious failure and becomes a predictable response to a specific input. That’s the difference between "I’m broken again" and "I slept four hours a night for a week and had a wedding on Saturday."',
      'What to do when it happens:',
      '**Name it as a lapse, out loud or in writing.** The label does real work.',
      '**Go back to basics, not to everything.** One check-in. One calming exercise. Not the whole plan on day one.',
      '**Don’t wait to feel motivated.** Motivation follows action here, never the reverse.',
      '**Log through it.** The instinct is to stop tracking when it’s bad. That’s exactly when the data is most useful, and stopping is usually the first step of quitting.',
      '**Tell one person.** Silence is where this thing gets its strength.',
      "The realistic shape of recovery is not a line going down. It's a jagged line trending down, and the jags are not the failure of the trend. They're part of it.",
    ],
    takeaway: 'Write down your three most reliable triggers. You will need them next week.',
  },

  {
    slug: 'your-own-plan',
    kicker: 'Written now, for a day you hope never comes.',
    sections: [{ at: 2, label: 'The six sections' }],
    pullquote: { after: 0, text: "In the middle of a bad stretch, your judgement is the thing that stops working." },
    action: { thing: 'plan', route: '/journal' },
    /* Could have been a module in any app about anything. The module ends on its own
       metaphor, which is specific to what this is: a plan for a day you hope never comes. */
    title: 'Your fire exit',
    phase: 4,
    week: 11,
    minutes: 5,
    free: false,
    body: [
      "This module is a document you write, not one you read. In the middle of a bad stretch, your judgement is the thing that stops working. So write the plan now, while it still works. Then follow it later without arguing with it.",
      'Write it in the app, or on paper and photograph it. Six sections.',
      '**1. My early warning signs.** The specific, observable things that show up first — before the full spiral. Checking after leaving the house. Changing outfits more than twice. Cancelling one thing. Scrolling before bed. Be concrete: "I feel bad about myself" is not an early warning sign, it’s the destination. You want the signs that appear three days earlier.',
      '**2. My triggers.** The ones you listed in week ten. Sleep, stress, events, cycles, people, platforms.',
      '**3. My first three moves.** Exactly three things you will do in the first 48 hours, ranked, no deliberation required. Something like: one check-in, one grounding exercise, message a named person. Keep it small enough that you’d do it on your worst day. A plan you can’t execute at 15% capacity is not a plan.',
      '**4. What I will not do.** The behaviours you know make it worse and that you’ll be strongly pulled toward. Cancel plans. Delete photos. Research procedures. Scroll a specific account. Ask a specific person for reassurance. Write them down so that in the moment you’re breaking a written commitment rather than making a fresh decision.',
      '**5. Who I tell.** One name. One method — text, call, in person. Write the actual opening sentence you’ll send, so you don’t have to compose it while struggling. Something like: *"Having a rough one with the body image stuff. Don’t need advice, just wanted someone to know."*',
      '**6. My line.** The point at which self-help isn’t the right tool any more and you’ll contact a professional. Set it now as things you do, not things you feel. *If I miss work or class two days running.* *If I stop leaving the house for a week.* *If I am seriously looking into a procedure.* *If I have thoughts of hurting myself.* Under the line, write the real contact details. Your doctor, a service, a helpline. Filled in. Now. So that later there’s nothing to look up.',
      "That last section is not pessimism. It's the same reason you know where the fire exit is in a building you expect not to burn down.",
    ],
    takeaway: 'Finish all six sections. Don’t leave it half-written.',
  },

  {
    slug: 'when-self-help-isnt-enough',
    kicker: 'There is a line past which this is not the right tool.',
    sections: [{ at: 4, label: 'What real help looks like', replaces: true }, { at: 9, label: 'What you take with you' }],
    pullquote: { after: 0, text: "Reaching that line says nothing about your effort or your character." },
    action: { thing: 'checkin', route: '/checkin' },
    title: "When self-help isn't enough",
    phase: 4,
    week: 12,
    minutes: 5,
    free: false,
    body: [
      'This app is a self-help tool. It is not treatment and it is not a clinician. There is a real line past which it is not enough on its own. Reaching that line says nothing about your effort or your character.',
      "Some signs it's time to bring in a professional:",
      "The distress is taking hours from most days and hasn't shifted. You're avoiding work, school, relationships, or leaving home. You are seriously looking into cosmetic work to fix the anxiety. Or you have had some, and the worry moved somewhere else. You're using restriction, over-exercise, or substances to manage how you feel about your body. You feel hopeless. You're having thoughts of harming yourself.",
      "That last one means today, not eventually — a crisis line, your doctor, or an emergency service. It's in the Support tab, always, and it's always free.",
      "What actual help looks like, so it's less unfamiliar:",
      "**CBT for body image concerns and BDD is a specific, structured therapy** with a real evidence base. It’s not open-ended talking about your childhood. It is usually twelve to twenty-four sessions. It covers the same things you have been doing here: attention training, facing things without checking, and testing what you believe. The difference is a person who can see what you cannot and change the plan as you go. Working through this app first is genuinely useful preparation; you’ll arrive knowing your own patterns and numbers, which most people don’t.",
      '**Finding someone:** ask for a clinician who has worked with body dysmorphic disorder or with OCD. Not general counselling. Your family doctor can refer. Many countries have a professional register you can search by specialism. It is fine to ask a therapist straight out, before you book, whether they have treated BDD and how they work. A good one will answer plainly.',
      '**Medication** is something some people discuss with a doctor as part of treatment. That’s a conversation for a physician, not an app, and it’s a normal thing to ask about.',
      '**Cost and access:** if private therapy is out of reach, ask your doctor about public services. University training clinics, community mental health teams and group programmes are all worth asking about. Waiting lists are real. Get on one and keep using what you’ve got in the meantime.',
      "You have done twelve weeks. You have a starting point to measure against, a set of tools, a written plan, and a number that means something. Keep the check-ins going — most people find maintenance takes far less than the initial work. Come back to the mirror sessions when things tighten. Read the bad-week piece again when you have one, because you will have them.",
      'The goal was never to feel beautiful. It was to get the hours back and spend them on your actual life. That’s still the goal.',
    ],
    takeaway:
      'Keep the daily check-in going. Maintenance costs far less than the initial work, and it is what holds the ground you took.',
  },
];

export const CONTENT_DISCLAIMER =
  'This is general information for learning. It does not replace care from a doctor.';

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);

export const freeModules = () => MODULES.filter((m) => m.free);
