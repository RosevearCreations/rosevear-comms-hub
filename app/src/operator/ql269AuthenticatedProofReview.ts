/**
 * QL-269: dated, immutable original-Proof-B origin observation and a strictly
 * nonauthorizing intake for *sanitized* reviewer/tenant preparation claims.
 * Browser input cannot independently authenticate a human, a key pin, GitHub
 * origin, a tenant boundary, or owner TEST approval.
 */
import { QL268_SOURCE_PROOF_RECHECK } from './ql268ProofBIsolationReleaseLedger';

export const QL269_SOURCE_PROOF_RECHECK = [
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'ad958eee57fc02a1cd6753126e29e7e9a650fda2'},
  {source:'devilndove',repo:'devilndove-site',sha:'2f63fee9a251547550f74566041375ca1e140e2e'},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'717798f3f298f5239078917c938587931703ff27'},
  {source:'yw',repo:'yw',sha:'642aef0c5936c5b7792fa56f72e15c9f6ca1d27d'},
  {source:'icamp',repo:'iCamp',sha:'f1a57c72c7125a7518f3d44eba76884b8f29e479'},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'8faeafbfe72339a26319361ad204819e48927304'}
] as const;
export type Ql269SourceId = typeof QL269_SOURCE_PROOF_RECHECK[number]['source'];
export const QL269_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
export const QL269_PACKET_SCHEMA = 'rosevear-comms-ql269-sanitized-evidence/v1';
const DIGEST = /^[a-f0-9]{64}$/;
const ROW_KEYS = ['source','observedMainSha','publicProofSha256','isolatedTenantFingerprintSha256',
  'nonproductionOnly','productionDataExcluded','privateOrHomeDataExcluded',
  'separateReadOnlyGetIdentity','sevenDenialsPlanned','stopRollbackReviewed'];
const exact = (value:unknown,fields:readonly string[]):value is Record<string,unknown> =>
  !!value && typeof value==='object' && !Array.isArray(value) &&
  Object.keys(value).length===fields.length &&
  Object.keys(value).every(k=>fields.includes(k));

export type Ql269SanitizedRow = {
  source:Ql269SourceId;observedMainSha:string;
  publicProofSha256:string|null;isolatedTenantFingerprintSha256:string|null;
  nonproductionOnly:boolean;productionDataExcluded:boolean;
  privateOrHomeDataExcluded:boolean;separateReadOnlyGetIdentity:boolean;
  sevenDenialsPlanned:boolean;stopRollbackReviewed:boolean;
};

/** A digest is a public *claim*, not evidence of independent origin or trust. */
export function parseQl269SanitizedPacket(raw:string):{
  status:'NOT_RECEIVED'|'ACCEPTED_UNAUTHENTICATED_CLAIMS_ONLY'|'REJECTED_MALFORMED_OR_UNSAFE';
  rows:Ql269SanitizedRow[];
  tenantFingerprintCollisionCount:number;
}{
  const empty={rows:[] as Ql269SanitizedRow[],tenantFingerprintCollisionCount:0};
  if(!raw.trim())return {status:'NOT_RECEIVED',...empty};
  if(raw.length>12000)return {status:'REJECTED_MALFORMED_OR_UNSAFE',...empty};
  try{
    const input:unknown=JSON.parse(raw);
    if(!exact(input,['schema','rows'])||input.schema!==QL269_PACKET_SCHEMA||
      !Array.isArray(input.rows)||input.rows.length!==6)throw Error('packet');
    const rows:Ql269SanitizedRow[]=[];
    for(let i=0;i<6;i++){
      const r:unknown=input.rows[i];
      const source=QL269_SOURCE_PROOF_RECHECK[i];
      if(!exact(r,ROW_KEYS)||r.source!==source.source||r.observedMainSha!==source.sha||
        !(r.publicProofSha256===null||
          typeof r.publicProofSha256==='string'&&DIGEST.test(r.publicProofSha256))||
        !(r.isolatedTenantFingerprintSha256===null||
          typeof r.isolatedTenantFingerprintSha256==='string'&&
          DIGEST.test(r.isolatedTenantFingerprintSha256))||
        !ROW_KEYS.slice(4).every(field=>typeof r[field]==='boolean'))throw Error('row');
      rows.push(r as Ql269SanitizedRow);
    }
    const tenantFingerprints=rows.map(r=>r.isolatedTenantFingerprintSha256).filter(Boolean);
    const collisions=tenantFingerprints.length-new Set(tenantFingerprints).size;
    return {status:'ACCEPTED_UNAUTHENTICATED_CLAIMS_ONLY',rows,
      tenantFingerprintCollisionCount:collisions};
  }catch{return {status:'REJECTED_MALFORMED_OR_UNSAFE',...empty};}
}

/** No caller-supplied flag is capable of switching the release decision. */
export function ql269GetTrialDecision(sanitizedPacket=''){
  const packet=parseQl269SanitizedPacket(sanitizedPacket);
  const rows=QL269_SOURCE_PROOF_RECHECK.map((source,i)=>{
    const prev=QL268_SOURCE_PROOF_RECHECK[i];
    if(source.source!==prev.source)throw Error('source registry mismatch');
    const reported=packet.rows[i];
    const scopeReported=!!reported && [
      reported.nonproductionOnly,reported.productionDataExcluded,
      reported.privateOrHomeDataExcluded,reported.separateReadOnlyGetIdentity,
      reported.sevenDenialsPlanned,reported.stopRollbackReviewed
    ].every(Boolean);
    return {
      source:source.source,repository:`RosevearCreations/${source.repo}`,
      observedMainSha:source.sha,previousQl268Sha:prev.sha,
      sourceUpdatedSinceQl268:source.sha!==prev.sha,
      originalProofPath:QL269_PROOF_PATH,
      originalSignedProofB:'HTTP_404_NOT_AVAILABLE' as const,
      reportedPublicProofDigestPresent:!!reported?.publicProofSha256,
      reportedIsolatedTenantFingerprintPresent:!!reported?.isolatedTenantFingerprintSha256,
      tenantScopePreparation:scopeReported?'CLAIMED_COMPLETE_NOT_INDEPENDENTLY_AUTHENTICATED' as const:
        'NOT_REPORTED_OR_INCOMPLETE' as const,
      sourceProofOriginAuthenticated:false,
      independentKeyPinAuthenticated:false,
      signerCustodianAndDistinctWitnessAuthenticated:false,
      independentReviewerDecisionAuthenticated:false,
      independentTenantIsolationAuthenticated:false,
      separateOwnerTestAuthorizationAuthenticated:false,
      authorizedGatewayGets:0,
      sourceConnectionEnabled:false,
      disposition:'DISCONNECTED / HOLD' as const
    };
  });
  return {
    schema:'rosevear-comms-ql269-original-proofb-isolation-get-decision/v1',
    recheckedOn:'30 October 2026 Eastern',
    sourceCount:6,originalProofB404Count:6,
    sanitizedPacketIntake:packet.status,
    reportedTenantScopeCompleteCount:rows.filter(r=>r.tenantScopePreparation.startsWith('CLAIMED')).length,
    tenantFingerprintCollisionCount:packet.tenantFingerprintCollisionCount,
    signerAndPinIndependentVerification:'NOT_RECEIVED',
    independentTenantIsolationVerification:'NOT_RECEIVED',
    realOwnerTestOnlyAuthorization:'NOT_RECEIVED',
    releaseDecision:'DENY_MISSING_ORIGINAL_PROOF_B_AND_INDEPENDENT_AUTHORIZATION' as const,
    boundedReadOnlyGetContract:'TWO_POSITIVE_SEVEN_DENIAL_PER_SOURCE_WITHIN_FIFTEEN_MINUTES' as const,
    scheduledGetWindows:0,authenticatedGatewayGets:0,
    livePilotHolds:12,integration:'DISCONNECTED / HOLD' as const,
    nextSpecificBlocker:'Original source-authenticated proof B is HTTP 404 at all six checked commits. Privately authenticate independent custodian, distinct witness, separate reviewer and pinned public key; independently attest tenant isolation and obtain owner TEST-only approval before scheduling GETs.' as const,
    rows
  };
}

export function ql269BlankSanitizedPacket():{schema:typeof QL269_PACKET_SCHEMA;rows:Ql269SanitizedRow[]}{
  return {schema:QL269_PACKET_SCHEMA,rows:QL269_SOURCE_PROOF_RECHECK.map(s=>({
    source:s.source,observedMainSha:s.sha,publicProofSha256:null,
    isolatedTenantFingerprintSha256:null,nonproductionOnly:false,
    productionDataExcluded:false,privateOrHomeDataExcluded:false,
    separateReadOnlyGetIdentity:false,sevenDenialsPlanned:false,
    stopRollbackReviewed:false
  }))};
}
