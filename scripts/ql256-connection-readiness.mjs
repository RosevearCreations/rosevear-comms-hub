/**
 * QL-256: offline decision helpers for REAL signer provisioning, independent
 * custody roles and a proposed owner TEST window. No key generation, network,
 * scheduling, credentials, identity verification or gateway operations.
 */
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';

export const QL256_RELEASE = 'ql256-original-signer-role-owner-test-scheduling-held-v1';
export const QL256_OBSERVED_AT = '2026-10-29T14:09:17Z';
export const QL256_PUBLIC_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
const SOURCE_SNAPSHOT = [
  {system:'ai-data-platform',repository:'ai-data-platform',mainSha:'c658bce8c207dcbfdf6c9afa5f304428dd3e31d3'},
  {system:'devilndove',repository:'devilndove-site',mainSha:'5017939f3b63e3f63d79a83f34357956cbafd0b4'},
  {system:'rosiedazzlers',repository:'rosiedazzlers',mainSha:'79751649527a3b4a887ce252f8a1c5b93a9434bd'},
  {system:'yw',repository:'yw',mainSha:'2c7b07037beb1b0ac239eb1b994cb6a87fd1923e'},
  {system:'icamp',repository:'iCamp',mainSha:'32b7c466ad34f7018863c8b837f94c5a3b1103a5'},
  {system:'rosevear-ai-hub',repository:'rosevear-ai-hub',mainSha:'9cac2ebcb386bec7dfcf2379acb0998c531c6aa1'}
];
export const QL256_PUBLIC_SNAPSHOT = Object.freeze(SOURCE_SNAPSHOT.map(row =>
  Object.freeze({ ...row, proofHttpStatus: 404, signer: 'NOT_VERIFIED',
    custody: 'NOT_VERIFIED', ownerTest: 'NOT_GIVEN', connection: 'DISCONNECTED' })));

const SHA = /^[a-f0-9]{40}$/;
const ALIAS = /^[a-z][a-z0-9_-]{5,70}$/;
const FIELDS = ['system','repository','mainSha','sourceASha','sourceCiUrl',
  'signerDecision','proofBSha','proofHttpStatus','custodianAlias',
  'witnessAlias','reviewerAlias'];
const exact = (v,fields) => v && typeof v==='object' && !Array.isArray(v) &&
  Object.getPrototypeOf(v)===Object.prototype &&
  Object.keys(v).length===fields.length && Object.keys(v).every(k=>fields.includes(k));
const held = (status,reason,extra={}) => Object.freeze({
  release: QL256_RELEASE,status,reason,...extra,
  originalProofsAccepted:0,realSignersAuthenticated:0,
  independentCustodiansAuthenticated:0,ownerTestAuthorization:'NOT_GIVEN',
  scheduledWindows:0,actualGatewayGets:0,connection:'DISCONNECTED',
  relayEnabled:false,livePilotHolds:12,writes:0,calls:0,sms:0,dispatch:0
});

/** Zero network: a declaration that a signer needs provisioning is not a signature. */
export function inspectQl256SignerAndRoleDecisions(rows) {
  if(!Array.isArray(rows) || rows.length!==6 || !QL247_SOURCES.every((s,i)=>{
    const r=rows[i];
    return exact(r,FIELDS) && r.system===s.system && r.repository===s.repository &&
      SHA.test(r.mainSha||'') &&
      (r.sourceASha===null || SHA.test(r.sourceASha||'')) &&
      (r.proofBSha===null || SHA.test(r.proofBSha||'')) &&
      (r.sourceCiUrl===null || typeof r.sourceCiUrl==='string' &&
        new RegExp(`^https://github\\.com/RosevearCreations/${s.repository}/actions/runs/[0-9]+$`).test(r.sourceCiUrl)) &&
      ['SIGNER_NOT_PROVISIONED','SIGNER_EXISTS_CUSTODY_NOT_VERIFIED','SIGNER_STATUS_UNKNOWN']
        .includes(r.signerDecision) &&
      [404,null].includes(r.proofHttpStatus) &&
      [r.custodianAlias,r.witnessAlias,r.reviewerAlias].every(v=>v===null || ALIAS.test(v)) &&
      (r.custodianAlias===null && r.witnessAlias===null && r.reviewerAlias===null ||
        [r.custodianAlias,r.witnessAlias,r.reviewerAlias].every(Boolean) &&
        new Set([r.custodianAlias,r.witnessAlias,r.reviewerAlias]).size===3);
  })) return held('DENIED_SIX_APP_SIGNER_OR_ROLE_SCHEMA',
    'Six exact ordered source decisions with distinct or wholly unassigned private roles are required.');
  const actions=rows.map(row=>Object.freeze({system:row.system,repository:row.repository,
    observedMainSha:row.mainSha,
    signerDecision:row.signerDecision,
    originalProof:row.proofHttpStatus===404?'PUBLIC_404':'NOT_RECHECKED',
    privateRoleAssignment:row.custodianAlias===null?'NOT_ASSIGNED':'PROPOSED_UNVERIFIED',
    nextAction:row.signerDecision==='SIGNER_NOT_PROVISIONED'
      ? 'AUTHORIZED_PRIVATE_KEY_PROVISIONING_AND_INDEPENDENT_CUSTODIAN_REQUIRED'
      : 'INDEPENDENTLY_VERIFY_REAL_SIGNER_AND_CUSTODIAN_BEFORE_SIGNING',
    finalConnection:'DISCONNECTED'}));
  return held('SIX_SIGNER_PROVISIONING_AND_ROLE_DECISIONS_HELD',
    'Names, source CI and repository writes alone do not verify signing-key custody or authorise TEST.',
    {actions:Object.freeze(actions),unassignedRoles:actions.filter(a=>a.privateRoleAssignment==='NOT_ASSIGNED').length});
}

const WINDOW_FIELDS=['schemaVersion','requestId','system','repository','environment',
  'startUtc','endUtc','methods','paths','ownerDecision','ownerReceiptId',
  'dedicatedCredentialPlanned','outboundPrivateOnly','rollbackDocumented',
  'relayEnabled','includesLiveData','ownerPilotEnabled'];
const PATHS=['/api/integration/v1/health','/api/integration/v1/capabilities'];
const ID=/^np-[a-z0-9-]{6,70}$/;

/** A schedule proposal never creates a booking or grants owner permission. */
export function inspectQl256TrialSchedulingRequest(roleDecision,request,{now=Date.now()}={}) {
  if(!exact(request,WINDOW_FIELDS) || !Number.isSafeInteger(now) || now<=0)
    return held('DENIED_TEST_WINDOW_SCHEMA','Exact offline TEST window request required.');
  const source=QL247_SOURCES.find(s=>s.system===request.system);
  if(!source || request.schemaVersion!=='rosevear.ql256.owner-test-window-request.v1' ||
    request.repository!==source.repository || !ID.test(request.requestId||'') ||
    request.environment!=='nonproduction' ||
    JSON.stringify(request.methods)!=='["GET"]' ||
    JSON.stringify(request.paths)!==JSON.stringify(PATHS) ||
    request.ownerDecision!=='NOT_GIVEN_REQUEST_PRIVATE_REVIEW' ||
    request.ownerReceiptId!==null ||
    typeof request.startUtc!=='string' || typeof request.endUtc!=='string' ||
    !Number.isFinite(Date.parse(request.startUtc)) ||
    !Number.isFinite(Date.parse(request.endUtc)) ||
    Date.parse(request.startUtc)<=now ||
    Date.parse(request.endUtc)<=Date.parse(request.startUtc) ||
    Date.parse(request.endUtc)-Date.parse(request.startUtc)>30*60*1000 ||
    request.dedicatedCredentialPlanned!==true || request.outboundPrivateOnly!==true ||
    request.rollbackDocumented!==true || request.relayEnabled!==false ||
    request.includesLiveData!==false || request.ownerPilotEnabled!==false)
    return held('DENIED_WINDOW_SCOPE_OR_FALSE_AUTHORIZATION',
      'Future <=30-minute GET-only scope with no claimed owner approval, activation or live data required.');
  if(roleDecision?.status!=='SIX_SIGNER_PROVISIONING_AND_ROLE_DECISIONS_HELD' ||
    !roleDecision.actions?.some(a=>a.system===request.system &&
      a.repository===request.repository))
    return held('UPSTREAM_SIGNER_ROLE_DECISION_MISSING_HELD',
      'Owner TEST request must be tied to the six-app signer and custody decision review.');
  return held('OWNER_TEST_WINDOW_PRIVATE_APPROVAL_REQUEST_ONLY_HELD',
    'This is a scheduling proposal, not a booked job, authenticated owner approval or permission for any GET.',
    {requestId:request.requestId,system:request.system,requestedStartUtc:request.startUtc,
      requestedEndUtc:request.endUtc});
}

export function ql256CurrentHeldSnapshot(){
  const rows=QL256_PUBLIC_SNAPSHOT.map(s=>({system:s.system,repository:s.repository,
    mainSha:s.mainSha,sourceASha:null,sourceCiUrl:null,signerDecision:'SIGNER_STATUS_UNKNOWN',
    proofBSha:null,proofHttpStatus:s.proofHttpStatus,custodianAlias:null,
    witnessAlias:null,reviewerAlias:null}));
  return inspectQl256SignerAndRoleDecisions(rows);
}
