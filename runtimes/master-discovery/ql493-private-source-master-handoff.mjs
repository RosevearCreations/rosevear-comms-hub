/**
 * QL-493 private, fail-closed source mTLS prerequisite inspection and
 * independently signed OFFLINE source-to-Master audit handoff custody.
 * No provider enrollment, trust-on-first-use, auto probe, send or live ACK.
 */
import {createHash,createPrivateKey,createPublicKey,verify,X509Certificate} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,fstatSync,readFileSync,
 writeFileSync,fsyncSync,unlinkSync,constants} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {canonicalize} from './manifest.mjs';
import {validateQl488Enrollment} from './ql488-original-host-transport.mjs';

export const QL493_HANDOFF_SCHEMA='rosevear.comms.ql493.signed-offline-master-handoff.v1';
export const QL493_ACK_SCHEMA='rosevear.comms.ql493.independent-master-ack-packet.v1';
const HEX=/^[0-9a-f]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(f=>Object.hasOwn(o,f));
const hold=reason=>({state:'HOLD',reason,realSourceConnected:false,
 sourceApproved:false,masterDelivered:false,masterAccepted:false,
 customerWrites:false,automaticActions:false});
const STAGE_FIELDS=['kind','sequence','previousDigest','handoffId','auditDigest',
 'ql491JournalHead','ql492JournalHead','ownerPacketDigest','reviewerPacketDigest',
 'recordedAtMs','recordDigest'];
const ACK_FIELDS=['kind','sequence','previousDigest','ackId','handoffId',
 'stageRecordDigest','auditDigest','masterPacketDigest','recordedAtMs','recordDigest'];
const HANDOFF=['schema','handoffId','auditDigest','ql491JournalHead','ql492JournalHead',
 'sourceCount','recipient','requestedAction','role','actorId','issuedAtMs',
 'expiresAtMs','customerDataIncluded','authorityTransfer'];
const ACK=['schema','ackId','handoffId','stageRecordDigest','auditDigest',
 'acknowledgedAction','role','actorId','issuedAtMs','expiresAtMs',
 'deliveryObserved','customerDataIncluded','authorityTransfer'];
const exactPem=(p)=>{
 try{let k=createPublicKey(p);return k.asymmetricKeyType==='ed25519'?k:null}
 catch{return null}
};
const ms=x=>Number.isSafeInteger(x)&&x>0;
function safeDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))
  throw Error('QL493_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const p=resolve(directory);mkdirSync(p,{recursive:true,mode:0o700});
 const st=lstatSync(p);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL493_PRIVATE_FOLDER_UNSAFE');
 return p;
}
function verifySignature(packet,pem,role,kind,at){
 try{
  const fields=kind==='handoff'?HANDOFF:ACK;
  if(!exact(packet,['payload','signature'])||
   !exact(packet.payload,fields)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))
   return false;
  const p=packet.payload,k=exactPem(pem),
   sig=Buffer.from(packet.signature,'base64url');
  if(!k||sig.length!==64||sig.toString('base64url')!==packet.signature||
   !verify(null,Buffer.from(canonicalize(p)),k,sig)||
   p.role!==role||!ID.test(p.actorId??'')||
   !ms(p.issuedAtMs)||p.issuedAtMs>at||at-p.issuedAtMs>120000||
   !ms(p.expiresAtMs)||p.expiresAtMs<=at||
   p.expiresAtMs-p.issuedAtMs>300000||
   p.customerDataIncluded!==false||p.authorityTransfer!==false)return false;
  if(kind==='handoff'){
   return p.schema===QL493_HANDOFF_SCHEMA&&ID.test(p.handoffId??'')&&
    HEX.test(p.auditDigest??'')&&
    (p.ql491JournalHead===null||HEX.test(p.ql491JournalHead??''))&&
    (p.ql492JournalHead===null||HEX.test(p.ql492JournalHead??''))&&
    p.sourceCount===6&&p.recipient==='rosevear-master'&&
    p.requestedAction==='OFFLINE_AUDIT_HANDOFF_FOR_INDEPENDENT_REVIEW';
  }
  return p.schema===QL493_ACK_SCHEMA&&ID.test(p.ackId??'')&&
   ID.test(p.handoffId??'')&&HEX.test(p.stageRecordDigest??'')&&
   HEX.test(p.auditDigest??'')&&
   p.acknowledgedAction==='ACKNOWLEDGE_OFFLINE_AUDIT_PACKET_ONLY'&&
   p.deliveryObserved===false;
 }catch{return false}
}
function safeRead(dir){
 const path=join(dir,'ql493-master-handoffs.ndjson');let fd;
 try{
  try{let st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink())
   throw Error('QL493_HANDOFF_JOURNAL_TYPE_OR_LINK_HOLD')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size<1||st.size>2000000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL493_HANDOFF_JOURNAL_PERMISSION_OR_CAPACITY_HOLD');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n'))throw Error('QL493_TRUNCATED_HANDOFF_LOG');
  const rows=raw.trimEnd().split('\n').map(s=>JSON.parse(s));
  if(rows.length>256)throw Error('QL493_HANDOFF_JOURNAL_CAPACITY');
  let previous=null,previousAt=0;
  const stageIds=new Set(),ackIds=new Set(),ackedStages=new Set(),stages=new Map();
  for(const [i,r] of rows.entries()){
   const fields=r.kind==='STAGE_OFFLINE'?STAGE_FIELDS:
    r.kind==='SIGNED_MASTER_ACK_PACKET'?ACK_FIELDS:null;
   if(!fields||!exact(r,fields)||r.sequence!==i+1||
    r.previousDigest!==previous||!HEX.test(r.recordDigest??'')||
    !ms(r.recordedAtMs)||r.recordedAtMs<previousAt||
    hash(Object.fromEntries(fields.filter(x=>x!=='recordDigest').map(x=>[x,r[x]])))!==r.recordDigest)
    throw Error('QL493_HANDOFF_JOURNAL_CHAIN_TAMPERED');
   if(r.kind==='STAGE_OFFLINE'){
    if(!ID.test(r.handoffId??'')||stageIds.has(r.handoffId)||
     !HEX.test(r.auditDigest??'')||
     !(r.ql491JournalHead===null||HEX.test(r.ql491JournalHead??''))||
     !(r.ql492JournalHead===null||HEX.test(r.ql492JournalHead??''))||
     ![r.ownerPacketDigest,r.reviewerPacketDigest].every(x=>HEX.test(x??'')))
     throw Error('QL493_STAGE_REPLAY_OR_SCOPE_TAMPERED');
    stageIds.add(r.handoffId);stages.set(r.handoffId,r);
   }else{
    const stage=stages.get(r.handoffId);
    if(!ID.test(r.ackId??'')||ackIds.has(r.ackId)||
     ackedStages.has(r.handoffId)||!stage||
     r.stageRecordDigest!==stage.recordDigest||
     r.auditDigest!==stage.auditDigest||
     ![r.masterPacketDigest,r.stageRecordDigest,r.auditDigest].every(x=>HEX.test(x??'')))
     throw Error('QL493_ACK_REPLAY_OR_CROSS_STAGE_TAMPERED');
    ackIds.add(r.ackId);ackedStages.add(r.handoffId);
   }
   previous=r.recordDigest;previousAt=r.recordedAtMs;
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
export function createQl493HandoffJournal({directory,now=()=>Date.now()}={}){
 const dir=safeDir(directory),file=join(dir,'ql493-master-handoffs.ndjson'),
  lock=join(dir,'.ql493-master-handoffs.lock');
 function append(kind,body){
  let lockFd;
  try{lockFd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL493_PRIVATE_EXCLUSIVE_WRITER_REQUIRED')}
  try{
   const old=safeRead(dir);
   if(old.length>=256)return hold('QL493_HANDOFF_LOG_CAPACITY_HOLD');
   if(kind==='STAGE_OFFLINE'&&old.some(x=>
    x.kind==='STAGE_OFFLINE'&&x.handoffId===body.handoffId))
    return hold('QL493_HANDOFF_ID_REPLAY_DENIED');
   if(kind==='SIGNED_MASTER_ACK_PACKET'&&old.some(x=>
    x.kind==='SIGNED_MASTER_ACK_PACKET'&&
    (x.ackId===body.ackId||x.handoffId===body.handoffId)))
    return hold('QL493_MASTER_ACK_REPLAY_DENIED');
   if(kind==='SIGNED_MASTER_ACK_PACKET'&&
    !old.some(x=>x.kind==='STAGE_OFFLINE'&&
      x.handoffId===body.handoffId&&
      x.recordDigest===body.stageRecordDigest&&
      x.auditDigest===body.auditDigest))
    return hold('QL493_SIGNED_MASTER_ACK_HAS_NO_MATCHING_STAGE');
   const data={kind,sequence:old.length+1,
    previousDigest:old.at(-1)?.recordDigest??null,
    ...body,recordedAtMs:now()};
   const row={...data,recordDigest:hash(data)};
   const out=openSync(file,constants.O_WRONLY|constants.O_APPEND|
    (constants.O_NOFOLLOW||0)|(old.length===0?
     constants.O_CREAT|constants.O_EXCL:0),0o600);
   try{writeFileSync(out,JSON.stringify(row)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   const updated=safeRead(dir);
   if(updated.length!==old.length+1||
    updated.at(-1).recordDigest!==row.recordDigest)
    return hold('QL493_FSYNC_INDEPENDENT_READBACK_FAILED');
   return {state:kind==='STAGE_OFFLINE'?
    'DURABLE_SIGNED_OFFLINE_HANDOFF_HELD':'DURABLE_SIGNED_MASTER_ACK_PACKET_HELD',
    recordDigest:row.recordDigest,sequence:row.sequence,
    networkSent:false,masterDeliveryVerified:false,
    sourceApproved:false};
  }catch{return hold('QL493_JOURNAL_WRITE_OR_TAMPER_HOLD')}
  finally{closeSync(lockFd);try{unlinkSync(lock)}catch{}}
 }
 function summary(){
  try{
   const rows=safeRead(dir);
   return {state:'PRIVATE_QL493_HANDOFF_JOURNAL_HELD',
    records:rows.length,lastDigest:rows.at(-1)?.recordDigest??null,
    stagedHandoffs:rows.filter(x=>x.kind==='STAGE_OFFLINE').length,
    signedMasterAckPackets:rows.filter(x=>x.kind==='SIGNED_MASTER_ACK_PACKET').length,
    masterNetworkDeliveryVerified:false,customerWrites:false,sourceApproved:false};
  }catch{return hold('QL493_PRIVATE_HANDOFF_LOG_TAMPER_HOLD')}
 }
 return Object.freeze({appendStage:body=>append('STAGE_OFFLINE',body),
  appendAck:body=>append('SIGNED_MASTER_ACK_PACKET',body),
  summary,publicRoute:false,automaticActions:false,networkSend:false});
}
/** No TOFU. This is a local validity preflight, not a transport probe or certificate pin test. */
export function inspectQl493MtlSReadiness({endpoints,nowMs=Date.now()}={}){
 if(!ms(nowMs))return hold('QL493_VALID_CURRENT_TIME_REQUIRED');
 try{validateQl488Enrollment(endpoints)}
 catch{return hold('QL493_EXACT_GENUINE_SIX_SOURCE_MTLS_CONFIG_MISSING_OR_UNSAFE')}
 const sources={};let validCount=0;
 for(const id of QL485_SOURCE_IDS){
  const item=endpoints[id];
  let status='MTLS_PRIVATE_MATERIAL_UNVERIFIED_HOLD';
  try{
   const ca=new X509Certificate(item.caPem),
    cert=new X509Certificate(item.clientCertificatePem),
    key=createPrivateKey(item.clientKeyPem);
   const pub=createPublicKey(key).export({type:'spki',format:'der'});
   const match=pub.equals(cert.publicKey.export({type:'spki',format:'der'}));
   const at=nowMs;
   if(match&&key.asymmetricKeyType!=='ed25519'&&key.asymmetricKeyType!=='rsa'&&
    key.asymmetricKeyType!=='ec')throw Error('unsupported-key');
   if(!match||!Number.isFinite(Date.parse(cert.validFrom))||
    !Number.isFinite(Date.parse(cert.validTo))||
    at<Date.parse(cert.validFrom)||at>Date.parse(cert.validTo)||
    !Number.isFinite(Date.parse(ca.validTo))||
    at>Date.parse(ca.validTo)||at<Date.parse(ca.validFrom))
    throw Error('expired-or-unmatched');
   status='CLIENT_CERT_KEY_MATCH_AND_CA_PARSEABLE_PROBE_REQUIRED';
   validCount++;
  }catch{}
  sources[id]={sourceId:id,state:status,
   actualTlsHandshakeObserved:false,remoteServerFingerprintChecked:false,
   sourceSignerPacketVerified:false,originalRuntimeCertified:false};
 }
 return {state:validCount===6?
  'SIX_SOURCE_MTLS_LOCAL_PREREQUISITES_VALIDATED_NOT_CONNECTED':'HOLD',
  reason:validCount===6?null:'QL493_MTLS_CERTIFICATE_KEY_OR_VALIDITY_INCOMPLETE',
  sourceCount:6,locallyParseableSources:validCount,sources,
  transportConnectionsVerified:0,originalRuntimeCertified:false,
  privateSourceConfigPresent:true,sourceApproval:false,customerWrites:false};
}
function validAudit(a){
 return a?.state==='PRIVATE_SOURCE_TO_MASTER_AUDIT_READBACK_HELD'&&
  a.schema==='rosevear.comms.ql492.private-source-to-master-audit.v1'&&
  a.audience==='rosevear-master'&&
  a.transport==='OFFLINE_READ_ONLY_NO_SEND'&&a.sourceCount===6&&
  HEX.test(a.auditEvidenceDigest??'')&&
  (a.priorJournalHead===null||HEX.test(a.priorJournalHead??''))&&
  (a.ql492JournalHead===null||HEX.test(a.ql492JournalHead??''))&&
  a.masterAcknowledged===false&&a.masterDelivery===false&&
  a.originalSourcesVerified===0&&a.realFieldProofsCertified===0&&
  QL485_SOURCE_IDS.every(id=>a.sources?.[id]?.sourceId===id)&&
  a.auditEvidenceDigest===hash({
   priorJournalHead:a.priorJournalHead,
   ql492JournalHead:a.ql492JournalHead,
   counts:QL485_SOURCE_IDS.map(id=>[id,a.sources[id].followupRequests,
    a.sources[id].signedClaimsSubmitted,a.sources[id].manualDueEscalations])
  });
}
export function createQl493MasterHandoff({readAudit,journal,pins,now=()=>Date.now()}={}){
 if(typeof readAudit!=='function'||typeof journal?.appendStage!=='function'||
  typeof journal?.appendAck!=='function'||typeof journal?.summary!=='function')
  throw Error('QL493_PRIVATE_QL492_AUDIT_AND_HANDOFF_JOURNAL_REQUIRED');
 const ownerKey=pins?.ownerPublicKeyPem,reviewerKey=pins?.reviewerPublicKeyPem,
  masterKey=pins?.masterPublicKeyPem;
 const pinnedDistinct=!!exactPem(ownerKey)&&!!exactPem(reviewerKey)&&
  !!exactPem(masterKey)&&new Set([ownerKey,reviewerKey,masterKey]).size===3;
 function readSafe(){
  try{
   const a=readAudit(),b=readAudit(),s=journal.summary();
   if(!validAudit(a)||!validAudit(b)||a.auditEvidenceDigest!==b.auditEvidenceDigest||
    a.priorJournalHead!==b.priorJournalHead||
    a.ql492JournalHead!==b.ql492JournalHead||
    s?.state!=='PRIVATE_QL493_HANDOFF_JOURNAL_HELD')return null;
   return {audit:a,journal:s};
  }catch{return null}
 }
 function stage({ownerPacket,reviewerPacket}={}){
  const ctx=readSafe(),at=now(),op=ownerPacket?.payload,rp=reviewerPacket?.payload;
  if(!ctx)return hold('QL493_CURRENT_INDEPENDENT_QL492_AUDIT_REQUIRED');
  if(!pinnedDistinct||!verifySignature(ownerPacket,ownerKey,'owner','handoff',at)||
   !verifySignature(reviewerPacket,reviewerKey,'independent-reviewer','handoff',at)||
   op.actorId===rp.actorId||
   !['handoffId','auditDigest','ql491JournalHead','ql492JournalHead',
    'sourceCount','recipient','requestedAction'].every(k=>op[k]===rp[k]))
   return hold('QL493_TWO_DISTINCT_PINNED_SIGNED_HANDOFFS_REQUIRED');
  if(op.auditDigest!==ctx.audit.auditEvidenceDigest||
   op.ql491JournalHead!==ctx.audit.priorJournalHead||
   op.ql492JournalHead!==ctx.audit.ql492JournalHead)
   return hold('QL493_HANDOFF_AUDIT_CUSTODY_CHANGED');
  const saved=journal.appendStage({handoffId:op.handoffId,auditDigest:op.auditDigest,
   ql491JournalHead:op.ql491JournalHead,
   ql492JournalHead:op.ql492JournalHead,
   ownerPacketDigest:hash(ownerPacket),reviewerPacketDigest:hash(reviewerPacket)});
  if(saved.state!=='DURABLE_SIGNED_OFFLINE_HANDOFF_HELD')
   return hold('QL493_OFFLINE_HANDOFF_DURABLE_CUSTODY_FAILED');
  return {state:'TWO_PARTY_OFFLINE_MASTER_HANDOFF_STAGED_HELD',
   handoffId:op.handoffId,stageRecordDigest:saved.recordDigest,
   masterDeliveryVerified:false,networkSent:false,
   sourceAuthorized:false,customerWrites:false};
 }
 function recordMasterAck({masterPacket}={}){
  const ctx=readSafe(),at=now(),p=masterPacket?.payload;
  if(!ctx)return hold('QL493_CURRENT_INDEPENDENT_QL492_AUDIT_REQUIRED');
  if(!pinnedDistinct||!verifySignature(masterPacket,masterKey,
    'independent-master-auditor','ack',at))
   return hold('QL493_INDEPENDENT_PINNED_MASTER_ACK_SIGNATURE_REQUIRED');
  if(p.auditDigest!==ctx.audit.auditEvidenceDigest)
   return hold('QL493_MASTER_ACK_OUTDATED_AUDIT_DIGEST');
  // Journal enforces matching stage, exact stage record digest and no duplicate ACK.
  const saved=journal.appendAck({ackId:p.ackId,handoffId:p.handoffId,
   stageRecordDigest:p.stageRecordDigest,auditDigest:p.auditDigest,
   masterPacketDigest:hash(masterPacket)});
  if(saved.state!=='DURABLE_SIGNED_MASTER_ACK_PACKET_HELD')
   return hold('QL493_MASTER_ACK_STAGE_OR_REPLAY_MISMATCH');
  return {state:'INDEPENDENT_SIGNED_MASTER_ACK_PACKET_RECORDED_HELD',
   ackRecordDigest:saved.recordDigest,masterSignerVerifiedAtIntake:true,
   networkDeliveryVerified:false,masterProductionAcceptance:false,
   sourceAuthorized:false,customerWrites:false};
 }
 function audit(){
  const ctx=readSafe();
  if(!ctx)return hold('QL493_CURRENT_PRIVATE_AUDIT_UNAVAILABLE_OR_TAMPERED');
  return Object.freeze({state:'QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD',
   sixSourceAuditDigest:ctx.audit.auditEvidenceDigest,
   priorQl491Head:ctx.audit.priorJournalHead,
   ql492Head:ctx.audit.ql492JournalHead,
   ql493Head:ctx.journal.lastDigest,
   stagedOfflineHandoffs:ctx.journal.stagedHandoffs,
   separatelySignedAckPacketsRecorded:ctx.journal.signedMasterAckPackets,
   signedPacketsIndependentlyReverifiedOnRead:false,
   masterNetworkDeliveryVerified:false,realSourcesVerified:0,
   physicalFieldProofCertified:false,masterAcceptedProduction:false,
   customerWrites:false,sourceAuthorized:false});
 }
 return Object.freeze({stage,recordMasterAck,audit,
  networkSend:false,automaticHandoff:false,sourceAuthority:false});
}
