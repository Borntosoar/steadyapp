import React from 'react';
import { useRouter } from 'expo-router';
import { H1, BodySm, Caption, Button } from '../../components/ui';
import { Frost, Ground, ListRow, type GlyphKind } from '../../components/frost';
import { space } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { mirrorSpecForWeek, phaseForWeek, MIRROR_UNLOCK_WEEK, WEEKS_TOTAL } from '../../lib/protocol';
import { dayKey } from '../../lib/streak';
import { NAMES } from '../../content/names';
import { TRACKS } from '../../content/tracks.ts';
import { nextDay, isComplete, emptyTrack } from '../../lib/track.ts';
import { SUPPORT_PILL_CLEARANCE } from '../_layout';
import { effectiveWeek, weekGated } from '../../lib/entitlement';
import { useEntitlement } from '../../hooks/useEntitlement';

/* Practice.
 *
 * Was a flat list of six identical rows with no state on any of them, which is a menu
 * rather than somewhere you come back to. Two changes:
 *
 * 1. GROUPED. "This week" and "Always free" are different promises and were sitting in one
 *    undifferentiated stack, so the free-forever guarantee — the most important thing this
 *    app says about itself — was a caption at the bottom nobody reads.
 * 2. STATE ON EVERY ROW. Each one now says how many times you did it this week. It is the
 *    difference between a list of things you could do and a record of what you have done. */

interface Item {
  title: string;
  sub: string;
  route: string;
  glyph: GlyphKind;
  /** Which `practice` kinds count toward this row's tally. */
  kinds?: string[];
  locked?: string;
}

export default function Practice() {
  const router = useRouter();
  const { entitled } = useEntitlement();
  const reached = useStore((s) => s.protocol.currentWeek);
  /* See lib/entitlement.ts. The counter keeps advancing underneath; this is what is shown. */
  const week = effectiveWeek(reached, entitled);
  const weekLocked = weekGated(reached, entitled);
  const practice = useStore((s) => s.practice);
  const trackStates = useStore((s) => s.tracks);
  const phase = phaseForWeek(week);
  const mirrorOpen = !!mirrorSpecForWeek(week);
  const experimentsOpen = phase.id >= 3;
  const planOpen = week >= 11;

  /* WHY A ROW IS SHUT, SAID ACCURATELY.
     `mirrorOpen` and `experimentsOpen` read the CLAMPED week, so once the gate went in, a
     free user who had reached week 9 was shown "Week 4" on mirror practice — a pacing reason
     they passed a month ago, and a plainly false one. There are two different boundaries
     here and the chip has to name whichever they are actually behind: still working up to it,
     or done working up to it and this part is paid. */
  const EXPERIMENT_UNLOCK_WEEK = 7;
  /* Week eleven, matching the module that teaches it. */
  const PLAN_UNLOCK_WEEK = 11;
  const shut = (unlockWeek: number) => (reached >= unlockWeek ? 'Anneal+' : `Week ${unlockWeek}`);

  /* Last seven days, by local day key. Never UTC — see lib/streak.ts. */
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutKey = dayKey(cutoff);
  const thisWeek = practice.filter((p) => p.date >= cutKey);
  const tally = (kinds?: string[]) =>
    kinds ? thisWeek.filter((p) => kinds.includes(p.kind)).length : 0;

  const work: Item[] = [
    {
      title: NAMES.urge.title,
      sub: NAMES.urge.sub,
      route: '/urges',
      glyph: 'wave',
      kinds: ['urge'],
    },
    {
      title: NAMES.mirror.title,
      sub: NAMES.mirror.sub,
      route: '/mirror',
      glyph: 'mirror',
      kinds: ['mirror'],
      locked: mirrorOpen ? undefined : shut(MIRROR_UNLOCK_WEEK),
    },
    {
      title: NAMES.thought.title,
      sub: NAMES.thought.sub,
      route: '/journal',
      glyph: 'page',
      kinds: ['thought-record'],
    },
    {
      title: NAMES.experiment.title,
      sub: NAMES.experiment.sub,
      route: '/journal',
      glyph: 'flask',
      kinds: ['experiment'],
      locked: experimentsOpen ? undefined : shut(EXPERIMENT_UNLOCK_WEEK),
    },
    /* The plan. Reachable from here as well as from the week-eleven module, because it is the
       one thing in the app somebody comes BACK to — a document you revise, not an exercise you
       finish — and a document you can only reach by re-opening the article that told you to
       write it is a document nobody revises.
       It carries no `kinds`, so no tally: "2 this week" is the wrong thing to say about a
       plan, and content/tracks.ts refuses that kind of counter for the same reason. */
    {
      title: NAMES.plan.title,
      sub: NAMES.plan.sub,
      route: '/plan',
      glyph: 'page',
      locked: planOpen ? undefined : shut(PLAN_UNLOCK_WEEK),
    },
  ];

  /* Games sit in their own group rather than among the practices, and the split is not
     cosmetic. Everything under "What this week adds" is gated by where somebody is in the
     protocol; a game is not, and a row that looks gated is a row that does not get tapped.
     They are also the only thing here you would open because you felt like it. */
  const games: Item[] = [
    {
      title: NAMES.curveball.title,
      sub: NAMES.curveball.sub,
      route: '/game/curveball',
      glyph: 'curve',
      kinds: ['curveball'],
    },
    {
      title: NAMES.toward.title,
      sub: NAMES.toward.sub,
      route: '/game/toward',
      glyph: 'fork',
      kinds: ['toward'],
    },
    {
      title: NAMES.groundwork.title,
      sub: NAMES.groundwork.sub,
      route: '/game/groundwork',
      glyph: 'plus',
      kinds: ['groundwork'],
    },
    {
      title: NAMES.ballast.title,
      sub: NAMES.ballast.sub,
      route: '/game/ballast',
      glyph: 'anchor',
      kinds: ['ballast'],
    },
  ];

  /* Guided tracks. Every track is listed for everybody, not only for the survey shapes it
     names — `forCarrying` decides what gets offered on the result screen, and that is the
     whole of its job. Hiding a track here would mean somebody who tapped quickly at 2am, or
     skipped the survey entirely, has a smaller app forever, which is the same rule
     __tests__/survey.test.mjs holds the game order to.

     The row says what is NEXT rather than how much is left. "3 of 7" is the counter
     content/tracks.ts refuses outright; the name of the next day is more use anyway. */
  const guided: Item[] = TRACKS.map((t) => {
    const state = trackStates[t.id] ?? emptyTrack('');
    const next = nextDay(t, state);
    return {
      title: t.title,
      /* An unstarted row says what the track is FOR, not how long it is. It used to say
         "seven of them, in order" — which was fine with one track, and with four became four
         identical subtitles under four evocative titles, so the list told the reader nothing
         about which one was theirs. (It also put a lowercase "seven" at the start of a
         sentence, which is what made me look.) The length is still on the overview, in the
         seedling, and on the survey result. */
      sub: isComplete(t, state)
        ? 'All of them done. Any one again, whenever.'
        : next && state.done.length > 0
          ? `Next: ${next.title}`
          : t.oneLine,
      route: `/track/${t.id}`,
      glyph: 'book' as GlyphKind,
    };
  });

  const free: Item[] = [
    {
      title: NAMES.calm.title,
      sub: NAMES.calm.sub,
      route: '/grounding',
      glyph: 'rings',
      kinds: ['grounding', 'hard-day'],
    },
    {
      title: NAMES.checkin.title,
      sub: NAMES.checkin.sub,
      route: '/checkin',
      glyph: 'plus',
      kinds: ['checkin'],
    },
  ];

  const row = (it: Item, i: number) => {
    const n = tally(it.kinds);
    return (
      <ListRow
        key={it.title}
        glyph={it.glyph}
        title={it.title}
        sub={it.sub}
        count={n > 0 ? `${n} this week · ${it.sub}` : undefined}
        done={n > 0}
        lock={it.locked}
        first={i === 0}
        onPress={() => !it.locked && router.push(it.route)}
      />
    );
  };

  return (
    <Ground tabBarSpace>
      <H1 style={{ marginTop: space.xl, paddingRight: SUPPORT_PILL_CLEARANCE }}>Practice</H1>
      {/* The clamp makes the NUMBER honest; this line is where it could still lie. `phase.focus`
          for week one reads "Check in each day. Nothing hard yet. First we find out where you
          are." — true for a beginner, and faintly insulting three lines above "You finished
          week 8." A clamped week is not a description of where somebody is, so it does not get
          to keep the sentence that describes where somebody is. It says what it is instead,
          and hands the reason to the notice directly below. */}
      <BodySm style={{ marginTop: space.sm }}>
        {weekLocked
          ? `Week ${week} of ${WEEKS_TOTAL} is what the free plan covers.`
          : `Week ${week} of ${WEEKS_TOTAL}. ${phase.focus}`}
      </BodySm>

      {/* SAID OUT LOUD, ONCE, AND ONLY AFTER THEY HAVE EARNED IT.
          Somebody who finishes week one on the free tier would otherwise just stop advancing
          with no explanation, which is the version of this that reads as a bug and feels like
          a trick. It appears only when `reached > 1` — so it is never shown to somebody who
          has not got there, and it is a statement of fact rather than a prompt: no urgency,
          no countdown, no "unlock now". SAFETY.md §5.
          Everything below it stays exactly where it was. Games, the guided tracks, calming
          down and the daily check-in are not part of this and never become part of it. */}
      {weekLocked && (
        <Frost style={{ marginTop: space.lg }}>
          <BodySm>
            You finished week {reached - 1}. Weeks 2 to {WEEKS_TOTAL} are part of Anneal+ — your
            practice still counts while you decide, and it picks up where you left it.
          </BodySm>
          <Button
            label="What Anneal+ adds"
            variant="secondary"
            onPress={() => router.push('/paywall')}
            style={{ marginTop: space.md }}
          />
        </Frost>
      )}

      <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>What this week adds</Caption>
      <Frost>{work.map(row)}</Frost>

      <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>Guided</Caption>
      <Frost>{guided.map(row)}</Frost>

      <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>Games</Caption>
      <Frost>{games.map(row)}</Frost>

      <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>Always free</Caption>
      <Frost>{free.map(row)}</Frost>

      <Caption style={{ marginTop: space.md }}>
        These two, and crisis support, are free forever. They are never locked behind a week.
      </Caption>
    </Ground>
  );
}
