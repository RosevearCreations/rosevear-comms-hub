/**
 * QL-249 — deliberately PUBLIC GitHub GET-only source/proof provenance retest.
 * No third-party gateway calls, HMAC secrets, private household endpoints,
 * owner approval, scheduled network work, customer data or live dispatch.
 * A GitHub-origin self-signature is NOT an independently authenticated key.
 */
import { createHash, createPublicKey, verify } from 'node:crypto';
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';
import { QL248_FIELDS, QL248_NEGATIVES, ql248CanonicalProof, QL248_PATH }
  from './ql248-proof-commit-reconciliation.mjs';

export const QL249_RELEASE = 'ql249-six-app-immutable-github-origin-retest-owner-test-scheduling-held-v1';
const SHA = /^[0-9a-f]{40}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const SIG = /^[A-Za-z0-9_-]{86}$/;
const METHODS = '["GET"]';
const PATHS = '["/api/integration/v1/health","/api/integration/v1/capabilities"]';
const MAX_BODY = 65_536;
const MAX_PROOF = 16_384;
const same = (a, b) => JSON.stringify(a) === b;
const exact = (object, fields) => !!object && typeof object === 'object' &&
  !Array.isArray(object) && Object.getPrototypeOf(object) === Object.prototype &&
  Object.keys(object).length === fields.length &&
  Object.keys(object).every(field => fields.includes(field));
const sha256 = raw => createHash('sha256').update(raw, 'utf8').digest('hex');

/** Accept only exact, known public GitHub paths. No query, redirect or arbitrary URL. */
export function ql249PermittedPublicUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.username || u.password || u.port ||
      u.search || u.hash || u.origin !== `https://${u.host}`) return false;
    return QL247_SOURCES.some(s => {
      const slug = `RosevearCreations/${s.repository}`;
      if (u.host === 'api.github.com') return (
        u.pathname === `/repos/${slug}/commits/main` ||
        new RegExp(`^/repos/${slug}/commits/[0-9a-f]{40}$`).test(u.pathname) ||
        new RegExp(`^/repos/${slug}/compare/[0-9a-f]{40}\\.\\.\\.[0-9a-f]{40}$`).test(u.pathname) ||
        new RegExp(`^/repos/${slug}/actions/runs/[0-9]+$`).test(u.pathname)
      );
      return u.host === 'raw.githubusercontent.com' &&
        new RegExp(`^/${slug}/[0-9a-f]{40}/docs/integration/ql246-source-proof\\.json$`)
          .test(u.pathname);
    });
  } catch { return false; }
}

export async function ql249GetPublic(url, fetchImpl = fetch) {
  if (!ql249PermittedPublicUrl(url)) throw new Error('DENIED_PUBLIC_GITHUB_ORIGIN_OR_PATH');
  const response = await fetchImpl(url, {
    method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store',
    headers: { Accept: 'application/json', 'User-Agent': 'rosevear-comms-hub-ql249-source-provenance' },
    signal: AbortSignal.timeout(8_000)
  });
  if (response.status === 404) return { status: 404, body: null };
  if (response.status !== 200 ||
    !/^(?:application\/(?:json|vnd\.github\+json)|text\/plain)(?:;|$)/i
      .test(response.headers.get('content-type') || ''))
    throw new Error('DENIED_UNEXPECTED_HTTP_RESPONSE');
  if (Number(response.headers.get('content-length') || 0) > MAX_BODY ||
    !response.body || typeof response.body.getReader !== 'function')
    throw new Error('DENIED_OVERSIZED_OR_UNBOUNDED_RESPONSE');
  const reader = response.body.getReader();
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) throw new Error('DENIED_OVERSIZED_RESPONSE');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return { status: 200, body: new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)) };
}

export function ql249GithubUrls(source, proofSha, sourceSha, runId) {
  if (!QL247_SOURCES.some(x => x.system === source?.system && x.repository === source.repository) ||
    !SHA.test(proofSha) || !SHA.test(sourceSha) || proofSha === sourceSha ||
    !/^[0-9]+$/.test(String(runId))) throw new Error('DENIED_SOURCE_OR_REVISION_SCOPE');
  const repo = `RosevearCreations/${source.repository}`;
  return Object.freeze({
    sourceCommit: `https://api.github.com/repos/${repo}/commits/${sourceSha}`,
    proof: `https://raw.githubusercontent.com/${repo}/${proofSha}/${QL248_PATH}`,
    ancestry: `https://api.github.com/repos/${repo}/compare/${sourceSha}...${proofSha}`,
    ciRun: `https://api.github.com/repos/${repo}/actions/runs/${runId}`
  });
}

function parseSelfSignedPublicProof(raw, source, proofCommitSha, now) {
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > MAX_PROOF)
    return { status: 'DENIED_PUBLIC_PROOF_BYTES' };
  let envelope;
  try { envelope = JSON.parse(raw); } catch { return { status: 'DENIED_PUBLIC_PROOF_JSON' }; }
  if (!exact(envelope, ['publicKeyPem', 'payload', 'signature']) ||
    typeof envelope.publicKeyPem !== 'string' || envelope.publicKeyPem.length > 2048 ||
    typeof envelope.signature !== 'string' || !SIG.test(envelope.signature) ||
    !exact(envelope.payload, QL248_FIELDS)) return { status: 'DENIED_PUBLIC_PROOF_SCHEMA' };
  const p = envelope.payload;
  const businessId = source.system === 'ai-data-platform' ? 'devilndove' : source.system;
  if (p.schema_version !== 'rosevear.integration.v1' ||
    p.source_system !== source.system || p.repository !== `RosevearCreations/${source.repository}` ||
    !SHA.test(p.source_revision) || p.source_revision === proofCommitSha ||
    p.business_id !== businessId ||
    (source.system === 'yw' || source.system === 'icamp'
      ? typeof p.tenant_id !== 'string' || !ID.test(p.tenant_id)
      : p.tenant_id !== null) ||
    p.environment !== 'nonproduction' || !ID.test(p.challenge_id || '') ||
    !HEX64.test(p.challenge_sha256 || '') ||
    !same(p.allowed_methods, METHODS) || !same(p.allowed_paths, PATHS) ||
    !exact(p.negative_tests, QL248_NEGATIVES) ||
    !QL248_NEGATIVES.every(field => p.negative_tests[field] === true) ||
    !['gateway_audit_receipt_id', 'health_receipt_id', 'capabilities_receipt_id', 'registered_key_id']
      .every(field => p[field] === null || typeof p[field] === 'string' && ID.test(p[field])) ||
    p.owner_authorization !== 'NOT_GIVEN' || p.connection_state !== 'DISCONNECTED' ||
    p.external_gateway_get_verified !== false || p.durable_audit_verified !== false ||
    p.owner_identity_verified !== false ||
    !Number.isSafeInteger(p.issued_at) || !Number.isSafeInteger(p.expires_at) ||
    p.issued_at > now + 300_000 || p.expires_at <= now ||
    p.expires_at <= p.issued_at || p.expires_at - p.issued_at > 3_600_000)
    return { status: 'DENIED_PUBLIC_PROOF_SCOPE_OR_EXPIRY' };
  const match = new RegExp(`^https://github\\.com/RosevearCreations/${source.repository}/actions/runs/([0-9]+)$`)
    .exec(p.ci_run_url || '');
  if (!match) return { status: 'DENIED_SOURCE_CI_CLAIM' };
  try {
    const key = createPublicKey(envelope.publicKeyPem);
    if (key.asymmetricKeyType !== 'ed25519' ||
      !verify(null, ql248CanonicalProof(p), key, Buffer.from(envelope.signature, 'base64url')))
      return { status: 'DENIED_SELF_SIGNATURE' };
    return { status: 'PUBLIC_SELF_SIGNATURE_ONLY', sourceSha: p.source_revision,
      ciRunId: match[1], rawSha256: sha256(raw),
      presentedPublicSpkiSha256: createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('hex') };
  } catch { return { status: 'DENIED_SELF_SIGNATURE' }; }
}

const final = (rows, reason) => Object.freeze({
  release: QL249_RELEASE,
  status: rows.length === 6 && rows.every(r => r.status === 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD')
    ? 'SIX_PUBLIC_SOURCE_CI_ORIGINS_OBSERVED_INDEPENDENT_TRUST_AND_RUNTIME_HELD'
    : 'HOLD_SOURCE_PROOFS_OR_GITHUB_ORIGINS_INCOMPLETE',
  reason,
  rows: Object.freeze(rows),
  githubOriginAndCiObserved: rows.filter(r => r.status === 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD').length,
  independentTrustedSignerPins: 0, actualAuthenticatedGatewayGets: 0,
  witnessedSevenNegativeTestSuites: 0, verifiedDurableAudits: 0,
  ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
  testSlots: Object.freeze(QL247_SOURCES.map(s => Object.freeze({
    system: s.system, method: 'GET', scope: Object.freeze([
      '/api/integration/v1/health', '/api/integration/v1/capabilities'
    ]), status: 'NOT_SCHEDULED_OWNER_SCOPE_AND_TRUST_REQUIRED'
  }))),
  connectionState: 'DISCONNECTED', realPilotHolds: 12,
  writes: 0, calls: 0, sms: 0, dispatch: 0
});

/** Zero external requests unless caller provides an explicitly authorized public GET. */
export async function inspectQl249GithubOrigins({ getPublic, sources = QL247_SOURCES, now = Date.now() } = {}) {
  if (!Array.isArray(sources) || sources.length !== QL247_SOURCES.length ||
    !QL247_SOURCES.every((s, i) => sources[i]?.system === s.system && sources[i]?.repository === s.repository) ||
    !Number.isSafeInteger(now) || now <= 0)
    return final([], 'DENIED_SIX_APP_SOURCE_SCOPE');
  if (typeof getPublic !== 'function')
    return final(sources.map(s => ({ system: s.system, repository: s.repository,
      mainSha: null, status: 'NOT_FETCHED_NO_NETWORK_REQUESTED' })), 'No GitHub network request was authorized.');

  const rows = [];
  for (const s of sources) {
    let mainSha = null, sourceSha = null, proofRawSha256 = null;
    let status = 'HEAD_FETCH_FAILED';
    try {
      const repo = `RosevearCreations/${s.repository}`;
      const main = await getPublic(`https://api.github.com/repos/${repo}/commits/main`);
      if (main?.status !== 200) throw new Error('HEAD_MISSING');
      const mainInfo = JSON.parse(main.body);
      if (!SHA.test(mainInfo?.sha)) throw new Error('HEAD_SHA_INVALID');
      mainSha = mainInfo.sha;
      const proof = await getPublic(`https://raw.githubusercontent.com/${repo}/${mainSha}/${QL248_PATH}`);
      if (proof?.status === 404) status = 'MISSING_PUBLIC_PROOF_AT_MAIN';
      else if (proof?.status !== 200) status = 'PROOF_FETCH_FAILED';
      else {
        proofRawSha256 = sha256(proof.body);
        const parsed = parseSelfSignedPublicProof(proof.body, s, mainSha, now);
        status = parsed.status;
        sourceSha = parsed.sourceSha || null;
        if (status === 'PUBLIC_SELF_SIGNATURE_ONLY') {
          const urls = ql249GithubUrls(s, mainSha, sourceSha, parsed.ciRunId);
          const [sourceCommit, ancestry, ciRun] = await Promise.all([
            getPublic(urls.sourceCommit), getPublic(urls.ancestry), getPublic(urls.ciRun)
          ]);
          const sourceInfo = sourceCommit?.status === 200 ? JSON.parse(sourceCommit.body) : null;
          const ancestryInfo = ancestry?.status === 200 ? JSON.parse(ancestry.body) : null;
          const runInfo = ciRun?.status === 200 ? JSON.parse(ciRun.body) : null;
          if (sourceInfo?.sha !== sourceSha) status = 'SOURCE_COMMIT_NOT_VERIFIED';
          else if (ancestryInfo?.status !== 'ahead' || ancestryInfo?.merge_base_commit?.sha !== sourceSha ||
            !Number.isInteger(ancestryInfo?.ahead_by) || ancestryInfo.ahead_by < 1 ||
            ancestryInfo.behind_by !== 0) status = 'SOURCE_TO_PROOF_ANCESTRY_NOT_VERIFIED';
          else if (runInfo?.head_sha !== sourceSha || runInfo?.status !== 'completed' ||
            runInfo?.conclusion !== 'success' || runInfo?.repository?.full_name !== repo ||
            String(runInfo?.id) !== parsed.ciRunId)
            status = 'EXACT_SOURCE_CI_NOT_VERIFIED';
          else status = 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD';
        }
      }
    } catch {
      status = mainSha ? 'ORIGIN_PROVENANCE_FETCH_FAILED' : 'HEAD_FETCH_FAILED';
    }
    rows.push(Object.freeze({ system: s.system, repository: s.repository,
      mainSha, sourceSha, proofRawSha256, status }));
  }
  return final(rows, 'GitHub public origin/CI evidence is separate from independently authenticated signing-key custody, genuine gateway receipts, test authorization and owner pilot release.');
}
