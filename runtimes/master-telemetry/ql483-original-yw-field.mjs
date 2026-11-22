/**
 * QL-483: supervised private Yard Workers enrollment and source-to-case ingress.
 *
 * No listener at import, no autonomous worker, no consumer/customer data.
 * The private original-host operator provisions trust anchors and signed
 * packets separately; GitHub CI never enrolls a real source.
 *
 * QL-481 supplies short-lived dual-signed authority; a separate Yard Workers
 * source-signed challenge proves possession of the enrolled source key.
 * QL-480 supplies the fsync journal and source/operator signatures.
 * QL-482 supplies read-only mTLS operator case access.
 */
import {createServer} from 'node:https';
import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,
 fsyncSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {reviewQl481SourceBinding,ingestQl481BoundedFieldEvent}
 from './ql481-private-incident-handover.mjs';
import {QL482_PATH} from './ql482-protected-case-read.mjs';

export const QL483_SOURCE_PROOF='rosevear.comms.ql483.yw-source-challenge.v1';
export const QL483_FIELD_WITNESS='rosevear.comms.ql483.yw-field-review.v1';
export const QL483_INGEST_PATH='/internal/comms/ql483/yard-workers/events';
const PROOF_KEYS=['schema','proofId','bindingId','sourceApp','environment',
 'tenantId','sourceRevision','sourceSignerPin','clientCertSha256',
 'challengeDigest','challengedAtMs','dataClass','customerDeliveryAuthorized',
 'authorityTransfer'];
const WITNESS_KEYS=['schema','reviewId','sourceApp','environment','tenantId',
 'episodeId','caseId','operatorId','enrollmentDigest','sourceRevision',
 'lastSequence','lastReceiptDigest','lastJournalDigest','reviewedAtMs',
 'originalHostWitnessed','actualBusinessSourceAccepted','customerDeliveryVerified',
 'authorityTransfer'];
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/,
 ID=/^[A-Za-z0-9_-]{8,96}$/,TENANT=/^[a-z][a-z0-9_-]{2,63}$/;
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hold=(reason)=>({state:'HOLD',reason,fieldAcceptance:'HOLD',
 originalHostVerified:false,productionAcceptance:false,
 customerDeliveryVerified:false,authorityTransfer:false});
const fingerprint=fp=>typeof fp==='string'?fp.replaceAll(':','').toLowerCase():'';
function publicKey(pin){
 try{
  if(typeof pin!=='string'||pin.length>512)return null;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return null;
  const k=createPublicKey({key:b,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'?k:null;
 }catch{return null}
}
function signed(env,pin,fields){
 try{
  return exact(env,['payload','signature'])&&exact(env.payload,fields)&&
   typeof env.signature==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(env.signature)&&
   !!publicKey(pin)&&verify(null,Buffer.from(JSON.stringify(env.payload)),
    publicKey(pin),Buffer.from(env.signature,'base64'));
 }catch{return false}
}
function privateDir(path){
 if(typeof path!=='string'||!isAbsolute(path)||
  path.split(/[\\/]/).includes('..'))throw Error('QL483_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const name=resolve(path);
 mkdirSync(name,{recursive:true,mode:0o700});
 const s=lstatSync(name);
 if(!s.isDirectory()||s.isSymbolicLink()||
   (process.platform!=='win32'&&(s.mode&0o077)))
  throw Error('QL483_PRIVATE_DIRECTORY_UNSAFE');
 return name;
}
function diskRead(file){
 let fd;
 try{fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return null;throw e}
 try{
  const stat=fstatSync(fd);
  if(!stat.isFile()||stat.size>20000||
   (process.platform!=='win32'&&(stat.mode&0o077)))
   throw Error('QL483_DURABLE_ENROLLMENT_UNSAFE');
  return JSON.parse(readFileSync(fd,'utf8'));
 }finally{closeSync(fd)}
}
function diskNew(folder,file,record){
 const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|
  constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{writeFileSync(fd,JSON.stringify(record));fsyncSync(fd)}finally{closeSync(fd)}
 if(process.platform!=='win32'){
  const dfd=openSync(folder,constants.O_RDONLY);
  try{fsyncSync(dfd)}finally{closeSync(dfd)}
 }
}
/** No trust-on-first-use: the four distinct pins and expected challenge
 * must come from an independently provisioned, private owner trust record. */
export function createQl483PrivateYardWorkersLink({directory,adapter,
 sourcePacket,reviewerPacket,sourceCustodianPin,reviewerPin,operatorPin,
 sourcePin,sourceProofPacket,clientCertFingerprint,expectedChallengeDigest,
 expectedRevision,tenantId,now=()=>Date.now()}={}){
 if(!adapter||typeof adapter.ingest!=='function'||typeof adapter.read!=='function'||
  !publicKey(sourcePin)||!publicKey(reviewerPin)||!publicKey(operatorPin)||
  !publicKey(sourceCustodianPin)||new Set([
   sourcePin,reviewerPin,operatorPin,sourceCustodianPin]).size!==4||
  fingerprint(clientCertFingerprint)!==clientCertFingerprint||
  !HEX.test(clientCertFingerprint??'')||!HEX.test(expectedChallengeDigest??'')||
  !SHA.test(expectedRevision??'')||!TENANT.test(tenantId??''))
  throw Error('QL483_INDEPENDENT_PRIVATE_TRUST_CONFIGURATION_REQUIRED');
 const folder=privateDir(directory);
 const file=join(folder,hash(['yard-workers','PRIVATE_STAGING',
  tenantId,sourcePacket?.payload?.bindingId])+'.json');
 const scoped=()=>{
  const t=now();
  const binding=reviewQl481SourceBinding({sourcePacket,reviewerPacket,
   sourceCustodianPin,reviewerPin,operatorPin,sourcePin,sourceApp:'yard-workers',
   tenantId,expectedRevision,nowMs:t});
  if(binding.state!=='SIGNED_PRIVATE_STAGING_SCOPE_REVIEW_HELD')
   return hold('QL483_DUAL_SIGNED_YW_SCOPE_REQUIRED');
  const p=sourceProofPacket?.payload;
  if(!signed(sourceProofPacket,sourcePin,PROOF_KEYS)||
   p.schema!==QL483_SOURCE_PROOF||!ID.test(p.proofId??'')||
   p.bindingId!==binding.bindingId||p.sourceApp!=='yard-workers'||
   p.environment!=='PRIVATE_STAGING'||p.tenantId!==tenantId||
   p.sourceRevision!==expectedRevision||p.sourceSignerPin!==sourcePin||
   p.clientCertSha256!==clientCertFingerprint||
   p.challengeDigest!==expectedChallengeDigest||
   !Number.isSafeInteger(p.challengedAtMs)||p.challengedAtMs>t||
   t-p.challengedAtMs>120000||
   p.challengedAtMs<sourcePacket.payload.approvedAtMs||
   p.dataClass!=='NON_SENSITIVE_SCOPED_EXCEPTION'||
   p.customerDeliveryAuthorized!==false||p.authorityTransfer!==false)
   return hold('QL483_ORIGINAL_YW_SOURCE_SIGNED_CHALLENGE_REQUIRED');
  return {state:'SUPERVISED_PRIVATE_YW_ENROLLMENT_REVIEW_HELD',binding,
   enrollmentDigest:hash([sourcePacket,reviewerPacket,sourceProofPacket,
    clientCertFingerprint,expectedChallengeDigest]),
   clientCertFingerprint,tenantId,sourceRevision:expectedRevision,
   sourceProofId:p.proofId,expiresAtMs:binding.expiresAtMs,
   originalHostVerified:false,fieldAcceptance:'HOLD',
   productionAcceptance:false};
 };
 function verifyRecord(){
  const check=scoped();
  if(check.state==='HOLD')return check;
  try{
   const saved=diskRead(file);
   if(!saved)return hold('QL483_SIGNED_ENROLLMENT_NOT_COMMITTED');
   if(!exact(saved,['enrollmentDigest','bindingId','sourceProofId','clientCertSha256',
      'sourceRevision','tenantId','durableReadBack','state'])||
     saved.enrollmentDigest!==check.enrollmentDigest||
     saved.bindingId!==check.binding.bindingId||
     saved.sourceProofId!==check.sourceProofId||
     saved.clientCertSha256!==clientCertFingerprint||
     saved.sourceRevision!==expectedRevision||saved.tenantId!==tenantId||
     saved.durableReadBack!==true||
     saved.state!=='SIGNED_PRIVATE_YW_ENROLLMENT_HELD')
     return hold('QL483_PRIVATE_ENROLLMENT_READBACK_TAMPERED');
   return check;
  }catch{return hold('QL483_PRIVATE_ENROLLMENT_UNSAFE_OR_UNREADABLE')}
 }
 function enroll(){
  const check=scoped();
  if(check.state==='HOLD')return check;
  const saved={enrollmentDigest:check.enrollmentDigest,
   bindingId:check.binding.bindingId,sourceProofId:check.sourceProofId,
   clientCertSha256:clientCertFingerprint,sourceRevision:expectedRevision,
   tenantId,durableReadBack:true,state:'SIGNED_PRIVATE_YW_ENROLLMENT_HELD'};
  try{
   const existing=diskRead(file);
   if(existing){
    const status=verifyRecord();
    return status.state==='HOLD'?status:
     {...status,state:'DURABLE_SIGNED_YW_ENROLLMENT_REPLAY_HELD'};
   }
   diskNew(folder,file,saved);
   const status=verifyRecord();
   return status.state==='HOLD'?status:
    {...status,state:'DURABLE_SIGNED_YW_ENROLLMENT_COMMITTED_HELD'};
  }catch{return hold('QL483_PRIVATE_ENROLLMENT_WRITE_UNAVAILABLE')}
 }
 function ingest({authorized,certificateFingerprint256,envelope}={}){
  if(authorized!==true||
   fingerprint(certificateFingerprint256)!==clientCertFingerprint)
   return hold('QL483_YW_SOURCE_MTLS_CLIENT_DENIED');
  const check=verifyRecord();
  if(check.state==='HOLD')return check;
  const p=envelope?.payload;
  if(!p||p.sourceApp!=='yard-workers'||p.environment!=='PRIVATE_STAGING'||
   p.tenantId!==tenantId||p.sourceRevision!==expectedRevision)
   return hold('QL483_YW_SIGNED_SOURCE_SCOPE_DRIFT');
  const result=ingestQl481BoundedFieldEvent({
   adapter,binding:check.binding,envelope,nowMs:now()});
  if(result.state!=='SCOPED_PRIVATE_STAGING_EVENT_COMMITTED_HELD')
   return hold('QL483_YW_CASE_JOURNAL_REJECTED_OR_REPLAY_CONFLICT');
  return {state:'SIGNED_YW_PRIVATE_EVENT_READBACK_HELD',
   transition:result.transition??null,caseId:result.caseId,
   caseStatus:result.caseStatus,lastSequence:result.lastSequence,
   lastJournalDigest:result.lastJournalDigest,
   lastReceiptDigest:result.lastReceiptDigest,
   enrollmentDigest:check.enrollmentDigest,sourceRuntimeVerified:false,
   originalHostVerified:false,fieldAcceptance:'HOLD',
   customerDeliveryVerified:false,productionAcceptance:false,
   authorityTransfer:false};
 }
 return Object.freeze({enroll,ingest,review:verifyRecord,
  sourceApp:'yard-workers',environment:'PRIVATE_STAGING',
  publicRoute:false,automaticDispatch:false});
}
/** Independent cryptographic case review is not an original-host attestation. */
export function reviewQl483IndependentYwFieldEvidence({link,adapter,
 operatorReadPacket,witnessPacket,reviewerPin,sourcePin,operatorPin,
 nowMs=Date.now()}={}){
 const enrolled=link?.review?.();
 if(enrolled?.state!=='SUPERVISED_PRIVATE_YW_ENROLLMENT_REVIEW_HELD')
  return hold('QL483_CURRENT_DURABLE_SOURCE_ENROLLMENT_REQUIRED');
 const p=witnessPacket?.payload,r=operatorReadPacket?.payload;
 if(!publicKey(reviewerPin)||!publicKey(sourcePin)||!publicKey(operatorPin)||
  new Set([reviewerPin,sourcePin,operatorPin]).size!==3||
  !signed(witnessPacket,reviewerPin,WITNESS_KEYS)||
  p.schema!==QL483_FIELD_WITNESS||!ID.test(p.reviewId??'')||
  p.sourceApp!=='yard-workers'||p.environment!=='PRIVATE_STAGING'||
  p.tenantId!==enrolled.tenantId||p.sourceRevision!==enrolled.sourceRevision||
  !ID.test(p.episodeId??'')||p.caseId!==hash([
   p.sourceApp,p.environment,p.tenantId,p.episodeId]).slice(0,32)||
  p.enrollmentDigest!==enrolled.enrollmentDigest||
  p.operatorId!==r?.operatorId||!TENANT.test(p.operatorId??'')||
  !Number.isSafeInteger(p.lastSequence)||p.lastSequence<2||
  !HEX.test(p.lastJournalDigest??'')||!HEX.test(p.lastReceiptDigest??'')||
  !Number.isSafeInteger(p.reviewedAtMs)||p.reviewedAtMs>nowMs||
  nowMs-p.reviewedAtMs>300000||p.originalHostWitnessed!==false||
  p.actualBusinessSourceAccepted!==false||
  p.customerDeliveryVerified!==false||p.authorityTransfer!==false)
  return hold('QL483_INDEPENDENT_PRIVATE_YW_WITNESS_INVALID');
 if(r?.sourceApp!==p.sourceApp||r.environment!==p.environment||
  r.tenantId!==p.tenantId||r.episodeId!==p.episodeId)
  return hold('QL483_INDEPENDENT_READ_SCOPE_MISMATCH');
 let q;
 try{q=adapter.read(operatorReadPacket)}catch{return hold('QL483_PRIVATE_JOURNAL_UNAVAILABLE')}
 if(q.state!=='PRIVATE_CASE_REVIEW_ONLY'||q.caseStatus!=='CLOSED'||
  q.caseId!==p.caseId||q.lastSequence!==p.lastSequence||
  q.lastJournalDigest!==p.lastJournalDigest||
  q.lastReceiptDigest!==p.lastReceiptDigest||
  q.sourceRevision!==p.sourceRevision||
  q.scope.sourceApp!==p.sourceApp||q.scope.environment!==p.environment||
  q.scope.tenantId!==p.tenantId||q.scope.episodeId!==p.episodeId||
  q.technicalReceiptState!=='SOURCE_RECOVERY_RECEIPT_RECORDED'||
  q.operatorAcknowledgementState!=='SIGNED_OPERATOR_CLOSURE'||
  !q.openedAtMs||!q.recoveredAtMs||!q.closedAtMs||
  q.openedAtMs>q.recoveredAtMs||q.recoveredAtMs>q.closedAtMs)
  return hold('QL483_YW_OUTAGE_RECOVERY_OR_OWNER_CLOSURE_UNVERIFIED');
 return {state:'INDEPENDENT_SIGNED_PRIVATE_YW_FIELD_CRYPTO_REVIEW_HELD',
  caseId:q.caseId,enrollmentDigest:enrolled.enrollmentDigest,
  journalDigest:q.lastJournalDigest,receiptDigest:q.lastReceiptDigest,
  witnessDigest:hash(p),originalHostVerified:false,
  fieldAcceptance:'HOLD_ORIGINAL_YW_RUNTIME_AND_INDEPENDENT_DEVICE_WITNESS',
  productionAcceptance:false,customerDeliveryVerified:false,
  authorityTransfer:false};
}
/** One explicitly started PRIVATE mTLS server integrates source ingest and
 * QL-482 operator read with different client certificate roles. */
export function createQl483PrivateHttpsServer({tlsOptions,link,reader}={}){
 if(!tlsOptions?.key||!tlsOptions?.cert||!tlsOptions?.ca||
  !link||typeof link.ingest!=='function'||
  !reader||typeof reader.read!=='function')
  throw Error('QL483_PRIVATE_TLS_LINK_AND_READER_REQUIRED');
 return createServer({...tlsOptions,requestCert:true,rejectUnauthorized:true,
  minVersion:'TLSv1.3'},async(req,res)=>{
  const respond=(status,body)=>{
   res.writeHead(status,{'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store, max-age=0','x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'none'",
    'referrer-policy':'no-referrer',
    'strict-transport-security':'max-age=31536000'});
   res.end(JSON.stringify(body));
  };
  const sourceRoute=req.url===QL483_INGEST_PATH;
  const readRoute=req.url===QL482_PATH;
  if((!sourceRoute&&!readRoute)||req.method!=='POST'){
   respond(404,{state:'HOLD',reason:'QL483_PRIVATE_ROUTE_UNAVAILABLE'});return;
  }
  if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){
   respond(415,{state:'HOLD',reason:'QL483_JSON_ONLY'});return;
  }
  let raw='',size=0;
  try{
   for await(const chunk of req){
    size+=chunk.length;if(size>4096){
     respond(413,{state:'HOLD',reason:'QL483_REQUEST_TOO_LARGE'});return}
    raw+=chunk.toString('utf8');
   }
   const data=JSON.parse(raw);
   const expected=sourceRoute?['envelope']:['operatorReadPacket'];
   if(!exact(data,expected)){
    respond(400,{state:'HOLD',reason:'QL483_EXACT_REQUEST_REQUIRED'});return}
   const identity={authorized:req.socket.authorized===true,
     certificateFingerprint256:req.socket.getPeerCertificate?.()?.fingerprint256};
   if(sourceRoute){
    const result=link.ingest({...identity,envelope:data.envelope});
    respond(result.state==='SIGNED_YW_PRIVATE_EVENT_READBACK_HELD'?200:403,result);
   }else{
    const result=reader.read({...identity,operatorReadPacket:data.operatorReadPacket});
    respond(result.status,result.body);
   }
  }catch{respond(400,{state:'HOLD',reason:'QL483_INVALID_PRIVATE_JSON'})}
 });
}
export const QL483_BOUNDARY=Object.freeze({
 autoStart:false,publicWorkerRoute:false,sourceEventsOnly:true,
 customerDelivery:'NOT_SENT',firstLiveYardWorkersCase:'UNVERIFIED',
 originalHostEnrollment:'NOT_EXECUTED',fieldAcceptance:'HOLD'});
