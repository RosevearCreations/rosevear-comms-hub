import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,
 closeSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {SOURCE_IDS,MASTER_IDS} from './ql461-protocol11-tenant-policy.mjs';
import {QL462_SCHEMA} from './ql462-signed-outbox-inbox.mjs';

/** QL-463 signed-causality evidence ONLY. Never invoke a transport, service,
 * Windows process, physical receiver, business mutation, or external effect. */
export const QL463_SCHEMA='rosevear.ql463.causality-effect-readiness.v1';
export const QL463_MASTER_MODULES=Object.freeze(
 ['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
export const QL463_ORIGINAL_HOST='DESKTOP-AE894KC';
const ID=/^[A-Za-z0-9_-]{12,96}$/,HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/;
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const clock=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const recent=(s,now,ttl=60000)=>Number.isSafeInteger(now)&&
 Number.isFinite(clock(s))&&clock(s)<=now&&now-clock(s)<=ttl;
const hold=reason=>({state:'HOLD',reason,incidentStatus:'OPEN',
 connection:'HOLD',runtimeConnected:false,activationAuthorized:false,
 closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 effectExecuted:false,hostServiceInstalled:false,authorityTransfer:false,
 localOperationsRemainAvailable:true});
function signed(envelope,pin,keys){
 try{
  if(!exact(envelope,['payload','signature'])||!exact(envelope.payload,keys)||
   typeof pin!=='string'||pin.length>512||
   typeof envelope.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature))
   return false;
  const binary=Buffer.from(pin,'base64');
  if(binary.toString('base64')!==pin)return false;
  const k=createPublicKey({key:binary,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'&&verify(null,
   Buffer.from(JSON.stringify(envelope.payload)),k,
   Buffer.from(envelope.signature,'base64'));
 }catch{return false;}
}
export const QL463_EVENT_FIELDS=Object.freeze([
 'schema','eventId','effectKey','sequence','parentEffectKey','parentReceiptDigest',
 'messageId','idempotencyKey','outboxDigest','ackReceiptDigest',
 'sourceId','targetAudience','protocol','tenantId','workspaceId',
 'sourceMainSha','bodyDigest','causalEpoch','action',
 'issuedAt','expiresAt','authorityTransfer','runtimeConnected']);
export const QL463_MASTER_FIELDS=Object.freeze([
 'schema','eventId','effectKey','eventDigest','outboxDigest',
 'ackReceiptDigest','masterId','reviewDecision','reviewedAt',
 'incidentStatus','authorityTransfer']);
export const QL463_OWNER_FIELDS=Object.freeze([
 'schema','eventId','effectKey','eventDigest','masterDigest',
 'ownerId','decision','reviewedAt','incidentStatus','authorityTransfer']);
export const QL463_HOST_FIELDS=Object.freeze([
 'schema','originalHost','batchId','hostIdentity','observedAt',
 'incidentStatus','proposedController','modules','serviceInstallVerified',
 'receiverActivationAuthorized','physicalReceiverOffVerified',
 'serviceControlEnabled','networkReceiverEnabled','homeAutomationConnected',
 'authorityTransfer']);
const QL462_ACK_FIELDS=['schema','messageId','idempotencyKey','sourceId',
 'targetAudience','outboxDigest','protocol','reviewState','acceptedAt',
 'runtimeConnection','authorityTransfer'];
const QL462_MESSAGE_FIELDS=['schema','messageId','idempotencyKey','replayNonce',
 'sourceId','sourceRepository','sourceMainSha','targetAudience','protocol',
 'capability','tenantId','workspaceId','subjectId','correlationId','bodyDigest',
 'bodyClass','issuedAt','expiresAt','requestScope','authorityTransfer',
 'privateDataIncluded','directPeerDatabaseWrite','ownerCeremonyRequested'];
const QL463_RECEIPT_FIELDS=['schema','kind','recordId','evidence','digest'];
const QL463_EVIDENCE_FIELDS=['eventId','effectKey','messageId','idempotencyKey','eventDigest','sourceId',
 'targetAudience','tenantId','workspaceId','sequence','referenceDigest',
 'state','originalHost'];
/** Append-only single-process/multi-process custody with exclusive atomic claim.
 * Existing corrupt/tampered files fail closed. Parent directories must be
 * independently protected by the deploying host. */
export function openQl463CausalLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL463_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL463_UNSAFE_LEDGER_DIRECTORY');
 const path=(kind,id)=>{
  if(!['reconciled','effectclaim','exception','eventindex','messageindex'].includes(kind)||!ID.test(id??''))
   throw Error('QL463_INVALID_LEDGER_KEY');
  return join(root,'ql463-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let fd;
  try{fd=openSync(path(kind,id),constants.O_RDONLY|constants.O_NOFOLLOW);}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  try{
   const stat=fstatSync(fd);
   if(!stat.isFile()||(stat.mode&0o077)||stat.size>4096)
    throw Error('UNSAFE_FILE');
   const rec=JSON.parse(readFileSync(fd,'utf8'));
   if(!exact(rec,QL463_RECEIPT_FIELDS)||rec.schema!==QL463_SCHEMA||
    rec.kind!==kind||rec.recordId!==id||
    !exact(rec.evidence,QL463_EVIDENCE_FIELDS)||
    (!ID.test(rec.evidence.effectKey??'')||
     (kind==='eventindex'?rec.evidence.eventId!==id:
      kind==='messageindex'?rec.evidence.idempotencyKey!==id:
      rec.evidence.effectKey!==id))||
    !ID.test(rec.evidence.eventId??'')||
    !ID.test(rec.evidence.messageId??'')||
    !ID.test(rec.evidence.idempotencyKey??'')||
    !HEX.test(rec.evidence.eventDigest??'')||
    !HEX.test(rec.evidence.referenceDigest??'')||
    !SOURCE_IDS.includes(rec.evidence.sourceId)||
    !MASTER_IDS.includes(rec.evidence.targetAudience)||
    !ID.test(rec.evidence.tenantId??'')||!ID.test(rec.evidence.workspaceId??'')||
    !Number.isSafeInteger(rec.evidence.sequence)||rec.evidence.sequence<0||
    rec.evidence.originalHost!==QL463_ORIGINAL_HOST||
    rec.digest!==sha({schema:QL463_SCHEMA,kind,recordId:id,evidence:rec.evidence}))
    throw Error('TAMPERED_RECEIPT');
   return rec;
  }catch(e){throw Error('QL463_READ_CUSTODY_DENIED:'+e.message);}
  finally{closeSync(fd);}
 };
 const claim=(kind,id,evidence)=>{
  if(read(kind,id))throw Error('QL463_DUPLICATE_EFFECT_OR_EVENT');
  const rec={schema:QL463_SCHEMA,kind,recordId:id,evidence};
  rec.digest=sha(rec);
  const fd=openSync(path(kind,id),constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dir=openSync(root,constants.O_RDONLY);
  try{fsyncSync(dir);}finally{closeSync(dir);}
  if(read(kind,id)?.digest!==rec.digest)throw Error('QL463_CUSTODY_READBACK_DENIED');
  return rec;
 };
 return Object.freeze({read,claim});
}
/** Readback of both old receipts and signed original envelopes is mandatory.
 * No caller-provided 'ackVerified' or 'connected' boolean may grant authority. */
export function reconcileQl463SignedEvent({
 ql462Ledger,causalLedger,event,masterWitness,ownerDecision,
 signedOutbox,signedAck,sourcePin,masterPin,ownerPin,
 expectedSourceSha,nowMs,readTrustedNowMs
}={}){
 if(typeof ql462Ledger?.read!=='function'||typeof causalLedger?.read!=='function'||
  typeof causalLedger?.claim!=='function'||typeof readTrustedNowMs!=='function')
  return hold('QL463_INDEPENDENT_DURABLE_CUSTODY_REQUIRED');
 if(!signed(event,sourcePin,QL463_EVENT_FIELDS)||
  !signed(masterWitness,masterPin,QL463_MASTER_FIELDS)||
  !signed(ownerDecision,ownerPin,QL463_OWNER_FIELDS)||
  !signed(signedOutbox,sourcePin,QL462_MESSAGE_FIELDS)||
  !signed(signedAck,masterPin,QL462_ACK_FIELDS)||
  new Set([sourcePin,masterPin,ownerPin]).size!==3)
  return hold('QL463_THREE_INDEPENDENT_SIGNATURES_REQUIRED');
 const e=event.payload,w=masterWitness.payload,o=ownerDecision.payload,
  msg=signedOutbox.payload,ack=signedAck.payload;
 if(e.schema!==QL463_SCHEMA||!ID.test(e.eventId??'')||
  !ID.test(e.effectKey??'')||!ID.test(e.idempotencyKey??'')||
  !ID.test(e.messageId??'')||!ID.test(e.causalEpoch??'')||
  !Number.isSafeInteger(e.sequence)||e.sequence<0||
  !SOURCE_IDS.includes(e.sourceId)||!MASTER_IDS.includes(e.targetAudience)||
  e.sourceId===e.targetAudience||!SHA.test(expectedSourceSha??'')||
  e.sourceMainSha!==expectedSourceSha||!HEX.test(e.bodyDigest??'')||
  !HEX.test(e.outboxDigest??'')||!HEX.test(e.ackReceiptDigest??'')||
  !ID.test(e.tenantId??'')||!ID.test(e.workspaceId??'')||
  e.action!=='READ_ONLY_CAUSAL_REVIEW'||e.authorityTransfer!==false||
  e.runtimeConnected!==false||
  !['1.0','1.1'].includes(e.protocol)||
  !recent(e.issuedAt,nowMs)||!Number.isFinite(clock(e.expiresAt))||
  clock(e.expiresAt)<=nowMs||clock(e.expiresAt)-clock(e.issuedAt)>60000)
  return hold('QL463_EVENT_SCOPE_CLOCK_OR_IDENTITY_DENIED');
 if(msg.schema!==QL462_SCHEMA||msg.messageId!==e.messageId||
  msg.idempotencyKey!==e.idempotencyKey||msg.sourceId!==e.sourceId||
  msg.targetAudience!==e.targetAudience||msg.sourceMainSha!==expectedSourceSha||
  msg.protocol!==e.protocol||msg.tenantId!==e.tenantId||
  msg.workspaceId!==e.workspaceId||msg.bodyDigest!==e.bodyDigest||
  msg.requestScope!=='SOURCE_READ_ONLY'||msg.privateDataIncluded!==false||
  msg.directPeerDatabaseWrite!==false||msg.authorityTransfer!==false||
  msg.ownerCeremonyRequested!==false||
  ack.schema!=='rosevear.ql462.master-ack.v1'||
  ack.messageId!==e.messageId||ack.idempotencyKey!==e.idempotencyKey||
  ack.sourceId!==e.sourceId||ack.targetAudience!==e.targetAudience||
  ack.protocol!==e.protocol||ack.outboxDigest!==e.outboxDigest||
  ack.reviewState!=='SOURCE_REVIEW_ACCEPTED'||
  ack.runtimeConnection!=='UNVERIFIED_HOLD'||ack.authorityTransfer!==false||
  !recent(ack.acceptedAt,nowMs))
  return hold('QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 const digest=sha(e),wd=sha(w);
 if(w.schema!=='rosevear.ql463.master-causal-witness.v1'||
  w.eventId!==e.eventId||w.effectKey!==e.effectKey||
  w.eventDigest!==digest||w.outboxDigest!==e.outboxDigest||
  w.ackReceiptDigest!==e.ackReceiptDigest||
  w.masterId!==e.targetAudience||
  w.reviewDecision!=='SOURCE_REVIEW_ONLY_KEEP_OPEN_HOLD'||
  w.incidentStatus!=='OPEN_HOLD'||w.authorityTransfer!==false||
  !recent(w.reviewedAt,nowMs)||clock(w.reviewedAt)<clock(e.issuedAt)||
  o.schema!=='rosevear.ql463.owner-veto.v1'||
  o.eventId!==e.eventId||o.effectKey!==e.effectKey||
  o.eventDigest!==digest||o.masterDigest!==wd||
  !ID.test(o.ownerId??'')||
  o.decision!=='REVIEW_ONLY_NO_EXECUTION_KEEP_OPEN_HOLD'||
  o.incidentStatus!=='OPEN_HOLD'||o.authorityTransfer!==false||
  !recent(o.reviewedAt,nowMs)||
  clock(o.reviewedAt)<clock(w.reviewedAt))
  return hold('QL463_MASTER_OR_OWNER_VETO_DENIED');
 try{
  const old=ql462Ledger.read('outbox',e.idempotencyKey);
  const ackRec=ql462Ledger.read('ack',e.idempotencyKey);
  const dead=ql462Ledger.read('deadletter',e.idempotencyKey);
  if(!old||!ackRec||dead||
   old.evidence.messageId!==e.messageId||
   old.evidence.messageDigest!==sha(msg)||
   old.evidence.sourceId!==e.sourceId||
   old.evidence.targetAudience!==e.targetAudience||
   old.evidence.protocol!==e.protocol||old.digest!==e.outboxDigest||
   ackRec.evidence.state!=='SOURCE_REVIEW_ACCEPTED'||
   ackRec.evidence.messageDigest!==old.evidence.messageDigest||
   ackRec.evidence.referenceDigest!==sha(ack)||
   ackRec.digest!==e.ackReceiptDigest)
   return hold('QL463_QL462_ACK_CUSTODY_UNTRUSTED');
  if(e.sequence===0){
   if(e.parentEffectKey!=='GENESIS'||e.parentReceiptDigest!=='0'.repeat(64))
    return hold('QL463_GENESIS_CAUSAL_ROOT_INVALID');
  }else{
   if(!ID.test(e.parentEffectKey??'')||
    !HEX.test(e.parentReceiptDigest??'')||
    e.parentEffectKey===e.effectKey)
    return hold('QL463_PARENT_CAUSAL_REFERENCE_INVALID');
   const parent=causalLedger.read('reconciled',e.parentEffectKey);
   if(!parent||parent.digest!==e.parentReceiptDigest||
    parent.evidence.sequence+1!==e.sequence||
    parent.evidence.sourceId!==e.sourceId||
    parent.evidence.targetAudience!==e.targetAudience||
    parent.evidence.tenantId!==e.tenantId||
    parent.evidence.workspaceId!==e.workspaceId)
    return hold('QL463_PARENT_CAUSAL_CHAIN_TENANT_OR_ORDER_DENIED');
  }
  if(causalLedger.read('eventindex',e.eventId)||
   causalLedger.read('messageindex',e.idempotencyKey)||
   causalLedger.read('reconciled',e.effectKey)||
   causalLedger.read('effectclaim',e.effectKey)||
   causalLedger.read('exception',e.effectKey))
   return hold('QL463_REPLAY_OR_DUPLICATE_CAUSAL_EFFECT');
  const commitNow=readTrustedNowMs();
  if(!Number.isSafeInteger(commitNow)||commitNow<nowMs||
   commitNow-nowMs>60000||!recent(o.reviewedAt,commitNow)||
   clock(e.expiresAt)<=commitNow||
   !ql462Ledger.read('ack',e.idempotencyKey)||
   ql462Ledger.read('deadletter',e.idempotencyKey))
   return hold('QL463_COMMIT_TRUSTED_CLOCK_OR_CUSTODY_CHANGED');
  const evidence={eventId:e.eventId,effectKey:e.effectKey,
   messageId:e.messageId,idempotencyKey:e.idempotencyKey,
   eventDigest:digest,sourceId:e.sourceId,targetAudience:e.targetAudience,
   tenantId:e.tenantId,workspaceId:e.workspaceId,sequence:e.sequence,
   referenceDigest:sha({old:old.digest,ack:ackRec.digest,
    parent:e.parentReceiptDigest,master:wd,owner:sha(o)}),
   state:'SIGNED_CAUSAL_RECONCILED_NO_EXECUTION',originalHost:QL463_ORIGINAL_HOST};
  // Reserve both names BEFORE the effect record. A crash between these
  // exclusive writes leaves HOLD for manual recovery; never retry effects.
  causalLedger.claim('messageindex',e.idempotencyKey,{
   ...evidence,state:'RESERVED_ONE_USE_ORIGINAL_MESSAGE_NO_EFFECT'});
  causalLedger.claim('eventindex',e.eventId,{
   ...evidence,state:'RESERVED_ONE_USE_CAUSAL_EVENT_NO_EFFECT'});
  const rec=causalLedger.claim('reconciled',e.effectKey,evidence);
  return {...hold('SIGNED_CAUSAL_REVIEW_IS_NOT_LIVE_DELIVERY'),
   state:'DURABLE_SIGNED_CAUSAL_REVIEW_ONLY',eventId:e.eventId,
   effectKey:e.effectKey,sequence:e.sequence,reconciledDigest:rec.digest,
   signedAckReceiptDigest:ackRec.digest,
   allowedNextAction:'OWNER_SAFE_NOOP_EFFECT_GATE_CLAIM_ONLY'};
 }catch{return hold('QL463_CAUSAL_CUSTODY_READBACK_OR_RACE_DENIED');}
}
/** Exactly-once *no-op claim*, not exactly-once remote execution. The append
 * is atomic per private shared directory using O_EXCL; a crash after a claim
 * holds for owner review rather than retries of an external side effect. */
export function claimQl463ExactlyOnceEffect({
 causalLedger,effectKey,reconciledDigest,
 readTrustedNowMs,clockAttested=false,hostReceiverIsolated=false,
 ownerGated=true
}={}){
 if(!ID.test(effectKey??'')||!HEX.test(reconciledDigest??'')||
  typeof causalLedger?.read!=='function'||
  typeof causalLedger?.claim!=='function'||
  typeof readTrustedNowMs!=='function'||!clockAttested||
  !hostReceiverIsolated||!ownerGated)
  return hold('QL463_OWNER_HOST_AND_PRIVATE_EFFECT_GATE_REQUIRED');
 try{
  const rec=causalLedger.read('reconciled',effectKey);
  if(!rec||rec.digest!==reconciledDigest||
   !causalLedger.read('eventindex',rec.evidence.eventId)||
   !causalLedger.read('messageindex',rec.evidence.idempotencyKey)||
   rec.evidence.state!=='SIGNED_CAUSAL_RECONCILED_NO_EXECUTION'||
   causalLedger.read('effectclaim',effectKey)||
   causalLedger.read('exception',effectKey))
   return hold('QL463_REPLAY_WRONG_CAUSAL_DIGEST_OR_ALREADY_CLAIMED');
  const now=readTrustedNowMs();
  if(!Number.isSafeInteger(now)||now<0)
   return hold('QL463_TRUSTED_CLAIM_CLOCK_UNAVAILABLE');
  const claimed=causalLedger.claim('effectclaim',effectKey,{
   ...rec.evidence,state:'EFFECT_NOOP_EXCLUSIVE_CLAIM_NO_EXECUTION',
   referenceDigest:sha({reconciled:rec.digest,at:now})});
  return {...hold('EXACTLY_ONCE_LOCAL_NOOP_CLAIM_NOT_REMOTE_EFFECT'),
   state:'DURABLE_NOOP_EFFECT_CLAIM_ONLY',
   effectKey,claimDigest:claimed.digest};
 }catch{return hold('QL463_EXCLUSIVE_EFFECT_CLAIM_DENIED');}
}
export function inspectQl463Effect(causalLedger,effectKey){
 try{
  const reconciled=causalLedger.read('reconciled',effectKey),
   claim=causalLedger.read('effectclaim',effectKey),
   exception=causalLedger.read('exception',effectKey);
  if(!reconciled||claim&&exception||
   claim&&claim.evidence.eventDigest!==reconciled.evidence.eventDigest||
   exception&&exception.evidence.eventDigest!==reconciled.evidence.eventDigest)
   return hold('QL463_EFFECT_CUSTODY_NOT_RECONCILABLE');
  return {...hold('NO_EXTERNAL_EFFECT_EVER_EXECUTED_BY_QL463'),
   state:claim?'NOOP_EFFECT_CLAIMED_NO_EXECUTION':
    exception?'SIGNED_EXCEPTION_OPEN_HOLD':
    'CAUSAL_REVIEW_ONLY_AWAITING_OWNER_GATE',
   effectKey,reconciledDigest:reconciled.digest,
   claimDigest:claim?.digest??null};
 }catch{return hold('QL463_EFFECT_CUSTODY_UNREADABLE');}
}
/** Signature is a host source report only, not proof that a real service is
 * installed, physically OFF, online, or accessible from Cloudflare. */
export function assessQl463OriginalHostReadiness({
 report,hostObserverPin,nowMs
}={}){
 if(!signed(report,hostObserverPin,QL463_HOST_FIELDS))
  return hold('QL463_ORIGINAL_HOST_SIGNED_OBSERVER_REQUIRED');
 const p=report.payload;
 if(p.schema!=='rosevear.ql463.host-supervision-readiness.v1'||
  p.originalHost!==QL463_ORIGINAL_HOST||!ID.test(p.batchId??'')||
  !ID.test(p.hostIdentity??'')||!recent(p.observedAt,nowMs)||
  p.incidentStatus!=='OPEN_HOLD'||
  p.proposedController!=='ai-data-platform'||
  !Array.isArray(p.modules)||p.modules.length!==3||
  p.modules.some((m,i)=>!exact(m,['moduleId','serviceState','recoveryPlan',
   'startPermission','currentTelemetry'])||
   m.moduleId!==QL463_MASTER_MODULES[i]||
   m.serviceState!=='UNVERIFIED_NOT_PROVISIONED'||
   m.recoveryPlan!=='OWNER_APPROVED_FUTURE_ONLY'||
   m.startPermission!==false||m.currentTelemetry!=='NOT_CONNECTED')||
  p.serviceInstallVerified!==false||
  p.receiverActivationAuthorized!==false||
  p.physicalReceiverOffVerified!==false||
  p.serviceControlEnabled!==false||p.networkReceiverEnabled!==false||
  p.homeAutomationConnected!==false||p.authorityTransfer!==false)
  return hold('QL463_HOST_SOURCE_STATE_OR_AUTHORITY_DENIED');
 return {...hold('HOST_READINESS_ATTESTATION_NOT_LIVE_SUPERVISION'),
  state:'SIGNED_HOST_SUPERVISION_PLAN_REVIEW_ONLY',
  moduleCount:3,controller:'ai-data-platform',
  originalHost:QL463_ORIGINAL_HOST,observerDigest:sha(p),
  recoveryPending:true,independentWindowsInstallNeeded:true};
}
