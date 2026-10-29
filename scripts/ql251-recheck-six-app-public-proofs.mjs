#!/usr/bin/env node
/** QL251: opt-in public GitHub GET only, no gateway, real owner authorization or scheduling. */
import { inspectQl249GithubOrigins } from './ql249-public-github-origin-retest.mjs';
import { ql250CurlPublic } from './ql250-public-curl-transport.mjs';
import { QL251_RELEASE } from './ql251-witness-return-test-authorization.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || args.length === 1 && args[0] !== '--public-get') {
  process.stderr.write('Usage: node scripts/ql251-recheck-six-app-public-proofs.mjs [--public-get]\n');
  process.exitCode = 2;
} else {
  const observed = await inspectQl249GithubOrigins({
    getPublic: args.length ? ql250CurlPublic : undefined
  });
  process.stdout.write(JSON.stringify({
    release: QL251_RELEASE, publicGitHubRequestsExplicitlyEnabled: args.length === 1,
    sourceProofStatus: observed.status, sourceRows: observed.rows,
    sourceCiMatchedFromSignedProof: observed.githubOriginAndCiObserved,
    independentlyAuthenticatedCustodyWitnesses: 0,
    authenticatedOwnerTestDecisions: 0, ownerTestAuthorization: 'NOT_GIVEN',
    ownerPilotAuthorization: 'NOT_GIVEN', scheduledGatewayGets: 0,
    realGatewayGets: 0, connectionState: 'DISCONNECTED', realPilotHolds: 12,
    writes: 0, calls: 0, sms: 0, dispatch: 0
  }, null, 2) + '\n');
}
