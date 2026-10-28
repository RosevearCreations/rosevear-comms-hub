import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { QL248_NEGATIVES, ql248CanonicalProof } from '../ql248-proof-commit-reconciliation.mjs';
import { ql249GetPublic, ql249PermittedPublicUrl, ql249GithubUrls,
  inspectQl249GithubOrigins } from '../ql249-public-github-origin-retest.mjs';

const NOW = Date.UTC(2026, 9, 28, 17, 0);
const hash = x => createHash('sha256').update(x).digest('hex');
const success = value => ({ status: 200, body: typeof value === 'string' ? value : JSON.stringify(value) });

function scenario() {
  const routes = new Map();
  const sources = QL247_SOURCES.map((source, i) => {
    const sourceSha = String(i + 1).repeat(40);
    const proofSha = String.fromCharCode(97 + i).repeat(40);
    const id = String(2400 + i);
    const repo = `RosevearCreations/${source.repository}`;
    const payload = {
      schema_version: 'rosevear.integration.v1', source_system: source.system,
      repository: repo, source_revision: sourceSha,
      challenge_id: `np-ql249-public-${i}`, challenge_sha256: hash(`challenge-${i}`),
      business_id: source.system === 'ai-data-platform' ? 'devilndove' : source.system,
      tenant_id: ['yw', 'icamp'].includes(source.system) ? `np-tenant-ql249-${i}` : null,
      environment: 'nonproduction',
      ci_run_url: `https://github.com/${repo}/actions/runs/${id}`,
      allowed_methods: ['GET'],
      allowed_paths: ['/api/integration/v1/health', '/api/integration/v1/capabilities'],
      negative_tests: Object.fromEntries(QL248_NEGATIVES.map(key => [key, true])),
      gateway_audit_receipt_id: null, health_receipt_id: null,
      capabilities_receipt_id: null, registered_key_id: null,
      owner_authorization: 'NOT_GIVEN', connection_state: 'DISCONNECTED',
      external_gateway_get_verified: false, durable_audit_verified: false,
      owner_identity_verified: false, issued_at: NOW - 1000, expires_at: NOW + 300_000
    };
    const key = generateKeyPairSync('ed25519');
    const signature = sign(null, ql248CanonicalProof(payload), key.privateKey).toString('base64url');
    const publicKeyPem = key.publicKey.export({ type: 'spki', format: 'pem' });
    const proofRaw = JSON.stringify({ publicKeyPem, payload, signature });
    const urls = ql249GithubUrls(source, proofSha, sourceSha, id);
    routes.set(`https://api.github.com/repos/${repo}/commits/main`, success({ sha: proofSha }));
    routes.set(urls.proof, success(proofRaw));
    routes.set(urls.sourceCommit, success({ sha: sourceSha }));
    routes.set(urls.ancestry, success({ status: 'ahead', ahead_by: 1, behind_by: 0,
      merge_base_commit: { sha: sourceSha } }));
    routes.set(urls.ciRun, success({ id: Number(id), head_sha: sourceSha,
      status: 'completed', conclusion: 'success', repository: { full_name: repo } }));
    return { source, sourceSha, proofSha, urls, payload, key, publicKeyPem, repo };
  });
  const calls = [];
  const getPublic = async url => { calls.push(url); return routes.get(url) || { status: 404, body: null }; };
  return { routes, sources, calls, getPublic };
}

test('QL249 default performs zero I/O and never schedules a real GET or grants owner consent', async () => {
  const result = await inspectQl249GithubOrigins();
  assert.equal(result.rows.length, 6);
  assert.equal(result.rows.every(r => r.status === 'NOT_FETCHED_NO_NETWORK_REQUESTED'), true);
  assert.equal(result.testSlots.length, 6);
  assert.equal(result.testSlots.every(s => s.status === 'NOT_SCHEDULED_OWNER_SCOPE_AND_TRUST_REQUIRED'), true);
  assert.equal(result.ownerTestAuthorization, 'NOT_GIVEN');
  assert.equal(result.ownerPilotAuthorization, 'NOT_GIVEN');
  assert.equal(result.connectionState, 'DISCONNECTED');
  assert.equal(result.realPilotHolds, 12);
  for (const key of ['writes', 'calls', 'sms', 'dispatch']) assert.equal(result[key], 0);
});

test('QL249 separately observes six source/CI origins but never pretends GitHub is a trusted signer pin', async () => {
  const s = scenario();
  const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, now: NOW });
  assert.equal(result.githubOriginAndCiObserved, 6);
  assert.equal(result.independentTrustedSignerPins, 0);
  assert.equal(result.actualAuthenticatedGatewayGets, 0);
  assert.equal(result.witnessedSevenNegativeTestSuites, 0);
  assert.equal(result.verifiedDurableAudits, 0);
  assert.equal(result.status, 'SIX_PUBLIC_SOURCE_CI_ORIGINS_OBSERVED_INDEPENDENT_TRUST_AND_RUNTIME_HELD');
  assert.equal(s.calls.length, 30);
  assert.ok(result.rows.every(r => /^[0-9a-f]{64}$/.test(r.proofRawSha256)));
  assert.ok(result.rows.every(r => r.sourceSha !== r.mainSha));
  assert.equal(JSON.stringify(result).includes('BEGIN PUBLIC KEY'), false);
});

test('QL249 reports missing public proofs as HOLD without querying source, ancestry or runtime', async () => {
  const s = scenario();
  for (const x of s.sources) s.routes.set(x.urls.proof, { status: 404, body: null });
  const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, now: NOW });
  assert.equal(s.calls.length, 12);
  assert.equal(result.githubOriginAndCiObserved, 0);
  assert.ok(result.rows.every(r => r.status === 'MISSING_PUBLIC_PROOF_AT_MAIN'));
});

test('QL249 denies a forged source ancestor even if the signed file and its CI claim look correct', async () => {
  const s = scenario(), row = s.sources[0];
  s.routes.set(row.urls.ancestry, success({ status: 'diverged', ahead_by: 1,
    behind_by: 3, merge_base_commit: { sha: '0'.repeat(40) } }));
  const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, now: NOW });
  assert.equal(result.rows[0].status, 'SOURCE_TO_PROOF_ANCESTRY_NOT_VERIFIED');
  assert.equal(result.githubOriginAndCiObserved, 5);
});

test('QL249 denies a successful CI belonging to a different source revision or repo', async () => {
  const s = scenario(), row = s.sources[1];
  s.routes.set(row.urls.ciRun, success({ id: 2401, head_sha: 'f'.repeat(40),
    status: 'completed', conclusion: 'success', repository: { full_name: row.repo } }));
  const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, now: NOW });
  assert.equal(result.rows[1].status, 'EXACT_SOURCE_CI_NOT_VERIFIED');
});

test('QL249 denies forged payload, expired proof, new permission or false owner authorization', async () => {
  const edits = [
    p => { p.owner_authorization = 'GIVEN'; },
    p => { p.allowed_methods = ['GET', 'POST']; },
    p => { p.tenant_id = 'np-foreign-tenant'; },
    p => { p.expires_at = NOW - 1; }
  ];
  for (const edit of edits) {
    const s = scenario(), row = s.sources[2];
    const proof = JSON.parse(s.routes.get(row.urls.proof).body);
    edit(proof.payload);
    s.routes.set(row.urls.proof, success(JSON.stringify(proof)));
    const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, now: NOW });
    assert.equal(result.rows[2].status, 'DENIED_PUBLIC_PROOF_SCOPE_OR_EXPIRY');
  }
});

test('QL249 rejects altered self-signature even though the public key is present', async () => {
  const s = scenario(), row = s.sources[3];
  const proof = JSON.parse(s.routes.get(row.urls.proof).body);
  proof.payload.challenge_sha256 = hash('tampered');
  s.routes.set(row.urls.proof, success(JSON.stringify(proof)));
  const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, now: NOW });
  assert.equal(result.rows[3].status, 'DENIED_SELF_SIGNATURE');
});

test('QL249 only fetches exact GitHub public origins, bounded GET, no credential forwarding or redirects', async () => {
  const row = QL247_SOURCES[0];
  const valid = `https://api.github.com/repos/RosevearCreations/${row.repository}/commits/main`;
  assert.equal(ql249PermittedPublicUrl(valid), true);
  for (const url of [
    'http://api.github.com/repos/RosevearCreations/ai-data-platform/commits/main',
    'https://api.github.com.evil.test/repos/RosevearCreations/ai-data-platform/commits/main',
    'https://api.github.com/repos/RosevearCreations/ai-data-platform/commits/main?token=secret',
    'https://api.github.com/repos/RosevearCreations/unknown/commits/main',
    'https://user:pass@api.github.com/repos/RosevearCreations/ai-data-platform/commits/main',
    'https://raw.githubusercontent.com/RosevearCreations/ai-data-platform/main/docs/integration/ql246-source-proof.json'
  ]) assert.equal(ql249PermittedPublicUrl(url), false);
  let opts;
  const response = await ql249GetPublic(valid, async (_url, options) => {
    opts = options;
    return new Response('{"sha":"' + '1'.repeat(40) + '"}',
      { status: 200, headers: { 'content-type': 'application/json' } });
  });
  assert.equal(response.status, 200);
  assert.equal(opts.method, 'GET');
  assert.equal(opts.credentials, 'omit');
  assert.equal(opts.redirect, 'error');
  assert.equal(opts.headers.Authorization, undefined);
  await assert.rejects(() => ql249GetPublic(valid, async () =>
    new Response('oversized', { status: 200,
      headers: { 'content-type': 'application/json', 'content-length': '999999' } })));
});

test('QL249 rejects six-source scope changes, not merely unknown URLs', async () => {
  const s = scenario();
  const forged = [...QL247_SOURCES].reverse();
  const result = await inspectQl249GithubOrigins({ getPublic: s.getPublic, sources: forged, now: NOW });
  assert.equal(result.rows.length, 0);
  assert.equal(result.githubOriginAndCiObserved, 0);
  assert.equal(s.calls.length, 0);
});
