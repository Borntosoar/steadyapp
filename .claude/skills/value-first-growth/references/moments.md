# Moments: when the app is allowed to speak

The funnel documents *what* to say at each stage. This documents *when*, and it is the
harder half. Most products with good copy still feel pushy, and the reason is almost never
the wording — it is that four different screens each decided independently to say something.

---

## The distinction everything hangs on

**A boundary** is reached because the user walked into it. A locked module they tapped. The
sixth thought record in a month. The charts on a screen they opened. The app is answering a
question the user just asked, and the answer happens to involve money.

**An interruption** is started by the app. An upgrade prompt. A winback. A review request.
Nobody asked. It arrives on top of whatever the person opened the app to do.

The two need opposite treatment and are constantly confused:

| | Boundary | Interruption |
|---|---|---|
| Started by | the user | the app |
| Frequency cap | none needed | strictly budgeted |
| Can repeat | yes, every time they hit it | no |
| Suppressed by a bad day | no | yes, if it sells |
| Where the logic lives | the screen | one scheduler |

A boundary does not need a cooldown, because the user chose to walk into it. Putting one
there is how you end up with a locked screen that refuses to explain why it is locked.

An interruption needs a budget, because it spends trust every time it fires **whether or
not it converts**. That cost is invisible in conversion metrics and shows up months later
in reviews and word of mouth.

---

## One scheduler, not many

Every interruption goes through a single function that returns **at most one** thing to say
today. Not one per screen — one per app.

This is not tidiness. Scattering the decision is how a product shows three prompts in one
session without any human ever deciding to: each screen's prompt is individually reasonable
and nobody is looking at the sum. Published guidance puts the ceiling at one to two in-app
messages per session, with promotional messages unrelated to the current action capped at
one per session plus a daily cap. A distress product should sit below that ceiling, not at
it.

In this codebase: `lib/moments.ts` decides, `components/MomentCard.tsx` draws, and a test
asserts nothing else in the tree renders moment copy. If a screen wants to interrupt
somebody and it is not in the scheduler, that is the bug.

---

## The four kinds

Kind governs suppression, not tone. Everything is written warmly; that is not what this
classification is for.

**Service.** The app owes the user this information and staying quiet would hurt them. A
trial ending in two days is money about to leave their account, and they were promised a
warning. Service moments ignore the daily budget and ignore distress suppression, because
withholding one to respect a frequency cap is the product protecting its own manners at the
user's expense.

**Care.** About the work going well or badly. Names the plateau before they hit it, marks
two months of holding. Never sells. Not suppressed by a bad day — a hard day is often
exactly when "this flat stretch is normal" is worth reading.

**Commercial.** Asks for money. **There should be exactly one.** More than one and the app
has become a shop with a therapy section.

**Advocacy.** Asks for a review. Suppressed like commercial. Asking somebody having a bad
week to go and praise you in public is tone-deaf, and it collects one stars. iOS caps the
native prompt at three per user per year regardless, so one spent badly is a third of the
budget gone.

---

## The suppression rule

**Any sign of a hard day silences everything that sells, for 24 hours.** In this app that
means a hard-day tap, a distress rating of 8 or more, or a day where appearance worry
cancelled something.

Err generous. A suppressed ask costs a few dollars; the other mistake costs a person's
trust in the one app they opened for help, and that asymmetry is not close. Suppression
that only triggers on the most extreme signal is suppression that will miss the case it
existed for.

This is the rule most likely to be quietly relaxed later, by somebody reasonable, chasing a
number. Make it a test, not a comment.

---

## Dismissal is an answer

Most apps treat a dismissal as a delay. It is not. Somebody said no.

- Each dismissal **doubles** the wait before asking again.
- After a set number of dismissals the moment **retires permanently**.
- Acting on it retires it too.
- Dismissal state is **persisted**. A "no" the app forgets overnight was never a no.

Three refusals and never again is a real commitment and it is worth making, because the
alternative — asking forever — converts a small number of people and quietly costs the
goodwill of everybody else. Reducing message volume by 30–40% has been reported to *raise*
click-through, because what survives carries more weight.

The dismiss control sits at the same visual weight as the action and says what it does.
`Not now` and `Close`, never `No thanks, I like feeling this way`.

---

## Cairn's map

Six moments. One asks for money.

| Moment | Kind | Fires when | Shows | Cooldown | Refusals to retire |
|---|---|---|---|---|---|
| `trial-ending` | service | 2 days before the trial renews | 2 | 1 day | cannot be dismissed away |
| `winback` | service | 10 days away, with a real history | 2 | 14 days | 1 |
| `plateau` | care | week 4–5 | 2 | 7 days | 1 |
| `month-two-proof` | care | week 8+, entitled, number held | 1 | — | — |
| `week-one-ask` | commercial | week 1 done, ≥3 check-ins, not entitled | 3 | 4 days | 3 |
| `rate-app` | advocacy | 10+ practice days and real wins logged | 1 | — | 1 |

Boundaries, which are *not* scheduled and always render: locked learn modules, the monthly
thought-record limit, the locked charts on Progress, and the paywall itself when reached by
tapping something.

### Why the ask sits where it does

Week one complete, three check-ins in, a real reclaimed figure the customer has watched
move. At that moment three things are true at once: they have spent effort, they have
evidence it works *for them*, and they are in a good mood about it. That is the whole
design, and it is why the ask is not at install.

### Why `plateau` outranks `week-one-ask`

They can both be eligible in week four. Care beats commercial: something useful beats
something billable, and a customer who gets told the flat stretch is normal is a customer
who is still there in week eight to be asked again.

---

## What to check before shipping a new moment

1. Is this a boundary or an interruption? If a boundary, it does not belong in the
   scheduler — put it on the screen and let it repeat.
2. What kind is it? If commercial and one already exists, the answer is no.
3. What silences it? If nothing, it is wrong.
4. What happens on the third dismissal? If the answer is "it asks again", it is wrong.
5. Would you be comfortable if the user saw the trigger condition written out? If the
   condition mentions a distress signal, delete it.
6. Is it tested with a distressed fixture, not just a happy one?
