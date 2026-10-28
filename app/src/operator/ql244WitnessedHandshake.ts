import type { OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import type { Ql242Ledger } from './ql242OwnerSignedRollout';
import { type Ql243Ledger, ql243CurrentStatus } from './ql243ConnectionTesting';

export const QL244_RELEASE = 'ql244-independently-witnessed-handshake-credential-registry-conditional-pilot-review-held-v1';
export const QL244_SOURCES = ['ai-data-platform', 'devilndove', 'rosiedazzlers', 'yw', 'icamp', 'rosevear-ai-hub'] as const;
export const QL244_BLOCKERS = [
  'Six real server-side credential registry receipts and independent key ownership evidence',
  'Externally observed gateway handshake, replay/rotation/tenant denial and audit-store durability',
  'Separate verified assessor identity and exact QL-243 evidence digest',
  'Separately authenticated owner identity and explicit real read-only pilot approval',
  'Reversible server-side rollout controls and witnessed revocation/rollback',
  'All 12 independent QL-181 communications prerequisites; phone/SMS remain unavailable'
] as const;
export type Ql244Status = 'NOT_STARTED' | 'UPSTREAM_MISSING_HELD' | 'DENIED_SCHEMA' |
  'DENIED_SCOPE' | 'DENIED_CHAIN' | 'SOURCE_DRIFT_HELD' |
  'SIGNED_WITNESS_CLAIM_RECONCILED_HELD';
export interface Ql244KeyRecord {
  system: typeof QL244_SOURCES[number];
  keyId: string;
  receiptId: string;
  review: 'OWNER_APPROVAL_NOT_GIVEN_HELD';
}
export interface Ql244Case {
  status: Ql244Status;
  reason: string;
  reference: { sourceRevision: string; gatewayAuditId: string; identityAttestationId: string;
    assessorReceiptId: string; gatewayPin: string; ownerPin: string;
    witnessPin: string; assessorPin: string; credentialMetadata: Ql244KeyRecord[] } | null;
  ownerAuthorized: false; actualConnection: 'DISCONNECTED'; realPilotHolds: 12;
  calls: 0; sms: 0; writes: 0; providerDispatch: 0;
}
export type Ql244Ledger = Partial<Record<OrganizationId, Ql244Case>>;
const REPORT_KEYS = [
  'release', 'status', 'reason', 'company', 'assessorSignatureChecked',
  'conditionalOwnerRequestSignatureChecked', 'witnessedSourceIndependentlyConfirmed',
  'credentialExchangeIndependentlyConfirmed', 'ownerIdentityIndependentlyConfirmed',
  'actualOwnerAuthorization', 'conditionalPilotDecision', 'actualConnection',
  'actualWrites', 'calls', 'sms', 'providerDispatch', 'realPilotHolds', 'gatewayAuditId',
  'identityAttestationId', 'assessorReceiptId', 'sourceRevision',
  'gatewayPublicKeyFingerprintSha256', 'ownerPublicKeyFingerprintSha256',
  'witnessPublicKeyFingerprintSha256', 'assessorPublicKeyFingerprintSha256',
  'credentialMetadata'
] as const;
const KEY_FIELDS = ['system', 'keyId', 'receiptId', 'review'] as const;
const exact = (v: unknown, keys: readonly string[]): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k));
const id = (value: unknown): value is string => typeof value === 'string' && /^np-[a-z0-9-]{6,70}$/.test(value);
const pin = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const deny = (status: Ql244Status, reason: string): Ql244Case => ({
  status, reason, reference: null, ownerAuthorized: false, actualConnection: 'DISCONNECTED',
  realPilotHolds: 12, calls: 0, sms: 0, writes: 0, providerDispatch: 0
});

function upstream(company: OrganizationId, ql239: Ql239Ledger, ql240: Ql240Ledger,
  ql241: Ql241Ledger, ql242: Ql242Ledger, ql243: Ql243Ledger) {
  if (company !== 'devilndove' ||
      ql243CurrentStatus(ql243[company], company, ql239, ql240, ql241, ql242) !==
      'AUTHENTICATED_READS_REPORTED_UNATTESTED_HELD' ||
      QL181_PREREQUISITES.length !== 12 ||
      !QL181_PREREQUISITES.every(x => x.state === 'HELD_UNVERIFIED')) return null;
  return ql243[company]?.reference ?? null;
}

/** No certificate, key, signed envelope or credential is retained in browser state. */
export function inspectQl244Report(candidate: unknown, company: OrganizationId,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger,
  ql242: Ql242Ledger, ql243: Ql243Ledger): Ql244Case {
  const p = upstream(company, ql239, ql240, ql241, ql242, ql243);
  if (!p) return deny('UPSTREAM_MISSING_HELD', 'First reconcile the current QL-243 Devil n Dove authenticated four-GET claim.');
  if (!exact(candidate, REPORT_KEYS)) return deny('DENIED_SCHEMA', 'Only the exact nonsecret QL-244 CLI result is accepted.');
  const r = candidate;
  if (r.release !== QL244_RELEASE || r.status !== 'TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD' ||
      r.company !== 'devilndove' || r.assessorSignatureChecked !== true ||
      r.conditionalOwnerRequestSignatureChecked !== true ||
      r.witnessedSourceIndependentlyConfirmed !== false ||
      r.credentialExchangeIndependentlyConfirmed !== false ||
      r.ownerIdentityIndependentlyConfirmed !== false ||
      r.actualOwnerAuthorization !== false ||
      r.conditionalPilotDecision !== 'CONDITIONAL_REVIEW_REQUEST_ONLY_HELD' ||
      r.actualConnection !== 'DISCONNECTED' ||
      r.actualWrites !== 0 || r.calls !== 0 || r.sms !== 0 ||
      r.providerDispatch !== 0 || r.realPilotHolds !== 12 ||
      typeof r.reason !== 'string' || r.reason.length > 400) {
    return deny('DENIED_SCOPE', 'Accept only a held signed review request; never interpret a claim as owner authorization.');
  }
  const pins = [r.gatewayPublicKeyFingerprintSha256, r.ownerPublicKeyFingerprintSha256,
    r.witnessPublicKeyFingerprintSha256, r.assessorPublicKeyFingerprintSha256];
  if (r.sourceRevision !== p.sourceRevision || r.gatewayAuditId !== p.gatewayAuditId ||
      r.identityAttestationId !== p.identityAttestationId || !id(r.assessorReceiptId) ||
      pins[0] !== p.gatewayPin || pins[1] !== p.ownerPin || pins[2] !== p.witnessPin ||
      !pins.every(pin) || new Set(pins).size !== 4) {
    return deny('DENIED_CHAIN', 'Source SHA, three prior pins or newly supplied assessor evidence drifted.');
  }
  const rows = r.credentialMetadata;
  if (!Array.isArray(rows) || rows.length !== QL244_SOURCES.length) {
    return deny('DENIED_SCHEMA', 'Require six held, sanitized app-specific credential metadata records.');
  }
  const ids = new Set<string>(); const receipts = new Set<string>();
  for (let index = 0; index < QL244_SOURCES.length; index++) {
    const record = rows[index];
    if (!exact(record, KEY_FIELDS) || record.system !== QL244_SOURCES[index] ||
        typeof record.keyId !== 'string' || !/^np-[a-z0-9-]{4,50}$/.test(record.keyId) ||
        !id(record.receiptId) || record.review !== 'OWNER_APPROVAL_NOT_GIVEN_HELD' ||
        ids.has(record.keyId) || receipts.has(record.receiptId)) {
      return deny('DENIED_SCHEMA', 'Do not accept shared/duplicated keys, unknown apps or unauthorized credentials.');
    }
    ids.add(record.keyId); receipts.add(record.receiptId);
  }
  return { ...deny('SIGNED_WITNESS_CLAIM_RECONCILED_HELD',
    'Local references match the claimed signer evidence, but independent witness identity, key exchange and actual owner approval remain UNVERIFIED.'),
    reference: { sourceRevision: p.sourceRevision, gatewayAuditId: p.gatewayAuditId,
      identityAttestationId: p.identityAttestationId,
      assessorReceiptId: r.assessorReceiptId as string,
      gatewayPin: p.gatewayPin, ownerPin: p.ownerPin, witnessPin: p.witnessPin,
      assessorPin: r.assessorPublicKeyFingerprintSha256 as string,
      credentialMetadata: rows.map(record => ({ system: record.system as Ql244KeyRecord['system'],
        keyId: record.keyId as string, receiptId: record.receiptId as string,
        review: 'OWNER_APPROVAL_NOT_GIVEN_HELD' as const })) }
  };
}

export function ql244CurrentStatus(entry: Ql244Case | undefined, company: OrganizationId,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger,
  ql242: Ql242Ledger, ql243: Ql243Ledger): Ql244Status {
  if (!entry) return 'NOT_STARTED';
  if (entry.reference) {
    const p = upstream(company, ql239, ql240, ql241, ql242, ql243);
    if (!p || p.sourceRevision !== entry.reference.sourceRevision ||
        p.gatewayAuditId !== entry.reference.gatewayAuditId ||
        p.identityAttestationId !== entry.reference.identityAttestationId ||
        p.gatewayPin !== entry.reference.gatewayPin || p.ownerPin !== entry.reference.ownerPin ||
        p.witnessPin !== entry.reference.witnessPin) return 'SOURCE_DRIFT_HELD';
  }
  return entry.status;
}

export function ql244Portfolio(ledger: Ql244Ledger,
  ql239: Ql239Ledger, ql240: Ql240Ledger, ql241: Ql241Ledger,
  ql242: Ql242Ledger, ql243: Ql243Ledger) {
  const companies: OrganizationId[] = ['devilndove', 'rosiedazzlers', 'yw', 'icamp'];
  return companies.map(company => ({
    company, status: ql244CurrentStatus(ledger[company], company, ql239, ql240, ql241, ql242, ql243),
    connection: 'DISCONNECTED' as const, ownerPermission: 'NOT GIVEN' as const,
    pilotHolds: 12 as const
  }));
}
