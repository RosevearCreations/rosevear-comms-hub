/**
 * QL-247 independent PUBLIC GitHub source census. No HMAC, gateway GET, owner
 * identity, production operation, or connection is permitted by this module.
 * Even a published signed-looking proof is UNVERIFIED without an out-of-band pin.
 */
import { createHash } from 'node:crypto';

export const QL247_RELEASE = 'ql247-six-app-github-source-census-owner-safe-connection-preconditions-held-v1';
export const QL247_SOURCES = Object.freeze([
  Object.freeze({ system: 'ai-data-platform', repository: 'ai-data-platform' }),
  Object.freeze({ system: 'devilndove', repository: 'devilndove-site' }),
  Object.freeze({ system: 'rosiedazzlers', repository: 'rosiedazzlers' }),
  Object.freeze({ system: 'yw', repository: 'yw' }),
  Object.freeze({ system: 'icamp', repository: 'iCamp' }),
  Object.freeze({ system: 'rosevear-ai-hub', repository: 'rosevear-ai-hub' })
]);
export const QL247_PATH = 'docs/integration/ql246-source-proof.json';
const SHA = /^[0-9a-f]{40}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const HEX = /^[0-9a-f]{64}$/;
const MAX_BYTES = 16_384;

export function ql247SourceUrls(row, sha) {
  if (!QL247_SOURCES.some(r => r.system === row?.system && r.repository === row.repository) ||
    !SHA.test(sha)) throw new TypeError('Unknown source, unpinned revision, or unsafe repository.');
  return Object.freeze({
    main: `https://api.github.com/repos/RosevearCreations/${row.repository}/commits/main`,
    proof: `https://raw.githubusercontent.com/RosevearCreations/${row.repository}/${sha}/${QL247_PATH}`
  });
}

function allowed(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.port || parsed.search || parsed.hash) return false;
    return QL247_SOURCES.some(row =>
      url === `https://api.github.com/repos/RosevearCreations/${row.repository}/commits/main` ||
      (parsed.host === 'raw.githubusercontent.com' &&
        new RegExp(`^/RosevearCreations/${row.repository}/[0-9a-f]{40}/docs/integration/ql246-source-proof\\.json$`)
          .test(parsed.pathname) &&
        parsed.pathname === new URL(url).pathname));
  } catch { return false; }
}

/** Only allow unauthenticated, non-redirected, bounded GETs to our six known public paths. */
export async function ql247GetPublic(url, fetchImpl = fetch) {
  if (!allowed(url)) throw new Error('DENIED_PUBLIC_ORIGIN_OR_PATH');
  const response = await fetchImpl(url, {
    method: 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store',
    headers: { Accept: 'application/json', 'User-Agent': 'rosevear-comms-hub-ql247-public-census' },
    signal: AbortSignal.timeout(8_000)
  });
  if (response.status === 404) return { status: 404, body: null };
  if (response.status !== 200 || !/^(?:application\/json|text\/plain)(?:;|$)/i.test(response.headers.get('content-type') || ''))
    throw new Error('DENIED_UNEXPECTED_RESPONSE');
  if (Number(response.headers.get('content-length') || 0) > MAX_BYTES)
    throw new Error('DENIED_OVERSIZED_PUBLIC_PROOF');
  if (!response.body || typeof response.body.getReader !== 'function')
    throw new Error('DENIED_UNBOUNDED_RESPONSE');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('DENIED_OVERSIZED_PUBLIC_PROOF');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return { status: 200, body: new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)) };
}

function publicProofShape(raw, row, sha) {
  try {
    const v = JSON.parse(raw);
    const payload = v?.payload;
    return Object.keys(v).sort().join(',') === 'payload,publicKeyPem,signature' &&
      typeof v.publicKeyPem === 'string' && v.publicKeyPem.length <= 2048 &&
      typeof v.signature === 'string' && /^[A-Za-z0-9_-]{86}$/.test(v.signature) &&
      payload && typeof payload === 'object' && !Array.isArray(payload) &&
      payload.schema_version === 'rosevear.integration.v1' &&
      payload.source_system === row.system &&
      payload.repository === `RosevearCreations/${row.repository}` &&
      payload.source_revision === sha &&
      payload.environment === 'nonproduction' &&
      payload.owner_authorization === 'NOT_GIVEN' &&
      payload.connection_state === 'DISCONNECTED' &&
      payload.external_gateway_get_verified === false &&
      payload.durable_audit_verified === false &&
      payload.owner_identity_verified === false &&
      Array.isArray(payload.allowed_methods) &&
      JSON.stringify(payload.allowed_methods) === JSON.stringify(['GET']) &&
      JSON.stringify(payload.allowed_paths) === JSON.stringify([
        '/api/integration/v1/health', '/api/integration/v1/capabilities'
      ]) &&
      (row.system === 'yw' || row.system === 'icamp'
        ? typeof payload.tenant_id === 'string' && ID.test(payload.tenant_id)
        : payload.tenant_id === null) &&
      payload.business_id === (row.system === 'ai-data-platform' ? 'devilndove' : row.system) &&
      HEX.test(payload.challenge_sha256);
  } catch { return false; }
}

function verdict(rows, status) {
  return Object.freeze({
    release: QL247_RELEASE, status,
    sources: rows,
    githubMainCheckedCount: rows.filter(x => SHA.test(x.sourceRevision || '')).length,
    publishedUnverifiedProofCount: rows.filter(x => x.publicProof === 'PUBLISHED_UNVERIFIED').length,
    independentlyPinnedSignatureCount: 0,
    independentlyWitnessedGatewayGetCount: 0,
    distinctCredentialExchangeVerifiedCount: 0,
    independentAuditRestartVerifiedCount: 0,
    ownerIdentityIndependentlyConfirmed: false,
    ownerAuthorization: 'NOT_GIVEN', pilotRelease: false, connectionState: 'DISCONNECTED',
    fourCompanyConnections: Object.freeze({ devilndove: 'DISCONNECTED', rosiedazzlers: 'DISCONNECTED',
      yw: 'DISCONNECTED', icamp: 'DISCONNECTED' }),
    realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0,
    reason: 'GitHub-account access is not cross-app authentication. Public metadata cannot establish tenant-key custody, original gateway receipts, durable audits or owner pilot authorization.'
  });
}

/**
 * Independently fetch six repository HEADs and their immutable public proof files.
 * Caller must explicitly provide a fetch function; default is zero I/O.
 */
export async function inspectQl247GithubSources({ getPublic, sources = QL247_SOURCES } = {}) {
  if (!Array.isArray(sources) || sources.length !== QL247_SOURCES.length ||
    !QL247_SOURCES.every((known, i) => sources[i]?.system === known.system &&
      sources[i]?.repository === known.repository))
    return verdict([], 'DENIED_REPOSITORY_SCOPE');
  if (typeof getPublic !== 'function')
    return verdict(sources.map(row => ({ ...row, sourceRevision: null,
      publicProof: 'NOT_FETCHED' })), 'HOLD_EXTERNAL_FETCH_NOT_REQUESTED');

  const rows = [];
  for (const row of sources) {
    let sha = null, publicProof = 'UNVERIFIED_REPOSITORY', proofSha256 = null;
    try {
      const main = await getPublic(`https://api.github.com/repos/RosevearCreations/${row.repository}/commits/main`);
      if (main?.status !== 200 || typeof main.body !== 'string') throw new Error('HEAD_NOT_OBSERVED');
      const mainPayload = JSON.parse(main.body);
      if (!SHA.test(mainPayload?.sha)) throw new Error('HEAD_SHA_INVALID');
      sha = mainPayload.sha;
      const url = ql247SourceUrls(row, sha).proof;
      const proof = await getPublic(url);
      if (proof?.status === 404) publicProof = 'MISSING_AT_PINNED_SHA';
      else if (proof?.status === 200 && typeof proof.body === 'string' &&
        Buffer.byteLength(proof.body, 'utf8') <= MAX_BYTES) {
        proofSha256 = createHash('sha256').update(proof.body, 'utf8').digest('hex');
        publicProof = publicProofShape(proof.body, row, sha)
          ? 'PUBLISHED_UNVERIFIED' : 'DENIED_PUBLIC_PROOF_SCHEMA';
      } else publicProof = 'PROOF_FETCH_FAILED';
    } catch { publicProof = sha ? 'PROOF_FETCH_FAILED' : 'HEAD_FETCH_FAILED'; }
    rows.push(Object.freeze({ system: row.system, repository: row.repository,
      sourceRevision: sha, publicProof, proofSha256 }));
  }
  return verdict(rows, rows.every(x => x.publicProof === 'PUBLISHED_UNVERIFIED')
    ? 'SIX_PUBLIC_PROOFS_PRESENT_TRUSTED_PINS_AND_REAL_GATEWAY_TESTS_PENDING_HELD'
    : 'HOLD_SIX_APP_SOURCE_EVIDENCE_INCOMPLETE');
}
