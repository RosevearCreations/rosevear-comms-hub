import {QL329_MASTER,QL329_SHELLS,QL329_SUPPORT} from './ql329MasterShellTruth';

/**
 * QL-330 closeout: an in-memory, review-only definition for a future database-backed
 * control plane. No credential resolution, external requests, tenant provisioning,
 * OAuth grant, persistence, or operator approval is implemented here.
 */
export const QL330_STATUS={
  batchTarget:20,previousVerified:19,currentClaimed:19,
  activeConnections:0,authenticatedShells:0,provisionedMaster:false,
  ownerSignedTestGrants:0,sourceSignedProofsVerified:0,portalEvents:0,
  reportingFactRows:0,privateGets:0,sourceWrites:0,credentialReads:0,
  remoteProcedureEdits:0,ack:'UNDER_REVIEW / PARKED_FOR_LATER',
  windowsRelay:'OFF'
} as const;

export const QL330_STEP_LIBRARY=[
  {id:'discover_manifest',label:'Discover nonsecret source manifest',automation:'AUTOMATIC',gate:'PINNED_SOURCE_IDENTITY'},
  {id:'verify_issuer',label:'Verify original source-signed issuer & custody',automation:'REQUIRES_EXTERNAL_PROOF',gate:'ORIGINAL_PROOF_B'},
  {id:'approve_test',label:'Verify exact owner and source-owner TEST authorization',automation:'REQUIRES_HUMAN_AUTHORITY',gate:'OWNER_AND_SOURCE_APPROVAL'},
  {id:'resolve_vault',label:'Resolve scoped credential by managed key handle',automation:'AUTOMATIC_AFTER_GRANTS',gate:'MANAGED_KMS_AND_VAULT'},
  {id:'probe_readonly',label:'Perform pinned read-only TEST GET',automation:'AUTOMATIC_AFTER_GRANTS',gate:'SIGNED_TENANT_SCOPED_TEST'},
  {id:'verify_receipt',label:'Verify signed readback, audit and replay denials',automation:'AUTOMATIC_AFTER_GRANTS',gate:'INDEPENDENT_RECEIPT'},
  {id:'enable_scoped',label:'Record approval for scoped read-only activation',automation:'REQUIRES_HUMAN_AUTHORITY',gate:'PRODUCTION_CHANGE_APPROVAL'},
  {id:'portal_scope',label:'Check child portal delegation and consent',automation:'REQUIRES_HUMAN_AUTHORITY',gate:'CHILD_SCOPED_GRANT'},
  {id:'portal_readback',label:'Reconcile tenant-owned portal activity',automation:'AUTOMATIC_AFTER_GRANTS',gate:'AUTHENTICATED_SOURCE_DATA'},
  {id:'report_freshness',label:'Calculate approved reporting freshness and lineage',automation:'AUTOMATIC_AFTER_GRANTS',gate:'SIGNED_SOURCE_LINEAGE'},
  {id:'report_export',label:'Export only explicitly approved report scope',automation:'REQUIRES_HUMAN_AUTHORITY',gate:'REPORT_ACCESS_GRANT'},
  {id:'measure_latency',label:'Measure gateway latency and record a safe performance budget',automation:'AUTOMATIC_AFTER_GRANTS',gate:'MEASURED_NONPRODUCTION'},
  {id:'pause_on_failure',label:'Stop, retain evidence and quarantine failed source',automation:'AUTOMATIC',gate:'FAIL_CLOSED'},
  {id:'review_followup',label:'Track owner next action and independent evidence',automation:'AUTOMATIC',gate:'REVIEW_ONLY'}
] as const;
export type Ql330StepId=typeof QL330_STEP_LIBRARY[number]['id'];
export const QL330_IMMUTABLE_CONNECT_GATES=[
 'verify_issuer','approve_test','resolve_vault','probe_readonly','verify_receipt','enable_scoped'
] as const;
export const QL330_PROCEDURES=[
 {id:'connect-readonly',version:1,label:'Shell onboarding and encrypted read-only TEST',
  purpose:'CONNECTION',scope:'SHELL',status:'DRAFT_NOT_APPLIED',
  steps:['discover_manifest','verify_issuer','approve_test','resolve_vault','probe_readonly','verify_receipt','enable_scoped','pause_on_failure']},
 {id:'client-portal-tracking',version:1,label:'Child-safe portal activity tracking',
  purpose:'PORTAL',scope:'CHILD_AFTER_SHELL_GRANT',status:'DRAFT_NOT_APPLIED',
  steps:['verify_issuer','approve_test','portal_scope','portal_readback','report_freshness','pause_on_failure']},
 {id:'management-reporting',version:1,label:'Source-grounded management/statistical reports',
  purpose:'REPORT',scope:'APPROVED_AGGREGATE_ONLY',status:'DRAFT_NOT_APPLIED',
  steps:['verify_issuer','approve_test','report_freshness','report_export','pause_on_failure']}
] as const;
export type Ql330ProcedureId=typeof QL330_PROCEDURES[number]['id'];
export type Ql330ProcedureDraft={
 id:Ql330ProcedureId;version:number;steps:readonly Ql330StepId[];
 status:'DRAFT_NOT_APPLIED';parentVersion:number|null;changeReason:string;
 approved:false;persisted:false;connectionEnabled:false
};
const requiredById:Record<Ql330ProcedureId,readonly Ql330StepId[]>={
 'connect-readonly':QL330_IMMUTABLE_CONNECT_GATES,
 'client-portal-tracking':['verify_issuer','approve_test','portal_scope','portal_readback','pause_on_failure'],
 'management-reporting':['verify_issuer','approve_test','report_freshness','report_export','pause_on_failure']
};
const maxSteps=18;
export const QL330_REVISION_OPTIONS=[
 {id:'add_review',label:'Add independent review follow-up',step:'review_followup'},
 {id:'add_freshness',label:'Add reporting freshness review',step:'report_freshness'},
 {id:'add_latency',label:'Add nonproduction latency review',step:'measure_latency'},
 {id:'add_failure',label:'Add explicit fail-closed checkpoint',step:'pause_on_failure'}
] as const;

export function ql330InitialDraft(id:Ql330ProcedureId):Ql330ProcedureDraft{
 const source=QL330_PROCEDURES.find(p=>p.id===id);
 if(!source)throw Error('UNKNOWN_PROCEDURE');
 return {id,version:1,steps:[...source.steps],status:'DRAFT_NOT_APPLIED',parentVersion:null,
  changeReason:'Baseline source-controlled procedure',approved:false,persisted:false,connectionEnabled:false};
}
/** Never removes mandatory gates, changes a signed procedure in place, or elevates authority. */
export function ql330ProposeRevision(base:Ql330ProcedureDraft,
 option:typeof QL330_REVISION_OPTIONS[number]['id']):Ql330ProcedureDraft{
 const chosen=QL330_REVISION_OPTIONS.find(x=>x.id===option);
 if(!chosen)throw Error('UNKNOWN_SAFE_REVISION');
 if(base.version<1||base.version>100||!Number.isSafeInteger(base.version))throw Error('INVALID_VERSION');
 if(!QL330_PROCEDURES.some(x=>x.id===base.id))throw Error('UNKNOWN_PROCEDURE');
 const steps=[...base.steps];
 if(steps.length>maxSteps||new Set(steps).size!==steps.length||
   steps.some(s=>!QL330_STEP_LIBRARY.some(x=>x.id===s))||
   requiredById[base.id].some(step=>!steps.includes(step)))throw Error('UNSAFE_BASE_PROCEDURE');
 const positions=requiredById[base.id].map(step=>steps.indexOf(step));
 if(positions.some((position,i)=>i>0&&position<positions[i-1]))throw Error('UNSAFE_GATE_ORDER');
 if(steps.includes(chosen.step))throw Error('UNCHANGED_PROCEDURE');
 {
   if(steps.length===maxSteps)throw Error('MAX_PROCEDURE_STEPS');
   // Insert review-only additions before the stop checkpoint. Mandatory gate order remains unchanged.
   const stopIndex=steps.indexOf('pause_on_failure');
   steps.splice(stopIndex>=0?stopIndex:steps.length,0,chosen.step);
 }
 return {id:base.id,version:base.version+1,steps,status:'DRAFT_NOT_APPLIED',
   parentVersion:base.version,changeReason:chosen.label,approved:false,persisted:false,connectionEnabled:false};
}

export const QL330_SHELLS=QL329_SHELLS.map(shell=>({
  id:shell.id,label:shell.label,ownerExample:shell.ownerChild,connectionIdentity:'SHELL',
  sourceRepository:shell.repository,status:'DISCONNECTED / HOLD',
  childAccess:'NOT_AUTHORIZED',vaultHandle:'NOT_PROVISIONED',proof:'UNVERIFIED',
  approvedProcedures:0,privateGets:0
}));
export const QL330_SUPPORT=QL329_SUPPORT.map(service=>({
 id:service.id,label:service.label,scope:'SUPPORT_NO_CUSTOMER_TENANT',
 status:'DISCONNECTED / HOLD',secretHandle:'NOT_PROVISIONED'
}));
export const QL330_PORTAL_EVENTS=[
  {kind:'portal_sign_in',requires:'VERIFIED_CHILD_MEMBERSHIP',exportsPII:false},
  {kind:'booking_or_job_status_view',requires:'SOURCE_OWNED_ROLE',exportsPII:false},
  {kind:'client_message_request',requires:'TENANT_CONSENT_AND_SEND_APPROVAL',exportsPII:false},
  {kind:'service_case_created',requires:'SOURCE_OWNED_CASE_ACCESS',exportsPII:false},
  {kind:'report_accessed',requires:'PER_REPORT_ACCESS_GRANT',exportsPII:false}
] as const;
export const QL330_REPORTS=[
 {id:'connection-health',label:'Connection/readiness',grain:'shell',required:'SIGNED_HEALTH_RECEIPT'},
 {id:'client-portal-activity',label:'Client portal journey',grain:'child tenant',required:'CONSENTED_PORTAL_EVENTS'},
 {id:'customer-operations',label:'Job/booking/customer interactions',grain:'authorized child',required:'SCOPED_SOURCE_AGGREGATE'},
 {id:'communications',label:'Comms handoff & task workload',grain:'authorized shell',required:'CONSENT_AND_PROVIDER_RECEIPTS'},
 {id:'management-margin',label:'Financial/operating review',grain:'approved aggregate',required:'FINANCE_OWNER_GRANT'},
 {id:'security-audit',label:'Denied access and response trends',grain:'shell',required:'SIGNED_AUDIT_LINEAGE'}
] as const;
export type Ql330Audience='master'|'shell'|'child'|'support';
export type Ql330ViewRequest={sourceId:string;audience:Ql330Audience;childId?:string|null;masterSessionVerified:boolean;ownerGrantVerified:boolean;sourceProofVerified:boolean};
export type Ql330ViewDecision={decision:'DENY_UNPROVISIONED_MASTER'|'DENY_UNKNOWN_SOURCE'|'DENY_SUPPORT_CUSTOMER'|
 'DENY_CHILD_AS_CONNECTOR'|'DENY_MISSING_AUTHORITY'|'HOLD_READ_ONLY_PLAN';
 status:'DISCONNECTED / HOLD';calls:0;writes:0;secretReads:0;customerEvents:0;approved:false};
export function ql330ReviewScope(input:Ql330ViewRequest):Ql330ViewDecision{
 const shell=QL330_SHELLS.find(x=>x.id===input.sourceId);
 const support=QL330_SUPPORT.find(x=>x.id===input.sourceId);
 let decision:Ql330ViewDecision['decision']='DENY_UNPROVISIONED_MASTER';
 if(!shell&&!support)decision='DENY_UNKNOWN_SOURCE';
 else if(support&&input.audience==='child')decision='DENY_SUPPORT_CUSTOMER';
 else if(input.audience==='child')decision='DENY_CHILD_AS_CONNECTOR';
 else if(!input.masterSessionVerified||!QL329_MASTER.provisioned)decision='DENY_UNPROVISIONED_MASTER';
 else if(!input.ownerGrantVerified||!input.sourceProofVerified)decision='DENY_MISSING_AUTHORITY';
 else decision='HOLD_READ_ONLY_PLAN';
 return {decision,status:'DISCONNECTED / HOLD',calls:0,writes:0,secretReads:0,customerEvents:0,approved:false};
}
export function ql330Readback(){
 const sourceIds=[...QL330_SHELLS.map(x=>x.id),...QL330_SUPPORT.map(x=>x.id)];
 const proposed=QL330_PROCEDURES.map(x=>ql330InitialDraft(x.id));
 return {batchCompletedBeforeFinal:QL330_STATUS.previousVerified,batchTarget:QL330_STATUS.batchTarget,
  fourShells:QL330_SHELLS.length,twoSupports:QL330_SUPPORT.length,
  uniqueSources:new Set(sourceIds).size,procedures:proposed.length,
  proceduresAllUnapproved:proposed.every(x=>!x.approved&&!x.persisted&&!x.connectionEnabled),
  mandatoryGatesPinned:QL330_IMMUTABLE_CONNECT_GATES.every(s=>proposed[0].steps.includes(s)),
  portalSchemas:QL330_PORTAL_EVENTS.length,reportDefinitions:QL330_REPORTS.length,
  allHeld:[...QL330_SHELLS,...QL330_SUPPORT].every(x=>x.status==='DISCONNECTED / HOLD'),
  masterProvisioned:QL329_MASTER.provisioned,liveConnections:0,sourceGets:0,sourceWrites:0,
  realClientRecords:0,credentialReads:0,ack:'UNDER_REVIEW / PARKED_FOR_LATER',
  ownerDeviceAcceptance:false};
}
