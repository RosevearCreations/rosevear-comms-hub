/**
 * QL-248: strictly OFFLINE, PUBLIC-METADATA-ONLY signature reconciliation.
 * A source revision and a later proof-bearing commit MUST be distinct: putting
 * the current commit's SHA inside a file in that same commit is self-referential.
 * This verifier cannot establish GitHub provenance, key custody, independently
 * observed negative tests, owner consent, or any runtime connection.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';

export const QL248_RELEASE = 'ql248-proof-commit-independent-pin-offline-reconciliation-held-v1';
export const QL248_PATH = 'docs/integration/ql246-source-proof.json';
export const QL248_FIELDS = Object.freeze([
  'schema_version', 'source_system', 'repository', 'source_revision',
  'challenge_id', 'challenge_sha256', 'business_id', 'tenant_id',
  'environment', 'ci_run_url', 'allowed_methods', 'allowed_paths',
  'negative_tests', 'gateway_audit_receipt_id', 'health_receipt_id',
  'capabilities_receipt_id', 'registered_key_id', 'owner_authorization',
  'connection_state', 'external_gateway_get_verified', 'durable_audit_verified',
  'owner_identity_verified', 'issued_at', 'expires_at'
]);
export const QL248_NEGATIVES = Object.freeze([
  'nonce_replay_denied', 'stale_request_denied', 'cross_business_denied',
  'cross_tenant_denied', 'revoked_key_denied', 'write_denied', 'dispatch_denied'
]);
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/;
const MAX_PROOF_BYTES = 16_384;
const PATHS = ['/api/integration/v1/health', '/api/integration/v1/capabilities'];
const INPUT_KEYS = ['schemaVersion', 'sources'];
const INPUT_ROW_KEYS = ['system', 'sourceRevisionSha', 'proofCommitSha', 'rawProofBase64'];
const TRUST_KEYS = ['schemaVersion', 'sources'];
const TRUST_ROW_KEYS = ['system', 'sourceRevisionSha', 'proofCommitSha', 'proofSha256',
  'ciRunUrl', 'publicKeySpkiSha256', 'businessId', 'tenantId'];

const exact = (value, fields) => value && typeof value === 'object' &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype &&
  Object.keys(value).length === fields.length &&
  Object.keys(value).every(field => fields.includes(field));
const equalHash = (a, b) => DIGEST.test(a || '') && DIGEST.test(b || '') &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const held = (status, rows, reason) => Object.freeze({
  release: QL248_RELEASE, status, reason, sources: Object.freeze(rows),
  offlineSignaturesMatched: rows.filter(row => row.status === 'OFFLINE_SIGNATURE_MATCHED_CLAIMS_UNVERIFIED').length,
  independentlyRetrievedGitHubProofs: 0, independentlyAuthenticatedPins: 0,
  independentlyWitnessedGatewayGets: 0, independentlyVerifiedNegativeTests: 0,
  ownerAuthorization: 'NOT_GIVEN', connectionState: 'DISCONNECTED',
  realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0
});

export function ql248CanonicalProof(payload) {
  if (!exact(payload, QL248_FIELDS)) throw new TypeError('DENIED_PAYLOAD_FIELDS');
  return Buffer.from(QL248_FIELDS.map(field => JSON.stringify([field, payload[field]])).join('\n'), 'utf8');
}

function checkSource(row, pin, expected, now) {
  if (!exact(row, INPUT_ROW_KEYS) || !exact(pin, TRUST_ROW_KEYS) ||
    row.system !== expected.system || pin.system !== expected.system ||
    !SHA.test(row.sourceRevisionSha) || !SHA.test(row.proofCommitSha) ||
    row.sourceRevisionSha === row.proofCommitSha ||
    row.sourceRevisionSha !== pin.sourceRevisionSha ||
    row.proofCommitSha !== pin.proofCommitSha ||
    !DIGEST.test(pin.proofSha256) || !DIGEST.test(pin.publicKeySpkiSha256) ||
    pin.businessId !== (expected.system === 'ai-data-platform' ? 'devilndove' : expected.system) ||
    (expected.system === 'yw' || expected.system === 'icamp'
      ? typeof pin.tenantId !== 'string' || !ID.test(pin.tenantId)
      : pin.tenantId !== null) ||
    typeof pin.ciRunUrl !== 'string' ||
    !new RegExp(`^https://github\\.com/RosevearCreations/${expected.repository}/actions/runs/[0-9]+$`).test(pin.ciRunUrl))
    return 'DENIED_REVISION_OR_TENANT_PIN';

  if (typeof row.rawProofBase64 !== 'string' || row.rawProofBase64.length > 22_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(row.rawProofBase64)) return 'DENIED_PROOF_BYTES';
  const bytes = Buffer.from(row.rawProofBase64, 'base64');
  if (bytes.length < 64 || bytes.length > MAX_PROOF_BYTES ||
    bytes.toString('base64') !== row.rawProofBase64 ||
    !equalHash(digest(bytes), pin.proofSha256)) return 'DENIED_PROOF_BYTES';

  let envelope;
  try { envelope = JSON.parse(new TextDecoder('utf8', { fatal: true }).decode(bytes)); }
  catch { return 'DENIED_PROOF_JSON'; }
  if (!exact(envelope, ['payload', 'publicKeyPem', 'signature']) ||
    typeof envelope.publicKeyPem !== 'string' || envelope.publicKeyPem.length > 2048 ||
    typeof envelope.signature !== 'string' || !SIGNATURE.test(envelope.signature) ||
    !exact(envelope.payload, QL248_FIELDS)) return 'DENIED_PROOF_SCHEMA';

  const p = envelope.payload;
  if (p.schema_version !== 'rosevear.integration.v1' ||
    p.source_system !== expected.system ||
    p.repository !== `RosevearCreations/${expected.repository}` ||
    p.source_revision !== row.sourceRevisionSha ||
    p.business_id !== pin.businessId || p.tenant_id !== pin.tenantId ||
    p.ci_run_url !== pin.ciRunUrl || p.environment !== 'nonproduction' ||
    !ID.test(p.challenge_id || '') || !DIGEST.test(p.challenge_sha256 || '') ||
    JSON.stringify(p.allowed_methods) !== '["GET"]' ||
    JSON.stringify(p.allowed_paths) !== JSON.stringify(PATHS) ||
    !exact(p.negative_tests, QL248_NEGATIVES) ||
    !QL248_NEGATIVES.every(test => p.negative_tests[test] === true) ||
    !['gateway_audit_receipt_id', 'health_receipt_id', 'capabilities_receipt_id', 'registered_key_id']
      .every(field => p[field] === null || typeof p[field] === 'string' && ID.test(p[field])) ||
    p.owner_authorization !== 'NOT_GIVEN' || p.connection_state !== 'DISCONNECTED' ||
    p.external_gateway_get_verified !== false || p.durable_audit_verified !== false ||
    p.owner_identity_verified !== false ||
    !Number.isSafeInteger(p.issued_at) || !Number.isSafeInteger(p.expires_at) ||
    p.issued_at > now + 300_000 || p.expires_at <= now ||
    p.expires_at <= p.issued_at || p.expires_at - p.issued_at > 3_600_000)
    return 'DENIED_SIGNED_SCOPE_OR_EXPIRY';

  try {
    const key = createPublicKey(envelope.publicKeyPem);
    if (key.asymmetricKeyType !== 'ed25519' ||
      !equalHash(digest(key.export({ type: 'spki', format: 'der' })), pin.publicKeySpkiSha256) ||
      !verify(null, ql248CanonicalProof(p), key, Buffer.from(envelope.signature, 'base64url')))
      return 'DENIED_SIGNATURE_OR_KEY_PIN';
  } catch { return 'DENIED_SIGNATURE_OR_KEY_PIN'; }
  return 'OFFLINE_SIGNATURE_MATCHED_CLAIMS_UNVERIFIED';
}

/** No network/FS access, no keys provisioned, no owner-pilot release. */
export function inspectQl248Bundle(bundle, trustedPins, now = Date.now()) {
  if (!exact(bundle, INPUT_KEYS) || bundle.schemaVersion !== 'rosevear.ql248.bundle.v1' ||
    !exact(trustedPins, TRUST_KEYS) || trustedPins.schemaVersion !== 'rosevear.ql248.pins.v1' ||
    !Array.isArray(bundle.sources) || !Array.isArray(trustedPins.sources) ||
    bundle.sources.length !== 6 || trustedPins.sources.length !== 6 ||
    !Number.isSafeInteger(now) || now <= 0)
    return held('DENIED_BUNDLE', [], 'Exactly six ordered source proofs and six separately acquired public pin records are required.');
  const rows = [], usedPins = new Set();
  for (let i = 0; i < QL247_SOURCES.length; i++) {
    const source = QL247_SOURCES[i], record = bundle.sources[i], trust = trustedPins.sources[i];
    let status = checkSource(record, trust, source, now);
    if (status === 'OFFLINE_SIGNATURE_MATCHED_CLAIMS_UNVERIFIED') {
      if (usedPins.has(trust.publicKeySpkiSha256))
        status = 'DENIED_CROSS_APP_SIGNER_REUSE';
      else usedPins.add(trust.publicKeySpkiSha256);
    }
    rows.push(Object.freeze({ system: source.system, repository: source.repository,
      sourceRevisionSha: SHA.test(record?.sourceRevisionSha || '') ? record.sourceRevisionSha : null,
      proofCommitSha: SHA.test(record?.proofCommitSha || '') ? record.proofCommitSha : null,
      status }));
  }
  const complete = rows.every(row => row.status === 'OFFLINE_SIGNATURE_MATCHED_CLAIMS_UNVERIFIED');
  return held(complete ? 'SIX_OFFLINE_SIGNATURES_MATCHED_REAL_GATEWAY_PROOF_PENDING_HELD' :
    'HOLD_UNVERIFIED_OR_INCONSISTENT_PUBLIC_SOURCE_PROOFS', rows,
  'Input pin provenance, GitHub source ownership, CI success, original negative-test results, durable audits and owner consent must be verified independently.');
}
