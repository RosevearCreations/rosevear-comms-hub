/**
 * QL-486 — Six-source signed attestation and durable private contract registry.
 * A cryptographically coherent claim does NOT establish an original device,
 * deployed runtime, physical witness, or authority to activate a source.
 * Node-only; no imports into the public Worker, automatic listeners or writes
 * outside the explicitly configured private directory.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,
 fsyncSync,fstatSync,unlinkSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {canonicalize,SOURCES} from './manifest.mjs';
import {QL485_SOURCE_IDS,verifyQl485SourceNotice}
 from './ql485-signed-release-negotiation.mjs';

export const QL486_SOURCE='rosevear.comms.ql486.source-runtime-revision-claim.v1';
export const QL486_OWNER='rosevear.comms.ql486.owner-source-observation.v1';
export const QL486_REVIEW='rosevear.comms.ql486.independent-runtime-review.v1';
const SOURCE_FIELDS=['schema','attestationId','sourceId','repository',
 'sourceRevision','noticeDigest','evidenceDigest','deploymentInstanceId',
 'observedAtMs','originalSourceObserved','customerDataIncluded','authorityTransfer'];
const OWNER_FIELDS=['schema','attestationId','sourceId','sourceAttestationDigest',
 'sourceRevision','ownerId','ownerWitnessDigest','witnessedAtMs',
 'physicalSourceClaimed','customerDataIncluded','authorityTransfer'];
const REVIEW_FIELDS=['schema','attestationId','sourceId','sourceAttestationDigest',
 'ownerPacketDigest','reviewerId','reviewedAtMs','independentRuntimeObservation',
 'customerDataReviewed','authorityTransfer'];
const RECORD_FIELDS=['schema','sourceId','sequence','previousDigest',
 'noticePacket','sourceAttestationPacket','ownerPacket','reviewerPacket',
 'classification','committedAtMs','recordDigest'];
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,
 ID=/^[A-Za-z0-9_-]{8,96}$/;
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const hash=x=>createHash('sha256').update(canonicalize(x),'utf8').digest('hex');
const hold=reason=>({state:'HOLD',reason,sourceConnected:false,
 originalRuntimeVerified:false,productionAcceptance:false,
 authorityTransfer:false,automaticSourcePromotion:false});
function pub(pem){
 try{if(typeof pem!=='string'||pem.length>4096)return null;
  const key=createPublicKey(pem);
  return key.asymmetricKeyType==='ed25519'?key:null;
 }catch{return null}
}
function signed(env,pem,fields){
 try{
  if(!exact(env,['payload','signature'])||!exact(env.payload,fields)||
    !/^[A-Za-z0-9_-]{86}$/.test(env.signature??'')||!pub(pem))return false;
  const sig=Buffer.from(env.signature,'base64url');
  return sig.length===64&&sig.toString('base64url')===env.signature&&
    verify(null,Buffer.from(canonicalize(env.payload),'utf8'),pub(pem),sig);
 }catch{return false}
}
function recent(ts,now){
 return Number.isSafeInteger(ts)&&ts>0&&ts<=now&&now-ts<=120000;
}
function privateDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))throw Error('QL486_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const folder=resolve(directory);
 mkdirSync(folder,{recursive:true,mode:0o700});
 const st=lstatSync(folder);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL486_PRIVATE_DIRECTORY_UNSAFE');
 return folder;
}
function readLog(file){
 let fd;
 try{fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return [];throw e}
 try{
  const stat=fstatSync(fd);
  if(!stat.isFile()||stat.size>3000000||
    (process.platform!=='win32'&&(stat.mode&0o077)))
    throw Error('QL486_PRIVATE_SOURCE_LOG_UNSAFE');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n')||raw.length===0)throw Error('QL486_PRIVATE_SOURCE_LOG_TRUNCATED');
  const rows=raw.trimEnd().split('\n');
  if(rows.length>128)throw Error('QL486_PRIVATE_SOURCE_LOG_FULL');
  return rows.map(l=>JSON.parse(l));
 }finally{closeSync(fd)}
}
function appendLog(file,data,first){
 const flags=constants.O_WRONLY|constants.O_APPEND|constants.O_NOFOLLOW|
  (first?constants.O_CREAT|constants.O_EXCL:0);
 const fd=openSync(file,flags,0o600);
 try{writeFileSync(fd,JSON.stringify(data)+'\n');fsyncSync(fd)}
 finally{closeSync(fd)}
}
function fsyncDir(folder){
 if(process.platform==='win32')return;
 const fd=openSync(folder,constants.O_RDONLY);
 try{fsyncSync(fd)}finally{closeSync(fd)}
}
/**
 * Recheck every recorded packet and its classification when reading old logs;
 * use the recorded commit timestamp to avoid expiring historical signatures.
 * Signer public pins are provided out of band and remain immutable.
 */
export function createQl486SixSourceRegistry({directory,pins,ownerPins,
 reviewerPins,now=()=>Date.now()}={}){
 if(!exact(pins,QL485_SOURCE_IDS)||!exact(ownerPins,QL485_SOURCE_IDS)||
  !exact(reviewerPins,QL485_SOURCE_IDS)||
  QL485_SOURCE_IDS.some(id=>!pub(pins[id]?.publicKeyPem)||
   pins[id].sourceId!==id||pins[id].independentlyVerified!==true||
   pins[id].sourceOwnerApproved!==true||
   !pub(ownerPins[id])||!pub(reviewerPins[id])||
   ownerPins[id]===reviewerPins[id]||
   pins[id].publicKeyPem===ownerPins[id]||
   pins[id].publicKeyPem===reviewerPins[id])||
  new Set(QL485_SOURCE_IDS.map(id=>pins[id].publicKeyPem)).size!==6)
  throw Error('QL486_SIX_INDEPENDENT_SOURCE_AND_OWNER_REVIEWER_PINS_REQUIRED');
 const folder=privateDir(directory);
 const path=id=>join(folder,id+'.ndjson');
 const lock=join(folder,'.ql486-write.lock');
 function classify({sourceId,noticePacket,sourceAttestationPacket,
  ownerPacket,reviewerPacket,atMs}){
  const n=noticePacket?.payload,s=sourceAttestationPacket?.payload;
  const o=ownerPacket?.payload,w=reviewerPacket?.payload;
  if(!QL485_SOURCE_IDS.includes(sourceId)||
   !signed(sourceAttestationPacket,pins[sourceId].publicKeyPem,SOURCE_FIELDS)||
   !signed(ownerPacket,ownerPins[sourceId],OWNER_FIELDS)||
   !signed(reviewerPacket,reviewerPins[sourceId],REVIEW_FIELDS))
   return hold('QL486_THREE_DISTINCT_SOURCE_OWNER_REVIEWER_SIGNATURES_REQUIRED');
  const review=verifyQl485SourceNotice({packet:noticePacket,pin:pins[sourceId],nowMs:atMs});
  if(!review.noticeDigest||
   !['SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD',
     'SIGNED_NEW_REVISION_OWNER_REENROLLMENT_REQUIRED',
     'SIGNED_EVENT_SCHEMA_CHANGE_REVIEW_REQUIRED',
     'SIGNED_CAPABILITY_CHANGE_REVIEW_REQUIRED',
     'SIGNED_SEMVER_CHANGE_REVIEW_REQUIRED'].includes(review.state))
   return hold('QL486_INDEPENDENT_Ql485_APPROVED_SOURCE_NOTICE_REQUIRED');
  if(!exact(s,SOURCE_FIELDS)||!ID.test(s.attestationId??'')||
   s.schema!==QL486_SOURCE||s.sourceId!==sourceId||
   s.repository!=='RosevearCreations/'+SOURCES[sourceId].repo||
   s.sourceRevision!==n.sourceRevision||
   s.noticeDigest!==review.noticeDigest||
   !HEX.test(s.evidenceDigest??'')||!ID.test(s.deploymentInstanceId??'')||
   !recent(s.observedAtMs,atMs)||
   s.originalSourceObserved!==true||
   s.customerDataIncluded!==false||s.authorityTransfer!==false)
   return hold('QL486_SOURCE_REVISION_CLAIM_SCOPE_OR_FRESHNESS_DENIED');
  if(!exact(o,OWNER_FIELDS)||o.schema!==QL486_OWNER||
   o.attestationId!==s.attestationId||o.sourceId!==sourceId||
   o.sourceAttestationDigest!==hash(sourceAttestationPacket)||
   o.sourceRevision!==s.sourceRevision||!ID.test(o.ownerId??'')||
   !HEX.test(o.ownerWitnessDigest??'')||!recent(o.witnessedAtMs,atMs)||
   o.witnessedAtMs<s.observedAtMs||o.physicalSourceClaimed!==true||
   o.customerDataIncluded!==false||o.authorityTransfer!==false)
   return hold('QL486_OWNER_INDEPENDENT_REVISION_WITNESS_REQUIRED');
  if(!exact(w,REVIEW_FIELDS)||w.schema!==QL486_REVIEW||
   w.attestationId!==s.attestationId||w.sourceId!==sourceId||
   w.sourceAttestationDigest!==hash(sourceAttestationPacket)||
   w.ownerPacketDigest!==hash(ownerPacket)||
   !ID.test(w.reviewerId??'')||w.reviewerId===o.ownerId||
   !recent(w.reviewedAtMs,atMs)||w.reviewedAtMs<o.witnessedAtMs||
   w.independentRuntimeObservation!==true||
   w.customerDataReviewed!==false||w.authorityTransfer!==false)
   return hold('QL486_INDEPENDENT_REVIEWER_RUNTIME_CLAIM_REQUIRED');
  return {state:review.state==='SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD'?
    'PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD':
    'SOURCE_CONTRACT_CHANGE_PENDING_OWNER_APPROVAL',
   sourceId,sourceRevision:s.sourceRevision,
   noticeDigest:review.noticeDigest,sourceAttestationDigest:hash(sourceAttestationPacket),
   ownerDigest:hash(ownerPacket),reviewerDigest:hash(reviewerPacket),
   sourceConnected:false,originalRuntimeVerified:false,
   runtimeProofStatus:'SIGNED_CLAIM_NOT_INDEPENDENT_PHYSICAL_PROOF',
   productionAcceptance:false,authorityTransfer:false};
 }
 function checkedRows(id){
  const rows=readLog(path(id));
  let previous=null,seq=0;
  for(const row of rows){
   if(!exact(row,RECORD_FIELDS)||row.schema!=='rosevear.comms.ql486.private-source-attestation.v1'||
    row.sourceId!==id||row.sequence!==++seq||row.previousDigest!==previous||
    !Number.isSafeInteger(row.committedAtMs)||row.committedAtMs<=0||
    !HEX.test(row.recordDigest??''))throw Error('QL486_ATTESTATION_CHAIN_TAMPERED');
   const {recordDigest,...unsigned}=row;
   if(hash(unsigned)!==recordDigest)throw Error('QL486_ATTESTATION_RECORD_DIGEST_TAMPERED');
   const valid=classify({...row,atMs:row.committedAtMs});
   if(valid.state!==row.classification)throw Error('QL486_ATTESTATION_SIGNED_EVIDENCE_TAMPERED');
   previous=recordDigest;
  }
  return rows;
 }
 function summary(){
  const sources={};
  for(const id of QL485_SOURCE_IDS){
   try{
    const rows=checkedRows(id),last=rows.at(-1);
    sources[id]=last?{
     state:last.classification,sourceRevision:last.sourceAttestationPacket.payload.sourceRevision,
     approvedRevision:pins[id].approvedRevision,contractVersion:last.noticePacket.payload.contractVersion,
     eventSchemas:last.noticePacket.payload.eventSchemas,
     capabilities:last.noticePacket.payload.capabilities,
     lastRecordedAtMs:last.committedAtMs,evidenceDigest:last.recordDigest,
     attestationCount:rows.length,originalRuntimeVerified:false,
     physicalWitnessVerified:false,sourceConnected:false
    }:{state:'SOURCE_ATTESTATION_NOT_ENROLLED',sourceRevision:null,
     approvedRevision:pins[id].approvedRevision,contractVersion:null,
     eventSchemas:[],capabilities:[],lastRecordedAtMs:null,
     evidenceDigest:null,attestationCount:0,originalRuntimeVerified:false,
     physicalWitnessVerified:false,sourceConnected:false};
   }catch{
    sources[id]={state:'PRIVATE_SOURCE_ATTESTATION_TAMPER_HOLD',
     sourceRevision:null,approvedRevision:pins[id].approvedRevision,
     contractVersion:null,eventSchemas:[],capabilities:[],
     lastRecordedAtMs:null,evidenceDigest:null,attestationCount:0,
     originalRuntimeVerified:false,physicalWitnessVerified:false,
     sourceConnected:false};
   }
  }
  return Object.freeze({state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',
   sources,sourceCount:6,registryDigest:hash(sources),
   originalSourceCountVerified:0,customerWrites:false,
   productionAcceptance:false,automaticSourcePromotion:false});
 }
 function commit(input={}){
  const id=input.sourceId;
  if(!QL485_SOURCE_IDS.includes(id))return hold('QL486_KNOWN_SOURCE_ID_REQUIRED');
  let lockfd;
  try{lockfd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
    constants.O_EXCL|constants.O_NOFOLLOW,0o600)}
  catch{return hold('QL486_SINGLE_WRITER_LOCK_BUSY_OR_UNSAFE')}
  try{
   const rows=checkedRows(id);
   if(rows.length>=128)return hold('QL486_SOURCE_JOURNAL_CAPACITY_REVIEW_REQUIRED');
   const atMs=now();
   const classified=classify({...input,atMs});
   if(!['PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD',
    'SOURCE_CONTRACT_CHANGE_PENDING_OWNER_APPROVAL'].includes(classified.state))
    return classified;
   const aid=input.sourceAttestationPacket.payload.attestationId;
   const existing=rows.find(x=>x.sourceAttestationPacket.payload.attestationId===aid);
   if(existing)return hash([existing.noticePacket,existing.sourceAttestationPacket,
      existing.ownerPacket,existing.reviewerPacket])===
      hash([input.noticePacket,input.sourceAttestationPacket,input.ownerPacket,input.reviewerPacket])?
       {...classified,state:'DURABLE_ATTESTATION_REPLAY_HELD',recordDigest:existing.recordDigest}:
       hold('QL486_ATTESTATION_ID_REUSED_WITH_DIFFERENT_EVIDENCE');
   const data={schema:'rosevear.comms.ql486.private-source-attestation.v1',
    sourceId:id,sequence:rows.length+1,
    previousDigest:rows.at(-1)?.recordDigest??null,
    noticePacket:input.noticePacket,sourceAttestationPacket:input.sourceAttestationPacket,
    ownerPacket:input.ownerPacket,reviewerPacket:input.reviewerPacket,
    classification:classified.state,committedAtMs:atMs};
   const record={...data,recordDigest:hash(data)};
   appendLog(path(id),record,rows.length===0);
   fsyncDir(folder);
   const reread=checkedRows(id);
   if(reread.at(-1)?.recordDigest!==record.recordDigest)
    return hold('QL486_DURABLE_ATTESTATION_READBACK_FAILED');
   return {...classified,state:'DURABLE_'+classified.state,
    recordDigest:record.recordDigest,sequence:record.sequence,durableReadback:true};
  }catch{return hold('QL486_PRIVATE_CHAIN_OR_DURABLE_WRITE_FAILED')}
  finally{
   closeSync(lockfd);
   try{unlinkSync(lock)}catch{/* hold on subsequent write until owner review */}
  }
 }
 return Object.freeze({commit,summary,
  state:'PRIVATE_SIX_APP_REGISTRY_MANUAL_SIGNED_INPUT_ONLY',
  autoListen:false,publicRoute:false,sourceConnect:false,providerSend:false});
}
export const QL486_BOUNDARY=Object.freeze({
 sourceAttestation:'SIGNED_CLAIM_ONLY_NOT_TRUSTED_PHYSICAL_WITNESS',
 clientActivation:false,publicRoute:false,automaticListeners:false,
 customerWrites:false,sourceWrites:false,authorityTransfer:false});
