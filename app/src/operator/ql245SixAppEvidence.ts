import type { OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import type { Ql242Ledger } from './ql242OwnerSignedRollout';
import type { Ql243Ledger } from './ql243ConnectionTesting';
import { QL244_RELEASE, QL244_SOURCES, ql244CurrentStatus,
  type Ql244Ledger } from './ql244WitnessedHandshake';

export const QL245_RELEASE = 'ql245-six-app-evidence-return-exception-triage-read-only-preconditions-held-v1';
export const QL245_SUMMARY_ORIGIN = 'Owner-supplied Rosevear-Connect-V1.rtf; claims unverified against GitHub and gateway.';
export const QL245_SOURCE_CLAIMS = [
  { system: 'ai-data-platform', name: 'AI Data Platform',
    claim: 'Gateway contract changes reported; inert in production, no connector registered.',
    gap: 'Nonproduction registry/secret provisioning, live signed gateway receipts, audit restart proof and independent reviewer.' },
  { system: 'devilndove', name: 'Devil n Dove',
    claim: 'Build 510: canonical 12-line HMAC, signed nonproduction GET endpoints; product/listing reads disabled.',
    gap: 'Actual source SHA/CI, a provisioned key, live source receipts, independent gateway evidence and owner consent.' },
  { system: 'rosiedazzlers', name: 'Rosie Dazzlers',
    claim: 'HMAC health/capabilities, tenant/replay denials and audit logging reported.',
    gap: 'Registered source credential, authentic signed test receipts, exact SHA/CI and independent proof.' },
  { system: 'yw', name: 'Yard Workers',
    claim: 'QL-243 checks reportedly incorporated; real connection held.',
    gap: 'Source SHA/CI, exact company/tenant endpoints, negative tests and independently witnessed receipts.' },
  { system: 'icamp', name: 'iCamp',
    claim: 'Campground-specific HMAC auth, persistent replay denials and read-only GET endpoints reported.',
    gap: 'Actual campground tenant ID, signed source receipts, current SHA/CI and independently witnessed isolation test.' },
  { system: 'rosevear-ai-hub', name: 'Rosevear AI Hub',
    claim: 'Build 171: restricted service-health endpoints, off by default; private nonproduction only.',
    gap: 'Private test runner and provisioned key, source SHA/CI, live gateway receipts and independent witness.' }
] as const;
export const QL245_BLOCKERS = [
  'Independently retrieve the six original source commits and passing CI logs',
  'Provision and attest six distinct server-only nonproduction credentials via the gateway',
  'Verify original signed GET receipts and all seven denial/replay/tenant tests',
  'Independently prove audit-store durability, identity key provenance and reviewer independence',
  'Obtain a separate, real authenticated owner approval for exact scope, duration and revocation',
  'Confirm actual kill switch, rollback and all 12 independent QL-181 communications gates'
] as const;
const KEYS = ['release','status','company','assessorSignatureChecked','sourceSignatureChecks',
  'realWorldWitnessConfirmed','outOfBandKeyOwnershipIndependentlyConfirmed',
  'externalReadIndependentlyConfirmed','credentialExchangeIndependentlyConfirmed',
  'auditStorageIndependentlyConfirmed','ownerApprovalIndependentlyConfirmed',
  'ownerPilotAuthorized','connectionState','livePilotRelease','writes','calls','sms',
  'dispatch','realPilotHolds','ql244AssessorReceiptId','ql244SourceRevision',
  'reviewReceiptId','assessorPublicKeyFingerprintSha256','sourceMetadata'] as const;
const SOURCE_FIELDS=['system','businessId','tenantId','sourceRevision','ciRunUrl',
  'signerPinSha256','sourceReceiptId','registryReceiptId','gatewayAuditId',
  'healthReceiptId','capabilitiesReceiptId'] as const;
const exact=(v:unknown,keys:readonly string[]): v is Record<string,unknown> =>
  !!v && typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length &&
  Object.keys(v).every(k=>keys.includes(k));
const id=(v:unknown):v is string=>typeof v==='string'&&/^np-[a-z0-9-]{6,70}$/.test(v);
const pin=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const sha=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const ci=(v:unknown):v is string=>typeof v==='string'&&
  /^https:\/\/github\.com\/RosevearCreations\/[a-zA-Z0-9_.-]+\/actions\/runs\/[0-9]+$/.test(v);
export type Ql245Status = 'NOT_STARTED' | 'UPSTREAM_MISSING_HELD' | 'DENIED_SCHEMA' |
  'DENIED_SCOPE' | 'DENIED_SOURCE_CHAIN' | 'SOURCE_DRIFT_HELD' |
  'SIGNED_SOURCE_CLAIMS_RECONCILED_HELD';
export interface Ql245Receipt {
  system: typeof QL244_SOURCES[number]; businessId:string;tenantId:string|null;
  sourceRevision:string; ciRunUrl:string;signerPinSha256:string;
  sourceReceiptId:string;registryReceiptId:string;gatewayAuditId:string;
  healthReceiptId:string;capabilitiesReceiptId:string;
}
export interface Ql245Entry {
  status:Ql245Status;reason:string;
  reference: null | {
    ql244AssessorReceiptId:string;ql244SourceRevision:string;reviewReceiptId:string;
    assessorPin:string;gatewayAuditId:string;credentialMetadata:Ql245Receipt[]
  };
  ownerAuthorized:false;connection:'DISCONNECTED';pilotHolds:12;dispatch:0;writes:0;
}
export type Ql245Ledger=Partial<Record<OrganizationId,Ql245Entry>>;
const deny=(status:Ql245Status,reason:string):Ql245Entry=>({
  status,reason,reference:null,ownerAuthorized:false,connection:'DISCONNECTED',
  pilotHolds:12,dispatch:0,writes:0
});
function upstream(company:OrganizationId,ql239:Ql239Ledger,ql240:Ql240Ledger,
  ql241:Ql241Ledger,ql242:Ql242Ledger,ql243:Ql243Ledger,ql244:Ql244Ledger) {
  if(company!=='devilndove'||QL181_PREREQUISITES.length!==12||
    !QL181_PREREQUISITES.every(x=>x.state==='HELD_UNVERIFIED')||
    ql244CurrentStatus(ql244[company],company,ql239,ql240,ql241,ql242,ql243)!==
      'SIGNED_WITNESS_CLAIM_RECONCILED_HELD')return null;
  return ql244[company]?.reference ?? null;
}
/** Browser checks structure/source linkage only; never verifies signatures or authorizes a pilot. */
export function inspectQl245Summary(value:unknown,company:OrganizationId,
  ql239:Ql239Ledger,ql240:Ql240Ledger,ql241:Ql241Ledger,
  ql242:Ql242Ledger,ql243:Ql243Ledger,ql244:Ql244Ledger):Ql245Entry {
  const current=upstream(company,ql239,ql240,ql241,ql242,ql243,ql244);
  if(!current)return deny('UPSTREAM_MISSING_HELD',
    'QL-244 signed-review chain and actual independent evidence must be checked first.');
  if(!exact(value,KEYS))return deny('DENIED_SCHEMA',
    'Only the exact sanitized offline QL-245 summary, not secrets or arbitrary content, may be entered.');
  const p=value;
  if(p.release!==QL245_RELEASE ||
    p.status!=='SEVEN_PUBLIC_SIGNATURES_MATCHED_REAL_PROOF_PENDING_HELD'||
    p.company!=='devilndove'||p.assessorSignatureChecked!==true||
    p.sourceSignatureChecks!==6||
    p.realWorldWitnessConfirmed!==false||
    p.outOfBandKeyOwnershipIndependentlyConfirmed!==false||
    p.externalReadIndependentlyConfirmed!==false||
    p.credentialExchangeIndependentlyConfirmed!==false||
    p.auditStorageIndependentlyConfirmed!==false||
    p.ownerApprovalIndependentlyConfirmed!==false||
    p.ownerPilotAuthorized!==false||p.connectionState!=='DISCONNECTED'||
    p.livePilotRelease!==false||p.writes!==0||p.calls!==0||p.sms!==0||
    p.dispatch!==0||p.realPilotHolds!==12)return deny('DENIED_SCOPE',
      'Signed claims cannot authorize owner approval, real connections, writes or dispatch.');
  if(p.ql244AssessorReceiptId!==current.assessorReceiptId ||
    p.ql244SourceRevision!==current.sourceRevision||!id(p.reviewReceiptId)||
    !pin(p.assessorPublicKeyFingerprintSha256) ||
    p.assessorPublicKeyFingerprintSha256===current.assessorPin)return deny('DENIED_SOURCE_CHAIN',
      'Independent review receipt, source SHA or assessor signer trust differs from QL-244.');
  if(!Array.isArray(p.sourceMetadata)||p.sourceMetadata.length!==6)
    return deny('DENIED_SCHEMA','Exactly six separate, public source metadata entries required.');
  const keys=new Set<string>();const receipts=new Set<string>();const pins=new Set<string>();
  const metadata:Ql245Receipt[]=[];
  for(let i=0;i<QL244_SOURCES.length;i++){
    const v=p.sourceMetadata[i];const system=QL244_SOURCES[i];
    if(!exact(v,SOURCE_FIELDS)||v.system!==system||!sha(v.sourceRevision)||
      !ci(v.ciRunUrl)||!pin(v.signerPinSha256)||
      !id(v.sourceReceiptId)||!id(v.registryReceiptId)||
      !id(v.gatewayAuditId)||!id(v.healthReceiptId)||!id(v.capabilitiesReceiptId)||
      v.businessId!==(system==='ai-data-platform'?'devilndove':system) ||
      (system==='yw'||system==='icamp' ? !id(v.tenantId) : v.tenantId!==null) ||
      (system==='devilndove' &&
      (v.sourceRevision!==current.sourceRevision||v.gatewayAuditId!==current.gatewayAuditId))||
      keys.has(v.registryReceiptId)||receipts.has(v.sourceReceiptId)||
      pins.has(v.signerPinSha256))return deny('DENIED_SCHEMA',
        'Rejected duplicate, foreign or mismatched six-app return.');
    keys.add(v.registryReceiptId as string);receipts.add(v.sourceReceiptId as string);
    pins.add(v.signerPinSha256 as string);
    metadata.push({
      system,businessId:v.businessId as string,tenantId:v.tenantId as string|null,
      sourceRevision:v.sourceRevision as string,ciRunUrl:v.ciRunUrl as string,
      signerPinSha256:v.signerPinSha256 as string,
      sourceReceiptId:v.sourceReceiptId as string,registryReceiptId:v.registryReceiptId as string,
      gatewayAuditId:v.gatewayAuditId as string,healthReceiptId:v.healthReceiptId as string,
      capabilitiesReceiptId:v.capabilitiesReceiptId as string
    });
  }
  return {
    ...deny('SIGNED_SOURCE_CLAIMS_RECONCILED_HELD',
      'Local source metadata matches a supplied CLI result. Genuine key ownership, live receipts, independent gateway audit, credential transfer and real owner approval remain unverified.'),
    reference:{
      ql244AssessorReceiptId:current.assessorReceiptId,
      ql244SourceRevision:current.sourceRevision,
      reviewReceiptId:p.reviewReceiptId as string,
      assessorPin:p.assessorPublicKeyFingerprintSha256 as string,
      gatewayAuditId:current.gatewayAuditId,credentialMetadata:metadata
    }
  };
}
export function ql245CurrentStatus(entry:Ql245Entry|undefined,company:OrganizationId,
  ql239:Ql239Ledger,ql240:Ql240Ledger,ql241:Ql241Ledger,
  ql242:Ql242Ledger,ql243:Ql243Ledger,ql244:Ql244Ledger):Ql245Status {
  if(!entry)return 'NOT_STARTED';
  if(entry.reference){
    const p=upstream(company,ql239,ql240,ql241,ql242,ql243,ql244);
    if(!p||p.assessorReceiptId!==entry.reference.ql244AssessorReceiptId||
      p.sourceRevision!==entry.reference.ql244SourceRevision ||
      p.gatewayAuditId!==entry.reference.gatewayAuditId)return 'SOURCE_DRIFT_HELD';
  }
  return entry.status;
}
export function ql245Portfolio(ledger:Ql245Ledger,ql239:Ql239Ledger,
  ql240:Ql240Ledger,ql241:Ql241Ledger,ql242:Ql242Ledger,
  ql243:Ql243Ledger,ql244:Ql244Ledger) {
  const companies:OrganizationId[]=['devilndove','rosiedazzlers','yw','icamp'];
  return companies.map(company=>({
    company,status:ql245CurrentStatus(ledger[company],company,ql239,ql240,ql241,ql242,ql243,ql244),
    connection:'DISCONNECTED' as const,ownerPermission:'NOT GIVEN' as const,pilotHolds:12 as const
  }));
}
