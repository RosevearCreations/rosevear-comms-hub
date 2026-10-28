#!/usr/bin/env node
/** QL249 source-only GitHub PUBLIC GETs; never a gateway test or scheduler. */
import { writeFile } from 'node:fs/promises';
import { inspectQl249GithubOrigins, ql249GetPublic } from './ql249-public-github-origin-retest.mjs';

const args = process.argv.slice(2);
const enabled = args[0] === '--public-get';
const outputIndex = args.indexOf('--output');
const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : null;
const valid = args.length === 0 || (enabled &&
  (args.length === 1 || args.length === 3 && outputIndex === 1 && outputFile &&
    !outputFile.startsWith('-')));
if (!valid) {
  process.stderr.write('Usage: node scripts/ql249-retest-six-app-public-github.mjs [--public-get [--output ./private-ql249-origin-report.json]]\n');
  process.stderr.write('Default makes zero network calls. --public-get only checks six PUBLIC GitHub source/proof/CI paths. No credentials, gateway calls or pilot release.\n');
  process.exitCode = 2;
} else {
  const result = await inspectQl249GithubOrigins({ getPublic: enabled ? ql249GetPublic : undefined });
  const json = JSON.stringify(result, null, 2) + '\n';
  process.stdout.write(json);
  if (outputFile) {
    try { await writeFile(outputFile, json, { mode: 0o600, flag: 'wx' }); }
    catch {
      process.stderr.write('Could not create a new private report; existing files are never overwritten.\n');
      process.exitCode = 2;
    }
  }
}
