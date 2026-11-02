import {QL303_GATES,QL303_ROWS,ql303ImmutableProofUrl} from './ql303CapabilityReadiness';
import {QL307_PUBLIC_RECHECK,ql307ReferenceError} from './ql307ProofEvidence';
import {QL308_CAPABILITY_MATRIX,QL308_ENDPOINTS,QL308_TENANT_FIXTURES,ql308Regression} from './ql308TenantContracts';
import type {Ql270SourceId} from './ql270ConnectionCentre';

export const QL309_REQUIRED_EVIDENCE=[
  {id:'ORIGINAL_PROOF_B',title:'Original signed Proof-B',reason:'Immutable public path is missing; a 200 alone would still require signature verification.'},
  {id:'INDEPENDENT_ORIGIN',title:'Independent issuer / custodian / reviewer',reason:'Authenticated roles, key pin, witness and custody chain have not been established.'},
  {id:'TENANT_SCOPE',title:'Isolated nonproduction tenant',reason:'Fictional QL-308 aliases are not registered or authorized tenants.'},
  {id:'SCOPED_GET',title:'Scoped GET-only identity',reason:'No credential, private endpoint, or granted test capability is installed.'},
  {id:'OWNER_TEST',title:'Explicit owner TEST-only decision',reason:'This build request permits a software release, not private GET execution or pilot connection.'}
] as const;

export type Ql309ReviewDisposition='AWAITING_EXTERNAL_EVIDENCE'|'REFER_TO_INDEPENDENT_REVIEWER'|'OWNER_DECISION_REQUIRED';
export type Ql309LocalEntry={source:Ql270SourceId;reference:string;disposition:Ql309ReviewDisposition};

export const QL309_PACKET_ROWS=QL303_ROWS.map(source=>{
  const proof=QL307_PUBLIC_RECHECK.find(row=>row.source===source.id);
  const contract=QL308_CAPABILITY_MATRIX.find(row=>row.source===source.id);
  if(!proof||!contract)throw Error('QL309_MISSING_SOURCE_LINEAGE');
  return {id:source.id,label:source.label,kind:source.kind,proofSha:proof.sha,proofHttp:proof.http,
    proofAt:proof.observedAt,proofUrl:ql303ImmutableProofUrl(source.id),
    fixtureAlias:QL308_TENANT_FIXTURES.find(row=>row.source===source.id)?.alias??null,
    contractMethods:contract.allowedMethods,contractEndpoints:contract.allowedEndpoints,
    sourcePermission:'DENIED' as const,connection:'DISCONNECTED / HOLD' as const,
    approvedGates:0,requiredGates:QL303_GATES.length};
});

export function ql309PreflightPacket(source:Ql270SourceId,local?:Ql309LocalEntry){
  const row=QL309_PACKET_ROWS.find(item=>item.id===source);
  if(!row)throw Error('UNKNOWN_SOURCE');
  const matching=local?.source===source?local:undefined;
  const checks=QL309_REQUIRED_EVIDENCE.map(item=>({...item,state:'NOT_VERIFIED' as const}));
  return {...row,checks,reviewReference:matching?.reference??null,
    localDisposition:matching?.disposition??'AWAITING_EXTERNAL_EVIDENCE' as Ql309ReviewDisposition,
    outcome:'NO_GO_REQUIRES_EXTERNAL_VERIFICATION' as const,grant:'NONE' as const,
    method:'GET_DESIGN_ONLY' as const,requestCount:0,externalSends:0,ownerApproval:false,
    signedProofAccepted:false,reviewerAuthenticated:false,credentialPresent:false,
    customerDataAccess:false,enabled:false};
}

export function ql309RecordLocalReview(entries:readonly Ql309LocalEntry[],source:Ql270SourceId,reference:string,disposition:Ql309ReviewDisposition){
  if(!QL309_PACKET_ROWS.some(row=>row.id===source))return {entries,error:'Unknown source'};
  if(!(['AWAITING_EXTERNAL_EVIDENCE','REFER_TO_INDEPENDENT_REVIEWER','OWNER_DECISION_REQUIRED'] as string[]).includes(disposition))return {entries,error:'Unknown review disposition'};
  const error=ql307ReferenceError(reference);
  if(error)return {entries,error};
  const next={source,reference:reference.trim(),disposition};
  return {entries:[...entries.filter(entry=>entry.source!==source),next],error:null};
}

export function ql309PreflightSummary(entries:readonly Ql309LocalEntry[]=[]){
  const packets=QL309_PACKET_ROWS.map(row=>ql309PreflightPacket(row.id,entries.find(entry=>entry.source===row.id)));
  return {sources:packets.length,businesses:packets.filter(row=>row.fixtureAlias!==null).length,
    supporting:packets.filter(row=>row.fixtureAlias===null).length,
    missingProofs:packets.filter(row=>row.proofHttp===404).length,
    requiredPerSource:QL309_REQUIRED_EVIDENCE.length,independentlyVerified:0,ownerApproved:0,
    localReviews:entries.length,sourceGETs:0,connections:0,externalSends:0,
    isolatedMockContractCases:ql308Regression().cases,release:'DISCONNECTED / HOLD' as const};
}

export function ql309PacketText(source:Ql270SourceId,local?:Ql309LocalEntry){
  const packet=ql309PreflightPacket(source,local);
  return [`QL-309 · UNSENT / UNAUTHORIZED NONPRODUCTION PREFLIGHT`,
    `Source: ${packet.label} (${packet.kind})`,
    `Pinned public proof: HTTP ${packet.proofHttp} at ${packet.proofSha} on ${packet.proofAt}`,
    `Source role: ${packet.fixtureAlias?'fictional business alias '+packet.fixtureAlias:'supporting service; no customer tenant'}`,
    `Capability design: ${QL308_ENDPOINTS.map(item=>`GET ${item.path}`).join(', ')}`,
    ...packet.checks.map(item=>`${item.title}: ${item.state}`),
    `Local reference: ${packet.reviewReference??'NONE'} (${packet.localDisposition})`,
    `Decision: ${packet.outcome}; no credential, no owner TEST authorization, no real gateway request.`].join('\n');
}
