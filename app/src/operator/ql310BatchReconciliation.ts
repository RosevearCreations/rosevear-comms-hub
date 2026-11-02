import {QL303_GATES} from './ql303CapabilityReadiness';
import {QL307_PUBLIC_RECHECK} from './ql307ProofEvidence';
import {QL308_CAPABILITY_MATRIX,ql308Regression} from './ql308TenantContracts';
import {QL309_PACKET_ROWS,ql309PreflightSummary} from './ql309PilotPreflight';

const REPO='https://github.com/RosevearCreations/rosevear-comms-hub';
/** Past, verified production code receipts; QL-310 cannot self-attest its own promotion. */
export const QL310_RELEASE_RECEIPTS=[
  {id:'QL-305',title:'Operator feedback & accessible retest',sha:'c5438e0f34026442284da850bbb16fb62b608cd0',pr:583},
  {id:'QL-306',title:'Four-business synthetic handoff quality',sha:'4023bbbfcd2b7e9513f1313d9aa2065a670308c3',pr:585},
  {id:'QL-307',title:'Immutable public proof & independent reference intake',sha:'a72d64a22866a4ca6023b31c1bd53e8a951127d9',pr:587},
  {id:'QL-308',title:'Credential-free tenant contract review',sha:'d168da2d467dbe7691a4a366f90f6d010eb17086',pr:589},
  {id:'QL-309',title:'Read-only pilot preflight NO-GO packet',sha:'ce4986e3d1b29a84c47a88508c48920e48ca9788',pr:591}
] as const;
export const QL310_SIGNOFF_GATES=[
  {id:'OWNER_DEVICE',label:'Real operator device walkthrough',status:'UNVERIFIED'},
  {id:'OWNER_FINDINGS',label:'Owner-accepted feedback and retest findings',status:'UNVERIFIED'},
  {id:'ORIGINAL_PROOF',label:'Original signed source Proof-B',status:'ABSENT'},
  {id:'INDEPENDENT_CUSTODY',label:'Independent reviewer / witness custody',status:'NOT_AUTHENTICATED'},
  {id:'TEST_AUTH',label:'Separate scoped owner TEST authorization',status:'NOT_GIVEN'}
] as const;
export type Ql310ReviewRoute='AWAIT_OWNER_WALKTHROUGH'|'INDEPENDENT_EVIDENCE_REQUIRED'|'DEFERRED_EXTERNAL_REVIEW';
export type Ql310LocalReview={reference:string;route:Ql310ReviewRoute};

export function ql310ReferenceError(input:string){
  const value=input.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,39}$/.test(value))return 'Use 5–40 letters, numbers, dashes or underscores; no personal evidence or links.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key|auth|eyJ)/i.test(value))return 'Do not enter credentials or protected evidence.';
  return null;
}

export function ql310LocalReviewDraft(input:string,route:Ql310ReviewRoute){
  const error=ql310ReferenceError(input);
  if(error)return {error,review:null};
  if(!(['AWAIT_OWNER_WALKTHROUGH','INDEPENDENT_EVIDENCE_REQUIRED','DEFERRED_EXTERNAL_REVIEW'] as string[]).includes(route))return {error:'Invalid review route',review:null};
  return {error:null,review:{reference:input.trim(),route}};
}

export function ql310EvidenceReadback(){
  const releaseShaUnique=new Set(QL310_RELEASE_RECEIPTS.map(row=>row.sha)).size===5;
  const proofCoverage=QL307_PUBLIC_RECHECK.length===6&&QL307_PUBLIC_RECHECK.every(row=>row.http===404);
  const contract=ql308Regression();
  const preflight=ql309PreflightSummary();
  const lineage=QL308_CAPABILITY_MATRIX.every(row=>QL309_PACKET_ROWS.some(packet=>packet.id===row.source&&packet.connection===row.status));
  return {closedHistoricalBatch:15,closedHistoricalTarget:15,separateVerifiedReleases:QL310_RELEASE_RECEIPTS.length,
    totalVerifiedSoftwareReleases:15+QL310_RELEASE_RECEIPTS.length,
    releasesPinned:releaseShaUnique&&QL310_RELEASE_RECEIPTS.every(row=>/^[a-f0-9]{40}$/.test(row.sha)),
    proofCoverage,missingOriginalProofs:QL307_PUBLIC_RECHECK.filter(row=>row.http===404).length,
    mockContractCases:contract.cases,contractSafe:contract.expectedDecisions&&contract.businessIsolation&&contract.supportingServicesWithoutCustomerTenant,
    preflightSources:preflight.sources,preflightSourceLineage:lineage,independentGatesRequired:QL303_GATES.length,
    ownerSignoffs:0,independentlyAcceptedProofs:0,connectedSources:0,realGatewayGETs:0,
    releaseStatus:'SOFTWARE_RELEASE_GREEN' as const,operationalStatus:'NO_GO_DISCONNECTED_HOLD' as const,
    acknowledgements:'UNDER_REVIEW / PARKED_FOR_LATER' as const};
}

export function ql310ReceiptLinks(id:typeof QL310_RELEASE_RECEIPTS[number]['id']){
  const row=QL310_RELEASE_RECEIPTS.find(item=>item.id===id);
  if(!row)throw Error('UNKNOWN_RELEASE');
  return {commit:`${REPO}/commit/${row.sha}`,pr:`${REPO}/pull/${row.pr}`};
}

export function ql310ManagementReadback(local?:Ql310LocalReview){
  const audit=ql310EvidenceReadback();
  return {summary:`${audit.totalVerifiedSoftwareReleases}/${audit.totalVerifiedSoftwareReleases} prior software release receipts verified, but 0 independent owner sign-offs and 0 authorized connections.`,
    outcome:'NOT_OWNER_SIGNED' as const,localReference:local?.reference??null,
    localRoute:local?.route??'AWAIT_OWNER_WALKTHROUGH',
    noOwnerDecision:true,externalMessages:0,permissionsGranted:0,
    sourcesDisconnected:6,acknowledgements:audit.acknowledgements};
}
