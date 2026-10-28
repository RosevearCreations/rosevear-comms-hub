import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { inspectQl248Bundle, ql248CanonicalProof, QL248_NEGATIVES,
  QL248_RELEASE } from '../ql248-proof-commit-reconciliation.mjs';

const NOW = Date.UTC(2026, 9, 28, 16, 30);
const hash = data => createHash('sha256').update(data).digest('hex');
const asBytes = value => Buffer.from(JSON.stringify(value), 'utf8');

function fixture() {
  const keys = QL247_SOURCES.map(() => generateKeyPairSync('ed25519'));
  const rows = QL247_SOURCES.map((s, i) => {
    const sourceRevisionSha = String(i + 1).repeat(40);
    const proofCommitSha = String.fromCharCode(97 + i).repeat(40);
    const tenantId = ['yw', 'icamp'].includes(s.system) ? `np-ql248-tenant-${i}` : null;
    const businessId = s.system === 'ai-data-platform' ? 'devilndove' : s.system;
    const ciRunUrl = `https://github.com/RosevearCreations/${s.repository}/actions/runs/${i + 1234}`;
    const payload = {
      schema_version: 'rosevear.integration.v1', source_system: s.system,
      repository: `RosevearCreations/${s.repository}`, source_revision: sourceRevisionSha,
      challenge_id: `np-ql248-challenge-${i}`, challenge_sha256: hash(`challenge-${i}`),
      business_id: businessId, tenant_id: tenantId, environment: 'nonproduction',
      ci_run_url: ciRunUrl, allowed_methods: ['GET'],
      allowed_paths: ['/api/integration/v1/health', '/api/integration/v1/capabilities'],
      negative_tests: Object.fromEntries(QL248_NEGATIVES.map(k => [k, true])),
      gateway_audit_receipt_id: null, health_receipt_id: null,
      capabilities_receipt_id: null, registered_key_id: null,
      owner_authorization: 'NOT_GIVEN', connection_state: 'DISCONNECTED',
      external_gateway_get_verified: false, durable_audit_verified: false,
      owner_identity_verified: false, issued_at: NOW - 10_000, expires_at: NOW + 600_000
    };
    const publicKeyPem = keys[i].publicKey.export({ type: 'spki', format: 'pem' });
    const signature = sign(null, ql248CanonicalProof(payload), keys[i].privateKey).toString('base64url');
    const rawProof = asBytes({ payload, publicKeyPem, signature });
    return {
      source: { system: s.system, sourceRevisionSha, proofCommitSha,
        rawProofBase64: rawProof.toString('base64') },
      trust: { system: s.system, sourceRevisionSha, proofCommitSha,
        proofSha256: hash(rawProof), ciRunUrl,
        publicKeySpkiSha256: hash(keys[i].publicKey.export({ type: 'spki', format: 'der' })),
        businessId, tenantId }
    };
  });
  return { bundle: { schemaVersion: 'rosevear.ql248.bundle.v1', sources: rows.map(r => r.source) },
    pins: { schemaVersion: 'rosevear.ql248.pins.v1', sources: rows.map(r => r.trust) },
    keys };
}

function resign(f, i, edit, key = f.keys[i]) {
  const row = f.bundle.sources[i];
  const envelope = JSON.parse(Buffer.from(row.rawProofBase64, 'base64').toString('utf8'));
  edit(envelope);
  envelope.signature = sign(null, ql248CanonicalProof(envelope.payload), key.privateKey).toString('base64url');
  const rawProof = asBytes(envelope);
  row.rawProofBase64 = rawProof.toString('base64');
  f.pins.sources[i].proofSha256 = hash(rawProof);
}

test('QL248 verifies only offline Ed25519 signatures with six separate operator-supplied pins; releases nothing', () => {
  const f = fixture();
  const got = inspectQl248Bundle(f.bundle, f.pins, NOW);
  assert.equal(got.release, QL248_RELEASE);
  assert.equal(got.status, 'SIX_OFFLINE_SIGNATURES_MATCHED_REAL_GATEWAY_PROOF_PENDING_HELD');
  assert.equal(got.offlineSignaturesMatched, 6);
  assert.equal(got.independentlyAuthenticatedPins, 0);
  assert.equal(got.independentlyRetrievedGitHubProofs, 0);
  assert.equal(got.independentlyWitnessedGatewayGets, 0);
  assert.equal(got.independentlyVerifiedNegativeTests, 0);
  assert.equal(got.ownerAuthorization, 'NOT_GIVEN');
  assert.equal(got.connectionState, 'DISCONNECTED');
  assert.equal(got.realPilotHolds, 12);
  for (const field of ['writes', 'calls', 'sms', 'dispatch']) assert.equal(got[field], 0);
  assert.equal(JSON.stringify(got).includes('BEGIN PUBLIC KEY'), false);
  assert.equal(JSON.stringify(got).includes('rawProofBase64'), false);
});

test('QL248 refuses a self-referential proof/source revision or an unpinned proof commit', () => {
  const f = fixture();
  f.bundle.sources[0].proofCommitSha = f.bundle.sources[0].sourceRevisionSha;
  f.pins.sources[0].proofCommitSha = f.bundle.sources[0].sourceRevisionSha;
  const got = inspectQl248Bundle(f.bundle, f.pins, NOW);
  assert.equal(got.sources[0].status, 'DENIED_REVISION_OR_TENANT_PIN');
  assert.equal(got.offlineSignaturesMatched, 5);
  assert.match(got.status, /^HOLD_/);
});

test('QL248 rejects raw byte integrity drift before a signature can be credited', () => {
  const f = fixture();
  f.bundle.sources[1].rawProofBase64 = f.bundle.sources[1].rawProofBase64.replace('e', 'a');
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).sources[1].status, 'DENIED_PROOF_BYTES');
});

test('QL248 rejects an Ed25519 signature whose fingerprint does not match the independently supplied pin', () => {
  const f = fixture();
  f.pins.sources[2].publicKeySpkiSha256 = hash('untrusted-key');
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).sources[2].status, 'DENIED_SIGNATURE_OR_KEY_PIN');
});

test('QL248 rejects cryptographic payload tampering even when the raw digest is updated', () => {
  const f = fixture();
  const row = f.bundle.sources[3];
  const envelope = JSON.parse(Buffer.from(row.rawProofBase64, 'base64').toString('utf8'));
  envelope.payload.challenge_sha256 = hash('changed');
  const rawProof = asBytes(envelope);
  row.rawProofBase64 = rawProof.toString('base64');
  f.pins.sources[3].proofSha256 = hash(rawProof);
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).sources[3].status, 'DENIED_SIGNATURE_OR_KEY_PIN');
});

test('QL248 denies broadened methods, cross-tenant records and fabricated owner approval', () => {
  const cases = [
    e => { e.payload.allowed_methods = ['GET', 'POST']; },
    e => { e.payload.owner_authorization = 'GIVEN'; },
    e => { e.payload.tenant_id = 'np-foreign-tenant'; },
    e => { e.payload.negative_tests.write_denied = false; }
  ];
  for (const edit of cases) {
    const f = fixture();
    resign(f, 4, edit);
    assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).sources[4].status,
      'DENIED_SIGNED_SCOPE_OR_EXPIRY');
  }
});

test('QL248 rejects an expired one-hour challenge and future-issued proof', () => {
  const f = fixture();
  resign(f, 0, envelope => { envelope.payload.expires_at = NOW - 1; });
  resign(f, 1, envelope => { envelope.payload.issued_at = NOW + 301_000; });
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).offlineSignaturesMatched, 4);
});

test('QL248 enforces six unique Ed25519 signers even if an operator reuses a shared challenge', () => {
  const f = fixture();
  resign(f, 1, e => { e.payload.challenge_id = 'np-ql248-challenge-0';
    e.publicKeyPem = f.keys[0].publicKey.export({ type: 'spki', format: 'pem' }); }, f.keys[0]);
  f.pins.sources[1].publicKeySpkiSha256 = f.pins.sources[0].publicKeySpkiSha256;
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).sources[1].status,
    'DENIED_CROSS_APP_SIGNER_REUSE');
  const g = fixture();
  resign(g, 1, e => { e.payload.challenge_id = 'np-ql248-challenge-0'; });
  assert.equal(inspectQl248Bundle(g.bundle, g.pins, NOW).offlineSignaturesMatched, 6);
});

test('QL248 denies absent, reordered or extra sources instead of accepting a partial pilot', () => {
  const f = fixture();
  f.bundle.sources.pop();
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).status, 'DENIED_BUNDLE');
  f.bundle.sources.push({ ...f.bundle.sources[0] });
  assert.equal(inspectQl248Bundle(f.bundle, f.pins, NOW).sources[5].status,
    'DENIED_REVISION_OR_TENANT_PIN');
});
