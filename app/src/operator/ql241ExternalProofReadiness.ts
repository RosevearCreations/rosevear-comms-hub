import type { OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import { QL239_COMPANIES } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import { ql240CurrentStatus } from './ql240PilotDecision';

export const QL241_RELEASE = 'ql241-external-nonproduction-get-pinned-public-key-owner-authorization-held-v1';
export const QL241_CHECKS = [
  'outOfBandPinProvenanceChecked', 'sourceAndCiRunIndependentlyRetrieved',
  'gatewayAuditIndependentlyRetrieved', 'foreignTenantAndRevokedKeyDenied',
  'rollbackAndExpiryReviewed', 'separateOwnerScopeDecisionRequested'
] as const;
export type Ql241Check = typeof QL241_CHECKS[number];
export type Ql241Status = 'NOT_STARTED' | 'UPSTREAM_NOT_READY_HELD' | 'DENIED_REPORT' |
  'DENIED_SCOPE' | 'DENIED_SOURCE' | 'DENIED_PIN' | 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD' |
  'SOURCE_DRIFT_HELD';
export interface Ql241ReportReference {
  company: OrganizationId;
  sourceEvidenceId: string;
  sourceRevision: string;
  keyId: string;
  publicKeyFingerprintSha256: string;
  healthReceiptId: string;
  capabilitiesReceiptId: string;
  retrievedGetAttempts: 2;
}
export interface Ql241Case {
  status: Ql241Status;
  reason: string;
  report: Ql241ReportReference | null;
  independentReviewerAlias: string | null;
  checks: Readonly<Record<Ql241Check, boolean>>;
  request: 'NONE' | 'OWNER_READ_ONLY_AUTHORIZATION_REVIEW_DRAFT_HELD';
  actualConnection: 'DISCONNECTED';
  realCryptographicProofIndependentlyAttested: false;
  realOwnerAuthorization: false;
  externalWrites: 0;
  providerDispatch: 0;
  liveCalls: 0;
  liveSms: 0;
  realPilotHolds: 12;
}
export type Ql241Ledger = Partial<Record<OrganizationId, Ql241Case>>;
const reportKeys = [
  'release', 'status', 'reason', 'signedGetReceiptsVerified', 'independentlyVerifiedPinProvenance',
  'gatewayAuditIndependentlyVerified', 'realOwnerAuthorization', 'actualConnection',
  'externalGetAttempts', 'externalWrites', 'calls', 'sms', 'providerDispatch',
  'realPilotHolds', 'company', 'tenantId', 'keyId', 'publicKeyFingerprintSha256',
  'healthReceiptId', 'capabilitiesReceiptId'
] as const;
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const emptyChecks = (): Record<Ql241Check, boolean> => Object.fromEntries(QL241_CHECKS.map((check) => [check, false])) as Record<Ql241Check, boolean>;
const heldCase = (status: Ql241Status, reason: string, report: Ql241ReportReference | null = null): Ql241Case => ({
  status, reason, report, independentReviewerAlias: null, checks: emptyChecks(), request: 'NONE',
  actualConnection: 'DISCONNECTED', realCryptographicProofIndependentlyAttested: false,
  realOwnerAuthorization: false, externalWrites: 0, providerDispatch: 0,
  liveCalls: 0, liveSms: 0, realPilotHolds: 12
});

function upstreamCurrent(company: OrganizationId, previous: Ql240Ledger, source: Ql239Ledger) {
  const audit = previous[company];
  return audit?.claim && audit.independentReview === 'SEPARATE_REVIEW_DRAFT_HELD' &&
    ql240CurrentStatus(audit, source[company]) === 'NONPRODUCTION_CLAIMS_RECONCILED_HELD' &&
    source[company]?.proof?.kind === 'EXTERNAL_CLAIM_UNVERIFIED';
}

function sourceIdentity(company: OrganizationId, previous: Ql240Ledger, source: Ql239Ledger) {
  const claim = previous[company]?.claim;
  const proof = source[company]?.proof;
  return claim && proof ? { claim, proof } : null;
}

/** Browser accepts only safe fields from the Node report, never cryptographic authority. */
export function inspectQl241Report(candidate: unknown, company: OrganizationId,
  previous: Ql240Ledger, source: Ql239Ledger): { status: Ql241Status; reason: string; report: Ql241ReportReference | null } {
  const fail = (status: Ql241Status, reason: string) => ({ status, reason, report: null });
  if (!upstreamCurrent(company, previous, source) || QL181_PREREQUISITES.length !== 12 ||
      QL181_PREREQUISITES.some((item) => item.state !== 'HELD_UNVERIFIED')) {
    return fail('UPSTREAM_NOT_READY_HELD', 'QL-239 external source claims and QL-240 separate HELD review are required.');
  }
  if (!exact(candidate, reportKeys)) return fail('DENIED_REPORT', 'Paste only the exact sanitized QL-241 Node report, without extra fields.');
  const r = candidate;
  const identity = sourceIdentity(company, previous, source)!;
  if (r.release !== QL241_RELEASE || r.status !== 'SIGNED_GET_PAIR_CHECKED_HELD' ||
      r.company !== company || !QL239_COMPANIES.includes(company) ||
      r.tenantId !== identity.proof.tenantId ||
      r.signedGetReceiptsVerified !== true || r.independentlyVerifiedPinProvenance !== false ||
      r.gatewayAuditIndependentlyVerified !== false || r.realOwnerAuthorization !== false ||
      r.actualConnection !== 'DISCONNECTED' || r.externalGetAttempts !== 2 ||
      r.externalWrites !== 0 || r.calls !== 0 || r.sms !== 0 ||
      r.providerDispatch !== 0 || r.realPilotHolds !== 12 ||
      typeof r.reason !== 'string' || r.reason.length > 300) {
    return fail('DENIED_SCOPE', 'The Node report must describe only two held nonproduction GETs for this exact tenant.');
  }
  if (r.healthReceiptId !== identity.claim.healthReceiptId ||
      r.capabilitiesReceiptId !== identity.claim.capabilitiesReceiptId ||
      r.keyId !== identity.claim.currentKeyId ||
      typeof identity.proof.sourceRevision !== 'string' ||
      !/^[a-f0-9]{40}$/.test(identity.proof.sourceRevision)) {
    return fail('DENIED_SOURCE', 'Returned receipt/key IDs do not match the current QL-239 and QL-240 evidence chain.');
  }
  if (typeof r.publicKeyFingerprintSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(r.publicKeyFingerprintSha256)) {
    return fail('DENIED_PIN', 'Require a 64-character SHA-256 public SPKI key fingerprint.');
  }
  return {
    status: 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD',
    reason: 'A sanitized signed-GET report matches the local evidence chain. Its origin, pin provenance, reviewer and gateway audit remain independently UNVERIFIED.',
    report: {
      company, sourceEvidenceId: identity.proof.evidenceId,
      sourceRevision: identity.proof.sourceRevision, keyId: r.keyId as string,
      publicKeyFingerprintSha256: r.publicKeyFingerprintSha256,
      healthReceiptId: r.healthReceiptId as string,
      capabilitiesReceiptId: r.capabilitiesReceiptId as string,
      retrievedGetAttempts: 2
    }
  };
}

export function recordQl241Report(ledger: Ql241Ledger, candidate: unknown, company: OrganizationId,
  previous: Ql240Ledger, source: Ql239Ledger): Ql241Ledger {
  const result = inspectQl241Report(candidate, company, previous, source);
  return { ...ledger, [company]: heldCase(result.status, result.reason, result.report) };
}

export function ql241CurrentStatus(entry: Ql241Case | undefined, company: OrganizationId,
  previous: Ql240Ledger, source: Ql239Ledger): Ql241Status {
  if (!entry) return 'NOT_STARTED';
  if (entry.report) {
    const identity = sourceIdentity(company, previous, source);
    if (!upstreamCurrent(company, previous, source) ||
        identity?.proof.evidenceId !== entry.report.sourceEvidenceId ||
        identity?.proof.sourceRevision !== entry.report.sourceRevision ||
        identity?.claim.healthReceiptId !== entry.report.healthReceiptId ||
        identity?.claim.capabilitiesReceiptId !== entry.report.capabilitiesReceiptId ||
        identity?.claim.currentKeyId !== entry.report.keyId) return 'SOURCE_DRIFT_HELD';
  }
  return entry.status;
}

/** Claimed operator checkmarks prepare a request, never consent or activation. */
export function ql241PrepareOwnerReview(ledger: Ql241Ledger, company: OrganizationId,
  previous: Ql240Ledger, source: Ql239Ledger, reviewerAlias: string,
  checks: Readonly<Record<Ql241Check, boolean>>): Ql241Ledger {
  const record = ledger[company];
  const identity = sourceIdentity(company, previous, source);
  if (company !== 'devilndove' || !record?.report ||
      ql241CurrentStatus(record, company, previous, source) !== 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD' ||
      !exact(checks, QL241_CHECKS) || QL241_CHECKS.some((key) => checks[key] !== true) ||
      !/^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/.test(reviewerAlias) ||
      [identity?.proof.submitterAlias, source[company]?.reviewerAlias,
       previous[company]?.claim?.inspectorAlias, previous[company]?.independentReviewerAlias]
        .some((alias) => alias?.toLowerCase() === reviewerAlias.toLowerCase())) return ledger;
  return { ...ledger, [company]: { ...record, checks: { ...checks },
    independentReviewerAlias: reviewerAlias, request: 'OWNER_READ_ONLY_AUTHORIZATION_REVIEW_DRAFT_HELD' } };
}

export function resetQl241Company(ledger: Ql241Ledger, company: OrganizationId) {
  const next = { ...ledger }; delete next[company]; return next;
}

export function ql241Portfolio(ledger: Ql241Ledger, previous: Ql240Ledger, source: Ql239Ledger) {
  return QL239_COMPANIES.map((company) => ({ company,
    evidence: ql241CurrentStatus(ledger[company], company, previous, source),
    request: ql241CurrentStatus(ledger[company], company, previous, source) === 'SOURCE_DRIFT_HELD'
      ? 'NONE' : ledger[company]?.request ?? 'NONE',
    connection: 'DISCONNECTED' as const, holds: 12 as const
  }));
}
