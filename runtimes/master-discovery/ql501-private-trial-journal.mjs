/**
 * QL-501 original-owner private one-trial journal.
 * A reservation is written and fsynced BEFORE a possible network call.
 * A failed/unknown result cannot be retried under the same trialId.
 * This journal is never proof of provider-side delivery or production rights.
 */
import {createHash} from 'node:crypto';
import {lstatSync,openSync,readFileSync,closeSync,fsyncSync,
 writeSync,fstatSync,unlinkSync,constants} from 'node:fs';
import {join,resolve,isAbsolute,sep} from 'node:path';
import {canonicalize} from './manifest.mjs';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const ROW=['sequence','previousDigest','trialId','sourcePacketDigest',
 'phase','providerPacketDigest','recordedAtMs','recordDigest'];
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const sha=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,networkReceiptCertified:false,
 productionReleaseAuthorized:false,customerWrites:false,
 automaticNetworkSend:false});
function directory(root){
 if(typeof root!=='string'||!isAbsolute(root)||
  root.split(/[\\/]/).includes('..'))throw Error('QL501_ABSOLUTE_ROOT_REQUIRED');
 const path=resolve(root),st=lstatSync(path);
 if(!st.isDirectory()||st.isSymbolicLink()||
  process.platform!=='win32'&&(st.mode&0o077)!==0)
  throw Error('QL501_PRIVATE_ROOT_UNSAFE');
 return path;
}
function readRows(root){
 const file=join(root,'ql501-one-trial-audit.ndjson');
 let fd;
 try{
  try{
   const st=lstatSync(file);
   if(!st.isFile()||st.isSymbolicLink()||st.size>262144||
    process.platform!=='win32'&&(st.mode&0o077)!==0)
    throw Error('QL501_PRIVATE_JOURNAL_FILE_UNSAFE');
  }catch(e){if(e.code==='ENOENT')return [];throw e;}
  fd=openSync(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size>262144)throw Error('QL501_PRIVATE_JOURNAL_RACE');
  const raw=readFileSync(fd,'utf8');
  if(raw&&!raw.endsWith('\n'))throw Error('QL501_PARTIAL_JOURNAL');
  const rows=raw?raw.trimEnd().split('\n').map(JSON.parse):[];
  if(rows.length>128)throw Error('QL501_JOURNAL_CAPACITY');
  let last=null,time=0;const seen=new Map();
  for(const [i,r] of rows.entries()){
   if(!exact(r,ROW)||r.sequence!==i+1||r.previousDigest!==last||
    !ID.test(r.trialId??'')||!HEX.test(r.sourcePacketDigest??'')||
    !Number.isSafeInteger(r.recordedAtMs)||r.recordedAtMs<=0||
    r.recordedAtMs<time||!HEX.test(r.recordDigest??'')||
    sha(Object.fromEntries(ROW.filter(k=>k!=='recordDigest')
      .map(k=>[k,r[k]])))!==r.recordDigest)
    throw Error('QL501_JOURNAL_CHAIN_TAMPER');
   if(r.phase==='RESERVED'){
    if(r.providerPacketDigest!==null||seen.has(r.trialId))
     throw Error('QL501_DUPLICATE_RESERVATION');
    seen.set(r.trialId,{phase:'RESERVED',digest:r.sourcePacketDigest});
   }else if(['PROVIDER_ACK_HELD','FAILED_OR_UNKNOWN'].includes(r.phase)){
    const prior=seen.get(r.trialId);
    if(!prior||prior.phase!=='RESERVED'||
     prior.digest!==r.sourcePacketDigest||
     (r.phase==='PROVIDER_ACK_HELD'&&!HEX.test(r.providerPacketDigest??''))||
     (r.phase==='FAILED_OR_UNKNOWN'&&r.providerPacketDigest!==null))
     throw Error('QL501_DUPLICATE_OR_UNMATCHED_OUTCOME');
    seen.set(r.trialId,{phase:r.phase,digest:r.sourcePacketDigest});
   }else throw Error('QL501_UNKNOWN_PHASE');
   last=r.recordDigest;time=r.recordedAtMs;
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd);}
}
export function inspectQl501PrivateTrialJournal({directory:root}={}){
 try{
  const rows=readRows(directory(root));
  return {state:'QL501_LOCAL_TRIAL_JOURNAL_REVIEW_HELD',
   rows:rows.length,head:rows.at(-1)?.recordDigest??null,
   reservedTrials:rows.filter(x=>x.phase==='RESERVED').length,
   providerAckRecords:rows.filter(x=>x.phase==='PROVIDER_ACK_HELD').length,
   actualProviderDeliveryCertified:false,
   productionReleaseAuthorized:false,
   automaticNetworkSend:false,customerWrites:false};
 }catch{return hold('QL501_LOCAL_JOURNAL_MISSING_UNSAFE_OR_TAMPERED');}
}
/** Write only once for a trial, with exclusive lock and durable fsync.
 * phase must be RESERVED, PROVIDER_ACK_HELD, or FAILED_OR_UNKNOWN.
 */
export function recordQl501PrivateTrial({directory:root,phase,trialId,
 sourcePacketDigest,providerPacketDigest=null,now=Date.now()}={}){
 if(!['RESERVED','PROVIDER_ACK_HELD','FAILED_OR_UNKNOWN'].includes(phase)||
  !ID.test(trialId??'')||!HEX.test(sourcePacketDigest??'')||
  !Number.isSafeInteger(now)||now<=0||
  (phase==='PROVIDER_ACK_HELD'&&!HEX.test(providerPacketDigest??''))||
  (phase!=='PROVIDER_ACK_HELD'&&providerPacketDigest!==null))
  return hold('QL501_EXACT_TRIAL_JOURNAL_DATA_REQUIRED');
 let lockfd,fd,lockfile;
 try{
  const dir=directory(root);
  lockfile=join(dir,'.ql501-one-trial-lock');
  lockfd=openSync(lockfile,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|
   (constants.O_NOFOLLOW||0),0o600);
  closeSync(lockfd);lockfd=undefined;
  const rows=readRows(dir),same=rows.filter(r=>r.trialId===trialId);
  if(rows.length>=128||now<(rows.at(-1)?.recordedAtMs??0)||
   (phase==='RESERVED'&&same.length!==0)||
   (phase!=='RESERVED'&&(same.length!==1||
    same[0].phase!=='RESERVED'||same[0].sourcePacketDigest!==sourcePacketDigest)))
   return hold('QL501_ALREADY_RESERVED_NO_REPLAY_OR_INVALID_TRANSITION');
  const base={sequence:rows.length+1,
   previousDigest:rows.at(-1)?.recordDigest??null,
   trialId,sourcePacketDigest,phase,providerPacketDigest,recordedAtMs:now};
  const row={...base,recordDigest:sha(base)};
  const file=join(dir,'ql501-one-trial-audit.ndjson');
  fd=openSync(file,constants.O_APPEND|constants.O_WRONLY|
   (constants.O_NOFOLLOW||0)|
   (rows.length?0:constants.O_CREAT|constants.O_EXCL),0o600);
  const st=fstatSync(fd);
  if(!st.isFile()||st.size>262144||
   process.platform!=='win32'&&(st.mode&0o077)!==0)
   return hold('QL501_PRIVATE_AUDIT_PERMISSIONS_UNSAFE');
  const line=Buffer.from(JSON.stringify(row)+'\n');
  if(writeSync(fd,line)!==line.length)throw Error('QL501_SHORT_WRITE');
  fsyncSync(fd);closeSync(fd);fd=undefined;
  if(readRows(dir).at(-1)?.recordDigest!==row.recordDigest)
   return hold('QL501_JOURNAL_FSYNC_READBACK_FAILED');
  return {state:'QL501_TRIAL_JOURNAL_'+phase+'_DURABLE_HELD',
   trialId,phase,recordDigest:row.recordDigest,
   originalHostPhysicallyCertified:false,
   providerDeliveryCertified:false,productionReleaseAuthorized:false,
   automaticNetworkSend:false,customerWrites:false};
 }catch{return hold('QL501_PRIVATE_TRIAL_JOURNAL_WRITE_FAILED');}
 finally{
  if(fd!==undefined)try{closeSync(fd);}catch{}
  if(lockfd!==undefined)try{closeSync(lockfd);}catch{}
  if(lockfile)try{unlinkSync(lockfile);}catch{}
 }
}
