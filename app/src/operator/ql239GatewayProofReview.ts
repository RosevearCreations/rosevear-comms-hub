import type { OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import { ql238ReadCapabilities } from './ql238HandshakeReadiness';
import { ROSEVEAR_INTEGRATION_CONTRACT, QL237_COMPANY_CONTRACTS } from './ql237IntegrationReadiness';

export const QL239_RELEASE = 'ql239-readonly-gateway-proof-intake-rotation-independent-four-company-review-held-v1';
export const QL239_COMPANIES: readonly OrganizationId[] = ['rosiedazzlers', 'devilndove', 'icamp', 'yw'];
export const QL239_CHECKS = [
  'signedHealth', 'signedCapabilities', 'wrongBusinessDenied', 'wrongTenantDenied',
  'expiredDenied', 'replayDenied', 'revokedKeyDenied', 'writeDenied',
  'rotationNewKeyHeld', 'oldKeyRejectedAfterRotation'
] as const;
export type Ql239Check = typeof QL239_CHECKS[number];
export type Ql239ProofKind = 'DEMO_ONLY' | 'EXTERNAL_CLAIM_UNVERIFIED';
export type Ql239Disposition = 'PROOF_CLAIM_HELD' | 'DENIED_SCHEMA' | 'DENIED_SCOPE' |
  'DENIED_TENANT' | 'DENIED_CAPABILITY' | 'DENIED_EVIDENCE' | 'DENIED_REPLAY' |
  'DENIED_CHECKS' | 'DENIED_STALE';

/** A narrow reference to a claimed external test; never an actual credential or signed request. */
export interface Ql239Proof {
  kind: Ql239ProofKind;
  company: OrganizationId;
  tenantId: string | null;
  contractVersion: typeof ROSEVEAR_INTEGRATION_CONTRACT;
  gateway: 'ai-data-platform';
  environment: 'disabled-preview';
  method: 'GET';
  healthPath: '/api/integration/v1/health';
  capabilitiesPath: '/api/integration/v1/capabilities';
  connectionState: 'HOLD';
  capabilities: readonly string[];
  evidenceId: string;
  healthReceiptId: string;
  capabilitiesReceiptId: string;
  sourceUrl: string;
  sourceRevision: string;
  submitterAlias: string;
  capturedAt: string;
  checks: Readonly<Record<Ql239Check, boolean>>;
}

export interface Ql239Intake {
  proof: Ql239Proof | null;
  disposition: Ql239Disposition;
  reason: string;
  review: 'NOT_REVIEWED' | 'INDEPENDENT_REVIEW_DRAFT_HELD';
  reviewerAlias: string | null;
  credentialRun: 'NOT_RUN' | 'SYNTHETIC_ROTATION_CHECKLIST_HELD';
  actualConnection: 'DISCONNECTED';
  externalRequests: 0;
  externalWrites: 0;
  realApproval: false;
  liveCalls: 0;
  liveSms: 0;
  realPilotHolds: 12;
}
export type Ql239Ledger = Partial<Record<OrganizationId, Ql239Intake>>;

const requiredProofKeys = [
  'kind', 'company', 'tenantId', 'contractVersion', 'gateway', 'environment', 'method',
  'healthPath', 'capabilitiesPath', 'connectionState', 'capabilities', 'evidenceId',
  'healthReceiptId', 'capabilitiesReceiptId',
  'sourceUrl', 'sourceRevision', 'submitterAlias', 'capturedAt', 'checks'
] as const;
const aliasPattern = /^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/;
const evidencePattern = /^[a-zA-Z0-9_-]{8,64}$/;
const shaPattern = /^[a-f0-9]{40}$/;
const ownerGitHubArtifact = /^https:\/\/github\.com\/RosevearCreations\/[a-zA-Z0-9._-]+\/(?:commit\/[a-f0-9]{40}|pull\/[1-9][0-9]*|actions\/runs\/[1-9][0-9]*)$/;

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}

function holdsUnchanged(): boolean {
  return QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((item) => item.state === 'HELD_UNVERIFIED');
}

const allPass = (): Readonly<Record<Ql239Check, boolean>> => Object.fromEntries(
  QL239_CHECKS.map((check) => [check, true])
) as Record<Ql239Check, boolean>;

/** Explicit demo values. They are not returned by another application's endpoints. */
export function ql239SyntheticProof(company: OrganizationId, now = new Date()): Ql239Proof {
  return {
    kind: 'DEMO_ONLY', company,
    tenantId: QL237_COMPANY_CONTRACTS[company].tenantRequired ? `demo-${company}-tenant` : null,
    contractVersion: ROSEVEAR_INTEGRATION_CONTRACT,
    gateway: 'ai-data-platform', environment: 'disabled-preview', method: 'GET',
    healthPath: '/api/integration/v1/health', capabilitiesPath: '/api/integration/v1/capabilities',
    connectionState: 'HOLD', capabilities: ql238ReadCapabilities(company),
    evidenceId: `demo-${company}-${now.getTime()}`, sourceUrl: '', sourceRevision: 'demo-only',
    healthReceiptId: `demo-health-${company}`, capabilitiesReceiptId: `demo-caps-${company}`,
    submitterAlias: 'demo_submitter', capturedAt: now.toISOString(), checks: allPass()
  };
}

/** Pure, fail-closed preflight. External evidence is never actually authenticated here. */
export function inspectQl239Proof(
  candidate: unknown, expectedCompany: OrganizationId, ledger: Ql239Ledger, now = new Date()
): { disposition: Ql239Disposition; reason: string } {
  const deny = (disposition: Ql239Disposition, reason: string) => ({ disposition, reason });
  if (!exactKeys(candidate, requiredProofKeys) || !exactKeys(candidate.checks, QL239_CHECKS) ||
    !Array.isArray(candidate.capabilities) || !QL239_COMPANIES.includes(expectedCompany)) {
    return deny('DENIED_SCHEMA', 'Only the exact v1 read-only proof reference fields are accepted. No personal information or secret fields.');
  }
  const proof = candidate as unknown as Ql239Proof;
  if (!['DEMO_ONLY', 'EXTERNAL_CLAIM_UNVERIFIED'].includes(proof.kind) ||
      proof.company !== expectedCompany || proof.gateway !== 'ai-data-platform' ||
      proof.contractVersion !== ROSEVEAR_INTEGRATION_CONTRACT || proof.environment !== 'disabled-preview' ||
      proof.method !== 'GET' || proof.healthPath !== '/api/integration/v1/health' ||
      proof.capabilitiesPath !== '/api/integration/v1/capabilities' || proof.connectionState !== 'HOLD') {
    return deny('DENIED_SCOPE', 'The route, application, gateway, contract, environment or held state is not authorized for review.');
  }
  const tenantExpected = QL237_COMPANY_CONTRACTS[expectedCompany].tenantRequired
    ? `demo-${expectedCompany}-tenant` : null;
  if (proof.tenantId !== tenantExpected) {
    return deny('DENIED_TENANT', 'Proof must be scoped to the selected business and its isolated fictional tenant.');
  }
  const expectedCaps = ql238ReadCapabilities(expectedCompany);
  if (proof.capabilities.length !== expectedCaps.length ||
      new Set(proof.capabilities).size !== expectedCaps.length ||
      !proof.capabilities.every((capability) => typeof capability === 'string' && expectedCaps.includes(capability))) {
    return deny('DENIED_CAPABILITY', 'Only the exact company read-reference allowlist is accepted. No mutations or communications.');
  }
  if (!evidencePattern.test(proof.evidenceId) || !evidencePattern.test(proof.healthReceiptId) ||
      !evidencePattern.test(proof.capabilitiesReceiptId) || proof.healthReceiptId === proof.capabilitiesReceiptId ||
      !aliasPattern.test(proof.submitterAlias) ||
      typeof proof.sourceUrl !== 'string' || typeof proof.sourceRevision !== 'string' ||
      (proof.kind === 'DEMO_ONLY' && (proof.sourceUrl !== '' || proof.sourceRevision !== 'demo-only')) ||
      (proof.kind === 'EXTERNAL_CLAIM_UNVERIFIED' &&
        (!ownerGitHubArtifact.test(proof.sourceUrl) || !shaPattern.test(proof.sourceRevision)))) {
    return deny('DENIED_EVIDENCE', 'Source reference, revision, evidence identifier or operator alias is missing or outside the allowlist.');
  }
  const timestamp = Date.parse(proof.capturedAt);
  if (!Number.isFinite(timestamp) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(proof.capturedAt) ||
      now.getTime() - timestamp > 7 * 86400000 || timestamp > now.getTime() + 300000) {
    return deny('DENIED_STALE', 'Claim timestamp is absent, over seven days old or from the future. Obtain fresh source proof.');
  }
  if (Object.values(ledger).some((entry) => entry?.proof?.evidenceId === proof.evidenceId)) {
    return deny('DENIED_REPLAY', 'A proof identifier already exists. It cannot be replayed for another business or review.');
  }
  if (QL239_CHECKS.some((check) => proof.checks[check] !== true) || !holdsUnchanged()) {
    return deny('DENIED_CHECKS', 'Every negative security and rotation claim must be present; all 12 real pilot holds must remain intact.');
  }
  return deny('PROOF_CLAIM_HELD',
    proof.kind === 'DEMO_ONLY'
      ? 'Fictional sample meets the expected shape. No external application was contacted or verified.'
      : 'Unverified source claims are ready for independent human verification; no server identity, source or receipt is authenticated in-browser.');
}

export function intakeQl239Proof(ledger: Ql239Ledger, candidate: Ql239Proof,
  company: OrganizationId, now = new Date()): Ql239Ledger {
  const finding = inspectQl239Proof(candidate, company, ledger, now);
  return { ...ledger, [company]: {
    // Reject without retaining unapproved payloads; even an accidentally pasted
    // credential or customer field never enters the evidence ledger.
    proof: finding.disposition === 'PROOF_CLAIM_HELD' ? candidate : null,
    ...finding, review: 'NOT_REVIEWED', reviewerAlias: null,
    credentialRun: 'NOT_RUN', actualConnection: 'DISCONNECTED', externalRequests: 0,
    externalWrites: 0, realApproval: false, liveCalls: 0, liveSms: 0, realPilotHolds: 12
  } };
}

/** Browser rehearsal only; no cryptographic operations take place here. */
export function markQl239RotationChecklist(ledger: Ql239Ledger, company: OrganizationId): Ql239Ledger {
  const entry = ledger[company];
  if (!entry || entry.disposition !== 'PROOF_CLAIM_HELD' || !holdsUnchanged()) return ledger;
  return { ...ledger, [company]: { ...entry, credentialRun: 'SYNTHETIC_ROTATION_CHECKLIST_HELD',
    review: 'NOT_REVIEWED', reviewerAlias: null } };
}

/** Different aliases are a reviewer-separation rehearsal, not proof of real identities. */
export function independentlyReviewQl239(ledger: Ql239Ledger, company: OrganizationId, alias: string): Ql239Ledger {
  const entry = ledger[company];
  if (!entry || entry.disposition !== 'PROOF_CLAIM_HELD' ||
      entry.credentialRun !== 'SYNTHETIC_ROTATION_CHECKLIST_HELD' || !holdsUnchanged() ||
      !entry.proof || !aliasPattern.test(alias) || alias.toLowerCase() === entry.proof.submitterAlias.toLowerCase()) return ledger;
  return { ...ledger, [company]: { ...entry, reviewerAlias: alias, review: 'INDEPENDENT_REVIEW_DRAFT_HELD' } };
}

export function resetQl239Company(ledger: Ql239Ledger, company: OrganizationId): Ql239Ledger {
  const next = { ...ledger }; delete next[company]; return next;
}

export function ql239Portfolio(ledger: Ql239Ledger) {
  return QL239_COMPANIES.map((company) => ({
    company, proof: ledger[company]?.disposition ?? 'NOT_RECEIVED',
    rotation: ledger[company]?.credentialRun ?? 'NOT_RUN',
    independentReview: ledger[company]?.review ?? 'NOT_REVIEWED',
    actualConnection: 'DISCONNECTED' as const, realPilotHolds: 12 as const
  }));
}
