import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QL247_RELEASE, QL247_SOURCES, ql247GetPublic,
  ql247SourceUrls, inspectQl247GithubSources } from '../ql247-six-app-github-census.mjs';

const sha = 'a'.repeat(40);
const mainUrl = repo => `https://api.github.com/repos/RosevearCreations/${repo}/commits/main`;
const proofUrl = repo => `https://raw.githubusercontent.com/RosevearCreations/${repo}/${sha}/docs/integration/ql246-source-proof.json`;
function mock({ proofStatus = 404, raw = null, wrongHead = false } = {}) {
  const urls = [];
  return {
    urls,
    getPublic: async url => {
      urls.push(url);
      if (url.startsWith('https://api.github.com/'))
        return { status: 200, body: JSON.stringify({ sha: wrongHead ? 'main' : sha }) };
      if (proofStatus === 404) return { status: 404, body: null };
      return { status: proofStatus, body: raw };
    }
  };
}
function source(system, repo) {
  return JSON.stringify({
    publicKeyPem: 'PUBLIC PEM PLACEHOLDER: untrusted raw bytes',
    signature: 'A'.repeat(86),
    payload: {
      schema_version: 'rosevear.integration.v1', source_system: system,
      repository: `RosevearCreations/${repo}`, source_revision: sha,
      environment: 'nonproduction', owner_authorization: 'NOT_GIVEN',
      connection_state: 'DISCONNECTED', external_gateway_get_verified: false,
      durable_audit_verified: false, owner_identity_verified: false,
      allowed_methods: ['GET'], allowed_paths: ['/api/integration/v1/health', '/api/integration/v1/capabilities'],
      tenant_id: system === 'icamp' || system === 'yw' ? `np-${system}-tenant-001` : null,
      business_id: system === 'ai-data-platform' ? 'devilndove' : system,
      challenge_sha256: 'b'.repeat(64)
    }
  });
}
const report = getPublic => inspectQl247GithubSources({ getPublic });

describe('QL-247 six independent GitHub accounts and source-proof preconditions', () => {
  it('does not fetch any source without an explicit operator-selected public GET', async () => {
    const r = await inspectQl247GithubSources();
    assert.equal(r.release, QL247_RELEASE);
    assert.equal(r.status, 'HOLD_EXTERNAL_FETCH_NOT_REQUESTED');
    assert.equal(r.sources.length, 6);
    assert.equal(r.githubMainCheckedCount, 0);
    assert.equal(r.ownerAuthorization, 'NOT_GIVEN');
    assert.equal(r.connectionState, 'DISCONNECTED');
    assert.equal(r.realPilotHolds, 12);
    assert.equal(r.writes + r.calls + r.sms + r.dispatch, 0);
  });
  it('maps six exact real owner repositories and immutably pins a source-proof path', async () => {
    assert.deepEqual(QL247_SOURCES.map(x => x.repository),
      ['ai-data-platform', 'devilndove-site', 'rosiedazzlers', 'yw', 'iCamp', 'rosevear-ai-hub']);
    for (const r of QL247_SOURCES) {
      const u = ql247SourceUrls(r, sha);
      assert.equal(u.main, mainUrl(r.repository));
      assert.equal(u.proof, proofUrl(r.repository));
    }
    assert.throws(() => ql247SourceUrls({ system: 'icamp', repository: 'devilndove-site' }, sha));
    assert.throws(() => ql247SourceUrls(QL247_SOURCES[0], 'main'));
    const r = await inspectQl247GithubSources({ sources: QL247_SOURCES.slice(1) });
    assert.equal(r.status, 'DENIED_REPOSITORY_SCOPE');
  });
  it('reports real missing proof as HOLD without claiming cryptographic validation', async () => {
    const m = mock(), r = await report(m.getPublic);
    assert.equal(m.urls.length, 12);
    assert.equal(r.githubMainCheckedCount, 6);
    assert.equal(r.publishedUnverifiedProofCount, 0);
    assert.equal(r.status, 'HOLD_SIX_APP_SOURCE_EVIDENCE_INCOMPLETE');
    assert(r.sources.every(x => x.publicProof === 'MISSING_AT_PINNED_SHA'));
    assert.equal(r.independentlyPinnedSignatureCount, 0);
    assert.equal(r.independentlyWitnessedGatewayGetCount, 0);
    assert.equal(r.pilotRelease, false);
  });
  it('even six published source claims must remain UNVERIFIED, disconnected and unapproved', async () => {
    const r = await report(async url => {
      if (url.startsWith('https://api.github.com/')) return { status: 200, body: JSON.stringify({ sha }) };
      const repo = QL247_SOURCES.find(x => url.includes(`/${x.repository}/`));
      return { status: 200, body: source(repo.system, repo.repository) };
    });
    assert.equal(r.status, 'SIX_PUBLIC_PROOFS_PRESENT_TRUSTED_PINS_AND_REAL_GATEWAY_TESTS_PENDING_HELD');
    assert.equal(r.publishedUnverifiedProofCount, 6);
    assert.equal(r.independentlyPinnedSignatureCount, 0);
    assert.equal(r.distinctCredentialExchangeVerifiedCount, 0);
    assert.equal(r.ownerIdentityIndependentlyConfirmed, false);
    assert.equal(r.pilotRelease, false);
    assert.equal(r.realPilotHolds, 12);
  });
  it('source claims of owner approval, wrong tenant and wrong business never pass even schema census', async () => {
    for (const tweak of [
      p => p.owner_authorization = 'APPROVED',
      p => p.connection_state = 'CONNECTED',
      p => p.allowed_methods = ['POST'],
      p => p.tenant_id = 'np-wrong-tenant-001',
      p => p.business_id = 'icamp'
    ]) {
      const m = mock({ proofStatus: 200 });
      const r = await report(async url => {
        if (url.startsWith('https://api.github.com/')) return { status: 200, body: JSON.stringify({ sha }) };
        const repo = QL247_SOURCES.find(x => url.includes(`/${x.repository}/`));
        const s = JSON.parse(source(repo.system, repo.repository));
        if (repo.system === 'devilndove') tweak(s.payload);
        return { status: 200, body: JSON.stringify(s) };
      });
      assert.equal(r.sources[1].publicProof, 'DENIED_PUBLIC_PROOF_SCHEMA');
      assert.equal(r.status, 'HOLD_SIX_APP_SOURCE_EVIDENCE_INCOMPLETE');
      assert.equal(r.pilotRelease, false);
      assert.equal(m.urls.length, 0);
    }
  });
  it('bad head SHA or GET failure does not manufacture source revision or receipts', async () => {
    const m = mock({ wrongHead: true });
    const r = await report(m.getPublic);
    assert.equal(m.urls.length, 6);
    assert.equal(r.githubMainCheckedCount, 0);
    assert(r.sources.every(x => x.publicProof === 'HEAD_FETCH_FAILED'));
  });
  it('public HTTP GET rejects SSRF, ref traversal, credentials, redirects and oversized bodies', async () => {
    let touched = false;
    for (const url of [
      'https://127.0.0.1/api', 'https://raw.githubusercontent.com/Other/yw/' + sha + '/docs/integration/ql246-source-proof.json',
      `https://raw.githubusercontent.com/RosevearCreations/yw/main/docs/integration/ql246-source-proof.json`,
      mainUrl('yw') + '?token=fake', 'http://api.github.com/repos/RosevearCreations/yw/commits/main'
    ]) {
      await assert.rejects(() => ql247GetPublic(url, async () => { touched = true; }), /DENIED_PUBLIC_ORIGIN_OR_PATH/);
    }
    assert.equal(touched, false);
    const bad = async status => ({ status, headers: new Headers({ 'content-type': 'application/json' }) });
    await assert.rejects(() => ql247GetPublic(mainUrl('yw'), () => bad(302)), /DENIED_UNEXPECTED_RESPONSE/);
    await assert.rejects(() => ql247GetPublic(mainUrl('yw'), async () => ({
      status: 200, headers: new Headers({ 'content-type': 'application/json', 'content-length': '9999999' })
    })), /DENIED_OVERSIZED_PUBLIC_PROOF/);
    const body = await ql247GetPublic(mainUrl('yw'), async (_, options) => {
      assert.equal(options.method, 'GET');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.redirect, 'error');
      return { status: 200, headers: new Headers({ 'content-type': 'application/json' }),
        body: new ReadableStream({ start(controller) {
          controller.enqueue(Buffer.from('{"sha":"' + sha + '"}')); controller.close();
        } }) };
    });
    assert.equal(body.status, 200);
    assert.equal(JSON.parse(body.body).sha, sha);
  });
});
