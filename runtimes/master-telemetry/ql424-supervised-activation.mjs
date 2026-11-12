import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {reviewQl423ReplayRestorationAndActivation} from './ql423-signed-custody-replay.mjs';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const WINDOW=120000, HOST='DESKTOP-AE894KC';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const same=(a,b)=>HEX.test(a??'')&&HEX.test(b??'')&&
 timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const no=(reason)=>({state:'HOLD',reason,receiver:'OFF',connection:'HOLD',
 ownerAcceptance:'HOLD',runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const keyFrom=pin=>{
 try{
  if(typeof pin!=='string'||pin.length>512)return null;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return null;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'?key:null;
 }catch{return null;}
};
const signed=(payload,signature,pin)=>{
 try{return typeof signature==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(signature)&&
  Boolean(keyFrom(pin)&&verify(null,Buffer.from(JSON.stringify(payload)),keyFrom(pin),
   Buffer.from(signature,'base64')));}
 catch{return false;}
};
const matchTime=(time,now)=>iso(time)&&Date.parse(time)<=now&&now-Date.parse(time)<=WINDOW;

/** Durable append-only use-once ceremony and enrollment ledger.
 * Backend supplies private absolute directory. No raw signed envelopes or keys. */
export function openQl424ProtectedCeremonyLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('PRIVATE_LEDGER_PERMISSIONS_UNSAFE');
 const location=token=>{
  if(typeof token!=='string'||!/^(?:enroll|activate):[A-Za-z0-9_-]{12,96}$/.test(token))
   throw Error('INVALID_ONE_USE_TOKEN');
  return join(root,hash(token)+'.json');
 };
 const read=token=>{
  let raw;try{raw=readFileSync(location(token),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>2048)throw Error('LEDGER_ENTRY_TOO_LARGE');
  let obj;try{obj=JSON.parse(raw);}catch{throw Error('LEDGER_ENTRY_CORRUPT');}
  if(!exact(obj,['schema','token','bindingDigest','recordDigest'])||
   obj.schema!=='rosevear.ql424.protected-ledger.v1'||obj.token!==token||
   !same(obj.recordDigest,hash({schema:obj.schema,token:obj.token,bindingDigest:obj.bindingDigest})))
   throw Error('LEDGER_ENTRY_TAMPERED');
  return obj;
 };
 const claimOnce=(token,bindingDigest)=>{
  if(!HEX.test(bindingDigest??''))throw Error('INVALID_LEDGER_BINDING');
  if(read(token))throw Error('ONE_USE_CEREMONY_REPLAY');
  const obj={schema:'rosevear.ql424.protected-ledger.v1',token,bindingDigest};
  obj.recordDigest=hash(obj);
  const fd=openSync(location(token),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(obj));fsyncSync(fd);}
  finally{closeSync(fd);}
  const restored=read(token);
  if(!restored||!same(restored.bindingDigest,bindingDigest))
   throw Error('LEDGER_READBACK_UNVERIFIED');
  return restored;
 };
 return Object.freeze({read,claimOnce});
}

/** Two independently signed public-key enrollment attestations only.
 * Public source SPKI never arrives as authority from the device itself;
 * expected fingerprint and distinct trusted owner/reviewer pins are
 * independently configured in a protected backend. */
export function enrollQl424OriginalHostAuthority(certificate,{
 independentlyPinnedSourceSha256,ownerPin,reviewerPin,
 ownerAuthorityVerified=false,independentReviewerVerified=false,
 protectedEnrollmentSession=false,expectedSourceRevision,
 expectedControllerRevision,nowMs,ledger
}={}){
 const p=certificate?.payload;
 if(!ownerAuthorityVerified||!independentReviewerVerified||!protectedEnrollmentSession||
  !SHA.test(expectedSourceRevision??'')||!SHA.test(expectedControllerRevision??'')||
  !Number.isSafeInteger(nowMs)||!HEX.test(independentlyPinnedSourceSha256??'')||
  typeof ledger?.claimOnce!=='function'||typeof ledger?.read!=='function')
  return no('INDEPENDENT_ENROLLMENT_AUTHORITY_REQUIRED');
 if(!exact(certificate,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','sourceId','hostId','sourceRevision','controllerRevision',
   'sourceSignerSpki','sourceSignerSha256','enrollmentId','enrolledAt','ownerId','reviewerId'])||
  p.schema!=='rosevear.ql424.original-host-enrollment.v1'||
  p.sourceId!=='rosevear-ai-hub'||p.hostId!==HOST||
  p.sourceRevision!==expectedSourceRevision||p.controllerRevision!==expectedControllerRevision||
  !ID.test(p.enrollmentId??'')||!PERSON.test(p.ownerId??'')||
  !PERSON.test(p.reviewerId??'')||p.ownerId===p.reviewerId||
  !matchTime(p.enrolledAt,nowMs)||!same(p.sourceSignerSha256,independentlyPinnedSourceSha256)||
  !keyFrom(p.sourceSignerSpki)||
  !same(hash(Buffer.from(p.sourceSignerSpki,'base64')),p.sourceSignerSha256)||
  ownerPin===reviewerPin||ownerPin===p.sourceSignerSpki||reviewerPin===p.sourceSignerSpki||
  !signed(p,certificate.ownerSignature,ownerPin)||
  !signed(p,certificate.reviewerSignature,reviewerPin))
  return no('ORIGINAL_HOST_AUTHORITY_CERTIFICATE_REJECTED');
 const binding=hash(p);
 try{ledger.claimOnce('enroll:'+p.enrollmentId,binding);
  if(!same(ledger.read('enroll:'+p.enrollmentId)?.bindingDigest,binding))
   return no('ENROLLMENT_DURABLE_READBACK_MISMATCH');
 }catch{return no('ENROLLMENT_REPLAY_OR_STORE_UNAVAILABLE');}
 return {...no('PUBLIC_SIGNER_ENROLLED_FOR_SUPERVISED_REVIEW_ONLY'),
  state:'SUPERVISED_SOURCE_PUBLIC_PIN_ENROLLED',
  enrollmentId:p.enrollmentId,sourceRevision:p.sourceRevision,
  controllerRevision:p.controllerRevision,sourceSignerSha256:p.sourceSignerSha256,
  ownerId:p.ownerId,reviewerId:p.reviewerId,enrollmentBindingDigest:binding};
}

/** ONE isolated receiver activation. Protected caller must run the actual
 * QL-423 signed replay verifier, independently authenticate the enrollment,
 * and inject an owner-authorized receiver adapter. Never callable from UI.
 * A failure automatically attempts to return receiver to OFF. */
export async function runQl424SupervisedReceiverCeremony({enrollment,activation,
 ql423Input,ql423Options,ledger,receiverAdapter},{
 expectedSourceRevision,expectedControllerRevision,
 ownerPin,reviewerPin,receiverPin,protectedOperatorSession=false,
 independentReceiverCustodyVerified=false,
 independentEnrollmentCustodyVerified=false,executeIntent,nowMs
}={}){
 if(!protectedOperatorSession||!independentReceiverCustodyVerified||
  !independentEnrollmentCustodyVerified||
  executeIntent!=='EXECUTE_ISOLATED_ONE_TEST_CEREMONY'||
  !SHA.test(expectedSourceRevision??'')||!SHA.test(expectedControllerRevision??'')||
  !Number.isSafeInteger(nowMs)||!ql423Input||!ql423Options||
  typeof ledger?.claimOnce!=='function'||typeof ledger?.read!=='function'||
  typeof receiverAdapter?.enableOneTest!=='function'||
  typeof receiverAdapter?.readSignedState!=='function'||
  typeof receiverAdapter?.disableOneTest!=='function')
  return no('PROTECTED_CEREMONY_NOT_AUTHORIZED');
 const p=activation?.payload;
 let persistedEnrollment;
 try{persistedEnrollment=enrollment?.enrollmentId?ledger.read('enroll:'+enrollment.enrollmentId):null;}
 catch{return no('ORIGINAL_HOST_ENROLLMENT_STORE_UNREADABLE');}
 if(enrollment?.state!=='SUPERVISED_SOURCE_PUBLIC_PIN_ENROLLED'||
  enrollment.sourceRevision!==expectedSourceRevision||
  enrollment.controllerRevision!==expectedControllerRevision||
  !same(persistedEnrollment?.bindingDigest,enrollment.enrollmentBindingDigest))
  return no('ORIGINAL_HOST_ENROLLMENT_CUSTODY_NOT_FOUND');
 if(!exact(activation,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','sourceId','hostId','episodeId','sourceRevision',
    'controllerRevision','custodyRecordDigest','priorDecisionId',
    'enrollmentId','ceremonyId','mode','issuedAt','ownerId','reviewerId'])||
  p.schema!=='rosevear.ql424.supervised-receiver-ceremony.v1'||
  p.sourceId!=='rosevear-ai-hub'||p.hostId!==HOST||
  p.sourceRevision!==expectedSourceRevision||
  p.controllerRevision!==expectedControllerRevision||
  !ID.test(p.episodeId??'')||!ID.test(p.priorDecisionId??'')||
  !ID.test(p.ceremonyId??'')||p.enrollmentId!==enrollment.enrollmentId||
  !HEX.test(p.custodyRecordDigest??'')||
  p.mode!=='ISOLATED_ONE_TEST'||
  !matchTime(p.issuedAt,nowMs)||
  p.ownerId!==enrollment.ownerId||p.reviewerId!==enrollment.reviewerId||
  !signed(p,activation.ownerSignature,ownerPin)||
  !signed(p,activation.reviewerSignature,reviewerPin))
  return no('DUAL_SIGNED_SUPERVISED_CEREMONY_REJECTED');
 // This rechecks the full protected QL-422/423 source evidence; a browser
 // cannot submit a readiness Boolean in place of signed receipts.
 let proof;
 try{proof=reviewQl423ReplayRestorationAndActivation(ql423Input,{
  ...ql423Options,nowMs});}
 catch{return no('QL423_PROTECTED_RESTORATION_READ_FAILED');}
 if(proof.state!=='THREE_MASTER_REPLAY_RESTORED_FOR_REVIEW'||
  proof.activationReviewStatus!=='READY_FOR_SEPARATE_SUPERVISED_ACTIVATION_NOT_EXECUTED'||
  proof.sourceId!==p.sourceId||proof.episodeId!==p.episodeId||
  proof.sourceRevision!==p.sourceRevision||
  proof.controllerRevision!==p.controllerRevision||
  proof.decisionId!==p.priorDecisionId||
  !same(proof.recordDigest,p.custodyRecordDigest))
  return no('SIGNED_QL423_MASTER_PROOF_OR_RESTORATION_NOT_READY');
 try{ledger.claimOnce('activate:'+p.ceremonyId,hash(p));}
 catch{return no('ACTIVATION_CEREMONY_ALREADY_USED_OR_STORE_UNAVAILABLE');}
 let enabled=false;
 try{
  const call=await receiverAdapter.enableOneTest({
   ceremonyId:p.ceremonyId,sourceId:p.sourceId,episodeId:p.episodeId,
   sourceRevision:p.sourceRevision,controllerRevision:p.controllerRevision,
   mode:p.mode,operatorDecisionId:p.priorDecisionId});
  enabled=true;
  if(call?.accepted!==true)throw Error('RECEIVER_ENABLE_NOT_ACCEPTED');
  const state=await receiverAdapter.readSignedState();
  const s=state?.payload;
  if(!exact(state,['payload','signature'])||
    !exact(s,['schema','ceremonyId','sourceId','episodeId',
      'sourceRevision','controllerRevision','receiverState','observedAt'])||
    s.schema!=='rosevear.ql424.protected-receiver-state.v1'||
    s.ceremonyId!==p.ceremonyId||s.sourceId!==p.sourceId||
    s.episodeId!==p.episodeId||s.sourceRevision!==p.sourceRevision||
    s.controllerRevision!==p.controllerRevision||
    s.receiverState!=='ISOLATED_ONE_TEST_ON'||
    !matchTime(s.observedAt,nowMs)||!signed(s,state.signature,receiverPin))
    throw Error('SIGNED_RECEIVER_RUNTIME_READBACK_INVALID');
  return {...no('ISOLATED_RECEIVER_WAITING_INDEPENDENT_MASTER_ACCEPTANCE'),
   state:'ISOLATED_RECEIVER_ACTIVATED_PENDING_THREE_MASTER_ACCEPTANCE',
   receiver:'ISOLATED_ONE_TEST_ON',sourceId:p.sourceId,episodeId:p.episodeId,
   sourceRevision:p.sourceRevision,controllerRevision:p.controllerRevision,
   ceremonyId:p.ceremonyId,recordDigest:proof.recordDigest,
   receiverProof:state};
 }catch{
  if(enabled)try{await receiverAdapter.disableOneTest({ceremonyId:p.ceremonyId});}
   catch{return {...no('RECEIVER_ROLLBACK_FAILED_MANUAL_RECOVERY_REQUIRED'),
      receiver:'UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED'};}
  return no('ISOLATED_RECEIVER_ACTIVATION_OR_READBACK_FAILED');
 }
}

/** Post-activation acceptance requires all three independently signed,
 * fresh and source-bound reports, plus a distinct dual-signed owner acceptance.
 * It cannot infer actual uptime from a code build. The runtime receiver
 * state must have a separately pinned, valid signature. */
export function verifyQl424ThreeMasterAcceptance({ceremony,reports,ownerAcceptance},{
 masterPins,receiverPin,ownerPin,reviewerPin,
 independentMasterPinsVerified=false,independentOwnerCustodyVerified=false,
 independentReceiverRuntimeVerified=false,nowMs
}={}){
 if(!independentMasterPinsVerified||!independentOwnerCustodyVerified||
  !independentReceiverRuntimeVerified||!Number.isSafeInteger(nowMs)||
  !masterPins||!Array.isArray(reports)||reports.length!==3||
  ceremony?.state!=='ISOLATED_RECEIVER_ACTIVATED_PENDING_THREE_MASTER_ACCEPTANCE')
  return no('PROTECTED_THREE_MASTER_ACCEPTANCE_AUTHORITY_MISSING');
 const r=ceremony.receiverProof?.payload;
 if(r?.ceremonyId!==ceremony.ceremonyId||
  !matchTime(r.observedAt,nowMs)||
  !signed(r,ceremony.receiverProof.signature,receiverPin))
  return no('INDEPENDENT_SIGNED_RECEIVER_STATE_MISSING');
 const seen=new Set(),bound=[];
 for(const report of reports){
  const p=report?.payload;
  if(!exact(report,['payload','signature'])||
   !exact(p,['schema','masterId','ceremonyId','sourceId','episodeId',
     'sourceRevision','controllerRevision','custodyRecordDigest','receiverState',
     'status','observedAt'])||
   p.schema!=='rosevear.ql424.master-operational-acceptance.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   p.ceremonyId!==ceremony.ceremonyId||
   p.sourceId!==ceremony.sourceId||p.episodeId!==ceremony.episodeId||
   p.sourceRevision!==ceremony.sourceRevision||
   p.controllerRevision!==ceremony.controllerRevision||
   !same(p.custodyRecordDigest,ceremony.recordDigest)||
   p.receiverState!=='ISOLATED_ONE_TEST_ON'||
   p.status!=='VERIFIED_LIVE_PILOT'||
   !matchTime(p.observedAt,nowMs)||
   !signed(p,report.signature,masterPins[p.masterId]))
   return no('MASTER_OPERATIONAL_SIGNATURE_OR_RUNTIME_PROOF_REJECTED');
  seen.add(p.masterId);bound.push(p);
 }
 if(MASTERS.some(x=>!seen.has(x)))return no('THREE_MASTER_PILOT_PROOF_INCOMPLETE');
 const record=ownerAcceptance?.payload;
 if(!exact(ownerAcceptance,['payload','ownerSignature','reviewerSignature'])||
  !exact(record,['schema','ceremonyId','sourceId','episodeId',
   'sourceRevision','controllerRevision','custodyRecordDigest',
   'reportsDigest','action','acceptedAt','ownerId','reviewerId'])||
  record.schema!=='rosevear.ql424.supervised-operational-acceptance.v1'||
  record.ceremonyId!==ceremony.ceremonyId||
  record.sourceId!==ceremony.sourceId||record.episodeId!==ceremony.episodeId||
  record.sourceRevision!==ceremony.sourceRevision||
  record.controllerRevision!==ceremony.controllerRevision||
  !same(record.custodyRecordDigest,ceremony.recordDigest)||
  !same(record.reportsDigest,hash(bound.slice().sort((a,b)=>
   MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId))))||
  record.action!=='ACCEPT_ISOLATED_OPERATIONAL_PILOT'||
  !PERSON.test(record.ownerId??'')||!PERSON.test(record.reviewerId??'')||
  record.ownerId===record.reviewerId||
  !matchTime(record.acceptedAt,nowMs)||
  !signed(record,ownerAcceptance.ownerSignature,ownerPin)||
  !signed(record,ownerAcceptance.reviewerSignature,reviewerPin))
  return no('INDEPENDENT_OWNER_OPERATIONAL_ACCEPTANCE_MISSING');
 return {state:'VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE',
  receiver:'ISOLATED_ONE_TEST_ON',connection:'VERIFIED_CONNECTED_PILOT',
  ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',
  sourceId:ceremony.sourceId,episodeId:ceremony.episodeId,
  sourceRevision:ceremony.sourceRevision,controllerRevision:ceremony.controllerRevision,
  ceremonyId:ceremony.ceremonyId,masterCount:3,
  runtimeUptime:'NOT_MEASURED_FROM_CEREMONY',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
