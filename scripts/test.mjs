#!/usr/bin/env node
/* The test runner, wrapped — because `node --test` can report a failure and still exit 0.
 *
 * THE BUG THIS EXISTS FOR, reproduced in isolation before this file was written:
 *
 *     describe('collection throws', () => {
 *       missingIdentifier();          // ReferenceError while the suite is being collected
 *       test('never runs', () => {}); // ...so this never runs
 *     });
 *
 * A normal assertion failure exits 1, as you would expect. But an exception thrown in a
 * `describe` BODY — a typo, a helper that is out of scope, a bad import — prints `not ok`
 * for the suite and exits **0**. Every test inside that block silently does not run, the
 * summary line still reads `# fail 0`, and CI goes green.
 *
 * That is the exact failure this project has already been bitten by twice in another form:
 * a guard that matches nothing always passes. __tests__/brand.test.mjs was written after a
 * rename disarmed three safety regexes that carried on reporting green. This is the same
 * shape one level up — a whole file of guards can disarm itself and the build will not say
 * so. It cost a real block of tests here: a helper defined inside one `describe` was used
 * from another, and roughly forty assertions stopped running while the suite reported clean.
 *
 * So: run the tests, pass the output straight through, and fail on any `not ok` line at any
 * indentation as well as on a non-zero exit. */

import { spawn } from 'node:child_process';

const args = [
  '--experimental-strip-types',
  '--test',
  /* The reporter is PINNED. Failure detection below reads TAP, and node only defaults to TAP
     because stdout here is a pipe — nothing guaranteed that. `NODE_OPTIONS=--test-reporter=dot`
     in a shell profile or a CI image re-arms the exact bug this wrapper exists to catch, and
     it does so invisibly. NODE_OPTIONS is cleared on the child for the same reason. */
  '--test-reporter=tap',
  /* `**` rather than `*`. `__tests__/helpers/` already establishes the subdirectory habit, and
     a suite placed one level down ran zero times and reported nothing. */
  ...(process.argv.slice(2).length ? process.argv.slice(2) : ['__tests__/**/*.test.mjs']),
];

const child = spawn(process.execPath, args, {
  shell: true,
  env: { ...process.env, NODE_OPTIONS: '' },
});

let buffered = '';
const watch = (chunk, out) => {
  buffered += chunk;
  out.write(chunk);
};

child.stdout.on('data', (d) => watch(d.toString(), process.stdout));
child.stderr.on('data', (d) => watch(d.toString(), process.stderr));

child.on('close', (code, signal) => {
  /* `not ok` at any depth. The summary counters are deliberately not trusted: the whole
     point is that they read zero while a suite has failed to collect. */
  const failures = buffered
    .split('\n')
    .filter((l) => /^\s*not ok \d+/.test(l))
    .map((l) => l.trim());

  /* A SIGNAL DEATH IS A FAILURE, AND IT USED TO EXIT 0.
     When a child is killed by a signal, `code` is null. The old guard was `if (code !== 0)
     process.exit(code)` — and `process.exit(null)` exits ZERO. So an OOM-killed or terminated
     run printed nothing, exited green, and CI recorded a pass for a suite that never
     finished. That is the same class of bug this file was written to eliminate, one layer
     further out. */
  if (signal) {
    process.stderr.write(
      `\n\x1b[31mThe test process was killed by ${signal}.\x1b[0m\n` +
      'The run did not finish, so nothing here was verified.\n'
    );
    process.exit(1);
  }

  /* `?? 1` rather than bare `code`, for the same reason: never hand a null to exit(). */
  if (code !== 0) process.exit(code ?? 1);

  /* A FLOOR ON THE COUNT, because there is a silent-pass shape stdout cannot reveal. If
     anything under test calls `process.exit(0)` mid-file, node reports the whole FILE as
     `ok` — there is no `not ok` line anywhere for the scan above to find, and a file's worth
     of assertions vanishes while the summary looks healthy. scripts/preflight.mjs calls
     process.exit and __tests__/preflight.test.mjs imports it; today that is safe only because
     of an `import.meta.url` guard, which is one refactor from not being there.
     The floor is deliberately well under the real count so it does not need editing on every
     commit — it is a tripwire for a collapse, not a target. */
  const counted = Number((buffered.match(/^# tests (\d+)$/m) ?? [])[1] ?? 0);
  const FLOOR = 900;
  if (counted < FLOOR) {
    process.stderr.write(
      `\n\x1b[31mOnly ${counted} tests ran, and this suite has well over ${FLOOR}.\x1b[0m\n` +
      'Something exited early or a whole file failed to load. Nothing here was verified.\n'
    );
    process.exit(1);
  }

  if (failures.length) {
    process.stderr.write(
      `\n\x1b[31mnode --test exited 0 while reporting ${failures.length} failure(s).\x1b[0m\n` +
      `This is the silent case: an exception thrown while a suite is being collected, so the\n` +
      `tests inside it never ran and the counters never noticed.\n\n` +
      failures.map((f) => `  ${f}`).join('\n') + '\n',
    );
    process.exit(1);
  }

  process.exit(0);
});
