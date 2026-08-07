/* Fixtures for the moment scheduler.
 *
 * Kept out of the test files themselves because three suites need the same "person who has
 * done week one properly" and a drifting copy of it in each would let a rule quietly stop
 * being tested. */

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();
const day = (daysAgo) => iso(daysAgo).slice(0, 10);

/** Somebody a week in: onboarded, four practice days, five check-ins, nothing alarming. */
export function baseAppState() {
  return {
    profile: {
      firstName: 'Sam',
      onboardedAt: iso(8),
      disclaimerAcceptedAt: iso(8),
      supportRegion: 'us',
    },
    baseline: {
      capturedAt: iso(8),
      preoccupationMinutes: 240,
      urge: 8,
      avoidance: 'significant',
      suds: 8,
    },
    checkIns: [0, 1, 2, 3, 4].map((n) => ({
      id: 'c' + n,
      date: day(n),
      preoccupationMinutes: 120,
      urge: 4,
      avoidance: 'small',
      suds: 4,
    })),
    urgeLogs: [],
    thoughtRecords: [],
    mirrorSessions: [],
    experiments: [],
    practice: [0, 1, 2, 3].map((n) => ({ id: 'p' + n, date: day(n), kind: 'checkin' })),
    streak: { current: 4, longest: 4, lastPracticeDate: day(0), freezes: 2 },
    protocol: {
      currentWeek: 1,
      weekPracticeDates: [day(0), day(1), day(2), day(3)],
      completedWeeks: [],
      avoidedConditions: [],
    },
    readModules: [],
    entitled: false,
    moments: {},
    trialStartedAt: null,
  };
}

/** Wraps a state in the MomentInput shape, with the ask's preconditions satisfied. */
export function qualifiedForAsk(state) {
  return {
    state,
    trialStartedAt: state.trialStartedAt,
    trialDays: 14,
    reclaimedSampleSize: 5,
    weekComplete: true,
  };
}

export { day, iso };
