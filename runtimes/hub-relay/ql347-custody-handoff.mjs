/** QL-347: a non-authorizing, offline handoff for independently reviewed evidence.
 * This module cannot create a custody decision or activate a TEST enrollment. */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';

export const QL347_SCHEMA='rosevear.hub.ql347.custody-handoff.v1';
const SHA=/^[0-9a-f]{64}$/;
const roles=['source','master'];
const decisions=['HOLD','REJECT','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'];
const held=(state,extra={})=>({schema:QL347_SCHEMA,state,
  issuerCustodyVerified:false,ownerEnrollmentAuthorized:false,
  receiverActivated:false,databaseEnrollmentCreated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,...extra});
const hash=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const exact=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));

/** A receipt records an external decision's reference, not the decision itself.
 * Independent witness identity and issuer custody cannot be proved by this JSON. */
export function reconcileCustodyHandoff({ql346,issuerReceipt,ownerDecisions,now=Date.now()}={}){
  if(!ql346||ql346.schema!=='rosevear.hub.ql346.offline-test-readiness.v1'||
    ql346.state!=='CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD'||
    ql346.issuerSignatureCryptographicallyValid!==true||ql346.devicePinMatches!==true||
    ql346.sourceOwnerTestSignatureValid!==true||ql346.masterOwnerTestSignatureValid!==true||
    ql346.originalIssuerIndependentlyAuthenticated!==false||
    ql346.originalIssuerOutOfBandCustodyApproved!==false||
    ql346.readyForDatabaseEnrollment!==false||ql346.receiverActivated!==false||
    ql346.databaseEnrollmentCreated!==false||ql346.connected!==false||
    ql346.networkRequests!==0||ql346.customerCommunications!==false||
    ql346.deviceActions!==false||!SHA.test(ql346.ownerRequestPayloadSha256??'')||
    !SHA.test(ql346.signedEnvelopeSha256??''))
    return held('HOLD_QL346_VERIFIED_PREFLIGHT_REQUIRED');
  if(!exact(issuerReceipt,['issuerEvidenceSha256','custodyDecision','externalWitnessReference',
    'observedDeviceSpkiSha256','signedEnvelopeSha256'])||
    !SHA.test(issuerReceipt.issuerEvidenceSha256)||
    !SHA.test(issuerReceipt.observedDeviceSpkiSha256)||
    issuerReceipt.signedEnvelopeSha256!==ql346.signedEnvelopeSha256||
    issuerReceipt.custodyDecision!=='HOLD'&&issuerReceipt.custodyDecision!=='REJECT'&&
      issuerReceipt.custodyDecision!=='PENDING_INDEPENDENT_VERIFICATION'||
    typeof issuerReceipt.externalWitnessReference!=='string'||
    issuerReceipt.externalWitnessReference.length>128)
    return held('HOLD_INDEPENDENT_ISSUER_CUSTODY_REFERENCE_MISSING_OR_INVALID');
  if(!Array.isArray(ownerDecisions)||ownerDecisions.length!==2||
    ownerDecisions.some((v,i)=>!exact(v,['role','decision','requestPayloadSha256',
      'independentReviewReference','observedAt'])||v.role!==roles[i]||
      !decisions.includes(v.decision)||v.requestPayloadSha256!==ql346.ownerRequestPayloadSha256||
      typeof v.independentReviewReference!=='string'||
      v.independentReviewReference.length>128||
      !Number.isFinite(Date.parse(v.observedAt))||
      Date.parse(v.observedAt)>now))
    return held('HOLD_SEPARATE_SOURCE_MASTER_DECISIONS_REQUIRED');
  const receipt={schema:QL347_SCHEMA,
    ql346EvidenceSha256:hash({signedEnvelopeSha256:ql346.signedEnvelopeSha256,
      ownerRequestPayloadSha256:ql346.ownerRequestPayloadSha256}),
    issuerCustodyDecision:issuerReceipt.custodyDecision,
    issuerEvidenceSha256:issuerReceipt.issuerEvidenceSha256,
    ownerDecisionDigests:ownerDecisions.map(v=>({role:v.role,digest:hash(v),decision:v.decision}))};
  return held(ownerDecisions.some(v=>v.decision==='REJECT')||
    issuerReceipt.custodyDecision==='REJECT'?'REJECTED_NO_ENROLLMENT':
    'RECONCILED_OFFLINE_HANDOFF_INDEPENDENT_AUTHORITY_HOLD',{
    receipt,receiptSha256:hash(receipt),
    nextAction:'Original owners and an independent field witness must authorize any separate, supervised TEST enrollment; no execution is provided here.'});
}

export function ql347Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('OFFLINE_READ_ONLY_QL347_GUIDE',{
    command:'--reconcile QL346_READBACK.json ISSUER_CUSTODY_REFERENCE.json SOURCE_DECISION.json MASTER_DECISION.json'});
  if(args.length!==5||args[0]!=='--reconcile')throw Error('DENY_QL347_UNSUPPORTED_ACTION');
  const read=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
  return reconcileCustodyHandoff({ql346:read(args[1]),issuerReceipt:read(args[2]),
    ownerDecisions:[read(args[3]),read(args[4])]});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(ql347Cli())+'\n');}
  catch{process.stderr.write('HOLD_QL347_INVALID_OR_UNAUTHORIZED_ACTION\n');process.exitCode=1;}
}
