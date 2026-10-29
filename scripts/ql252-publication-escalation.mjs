#!/usr/bin/env node
/** Public GitHub proof publication triage; no gateway or owner authorization. */
import { inspectQl249GithubOrigins } from './ql249-public-github-origin-retest.mjs';
import { ql250CurlPublic } from './ql250-public-curl-transport.mjs';
import { inspectQl252PublicationEscalation } from './ql252-proof-custody-owner-intake.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || args.length === 1 && args[0] !== '--public-get') {
  process.stderr.write('Usage: node scripts/ql252-publication-escalation.mjs [--public-get]\n');
  process.exitCode = 2;
} else {
  const observed = await inspectQl249GithubOrigins({
    getPublic: args.length ? ql250CurlPublic : undefined
  });
  const queue = inspectQl252PublicationEscalation(observed.rows);
  process.stdout.write(JSON.stringify({
    publicGitHubGetOnly: args.length === 1,
    inspectedAtUtc: args.length ? new Date().toISOString() : null,
    ...queue, ownerTestAuthorization: 'NOT_GIVEN',
    ownerPilotAuthorization: 'NOT_GIVEN', connectionState: 'DISCONNECTED',
    realGatewayGets: 0, scheduledGatewayGets: 0
  }, null, 2) + '\n');
}
