import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {verifyQl429OriginalHostChallenge} from './ql429-anchor-enrollment-challenge.mjs';
import {runQl424SupervisedReceiverCeremony,verifyQl424ThreeMasterAcceptance} from './ql424-supervised-activation.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const WINDOW=60000;
const digest=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const exact=(x,fields)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(f=>Object.hasOwn(x,f));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const validTime=(s,now)=>typeof s==='string'&&Number.isSafeInteger(now)&&
 Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&
 Date.parse(s)<=now&&now-Date.parse(s)<=WINDOW;
const hold=(reason,receiver='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED')=>({
 state:'HOLD',reason,receiver,connection:'HOLD',ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signed(p,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(p)),
    key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
function sameScope(a,b){
 return exact(a,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 exact(b,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 a.sourceId==='rosevear-ai-hub'&&a.ceremonyId===b.ceremonyId&&
 a.episodeId===b.episodeId&&a.sourceRevision===b.sourceRevision&&
 a.controllerRevision===b.controllerRevision;
}
/** One-use protected local ledger. PENDING must be persisted BEFORE the QL-424
 * receiver enable call; an interrupted attempt cannot be silently replayed. */
export function openQl430ProtectedCeremonyAudit(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_LEDGER_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('UNSAFE_QL430_LEDGER_DIRECTORY');
 const file=(kind,ceremonyId)=>{
  if(!['attempt','accepted'].includes(kind)||!ID.test(ceremonyId??''))
   throw Error('INVALID_QL430_LEDGER_KEY');
  return join(root,'ql430-'+kind+'-'+ceremonyId+'.json');
 };
 const read=(kind,ceremonyId)=>{
  let raw;try{raw=readFileSync(file(kind,ceremonyId),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL430_LEDGER_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL430_LEDGER_RECORD_INVALID');}
  if(!exact(rec,['schema','kind','ceremonyId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql430.ceremony-audit.v1'||
   rec.kind!==kind||rec.ceremonyId!==ceremonyId||
   !HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==digest({schema:rec.schema,kind:rec.kind,
    ceremonyId:rec.ceremonyId,evidenceDigest:rec.evidenceDigest}))
   throw Error('QL430_LEDGER_RECORD_TAMPERED');
  return rec;
 };
 const claimOnce=(kind,ceremonyId,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('BAD_AUDIT_DIGEST');
  if(read(kind,ceremonyId))throw Error('REPLAYED_QL430_CEREMONY');
  const rec={schema:'rosevear.ql430.ceremony-audit.v1',kind,ceremonyId,evidenceDigest};
  rec.recordDigest=digest(rec);
  const fd=openSync(file(kind,ceremonyId),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dirfd=openSync(root,'r');try{fsyncSync(dirfd);}finally{closeSync(dirfd);}
  if(read(kind,ceremonyId)?.recordDigest!==rec.recordDigest)
   throw Error('QL430_LEDGER_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
function trustedQl429(ledger,externalStoreId,reentryId,hostEnvelope,nowMs){
 try{
  const enrolled=ledger.read('enrollment',externalStoreId);
  const challenge=ledger.read('challenge',reentryId);
  const witness=ledger.read('witness',reentryId);
  const h=verifyQl429OriginalHostChallenge({ledger,externalStoreId,reentryId,
   hostEnvelope},{protectedOperatorSession:true,
   independentOriginalHostSignerVerified:true,nowMs});
  const c=challenge?.payload?.challenge;
  if(h.state!=='SIGNED_ORIGINAL_HOST_CHALLENGE_VERIFIED'||
   !enrolled||!witness||!c||witness.payload.enrollmentDigest!==enrolled.recordDigest||
   witness.payload.challengeDigest!==h.challengeDigest||
   witness.payload.hostResponseDigest!==h.hostResponseDigest||
   witness.payload.nextCeremonyId!==h.nextCeremonyId||
   !HEX.test(witness.payload.mastersDigest??'')||
   !HEX.test(witness.payload.ownerDecisionDigest??'')||
   !sameScope(c.scope,h.scope)||
   witness.payload.challengeDigest!==digest(c))return null;
  return {host:h,enrolled,challenge,witness};
 }catch{return null;}
}
const distinct=(a,b)=>typeof a==='string'&&typeof b==='string'&&a!==b;
function authorizeNewCeremony(inputs,opts,w){
 const p=inputs.reentryAuthorization?.payload,activation=inputs.ql424Inputs?.activation?.payload;
 const {ownerPin,reviewerPin,nowMs,independentDualOwnerVerified=false}=opts;
 const c=w.challenge.payload.challenge;
 if(!independentDualOwnerVerified||!distinct(ownerPin,reviewerPin)||
  !exact(inputs.reentryAuthorization,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','externalStoreId','reentryId','ql429WitnessDigest','challengeDigest',
   'nextCeremonyId','activationDigest','action','ownerId','reviewerId','authorizedAt'])||
  p.schema!=='rosevear.ql430.supervised-reentry-authorization.v1'||
  p.externalStoreId!==inputs.externalStoreId||p.reentryId!==inputs.reentryId||
  p.ql429WitnessDigest!==w.witness.recordDigest||
  p.challengeDigest!==w.host.challengeDigest||
  p.nextCeremonyId!==w.host.nextCeremonyId||
  p.activationDigest!==digest(activation)||
  p.action!=='EXECUTE_NEW_SUPERVISED_QL424_ISOLATED_ONE_TEST'||
  !PERSON.test(p.ownerId??'')||!PERSON.test(p.reviewerId??'')||
  p.ownerId===p.reviewerId||!validTime(p.authorizedAt,nowMs)||
  !signed(p,inputs.reentryAuthorization.ownerSignature,ownerPin)||
  !signed(p,inputs.reentryAuthorization.reviewerSignature,reviewerPin)||
  !exact(activation,['schema','sourceId','hostId','episodeId','sourceRevision',
   'controllerRevision','custodyRecordDigest','priorDecisionId',
   'enrollmentId','ceremonyId','mode','issuedAt','ownerId','reviewerId'])||
  activation.ceremonyId!==w.host.nextCeremonyId||
  activation.ceremonyId===c.scope.ceremonyId||
  activation.sourceId!==c.scope.sourceId||
  activation.sourceRevision!==c.scope.sourceRevision||
  activation.controllerRevision!==c.scope.controllerRevision||
  activation.hostId!=='DESKTOP-AE894KC'||
  activation.mode!=='ISOLATED_ONE_TEST'||
  activation.episodeId===c.scope.episodeId||
  !ID.test(activation.episodeId??'')||
  !SHA.test(activation.sourceRevision??'')||
  !SHA.test(activation.controllerRevision??'')||
  !validTime(activation.issuedAt,nowMs)||
  Date.parse(p.authorizedAt)<Date.parse(w.host.hostObservedAt)||
  Date.parse(activation.issuedAt)<Date.parse(w.host.hostObservedAt))
  return false;
 return true;
}
async function failClose(adapter,ceremonyId,reason){
 try{
  if(typeof adapter?.disableOneTest!=='function')throw Error('NO_PROTECTED_RECEIVER_SHUTDOWN');
  const disabled=await adapter.disableOneTest({ceremonyId,reason});
  if(disabled?.disabled!==true)
   return hold('PILOT_ROLLBACK_DISABLE_NOT_CONFIRMED');
  return hold('PILOT_REENTRY_REJECTED_RECEIVER_DISABLE_REQUESTED','OFF_NOT_INDEPENDENTLY_RECHECKED');
 }catch{return hold('PILOT_ROLLBACK_FAILED_MANUAL_OPERATOR_RECOVERY_REQUIRED');}
}
function freshIndependentState(envelope,ceremonyId,episodeId,sourceRevision,controllerRevision,
 witnessDigest,challengeId,nowMs,pin,minimumMs){
 const p=envelope?.payload;
 return exact(envelope,['payload','signature'])&&
  exact(p,['schema','ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision',
   'ql429WitnessDigest','challengeId','receiverState','observedAt'])&&
  p.schema==='rosevear.ql430.independent-receiver-runtime.v1'&&
  p.ceremonyId===ceremonyId&&p.sourceId==='rosevear-ai-hub'&&
  p.episodeId===episodeId&&p.sourceRevision===sourceRevision&&
  p.controllerRevision===controllerRevision&&
  p.ql429WitnessDigest===witnessDigest&&p.challengeId===challengeId&&
  p.receiverState==='ISOLATED_ONE_TEST_ON'&&
  validTime(p.observedAt,nowMs)&&Date.parse(p.observedAt)>=minimumMs&&
  signed(p,envelope.signature,pin);
}
function runtimeReports(reports,ceremony,attestation,params,pins,nowMs){
 if(!Array.isArray(reports)||reports.length!==3||!pins)return null;
 const set=new Set(),payloads=[];
 for(const envelope of reports){
  const p=envelope?.payload;
  if(!exact(envelope,['payload','signature'])||
   !exact(p,['schema','masterId','ceremonyId','sourceId','episodeId','sourceRevision',
    'controllerRevision','ql429WitnessDigest','independentReceiverDigest',
    'ql424AcceptanceDigest','status','observedAt'])||
   p.schema!=='rosevear.ql430.master-runtime-acceptance.v1'||
   !MASTERS.includes(p.masterId)||set.has(p.masterId)||
   p.ceremonyId!==ceremony.ceremonyId||p.sourceId!==ceremony.sourceId||
   p.episodeId!==ceremony.episodeId||p.sourceRevision!==ceremony.sourceRevision||
   p.controllerRevision!==ceremony.controllerRevision||
   p.ql429WitnessDigest!==params.witnessDigest||
   p.independentReceiverDigest!==params.independentReceiverDigest||
   p.ql424AcceptanceDigest!==params.ql424AcceptanceDigest||
   p.status!=='VERIFIED_NEW_ISOLATED_ONE_TEST_RUNTIME'||
   !validTime(p.observedAt,nowMs)||
   Date.parse(p.observedAt)<Date.parse(attestation.payload.observedAt)||
   !signed(p,envelope.signature,pins[p.masterId]))
   return null;
  set.add(p.masterId);payloads.push(p);
 }
 if(MASTERS.some(x=>!set.has(x)))return null;
 return digest(payloads.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId)));
}
function ownerRuntimeDecision(envelope,params,ceremony,reportDigest,opts,minimumMs){
 const p=envelope?.payload;
 return exact(envelope,['payload','ownerSignature','reviewerSignature'])&&
 exact(p,['schema','ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision',
  'ql429WitnessDigest','independentReceiverDigest','ql424AcceptanceDigest',
  'reportsDigest','action','ownerId','reviewerId','acceptedAt'])&&
 p.schema==='rosevear.ql430.owner-runtime-acceptance.v1'&&
 p.ceremonyId===ceremony.ceremonyId&&p.sourceId===ceremony.sourceId&&
 p.episodeId===ceremony.episodeId&&p.sourceRevision===ceremony.sourceRevision&&
 p.controllerRevision===ceremony.controllerRevision&&
 p.ql429WitnessDigest===params.witnessDigest&&
 p.independentReceiverDigest===params.independentReceiverDigest&&
 p.ql424AcceptanceDigest===params.ql424AcceptanceDigest&&
 p.reportsDigest===reportDigest&&
 p.action==='ACCEPT_FRESH_ISOLATED_PILOT_ONLY_KEEP_SLAVE_GATE_HOLD'&&
 PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
 p.ownerId!==p.reviewerId&&validTime(p.acceptedAt,opts.nowMs)&&
 Date.parse(p.acceptedAt)>=minimumMs&&
 distinct(opts.ownerPin,opts.reviewerPin)&&
 signed(p,envelope.ownerSignature,opts.ownerPin)&&
 signed(p,envelope.reviewerSignature,opts.reviewerPin);
}
/** Execute only inside the ORIGINAL-HOST protected backend, with verified
 * QL-429 independent witness, fresh QL-423 replay, a new QL-424 dual-signed
 * ceremony and an injected original-host adapter. Tests use synthetic keys.
 * This release deploys no scheduler, receiver adapter or signer configuration. */
export async function runQl430SupervisedPilotReentry({
 ql429Ledger,externalStoreId,reentryId,hostEnvelope,reentryAuthorization,
 ql424Inputs,ql424Options,protectedAudit,independentReceiverAdapter,
 runtimeEvidenceProvider
},{
 nowMs,ownerPin,reviewerPin,independentReceiverPin,masterPins,
 originalHostSessionVerified=false,independentQl429WitnessVerified=false,
 independentDualOwnerVerified=false,independentReceiverPinVerified=false,
 independentMasterPinsVerified=false,independentQl424AuthorityVerified=false
}={}){
 const opts={nowMs,ownerPin,reviewerPin,independentDualOwnerVerified};
 if(!originalHostSessionVerified||!independentQl429WitnessVerified||
  !independentReceiverPinVerified||!independentMasterPinsVerified||
  !independentQl424AuthorityVerified||!Number.isSafeInteger(nowMs)||
  typeof protectedAudit?.read!=='function'||typeof protectedAudit?.claimOnce!=='function'||
  typeof independentReceiverAdapter?.readSignedState!=='function'||
  typeof runtimeEvidenceProvider?.readSignedAcceptance!=='function'||
  typeof ql424Inputs?.receiverAdapter?.enableOneTest!=='function'||
  typeof ql424Inputs?.receiverAdapter?.disableOneTest!=='function')
  return hold('ORIGINAL_HOST_PROTECTED_REENTRY_AUTHORITY_MISSING');
 const w=trustedQl429(ql429Ledger,externalStoreId,reentryId,hostEnvelope,nowMs);
 if(!w)return hold('DURABLE_SIGNED_QL429_WITNESS_OR_CHALLENGE_NOT_VERIFIED');
 const inputs={externalStoreId,reentryId,reentryAuthorization,ql424Inputs};
 if(!authorizeNewCeremony(inputs,opts,w))
  return hold('FRESH_NEW_CEREMONY_DUAL_OWNER_AUTHORIZATION_INVALID');
 const p=ql424Inputs.activation.payload;
 if(ql424Options?.protectedOperatorSession!==true||
  ql424Options?.executeIntent!=='EXECUTE_ISOLATED_ONE_TEST_CEREMONY'||
  ql424Options?.independentEnrollmentCustodyVerified!==true||
  ql424Options?.independentReceiverCustodyVerified!==true||
  ql424Options?.ownerPin!==ownerPin||ql424Options?.reviewerPin!==reviewerPin||
  ql424Options?.nowMs!==nowMs||
  ql424Options?.expectedSourceRevision!==p.sourceRevision||
  ql424Options?.expectedControllerRevision!==p.controllerRevision)
  return hold('QL424_INDEPENDENT_PROTECTED_AUTHORITY_MISMATCH');
 const pins=w.enrolled.payload.enrollment.pins.masters;
 if(!masterPins||!MASTERS.every(id=>pins[id]===masterPins[id])||
  independentReceiverPin===ql424Options.receiverPin||
  independentReceiverPin===ownerPin||independentReceiverPin===reviewerPin)
  return hold('INDEPENDENT_PIN_CUSTODY_MISMATCH');
 try{
  if(protectedAudit.read('attempt',p.ceremonyId)||protectedAudit.read('accepted',p.ceremonyId))
   return hold('SUPERVISED_REENTRY_ATTEMPT_ALREADY_USED');
  protectedAudit.claimOnce('attempt',p.ceremonyId,digest({
   ql429WitnessDigest:w.witness.recordDigest,ql424ActivationDigest:digest(p),
   reentryAuthorizationDigest:digest(reentryAuthorization.payload),
   hostResponseDigest:w.host.hostResponseDigest}));
 }catch{return hold('DURABLE_PREACTIVATION_AUDIT_UNAVAILABLE');}
 // The attempted activation is now irrevocably consumed. Any failure after
 // receiver enable must attempt to disable it; never retry this ceremony.
 const ceremony=await runQl424SupervisedReceiverCeremony(ql424Inputs,ql424Options);
 if(ceremony.state!=='ISOLATED_RECEIVER_ACTIVATED_PENDING_THREE_MASTER_ACCEPTANCE')
  return hold('QL424_SUPERVISED_ACTIVATION_FAILED_OR_UNCONFIRMED',
   ceremony.receiver==='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED'?
    'UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED':'OFF_NOT_INDEPENDENTLY_RECHECKED');
 const adapter=ql424Inputs.receiverAdapter;
 const failAfter=async reason=>failClose(adapter,p.ceremonyId,reason);
 let attestation;
 try{
  attestation=await independentReceiverAdapter.readSignedState({
   ceremonyId:p.ceremonyId,episodeId:p.episodeId,
   ql429WitnessDigest:w.witness.recordDigest,
   challengeId:w.challenge.payload.challenge.challengeId,requiredState:'ISOLATED_ONE_TEST_ON'});
 }catch{return failAfter('INDEPENDENT_RECEIVER_READBACK_UNAVAILABLE');}
 if(!freshIndependentState(attestation,p.ceremonyId,p.episodeId,
   p.sourceRevision,p.controllerRevision,w.witness.recordDigest,
   w.challenge.payload.challenge.challengeId,nowMs,independentReceiverPin,
   Date.parse(ceremony.receiverProof.payload.observedAt)))
  return failAfter('INDEPENDENT_RECEIVER_STATE_ATTESTATION_REJECTED');
 const receiverDigest=digest(attestation.payload);
 let evidence;
 try{
  evidence=await runtimeEvidenceProvider.readSignedAcceptance({
   ceremony,receiverAttestationDigest:receiverDigest,
   ql429WitnessDigest:w.witness.recordDigest});
 }catch{return failAfter('INDEPENDENT_RUNTIME_ACCEPTANCE_UNAVAILABLE');}
 const ql424=evidence?.ql424;
 const ql424Result=verifyQl424ThreeMasterAcceptance({
  ceremony,reports:ql424?.reports,ownerAcceptance:ql424?.ownerAcceptance},{
  masterPins,receiverPin:ql424Options.receiverPin,
  ownerPin,reviewerPin,nowMs,independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReceiverRuntimeVerified:true
 });
 if(ql424Result.state!=='VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE'||
  ql424Result.ceremonyId!==p.ceremonyId||ql424Result.episodeId!==p.episodeId)
  return failAfter('QL424_THREE_MASTER_LIVE_ACCEPTANCE_NOT_VERIFIED');
 const acceptedDigest=digest({
  ql424Masters:ql424.reports.map(r=>r.payload)
   .sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId)),
  ql424Owner:ql424.ownerAcceptance.payload});
 const params={witnessDigest:w.witness.recordDigest,
  independentReceiverDigest:receiverDigest,ql424AcceptanceDigest:acceptedDigest};
 const reportDigest=runtimeReports(evidence?.reports,ceremony,attestation,
  params,masterPins,nowMs);
 if(!reportDigest)return failAfter('THREE_INDEPENDENT_QL430_RUNTIME_SIGNATURES_MISSING');
 if(!ownerRuntimeDecision(evidence?.ownerAcceptance,params,ceremony,
   reportDigest,{nowMs,ownerPin,reviewerPin},
   Math.max(...evidence.reports.map(r=>Date.parse(r.payload.observedAt)))))
  return failAfter('DUAL_SIGNED_QL430_RUNTIME_OWNER_ACCEPTANCE_REJECTED');
 try{
  const accepted=protectedAudit.claimOnce('accepted',p.ceremonyId,digest({
   ql429WitnessDigest:w.witness.recordDigest,independentReceiverDigest:receiverDigest,
   ql424AcceptanceDigest:acceptedDigest,ql430ReportsDigest:reportDigest,
   ownerRuntimeDigest:digest(evidence.ownerAcceptance.payload)}));
  if(protectedAudit.read('accepted',p.ceremonyId)?.recordDigest!==accepted.recordDigest)
   throw Error('QL430_DURABLE_ACCEPTANCE_READBACK_FAILED');
  return {state:'DURABLE_VERIFIED_THREE_MASTER_REENTRY_ISOLATED_PILOT',
   connection:'VERIFIED_CONNECTED_PILOT',receiver:'ISOLATED_ONE_TEST_ON',
   runtimeUptime:'SINGLE_SIGNED_RUNTIME_SNAPSHOT_NOT_CONTINUOUS_UPTIME',
   ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',
   slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
   sourceId:p.sourceId,episodeId:p.episodeId,
   sourceRevision:p.sourceRevision,controllerRevision:p.controllerRevision,
   ceremonyId:p.ceremonyId,masterCount:3,
   acceptedRecordDigest:accepted.recordDigest,
   independentReceiverDigest:receiverDigest,
   ql429WitnessDigest:w.witness.recordDigest};
 }catch{return failAfter('DURABLE_QL430_ACCEPTANCE_CUSTODY_FAILED');}
}
