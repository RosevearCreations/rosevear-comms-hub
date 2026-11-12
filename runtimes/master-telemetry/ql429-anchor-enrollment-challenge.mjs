import {createHash,createPublicKey,verify,randomBytes} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {recheckQl428IndependentCustody} from './ql428-external-anchor-reentry.mjs';

const ID=/^[A-Za-z0-9_-]{12,96}$/;
const HEX=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const FRESH=60000;
const dig=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const exact=(o,ks)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===ks.length&&ks.every(k=>Object.hasOwn(o,k));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hold=(reason,receiver='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED')=>({
 state:'HOLD',reason,receiver,connection:'HOLD',ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const validScope=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&s.sourceId==='rosevear-ai-hub'&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
const isIso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s;
const fresh=(s,now)=>Number.isSafeInteger(now)&&isIso(s)&&Date.parse(s)<=now&&now-Date.parse(s)<=FRESH;
function keyValid(pin){
 try{
  if(typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');if(der.toString('base64')!==pin)return false;
  return createPublicKey({key:der,format:'der',type:'spki'}).asymmetricKeyType==='ed25519';
 }catch{return false;}
}
function signatureValid(p,s,pin){
 try{return keyValid(pin)&&typeof s==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(s)&&
  verify(null,Buffer.from(JSON.stringify(p)),createPublicKey({
   key:Buffer.from(pin,'base64'),format:'der',type:'spki'}),Buffer.from(s,'base64'));
 }catch{return false;}
}
const validPins=p=>exact(p,['anchor','reader','originalHost','masters'])&&
 exact(p.masters,MASTERS)&&
 [p.anchor,p.reader,p.originalHost,...MASTERS.map(m=>p.masters[m])].every(keyValid)&&
 new Set([p.anchor,p.reader,p.originalHost,...MASTERS.map(m=>p.masters[m])]).size===6;
const validEnrollment=p=>exact(p,['schema','externalStoreId','anchorId','originalHostMachineId',
 'pins','ownerId','reviewerId','createdAt'])&&
 p.schema==='rosevear.ql429.external-anchor-enrollment.v1'&&
 ID.test(p.externalStoreId??'')&&ID.test(p.anchorId??'')&&
 p.originalHostMachineId==='DESKTOP-AE894KC'&&validPins(p.pins)&&
 PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
 p.ownerId!==p.reviewerId&&isIso(p.createdAt);
/** Immutable original-device custody: one enrollment, one challenge, one
 * witnessed re-entry per ID. Never stores private keys. A privileged disk
 * operator can remove records; externally witness resulting hashes. */
export function openQl429ProtectedEnrollmentLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_LEDGER_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('UNSAFE_QL429_LEDGER_DIRECTORY');
 const pathname=(type,id)=>{
  if(!['enrollment','challenge','witness'].includes(type)||!ID.test(id??''))
   throw Error('INVALID_QL429_LEDGER_KEY');
  return join(root,'ql429-'+type+'-'+id+'.json');
 };
 const read=(type,id)=>{
  let raw;try{raw=readFileSync(pathname(type,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>12000)throw Error('QL429_LEDGER_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL429_LEDGER_RECORD_CORRUPT');}
  if(!exact(rec,['schema','type','id','payload','recordDigest'])||
    rec.schema!=='rosevear.ql429.custody.v1'||rec.type!==type||rec.id!==id||
    rec.recordDigest!==dig({schema:rec.schema,type:rec.type,id:rec.id,payload:rec.payload}))
   throw Error('QL429_LEDGER_RECORD_TAMPERED');
  return rec;
 };
 const claimOnce=(type,id,payload)=>{
  if(read(type,id))throw Error('QL429_LEDGER_REPLAY');
  const rec={schema:'rosevear.ql429.custody.v1',type,id,payload};
  rec.recordDigest=dig(rec);
  const fd=openSync(pathname(type,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const df=openSync(root,'r');
  try{fsyncSync(df);}finally{closeSync(df);}
  const check=read(type,id);
  if(check?.recordDigest!==rec.recordDigest)throw Error('QL429_LEDGER_WRITE_READBACK_FAILED');
  return check;
 };
 return Object.freeze({read,claimOnce});
}
/** In the protected operator plane, independently sourced owner/reviewer
 * signatures and separately signed key possession proofs enroll public pins.
 * No claim is made that actual remote infrastructure has been provisioned. */
export function enrollQl429ExternalAnchor({ledger,enrollment,ownerApproval,proofs},{
 ownerPin,reviewerPin,protectedOperatorSession=false,
 independentOwnerCustodyVerified=false,independentReviewerCustodyVerified=false,
 independentExternalStoreVerified=false,originalHostIdentityVerified=false,nowMs
}={}){
 if(!protectedOperatorSession||!independentOwnerCustodyVerified||
  !independentReviewerCustodyVerified||!independentExternalStoreVerified||
  !originalHostIdentityVerified||ownerPin===reviewerPin||
  !keyValid(ownerPin)||!keyValid(reviewerPin)||!Number.isSafeInteger(nowMs)||
  typeof ledger?.claimOnce!=='function'||typeof ledger?.read!=='function'||
  !validEnrollment(enrollment)||!fresh(enrollment.createdAt,nowMs))
  return hold('PROTECTED_INDEPENDENT_ENROLLMENT_AUTHORITY_REQUIRED');
 const p=ownerApproval?.payload;
 if(!exact(ownerApproval,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','enrollmentDigest','action','signedAt'])||
  p.schema!=='rosevear.ql429.enrollment-owner-approval.v1'||
  p.enrollmentDigest!==dig(enrollment)||
  p.action!=='ENROLL_OFF_HOST_PUBLIC_PINS_NO_RECEIVER_ACTIVATION'||
  !fresh(p.signedAt,nowMs)||
  !signatureValid(p,ownerApproval.ownerSignature,ownerPin)||
  !signatureValid(p,ownerApproval.reviewerSignature,reviewerPin))
  return hold('DUAL_SIGNED_ENROLLMENT_OWNER_APPROVAL_REJECTED');
 if(!exact(proofs,['anchor','reader','originalHost']))return hold('ENROLLMENT_PROOF_OF_POSSESSION_MISSING');
 for(const role of ['anchor','reader','originalHost']){
  const x=proofs[role],body=x?.payload;
  if(!exact(x,['payload','signature'])||
   !exact(body,['schema','enrollmentDigest','role','observedAt'])||
   body.schema!=='rosevear.ql429.pin-possession.v1'||
   body.enrollmentDigest!==dig(enrollment)||body.role!==role||
   !fresh(body.observedAt,nowMs)||
   !signatureValid(body,x.signature,enrollment.pins[role]))
   return hold('SEPARATE_EXTERNAL_AND_ORIGINAL_HOST_PROOFS_REQUIRED');
 }
 try{
  const rec=ledger.claimOnce('enrollment',enrollment.externalStoreId,{
   enrollment,ownerApprovalDigest:dig(p),
   proofDigests:Object.fromEntries(['anchor','reader','originalHost'].map(k=>[k,dig(proofs[k].payload)]))});
  return {...hold('ENROLLED_PUBLIC_PINS_NO_REMOTE_ANCHOR_OR_ACTIVATION',
   'OFF_NOT_FRESHLY_VERIFIED'),state:'DURABLE_EXTERNAL_ANCHOR_PUBLIC_PINS_ENROLLED',
   externalStoreId:enrollment.externalStoreId,enrollmentDigest:rec.recordDigest};
 }catch{return hold('ENROLLMENT_DUPLICATE_OR_CUSTODY_UNAVAILABLE');}
}
/** Construct unpredictable protected challenge only after a fresh QL-428 remote
 * custody readback and actual QL-428 durable owner precheck. */
export async function issueQl429OriginalHostChallenge({
 ledger,checkpointStore,closureStore,decisionStore,scope,
 anchorClient,externalStoreId,reentryId,closureReceiptDigest,requestId
},{
 ql428OwnerPrecheckIndependentlyVerified=false,
 protectedOperatorSession=false,nowMs,...externalAuthority
}={}){
 if(!protectedOperatorSession||!ql428OwnerPrecheckIndependentlyVerified||
  !validScope(scope)||!ID.test(reentryId??'')||!HEX.test(closureReceiptDigest??'')||
  !Number.isSafeInteger(nowMs)||typeof decisionStore?.read!=='function'||
  typeof ledger?.read!=='function'||typeof ledger?.claimOnce!=='function')
  return hold('QL428_DURABLE_OWNER_PRECHECK_AUTHORITY_REQUIRED');
 let enrolled,precheck;
 try{
  enrolled=ledger.read('enrollment',externalStoreId);
  precheck=decisionStore.read(closureReceiptDigest,reentryId);
 }catch{return hold('ENROLLMENT_OR_QL428_PRECHECK_UNREADABLE');}
 if(!enrolled||!precheck||!validEnrollment(enrolled.payload?.enrollment)||
  enrolled.payload.enrollment.externalStoreId!==externalStoreId||
  !HEX.test(precheck.recordDigest??''))
  return hold('AUTHENTICATED_ENROLLMENT_AND_QL428_PRECHECK_REQUIRED');
 const pins=enrolled.payload.enrollment.pins;
 const custody=await recheckQl428IndependentCustody({
  checkpointStore,closureStore,scope,anchorClient,
  anchorId:enrolled.payload.enrollment.anchorId,requestId
 },{
  ...externalAuthority,anchorPin:pins.anchor,readbackPin:pins.reader,
  expectedExternalStoreId:externalStoreId,nowMs,protectedOperatorSession
 });
 if(custody.state!=='INDEPENDENT_EXTERNAL_CUSTODY_MATCHED'||
  custody.closureReceiptDigest!==closureReceiptDigest)
  return hold('FRESH_EXTERNAL_CUSTODY_RECHECK_MISMATCH');
 const challenge={schema:'rosevear.ql429.original-host-challenge.v1',scope,
  incidentId:custody.incidentId,externalStoreId,anchorDigest:custody.anchorDigest,
  closureReceiptDigest,reentryId,ql428PrecheckDigest:precheck.recordDigest,
  challengeId:randomBytes(24).toString('hex'),
  issuedAt:new Date(nowMs).toISOString(),expiresAt:new Date(nowMs+FRESH).toISOString()};
 try{
  const rec=ledger.claimOnce('challenge',reentryId,{
   enrollmentDigest:enrolled.recordDigest,challenge});
  return {...hold('FRESH_CHALLENGE_ISSUED_AWAIT_ORIGINAL_HOST_AND_THREE_MASTERS',
   'OFF_NOT_FRESHLY_VERIFIED'),state:'FRESH_ORIGINAL_HOST_CHALLENGE_ISSUED',
   challenge,challengeDigest:dig(challenge),challengeCustodyDigest:rec.recordDigest};
 }catch{return hold('CHALLENGE_REPLAY_OR_CUSTODY_WRITE_FAILED');}
}
function validateChallenge(ledger,externalStoreId,reentryId,nowMs){
 try{
  const enrolled=ledger.read('enrollment',externalStoreId);
  const rec=ledger.read('challenge',reentryId);
  const c=rec?.payload?.challenge;
  if(!enrolled||!rec||!validEnrollment(enrolled.payload?.enrollment)||
    rec.payload.enrollmentDigest!==enrolled.recordDigest||
    !exact(c,['schema','scope','incidentId','externalStoreId','anchorDigest',
      'closureReceiptDigest','reentryId','ql428PrecheckDigest',
      'challengeId','issuedAt','expiresAt'])||
    c.schema!=='rosevear.ql429.original-host-challenge.v1'||
    !validScope(c.scope)||!ID.test(c.incidentId??'')||
    c.externalStoreId!==externalStoreId||c.reentryId!==reentryId||
    !HEX.test(c.anchorDigest??'')||!HEX.test(c.closureReceiptDigest??'')||
    !HEX.test(c.ql428PrecheckDigest??'')||!ID.test(c.challengeId??'')||
    !fresh(c.issuedAt,nowMs)||!isIso(c.expiresAt)||
    Date.parse(c.expiresAt)!==Date.parse(c.issuedAt)+FRESH||
    nowMs>Date.parse(c.expiresAt))
   return null;
  return {enrolled,challenge:c,challengeRecord:rec};
 }catch{return null;}
}
/** The signed host response is obtained independently from the real original
 * host. This method never calls a receiver-enable function. */
export function verifyQl429OriginalHostChallenge({ledger,externalStoreId,reentryId,hostEnvelope},{
 protectedOperatorSession=false,independentOriginalHostSignerVerified=false,nowMs
}={}){
 if(!protectedOperatorSession||!independentOriginalHostSignerVerified)
  return hold('ORIGINAL_HOST_INDEPENDENT_SIGNER_REQUIRED');
 const inputs=validateChallenge(ledger,externalStoreId,reentryId,nowMs);
 if(!inputs)return hold('FRESH_PROTECTED_CHALLENGE_MISSING_OR_EXPIRED');
 const c=inputs.challenge,p=hostEnvelope?.payload;
 if(!exact(hostEnvelope,['payload','signature'])||
  !exact(p,['schema','scope','incidentId','externalStoreId','reentryId',
    'challengeDigest','challengeId','hostMachineId','receiverState',
    'nextCeremonyId','respondedAt'])||
  p.schema!=='rosevear.ql429.original-host-fresh-response.v1'||
  !eq(p.scope,c.scope)||p.incidentId!==c.incidentId||
  p.externalStoreId!==externalStoreId||p.reentryId!==reentryId||
  p.challengeDigest!==dig(c)||p.challengeId!==c.challengeId||
  p.hostMachineId!=='DESKTOP-AE894KC'||p.receiverState!=='OFF'||
  !ID.test(p.nextCeremonyId??'')||p.nextCeremonyId===c.scope.ceremonyId||
  !fresh(p.respondedAt,nowMs)||
  Date.parse(p.respondedAt)<Date.parse(c.issuedAt)||
  !signatureValid(p,hostEnvelope.signature,
    inputs.enrolled.payload.enrollment.pins.originalHost))
  return hold('FRESH_SIGNED_ORIGINAL_HOST_OFF_CHALLENGE_INVALID');
 return {...hold('ORIGINAL_HOST_OFF_CHALLENGE_VERIFIED_AWAIT_MASTER_WITNESSES',
  'OFF_VERIFIED_SIGNED_READBACK'),
  state:'SIGNED_ORIGINAL_HOST_CHALLENGE_VERIFIED',
  scope:c.scope,incidentId:c.incidentId,externalStoreId,
  closureReceiptDigest:c.closureReceiptDigest,reentryId,
  nextCeremonyId:p.nextCeremonyId,challengeDigest:dig(c),
  hostResponseDigest:dig(p),hostObservedAt:p.respondedAt};
}
/** Three distinct signed Master witnesses and independent dual owner approval
 * produce an immutable *proposal* only. Still requires a new QL-424 ceremony. */
export function acceptQl429ThreeMasterPilotWitness({
 ledger,externalStoreId,reentryId,hostEnvelope,reports,ownerDecision
},{
 ownerPin,reviewerPin,independentOwnerCustodyVerified=false,
 independentReviewerCustodyVerified=false,
 independentMasterSignerPinsVerified=false,
 protectedOperatorSession=false,independentOriginalHostSignerVerified=false,nowMs
}={}){
 const host=verifyQl429OriginalHostChallenge({
  ledger,externalStoreId,reentryId,hostEnvelope},{
  protectedOperatorSession,independentOriginalHostSignerVerified,nowMs});
 if(host.state!=='SIGNED_ORIGINAL_HOST_CHALLENGE_VERIFIED')
  return hold('ORIGINAL_HOST_CHALLENGE_REQUIRED_FOR_THREE_MASTER_WITNESS');
 if(!independentOwnerCustodyVerified||!independentReviewerCustodyVerified||
   !independentMasterSignerPinsVerified||ownerPin===reviewerPin||
   !keyValid(ownerPin)||!keyValid(reviewerPin)||
   !Array.isArray(reports)||reports.length!==3)
  return hold('THREE_MASTER_AND_DUAL_OWNER_AUTHORITY_REQUIRED',
   'OFF_VERIFIED_SIGNED_READBACK');
 let enrollment;
 try{enrollment=ledger.read('enrollment',externalStoreId).payload.enrollment;}
 catch{return hold('ENROLLED_THREE_MASTER_PINS_UNAVAILABLE');}
 const seen=new Set(),signedReports=[];
 for(const report of reports){
  const p=report?.payload;
  if(!exact(report,['payload','signature'])||
   !exact(p,['schema','masterId','scope','incidentId','externalStoreId',
     'closureReceiptDigest','reentryId','challengeDigest','hostResponseDigest',
     'nextCeremonyId','status','witnessedAt'])||
   p.schema!=='rosevear.ql429.master-pilot-reentry-witness.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   !eq(p.scope,host.scope)||p.incidentId!==host.incidentId||
   p.externalStoreId!==externalStoreId||
   p.closureReceiptDigest!==host.closureReceiptDigest||
   p.reentryId!==reentryId||p.challengeDigest!==host.challengeDigest||
   p.hostResponseDigest!==host.hostResponseDigest||
   p.nextCeremonyId!==host.nextCeremonyId||
   p.status!=='WITNESSED_NEW_SUPERVISED_PILOT_PRECHECK_ONLY'||
   !fresh(p.witnessedAt,nowMs)||
   Date.parse(p.witnessedAt)<Date.parse(host.hostObservedAt)||
   !signatureValid(p,report.signature,enrollment.pins.masters[p.masterId]))
   return hold('THREE_MASTER_REENTRY_WITNESS_INVALID',
    'OFF_VERIFIED_SIGNED_READBACK');
  seen.add(p.masterId);signedReports.push(p);
 }
 if(MASTERS.some(id=>!seen.has(id)))
  return hold('THREE_MASTER_REENTRY_WITNESS_INCOMPLETE','OFF_VERIFIED_SIGNED_READBACK');
 const masterDigest=dig(signedReports.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId)));
 const d=ownerDecision?.payload;
 if(!exact(ownerDecision,['payload','ownerSignature','reviewerSignature'])||
  !exact(d,['schema','scope','incidentId','externalStoreId','reentryId',
   'closureReceiptDigest','challengeDigest','hostResponseDigest',
   'nextCeremonyId','mastersDigest','action','ownerId','reviewerId','approvedAt'])||
  d.schema!=='rosevear.ql429.owner-three-master-pilot-witness.v1'||
  !eq(d.scope,host.scope)||d.incidentId!==host.incidentId||
  d.externalStoreId!==externalStoreId||d.reentryId!==reentryId||
  d.closureReceiptDigest!==host.closureReceiptDigest||
  d.challengeDigest!==host.challengeDigest||
  d.hostResponseDigest!==host.hostResponseDigest||
  d.nextCeremonyId!==host.nextCeremonyId||d.mastersDigest!==masterDigest||
  d.action!=='ACCEPT_SIGNED_PRECHECK_ONLY_REQUIRE_NEW_QL424_CEREMONY_KEEP_OFF'||
  !PERSON.test(d.ownerId??'')||!PERSON.test(d.reviewerId??'')||
  d.ownerId===d.reviewerId||!fresh(d.approvedAt,nowMs)||
  Date.parse(d.approvedAt)<Date.parse(host.hostObservedAt)||
  !signatureValid(d,ownerDecision.ownerSignature,ownerPin)||
  !signatureValid(d,ownerDecision.reviewerSignature,reviewerPin))
  return hold('DUAL_SIGNED_OWNER_PILOT_REENTRY_WITNESS_REJECTED',
   'OFF_VERIFIED_SIGNED_READBACK');
 try{
  const rec=ledger.claimOnce('witness',reentryId,{
   enrollmentDigest:ledger.read('enrollment',externalStoreId).recordDigest,
   challengeDigest:host.challengeDigest,hostResponseDigest:host.hostResponseDigest,
   mastersDigest:masterDigest,ownerDecisionDigest:dig(d),
   nextCeremonyId:host.nextCeremonyId});
  return {...hold('NEW_SUPERVISED_QL424_CEREMONY_AND_INDEPENDENT_ACTIVATION_REQUIRED',
    'OFF_VERIFIED_SIGNED_READBACK'),
   state:'DURABLE_THREE_MASTER_PILOT_REENTRY_WITNESS_NO_ACTIVATION',
   witnessDigest:rec.recordDigest,masterCount:3,reentryId,
   nextCeremonyId:host.nextCeremonyId,ownerAcceptance:'DUAL_SIGNED_PRECHECK_ONLY'};
 }catch{return hold('PILOT_REENTRY_WITNESS_REPLAY_OR_CUSTODY_FAILURE',
  'OFF_VERIFIED_SIGNED_READBACK');}
}
