import React from 'react';
import { useRouter } from 'expo-router';
import { H1, BodySm, Caption } from '../../components/ui';
import { Frost, Ground, ListRow, type GlyphKind } from '../../components/frost';
import { space } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { mirrorSpecForWeek, phaseForWeek, MIRROR_UNLOCK_WEEK, WEEKS_TOTAL } from '../../lib/protocol';
import { dayKey } from '../../lib/streak';
import { NAMES } from '../../content/names';

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
  const week = useStore((s) => s.protocol.currentWeek);
  const practice = useStore((s) => s.practice);
  const phase = phaseForWeek(week);
  const mirrorOpen = !!mirrorSpecForWeek(week);
  const experimentsOpen = phase.id >= 3;

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
      locked: mirrorOpen ? undefined : `Week ${MIRROR_UNLOCK_WEEK}`,
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
      locked: experimentsOpen ? undefined : 'Week 7',
    },
  ];

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
      <H1 style={{ marginTop: space.xl }}>Practice</H1>
      <BodySm style={{ marginTop: space.sm }}>
        Week {week} of {WEEKS_TOTAL}. {phase.focus}
      </BodySm>

      <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>What this week adds</Caption>
      <Frost>{work.map(row)}</Frost>

      <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>Always free</Caption>
      <Frost>{free.map(row)}</Frost>

      <Caption style={{ marginTop: space.md }}>
        These two, and crisis support, are free forever. They are never locked behind a week.
      </Caption>
    </Ground>
  );
}
