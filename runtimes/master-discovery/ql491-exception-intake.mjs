/**
 * QL-491: independent signed exception intake reconciliation and metadata-only
 * original-host field proof FOLLOW-UP custody. Never certifies a field witness,
 * sends messages, grants source authority, starts receivers or performs restore.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,fstatSync,readFileSync,
 writeFileSync,fsyncSync,unlinkSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
export const QL491_FIELD_FOLLOWUP_SCHEMA='rosevear.comms.ql491.signed-field-proof-follow-up.v1';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const INTAKE=['kind','sequence','previousDigest','readbackDigest','inventoryDigest',
 'snapshotDigest','caseCount','openCount','overdueCount','closedCount',
 'unmatchedClosures','sourceHoldCount','recordedAtMs','recordDigest'];
const FOLLOW=['kind','sequence','previousDigest','requestId','sourceId',
 'readbackDigest','captureDigest','ownerPacketDigest','reviewerPacketDigest',
 'reviewDeadlineAtMs','recordedAtMs','recordDigest'];
const PKT=['schema','requestId','sourceId','readbackDigest','captureDigest',
 'requestedAction','role','actorId','issuedAtMs','expiresAtMs',
 'reviewDeadlineAtMs','physicalWitnessCompleted','customerDataIncluded','authorityTransfer'];
const exact=(o,ks)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===ks.length&&ks.every(k=>Object.hasOwn(o,k));
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,originalHostPhysicallyVerified:false,
 fieldProofCertified:false,sourceAuthority:false,customerWrites:false,automaticActions:false});
const hexOrNull=x=>x===null||HEX.test(x??'');
function trustedKey(pem){
 try{let k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?k:null}
 catch{return null}
}
function signed(packet,pem,role,at){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,PKT)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const p=packet.payload,k=trustedKey(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!k&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(p)),k,sig)&&
   p.schema===QL491_FIELD_FOLLOWUP_SCHEMA&&
   ID.test(p.requestId??'')&&ID.test(p.actorId??'')&&
   QL485_SOURCE_IDS.includes(p.sourceId)&&
   HEX.test(p.readbackDigest??'')&&hexOrNull(p.captureDigest)&&
   p.requestedAction==='INDEPENDENT_ORIGINAL_HOST_FIELD_PROOF_REVIEW_ONLY'&&
   p.role===role&&Number.isSafeInteger(p.issuedAtMs)&&p.issuedAtMs>0&&
   p.issuedAtMs<=at&&at-p.issuedAtMs<=120000&&
   Number.isSafeInteger(p.expiresAtMs)&&p.expiresAtMs>at&&
   p.expiresAtMs-p.issuedAtMs<=300000&&
   Number.isSafeInteger(p.reviewDeadlineAtMs)&&p.reviewDeadlineAtMs>at&&
   p.reviewDeadlineAtMs-p.issuedAtMs<=7*86400000&&
   p.physicalWitnessCompleted===false&&
   p.customerDataIncluded===false&&p.authorityTransfer===false;
 }catch{return false}
}
function safeDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))
  throw Error('QL491_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const dir=resolve(directory);
 mkdirSync(dir,{recursive:true,mode:0o700});
 const st=lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL491_PRIVATE_DIRECTORY_UNSAFE');
 return dir;
}
export function createQl491ReviewJournal({directory,now=()=>Date.now()}={}){
 const dir=safeDir(directory),path=join(dir,'ql491-intake-field-followups.ndjson'),
  lock=join(dir,'.ql491-intake-field-followups.lock');
 function read(){
  let fd;
  try{
   try{const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink())
    throw Error('QL491_REVIEW_JOURNAL_UNSAFE')}
   catch(e){if(e.code==='ENOENT')return [];throw e}
   fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
   const st=fstatSync(fd);
   if(!st.isFile()||st.size<1||st.size>2000000||
    (process.platform!=='win32'&&(st.mode&0o077)))
    throw Error('QL491_REVIEW_JOURNAL_PERMISSION_HOLD');
   const raw=readFileSync(fd,'utf8');
   if(!raw.endsWith('\n'))throw Error('QL491_REVIEW_JOURNAL_TRUNCATED');
   const rows=raw.trimEnd().split('\n').map(x=>JSON.parse(x));
   if(rows.length>256)throw Error('QL491_REVIEW_JOURNAL_CAPACITY');
   let prior=null,prevTime=0;
   const requestIds=new Set();
   for(const [i,r] of rows.entries()){
    const fields=r.kind==='INTAKE_REVIEW'?INTAKE:
     r.kind==='FIELD_PROOF_FOLLOWUP'?FOLLOW:null;
    if(!fields||!exact(r,fields)||r.sequence!==i+1||r.previousDigest!==prior||
     !HEX.test(r.recordDigest??'')||!Number.isSafeInteger(r.recordedAtMs)||
     r.recordedAtMs<=0||r.recordedAtMs<prevTime||
     hash(Object.fromEntries(fields.filter(k=>k!=='recordDigest').map(k=>[k,r[k]])))!==r.recordDigest)
     throw Error('QL491_PRIVATE_REVIEW_CHAIN_TAMPERED');
    if(r.kind==='INTAKE_REVIEW'){
     if(![r.readbackDigest,r.inventoryDigest,r.snapshotDigest].every(x=>HEX.test(x??''))||
      ![r.caseCount,r.openCount,r.overdueCount,r.closedCount,
       r.unmatchedClosures,r.sourceHoldCount].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=256)||
      r.caseCount!==r.openCount+r.overdueCount+r.closedCount)
      throw Error('QL491_PRIVATE_INTAKE_COUNTS_TAMPERED');
    }else{
     if(!ID.test(r.requestId??'')||!QL485_SOURCE_IDS.includes(r.sourceId)||
      ![r.readbackDigest,r.ownerPacketDigest,r.reviewerPacketDigest].every(x=>HEX.test(x??''))||
      !hexOrNull(r.captureDigest)||!Number.isSafeInteger(r.reviewDeadlineAtMs)||
      r.reviewDeadlineAtMs<=r.recordedAtMs||requestIds.has(r.requestId)||
      !rows.slice(0,i).some(x=>x.kind==='INTAKE_REVIEW'&&x.readbackDigest===r.readbackDigest))
      throw Error('QL491_PRIVATE_FIELD_FOLLOWUP_CUSTODY_TAMPERED');
     requestIds.add(r.requestId);
    }
    prior=r.recordDigest;prevTime=r.recordedAtMs;
   }
   return rows;
  }finally{if(fd!==undefined)closeSync(fd)}
 }
 function append(kind,body){
  let fd;
  try{fd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL491_EXCLUSIVE_WRITER_REQUIRED')}
  try{
   const rows=read();
   if(rows.length>=256)return hold('QL491_PRIVATE_JOURNAL_CAPACITY');
   if(kind==='INTAKE_REVIEW'){
    const old=rows.find(r=>r.kind==='INTAKE_REVIEW'&&
     r.readbackDigest===body.readbackDigest&&
     r.inventoryDigest===body.inventoryDigest&&
     r.snapshotDigest===body.snapshotDigest);
    if(old)return {state:'EXISTING_SIGNED_INTAKE_REVIEW_HELD',
     recordDigest:old.recordDigest,customerWrites:false,fieldProofCertified:false};
   }else{
    if(rows.some(r=>r.kind==='FIELD_PROOF_FOLLOWUP'&&r.requestId===body.requestId))
     return hold('QL491_FIELD_FOLLOWUP_REQUEST_REPLAY');
    if(!rows.some(r=>r.kind==='INTAKE_REVIEW'&&r.readbackDigest===body.readbackDigest))
     return hold('QL491_READBACK_NOT_DURABLY_RECONCILED');
   }
   const base={kind,sequence:rows.length+1,
    previousDigest:rows.at(-1)?.recordDigest??null,...body,recordedAtMs:now()};
   const record={...base,recordDigest:hash(base)};
   const out=openSync(path,constants.O_WRONLY|constants.O_APPEND|
    (constants.O_NOFOLLOW||0)|(rows.length===0?constants.O_CREAT|constants.O_EXCL:0),0o600);
   try{writeFileSync(out,JSON.stringify(record)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   if(read().at(-1)?.recordDigest!==record.recordDigest)
    return hold('QL491_DURABLE_PRIVATE_REVIEW_READBACK_MISMATCH');
   return {state:kind==='INTAKE_REVIEW'?
    'DURABLE_SIGNED_INTAKE_RECONCILED_HELD':'DURABLE_FIELD_PROOF_FOLLOWUP_REQUEST_HELD',
    recordDigest:record.recordDigest,sequence:record.sequence,
    fieldProofCertified:false,customerWrites:false};
  }catch{return hold('QL491_PRIVATE_REVIEW_JOURNAL_WRITE_OR_TAMPER_HOLD')}
  finally{closeSync(fd);try{unlinkSync(lock)}catch{}}
 }
 function appendIntake(body={}){
  if(!exact(body,INTAKE.filter(x=>!['kind','sequence','previousDigest','recordedAtMs','recordDigest'].includes(x)))||
   ![body.readbackDigest,body.inventoryDigest,body.snapshotDigest].every(x=>HEX.test(x??''))||
   ![body.caseCount,body.openCount,body.overdueCount,body.closedCount,
    body.unmatchedClosures,body.sourceHoldCount].every(x=>Number.isSafeInteger(x)&&x>=0&&x<=256)||
   body.caseCount!==body.openCount+body.overdueCount+body.closedCount)
   return hold('QL491_EXACT_RECONCILED_INTAKE_COUNTS_REQUIRED');
  return append('INTAKE_REVIEW',body);
 }
 function appendFollowup(body={}){
  if(!exact(body,FOLLOW.filter(x=>!['kind','sequence','previousDigest','recordedAtMs','recordDigest'].includes(x)))||
   !ID.test(body.requestId??'')||!QL485_SOURCE_IDS.includes(body.sourceId)||
   ![body.readbackDigest,body.ownerPacketDigest,body.reviewerPacketDigest].every(x=>HEX.test(x??''))||
   !hexOrNull(body.captureDigest)||!Number.isSafeInteger(body.reviewDeadlineAtMs)||
   body.reviewDeadlineAtMs<=now())
   return hold('QL491_SIGNED_FIELD_FOLLOWUP_DIGESTS_REQUIRED');
  return append('FIELD_PROOF_FOLLOWUP',body);
 }
 function summary(){
  try{
   const rows=read();
   return {state:'PRIVATE_Ql491_RECONCILIATION_HELD',
    records:rows.length,latestDigest:rows.at(-1)?.recordDigest??null,
    intakeReviews:rows.filter(x=>x.kind==='INTAKE_REVIEW').length,
    followupRequests:rows.filter(x=>x.kind==='FIELD_PROOF_FOLLOWUP').length,
    realFieldWitnessesCertified:0,customerWrites:false};
  }catch{return hold('QL491_PRIVATE_REVIEW_CHAIN_TAMPERED')}
 }
 return Object.freeze({appendIntake,appendFollowup,summary,
  autoFollowup:false,realFieldProof:false,publicRoute:false,customerWrites:false});
}
export function createQl491ExceptionIntake({readCurrent,journal,now=()=>Date.now()}={}){
 if(typeof readCurrent!=='function'||typeof journal?.appendIntake!=='function'||
  typeof journal?.appendFollowup!=='function'||typeof journal?.summary!=='function')
  throw Error('QL491_PRIVATE_INDEPENDENT_READBACK_AND_JOURNAL_REQUIRED');
 function validReport(report,packets){
  return report?.state==='PRIVATE_SIX_SOURCE_READBACK_HELD'&&
   HEX.test(report.readbackDigest??'')&&HEX.test(report.registryDigest??'')&&
   report.caseCount===packets.length&&Array.isArray(report.cases)&&
   report.cases.length===packets.length&&report.sourceCount===6&&
   QL485_SOURCE_IDS.every(id=>report.sources?.[id]?.sourceId===id)&&
   Number.isSafeInteger(report.unmatchedClosures)&&report.unmatchedClosures>=0&&
   (report.journalHead===null||HEX.test(report.journalHead??''))&&
   report.readbackDigest===hash({
    journalHead:report.journalHead,registryDigest:report.registryDigest,
    sourceReceipts:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
     captureDigest:report.sources[id].lastCaptureDigest,
     receiptDigest:report.sources[id].registryReceiptDigest
    }])),
    signedCasePacketDigests:packets.map(x=>hash(x)).sort()
   });
 }
 function classify(report){
  let open=0,overdue=0,closed=0;
  for(const c of report.cases){
   if(c.status==='OPEN_OPERATOR_REVIEW_HOLD')open++;
   else if(c.status==='OVERDUE_OPERATOR_REVIEW_HOLD')overdue++;
   else if(c.status==='CLOSED_REVIEW_ONLY_HELD')closed++;
   else return null;
  }
  const sourceHoldCount=QL485_SOURCE_IDS.filter(id=>
   report.sources[id].state!=='SOURCE_RECEIPT_DIGEST_MATCH_HELD').length;
  return {caseCount:report.caseCount,openCount:open,overdueCount:overdue,
   closedCount:closed,unmatchedClosures:report.unmatchedClosures,sourceHoldCount};
 }
 function reconcile(signedOpenCasePackets=[]){
  if(!Array.isArray(signedOpenCasePackets)||signedOpenCasePackets.length>128)
   return hold('QL491_SIGNED_CASE_INVENTORY_REQUIRED');
  let a,b;
  try{a=readCurrent();b=readCurrent()}
  catch{return hold('QL491_PRIVATE_INDEPENDENT_READBACK_UNAVAILABLE')}
  if(!validReport(a,signedOpenCasePackets)||!validReport(b,signedOpenCasePackets)||
   a.readbackDigest!==b.readbackDigest)
   return hold('QL491_Ql490_SIGNED_INVENTORY_OR_READBACK_MISMATCH');
  const counts=classify(a);
  if(!counts)return hold('QL491_UNKNOWN_CASE_DISPOSITION_HOLD');
  const inventoryDigest=hash(signedOpenCasePackets.map(x=>hash(x)).sort());
  const snapshotDigest=hash({counts,
   cases:a.cases.map(x=>[x.caseId,x.sourceId,x.status,x.closureDigest]).sort(),
   sourceStates:QL485_SOURCE_IDS.map(id=>[id,a.sources[id].state])});
  const saved=journal.appendIntake({readbackDigest:a.readbackDigest,inventoryDigest,
   snapshotDigest,...counts});
  if(!['DURABLE_SIGNED_INTAKE_RECONCILED_HELD',
   'EXISTING_SIGNED_INTAKE_REVIEW_HELD'].includes(saved.state))
   return hold('QL491_SIGNED_CASE_CUSTODY_FAILED');
  return {state:'SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD',
   readbackDigest:a.readbackDigest,reviewReceiptDigest:saved.recordDigest,
   inventoryDigest,...counts,caseInventoryComplete:a.caseInventoryComplete,
   sourceProofMissing:counts.sourceHoldCount,unmatchedClosureHold:counts.unmatchedClosures>0,
   originalHostPhysicallyVerified:false,fieldProofCertified:false,
   automaticEscalation:false,customerWrites:false};
 }
 function requestFollowup({signedOpenCasePackets=[],sourceId,ownerPacket,
 reviewerPacket,exceptionPins}={}){
  if(!QL485_SOURCE_IDS.includes(sourceId)||!Array.isArray(signedOpenCasePackets)||
   signedOpenCasePackets.length>128)return hold('QL491_ONE_SOURCE_SIGNED_FOLLOWUP_REQUIRED');
  const trust=exceptionPins?.[sourceId],opPem=trust?.operatorPublicKeyPem,
   reviewPem=trust?.reviewerPublicKeyPem;
  const op=ownerPacket?.payload,rp=reviewerPacket?.payload,at=now();
  if(!trustedKey(opPem)||!trustedKey(reviewPem)||opPem===reviewPem||
   !signed(ownerPacket,opPem,'owner',at)||
   !signed(reviewerPacket,reviewPem,'independent-reviewer',at)||
   op.actorId===rp.actorId||op.requestId!==rp.requestId||
   op.sourceId!==sourceId||rp.sourceId!==sourceId||
   op.readbackDigest!==rp.readbackDigest||
   op.captureDigest!==rp.captureDigest||
   op.reviewDeadlineAtMs!==rp.reviewDeadlineAtMs)
   return hold('QL491_DISTINCT_FRESH_SIGNED_FIELD_FOLLOWUP_REQUIRED');
  const intake=reconcile(signedOpenCasePackets);
  if(intake.state!=='SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD'||
   intake.readbackDigest!==op.readbackDigest)
   return hold('QL491_SIGNED_CURRENT_INTAKE_REQUIRED');
  let report;
  try{report=readCurrent()}catch{return hold('QL491_PRIVATE_SOURCE_READBACK_UNAVAILABLE')}
  if(!validReport(report,signedOpenCasePackets)||
   report.readbackDigest!==op.readbackDigest||
   report.sources[sourceId].lastCaptureDigest!==op.captureDigest)
   return hold('QL491_PROOF_REQUEST_SOURCE_DIGEST_MISMATCH');
  const saved=journal.appendFollowup({requestId:op.requestId,sourceId,
   readbackDigest:op.readbackDigest,captureDigest:op.captureDigest,
   ownerPacketDigest:hash(ownerPacket),reviewerPacketDigest:hash(reviewerPacket),
   reviewDeadlineAtMs:op.reviewDeadlineAtMs});
  if(saved.state!=='DURABLE_FIELD_PROOF_FOLLOWUP_REQUEST_HELD')
   return hold('QL491_FIELD_FOLLOWUP_REPLAY_OR_CUSTODY_HOLD');
  return {state:'DURABLE_SIGNED_FIELD_PROOF_FOLLOWUP_HELD',sourceId,
   followupReceiptDigest:saved.recordDigest,requestId:op.requestId,
   proofReviewDueAtMs:op.reviewDeadlineAtMs,physicalWitnessCompleted:false,
   originalHostPhysicallyVerified:false,fieldProofCertified:false,
   sourceAuthority:false,autoListen:false,customerWrites:false};
 }
 return Object.freeze({reconcile,requestFollowup,automaticSourceCertification:false,
  autoEscalation:false,publicRoute:false,customerWrites:false});
}
