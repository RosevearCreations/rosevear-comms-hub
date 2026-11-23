/**
 * QL-485 private write-once read-only compatibility evidence receipts.
 * Stores only redacted signed-source review digests and version states.
 * No HTTP, connection, source mutation or live authority.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,
 fsyncSync,fstatSync,constants} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS,negotiateQl485SixSources}
 from './ql485-signed-release-negotiation.mjs';

const ID=/^[A-Za-z0-9_-]{8,96}$/,HEX=/^[a-f0-9]{64}$/;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>own(o,k));
const hash=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const hold=reason=>({state:'HOLD',reason,sourceAuthorized:false,
 customerDelivery:false,productionAcceptance:false});
function directory(path){
 if(typeof path!=='string'||!isAbsolute(path)||
   path.split(/[\\/]/).includes('..'))
  throw Error('QL485_OWNER_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const folder=resolve(path);
 mkdirSync(folder,{recursive:true,mode:0o700});
 const st=lstatSync(folder);
 if(!st.isDirectory()||st.isSymbolicLink()||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL485_PRIVATE_DIRECTORY_UNSAFE');
 return folder;
}
function readPrivate(file){
 let fd;
 try{fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return null;throw e}
 try{
  const st=fstatSync(fd);
  if(!st.isFile()||st.size>15000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL485_PRIVATE_RECEIPT_FILE_UNSAFE');
  return JSON.parse(readFileSync(fd,'utf8'));
 }finally{closeSync(fd)}
}
function writePrivate(folder,file,data){
 const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|
  constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{writeFileSync(fd,JSON.stringify(data));fsyncSync(fd)}
 finally{closeSync(fd)}
 if(process.platform!=='win32'){
  const f=openSync(folder,constants.O_RDONLY);
  try{fsyncSync(f)}finally{closeSync(f)}
 }
}
const KEYS=['schema','sessionId','summaryDigest','sourceCount',
 'compatibleCount','pendingSources','sourceStates',
 'recordedAtMs','customerDelivery','sourceActivated',
 'productionAcceptance','recordDigest'];
function validateRecord(x){
 if(!exact(x,KEYS)||x.schema!=='rosevear.comms.ql485.private-report.v1'||
  !ID.test(x.sessionId??'')||!HEX.test(x.summaryDigest??'')||
  x.sourceCount!==6||!Number.isSafeInteger(x.compatibleCount)||
  x.compatibleCount<0||x.compatibleCount>6||
  !Array.isArray(x.pendingSources)||
  x.pendingSources.some(id=>!QL485_SOURCE_IDS.includes(id))||
  !x.sourceStates||typeof x.sourceStates!=='object'||
  Object.keys(x.sourceStates).sort().join('|')!==QL485_SOURCE_IDS.join('|')||
  Object.entries(x.sourceStates).some(([id,e])=>
   !QL485_SOURCE_IDS.includes(id)||
   !exact(e,['state','noticeDigest','sourceRevision'])||
   typeof e.state!=='string'||e.state.length>100||
   !(e.noticeDigest===null||HEX.test(e.noticeDigest))||
   !(e.sourceRevision===null||/^[a-f0-9]{40}$/.test(e.sourceRevision)))||
  !Number.isSafeInteger(x.recordedAtMs)||x.recordedAtMs<=0||
  x.customerDelivery!==false||x.sourceActivated!==false||
  x.productionAcceptance!==false||!HEX.test(x.recordDigest??''))
  return false;
 const {recordDigest,...unsigned}=x;
 return recordDigest===hash(unsigned);
}
export function createQl485PrivateContractReviewLedger({directory:folderPath}={}){
 const folder=directory(folderPath);
 const filename=id=>join(folder,hash(['ql485',id])+'.json');
 function read(sessionId){
  if(!ID.test(sessionId??''))return hold('QL485_INVALID_PRIVATE_SESSION_ID');
  try{
   const stored=readPrivate(filename(sessionId));
   if(!stored)return hold('QL485_PRIVATE_RECONCILIATION_NOT_FOUND');
   if(!validateRecord(stored)||stored.sessionId!==sessionId)
    return hold('QL485_PRIVATE_RECONCILIATION_TAMPERED');
   return {state:'DURABLE_PRIVATE_CONTRACT_READBACK_HELD',
    sessionId,summaryDigest:stored.summaryDigest,
    compatibleCount:stored.compatibleCount,
    pendingSources:stored.pendingSources,sourceStates:stored.sourceStates,
    sourceAuthorized:false,productionAcceptance:false,
    customerDelivery:false,automaticMerge:false};
  }catch{return hold('QL485_PRIVATE_LEDGER_UNSAFE_OR_UNREADABLE')}
 }
 function commit({sessionId,packets,pins,nowMs=Date.now()}={}){
  if(!ID.test(sessionId??'')||!Number.isSafeInteger(nowMs)||
   !packets||!pins)return hold('QL485_PRIVATE_REVIEW_INPUT_REQUIRED');
  const report=negotiateQl485SixSources({packets,pins,nowMs});
  const sourceStates=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[
   id,{state:report.results[id].state,
    noticeDigest:report.results[id].noticeDigest??null,
    sourceRevision:report.results[id].sourceRevision??null}]));
  const unsigned={schema:'rosevear.comms.ql485.private-report.v1',
   sessionId,summaryDigest:report.summaryDigest,sourceCount:6,
   compatibleCount:report.compatibleCount,
   pendingSources:report.pendingSources,sourceStates,
   recordedAtMs:nowMs,customerDelivery:false,sourceActivated:false,
   productionAcceptance:false};
  const record={...unsigned,recordDigest:hash(unsigned)};
  try{
   const old=readPrivate(filename(sessionId));
   if(old){
    if(!validateRecord(old)||old.recordDigest!==record.recordDigest)
     return hold('QL485_SESSION_ID_REUSE_OR_REPORT_CHANGED');
    return {...read(sessionId),state:'DURABLE_PRIVATE_REPORT_REPLAY_HELD'};
   }
   writePrivate(folder,filename(sessionId),record);
   const saved=read(sessionId);
   return saved.state==='DURABLE_PRIVATE_CONTRACT_READBACK_HELD'?
    {...saved,state:'DURABLE_SIGNED_CONTRACT_REPORT_COMMITTED_HELD'}:saved;
  }catch{return hold('QL485_PRIVATE_REPORT_WRITE_FAILED')}
 }
 return Object.freeze({commit,read,publicRoute:false,
  automaticDispatch:false,sourceConnect:false});
}
