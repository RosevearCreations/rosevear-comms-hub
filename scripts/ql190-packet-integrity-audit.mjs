/**
 * QL-190 static, read-only review-packet integrity audit.
 * PASS means checked-in sources agree, NEVER that an independent human reviewed,
 * approved, signed, or authorized a live telecom pilot.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const QL190_VERSION = 'ql190-independent-prepilot-review-packet-v1';
const MATRIX_PATH = 'docs/QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md';
const MANIFEST_PATH = 'app/src/operator/ql190-review-packet.json';
const EXPECTED_IDS = [
  'identity-mfa', 'brand-rls', 'lawful-collection', 'consent-proof',
  'retention-deletion', 'provider-auth', 'secrets', 'abuse-limits',
  'audit-monitor', 'numbers-carrier', 'independent-security', 'owner-signoff'
];
const EXPECTED_DOCS = [
  ['QL-181', MATRIX_PATH],
  ['QL-182', 'docs/QL-182_JOURNEY_ACCEPTANCE_AND_NEXT_BATCH_HANDOFF.md'],
  ['QL-183', 'docs/QL-183_OPERATOR_USABILITY_ACCEPTANCE.md'],
  ['QL-184', 'docs/QL-184_BRAND_WORKSPACE_PERMISSION_MAPPING.md'],
  ['QL-185', 'docs/QL-185_PRIVATE_DATA_MINIMIZATION_RETENTION_BLUEPRINT.md'],
  ['QL-186', 'docs/QL-186_CONSENT_MESSAGE_CLASSIFICATION_SPECIFICATION.md'],
  ['QL-187', 'docs/QL-187_PROVIDER_DECISION_COST_MODEL.md'],
  ['QL-188', 'docs/QL-188_SERVER_AUTH_WEBHOOK_REPLAY_TEST_HARNESS.md'],
  ['QL-189', 'docs/QL-189_OPERATIONS_SAFETY_CONTROLS.md']
];

const exactKeys = (value, keys) => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.keys(value).length === keys.length &&
  Object.keys(value).every(key => keys.includes(key));
const safeText = value => typeof value === 'string' && value.trim().length >= 8 &&
  value.length <= 300 && !/[<>\r\n]/.test(value);

export function auditQl190Packet(packet, documents = {}) {
  const issues = [];
  const report = () => Object.freeze({
    version: QL190_VERSION, disposition: issues.length ? 'PACKET_INTEGRITY_HOLD' : 'PACKET_SOURCES_CONSISTENT_ONLY',
    problems: Object.freeze([...issues]), expectedPrerequisites: 12,
    livePilotAuthorized: false, independentReviewerSigned: false,
    realOwnerDecisionCaptured: false, providerEnabled: false,
    networkCalls: 0, externalWrites: 0, supabaseWrites: 0, callsPlaced: 0, messagesSent: 0
  });
  if (!exactKeys(packet, ['version', 'state', 'sourceMatrix', 'externalReviewCompleted',
    'ownerSignoffCaptured', 'pilotAuthorizationGranted', 'sourceDocuments', 'prerequisites'])) {
    issues.push('Packet shape differs from pinned review-only schema.');
    return report();
  }
  if (packet.version !== QL190_VERSION || packet.state !== 'DRAFT_FOR_INDEPENDENT_REVIEW' ||
      packet.sourceMatrix !== MATRIX_PATH || packet.externalReviewCompleted !== false ||
      packet.ownerSignoffCaptured !== false || packet.pilotAuthorizationGranted !== false)
    issues.push('Review-only version or no-authorization hold changed.');

  if (!Array.isArray(packet.sourceDocuments) || packet.sourceDocuments.length !== EXPECTED_DOCS.length) {
    issues.push('Missing or extra evidence-source documents.');
  } else {
    const seen = new Set();
    for (const item of packet.sourceDocuments) {
      if (!exactKeys(item, ['build', 'path', 'purpose'])) {
        issues.push('Invalid evidence-source shape.'); continue;
      }
      const match = EXPECTED_DOCS.find(([build]) => item.build === build);
      if (!match || item.path !== match[1] || seen.has(item.build) || !safeText(item.purpose)) {
        issues.push('Unpinned, duplicate or malformed evidence-source reference.'); continue;
      }
      seen.add(item.build);
      const markdown = documents[item.path];
      if (typeof markdown !== 'string' || !markdown.includes(item.build))
        issues.push(`Source document missing or inconsistent: ${item.build}.`);
    }
    if (seen.size !== EXPECTED_DOCS.length) issues.push('One or more source builds are missing.');
  }

  const matrix = documents[MATRIX_PATH];
  const section = typeof matrix === 'string'
    ? matrix.split('## Live-pilot prerequisites — all HELD')[1]?.split('All 12 items remain')[0]
    : null;
  const sourceIds = section ? [...section.matchAll(/^\|\s*`([a-z-]+)`\s*\|/gm)].map(match => match[1]) : [];
  if (sourceIds.length !== 12 || new Set(sourceIds).size !== 12 ||
      EXPECTED_IDS.some(id => !sourceIds.includes(id))) issues.push('QL-181 source matrix is missing a canonical hold.');

  if (!Array.isArray(packet.prerequisites) || packet.prerequisites.length !== 12) {
    issues.push('Packet must contain exactly twelve held prerequisites.');
  } else {
    const seen = new Set();
    for (const row of packet.prerequisites) {
      if (!exactKeys(row, ['id', 'state', 'reviewLane', 'requiredArtifact'])) {
        issues.push('Malformed prerequisite record.'); continue;
      }
      if (!EXPECTED_IDS.includes(row.id) || !sourceIds.includes(row.id) || seen.has(row.id))
        issues.push('Unrecognized, duplicate or unlinked prerequisite ID.');
      seen.add(row.id);
      if (row.state !== 'HELD_UNVERIFIED' || !safeText(row.reviewLane) ||
          !safeText(row.requiredArtifact)) issues.push('Prerequisite status or evidence text changed.');
    }
    if (seen.size !== 12) issues.push('Not all canonical held prerequisite IDs are represented.');
  }
  return report();
}

export function auditQl190Repository(repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const packet = JSON.parse(readFileSync(path.join(repoRoot, MANIFEST_PATH), 'utf8'));
  const documents = {};
  for (const [, docPath] of EXPECTED_DOCS)
    documents[docPath] = existsSync(path.join(repoRoot, docPath))
      ? readFileSync(path.join(repoRoot, docPath), 'utf8') : null;
  return auditQl190Packet(packet, documents);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditQl190Repository();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.disposition !== 'PACKET_SOURCES_CONSISTENT_ONLY') process.exitCode = 1;
}
