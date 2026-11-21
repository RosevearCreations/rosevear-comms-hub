/**
 * QL-481 — Private operator case handover and independently verified
 * Yard Workers/iCamp staging binding. No network listener, public API or
 * provider/customer delivery. File write occurs only on explicit commit.
 */
import {createHash,createPublicKey,createPrivateKey,sign,verify,timingSafeEqual} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,
 fsyncSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

export const QL481_BINDING='rosevear.comms.ql481.independent-source-binding.v1';
export const QL481_HANDOVER='rosevear.comms.ql481.private-operator-handover.v1';
export const QL481_ACK='rosevear.comms.ql481.durable-handover-ack.v1';
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const SCOPED=/^[a-z][a-z0-9_-]{2,63}$/;
const APP=new Set(['yard-workers','icamp']);
const BIND_FIELDS=['schema','bindingId','sourceApp','environment','tenantId',
 'sourceRevision','sourceSignerPin','operatorSignerPin','approvedAtMs',
 'expiresAtMs','sourceCustodianId','independentReviewerId','dataClass',
 'receiverEnabled','customerOperationsAuthorized','authorityTransfer'];
const HAND_FIELDS=['schema','handoverId','sourceApp','environment','tenantId',
 'episodeId','caseId','caseStatus','lastSequence','lastJournalDigest',
 'lastReceiptDigest','sourceRevision','operatorId','intentCount','pendingCount',
 'preparedAtMs','expiresAtMs','scopeClass','customerDeliveryVerified',
 'productionAcceptance','sourceRuntimeVerified','authorityTransfer'];
const ACK_FIELDS=['schema','handoverId','caseId','handoverDigest','sourceApp',
 'environment','tenantId','episodeId','ownerSignerPin','reviewerSignerPin',
 'committedAtMs','durableReadBack','disposition','authorityTransfer'];
const hash=o=>createHash('sha256').update(typeof o==='string'?o:JSON.stringify(o)).digest('hex');
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&
 timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const exact=(v,fields)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&fields.every(k=>Object.hasOwn(v,k));
const hold=(reason)=>({state:'HOLD',reason,sourceConnected:false,
 remoteProviderDelivered:false,physicalWitnessCertified:false,
 actualProductionIncidentAccepted:false,authorityTransfer:false});
function key(pin){
 try{if(typeof pin!=='string'||pin.length>512)return null;
  const b=Buffer.from(pin,'base64');if(b.toString('base64')!==pin)return null;
  const p=createPublicKey({key:b,format:'der',type:'spki'});
  return p.asymmetricKeyType==='ed25519'?p:null;
 }catch{return null}
}
function signed(env,pin,fields){
 try{return exact(env,['payload','signature'])&&exact(env.payload,fields)&&
  typeof env.signature==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(env.signature)&&
  Boolean(key(pin))&&verify(null,Buffer.from(JSON.stringify(env.payload)),key(pin),
   Buffer.from(env.signature,'base64'));
 }catch{return false}
}
function privateSigner(input){
 let s;
 try{s=input?.type==='private'?input:createPrivateKey(input)}
 catch{throw Error('QL481_PRIVATE_ED25519_SIGNER_REQUIRED')}
 if(s.asymmetricKeyType!=='ed25519')throw Error('QL481_PRIVATE_ED25519_SIGNER_REQUIRED');
 return s;
}
const signerPin=s=>createPublicKey(s).export({type:'spki',format:'der'}).toString('base64');
const scoped=p=>p&&APP.has(p.sourceApp)&&
 ['SIMULATION','PRIVATE_STAGING'].includes(p.environment)&&
 SCOPED.test(p.tenantId??'');
const recent=(p,t)=>Number.isSafeInteger(p)&&p>0&&p<=t&&t-p<=300000;
function privateDirectory(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))throw Error('QL481_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const path=resolve(directory);
 mkdirSync(path,{recursive:true,mode:0o700});
 const stat=lstatSync(path);
 if(!stat.isDirectory()||stat.isSymbolicLink()||
 (process.platform!=='win32'&&(stat.mode&0o077)))
  throw Error('QL481_PRIVATE_DIRECTORY_PERMISSIONS');
 return path;
}
function receipt(filename,ownerPin,reviewerPin){
 let fd;
 try{fd=openSync(filename,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return null;throw e}
 try{
  const stat=fstatSync(fd);
  if(!stat.isFile()||stat.size>16000||
   (process.platform!=='win32'&&(stat.mode&0o077)))
    throw Error('QL481_PRIVATE_RECEIPT_UNSAFE');
  const data=JSON.parse(readFileSync(fd,'utf8'));
  if(!exact(data,['requestDigest','ownerPacket','reviewerPacket','ack'])||
     !HEX.test(data.requestDigest??'')||
     !signed(data.ownerPacket,ownerPin,HAND_FIELDS)||
     !signed(data.reviewerPacket,reviewerPin,HAND_FIELDS)||
     JSON.stringify(data.ownerPacket.payload)!==JSON.stringify(data.reviewerPacket.payload)||
     !exact(data.ack,ACK_FIELDS)||data.ack.schema!==QL481_ACK||
     data.ack.handoverId!==data.ownerPacket.payload.handoverId||
     data.ack.caseId!==data.ownerPacket.payload.caseId||
     !same(data.ack.handoverDigest,hash(data.ownerPacket.payload))||
     data.ack.ownerSignerPin!==ownerPin||data.ack.reviewerSignerPin!==reviewerPin||
     data.ack.durableReadBack!==true||
     data.ack.disposition!=='SIGNED_READ_ONLY_HANDOVER_HELD'||
     data.ack.authorityTransfer!==false||
     !same(data.requestDigest,hash([data.ownerPacket,data.reviewerPacket])))
   throw Error('QL481_DURABLE_RECEIPT_TAMPERED');
  return data;
 }finally{closeSync(fd)}
}
function writeNew(folder,file,data){
 const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{writeFileSync(fd,JSON.stringify(data));fsyncSync(fd)}finally{closeSync(fd)}
 if(process.platform!=='win32'){
  const dfd=openSync(folder,constants.O_RDONLY);
  try{fsyncSync(dfd)}finally{closeSync(dfd)}
 }
}
export function reviewQl481SourceBinding({sourcePacket,reviewerPacket,
 sourceCustodianPin,reviewerPin,operatorPin,sourcePin,sourceApp,tenantId,
 expectedRevision,nowMs=Date.now()}={}){
 if(!key(sourceCustodianPin)||!key(reviewerPin)||!key(sourcePin)||
 !key(operatorPin)||new Set([sourceCustodianPin,reviewerPin,operatorPin,sourcePin]).size!==4||
 !signed(sourcePacket,sourceCustodianPin,BIND_FIELDS)||
 !signed(reviewerPacket,reviewerPin,BIND_FIELDS))
  return hold('QL481_INDEPENDENT_SOURCE_AND_REVIEWER_SIGNATURES_REQUIRED');
 const p=sourcePacket.payload;
 if(JSON.stringify(p)!==JSON.stringify(reviewerPacket.payload)||
 p.schema!==QL481_BINDING||!ID.test(p.bindingId??'')||
 !scoped(p)||p.sourceApp!==sourceApp||p.tenantId!==tenantId||
 p.environment!=='PRIVATE_STAGING'||p.sourceRevision!==expectedRevision||
 !SHA.test(p.sourceRevision??'')||p.sourceSignerPin!==sourcePin||
 p.operatorSignerPin!==operatorPin||!SCOPED.test(p.sourceCustodianId??'')||
 !SCOPED.test(p.independentReviewerId??'')||
 p.sourceCustodianId===p.independentReviewerId||
 p.dataClass!=='NON_SENSITIVE_SCOPED_EXCEPTION'||
 p.receiverEnabled!==false||p.customerOperationsAuthorized!==false||
 p.authorityTransfer!==false||!recent(p.approvedAtMs,nowMs)||
 !Number.isSafeInteger(p.expiresAtMs)||p.expiresAtMs<=nowMs||
 p.expiresAtMs-p.approvedAtMs>600000)
  return hold('QL481_BINDING_EXPIRED_CROSSED_SCOPE_OR_UNAUTHORIZED');
 return {...hold('QL481_SIGNED_STAGING_BINDING_NOT_FIELD_RUNTIME_ACCEPTANCE'),
  state:'SIGNED_PRIVATE_STAGING_SCOPE_REVIEW_HELD',
  bindingId:p.bindingId,sourceApp,tenantId,sourceRevision:expectedRevision,
  sourceSignerPin:sourcePin,operatorSignerPin:operatorPin,
  expiresAtMs:p.expiresAtMs,bindingDigest:hash(p)};
}
export function ingestQl481BoundedFieldEvent({adapter,binding,envelope,nowMs=Date.now()}={}){
 if(!adapter||typeof adapter.ingest!=='function'||
  binding?.state!=='SIGNED_PRIVATE_STAGING_SCOPE_REVIEW_HELD'||
  !Number.isSafeInteger(binding.expiresAtMs)||nowMs>=binding.expiresAtMs||
  !envelope?.payload||envelope.payload.sourceApp!==binding.sourceApp||
  envelope.payload.tenantId!==binding.tenantId||
  envelope.payload.environment!=='PRIVATE_STAGING'||
  envelope.payload.sourceRevision!==binding.sourceRevision)
  return hold('QL481_ENROLLED_SCOPED_PRIVATE_SOURCE_EVENT_REQUIRED');
 const result=adapter.ingest(envelope);
 if(!['SCOPED_CASE_EVENT_DURABLY_RECORDED',
      'DUPLICATE_SOURCE_EVENT_NO_NEW_EFFECT','HISTORICAL_RETAINED_NO_REOPEN'].includes(result.state))
  return hold('QL481_SIGNED_FIELD_EVENT_REJECTED_BY_DURABLE_ADAPTER');
 return {...result,fieldRuntimeVerified:false,
  state:'SCOPED_PRIVATE_STAGING_EVENT_COMMITTED_HELD',
  signedBindingDigest:binding.bindingDigest};
}
/** Exact redacted payload projected from a *protected signed QL480 read*. */
export function prepareQl481Handover({adapter,operatorReadPacket,ownerSigner,
 handoverId,operatorId,nowMs=Date.now()}={}){
 const p=operatorReadPacket?.payload;
 if(typeof adapter?.read!=='function'||!ID.test(handoverId??'')||
 !SCOPED.test(operatorId??'')||!scoped(p)||!ID.test(p.episodeId??'')||
 p.operatorId!==operatorId||!recent(p.requestedAtMs,nowMs))
  return hold('QL481_PROTECTED_CURRENT_CASE_READ_REQUIRED');
 const result=adapter.read(operatorReadPacket);
 if(result.state!=='PRIVATE_CASE_REVIEW_ONLY'||
 !['OPEN','RECOVERY_PENDING_OPERATOR_REVIEW','CLOSED'].includes(result.caseStatus)||
 !HEX.test(result.lastJournalDigest??'')||!HEX.test(result.lastReceiptDigest??'')||
 !SHA.test(result.sourceRevision??'')||
 result.scope.sourceApp!==p.sourceApp||result.scope.tenantId!==p.tenantId||
 result.scope.episodeId!==p.episodeId||result.scope.environment!==p.environment||
 result.productionAcceptance!==false||result.customerDeliveryVerified!==false)
  return hold('QL481_CURRENT_SIGNED_PRIVATE_CASE_EVIDENCE_REQUIRED');
 let s;
 try{s=privateSigner(ownerSigner)}catch{return hold('QL481_OWNER_SIGNER_REQUIRED')}
 const payload={schema:QL481_HANDOVER,handoverId,sourceApp:p.sourceApp,
  environment:p.environment,tenantId:p.tenantId,episodeId:p.episodeId,
  caseId:result.caseId,caseStatus:result.caseStatus,
  lastSequence:result.lastSequence,lastJournalDigest:result.lastJournalDigest,
  lastReceiptDigest:result.lastReceiptDigest,sourceRevision:result.sourceRevision,
  operatorId,intentCount:result.pendingIntents.length,
  pendingCount:result.pendingIntents.filter(x=>x.status!=='DISPOSED_SIMULATION').length,
  preparedAtMs:nowMs,expiresAtMs:nowMs+120000,
  scopeClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
  customerDeliveryVerified:false,productionAcceptance:false,
  sourceRuntimeVerified:false,authorityTransfer:false};
 const ownerPacket={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
   s).toString('base64')};
 return {...hold('QL481_REVIEWER_CUSTODY_AND_DURABLE_ACK_PENDING'),
   state:'SIGNED_HANDOVER_PREPARED_NOT_ACCEPTED',
   ownerPacket,ownerSignerPin:signerPin(s),handoverDigest:hash(payload)};
}
export function createQl481PrivateHandoverLedger({directory,ownerPin,reviewerPin,
 adapter,now=()=>Date.now()}={}){
 if(!key(ownerPin)||!key(reviewerPin)||ownerPin===reviewerPin||
 !adapter||typeof adapter.read!=='function')
  throw Error('QL481_DISTINCT_OWNER_REVIEWER_AND_ADAPTER_REQUIRED');
 const folder=privateDirectory(directory);
 function commit({ownerPacket,reviewerPacket,operatorReadPacket}={}){
  const t=now();
  if(!signed(ownerPacket,ownerPin,HAND_FIELDS)||
   !signed(reviewerPacket,reviewerPin,HAND_FIELDS)||
   JSON.stringify(ownerPacket.payload)!==JSON.stringify(reviewerPacket.payload))
    return hold('QL481_DISTINCT_OWNER_REVIEWER_HANDOVER_REQUIRED');
  const p=ownerPacket.payload;
  if(p.schema!==QL481_HANDOVER||!ID.test(p.handoverId??'')||
    !ID.test(p.episodeId??'')||!scoped(p)||
    !['OPEN','RECOVERY_PENDING_OPERATOR_REVIEW','CLOSED'].includes(p.caseStatus)||
    !HEX.test(p.lastJournalDigest??'')||!HEX.test(p.lastReceiptDigest??'')||
    !SHA.test(p.sourceRevision??'')||!ID.test(p.caseId??'')||
    !SCOPED.test(p.operatorId??'')||
    !Number.isSafeInteger(p.lastSequence)||p.lastSequence<=0||
    !Number.isSafeInteger(p.intentCount)||p.intentCount<0||
    !Number.isSafeInteger(p.pendingCount)||p.pendingCount<0||
    p.pendingCount>p.intentCount||
    p.scopeClass!=='NON_SENSITIVE_SCOPED_EXCEPTION'||
    p.customerDeliveryVerified!==false||p.productionAcceptance!==false||
    p.sourceRuntimeVerified!==false||p.authorityTransfer!==false||
    !recent(p.preparedAtMs,t)||!Number.isSafeInteger(p.expiresAtMs)||
    p.expiresAtMs<=t||p.expiresAtMs-p.preparedAtMs>120000)
    return hold('QL481_HANDOVER_PAYLOAD_SCOPE_OR_FRESHNESS_INVALID');
  const rr=operatorReadPacket?.payload;
  if(!rr||rr.sourceApp!==p.sourceApp||rr.tenantId!==p.tenantId||
    rr.episodeId!==p.episodeId||rr.environment!==p.environment||
    rr.operatorId!==p.operatorId)return hold('QL481_SIGNED_OPERATOR_READ_SCOPE_REQUIRED');
  const current=adapter.read(operatorReadPacket);
  if(current.state!=='PRIVATE_CASE_REVIEW_ONLY'||current.caseId!==p.caseId||
    current.caseStatus!==p.caseStatus||
    current.lastSequence!==p.lastSequence||
    !same(current.lastJournalDigest,p.lastJournalDigest)||
    !same(current.lastReceiptDigest,p.lastReceiptDigest)||
    current.sourceRevision!==p.sourceRevision||
    current.pendingIntents.length!==p.intentCount||
    current.pendingIntents.filter(x=>x.status!=='DISPOSED_SIMULATION').length!==p.pendingCount)
    return hold('QL481_HANDOVER_REPLAYED_OR_SOURCE_STATE_CHANGED');
  const file=join(folder,hash([p.sourceApp,p.environment,p.tenantId,p.episodeId,p.handoverId])+'.json');
  const requestDigest=hash([ownerPacket,reviewerPacket]);
  try{
    const old=receipt(file,ownerPin,reviewerPin);
    if(old)return same(old.requestDigest,requestDigest)?
      {...old.ack,state:'DURABLE_SIGNED_HANDOVER_ACK_REPLAY_HELD'}:
      hold('QL481_HANDOVER_ID_REUSE_CONFLICT');
    const ack={schema:QL481_ACK,handoverId:p.handoverId,caseId:p.caseId,
      handoverDigest:hash(p),sourceApp:p.sourceApp,
      environment:p.environment,tenantId:p.tenantId,episodeId:p.episodeId,
      ownerSignerPin:ownerPin,reviewerSignerPin:reviewerPin,
      committedAtMs:t,durableReadBack:true,
      disposition:'SIGNED_READ_ONLY_HANDOVER_HELD',authorityTransfer:false};
    writeNew(folder,file,{requestDigest,ownerPacket,reviewerPacket,ack});
    const saved=receipt(file,ownerPin,reviewerPin);
    return saved&&same(saved.requestDigest,requestDigest)?
      {...saved.ack,state:'DURABLE_SIGNED_HANDOVER_ACK_REVIEW_HELD'}:
      hold('QL481_ACK_READBACK_NOT_VERIFIED');
  }catch{return hold('QL481_PRIVATE_HANDOVER_LEDGER_UNAVAILABLE_OR_TAMPERED')}
 }
 return Object.freeze({commit,state:'PRIVATE_OPERATOR_HANDOVER_MANUAL_ONLY',
  autoListen:false,sourceConnected:false,providerDelivery:false});
}
export const QL481_BOUNDARY=Object.freeze({
 autoStart:false,publicRoute:false,customerWrites:false,
 realYWLiveCase:false,realICampLiveCase:false,
 originalHostReadback:'NOT_OBSERVED',customerDelivery:'NOT_SENT'});
