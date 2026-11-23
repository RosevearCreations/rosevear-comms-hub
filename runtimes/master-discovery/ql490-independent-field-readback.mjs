/**
 * QL-490 independent metadata-only private field receipt readback and signed
 * exception aging. Re-parses QL489 custody independently, compares QL486
 * registry readback and does not claim to reverify archived signer envelopes.
 * No network, source effects, public route, customer or credential reads.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {openSync,closeSync,readFileSync,fstatSync,lstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {canonicalize} from './manifest.mjs';

export const QL490_EXCEPTION_OPEN_SCHEMA='rosevear.comms.ql490.signed-exception-open.v1';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/,
 REASON=/^[A-Z][A-Z0-9_]{4,63}$/;
const CAPTURE=['kind','sequence','previousDigest','sourceId','receiptDigest',
 'registryDigest','witnessDigest','endpointFingerprint','bundleDigest','recordedAtMs','recordDigest'];
const CLOSED=['kind','sequence','previousDigest','sourceId','caseId','captureRecordDigest',
 'operatorDigest','reviewerDigest','reasonCode','recordedAtMs','recordDigest'];
const OPEN=['schema','caseId','sourceId','captureRecordDigest','reasonCode','operatorId',
 'openedAtMs','deadlineAtMs','customerDataIncluded','authorityTransfer'];
const exact=(o,k)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,fieldCertified:false,
 originalWindowsPhysicallyCertified:false,automaticRecovery:false,customerWrites:false});
const anchored=(dir)=>{
 if(typeof dir!=='string'||!isAbsolute(dir)||dir.split(/[\\/]/).includes('..'))
  throw Error('QL490_PRIVATE_DIRECTORY_REQUIRED');
 const d=resolve(dir),s=lstatSync(d);
 if(!s.isDirectory()||s.isSymbolicLink()||
  (process.platform!=='win32'&&(s.mode&0o077)))throw Error('QL490_PRIVATE_DIRECTORY_UNSAFE');
 return d;
};
function independentRows(dir){
 const path=join(anchored(dir),'ql489-capture-exceptions.ndjson');
 let fd;
 try{
  try{
   const st=lstatSync(path);
   if(!st.isFile()||st.isSymbolicLink())throw Error('QL490_CUSTODY_FILE_UNSAFE');
  }catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size<1||st.size>2000000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL490_CUSTODY_FILE_PERMISSION_OR_SIZE_HOLD');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n'))throw Error('QL490_TRUNCATED_CUSTODY_CHAIN');
  const rows=raw.trimEnd().split('\n').map(s=>JSON.parse(s));
  if(rows.length>256)throw Error('QL490_CUSTODY_CAPACITY_HOLD');
  let previous=null,previousAt=0;
  const captures=new Set(),cases=new Set();
  for(const [index,r] of rows.entries()){
   const keys=r.kind==='CAPTURE'?CAPTURE:r.kind==='EXCEPTION_CLOSURE'?CLOSED:null;
   if(!keys||!exact(r,keys)||r.sequence!==index+1||
    r.previousDigest!==previous||!QL485_SOURCE_IDS.includes(r.sourceId)||
    !Number.isSafeInteger(r.recordedAtMs)||r.recordedAtMs<previousAt||
    !HEX.test(r.recordDigest??'')||
    hash(Object.fromEntries(keys.filter(k=>k!=='recordDigest').map(k=>[k,r[k]])))!==r.recordDigest)
    throw Error('QL490_INDEPENDENT_CUSTODY_DIGEST_OR_SEQUENCE_HOLD');
   if(r.kind==='CAPTURE'){
    if(![r.receiptDigest,r.registryDigest,r.witnessDigest,r.endpointFingerprint,
      r.bundleDigest].every(v=>HEX.test(v??''))||
      captures.has(r.recordDigest))throw Error('QL490_CAPTURE_SCOPE_HOLD');
    captures.add(r.recordDigest);
   }else{
    const key=r.sourceId+':'+r.caseId;
    if(!ID.test(r.caseId??'')||!REASON.test(r.reasonCode??'')||
     ![r.captureRecordDigest,r.operatorDigest,r.reviewerDigest].every(v=>HEX.test(v??''))||
     cases.has(key)||!rows.slice(0,index).some(x=>x.kind==='CAPTURE'&&
      x.sourceId===r.sourceId&&x.recordDigest===r.captureRecordDigest&&
      x.recordedAtMs<=r.recordedAtMs))
     throw Error('QL490_CROSS_SOURCE_EXCEPTION_OR_DUPLICATE_HOLD');
    cases.add(key);
   }
   previous=r.recordDigest;previousAt=r.recordedAtMs;
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
function verifiedOpen(packet,pem,at){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,OPEN)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const p=packet.payload,key=createPublicKey(pem),
   sig=Buffer.from(packet.signature,'base64url');
  return key.asymmetricKeyType==='ed25519'&&sig.length===64&&
   sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(p)),key,sig)&&
   p.schema===QL490_EXCEPTION_OPEN_SCHEMA&&ID.test(p.caseId??'')&&
   ID.test(p.operatorId??'')&&QL485_SOURCE_IDS.includes(p.sourceId)&&
   HEX.test(p.captureRecordDigest??'')&&REASON.test(p.reasonCode??'')&&
   Number.isSafeInteger(p.openedAtMs)&&p.openedAtMs>0&&p.openedAtMs<=at&&
   Number.isSafeInteger(p.deadlineAtMs)&&p.deadlineAtMs>=p.openedAtMs&&
   p.deadlineAtMs-p.openedAtMs<=7*86400000&&
   p.customerDataIncluded===false&&p.authorityTransfer===false;
 }catch{return false}
}
/**
 * Explicit signed OPEN packets are necessary to age open exceptions.
 * A lone signed capture is not automatically an exception.
 */
export function readQl490PrivateFieldEvidence({evidenceDirectory,registry,journal,
 exceptionPins,openCasePackets=[],nowMs=Date.now(),receiptMaxAgeMs=86400000}={}){
 if(!Number.isSafeInteger(nowMs)||nowMs<=0||
  !Number.isSafeInteger(receiptMaxAgeMs)||receiptMaxAgeMs<60000||
  receiptMaxAgeMs>7*86400000||!Array.isArray(openCasePackets)||
  openCasePackets.length>128||typeof registry?.summary!=='function'||
  typeof journal?.summary!=='function')
  return hold('QL490_READ_ONLY_SCOPE_AND_BOUNDED_AGE_REQUIRED');
 let rows,stored,snapshot;
 try{rows=independentRows(evidenceDirectory);
  stored=journal.summary();snapshot=registry.summary();
 }catch{return hold('QL490_INDEPENDENT_CUSTODY_UNREADABLE_OR_TAMPERED')}
 if(stored?.state!=='PRIVATE_Ql489_EVIDENCE_HELD'||
  stored.records!==rows.length||
  stored.lastDigest!==(rows.at(-1)?.recordDigest??null)||
  snapshot?.state!=='PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD'||
  snapshot.sourceCount!==6||!HEX.test(snapshot.registryDigest??'')||
  QL485_SOURCE_IDS.some(id=>!snapshot.sources?.[id]))
  return hold('QL490_Ql489_Ql486_INDEPENDENT_READBACK_DISAGREES');
 if(!exact(exceptionPins,QL485_SOURCE_IDS))return hold('QL490_SIX_SOURCE_EXCEPTION_PINS_REQUIRED');
 const sources={},captures=rows.filter(x=>x.kind==='CAPTURE'),
  closed=rows.filter(x=>x.kind==='EXCEPTION_CLOSURE');
 for(const id of QL485_SOURCE_IDS){
  const cap=captures.filter(x=>x.sourceId===id).at(-1),
   reg=snapshot.sources[id];
  let state='SOURCE_CAPTURE_NOT_ENROLLED_HOLD';
  if(cap){
   state=reg.state==='PRIVATE_SOURCE_ATTESTATION_TAMPER_HOLD'?
    'REGISTRY_SOURCE_TAMPER_HOLD':
    reg.evidenceDigest!==cap.receiptDigest||!Number.isSafeInteger(reg.attestationCount)||
    reg.attestationCount<1?'SOURCE_REGISTRY_RECEIPT_MISMATCH_HOLD':
    cap.recordedAtMs>nowMs||nowMs-cap.recordedAtMs>receiptMaxAgeMs?
    'CAPTURE_METADATA_AGED_REVIEW_HOLD':'SOURCE_RECEIPT_DIGEST_MATCH_HELD';
  }
  sources[id]={state,sourceId:id,captureCount:cap?
   captures.filter(x=>x.sourceId===id).length:0,
   lastCaptureDigest:cap?.recordDigest??null,
   registryReceiptDigest:reg.evidenceDigest??null,
   ageMs:cap&&cap.recordedAtMs<=nowMs?nowMs-cap.recordedAtMs:null,
   originalRuntimePhysicallyVerified:false,signerPacketsReverified:false,
   sourceAuthority:false};
 }
 const cases=[],seen=new Set();
 for(const packet of openCasePackets){
  const p=packet?.payload,id=p?.sourceId;
  const pem=exceptionPins[id]?.operatorPublicKeyPem;
  if(!verifiedOpen(packet,pem,nowMs))
   return hold('QL490_OPEN_EXCEPTION_OPERATOR_SIGNATURE_REQUIRED');
  if(seen.has(p.caseId))return hold('QL490_DUPLICATE_CASE_ID_HOLD');
  seen.add(p.caseId);
  const cap=captures.find(c=>c.sourceId===id&&c.recordDigest===p.captureRecordDigest);
  if(!cap||p.openedAtMs<cap.recordedAtMs)
   return hold('QL490_CASE_NOT_BOUND_TO_EXISTING_CAPTURE');
  const closures=closed.filter(c=>c.caseId===p.caseId&&c.sourceId===id);
  if(closures.length>1||closures.some(c=>
    c.captureRecordDigest!==p.captureRecordDigest||
    c.reasonCode!==p.reasonCode||c.recordedAtMs<p.openedAtMs))
   return hold('QL490_EXCEPTION_CLOSURE_CONFLICT_HOLD');
  const closure=closures[0];
  cases.push({caseId:p.caseId,sourceId:id,reasonCode:p.reasonCode,
   status:closure?'CLOSED_REVIEW_ONLY_HELD':
    nowMs>p.deadlineAtMs?'OVERDUE_OPERATOR_REVIEW_HOLD':'OPEN_OPERATOR_REVIEW_HOLD',
   ageMs:nowMs-p.openedAtMs,deadlineAtMs:p.deadlineAtMs,
   closureDigest:closure?.recordDigest??null,authorityTransfer:false});
 }
 // Every existing QL489 closure must have a signed OPEN case in this
 // explicitly supplied case set; otherwise age reconciliation is incomplete.
 const knownClosed=closed.filter(c=>cases.some(k=>
  k.caseId===c.caseId&&k.sourceId===c.sourceId&&
  k.closureDigest===c.recordDigest));
 const unmatchedClosures=closed.length-knownClosed.length;
 const complete=unmatchedClosures===0;
 const sourceMatchCount=QL485_SOURCE_IDS.filter(id=>
  sources[id].state==='SOURCE_RECEIPT_DIGEST_MATCH_HELD').length;
 const result={state:'PRIVATE_SIX_SOURCE_READBACK_HELD',sources,
  sourceMatchCount,sourceCount:6,caseCount:cases.length,cases,
  unmatchedClosures,caseInventoryComplete:complete,
  journalHead:rows.at(-1)?.recordDigest??null,
  registryDigest:snapshot.registryDigest,reviewedAtMs:nowMs,
  allSourcesMetadataCurrent:sourceMatchCount===6,
  originalWindowsPhysicallyCertified:false,signerPacketsReverified:false,
  productionAcceptance:false,autoRecovery:false,customerWrites:false,
  sourceAuthority:false};
 // Approval identity must be stable across process restarts and clock changes.
 // Age/status remain visible in the report, but are not signed evidence bytes.
 const immutableEvidence={
  journalHead:result.journalHead,registryDigest:result.registryDigest,
  sourceReceipts:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
   captureDigest:sources[id].lastCaptureDigest,
   receiptDigest:sources[id].registryReceiptDigest
  }])),
  signedCasePacketDigests:openCasePackets.map(p=>hash(p)).sort()
 };
 return Object.freeze({...result,readbackDigest:hash(immutableEvidence)});
}
