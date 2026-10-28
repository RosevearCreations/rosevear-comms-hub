import type { OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import { type Ql242Ledger, ql242CurrentStatus } from './ql242OwnerSignedRollout';

export const QL243_RELEASE = 'ql243-independent-owner-attestation-durable-audit-authenticated-nonproduction-readonly-held-v1';
export const QL243_SIX_APPS = [
  'AI Data Platform', 'Devil n Dove', 'Rosie Dazzlers', 'Yard Workers / PMS', 'iCamp', 'Rosevear AI Hub'
] as const;
export const QL243_BLOCKERS = [
  'Independent witness identity and key ownership verified through a separate channel',
  'Gateway audit datastore record independently verified for durability and immutability',
  'Real gateway endpoint and per-app key rotation/revocation tested in nonproduction',
  'Cross-company/tenant, replay, stale request, write and dispatch denials observed independently',
  'Owner authenticated separately and explicitly authorizes the specific read-only pilot',
  'All 12 QL-181 live-communications prerequisites independently cleared (not part of QL-243)'
] as const;
export type Ql243Status = 'NOT_STARTED' | 'UPSTREAM_MISSING_HELD' | 'DENIED_SCHEMA' |
  'DENIED_SCOPE' | 'DENIED_CHAIN' | 'SOURCE_DRIFT_HELD' |
  'IDENTITY_SIGNATURE_REPORTED_UNATTESTED_HELD' | 'AUTHENTICATED_READS_REPORTED_UNATTESTED_HELD';
export interface Ql243Case {
  status: Ql243Status;
  reason: string;
  reference: { sourceRevision: string; gatewayAuditId: string; healthReceiptId: string;
    capabilitiesReceiptId: string; identityAttestationId: string; gatewayPin: string;
    ownerPin: string; witnessPin: string; getAttempts: number } | null;
  actualConnection: 'DISCONNECTED'; actualOwnerAuthorization: false;
  livePilotRelease: false; writeAttempts: 0; calls: 0; sms: 0;
  providerDispatch: 0; realPilotHolds: 12;
}
export type Ql243Ledger = Partial<Record<OrganizationId, Ql243Case>>;

const reportFields = ['release', 'status', 'reason', 'company', 'ownerIdentityClaimSignatureChecked',
  'ownerIdentityIndependentlyConfirmed', 'gatewayAuditGetChecked', 'gatewayAuditDurabilityIndependentlyConfirmed',
  'actualOwnerAuthorization', 'connectionState', 'livePilotRelease', 'getAttempts', 'writeAttempts',
  'calls', 'sms', 'providerDispatch', 'realPilotHolds', 'identityAttestationId',
  'gatewayAuditId', 'healthReceiptId', 'capabilitiesReceiptId', 'sourceRevision',
  'gatewayPublicKeyFingerprintSha256', 'ownerPublicKeyFingerprintSha256', 'witnessPublicKeyFingerprintSha256'] as const;
const exact = (v: unknown, fields: readonly string[]): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === fields.length && Object.keys(v).every(k => fields.includes(k));
const deny = (status: Ql243Status, reason: string): Ql243Case => ({
  status, reason, reference: null, actualConnection: 'DISCONNECTED', actualOwnerAuthorization: false,
  livePilotRelease: false, writeAttempts: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12
});

function upstream(company: OrganizationId, ql239: Ql239Ledger, ql240: Ql240Ledger,
  ql241: Ql241Ledger, ql242: Ql242Ledger) {
  if (company !== 'devilndove' ||
      ql242CurrentStatus(ql242[company], company, ql239, ql240, ql241) !== 'SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD' ||
      QL181_PREREQUISITES.length !== 12 ||
      !QL181_PREREQUISITES.every(x => x.state === 'HELD_UNVERIFIED')) return null;
  return ql242[company]?.reference ?? null;
}

/** Browser text is a claimed CLI summary, never independently witnessed evidence. */
export function inspectQl243Report(candidate: unknown, company: OrganizationId, ql239: Ql239Ledger,
  ql240: Ql240Ledger, ql241: Ql241Ledger, ql242: Ql242Ledger): Ql243Case {
  const p = upstream(company, ql239, ql240, ql241, ql242);
  if (!p) return deny('UPSTREAM_MISSING_HELD', 'The existing QL-242 held evidence chain must be reconciled for Devil n Dove first.');
  const readFields = exact(candidate, reportFields);
  const offlineFields = exact(candidate, [...reportFields, 'identityRef']);
  if (!readFields && !offlineFields) return deny('DENIED_SCHEMA', 'Only the exact sanitized Node CLI receipt summary is accepted.');
  const r = candidate;
  const read = r.status === 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD';
  if (read ? !readFields : !offlineFields || typeof r.identityRef !== 'string' ||
      !/^np-[a-z0-9-]{6,70}$/.test(r.identityRef)) return deny('DENIED_SCHEMA', 'Do not mix an offline attestation with a live GET result.');
  if (r.release !== QL243_RELEASE ||
      !['IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD', 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD'].includes(String(r.status)) ||
      r.company !== company || r.ownerIdentityClaimSignatureChecked !== true ||
      r.ownerIdentityIndependentlyConfirmed !== false ||
      r.gatewayAuditGetChecked !== read ||
      r.gatewayAuditDurabilityIndependentlyConfirmed !== false ||
      r.actualOwnerAuthorization !== false || r.connectionState !== 'DISCONNECTED' ||
      r.livePilotRelease !== false || r.getAttempts !== (read ? 4 : 0) ||
      r.writeAttempts !== 0 || r.calls !== 0 || r.sms !== 0 ||
      r.providerDispatch !== 0 || r.realPilotHolds !== 12 ||
      typeof r.reason !== 'string' || r.reason.length > 300) {
    return deny('DENIED_SCOPE', 'No live owner grant, real connection, write or communications release is admissible.');
  }
  if (r.sourceRevision !== p.sourceRevision || r.gatewayAuditId !== p.gatewayAuditId ||
      r.healthReceiptId !== p.healthReceiptId || r.capabilitiesReceiptId !== p.capabilitiesReceiptId ||
      r.gatewayPublicKeyFingerprintSha256 !== p.gatewayKeyFingerprint ||
      r.ownerPublicKeyFingerprintSha256 !== p.ownerKeyFingerprint ||
      typeof r.identityAttestationId !== 'string' || !/^np-[a-z0-9-]{6,70}$/.test(r.identityAttestationId) ||
      typeof r.witnessPublicKeyFingerprintSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(r.witnessPublicKeyFingerprintSha256) ||
      [p.gatewayKeyFingerprint, p.ownerKeyFingerprint].includes(r.witnessPublicKeyFingerprintSha256)) {
    return deny('DENIED_CHAIN', 'Witness and gateway/owner evidence do not match the current QL-242 source and receipt IDs.');
  }
  return { ...deny(read ? 'AUTHENTICATED_READS_REPORTED_UNATTESTED_HELD' :
    'IDENTITY_SIGNATURE_REPORTED_UNATTESTED_HELD',
  'Only a pasted, untrusted CLI result is recorded. Real witness independence, durable audit storage and owner release remain unverified.'),
    reference: { sourceRevision: p.sourceRevision, gatewayAuditId: p.gatewayAuditId,
      healthReceiptId: p.healthReceiptId, capabilitiesReceiptId: p.capabilitiesReceiptId,
      identityAttestationId: r.identityAttestationId as string,
      gatewayPin: p.gatewayKeyFingerprint, ownerPin: p.ownerKeyFingerprint,
      witnessPin: r.witnessPublicKeyFingerprintSha256 as string, getAttempts: r.getAttempts as number }
  };
}

export function ql243CurrentStatus(entry: Ql243Case | undefined, company: OrganizationId,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger, ql242: Ql242Ledger): Ql243Status {
  if (!entry) return 'NOT_STARTED';
  if (entry.reference) {
    const p = upstream(company, ql239, ql240, ql241, ql242);
    if (!p || p.sourceRevision !== entry.reference.sourceRevision ||
        p.gatewayAuditId !== entry.reference.gatewayAuditId || p.healthReceiptId !== entry.reference.healthReceiptId ||
        p.capabilitiesReceiptId !== entry.reference.capabilitiesReceiptId ||
        p.gatewayKeyFingerprint !== entry.reference.gatewayPin ||
        p.ownerKeyFingerprint !== entry.reference.ownerPin) return 'SOURCE_DRIFT_HELD';
  }
  return entry.status;
}

export function ql243Portfolio(ledger: Ql243Ledger, ql239: Ql239Ledger, ql240: Ql240Ledger,
  ql241: Ql241Ledger, ql242: Ql242Ledger) {
  const ids: OrganizationId[] = ['devilndove', 'rosiedazzlers', 'yw', 'icamp'];
  return ids.map(company => ({ company,
    status: ql243CurrentStatus(ledger[company], company, ql239, ql240, ql241, ql242),
    connection: 'DISCONNECTED' as const, pilotHolds: 12 as const }));
}
