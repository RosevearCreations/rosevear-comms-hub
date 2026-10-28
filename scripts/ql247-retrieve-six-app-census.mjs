#!/usr/bin/env node
/** Explicit nonproduction-safe, unauthenticated public GitHub census only. */
import { writeFile } from 'node:fs/promises';
import { inspectQl247GithubSources, ql247GetPublic } from './ql247-six-app-github-census.mjs';

const flags = process.argv.slice(2);
const usePublic = flags.includes('--public-get');
const outputIndex = flags.indexOf('--output');
const outputPath = outputIndex >= 0 ? flags[outputIndex + 1] : null;
if (flags.some((x, i) => !['--public-get', '--output'].includes(x) &&
    !(i > 0 && flags[i - 1] === '--output')) ||
  (outputIndex >= 0 && (!outputPath || outputPath.startsWith('--'))) ||
  flags.filter(x => x === '--output').length > 1 ||
  flags.filter(x => x === '--public-get').length > 1) {
  process.stderr.write('Usage: node scripts/ql247-retrieve-six-app-census.mjs [--public-get] [--output PRIVATE_REPORT.json]\n');
  process.exitCode = 2;
} else {
  const result = await inspectQl247GithubSources({
    getPublic: usePublic ? ql247GetPublic : undefined
  });
  const report = JSON.stringify(result, null, 2) + '\n';
  process.stdout.write(report);
  if (outputPath) {
    try { await writeFile(outputPath, report, { mode: 0o600, flag: 'wx' }); }
    catch { process.stderr.write('Unable to create private report (no overwrite performed).\n'); process.exitCode = 2; }
  }
  if (result.status === 'DENIED_REPOSITORY_SCOPE') process.exitCode = 2;
}
