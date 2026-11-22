/**
 * QL-484 — supervised private Yard Workers source/host/operator/reviewer
 * correlation. This never asserts physical original-host or business acceptance
 * from test-generated signatures. No network listener, public route, startup,
 * source writes, customer records, or provider messaging.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,
 fsyncSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

export const QL484_SOURCE='rosevear.comms.ql484.yw-private-source-observation.v1';
export const QL484_HOST='rosevear.comms.ql484.original-host-observation.v1';
export const QL484_REVIEW='rosevear.comms.ql484.independent-field-crypto-review.v1';
const SRC=['schema','sessionId','sourceApp','environment','tenantId','episodeId',
 'caseId','sourceRevision','commsMainRevision','sourceCertSha256','operatorCertSha256',
 'enrollmentDigest','lastSequence','lastReceiptDigest','lastJournalDigest',
 'operatorRequestDigest','challengedAtMs','sourceRuntimeClaimed',
 'customerFieldsIncluded','dispatchAuthorized'];
const HOST=['schema','sessionId','originalHostId','sourceEvidenceDigest',
 'operatorReadResponseDigest','ownerChallengeDigest','hostSignerPin',
 'observedAtMs','physicalPresenceClaimed','customerFieldsIncluded',
 'dispatchAuthorized'];
const WITNESS=['schema','sessionId','reviewerId','sourceEvidenceDigest',
 'hostEvidenceDigest','operatorReadResponseDigest','sourceRevision',
 'commsMainRevision','reviewedAtMs','reviewKind',
 'independentPhysicalAttestation','customerDeliveryVerified',
 'authorityTransfer'];
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,
 ID=/^[A-Za-z0-9_-]{8,96}$/,TENANT=/^[a-z][a-z0-9_-]{2,63}$/,
 CASE=/^[a-f0-9]{32}$/;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const exact=(v,k)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===k.length&&k.every(x=>own(v,x));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,
  originalHostVerified:false,fieldAcceptance:'HOLD',
  sourceProductionAccepted:false,customerDeliveryVerified:false,
  productionAcceptance:false,authorityTransfer:false});
function publicKey(pin){
 try{
  if(typeof pin!=='string'||pin.length>512)return null;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return null;
  const k=createPublicKey({key:b,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'?k:null;
 }catch{return null}
}
function signed(x,pin,fields){
 try{
  return exact(x,['payload','signature'])&&exact(x.payload,fields)&&
   /^[A-Za-z0-9+/]{86}==$/.test(x.signature??'')&&!!publicKey(pin)&&
   verify(null,Buffer.from(JSON.stringify(x.payload)),publicKey(pin),
    Buffer.from(x.signature,'base64'));
 }catch{return false}
}
const recent=(ts,now)=>Number.isSafeInteger(ts)&&ts>0&&ts<=now&&now-ts<=300000;
function safeDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
    directory.split(/[\\/]/).includes('..'))
  throw Error('QL484_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const folder=resolve(directory);
 mkdirSync(folder,{recursive:true,mode:0o700});
 const stat=lstatSync(folder);
 if(!stat.isDirectory()||stat.isSymbolicLink()||
  (process.platform!=='win32'&&(stat.mode&0o077)))
  throw Error('QL484_PRIVATE_DIRECTORY_UNSAFE');
 return folder;
}
function load(file){
 let fd;
 try{fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return null;throw e}
 try{
  const st=fstatSync(fd);
  if(!st.isFile()||st.size>16000||
     (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL484_PRIVATE_RECEIPT_UNSAFE');
  return JSON.parse(readFileSync(fd,'utf8'));
 }finally{closeSync(fd)}
}
function appendOnce(folder,file,record){
 const fd=openSync(file,constants.O_CREAT|constants.O_EXCL|
  constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
 try{writeFileSync(fd,JSON.stringify(record));fsyncSync(fd)}
 finally{closeSync(fd)}
 if(process.platform!=='win32'){
  const dir=openSync(folder,constants.O_RDONLY);
  try{fsyncSync(dir)}finally{closeSync(dir)}
 }
}
function receiptMatches(item,expected){
 return exact(item,['schema','sessionId','tenantId','episodeId','caseId',
  'sourceRevision','commsMainRevision','enrollmentDigest','caseJournalDigest',
  'sourceEvidenceDigest','hostEvidenceDigest','reviewerEvidenceDigest',
  'operatorResponseDigest','sessionDigest','status','durableReadback',
  'originalHostVerified','productionAcceptance'])&&
  item.schema==='rosevear.comms.ql484.private-session-receipt.v1'&&
  item.status==='PRIVATE_SESSION_CRYPTO_EVIDENCE_REVIEW_HELD'&&
  item.durableReadback===true&&item.originalHostVerified===false&&
  item.productionAcceptance===false&&
  Object.entries(expected).every(([k,v])=>item[k]===v);
}
/**
 * A completed cryptographic correlation is intentionally separate from
 * independently trusted hardware/source provenance. Never call it production
 * source acceptance merely because four test signers can sign the packets.
 */
export function createQl484SupervisedYwFieldReview({directory,link,adapter,reader,
 sourcePin,ownerHostPin,reviewerPin,operatorPin,originalHostId,
 expectedSourceRevision,expectedCommsMainRevision,sourceClientFingerprint,
 operatorClientFingerprint,expectedOwnerChallengeDigest,
 now=()=>Date.now()}={}){
 if(!link||typeof link.review!=='function'||typeof adapter?.read!=='function'||
  typeof reader?.read!=='function'||!publicKey(sourcePin)||
  !publicKey(ownerHostPin)||!publicKey(reviewerPin)||!publicKey(operatorPin)||
  new Set([sourcePin,ownerHostPin,reviewerPin,operatorPin]).size!==4||
  !ID.test(originalHostId??'')||!SHA.test(expectedSourceRevision??'')||
  !SHA.test(expectedCommsMainRevision??'')||
  !HEX.test(sourceClientFingerprint??'')||
  !HEX.test(operatorClientFingerprint??'')||
  !HEX.test(expectedOwnerChallengeDigest??'')||
  sourceClientFingerprint===operatorClientFingerprint)
  throw Error('QL484_INDEPENDENT_PINNED_SOURCE_HOST_OPERATOR_REVIEWER_REQUIRED');
 const folder=safeDir(directory);
 function reviewInput(input,consumeRead){
  const enrolled=link.review();
  if(enrolled?.state!=='SUPERVISED_PRIVATE_YW_ENROLLMENT_REVIEW_HELD')
   return hold('QL484_CURRENT_GENUINE_SOURCE_ENROLLMENT_REQUIRED');
  if(enrolled.sourceRevision!==expectedSourceRevision||
    enrolled.clientCertFingerprint!==sourceClientFingerprint)
   return hold('QL484_YW_SOURCE_RELEASE_OR_CERT_REQUIRES_REENROLLMENT');
  const src=input?.sourceObservationPacket,host=input?.hostObservationPacket,
   review=input?.reviewerPacket,operatorReadPacket=input?.operatorReadPacket;
  const p=src?.payload,h=host?.payload,w=review?.payload,r=operatorReadPacket?.payload;
  const t=now();
  if(input?.operatorTlsAuthorized!==true||
   input.operatorClientCertificateFingerprint!==operatorClientFingerprint)
   return hold('QL484_AUTHENTICATED_OPERATOR_TLS_OR_ROLE_REQUIRED');
  if(!signed(src,sourcePin,SRC)||!signed(host,ownerHostPin,HOST)||
    !signed(review,reviewerPin,WITNESS)||
    !signed(operatorReadPacket,operatorPin,
     ['schema','requestId','operatorId','sourceApp','environment',
      'tenantId','episodeId','requestedAtMs']))
   return hold('QL484_DISTINCT_SOURCE_HOST_REVIEWER_OPERATOR_SIGNATURES_REQUIRED');
  if(p.schema!==QL484_SOURCE||!ID.test(p.sessionId??'')||
   p.sourceApp!=='yard-workers'||p.environment!=='PRIVATE_STAGING'||
   !TENANT.test(p.tenantId??'')||p.tenantId!==enrolled.tenantId||
   !ID.test(p.episodeId??'')||!CASE.test(p.caseId??'')||
   p.sourceRevision!==expectedSourceRevision||
   p.commsMainRevision!==expectedCommsMainRevision||
   p.sourceCertSha256!==sourceClientFingerprint||
   p.operatorCertSha256!==operatorClientFingerprint||
   p.enrollmentDigest!==enrolled.enrollmentDigest||
   !Number.isSafeInteger(p.lastSequence)||p.lastSequence<2||
   !HEX.test(p.lastReceiptDigest??'')||!HEX.test(p.lastJournalDigest??'')||
   p.operatorRequestDigest!==hash(operatorReadPacket)||
   !recent(p.challengedAtMs,t)||p.sourceRuntimeClaimed!==true||
   p.customerFieldsIncluded!==false||p.dispatchAuthorized!==false)
   return hold('QL484_EXACT_YW_SOURCE_SCOPE_OR_RELEASE_PROOF_REQUIRED');
  if(r.schema!=='rosevear.comms.ql480.private-case-read.v1'||
    r.sourceApp!=='yard-workers'||r.environment!=='PRIVATE_STAGING'||
    r.tenantId!==p.tenantId||r.episodeId!==p.episodeId||
    !TENANT.test(r.operatorId??'')||!recent(r.requestedAtMs,t))
   return hold('QL484_SIGNED_OPERATOR_READ_SCOPE_MISMATCH');
  const sourceDigest=hash(src);
  let direct;
  try{direct=adapter.read(operatorReadPacket)}
  catch{return hold('QL484_SIGNED_JOURNAL_READ_UNAVAILABLE')}
  if(direct?.state!=='PRIVATE_CASE_REVIEW_ONLY'||
   direct.caseStatus!=='CLOSED'||direct.caseId!==p.caseId||
   direct.scope?.sourceApp!=='yard-workers'||
   direct.scope?.environment!=='PRIVATE_STAGING'||
   direct.scope?.tenantId!==p.tenantId||
   direct.scope?.episodeId!==p.episodeId||
   direct.sourceRevision!==p.sourceRevision||
   direct.lastSequence!==p.lastSequence||
   direct.lastReceiptDigest!==p.lastReceiptDigest||
   direct.lastJournalDigest!==p.lastJournalDigest||
   direct.technicalReceiptState!=='SOURCE_RECOVERY_RECEIPT_RECORDED'||
   direct.operatorAcknowledgementState!=='SIGNED_OPERATOR_CLOSURE'||
   !direct.openedAtMs||!direct.recoveredAtMs||!direct.closedAtMs||
   direct.openedAtMs>direct.recoveredAtMs||
   direct.recoveredAtMs>direct.closedAtMs)
   return hold('QL484_YW_OUTAGE_RECOVERY_SIGNED_CLOSURE_UNVERIFIED');
  // Only the protected QL-482 reader is allowed to establish the operator
  // projection. Reuse of an operator read nonce fails closed.
  let response;
  try{
   if(consumeRead)response=reader.read({
    authorized:true,certificateFingerprint256:operatorClientFingerprint,
    operatorReadPacket});
   else return hold('QL484_OPERATOR_READ_MUST_BE_FRESH');
  }catch{return hold('QL484_PROTECTED_OPERATOR_READER_UNAVAILABLE')}
  if(response?.status!==200||response?.ok!==true||
   response.body?.state!=='PROTECTED_PRIVATE_CASE_READ'||
   response.body.caseId!==p.caseId||
   response.body.scope?.sourceApp!=='yard-workers'||
   response.body.scope?.environment!=='PRIVATE_STAGING'||
   response.body.scope?.tenantId!==p.tenantId||
   response.body.scope?.episodeId!==p.episodeId||
   response.body.caseStatus!=='CLOSED'||
   response.body.lastSequence!==p.lastSequence||
   response.body.sourceRevision!==expectedSourceRevision||
   response.body.lastJournalDigest!==p.lastJournalDigest||
   response.body.lastReceiptDigest!==p.lastReceiptDigest||
   response.body.productionAcceptance!==false)
   return hold('QL484_MTLS_OPERATOR_READBACK_DIFFERENT_FROM_SIGNED_JOURNAL');
  const responseDigest=hash(response.body),hostDigest=hash(host);
  if(h.schema!==QL484_HOST||h.sessionId!==p.sessionId||
    h.originalHostId!==originalHostId||
    h.sourceEvidenceDigest!==sourceDigest||
    h.operatorReadResponseDigest!==responseDigest||
    h.ownerChallengeDigest!==expectedOwnerChallengeDigest||
    h.hostSignerPin!==ownerHostPin||!recent(h.observedAtMs,t)||
    h.observedAtMs<p.challengedAtMs||
    h.physicalPresenceClaimed!==true||
    h.customerFieldsIncluded!==false||h.dispatchAuthorized!==false)
   return hold('QL484_PINNED_ORIGINAL_HOST_CHALLENGE_OR_READBACK_MISMATCH');
  if(w.schema!==QL484_REVIEW||w.sessionId!==p.sessionId||
   !TENANT.test(w.reviewerId??'')||w.reviewerId===r.operatorId||
   w.sourceEvidenceDigest!==sourceDigest||
   w.hostEvidenceDigest!==hostDigest||
   w.operatorReadResponseDigest!==responseDigest||
   w.sourceRevision!==expectedSourceRevision||
   w.commsMainRevision!==expectedCommsMainRevision||
   !recent(w.reviewedAtMs,t)||w.reviewedAtMs<h.observedAtMs||
   w.reviewKind!=='CRYPTOGRAPHIC_PRIVATE_REVIEW'||
   w.independentPhysicalAttestation!==false||
   w.customerDeliveryVerified!==false||w.authorityTransfer!==false)
   return hold('QL484_INDEPENDENT_REVIEWER_SCOPE_OR_EVIDENCE_MISMATCH');
  const proof={
   sessionId:p.sessionId,tenantId:p.tenantId,episodeId:p.episodeId,
   caseId:p.caseId,sourceRevision:p.sourceRevision,
   commsMainRevision:p.commsMainRevision,enrollmentDigest:p.enrollmentDigest,
   caseJournalDigest:p.lastJournalDigest,sourceEvidenceDigest:sourceDigest,
   hostEvidenceDigest:hostDigest,reviewerEvidenceDigest:hash(review),
   operatorResponseDigest:responseDigest
  };
  return {state:'PRIVATE_SESSION_CRYPTO_EVIDENCE_REVIEW_HELD',
   proof,sessionDigest:hash([src,host,review,operatorReadPacket,responseDigest]),
   originalHostVerified:false,sourceRuntimeVerified:false,
   fieldAcceptance:'HOLD_ORIGINAL_SOURCE_AND_INDEPENDENT_DEVICE_PROVENANCE',
   customerDeliveryVerified:false,productionAcceptance:false,
   authorityTransfer:false};
 }
 function readReceipt(sessionId,scope){
  if(!ID.test(sessionId??'')||!exact(scope,['tenantId','episodeId'])||
   !TENANT.test(scope.tenantId??'')||!ID.test(scope.episodeId??''))
   return hold('QL484_EXACT_PRIVATE_RECEIPT_SCOPE_REQUIRED');
  const file=join(folder,hash(['yard-workers','PRIVATE_STAGING',
    scope.tenantId,scope.episodeId,sessionId])+'.json');
  try{
   const record=load(file);
   if(!record)return hold('QL484_PRIVATE_SESSION_RECEIPT_MISSING');
   if(!receiptMatches(record,{sessionId,tenantId:scope.tenantId,
       episodeId:scope.episodeId,sourceRevision:expectedSourceRevision,
       commsMainRevision:expectedCommsMainRevision}))
    return hold('QL484_DURABLE_SESSION_READBACK_TAMPERED_OR_DIFFERENT_RELEASE');
   return {state:'DURABLE_PRIVATE_YW_CRYPTO_RECEIPT_READBACK_HELD',
    sessionDigest:record.sessionDigest,caseId:record.caseId,
    caseJournalDigest:record.caseJournalDigest,tenantId:scope.tenantId,
    originalHostVerified:false,fieldAcceptance:'HOLD',
    productionAcceptance:false};
  }catch{return hold('QL484_PRIVATE_RECEIPT_UNSAFE_OR_UNREADABLE')}
 }
 function commit(input){
  const p=input?.sourceObservationPacket?.payload;
  if(!ID.test(p?.sessionId??'')||!TENANT.test(p?.tenantId??'')||
   !ID.test(p?.episodeId??''))
   return hold('QL484_SIGNED_SESSION_ID_AND_SCOPE_REQUIRED');
  const filename=join(folder,hash(['yard-workers','PRIVATE_STAGING',
    p.tenantId,p.episodeId,p.sessionId])+'.json');
  // No existing claim may be overwritten or replayed under another signer.
  try{if(load(filename))return hold('QL484_SESSION_ALREADY_RECORDED_USE_READBACK')}
  catch{return hold('QL484_PRIVATE_RECEIPT_UNSAFE_OR_UNREADABLE')}
  const reviewed=reviewInput(input,true);
  if(reviewed.state!=='PRIVATE_SESSION_CRYPTO_EVIDENCE_REVIEW_HELD')
   return reviewed;
  const item={schema:'rosevear.comms.ql484.private-session-receipt.v1',
   ...reviewed.proof,sessionDigest:reviewed.sessionDigest,
   status:'PRIVATE_SESSION_CRYPTO_EVIDENCE_REVIEW_HELD',
   durableReadback:true,originalHostVerified:false,productionAcceptance:false};
  try{
   appendOnce(folder,filename,item);
   const actual=load(filename);
   if(!receiptMatches(actual,item))
    return hold('QL484_PRIVATE_DURABLE_WRITE_OR_READBACK_FAILED');
   return {...reviewed,state:'DURABLE_SIGNED_YW_SESSION_CORRELATION_HELD',
    durableReadback:true};
  }catch{return hold('QL484_PRIVATE_SESSION_APPEND_FAILED_OR_CONCURRENT')}
 }
 return Object.freeze({commit,readReceipt,mode:'SUPERVISED_PRIVATE_YW_CRYPTOPROOF',
  publicRoute:false,automaticActivation:false,physicalAcceptance:false,
  providerSend:false});
}
/**
 * Git is about repository ancestry. Business event ingress does NOT itself
 * move Git branches. A source release mismatch needs a new signed contract,
 * never a force merge or a guessed signer.
 */
export function classifyQl484SourceUpdate({commitsAhead,commitsBehind,
 declaredYwMainSha,pinnedYwSourceSha}={}){
 if(!Number.isSafeInteger(commitsAhead)||commitsAhead<0||
  !Number.isSafeInteger(commitsBehind)||commitsBehind<0||
  !SHA.test(declaredYwMainSha??'')||!SHA.test(pinnedYwSourceSha??''))
  return hold('QL484_TRUSTED_GIT_COMPARE_AND_SOURCE_SHAS_REQUIRED');
 return {gitAncestry:commitsAhead>0&&commitsBehind>0?'DIVERGED':
  commitsAhead>0?'DEV_AHEAD':commitsBehind>0?'MAIN_AHEAD':'IN_SYNC',
  yardWorkersSource:declaredYwMainSha===pinnedYwSourceSha?
   'SIGNED_CONTRACT_REVISION_UNCHANGED':'SOURCE_REVISION_CHANGED_REENROLLMENT_REQUIRED',
  sourceUpdatesAreGitDivergence:false,automaticMerge:false,
  sourceAcceptance:'HOLD_UNTIL_SOURCE_SIGNER_REVISION_REVIEW'};
}
export const QL484_BOUNDARY=Object.freeze({
 fieldAcceptance:'HOLD',publicWorkerModified:false,
 sourceAuthorityUnchanged:true,automaticListener:false,
 originalHostPhysicalVerification:'NOT_PERFORMED_BY_CI',
 independentBusinessSourceVerification:'NOT_PERFORMED_BY_CI'});
