/**
 * QL-491 independent QL490 private drill log rehash and trend readback.
 * SIMULATED_NO_SEND_HELD is not actual restore; trends are not an SLA, alarm,
 * physical host attestation, operational recovery or production certification.
 */
import {createHash} from 'node:crypto';
import {openSync,closeSync,lstatSync,fstatSync,readFileSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {canonicalize} from './manifest.mjs';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const FIELDS=['sequence','previousDigest','drillId','sourceId','readbackDigest',
 'ownerDigest','reviewerDigest','outcome','recordedAtMs','recordDigest'];
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(y=>Object.hasOwn(o,y));
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,realRestoresPerformed:0,
 fieldProofCertified:false,customerWrites:false,automaticRecovery:false});
function readRows(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))
  throw Error('QL491_PRIVATE_ABSOLUTE_TREND_DIRECTORY_REQUIRED');
 const dir=resolve(directory),st=lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL491_PRIVATE_DRILL_DIRECTORY_UNSAFE');
 const path=join(dir,'ql490-recovery-drills.ndjson');
 let fd;
 try{
  try{const f=lstatSync(path);if(!f.isFile()||f.isSymbolicLink())
   throw Error('QL491_DRILL_LOG_LINK_OR_TYPE_DENIED')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const file=fstatSync(fd);
  if(!file.isFile()||file.size<1||file.size>1000000||
   (process.platform!=='win32'&&(file.mode&0o077)))
   throw Error('QL491_DRILL_LOG_PERMISSION_OR_SIZE_HOLD');
  const data=readFileSync(fd,'utf8');
  if(!data.endsWith('\n'))throw Error('QL491_DRILL_LOG_TRUNCATED');
  const rows=data.trimEnd().split('\n').map(s=>JSON.parse(s));
  if(rows.length>128)throw Error('QL491_DRILL_LOG_CAPACITY');
  let previous=null,prevTime=0;
  const ids=new Set();
  for(const [i,r] of rows.entries()){
   if(!exact(r,FIELDS)||r.sequence!==i+1||r.previousDigest!==previous||
    !ID.test(r.drillId??'')||ids.has(r.drillId)||
    !QL485_SOURCE_IDS.includes(r.sourceId)||
    ![r.readbackDigest,r.ownerDigest,r.reviewerDigest,r.recordDigest].every(x=>HEX.test(x??''))||
    r.outcome!=='SIMULATED_NO_SEND_HELD'||!Number.isSafeInteger(r.recordedAtMs)||
    r.recordedAtMs<=0||r.recordedAtMs<prevTime||
    hash(Object.fromEntries(FIELDS.filter(k=>k!=='recordDigest').map(k=>[k,r[k]])))!==r.recordDigest)
    throw Error('QL491_INDEPENDENT_DRILL_CHAIN_OR_REPLAY_TAMPER');
   ids.add(r.drillId);previous=r.recordDigest;prevTime=r.recordedAtMs;
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
/** Read only; checks durable journal self-readback independently. */
export function readQl491DrillTrends({directory,drillJournal,
 nowMs=Date.now()}={}){
 if(!Number.isSafeInteger(nowMs)||nowMs<=0||
  typeof drillJournal?.summary!=='function')
  return hold('QL491_PRIVATE_DRILL_JOURNAL_REQUIRED');
 let rows,snap;
 try{rows=readRows(directory);snap=drillJournal.summary()}
 catch{return hold('QL491_INDEPENDENT_DRILL_LOG_UNAVAILABLE_OR_TAMPERED')}
 if(snap?.state!=='PRIVATE_Ql490_DRILL_JOURNAL_HELD'||
  snap.drillCount!==rows.length||snap.lastDigest!==(rows.at(-1)?.recordDigest??null)||
  rows.some(x=>x.recordedAtMs>nowMs))
  return hold('QL491_INDEPENDENT_DRILL_CUSTODY_OR_TIME_MISMATCH');
 const DAY=86400000,week=7*DAY,month=30*DAY;
 let recent7=0,previous7=0,recent30=0;
 const sources=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
  rehearsalsAllTime:0,rehearsalsLast7Days:0,
  lastRecordedAtMs:null,realRestoresPerformed:0}]));
 for(const r of rows){
  const age=nowMs-r.recordedAtMs,s=sources[r.sourceId];
  s.rehearsalsAllTime++;
  s.lastRecordedAtMs=r.recordedAtMs;
  if(age<=week){recent7++;s.rehearsalsLast7Days++}
  else if(age<=2*week)previous7++;
  if(age<=month)recent30++;
 }
 const outcome={
  state:'PRIVATE_INDEPENDENT_NO_SEND_DRILL_TRENDS_HELD',sourceCount:6,
  totalSignedNoSendDrills:rows.length,last7Days:recent7,
  previous7Days:previous7,last30Days:recent30,
  sevenDayChange:recent7-previous7,
  sevenDayTrend:rows.length===0?'INSUFFICIENT_RECEIPTS_HOLD':
   recent7>previous7?'MORE_REHEARSALS_NOT_MORE_RECOVERIES':
   recent7<previous7?'FEWER_REHEARSALS_NOT_FEWER_INCIDENTS':
    'UNCHANGED_REHEARSAL_COUNT_ONLY',
  sources,drillJournalHead:rows.at(-1)?.recordDigest??null,
  reviewedAtMs:nowMs,realRestoresPerformed:0,
  originalHostPhysicallyCertified:false,
  evidenceOfLiveSourceRecovery:false,customerWrites:false,
  automaticRecovery:false,fieldProofCertified:false};
 // Stable head identity for a future signed review, never dynamic percentages.
 return Object.freeze({...outcome,trendEvidenceDigest:hash({
  journalHead:outcome.drillJournalHead,total:outcome.totalSignedNoSendDrills,
  sources:QL485_SOURCE_IDS.map(id=>[id,sources[id].rehearsalsAllTime])
 })});
}
