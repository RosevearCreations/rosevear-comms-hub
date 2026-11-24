/**
 * QL-492 independently verifies QL-491 private follow-up custody, accepts
 * two-person signed claims of field proof FOR REVIEW ONLY, and records
 * due-date escalations without notifying, connecting or certifying a source.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {lstatSync,openSync,fstatSync,closeSync,readFileSync,writeFileSync,
 fsyncSync,unlinkSync,constants,mkdirSync} from 'node:fs';
import {join,resolve,isAbsolute} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';

export const QL492_PROOF_SCHEMA='rosevear.comms.ql492.independent-field-proof-intake.v1';
export const QL492_DUE_SCHEMA='rosevear.comms.ql492.signed-proof-due-escalation.v1';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const hash=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const validTime=x=>Number.isSafeInteger(x)&&x>0;
const hold=reason=>({state:'HOLD',reason,fieldCertified:false,
 masterDelivery:false,sourceAuthorized:false,customerWrites:false,automaticEscalation:false});
const INTAKE_491=['kind','sequence','previousDigest','readbackDigest','inventoryDigest',
 'snapshotDigest','caseCount','openCount','overdueCount','closedCount',
 'unmatchedClosures','sourceHoldCount','recordedAtMs','recordDigest'];
const FOLLOW_491=['kind','sequence','previousDigest','requestId','sourceId',
 'readbackDigest','captureDigest','ownerPacketDigest','reviewerPacketDigest',
 'reviewDeadlineAtMs','recordedAtMs','recordDigest'];
const PROOF_PAYLOAD=['schema','receiptId','requestId','sourceId','followupRecordDigest',
 'readbackDigest','captureDigest','observedEvidenceDigest','observedAtMs',
 'disposition','role','actorId','issuedAtMs','expiresAtMs',
 'physicalCertificationClaimed','customerDataIncluded','authorityTransfer'];
const DUE_PAYLOAD=['schema','escalationId','requestId','sourceId','followupRecordDigest',
 'reviewDeadlineAtMs','proofReceiptDigest','requestedAction','role','actorId',
 'issuedAtMs','expiresAtMs','customerDataIncluded','authorityTransfer'];
const PROOF_ROW=['kind','sequence','previousDigest','receiptId','requestId','sourceId',
 'followupRecordDigest','readbackDigest','captureDigest','observedEvidenceDigest',
 'ownerPacketDigest','reviewerPacketDigest','recordedAtMs','recordDigest'];
const DUE_ROW=['kind','sequence','previousDigest','escalationId','requestId','sourceId',
 'followupRecordDigest','reviewDeadlineAtMs','proofReceiptDigest',
 'ownerPacketDigest','reviewerPacketDigest','recordedAtMs','recordDigest'];
function privateDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))throw Error('QL492_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const p=resolve(directory);mkdirSync(p,{recursive:true,mode:0o700});
 const st=lstatSync(p);
 if(!st.isDirectory()||st.isSymbolicLink()||
   (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL492_PRIVATE_DIRECTORY_UNSAFE');
 return p;
}
function readNdjson(directory,name,limit=256){
 const p=join(directory,name);let fd;
 try{
  try{let st=lstatSync(p);if(!st.isFile()||st.isSymbolicLink())
   throw Error('QL492_PRIVATE_LOG_LINK_OR_TYPE_DENIED')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(p,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size<1||st.size>2000000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL492_PRIVATE_LOG_PERMISSIONS_OR_SIZE_HOLD');
  const data=readFileSync(fd,'utf8');
  if(!data.endsWith('\n'))throw Error('QL492_TRUNCATED_PRIVATE_LOG');
  const rows=data.trimEnd().split('\n').map(x=>JSON.parse(x));
  if(rows.length>limit)throw Error('QL492_PRIVATE_LOG_CAPACITY');
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
function verifyChain(rows,fieldsFor){
 let prior=null,ts=0;
 for(let i=0;i<rows.length;i++){
  const r=rows[i],fields=fieldsFor(r);
  if(!fields||!exact(r,fields)||r.sequence!==i+1||
   r.previousDigest!==prior||!validTime(r.recordedAtMs)||
   r.recordedAtMs<ts||!HEX.test(r.recordDigest??'')||
   hash(Object.fromEntries(fields.filter(k=>k!=='recordDigest')
    .map(k=>[k,r[k]])))!==r.recordDigest)
   throw Error('QL492_INDEPENDENT_HASH_CHAIN_TAMPER');
  prior=r.recordDigest;ts=r.recordedAtMs;
 }
 return prior;
}
function readPriorFollowups(directory,ql491Journal){
 const rows=readNdjson(directory,'ql491-intake-field-followups.ndjson');
 const head=verifyChain(rows,r=>r.kind==='INTAKE_REVIEW'?INTAKE_491:
   r.kind==='FIELD_PROOF_FOLLOWUP'?FOLLOW_491:null);
 const previous=new Set(),ids=new Set();
 for(const [i,r] of rows.entries()){
  if(r.kind==='INTAKE_REVIEW'){
   if(![r.readbackDigest,r.inventoryDigest,r.snapshotDigest].every(x=>HEX.test(x??''))||
    ![r.caseCount,r.openCount,r.overdueCount,r.closedCount,r.unmatchedClosures,
     r.sourceHoldCount].every(x=>Number.isSafeInteger(x)&&x>=0&&x<=256)||
    r.caseCount!==r.openCount+r.overdueCount+r.closedCount)
    throw Error('QL492_PRIOR_INTAKE_COUNTS_TAMPER');
   previous.add(r.readbackDigest);
  }else{
   if(!ID.test(r.requestId??'')||ids.has(r.requestId)||
    !QL485_SOURCE_IDS.includes(r.sourceId)||!HEX.test(r.readbackDigest??'')||
    ![r.ownerPacketDigest,r.reviewerPacketDigest].every(x=>HEX.test(x??''))||
    !(r.captureDigest===null||HEX.test(r.captureDigest??''))||
    !validTime(r.reviewDeadlineAtMs)||r.reviewDeadlineAtMs<=r.recordedAtMs||
    !previous.has(r.readbackDigest))
    throw Error('QL492_PRIOR_FOLLOWUP_SCOPE_OR_REPLAY_TAMPER');
   ids.add(r.requestId);
  }
 }
 const snap=ql491Journal?.summary?.();
 if(snap?.state!=='PRIVATE_Ql491_RECONCILIATION_HELD'||
  snap.records!==rows.length||snap.latestDigest!==head||
  snap.intakeReviews!==rows.filter(x=>x.kind==='INTAKE_REVIEW').length||
  snap.followupRequests!==ids.size)
  throw Error('QL492_PRIOR_JOURNAL_DISAGREES_WITH_INDEPENDENT_READBACK');
 return {rows,head,followups:rows.filter(x=>x.kind==='FIELD_PROOF_FOLLOWUP')};
}
function verifyPacket(packet,pem,role,at,kind){
 try{
  const fields=kind==='proof'?PROOF_PAYLOAD:DUE_PAYLOAD;
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,fields)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const p=packet.payload,k=createPublicKey(pem),sig=Buffer.from(packet.signature,'base64url');
  if(k.asymmetricKeyType!=='ed25519'||sig.length!==64||
   sig.toString('base64url')!==packet.signature||
   !verify(null,Buffer.from(canonicalize(p)),k,sig)||
   p.role!==role||!ID.test(p.actorId??'')||!ID.test(p.requestId??'')||
   !QL485_SOURCE_IDS.includes(p.sourceId)||
   !HEX.test(p.followupRecordDigest??'')||
   !validTime(p.issuedAtMs)||p.issuedAtMs>at||at-p.issuedAtMs>120000||
   !validTime(p.expiresAtMs)||p.expiresAtMs<=at||
   p.expiresAtMs-p.issuedAtMs>300000||
   p.customerDataIncluded!==false||p.authorityTransfer!==false)return false;
  if(kind==='proof')return p.schema===QL492_PROOF_SCHEMA&&
   ID.test(p.receiptId??'')&&HEX.test(p.readbackDigest??'')&&
   (p.captureDigest===null||HEX.test(p.captureDigest??''))&&
   HEX.test(p.observedEvidenceDigest??'')&&validTime(p.observedAtMs)&&
   p.observedAtMs<=at&&p.observedAtMs<=p.issuedAtMs&&
   p.disposition==='SUBMITTED_FOR_INDEPENDENT_REVIEW_ONLY'&&
   p.physicalCertificationClaimed===false;
  return p.schema===QL492_DUE_SCHEMA&&ID.test(p.escalationId??'')&&
   validTime(p.reviewDeadlineAtMs)&&p.reviewDeadlineAtMs<=at&&
   (p.proofReceiptDigest===null||HEX.test(p.proofReceiptDigest??''))&&
   p.requestedAction==='ESCALATE_DUE_FOR_MANUAL_REVIEW_NO_SEND';
 }catch{return false}
}
function matchingPackets(ownerPacket,reviewerPacket,trust,now,kind){
 const op=ownerPacket?.payload,rp=reviewerPacket?.payload;
 if(!op||!rp||!trust||typeof trust.operatorPublicKeyPem!=='string'||
  typeof trust.reviewerPublicKeyPem!=='string'||
  trust.operatorPublicKeyPem===trust.reviewerPublicKeyPem||
  !verifyPacket(ownerPacket,trust.operatorPublicKeyPem,'owner',now,kind)||
  !verifyPacket(reviewerPacket,trust.reviewerPublicKeyPem,'independent-reviewer',now,kind)||
  op.actorId===rp.actorId)return false;
 const compareKeys=kind==='proof'?
  ['receiptId','requestId','sourceId','followupRecordDigest','readbackDigest',
   'captureDigest','observedEvidenceDigest','observedAtMs','disposition']:
  ['escalationId','requestId','sourceId','followupRecordDigest',
   'reviewDeadlineAtMs','proofReceiptDigest','requestedAction'];
 return compareKeys.every(k=>op[k]===rp[k]);
}
function readOwnRows(dir){
 const rows=readNdjson(dir,'ql492-witness-due-audit.ndjson');
 const head=verifyChain(rows,r=>r.kind==='WITNESS_INTAKE'?PROOF_ROW:
   r.kind==='DUE_ESCALATION'?DUE_ROW:null);
 const proofIds=new Set(),dueIds=new Set(),escalatedRequests=new Set();
 for(const r of rows){
  if(!ID.test(r.requestId??'')||!QL485_SOURCE_IDS.includes(r.sourceId)||
   !HEX.test(r.followupRecordDigest??'')||
   ![r.ownerPacketDigest,r.reviewerPacketDigest].every(x=>HEX.test(x??'')))
   throw Error('QL492_REVIEW_JOURNAL_SCOPE_TAMPER');
  if(r.kind==='WITNESS_INTAKE'){
   if(!ID.test(r.receiptId??'')||proofIds.has(r.receiptId)||
    ![r.readbackDigest,r.observedEvidenceDigest].every(x=>HEX.test(x??''))||
    !(r.captureDigest===null||HEX.test(r.captureDigest??'')))
    throw Error('QL492_DUPLICATE_OR_WRONG_PROOF_RECEIPT');
   proofIds.add(r.receiptId);
  }else{
   if(!ID.test(r.escalationId??'')||dueIds.has(r.escalationId)||
    escalatedRequests.has(r.requestId)||!validTime(r.reviewDeadlineAtMs)||
    r.recordedAtMs<r.reviewDeadlineAtMs||
    !(r.proofReceiptDigest===null||HEX.test(r.proofReceiptDigest??'')))
    throw Error('QL492_DUPLICATE_OR_PREMATURE_DUE_ESCALATION');
   dueIds.add(r.escalationId);escalatedRequests.add(r.requestId);
  }
 }
 return {rows,head};
}
export function createQl492PrivateWitnessLedger({directory,now=()=>Date.now()}={}){
 const dir=privateDir(directory),file=join(dir,'ql492-witness-due-audit.ndjson'),
  lock=join(dir,'.ql492-witness-due-audit.lock');
 function append(kind,body){
  let fd;
  try{fd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL492_EXCLUSIVE_WRITER_REQUIRED')}
  try{
   const before=readOwnRows(dir);
   if(before.rows.length>=256)return hold('QL492_PRIVATE_JOURNAL_CAPACITY');
   if(kind==='WITNESS_INTAKE'&&before.rows.some(r=>
    r.kind==='WITNESS_INTAKE'&&(r.receiptId===body.receiptId||
    r.requestId===body.requestId)))
    return hold('QL492_FIELD_PROOF_REPLAY_OR_REQUEST_ALREADY_REVIEWED');
   if(kind==='DUE_ESCALATION'&&before.rows.some(r=>
    r.kind==='DUE_ESCALATION'&&(r.escalationId===body.escalationId||
    r.requestId===body.requestId)))
    return hold('QL492_SIGNED_DUE_ESCALATION_REPLAY');
   const base={kind,sequence:before.rows.length+1,previousDigest:before.head,
    ...body,recordedAtMs:now()};
   const record={...base,recordDigest:hash(base)};
   const out=openSync(file,constants.O_WRONLY|constants.O_APPEND|
    (constants.O_NOFOLLOW||0)|(before.rows.length===0?
     constants.O_CREAT|constants.O_EXCL:0),0o600);
   try{writeFileSync(out,JSON.stringify(record)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   const after=readOwnRows(dir);
   if(after.head!==record.recordDigest||after.rows.length!==before.rows.length+1)
    return hold('QL492_PRIVATE_JOURNAL_FSYNC_READBACK_MISMATCH');
   return {state:kind==='WITNESS_INTAKE'?
    'DURABLE_SIGNED_FIELD_CLAIM_FOR_REVIEW_HELD':'DURABLE_SIGNED_DUE_ESCALATION_NO_SEND_HELD',
    recordDigest:record.recordDigest,sequence:record.sequence,
    fieldCertified:false,customerWrites:false};
  }catch{return hold('QL492_PRIVATE_JOURNAL_WRITE_OR_TAMPER_HOLD')}
  finally{closeSync(fd);try{unlinkSync(lock)}catch{}}
 }
 const summary=()=>{
  try{const {rows,head}=readOwnRows(dir);
   return {state:'PRIVATE_Ql492_WITNESS_AND_DUE_LEDGER_HELD',records:rows.length,
    lastDigest:head,witnessClaims:rows.filter(x=>x.kind==='WITNESS_INTAKE').length,
    manualDueEscalations:rows.filter(x=>x.kind==='DUE_ESCALATION').length,
    fieldCertified:false,masterDelivery:false,customerWrites:false};
  }catch{return hold('QL492_PRIVATE_LEDGER_TAMPER_HOLD')}
 };
 return Object.freeze({appendProof:body=>append('WITNESS_INTAKE',body),
  appendDue:body=>append('DUE_ESCALATION',body),summary,
  automaticEscalation:false,customerWrites:false,publicRoute:false});
}
export function createQl492FieldReview({directory,ql491Journal,ql492Ledger,exceptionPins,
 now=()=>Date.now()}={}){
 if(typeof ql491Journal?.summary!=='function'||
  typeof ql492Ledger?.appendProof!=='function'||typeof ql492Ledger?.appendDue!=='function'||
  typeof ql492Ledger?.summary!=='function')
  throw Error('QL492_PRIOR_PRIVATE_JOURNAL_AND_NEW_CUSTODY_REQUIRED');
 const dir=privateDir(directory);
 function sourceContext(){
  const prior=readPriorFollowups(dir,ql491Journal),own=readOwnRows(dir),
   snap=ql492Ledger.summary();
  if(snap.state!=='PRIVATE_Ql492_WITNESS_AND_DUE_LEDGER_HELD'||
   snap.records!==own.rows.length||snap.lastDigest!==own.head||
   snap.witnessClaims!==own.rows.filter(x=>x.kind==='WITNESS_INTAKE').length||
   snap.manualDueEscalations!==own.rows.filter(x=>x.kind==='DUE_ESCALATION').length)
   throw Error('QL492_INDEPENDENT_NEW_JOURNAL_DISAGREES');
  for(const r of own.rows){
   const f=prior.followups.find(f=>f.requestId===r.requestId&&
    f.sourceId===r.sourceId&&f.recordDigest===r.followupRecordDigest);
   if(!f||r.kind==='WITNESS_INTAKE'&&(
    r.readbackDigest!==f.readbackDigest||r.captureDigest!==f.captureDigest)||
    r.kind==='DUE_ESCALATION'&&r.reviewDeadlineAtMs!==f.reviewDeadlineAtMs)
    throw Error('QL492_CROSS_JOURNAL_FOLLOWUP_DISAGREES');
  }
  return {prior,own};
 }
 function contextOrHold(){
  try{return sourceContext()}catch{return null}
 }
 function acceptProof({ownerPacket,reviewerPacket}={}){
  const at=now(),op=ownerPacket?.payload,ctx=contextOrHold();
  if(!ctx)return hold('QL492_QL491_PRIOR_CUSTODY_UNVERIFIED');
  if(!QL485_SOURCE_IDS.includes(op?.sourceId)||
   !matchingPackets(ownerPacket,reviewerPacket,exceptionPins?.[op.sourceId],at,'proof'))
   return hold('QL492_TWO_INDEPENDENT_FRESH_SIGNED_PROOF_PACKETS_REQUIRED');
  const follow=ctx.prior.followups.find(r=>r.requestId===op.requestId);
  if(!follow||follow.sourceId!==op.sourceId||
   follow.recordDigest!==op.followupRecordDigest||
   follow.readbackDigest!==op.readbackDigest||
   follow.captureDigest!==op.captureDigest||
   op.observedAtMs<follow.recordedAtMs)
   return hold('QL492_PROOF_NOT_BOUND_TO_REAL_PRIOR_FOLLOWUP');
  if(ctx.own.rows.some(r=>r.kind==='WITNESS_INTAKE'&&
   (r.receiptId===op.receiptId||r.requestId===op.requestId)))
   return hold('QL492_SIGNED_FIELD_PROOF_REPLAY_DENIED');
  const result=ql492Ledger.appendProof({receiptId:op.receiptId,
   requestId:op.requestId,sourceId:op.sourceId,
   followupRecordDigest:follow.recordDigest,readbackDigest:follow.readbackDigest,
   captureDigest:follow.captureDigest,observedEvidenceDigest:op.observedEvidenceDigest,
   ownerPacketDigest:hash(ownerPacket),reviewerPacketDigest:hash(reviewerPacket)});
  if(result.state!=='DURABLE_SIGNED_FIELD_CLAIM_FOR_REVIEW_HELD')
   return hold('QL492_DURABLE_SIGNED_PROOF_CUSTODY_FAILED');
  return {state:'SIGNED_FIELD_WITNESS_CLAIM_INTAKE_HELD',sourceId:op.sourceId,
   requestId:op.requestId,receiptDigest:result.recordDigest,
   submittedForIndependentReview:true,actualWitnessProven:false,
   fieldCertified:false,sourceAuthorized:false,customerWrites:false};
 }
 function escalateDue({ownerPacket,reviewerPacket}={}){
  const at=now(),op=ownerPacket?.payload,ctx=contextOrHold();
  if(!ctx)return hold('QL492_QL491_PRIOR_CUSTODY_UNVERIFIED');
  if(!QL485_SOURCE_IDS.includes(op?.sourceId)||
   !matchingPackets(ownerPacket,reviewerPacket,exceptionPins?.[op.sourceId],at,'due'))
   return hold('QL492_TWO_INDEPENDENT_FRESH_SIGNED_DUE_APPROVALS_REQUIRED');
  const follow=ctx.prior.followups.find(r=>r.requestId===op.requestId);
  if(!follow||follow.sourceId!==op.sourceId||
   follow.recordDigest!==op.followupRecordDigest||
   follow.reviewDeadlineAtMs!==op.reviewDeadlineAtMs||
   at<follow.reviewDeadlineAtMs)
   return hold('QL492_NOT_A_GENUINELY_DUE_FOLLOWUP');
  const proof=ctx.own.rows.find(r=>r.kind==='WITNESS_INTAKE'&&
   r.requestId===op.requestId);
  if(op.proofReceiptDigest!==(proof?.recordDigest??null))
   return hold('QL492_SIGNED_DUE_STALE_PROOF_RECEIPT');
  if(ctx.own.rows.some(r=>r.kind==='DUE_ESCALATION'&&r.requestId===op.requestId))
   return hold('QL492_DUE_ESCALATION_ALREADY_RECORDED');
  const result=ql492Ledger.appendDue({escalationId:op.escalationId,
   requestId:op.requestId,sourceId:op.sourceId,
   followupRecordDigest:follow.recordDigest,
   reviewDeadlineAtMs:follow.reviewDeadlineAtMs,
   proofReceiptDigest:proof?.recordDigest??null,
   ownerPacketDigest:hash(ownerPacket),reviewerPacketDigest:hash(reviewerPacket)});
  if(result.state!=='DURABLE_SIGNED_DUE_ESCALATION_NO_SEND_HELD')
   return hold('QL492_DURABLE_DUE_ESCALATION_CUSTODY_FAILED');
  return {state:'SIGNED_PROOF_DUE_REVIEW_ESCALATION_HELD',requestId:op.requestId,
   sourceId:op.sourceId,escalationDigest:result.recordDigest,
   externalMessageSent:false,automaticEscalation:false,fieldCertified:false};
 }
 function auditReadback(){
  const at=now(),ctx=contextOrHold();
  if(!ctx)return hold('QL492_INDEPENDENT_QL491_OR_QL492_CUSTODY_TAMPER_HOLD');
  if(ctx.prior.rows.some(r=>r.recordedAtMs>at)||
   ctx.own.rows.some(r=>r.recordedAtMs>at))
   return hold('QL492_PRIVATE_JOURNAL_FUTURE_TIMESTAMP_HOLD');
  const sources={};
  for(const id of QL485_SOURCE_IDS){
   const followups=ctx.prior.followups.filter(r=>r.sourceId===id);
   const receipts=ctx.own.rows.filter(r=>r.sourceId===id&&r.kind==='WITNESS_INTAKE');
   const due=ctx.own.rows.filter(r=>r.sourceId===id&&r.kind==='DUE_ESCALATION');
   sources[id]={sourceId:id,followupRequests:followups.length,
    signedClaimsSubmitted:receipts.length,manualDueEscalations:due.length,
    dueForReview:followups.filter(r=>r.reviewDeadlineAtMs<=at&&
     !due.some(x=>x.requestId===r.requestId)).length,
    nextDueAtMs:followups.length?Math.min(...followups.map(x=>x.reviewDeadlineAtMs)):null,
    genuinelyVerifiedSource:false,physicalFieldProofCertified:false};
  }
  const immutable={priorJournalHead:ctx.prior.head,
   ql492JournalHead:ctx.own.head,
   counts:QL485_SOURCE_IDS.map(id=>[id,sources[id].followupRequests,
    sources[id].signedClaimsSubmitted,sources[id].manualDueEscalations])};
  return Object.freeze({state:'PRIVATE_SOURCE_TO_MASTER_AUDIT_READBACK_HELD',
   schema:'rosevear.comms.ql492.private-source-to-master-audit.v1',
   audience:'rosevear-master',transport:'OFFLINE_READ_ONLY_NO_SEND',
   sourceCount:6,sources,priorJournalHead:ctx.prior.head,
   ql492JournalHead:ctx.own.head,auditEvidenceDigest:hash(immutable),
   reviewedAtMs:at,originalSourcesVerified:0,realFieldProofsCertified:0,
   masterAcknowledged:false,masterDelivery:false,automaticEscalation:false,
   customerWrites:false,sourceAuthorized:false});
 }
 return Object.freeze({acceptProof,escalateDue,auditReadback,
  noNetwork:true,masterDelivery:false,sourceAuthority:false});
}
