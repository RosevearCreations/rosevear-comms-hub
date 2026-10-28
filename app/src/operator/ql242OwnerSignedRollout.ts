import type { OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import { QL239_COMPANIES, type Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import { ql240CurrentStatus } from './ql240PilotDecision';
import { type Ql241Ledger, ql241CurrentStatus } from './ql241ExternalProofReadiness';

export const QL242_RELEASE = 'ql242-independent-audit-owner-signed-decision-reversible-readonly-rollout-rehearsal-held-v1';
export type Ql242Status = 'NOT_STARTED' | 'UPSTREAM_MISSING_HELD' | 'DENIED_SCHEMA' |
  'DENIED_SCOPE' | 'DENIED_CHAIN' | 'DENIED_SIGNATURE_REPORT' |
  'SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD' | 'SOURCE_DRIFT_HELD';
export type Ql242Stage = 'NOT_PREPARED' | 'REVIEW_PREPARED_HELD' | 'SIMULATED_READ_ONLY_HELD' | 'ROLLED_BACK_HELD';
export interface Ql242Reference {
  sourceEvidenceId: string;
  sourceRevision: string;
  healthReceiptId: string;
  capabilitiesReceiptId: string;
  gatewayAuditId: string;
  gatewayKeyFingerprint: string;
  ownerKeyFingerprint: string;
  rollbackReceiptId: string;
}
export interface Ql242Case {
  status: Ql242Status;
  reason: string;
  reference: Ql242Reference | null;
  separateReviewerAlias: string | null;
  stage: Ql242Stage;
  actualConnection: 'DISCONNECTED';
  ownerIdentityVerified: false;
  actualOwnerAuthorization: false;
  liveCalls: 0;
  liveSms: 0;
  externalWrites: 0;
  providerDispatch: 0;
  realPilotHolds: 12;
}
export type Ql242Ledger = Partial<Record<OrganizationId, Ql242Case>>;
const fields = [
  'release', 'status', 'reason', 'signedAuditCompared', 'signedOwnerDecisionCompared',
  'independentlyWitnessedProvenance', 'ownerIdentityVerified', 'actualOwnerAuthorization',
  'realGatewayConnection', 'rehearsalState', 'externalRequests', 'externalWrites',
  'liveCalls', 'liveSms', 'providerDispatch', 'realPilotHolds', 'company',
  'gatewayAuditId', 'sourceRevision', 'healthReceiptId', 'capabilitiesReceiptId',
  'gatewayPublicKeyFingerprintSha256', 'ownerPublicKeyFingerprintSha256',
  'rollbackReceiptId', 'ownerDecision', 'transitions'
] as const;
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const deny = (status: Ql242Status, reason: string): Ql242Case => ({
  status, reason, reference: null, separateReviewerAlias: null, stage: 'NOT_PREPARED',
  actualConnection: 'DISCONNECTED', ownerIdentityVerified: false, actualOwnerAuthorization: false,
  liveCalls: 0, liveSms: 0, externalWrites: 0, providerDispatch: 0, realPilotHolds: 12
});

function parent(company: OrganizationId, ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger) {
  const source = ql239[company]?.proof;
  const audit = ql240[company];
  const external = ql241[company];
  if (company !== 'devilndove' || source?.kind !== 'EXTERNAL_CLAIM_UNVERIFIED' ||
      !audit?.claim || !external?.report ||
      ql240CurrentStatus(audit, ql239[company]) !== 'NONPRODUCTION_CLAIMS_RECONCILED_HELD' ||
      ql241CurrentStatus(external, company, ql240, ql239) !== 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD' ||
      external.request !== 'OWNER_READ_ONLY_AUTHORIZATION_REVIEW_DRAFT_HELD' ||
      !QL181_PREREQUISITES.every((item) => item.state === 'HELD_UNVERIFIED') ||
      QL181_PREREQUISITES.length !== 12) return null;
  return { source, audit, external };
}

/** A pasted CLI report is not an independent signature or identity attestation. */
export function inspectQl242Report(candidate: unknown, company: OrganizationId,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger): Ql242Case {
  const p = parent(company, ql239, ql240, ql241);
  if (!p) return deny('UPSTREAM_MISSING_HELD', 'Devil n Dove QL-239/240/241 held evidence and owner review request are required.');
  if (!exact(candidate, fields) || !Array.isArray(candidate.transitions) || candidate.transitions.length !== 0) {
    return deny('DENIED_SCHEMA', 'Accept only an exact sanitized QL-242 CLI report with no transition history or private fields.');
  }
  const r = candidate;
  if (r.release !== QL242_RELEASE || r.status !== 'DUAL_SIGNATURES_CHECKED_HELD' ||
      r.company !== company || r.signedAuditCompared !== true ||
      r.signedOwnerDecisionCompared !== true ||
      r.independentlyWitnessedProvenance !== false || r.ownerIdentityVerified !== false ||
      r.actualOwnerAuthorization !== false || r.realGatewayConnection !== 'DISCONNECTED' ||
      r.rehearsalState !== 'AUDIT_REVIEW_ONLY_HELD' || r.externalRequests !== 0 ||
      r.externalWrites !== 0 || r.liveCalls !== 0 || r.liveSms !== 0 ||
      r.providerDispatch !== 0 || r.realPilotHolds !== 12 ||
      r.ownerDecision !== 'REQUEST_READ_ONLY_REHEARSAL' ||
      typeof r.reason !== 'string' || r.reason.length > 300) {
    return deny('DENIED_SCOPE', 'Only a held, source-linked, nonproduction owner REHEARSAL REQUEST is accepted.');
  }
  if (r.gatewayAuditId !== p.audit.claim?.gatewayAuditId ||
      r.sourceRevision !== p.source.sourceRevision ||
      r.healthReceiptId !== p.external.report?.healthReceiptId ||
      r.capabilitiesReceiptId !== p.external.report?.capabilitiesReceiptId ||
      r.gatewayPublicKeyFingerprintSha256 !== p.external.report?.publicKeyFingerprintSha256 ||
      !/^[a-f0-9]{64}$/.test(String(r.ownerPublicKeyFingerprintSha256)) ||
      r.ownerPublicKeyFingerprintSha256 === r.gatewayPublicKeyFingerprintSha256 ||
      typeof r.rollbackReceiptId !== 'string' || !/^np-[a-z0-9-]{6,70}$/.test(r.rollbackReceiptId)) {
    return deny('DENIED_CHAIN', 'Owner/gateway key fingerprints or audit, rollback, receipt and source IDs do not reconcile.');
  }
  return {
    ...deny('SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD',
      'Sanitized offline dual-signature comparison matches the local chain. Actual signer identities, immutable audit and owner approval remain UNVERIFIED.'),
    reference: {
      sourceEvidenceId: p.source.evidenceId, sourceRevision: p.source.sourceRevision,
      healthReceiptId: r.healthReceiptId as string,
      capabilitiesReceiptId: r.capabilitiesReceiptId as string,
      gatewayAuditId: r.gatewayAuditId as string,
      gatewayKeyFingerprint: r.gatewayPublicKeyFingerprintSha256 as string,
      ownerKeyFingerprint: r.ownerPublicKeyFingerprintSha256 as string,
      rollbackReceiptId: r.rollbackReceiptId
    }
  };
}

export function recordQl242Report(ledger: Ql242Ledger, candidate: unknown, company: OrganizationId,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger): Ql242Ledger {
  return { ...ledger, [company]: inspectQl242Report(candidate, company, ql239, ql240, ql241) };
}

export function ql242CurrentStatus(entry: Ql242Case | undefined, company: OrganizationId,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger): Ql242Status {
  if (!entry) return 'NOT_STARTED';
  if (entry.reference) {
    const p = parent(company, ql239, ql240, ql241);
    if (!p || p.source.evidenceId !== entry.reference.sourceEvidenceId ||
        p.source.sourceRevision !== entry.reference.sourceRevision ||
        p.audit.claim?.gatewayAuditId !== entry.reference.gatewayAuditId ||
        p.external.report?.publicKeyFingerprintSha256 !== entry.reference.gatewayKeyFingerprint ||
        p.external.report?.healthReceiptId !== entry.reference.healthReceiptId ||
        p.external.report?.capabilitiesReceiptId !== entry.reference.capabilitiesReceiptId) return 'SOURCE_DRIFT_HELD';
  }
  return entry.status;
}

/** Pure browser-only simulation. Rollback remains possible even if source drifted. */
export function advanceQl242Rehearsal(ledger: Ql242Ledger, company: OrganizationId,
  action: 'prepare' | 'simulate' | 'rollback', reviewer: string,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger): Ql242Ledger {
  const record = ledger[company];
  if (!record?.reference || company !== 'devilndove') return ledger;
  const next: Ql242Stage | null = action === 'rollback' && record.stage === 'SIMULATED_READ_ONLY_HELD'
    ? 'ROLLED_BACK_HELD' :
    ql242CurrentStatus(record, company, ql239, ql240, ql241) !== 'SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD'
      ? null :
    action === 'prepare' && record.stage === 'NOT_PREPARED' ? 'REVIEW_PREPARED_HELD' :
    action === 'simulate' && record.stage === 'REVIEW_PREPARED_HELD' ? 'SIMULATED_READ_ONLY_HELD' : null;
  if (!next) return ledger;
  if (action === 'prepare') {
    const parentCase = parent(company, ql239, ql240, ql241);
    if (!/^[A-Za-z][A-Za-z0-9_-]{2,31}$/.test(reviewer) ||
      [parentCase?.source.submitterAlias, ql239[company]?.reviewerAlias,
        parentCase?.audit.claim?.inspectorAlias, parentCase?.audit.independentReviewerAlias,
        parentCase?.external.independentReviewerAlias]
        .some((alias) => alias?.toLowerCase() === reviewer.toLowerCase())) return ledger;
  }
  return { ...ledger, [company]: { ...record, stage: next,
    separateReviewerAlias: record.separateReviewerAlias ?? reviewer } };
}

export function resetQl242Company(ledger: Ql242Ledger, company: OrganizationId) {
  const next = { ...ledger }; delete next[company]; return next;
}

export function ql242Portfolio(ledger: Ql242Ledger, ql239: Ql239Ledger,
  ql240: Ql240Ledger, ql241: Ql241Ledger) {
  return QL239_COMPANIES.map((company) => ({ company,
    status: ql242CurrentStatus(ledger[company], company, ql239, ql240, ql241),
    stage: ql242CurrentStatus(ledger[company], company, ql239, ql240, ql241) === 'SOURCE_DRIFT_HELD'
      ? 'FROZEN_HELD' : ledger[company]?.stage ?? 'NOT_PREPARED',
    actualConnection: 'DISCONNECTED' as const, realPilotHolds: 12 as const
  }));
}
