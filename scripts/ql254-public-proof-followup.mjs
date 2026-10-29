#!/usr/bin/env node
/** Optional allowlisted public GitHub GET only. No real gateway or private LAN. */
import { inspectQl249GithubOrigins } from './ql249-public-github-origin-retest.mjs';
import { ql250CurlPublic } from './ql250-public-curl-transport.mjs';
import { inspectQl254SixAppFollowup } from './ql254-proof-followup-witness-relay.mjs';
const args = process.argv.slice(2);
if (args.length > 1 || args.length === 1 && args[0] !== '--public-get') {
  process.stderr.write('Usage: node scripts/ql254-public-proof-followup.mjs [--public-get]\n');
  process.exitCode = 2;
} else {
  const checked = await inspectQl249GithubOrigins({ getPublic: args.length ? ql250CurlPublic : undefined });
  const followup = inspectQl254SixAppFollowup(checked.rows);
  process.stdout.write(JSON.stringify({ publicGithubOnly: args.length === 1,
    observedAtUtc: args.length ? new Date().toISOString() : null, ...followup }, null, 2) + '\n');
}
