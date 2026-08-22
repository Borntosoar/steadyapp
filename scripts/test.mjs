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
  ...(process.argv.slice(2).length ? process.argv.slice(2) : ['__tests__/*.test.mjs']),
];

const child = spawn(process.execPath, args, { shell: true });

let buffered = '';
const watch = (chunk, out) => {
  buffered += chunk;
  out.write(chunk);
};

child.stdout.on('data', (d) => watch(d.toString(), process.stdout));
child.stderr.on('data', (d) => watch(d.toString(), process.stderr));

child.on('close', (code) => {
  /* `not ok` at any depth. The summary counters are deliberately not trusted: the whole
     point is that they read zero while a suite has failed to collect. */
  const failures = buffered
    .split('\n')
    .filter((l) => /^\s*not ok \d+/.test(l))
    .map((l) => l.trim());

  if (code !== 0) process.exit(code);

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
