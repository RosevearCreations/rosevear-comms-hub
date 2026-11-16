import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync,
 fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {SOURCE_IDS,MASTER_IDS,REPO_BY_SOURCE,DIRECTIONAL_EDGES,
 negotiateQl461Protocol,evaluateQl461Authorization} from './ql461-protocol11-tenant-policy.mjs';

/** QL-462: signed, replay-safe, private source-only outbox/inbox proof ledger.
 * No sockets, cron, peer database writes, cloud calls, host activation or live delivery. */
export const QL462_SCHEMA='rosevear.ql462.signed-outbox-inbox.v1';
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{12,96}$/;
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const millis=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const recent=(s,now,max=300000)=>Number.isSafeInteger(now)&&
 Number.isFinite(millis(s))&&millis(s)<=now&&now-millis(s)<=max;
const hold=(reason)=>({state:'HOLD',reason,connection:'HOLD',incidentStatus:'OPEN',
 activationAuthorized:false,closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 runtimeConnected:false,authorityTransfer:false,localOperationsRemainAvailable:true,
 senderEnabled:false,receiverEnabled:false});
export const QL462_SOURCE_MODULES=Object.freeze([
 {id:'ai-data-platform',label:'Intelligence & Server Shell',role:'MASTER_CONTROLLER'},
 {id:'rosevear-ai-hub',label:'Local AI & Home Automation',role:'WINDOWS_SUPPORT'},
 {id:'rosevear-comms-hub',label:'Communications & Operator Inbox',role:'MASTER_COMMS'}
]);
export const QL462_SLAVES=Object.freeze([
 {id:'icamp',label:'iCamp',role:'SLAVE_APPLICATION_SHELL'},
 {id:'yw',label:'Yard Workers',role:'SLAVE_APPLICATION_SHELL'}
]);
export const QL462_VISUAL_THEMES=Object.freeze(['instrument','nebula','meadow','high-contrast']);
export const QL462_OWNER_DASHBOARD=Object.freeze({
 controller:'ai-data-platform',host:'DESKTOP-AE894KC',
 serviceActivation:'NOT_AUTHORIZED_BY_QL462',
 local24x7ServiceInstalled:false,peerHealth:'UNVERIFIED_HOLD',
 homeAssistantIntegration:'DESIGN_ONLY_NOT_CONNECTED',
 modules:QL462_SOURCE_MODULES,slaves:QL462_SLAVES,
 mediaThemes:QL462_VISUAL_THEMES
});
const messageFields=['schema','messageId','idempotencyKey','replayNonce',
 'sourceId','sourceRepository','sourceMainSha','targetAudience','protocol',
 'capability','tenantId','workspaceId','subjectId','correlationId','bodyDigest',
 'bodyClass','issuedAt','expiresAt','requestScope','authorityTransfer',
 'privateDataIncluded','directPeerDatabaseWrite','ownerCeremonyRequested'];
const ackFields=['schema','messageId','idempotencyKey','sourceId',
 'targetAudience','outboxDigest','protocol','reviewState','acceptedAt',
 'runtimeConnection','authorityTransfer'];
const dlqFields=['schema','messageId','idempotencyKey','outboxDigest','reason',
 'reviewedAt','sourceOwnerId','incidentStatus','authorityTransfer'];
function signatureOk(envelope,pin,fields){
 try{
  if(!exact(envelope,['payload','signature'])||!exact(envelope.payload,fields)||
   typeof pin!=='string'||pin.length>512||
   typeof envelope.signature!=='string'||!/^[a-zA-Z0-9+/]{86}==$/.test(envelope.signature))
   return false;
  const binary=Buffer.from(pin,'base64');
  if(binary.toString('base64')!==pin)return false;
  const k=createPublicKey({key:binary,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(envelope.payload)),k,
    Buffer.from(envelope.signature,'base64'));
 }catch{return false;}
}
export function openQl462DurableLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL462_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL462_UNSAFE_LEDGER_DIRECTORY');
 const filename=(kind,id)=>{
  if(!['outbox','ack','deadletter'].includes(kind)||!ID.test(id??''))
   throw Error('QL462_RECORD_KEY_INVALID');
  return join(root,'ql462-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const path=filename(kind,id);let fd;
  try{fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  try{
   const st=fstatSync(fd);
   if(!st.isFile()||(st.mode&0o077)||st.size>8192)
    throw Error('QL462_RECEIPT_FILE_UNSAFE');
   const r=JSON.parse(readFileSync(fd,'utf8'));
   if(!exact(r,['schema','kind','recordId','evidence','digest'])||
    r.schema!==QL462_SCHEMA||r.kind!==kind||r.recordId!==id||
    !exact(r.evidence,['messageId','idempotencyKey','messageDigest',
      'sourceId','targetAudience','protocol','state','referenceDigest'])||
    !ID.test(r.evidence.messageId??'')||
    r.evidence.idempotencyKey!==id||!HEX.test(r.evidence.messageDigest??'')||
    !HEX.test(r.evidence.referenceDigest??'')||
    r.digest!==hash({schema:QL462_SCHEMA,kind,recordId:id,evidence:r.evidence}))
    throw Error('QL462_RECEIPT_TAMPERED');
   return r;
  }catch(e){throw Error('QL462_CUSTODY_READ_FAILED:'+e.message);}
  finally{closeSync(fd);}
 };
 const append=(kind,id,evidence)=>{
  if(read(kind,id))throw Error('QL462_DUPLICATE_OR_REPLAY_CLAIM');
  const r={schema:QL462_SCHEMA,kind,recordId:id,evidence};
  r.digest=hash(r);
  const fd=openSync(filename(kind,id),constants.O_WRONLY|constants.O_CREAT|
    constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const dir=openSync(root,constants.O_RDONLY);
  try{fsyncSync(dir);}finally{closeSync(dir);}
  if(read(kind,id)?.digest!==r.digest)throw Error('QL462_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,append});
}
export function inspectQl462Outbox(ledger,id){
 try{
  const entry=ledger.read('outbox',id),ack=ledger.read('ack',id),
   dlq=ledger.read('deadletter',id);
  if(!entry)return hold('QL462_NO_OUTBOX_RECEIPT');
  if(ack&&dlq)return hold('QL462_CONFLICTING_RECEIPT_STATE');
  if((ack||dlq)&&entry.evidence.messageDigest!==(ack??dlq).evidence.messageDigest)
   return hold('QL462_RECEIPT_REFERENCE_MISMATCH');
  const suffix=ack?'INBOX_SIGNED_ACK_REVIEW_ONLY':dlq?
    'DEAD_LETTER_OPEN_HOLD':'PENDING_LOCAL_OUTBOX_HOLD';
  return {...hold(ack?'SIGNED_ACK_IS_NOT_LIVE_DELIVERY':
     dlq?'DEAD_LETTER_REQUIRES_OWNER_REVIEW':'PEER_DELIVERY_NOT_AUTHORIZED'),
   state:suffix,messageId:entry.evidence.messageId,
   idempotencyKey:id,outboxDigest:entry.digest,
   referenceReceiptDigest:(ack??dlq)?.digest??null};
 }catch{return hold('QL462_CUSTODY_CORRUPT_OR_UNREADABLE');}
}
export function stageQl462SignedOutbox({
 ledger,envelope,sourcePin,authorizationArgs,expectedMainShas,
 peerProtocol='1.0',peerAvailable=false,nowMs
}={}){
 if(typeof ledger?.read!=='function'||typeof ledger?.append!=='function')
  return hold('QL462_PRIVATE_LEDGER_REQUIRED');
 if(!signatureOk(envelope,sourcePin,messageFields))
  return hold('QL462_SIGNED_MESSAGE_INVALID');
 const m=envelope.payload;
 if(m.schema!==QL462_SCHEMA||
  !ID.test(m.messageId??'')||!ID.test(m.idempotencyKey??'')||
  !ID.test(m.replayNonce??'')||!ID.test(m.subjectId??'')||
  !ID.test(m.correlationId??'')||!ID.test(m.tenantId??'')||
  !ID.test(m.workspaceId??'')||!HEX.test(m.bodyDigest??'')||
  !SOURCE_IDS.includes(m.sourceId)||
  REPO_BY_SOURCE[m.sourceId]!==m.sourceRepository||
  !SHA.test(expectedMainShas?.[m.sourceId]??'')||
  m.sourceMainSha!==expectedMainShas[m.sourceId]||
  !MASTER_IDS_IN_SCOPE(m.targetAudience)||m.sourceId===m.targetAudience||
  !['PUBLIC_HEALTH_ONLY','SOURCE_NONPERSONAL_EVIDENCE'].includes(m.bodyClass)||
  m.requestScope!=='SOURCE_READ_ONLY'||m.authorityTransfer!==false||
  m.privateDataIncluded!==false||m.directPeerDatabaseWrite!==false||
  m.ownerCeremonyRequested!==false||
  !recent(m.issuedAt,nowMs)||!Number.isFinite(millis(m.expiresAt))||
  nowMs>=millis(m.expiresAt)||
  millis(m.expiresAt)-millis(m.issuedAt)>300000)
  return hold('QL462_MESSAGE_SCOPE_TENANT_OR_FRESHNESS_DENIED');
 const neg=negotiateQl461Protocol({
  local:'1.1',peer:peerProtocol,peerAvailable:true,capability:m.capability});
 if(neg.state!=='COMPATIBLE_SOURCE_ONLY'||m.protocol!==neg.negotiatedProtocol)
  return hold('QL462_PEER_PROTOCOL_CAPABILITY_UNSUPPORTED');
 if(!authorizationArgs||
  authorizationArgs.sourcePin!==sourcePin||
  authorizationArgs.peerProtocol!==peerProtocol||
  authorizationArgs.expectedMainShas?.[m.sourceId]!==m.sourceMainSha||
  authorizationArgs.request?.proof?.payload?.sourceId!==m.sourceId||
  authorizationArgs.request?.proof?.payload?.targetAudience!==m.targetAudience||
  authorizationArgs.request?.proof?.payload?.capability!==m.capability||
  authorizationArgs.request?.proof?.payload?.tenantId!==m.tenantId||
  authorizationArgs.request?.proof?.payload?.workspaceId!==m.workspaceId||
  authorizationArgs.request?.proof?.payload?.protocol!==m.protocol||
  authorizationArgs.request?.proof?.payload?.personalData!==false||
  authorizationArgs.request?.proof?.payload?.action!=='READ')
  return hold('QL462_SIGNED_QL461_AUTHORIZATION_CONTEXT_REQUIRED');
 // Validates local source contract, not an actual online/healthy remote peer.
 const reviewed=evaluateQl461Authorization({...authorizationArgs,
  peerAvailable:true,nowMs,expectedMainShas});
 if(reviewed.state!=='SOURCE_POLICY_ELIGIBLE_REVIEW_ONLY')
  return hold('QL462_QL461_TENANT_POLICY_HOLD_'+reviewed.reason);
 const digest=hash(m),id=m.idempotencyKey;
 try{
  const prior=ledger.read('outbox',id);
  if(prior){
   if(prior.evidence.messageDigest===digest&&prior.evidence.messageId===m.messageId)
    return {...inspectQl462Outbox(ledger,id),duplicate:true};
   return hold('QL462_IDEMPOTENCY_CONFLICT_OR_REPLAY');
  }
  const evidence={
   messageId:m.messageId,idempotencyKey:id,messageDigest:digest,
   sourceId:m.sourceId,targetAudience:m.targetAudience,protocol:m.protocol,
   state:'SIGNED_PENDING_HOLD',referenceDigest:reviewed.policyDigest};
  const receipt=ledger.append('outbox',id,evidence);
  return {...hold(peerAvailable?'SYNTHETIC_SOURCE_STAGED_NO_LIVE_SEND':
     'PEER_OFFLINE_INDEPENDENT_LOCAL_WORK_CONTINUES'),
   state:'SIGNED_OUTBOX_PENDING_HOLD',messageId:m.messageId,idempotencyKey:id,
   outboxDigest:receipt.digest,policyDigest:reviewed.policyDigest,
   peerAvailable,requiresLiveDeliveryEvidence:true,
   negotiatedProtocol:m.protocol};
 }catch{return hold('QL462_DURABLE_OUTBOX_CLAIM_FAILED');}
}
function MASTER_IDS_IN_SCOPE(app){
 return ['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'].includes(app);
}
export function reviewQl462SignedAck({ledger,ack,masterPin,idempotencyKey,nowMs}={}){
 if(typeof ledger?.read!=='function'||typeof ledger?.append!=='function'||
  !ID.test(idempotencyKey??''))
  return hold('QL462_PRIVATE_LEDGER_REQUIRED');
 if(!signatureOk(ack,masterPin,ackFields))
  return hold('QL462_MASTER_ACK_SIGNATURE_INVALID');
 const a=ack.payload;
 try{
  const entry=ledger.read('outbox',idempotencyKey);
  if(!entry)return hold('QL462_OUTBOX_MUST_EXIST_BEFORE_ACK');
  if(ledger.read('ack',idempotencyKey)||ledger.read('deadletter',idempotencyKey))
   return hold('QL462_ACK_REPLAY_OR_DEADLETTER_CONFLICT');
  if(a.schema!=='rosevear.ql462.master-ack.v1'||
   a.messageId!==entry.evidence.messageId||
   a.idempotencyKey!==idempotencyKey||
   a.sourceId!==entry.evidence.sourceId||
   a.targetAudience!==entry.evidence.targetAudience||
   a.outboxDigest!==entry.digest||
   a.protocol!==entry.evidence.protocol||
   !['SOURCE_REVIEW_ACCEPTED','SOURCE_REVIEW_DENIED'].includes(a.reviewState)||
   a.runtimeConnection!=='UNVERIFIED_HOLD'||a.authorityTransfer!==false||
   !recent(a.acceptedAt,nowMs,300000))
   return hold('QL462_ACK_BINDING_OR_FRESHNESS_DENIED');
  const receipt=ledger.append('ack',idempotencyKey,{
   ...entry.evidence,state:a.reviewState,
   referenceDigest:hash(a)});
  return {...hold('SIGNED_MASTER_ACK_REVIEW_NOT_DELIVERY'),
   state:a.reviewState==='SOURCE_REVIEW_DENIED'?'SIGNED_SOURCE_DENIAL_OPEN_HOLD':
    'SIGNED_MASTER_ACK_REVIEW_ONLY',
   messageId:a.messageId,ackReceiptDigest:receipt.digest};
 }catch{return hold('QL462_ACK_PRIVATE_CUSTODY_FAILED');}
}
export function deadLetterQl462({ledger,review,ownerPin,idempotencyKey,nowMs}={}){
 if(typeof ledger?.read!=='function'||typeof ledger?.append!=='function'||
  !ID.test(idempotencyKey??''))
  return hold('QL462_PRIVATE_LEDGER_REQUIRED');
 if(!signatureOk(review,ownerPin,dlqFields))
  return hold('QL462_INDEPENDENT_OWNER_DEADLETTER_SIGNATURE_INVALID');
 const d=review.payload;
 try{
  const entry=ledger.read('outbox',idempotencyKey);
  if(!entry)return hold('QL462_OUTBOX_MUST_EXIST_BEFORE_DEADLETTER');
  if(ledger.read('ack',idempotencyKey)||ledger.read('deadletter',idempotencyKey))
   return hold('QL462_DEADLETTER_REPLAY_OR_ACK_CONFLICT');
  if(d.schema!=='rosevear.ql462.deadletter-review.v1'||
   d.messageId!==entry.evidence.messageId||
   d.idempotencyKey!==idempotencyKey||d.outboxDigest!==entry.digest||
   !['PEER_UNAVAILABLE','EXPIRED','SIGNED_SOURCE_DENIAL','RETRY_BUDGET'].includes(d.reason)||
   !ID.test(d.sourceOwnerId??'')||d.incidentStatus!=='OPEN_HOLD'||
   d.authorityTransfer!==false||!recent(d.reviewedAt,nowMs,300000))
   return hold('QL462_OWNER_DEADLETTER_BINDING_INVALID');
  const receipt=ledger.append('deadletter',idempotencyKey,{
   ...entry.evidence,state:'OWNER_SIGNED_DEAD_LETTER',
   referenceDigest:hash(d)});
  return {...hold('OWNER_SIGNED_DEADLETTER_REQUIRES_MANUAL_RESOLUTION'),
   state:'SIGNED_DEAD_LETTER_OPEN_HOLD',messageId:d.messageId,
   deadLetterReceiptDigest:receipt.digest};
 }catch{return hold('QL462_DEADLETTER_PRIVATE_CUSTODY_FAILED');}
}
export function reviewQl462LocalContinuity({moduleId,localOwnerAuthorized,
 localRoleAuthorized,peerAvailable=false}={}){
 if(!QL462_SOURCE_MODULES.some(m=>m.id===moduleId)||
  !localOwnerAuthorized||!localRoleAuthorized)
  return hold('QL462_LOCAL_MODULE_OWNER_ROLE_AUTH_REQUIRED');
 return {...hold(peerAvailable?'APP_LOCAL_OPERATIONS_INDEPENDENT_OF_PEER':
    'APP_LOCAL_OPERATIONS_CONTINUE_DURING_PEER_OUTAGE'),
  state:'LOCAL_OWNER_GATED_OPERATION_ALLOWED',
  moduleId,peerAvailable,
  permittedAction:'APP_LOCAL_ONLY_NOT_REMOTE_DELIVERY'};
}
