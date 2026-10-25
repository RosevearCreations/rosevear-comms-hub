/** QL-190: read-only, external-human-review handoff; no signatures or authorization. */
import type { BrandId } from '../types';
import { QL181_PREREQUISITES, type Ql181Category } from './ql181PrivacyPilotGate';
import manifest from './ql190-review-packet.json';

export const QL190_PACKET_VERSION = 'ql190-independent-prepilot-review-packet-v1' as const;
export const QL190_REVIEW_FOCUS = [
  'All prerequisites', 'Identity & roles', 'Consent & privacy',
  'Provider & infrastructure', 'Owner governance'
] as const;
export type Ql190Focus = typeof QL190_REVIEW_FOCUS[number];

export const QL190_SOURCE_DOCUMENTS = manifest.sourceDocuments;
export const QL190_OPEN_EVIDENCE = manifest.prerequisites;
export const QL190_MEETING_AGENDA = [
  'Independently confirm precise brand, phone/SMS purpose, permitted operators, number ownership and personal-line exclusions.',
  'Review actual server-side identity, MFA, brand RLS, consent, data minimization, retention and negative testing in isolated staging.',
  'Validate selected provider, verified signatures/replay handling, secrets, financial approval, abuse limits, private audit and incident reversal.',
  'Have a reviewer independent from implementation document residual risks, failed tests, evidence provenance and explicit HOLD recommendations.',
  'Request a separate, verified owner go/no-go decision only after all twelve requirements are evidenced; this preview collects none.'
] as const;

type Ql190ReviewRow = Readonly<{
  id: string; title: string; category: Ql181Category; reviewer: string;
  requiredBeforePilot: string; requiredArtifact: string; sourcePath: string;
  state: 'HELD_UNVERIFIED';
}>;

export type Ql190PacketProjection = Readonly<{
  version: typeof QL190_PACKET_VERSION;
  disposition: 'PACKET_REVIEW_ONLY' | 'INVALID_REVIEW_SCOPE' | 'CROSS_BRAND_REJECTED' | 'PACKET_INTEGRITY_HOLD';
  brandId: BrandId | null;
  selectedFocus: Ql190Focus | null;
  visibleRows: readonly Ql190ReviewRow[];
  heldCount: 12; reviewedExternally: 0; collectedOwnerApprovals: 0;
  livePilotAuthorized: false; externalReviewCompleted: false;
  realCustomerDataProcessed: false; realProviderEnabled: false;
  sourceDocuments: number; externalWrites: 0; callsPlaced: 0; messagesSent: 0;
  explanation: string;
}>;

const BRAND_IDS = ['rosiedazzlers', 'devilndove'];
const REQUIRED_IDS = QL181_PREREQUISITES.map(item => item.id);
const MATRIX_PATH = 'docs/QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md';
const EXPECTED_DOCS: ReadonlyArray<readonly [string, string]> = [
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
const exact = (value: unknown, keys: readonly string[]) => value !== null &&
  typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));

export function projectQl190Review(activeBrand: unknown, packetBrand: unknown,
  focus: unknown, candidate: unknown = manifest): Ql190PacketProjection {
  const base = { version: QL190_PACKET_VERSION, visibleRows: [] as readonly Ql190ReviewRow[],
    heldCount: 12 as const, reviewedExternally: 0 as const, collectedOwnerApprovals: 0 as const,
    livePilotAuthorized: false as const, externalReviewCompleted: false as const,
    realCustomerDataProcessed: false as const, realProviderEnabled: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
  const deny = (disposition: 'INVALID_REVIEW_SCOPE' | 'CROSS_BRAND_REJECTED' | 'PACKET_INTEGRITY_HOLD',
    explanation: string): Ql190PacketProjection => ({ ...base, brandId: null,
      selectedFocus: null, sourceDocuments: 0, disposition, explanation });
  if (!BRAND_IDS.includes(activeBrand as string) || !BRAND_IDS.includes(packetBrand as string) ||
      !QL190_REVIEW_FOCUS.includes(focus as Ql190Focus))
    return deny('INVALID_REVIEW_SCOPE', 'Unknown business or packet filter. All live pilot holds remain.');
  if (activeBrand !== packetBrand)
    return deny('CROSS_BRAND_REJECTED', 'Other-brand review access is not projected.');
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    return deny('PACKET_INTEGRITY_HOLD', 'The checked-in external-review packet cannot be validated.');

  const packet = candidate as typeof manifest;
  const rows = packet.prerequisites;
  const docs = packet.sourceDocuments;
  if (!exact(packet, ['version', 'state', 'sourceMatrix', 'externalReviewCompleted',
    'ownerSignoffCaptured', 'pilotAuthorizationGranted', 'sourceDocuments', 'prerequisites']) ||
      packet.sourceMatrix !== MATRIX_PATH || packet.version !== QL190_PACKET_VERSION ||
      packet.state !== 'DRAFT_FOR_INDEPENDENT_REVIEW' ||
      packet.externalReviewCompleted !== false || packet.ownerSignoffCaptured !== false ||
      packet.pilotAuthorizationGranted !== false || !Array.isArray(rows) || rows.length !== 12 ||
      !Array.isArray(docs) || docs.length !== 9 ||
      !rows.every(row => exact(row, ['id', 'state', 'reviewLane', 'requiredArtifact']) &&
        typeof row.id === 'string' && typeof row.requiredArtifact === 'string' && row.requiredArtifact.length >= 8) ||
      !docs.every(doc => exact(doc, ['build', 'path', 'purpose']) &&
        typeof doc.build === 'string' && typeof doc.path === 'string') ||
      new Set(rows.map(row => row.id)).size !== 12 ||
      !REQUIRED_IDS.every(id => rows.some(row => row.id === id && row.state === 'HELD_UNVERIFIED')) ||
      !EXPECTED_DOCS.every(([build, location]) => docs.some(doc => doc.build === build &&
        doc.path === location)))
    return deny('PACKET_INTEGRITY_HOLD', 'Packet data diverges from held QL-181 requirements.');

  const wanted = focus as Ql190Focus;
  const visibleRows = QL181_PREREQUISITES.filter(item => wanted === 'All prerequisites' ||
    item.category === wanted).map(item => ({ id: item.id, title: item.title,
    category: item.category, reviewer: item.reviewer,
    requiredBeforePilot: item.requiredBeforePilot,
    requiredArtifact: rows.find(row => row.id === item.id)!.requiredArtifact,
    sourcePath: item.sourcePath, state: 'HELD_UNVERIFIED' as const }));

  return { ...base, brandId: activeBrand as BrandId, selectedFocus: wanted,
    sourceDocuments: docs.length, visibleRows,
    disposition: 'PACKET_REVIEW_ONLY',
    explanation: 'Manifest sources are listed for a separate human review; no reviewer identity, findings, signatures or owner decisions have been collected.' };
}
