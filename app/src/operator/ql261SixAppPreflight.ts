/**
 * QL-261 owner packet and public-source preflight. This is NOT a gateway test,
 * cryptographic verification, authenticated custody check or owner approval.
 * Only immutable, allowlisted public GitHub URLs may be fetched on demand.
 */
import {QL258_STEPS,type Ql258App} from './ql258OwnerActionChecklist';
import {intakeQl259Packet,type Ql259Ledger} from './ql259SixAppReturnReconciliation';
import {QL260_PROOF_PATH,QL260_SOURCE_REPORTS} from './ql260NarrativeReturnTriage';

export const QL261_RELEASE='ql261-six-app-owner-packet-receipts-and-readonly-proof-preflight-held-v1';
export const QL261_GUIDE_ROOT='docs/integration/ql261';

export const QL261_GUIDES=[
  {system:'ai-data-platform',filename:'AI_DATA_PLATFORM_QL261.md',
    blocker:'Existing signer is only a candidate. Independently verify its real custody, witness, reviewer, restricted store and public SPKI pin; do not create a replacement without owner decision.'},
  {system:'devilndove',filename:'DEVIL_N_DOVE_QL261.md',
    blocker:'Provision/verify the independent source signer and witnesses. Product/Etsy draft acceptance is separate from Comms Hub trust.'},
  {system:'rosiedazzlers',filename:'ROSIE_DAZZLERS_QL261.md',
    blocker:'Return an actual owner packet and independently authenticated signer evidence. Quote/booking functionality GREEN is not connectivity proof.'},
  {system:'yw',filename:'YARD_WORKERS_QL261.md',
    blocker:'Separate the nonproduction project/tenant from the observed production landscaping company. Resolve the legacy global-admin audit only through a separate owner decision.'},
  {system:'icamp',filename:'ICAMP_QL261.md',
    blocker:'Return the missing iCamp owner packet and prove a genuinely isolated nonproduction campground and distinct signer/witness/reviewer.'},
  {system:'rosevear-ai-hub',filename:'ROSEVEAR_AI_HUB_QL261.md',
    blocker:'Authenticate key custody and pin privately; keep the Windows relay uninstalled/off and do not expose local network addresses.'}
] as const satisfies ReadonlyArray<{system:Ql258App;filename:string;blocker:string}>;

export function ql261GuidePath(system:Ql258App){
  const guide=QL261_GUIDES.find(row=>row.system===system);
  if(!guide)throw new Error('Not a recognized application');
  return `${QL261_GUIDE_ROOT}/${guide.filename}`;
}

/** Accepts only unchanged QL-258 sanitized packets, via the existing strict QL-259 parser. */
export const intakeQl261Packet=intakeQl259Packet;

/** Results are deliberately untrusted and fail closed even with six valid packets. */
export function runQl261OfflinePreflight(ledger:Ql259Ledger){
  const rows=QL260_SOURCE_REPORTS.map(source=>{
    const guide=QL261_GUIDES.find(x=>x.system===source.system)!;
    const entry=ledger[source.system];
    const selfReported=entry?QL258_STEPS.filter(x=>
      entry.progress[x.key]==='OWNER_REPORTS_DONE_NOT_VERIFIED').length:0;
    const isolatedTenantRequired=source.system==='yw'||source.system==='icamp';
    return {
      system:source.system,name:source.name,repository:source.repository,
      sourceSha:source.mainSha,guide:ql261GuidePath(source.system),
      packet:entry?'SCHEMA_VALID_SELF_REPORT_UNVERIFIED':'ORIGINAL_PACKET_NOT_RECEIVED',
      selfReportedCompletedSteps:selfReported,
      sourceRecheck:'HISTORICAL_HTTP_404_RECHECK_REQUIRED',
      signerCustody:'INDEPENDENT_AUTHENTICATION_NOT_RECEIVED',
      publicSpkiPin:'OUT_OF_BAND_WITNESS_NOT_RECEIVED',
      proofB:'ORIGINAL_SIGNED_PROOF_NOT_RECEIVED',
      nonproductionTenant:isolatedTenantRequired
        ?'SEPARATE_ISOLATED_TENANT_NOT_VERIFIED'
        :'NONPRODUCTION_ENDPOINT_NOT_AUTHENTICATED',
      ownerTest:'NOT_GIVEN',gateway:'NOT_RUN',readyForNetworkTest:false,
      nextAction:guide.blocker
    };
  });
  return {
    release:QL261_RELEASE,test:'LOCAL_PACKET_AND_PREREQUISITE_PREFLIGHT_ONLY',
    result:'COMPLETED_OFFLINE_SAFETY_CHECKS_CONNECTION_HELD',
    checkedApps:rows.length,validOriginalOwnerPackets:rows.filter(r=>
      r.packet==='SCHEMA_VALID_SELF_REPORT_UNVERIFIED').length,
    authenticatedCustodians:0,verifiedSignedProofs:0,
    verifiedSeparateTestTenants:0,authenticatedOwnerTestApprovals:0,
    authenticatedGatewayGets:0,livePilotHolds:12,connection:'DISCONNECTED',
    readyForNetworkTest:false,rows
  } as const;
}

export type Ql261PublicCheck=Readonly<{
  system:Ql258App;sourceSha:string;httpStatus:number|null;
  result:'MISSING_404'|'PUBLIC_FILE_PRESENT_UNVERIFIED'|'HTTP_ERROR_UNVERIFIED'|'NETWORK_UNKNOWN';
}>;

/** Six PUBLIC GitHub-only GETs, never an app endpoint or authenticated request. */
export async function checkQl261PublicProofs(
  request:typeof fetch=fetch):Promise<ReadonlyArray<Ql261PublicCheck>>{
  return Promise.all(QL260_SOURCE_REPORTS.map(async source=>{
    const system=source.system;
    const sourceSha=source.mainSha;
    const url=`https://raw.githubusercontent.com/RosevearCreations/${source.repository}/${sourceSha}/${QL260_PROOF_PATH}`;
    try{
      const response=await request(url,{method:'GET',credentials:'omit',
        cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});
      return {system,sourceSha,httpStatus:response.status,
        result:response.status===404?'MISSING_404'
          :response.status===200?'PUBLIC_FILE_PRESENT_UNVERIFIED'
          :'HTTP_ERROR_UNVERIFIED'} as Ql261PublicCheck;
    }catch{
      return {system,sourceSha,httpStatus:null,result:'NETWORK_UNKNOWN'} as Ql261PublicCheck;
    }
  }));
}

/** Nonsecret instructions are versioned with the six separate source-team documents. */
export function ql261AppHandoff(system:Ql258App){
  const source=QL260_SOURCE_REPORTS.find(x=>x.system===system);
  const guide=QL261_GUIDES.find(x=>x.system===system);
  if(!source||!guide)throw new Error('Unknown app');
  return [
    `Rosevear Comms Hub QL-261 — ${source.name} source-app actions`,
    `Guide in Comms Hub: ${ql261GuidePath(system)}`,
    `Source repository: RosevearCreations/${source.repository}`,
    `Observed source commit (${source.mainSha}) and ${QL260_PROOF_PATH}: HTTP 404 on 29 October 2026; refresh at a new main SHA.`,
    `Specific blocker: ${guide.blocker}`,
    'Apply the guide in your own source repository; verify with real source tests and promote source software separately.',
    'Return the exact nonsecret QL-258 owner-progress JSON. Self-reported progress is not authenticated custody.',
    'Privately authenticate a real signer custodian, separate witness/reviewer, restricted store, and out-of-band SPKI pin.',
    'A distinct operator must verify the genuine source A to signed proof B chain, immutable GitHub source and CI.',
    'Verify nonproduction endpoint isolation; Yard Workers/iCamp require independent test-tenant evidence.',
    'Comms Hub may run a local packet test and public GitHub-only GET at its observed SHA, never a gateway GET.',
    'No owner TEST-only authorization given; no private relay, live calls, SMS, dispatch, or application writes.',
    'Do not return identities, tenant data, secrets, key paths, IP addresses, passwords, or private challenge material in public files.',
    'Connection DISCONNECTED / HOLD; all 12 live pilot prerequisites HELD.'
  ].join('\n');
}
