import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { OrganizationId } from './ql191Organizations';
import type { Ql239Ledger, Ql239Intake } from './ql239GatewayProofReview';
import { QL239_COMPANIES } from './ql239GatewayProofReview';

export const QL240_RELEASE = 'ql240-independent-nonproduction-receipt-audit-tenant-key-reconciliation-pilot-held-v1';
export const QL240_CHECKS = [
  'sourceCommitIndependentlyChecked', 'healthSignatureIndependentlyChecked',
  'capabilitiesSignatureIndependentlyChecked', 'gatewayIssuerPinned',
  'businessAndTenantDeniedCrossScope', 'revokedPreviousKeyRejected',
  'replayAndExpiryDenied', 'immutableGatewayAuditReceiptChecked',
  'readOnlyNoDispatchVerified'
] as const;
export type Ql240Check = typeof QL240_CHECKS[number];

/** Text-only source claims; a browser cannot prove these checks really occurred. */
export interface Ql240AuditClaim {
  company: OrganizationId;
  sourceEvidenceId: string;
  healthReceiptId: string;
  capabilitiesReceiptId: string;
  gatewayAuditId: string;
  currentKeyId: string;
  revokedKeyId: string;
  inspectorAlias: string;
  observedAt: string;
  checks: Readonly<Record<Ql240Check, boolean>>;
}
export type Ql240Status = 'SOURCE_NOT_RETURNED_HELD' | 'DENIED_SCHEMA' | 'DENIED_SCOPE' |
  'DENIED_RECEIPT' | 'DENIED_KEY' | 'DENIED_FRESHNESS' | 'DENIED_CHECKS' |
  'NONPRODUCTION_CLAIMS_RECONCILED_HELD' | 'SOURCE_DRIFT_HELD';
export type Ql240Decision = 'HOLD' | 'REQUEST_REAL_VERIFICATION_HELD' | 'READ_ONLY_CANDIDATE_HELD';
export interface Ql240Case {
  claim: Ql240AuditClaim | null;
  status: Ql240Status;
  reason: string;
  independentReviewerAlias: string | null;
  independentReview: 'NOT_REVIEWED' | 'SEPARATE_REVIEW_DRAFT_HELD';
  decision: Ql240Decision;
  actualConnection: 'DISCONNECTED';
  realCryptographicGatewayProof: false;
  realOwnerApproval: false;
  externalWrites: 0;
  providerDispatch: 0;
  liveCalls: 0;
  liveSms: 0;
  realPilotHolds: 12;
}
export type Ql240Ledger = Partial<Record<OrganizationId, Ql240Case>>;

const claimKeys = [
  'company', 'sourceEvidenceId', 'healthReceiptId', 'capabilitiesReceiptId',
  'gatewayAuditId', 'currentKeyId', 'revokedKeyId', 'inspectorAlias', 'observedAt', 'checks'
] as const;
const idPattern = /^[a-zA-Z0-9_-]{8,64}$/;
const keyPattern = /^np-[a-z0-9-]{4,50}$/;
const aliasPattern = /^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/;
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const realHolds = () => QL181_PREREQUISITES.length === 12 &&
  QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');

export function ql240EligibleSource(source: Ql239Intake | undefined): boolean {
  return !!source?.proof && source.proof.kind === 'EXTERNAL_CLAIM_UNVERIFIED' &&
    source.disposition === 'PROOF_CLAIM_HELD' &&
    source.credentialRun === 'SYNTHETIC_ROTATION_CHECKLIST_HELD' &&
    source.review === 'INDEPENDENT_REVIEW_DRAFT_HELD';
}

function finding(status: Ql240Status, reason: string) { return { status, reason }; }

/** Pure reconciliation is only a claim review. Genuine crypto lives in offline Node tests. */
export function inspectQl240Claim(
  candidate: unknown, company: OrganizationId, source: Ql239Intake | undefined, now = new Date()
): { status: Ql240Status; reason: string } {
  if (!ql240EligibleSource(source) || !realHolds()) {
    return finding('SOURCE_NOT_RETURNED_HELD', 'First receive independent QL-239 external source evidence. Demo records cannot authorize review.');
  }
  if (!exact(candidate, claimKeys) || !exact(candidate.checks, QL240_CHECKS)) {
    return finding('DENIED_SCHEMA', 'Only non-personal exact v1 audit reference fields and required checks are accepted.');
  }
  const claim = candidate as unknown as Ql240AuditClaim;
  if (!QL239_COMPANIES.includes(company) || claim.company !== company) {
    return finding('DENIED_SCOPE', 'Claimed business differs from the independently selected business.');
  }
  if (claim.sourceEvidenceId !== source?.proof?.evidenceId ||
      claim.healthReceiptId !== source.proof.healthReceiptId ||
      claim.capabilitiesReceiptId !== source.proof.capabilitiesReceiptId ||
      !idPattern.test(claim.gatewayAuditId) ||
      [claim.healthReceiptId, claim.capabilitiesReceiptId].includes(claim.gatewayAuditId)) {
    return finding('DENIED_RECEIPT', 'Health, capabilities, source and gateway receipts cannot be reconciled to the same QL-239 intake.');
  }
  if (typeof claim.currentKeyId !== 'string' || typeof claim.revokedKeyId !== 'string' ||
      !keyPattern.test(claim.currentKeyId) || !keyPattern.test(claim.revokedKeyId) ||
      claim.currentKeyId === claim.revokedKeyId) {
    return finding('DENIED_KEY', 'Active and revoked nonproduction key IDs must be distinct, with no key material entered.');
  }
  const at = Date.parse(claim.observedAt);
  if (!Number.isFinite(at) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(claim.observedAt) ||
      now.getTime() - at > 300000 || at > now.getTime() + 300000) {
    return finding('DENIED_FRESHNESS', 'Independent audit claim must be timestamped within five minutes of this rehearsal.');
  }
  if (!aliasPattern.test(claim.inspectorAlias) ||
      claim.inspectorAlias.toLowerCase() === source.proof.submitterAlias.toLowerCase() ||
      claim.inspectorAlias.toLowerCase() === source.reviewerAlias?.toLowerCase() ||
      QL240_CHECKS.some((key) => claim.checks[key] !== true)) {
    return finding('DENIED_CHECKS', 'Missing claimed checks, invalid independent alias or lack of reviewer separation.');
  }
  return finding('NONPRODUCTION_CLAIMS_RECONCILED_HELD',
    'Audit reference fields match this claim, but no actual server proof or reviewer identity was verified. Remain DISCONNECTED.');
}

export function recordQl240Claim(
  ledger: Ql240Ledger, sourceLedger: Ql239Ledger, company: OrganizationId,
  candidate: unknown, now = new Date()
): Ql240Ledger {
  const review = inspectQl240Claim(candidate, company, sourceLedger[company], now);
  return { ...ledger, [company]: {
    ...review, claim: review.status === 'NONPRODUCTION_CLAIMS_RECONCILED_HELD' ? candidate as Ql240AuditClaim : null,
    independentReviewerAlias: null, independentReview: 'NOT_REVIEWED', decision: 'HOLD',
    actualConnection: 'DISCONNECTED', realCryptographicGatewayProof: false,
    realOwnerApproval: false, externalWrites: 0, providerDispatch: 0, liveCalls: 0, liveSms: 0, realPilotHolds: 12
  } };
}

export function ql240CurrentStatus(entry: Ql240Case | undefined, source: Ql239Intake | undefined): Ql240Status | 'NOT_STARTED' {
  if (!entry) return 'NOT_STARTED';
  if (entry.claim && (!ql240EligibleSource(source) || source?.proof?.evidenceId !== entry.claim.sourceEvidenceId ||
    source.proof.healthReceiptId !== entry.claim.healthReceiptId ||
    source.proof.capabilitiesReceiptId !== entry.claim.capabilitiesReceiptId)) return 'SOURCE_DRIFT_HELD';
  return entry.status;
}

/** A separate local reviewer can request follow-up, but cannot verify live identity. */
export function independentlyReviewQl240(ledger: Ql240Ledger, sourceLedger: Ql239Ledger,
  company: OrganizationId, reviewer: string): Ql240Ledger {
  const entry = ledger[company];
  const source = sourceLedger[company];
  if (!entry?.claim || ql240CurrentStatus(entry, source) !== 'NONPRODUCTION_CLAIMS_RECONCILED_HELD' ||
      !realHolds() || !aliasPattern.test(reviewer) ||
      [entry.claim.inspectorAlias, source?.proof?.submitterAlias, source?.reviewerAlias]
        .some((alias) => alias?.toLowerCase() === reviewer.toLowerCase())) return ledger;
  return { ...ledger, [company]: { ...entry, independentReviewerAlias: reviewer,
    independentReview: 'SEPARATE_REVIEW_DRAFT_HELD', decision: 'HOLD' } };
}

/** Pilot candidates are still only local planning notes; no real approval is possible. */
export function decideQl240HeldPilot(ledger: Ql240Ledger, sourceLedger: Ql239Ledger,
  company: OrganizationId, decision: Exclude<Ql240Decision, 'HOLD'>): Ql240Ledger {
  const entry = ledger[company];
  if (!entry?.claim || entry.independentReview !== 'SEPARATE_REVIEW_DRAFT_HELD' ||
      ql240CurrentStatus(entry, sourceLedger[company]) !== 'NONPRODUCTION_CLAIMS_RECONCILED_HELD' ||
      !realHolds() || (decision === 'READ_ONLY_CANDIDATE_HELD' && company !== 'devilndove')) return ledger;
  return { ...ledger, [company]: { ...entry, decision } };
}

export function resetQl240Company(ledger: Ql240Ledger, company: OrganizationId): Ql240Ledger {
  const next = { ...ledger }; delete next[company]; return next;
}

export function ql240Portfolio(ledger: Ql240Ledger, sourceLedger: Ql239Ledger) {
  return QL239_COMPANIES.map((company) => ({
    company, reconciliation: ql240CurrentStatus(ledger[company], sourceLedger[company]),
    independent: ledger[company]?.independentReview ?? 'NOT_REVIEWED',
    decision: ql240CurrentStatus(ledger[company], sourceLedger[company]) === 'SOURCE_DRIFT_HELD'
      ? 'HOLD' : ledger[company]?.decision ?? 'HOLD',
    actualConnection: 'DISCONNECTED' as const, pilotHolds: 12 as const
  }));
}
