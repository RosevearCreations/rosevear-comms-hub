#!/usr/bin/env node
/** QL250: public GitHub only on explicit --public-get; never a gateway client. */
import { inspectQl249GithubOrigins } from './ql249-public-github-origin-retest.mjs';
import { ql250CurlPublic } from './ql250-public-curl-transport.mjs';
import { ql250SummarizeSourceRefresh } from './ql250-pin-custody-window-witness.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || args.length === 1 && args[0] !== '--public-get') {
  process.stderr.write('Usage: node scripts/ql250-review-six-app-source.mjs [--public-get]\n');
  process.exitCode = 2;
} else {
  const report = await inspectQl249GithubOrigins({
    getPublic: args.length ? ql250CurlPublic : undefined
  });
  const source = ql250SummarizeSourceRefresh(report.rows.map(r => ({
    system: r.system, repository: r.repository, mainSha: r.mainSha,
    status: r.status
  })));
  process.stdout.write(JSON.stringify({ source, provenanceRelease: report.release,
    sourceStatus: report.status, ownerTestAuthorization: 'NOT_GIVEN',
    pilotAuthorization: 'NOT_GIVEN', liveGatewayGets: 0 }, null, 2) + '\n');
}
