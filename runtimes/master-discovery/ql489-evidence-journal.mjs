/** QL-489 private, hash-chained, fsynced operator witness and exception metadata.
 * No customer payloads, trust keys, raw source packets or signed envelopes stored.
 */
import {createHash} from 'node:crypto';
import {openSync,closeSync,readFileSync,writeFileSync,fsyncSync,fstatSync,
 mkdirSync,lstatSync,unlinkSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';

const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const CAPTURE=['kind','sequence','previousDigest','sourceId','receiptDigest',
 'registryDigest','witnessDigest','endpointFingerprint','bundleDigest','recordedAtMs','recordDigest'];
const CLOSURE=['kind','sequence','previousDigest','sourceId','caseId','captureRecordDigest',
 'operatorDigest','reviewerDigest','reasonCode','recordedAtMs','recordDigest'];
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const hold=reason=>({state:'HOLD',reason,productionAcceptance:false,customerWrites:false});
function safeDirectory(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))throw Error('QL489_PRIVATE_ABSOLUTE_FOLDER_REQUIRED');
 const dir=resolve(directory);mkdirSync(dir,{recursive:true,mode:0o700});
 const st=lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL489_PRIVATE_FOLDER_UNSAFE');
 return dir;
}
export function createQl489EvidenceJournal({directory,now=()=>Date.now()}={}){
 const dir=safeDirectory(directory),path=join(dir,'ql489-capture-exceptions.ndjson'),
 lock=join(dir,'.ql489-capture-exceptions.lock');
 function read(){
  let fd;
  try{
   try{if(lstatSync(path).isSymbolicLink())throw Error('QL489_JOURNAL_LINK_DENIED')}
   catch(e){if(e.code!=='ENOENT')throw e}
   fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  }catch(e){if(e.code==='ENOENT')return [];throw e}
  try{
   const st=fstatSync(fd);
   if(!st.isFile()||st.size===0||st.size>2000000||
    (process.platform!=='win32'&&(st.mode&0o077)))
    throw Error('QL489_JOURNAL_FILE_UNSAFE');
   const data=readFileSync(fd,'utf8');
   if(!data.endsWith('\n'))throw Error('QL489_JOURNAL_TRUNCATED');
   const rows=data.trimEnd().split('\n').map(x=>JSON.parse(x));
   if(rows.length>256)throw Error('QL489_JOURNAL_CAPACITY');
   let previous=null;
   rows.forEach((r,i)=>{
    const fields=r.kind==='CAPTURE'?CAPTURE:r.kind==='EXCEPTION_CLOSURE'?CLOSURE:null;
    if(!fields||!exact(r,fields)||r.sequence!==i+1||
     r.previousDigest!==previous||!QL485_SOURCE_IDS.includes(r.sourceId)||
     !HEX.test(r.recordDigest??'')||
     !Number.isSafeInteger(r.recordedAtMs)||r.recordedAtMs<=0||
     (r.kind==='CAPTURE'?
      ![r.receiptDigest,r.registryDigest,r.witnessDigest,r.endpointFingerprint,r.bundleDigest].every(x=>HEX.test(x??'')):
      !ID.test(r.caseId??'')||!HEX.test(r.captureRecordDigest??'')||
       !HEX.test(r.operatorDigest??'')||!HEX.test(r.reviewerDigest??'')||
       !/^[A-Z][A-Z0-9_]{4,63}$/.test(r.reasonCode??''))||
     hash(Object.fromEntries(fields.filter(x=>x!=='recordDigest').map(x=>[x,r[x]])))!==r.recordDigest)
     throw Error('QL489_JOURNAL_CHAIN_TAMPERED');
    if(r.kind==='EXCEPTION_CLOSURE'&&!rows.slice(0,i).some(c=>
     c.kind==='CAPTURE'&&c.sourceId===r.sourceId&&c.recordDigest===r.captureRecordDigest))
     throw Error('QL489_EXCEPTION_NO_PRIOR_CAPTURE');
    previous=r.recordDigest;
   });
   return rows;
  }finally{closeSync(fd)}
 }
 function append(kind,body){
  let fd;
  try{fd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
    constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL489_SINGLE_WRITER_REQUIRED')}
  try{
   const rows=read();
   if(rows.length>=256)return hold('QL489_JOURNAL_CAPACITY_REVIEW');
   if(kind==='CAPTURE'){
    const old=rows.find(x=>x.kind==='CAPTURE'&&x.sourceId===body.sourceId&&
     x.witnessDigest===body.witnessDigest);
    if(old)return hold('QL489_CAPTURE_WITNESS_REPLAY_REJECTED');
   }else{
    const existing=rows.find(x=>x.kind==='EXCEPTION_CLOSURE'&&
     x.sourceId===body.sourceId&&x.caseId===body.caseId);
    if(existing)return existing.captureRecordDigest===body.captureRecordDigest&&
     existing.operatorDigest===body.operatorDigest&&
     existing.reviewerDigest===body.reviewerDigest?
     {state:'DURABLE_EXCEPTION_CLOSURE_REPLAY_HELD',recordDigest:existing.recordDigest}:
     hold('QL489_EXCEPTION_CASE_ID_CONFLICT');
   }
   const data={kind,sequence:rows.length+1,
    previousDigest:rows.at(-1)?.recordDigest??null,...body,recordedAtMs:now()};
   const record={...data,recordDigest:hash(data)};
   const flags=constants.O_WRONLY|constants.O_APPEND|(constants.O_NOFOLLOW||0)|
    (rows.length===0?(constants.O_CREAT|constants.O_EXCL):0);
   const out=openSync(path,flags,0o600);
   try{writeFileSync(out,JSON.stringify(record)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   if(read().at(-1)?.recordDigest!==record.recordDigest)
    return hold('QL489_FSYNC_READBACK_MISMATCH');
   return {state:kind==='CAPTURE'?'DURABLE_SIGNED_CAPTURE_HELD':
    'DURABLE_SIGNED_EXCEPTION_CLOSED_HELD',
    recordDigest:record.recordDigest,sequence:record.sequence,authorityTransfer:false};
  }catch{return hold('QL489_DURABLE_JOURNAL_TAMPER_OR_WRITE_FAILURE')}
  finally{closeSync(fd);try{unlinkSync(lock)}catch{}}
 }
 function appendCapture(input={}){
  if(!exact(input,['sourceId','receiptDigest','registryDigest','witnessDigest',
   'endpointFingerprint','bundleDigest'])||!QL485_SOURCE_IDS.includes(input.sourceId)||
   [input.receiptDigest,input.registryDigest,input.witnessDigest,
    input.endpointFingerprint,input.bundleDigest].some(x=>!HEX.test(x??'')))
   return hold('QL489_CAPTURE_DIGESTS_REQUIRED');
  return append('CAPTURE',input);
 }
 function appendClosure(input={}){
  if(!exact(input,['sourceId','caseId','captureRecordDigest','operatorDigest',
   'reviewerDigest','reasonCode'])||!QL485_SOURCE_IDS.includes(input.sourceId)||
   !ID.test(input.caseId??'')||
   !/^[A-Z][A-Z0-9_]{4,63}$/.test(input.reasonCode??'')||
   [input.captureRecordDigest,input.operatorDigest,input.reviewerDigest].some(x=>!HEX.test(x??'')))
   return hold('QL489_SIGNED_EXCEPTION_DIGESTS_REQUIRED');
  try{
   if(!read().some(x=>x.kind==='CAPTURE'&&x.sourceId===input.sourceId&&
    x.recordDigest===input.captureRecordDigest))
    return hold('QL489_MATCHING_CAPTURE_NOT_FOUND');
  }catch{return hold('QL489_CAPTURE_CHAIN_TAMPER_HOLD')}
  return append('EXCEPTION_CLOSURE',input);
 }
 function findCapture(sourceId,recordDigest){
  try{
   const record=read().find(x=>x.kind==='CAPTURE'&&x.sourceId===sourceId&&
    x.recordDigest===recordDigest);
   return record?{state:'CAPTURE_EVIDENCE_FOUND',record}:
    hold('QL489_CAPTURE_NOT_FOUND');
  }catch{return hold('QL489_JOURNAL_TAMPER_HOLD')}
 }
 function summary(){
  try{
   const rows=read();
   return {state:'PRIVATE_Ql489_EVIDENCE_HELD',records:rows.length,
    lastDigest:rows.at(-1)?.recordDigest??null,
    sources:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
     captures:rows.filter(r=>r.sourceId===id&&r.kind==='CAPTURE').length,
     closedExceptions:rows.filter(r=>r.sourceId===id&&r.kind==='EXCEPTION_CLOSURE').length
    }])),originalHostPhysicallyCertified:0,productionAcceptance:false,
    customerWrites:false};
  }catch{return hold('QL489_JOURNAL_TAMPER_HOLD')}
 }
 return Object.freeze({appendCapture,appendClosure,findCapture,summary,
  autoListen:false,publicRoute:false,customerWrites:false});
}
