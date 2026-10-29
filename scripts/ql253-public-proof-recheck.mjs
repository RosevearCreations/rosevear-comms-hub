#!/usr/bin/env node
/** Public GitHub-only opt-in; never calls six app gateways or local AI Hub. */
import { inspectQl249GithubOrigins } from './ql249-public-github-origin-retest.mjs';
import { ql250CurlPublic } from './ql250-public-curl-transport.mjs';
import { reconcileQl253SixAppOrigins } from './ql253-proof-origin-pin-registry-owner-test.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || args.length === 1 && args[0] !== '--public-get') {
  process.stderr.write('Usage: node scripts/ql253-public-proof-recheck.mjs [--public-get]\n');
  process.exitCode = 2;
} else {
  const observed = await inspectQl249GithubOrigins({
    getPublic: args.length ? ql250CurlPublic : undefined
  });
  const review = reconcileQl253SixAppOrigins(observed.rows);
  process.stdout.write(JSON.stringify({
    publicGithubOnly: args.length === 1,
    observedAtUtc: args.length ? new Date().toISOString() : null,
    ...review
  }, null, 2) + '\n');
}
