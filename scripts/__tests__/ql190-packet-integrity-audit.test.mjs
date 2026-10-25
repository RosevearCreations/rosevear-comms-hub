import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditQl190Packet, auditQl190Repository, QL190_VERSION }
  from '../ql190-packet-integrity-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixture = JSON.parse(readFileSync(path.join(root, 'app/src/operator/ql190-review-packet.json'), 'utf8'));
const documentMap = Object.fromEntries(fixture.sourceDocuments.map(item => [item.path,
  readFileSync(path.join(root, item.path), 'utf8')]));
const clone = () => structuredClone(fixture);
const audit = (packet = clone(), documents = { ...documentMap }) => auditQl190Packet(packet, documents);

test('checked-in review packet and nine source documents pass bounded integrity audit', () => {
  assert.deepEqual(auditQl190Repository(root), audit());
  const r = audit();
  assert.equal(r.version, QL190_VERSION);
  assert.equal(r.disposition, 'PACKET_SOURCES_CONSISTENT_ONLY');
  assert.deepEqual(r.problems, []);
  assert.equal(r.expectedPrerequisites, 12);
  assert.equal(fixture.sourceDocuments.length, 9);
});

test('an internally consistent packet still denies every real pilot or external write', () => {
  assert.deepEqual({ ...audit(), problems: [] }, {
    version: QL190_VERSION, disposition: 'PACKET_SOURCES_CONSISTENT_ONLY',
    problems: [], expectedPrerequisites: 12, livePilotAuthorized: false,
    independentReviewerSigned: false, realOwnerDecisionCaptured: false,
    providerEnabled: false, networkCalls: 0, externalWrites: 0, supabaseWrites: 0,
    callsPlaced: 0, messagesSent: 0
  });
});

test('fails closed when packet version or review-only status changes', () => {
  const p = clone(); p.version = 'ql190-live-v2';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  p.version = QL190_VERSION; p.state = 'APPROVED';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('fails closed on an asserted external approval, owner signoff or pilot grant', () => {
  for (const field of ['externalReviewCompleted', 'ownerSignoffCaptured', 'pilotAuthorizationGranted']) {
    const p = clone(); p[field] = true;
    assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  }
});

test('rejects removing, adding or replacing a prerequisite', () => {
  for (const op of [
    p => { p.prerequisites.pop(); },
    p => { p.prerequisites.push({ ...p.prerequisites[0] }); },
    p => { p.prerequisites[0].id = 'not-a-real-gate'; }
  ]) { const p = clone(); op(p); assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD'); }
});

test('rejects duplicate prerequisite even while length remains exactly twelve', () => {
  const p = clone(); p.prerequisites[11].id = p.prerequisites[0].id;
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('cannot mark any held prerequisite completed or signed', () => {
  for (const state of ['APPROVED', 'SIGNED', 'CLOSED', 'READY']) {
    const p = clone(); p.prerequisites[0].state = state;
    assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  }
});

test('fails if required independent-review artifact or reviewer information is removed', () => {
  const p = clone(); p.prerequisites[0].requiredArtifact = '';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  p.prerequisites[0].requiredArtifact = fixture.prerequisites[0].requiredArtifact;
  p.prerequisites[0].reviewLane = '';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('requires every source document, including the QL-189 safety plan', () => {
  const docs = { ...documentMap };
  delete docs['docs/QL-189_OPERATIONS_SAFETY_CONTROLS.md'];
  assert.equal(audit(clone(), docs).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('rejects a wrong or missing historical evidence source', () => {
  const p = clone(); p.sourceDocuments[2].path = 'docs/NOT_REVIEWED.md';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  const q = clone(); q.sourceDocuments.pop();
  assert.equal(audit(q).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('rejects duplicate, out-of-scope or traversal evidence references', () => {
  const p = clone(); p.sourceDocuments[1].build = 'QL-181';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  p.sourceDocuments[1].build = 'QL-182'; p.sourceDocuments[1].path = '../../secrets.env';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('rejects modified QL-181 matrix that omits a prerequisite', () => {
  const docs = { ...documentMap };
  docs[fixture.sourceMatrix] = docs[fixture.sourceMatrix]
    .replace(/^\| `identity-mfa` \|[^\n]*\n/m, '');
  assert.equal(audit(clone(), docs).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('rejects replacing the QL-181 source matrix with an unrelated one', () => {
  const p = clone(); p.sourceMatrix = 'docs/QL-999_FAKE.md';
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('rejects new fields suggesting upload, consent or approval endpoints', () => {
  const p = clone(); p.approveLive = true;
  assert.equal(audit(p).disposition, 'PACKET_INTEGRITY_HOLD');
  const q = clone(); q.prerequisites[0].providerCallback = 'https://example.invalid';
  assert.equal(audit(q).disposition, 'PACKET_INTEGRITY_HOLD');
});

test('declines malformed packet objects without leaking customer details', () => {
  for (const invalid of [null, undefined, '', [], { state: 'HELD' }]) {
    const r = auditQl190Packet(invalid, { ...documentMap });
    assert.equal(r.disposition, 'PACKET_INTEGRITY_HOLD');
    assert.equal(r.livePilotAuthorized, false);
    assert.equal(r.externalWrites, 0);
  }
});
