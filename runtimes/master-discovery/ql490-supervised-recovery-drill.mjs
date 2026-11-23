/**
 * QL-490 operator-supervised, separately signed, read-only recovery rehearsal.
 * A successful drill creates only a durable private metadata receipt; it never
 * performs restore, networking, source enrollment, scheduling or customer writes.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,fstatSync,openSync,closeSync,
 readFileSync,writeFileSync,fsyncSync,unlinkSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {canonicalize} from './manifest.mjs';

export const QL490_DRILL_SCHEMA='rosevear.comms.ql490.owner-supervised-recovery-drill.v1';
const HEX=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z0-9_-]{8,96}$/;
const PACKET=['schema','drillId','sourceId','readbackDigest','expectedCaptureDigest',
 'mode','requestedAction','role','actorId','issuedAtMs','expiresAtMs',
 'customerDataIncluded','authorityTransfer'];
const RECORD=['sequence','previousDigest','drillId','sourceId','readbackDigest',
 'ownerDigest','reviewerDigest','outcome','recordedAtMs','recordDigest'];
const exact=(x,k)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===k.length&&k.every(y=>Object.hasOwn(x,y));
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,restorePerformed:false,
 originalHostPhysicallyVerified:false,authorityTransfer:false,customerWrites:false});
function publicKey(pem){
 try{const key=createPublicKey(pem);return key.asymmetricKeyType==='ed25519'?key:null}
 catch{return null}
}
function signed(packet,pem,now,role){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,PACKET)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const p=packet.payload,key=publicKey(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!key&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(p)),key,sig)&&
   p.schema===QL490_DRILL_SCHEMA&&ID.test(p.drillId??'')&&
   QL485_SOURCE_IDS.includes(p.sourceId)&&HEX.test(p.readbackDigest??'')&&
   (p.expectedCaptureDigest===null||HEX.test(p.expectedCaptureDigest??''))&&
   p.mode==='PRIVATE_OFFLINE_REHEARSAL'&&
   p.requestedAction==='VERIFY_RECOVERY_STEPS_NO_SEND'&&
   p.role===role&&ID.test(p.actorId??'')&&
   Number.isSafeInteger(p.issuedAtMs)&&p.issuedAtMs<=now&&
   now-p.issuedAtMs<=120000&&Number.isSafeInteger(p.expiresAtMs)&&
   p.expiresAtMs>now&&p.expiresAtMs-p.issuedAtMs<=300000&&
   p.customerDataIncluded===false&&p.authorityTransfer===false;
 }catch{return false}
}
function safeDir(folder){
 if(typeof folder!=='string'||!isAbsolute(folder)||
  folder.split(/[\\/]/).includes('..'))throw Error('QL490_DRILL_PRIVATE_ABSOLUTE_DIRECTORY');
 const dir=resolve(folder);
 mkdirSync(dir,{recursive:true,mode:0o700});
 const s=lstatSync(dir);
 if(!s.isDirectory()||s.isSymbolicLink()||
  (process.platform!=='win32'&&(s.mode&0o077)))
  throw Error('QL490_DRILL_PRIVATE_DIRECTORY_UNSAFE');
 return dir;
}
export function createQl490DrillJournal({directory,now=()=>Date.now()}={}){
 const dir=safeDir(directory),file=join(dir,'ql490-recovery-drills.ndjson'),
 lock=join(dir,'.ql490-recovery-drills.lock');
 function read(){
  let fd;
  try{
   try{const st=lstatSync(file);if(!st.isFile()||st.isSymbolicLink())
    throw Error('QL490_DRILL_JOURNAL_UNSAFE')}
   catch(e){if(e.code==='ENOENT')return [];throw e}
   fd=openSync(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
   const st=fstatSync(fd);
   if(!st.isFile()||st.size<1||st.size>1000000||
    (process.platform!=='win32'&&(st.mode&0o077)))
    throw Error('QL490_DRILL_JOURNAL_PERMISSION_HOLD');
   const raw=readFileSync(fd,'utf8');
   if(!raw.endsWith('\n'))throw Error('QL490_DRILL_JOURNAL_TRUNCATED');
   const rows=raw.trimEnd().split('\n').map(s=>JSON.parse(s));
   if(rows.length>128)throw Error('QL490_DRILL_JOURNAL_CAPACITY');
   let prev=null;
   rows.forEach((r,i)=>{
    if(!exact(r,RECORD)||r.sequence!==i+1||r.previousDigest!==prev||
     !ID.test(r.drillId??'')||!QL485_SOURCE_IDS.includes(r.sourceId)||
     ![r.readbackDigest,r.ownerDigest,r.reviewerDigest,r.recordDigest].every(x=>HEX.test(x??''))||
     r.outcome!=='SIMULATED_NO_SEND_HELD'||!Number.isSafeInteger(r.recordedAtMs)||
     digest(Object.fromEntries(RECORD.filter(k=>k!=='recordDigest').map(k=>[k,r[k]])))!==r.recordDigest)
     throw Error('QL490_DRILL_JOURNAL_TAMPER');
    prev=r.recordDigest;
   });
   return rows;
  }finally{if(fd!==undefined)closeSync(fd)}
 }
 function append({drillId,sourceId,readbackDigest,ownerDigest,reviewerDigest}={}){
  if(!ID.test(drillId??'')||!QL485_SOURCE_IDS.includes(sourceId)||
   ![readbackDigest,ownerDigest,reviewerDigest].every(x=>HEX.test(x??'')))
   return hold('QL490_EXACT_SIGNED_DRILL_DIGESTS_REQUIRED');
  let fd;
  try{fd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL490_SINGLE_WRITER_REQUIRED')}
  try{
   const rows=read();
   if(rows.some(x=>x.drillId===drillId))
    return hold('QL490_DRILL_ID_REPLAY_DENIED');
   if(rows.length>=128)return hold('QL490_DRILL_LOG_CAPACITY_REVIEW');
   const base={sequence:rows.length+1,previousDigest:rows.at(-1)?.recordDigest??null,
    drillId,sourceId,readbackDigest,ownerDigest,reviewerDigest,
    outcome:'SIMULATED_NO_SEND_HELD',recordedAtMs:now()};
   const entry={...base,recordDigest:digest(base)};
   const out=openSync(file,constants.O_WRONLY|constants.O_APPEND|
    (constants.O_NOFOLLOW||0)|(rows.length===0?constants.O_CREAT|constants.O_EXCL:0),0o600);
   try{writeFileSync(out,JSON.stringify(entry)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   if(read().at(-1)?.recordDigest!==entry.recordDigest)
    return hold('QL490_DRILL_DURABLE_READBACK_MISMATCH');
   return {state:'DURABLE_NO_SEND_RECOVERY_DRILL_HELD',
    recordDigest:entry.recordDigest,sequence:entry.sequence,
    restorePerformed:false,customerWrites:false};
  }catch{return hold('QL490_DRILL_JOURNAL_WRITE_OR_TAMPER_HOLD')}
  finally{closeSync(fd);try{unlinkSync(lock)}catch{}}
 }
 function summary(){
  try{const rows=read();
   return {state:'PRIVATE_Ql490_DRILL_JOURNAL_HELD',drillCount:rows.length,
    lastDigest:rows.at(-1)?.recordDigest??null,restoresPerformed:0,
    sourceWrites:false,customerWrites:false};
  }catch{return hold('QL490_DRILL_JOURNAL_TAMPER_HOLD')}
 }
 return Object.freeze({append,summary,automaticRestores:false,publicRoute:false,
  customerWrites:false});
}
export function createQl490SupervisedRecoveryDrill({readCurrent,drillJournal,
 ownerPublicKeyPem,reviewerPublicKeyPem,now=()=>Date.now()}={}){
 if(typeof readCurrent!=='function'||typeof drillJournal?.append!=='function'||
  !publicKey(ownerPublicKeyPem)||!publicKey(reviewerPublicKeyPem)||
  ownerPublicKeyPem===reviewerPublicKeyPem)
  throw Error('QL490_INDEPENDENT_RECOVERY_OWNER_AND_REVIEWER_REQUIRED');
 function run({supervised=false,sourceId,ownerPacket,reviewerPacket}={}){
  if(!supervised||!QL485_SOURCE_IDS.includes(sourceId))
   return hold('QL490_INTERACTIVE_ONE_SOURCE_RECOVERY_REQUIRED');
  const at=now(),op=ownerPacket?.payload,rp=reviewerPacket?.payload;
  if(!signed(ownerPacket,ownerPublicKeyPem,at,'owner')||
   !signed(reviewerPacket,reviewerPublicKeyPem,at,'independent-reviewer')||
   op.drillId!==rp.drillId||op.sourceId!==sourceId||rp.sourceId!==sourceId||
   op.readbackDigest!==rp.readbackDigest||
   op.expectedCaptureDigest!==rp.expectedCaptureDigest||
   op.requestedAction!==rp.requestedAction||op.actorId===rp.actorId)
   return hold('QL490_TWO_FRESH_SEPARATELY_SIGNED_OWNER_APPROVALS_REQUIRED');
  let before,after;
  try{before=readCurrent();}catch{return hold('QL490_PRIVATE_READBACK_UNAVAILABLE')}
  if(before?.state!=='PRIVATE_SIX_SOURCE_READBACK_HELD'||
   !HEX.test(before.readbackDigest??'')||
   before.readbackDigest!==op.readbackDigest||
   before.sources?.[sourceId]?.lastCaptureDigest!==op.expectedCaptureDigest)
   return hold('QL490_SIGNED_CURRENT_READBACK_REQUIRED');
  // A deterministic tabletop-only review. Nothing is restarted, connected,
  // recovered, or called. A missing source remains HOLD and must be recaptured
  // separately via an explicit original-host QL489 ceremony.
  const steps=['READ_INDEPENDENT_SIX_SOURCE_DIGESTS',
   'CLASSIFY_SOURCE_RECEIPT_AND_EXCEPTION_AGE',
   'REHEARSE_OPERATOR_ESCALATION_WITHOUT_WRITE',
   'REQUIRE_NEW_ORIGINAL_HOST_CAPTURE_FOR_REAL_RECOVERY',
   'CONFIRM_NO_SOURCE_OR_CUSTOMER_EFFECTS'];
  try{after=readCurrent();}catch{return hold('QL490_POST_DRILL_READBACK_FAILED')}
  if(after?.readbackDigest!==before.readbackDigest)
   return hold('QL490_READBACK_CHANGED_DURING_NO_SEND_DRILL');
  const saved=drillJournal.append({drillId:op.drillId,sourceId,
   readbackDigest:before.readbackDigest,ownerDigest:digest(ownerPacket),
   reviewerDigest:digest(reviewerPacket)});
  if(saved.state!=='DURABLE_NO_SEND_RECOVERY_DRILL_HELD')
   return hold('QL490_DURABLE_SIGNED_DRILL_OR_REPLAY_HOLD');
  return {state:'DURABLE_OWNER_SUPERVISED_RECOVERY_REHEARSAL_HELD',
   drillReceiptDigest:saved.recordDigest,sourceId,steps,
   originalWindowsPhysicallyCertified:false,restorePerformed:false,
   sourceAuthorized:false,customerWrites:false,automaticRecovery:false,
   productionFieldAcceptance:false};
 }
 return Object.freeze({run,automaticRecovery:false,publicRoute:false,
  sourceWrites:false,customerWrites:false});
}
