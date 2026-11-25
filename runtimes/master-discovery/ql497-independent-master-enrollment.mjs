/**
 * QL-497 — independently signed endpoint enrollment, hardware witness
 * review and two-sided, independently signed QL-495/496 ledger reconciliation.
 * NO endpoint creation, listener, auto-send, production grants or certifications.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFileSync,lstatSync,openSync,closeSync,fstatSync,constants} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {QL495_TRIAL_SCHEMA,verifyQl495MasterTrialReceipt}
 from './ql495-source-provenance-master-trial.mjs';
import {verifyQl496IndependentDeviceEvidence}
 from './ql496-master-endpoint-contract.mjs';

export const QL497_ENROLL_SCHEMA='rosevear.comms.ql497.independent-master-enrollment.v1';
export const QL497_LEDGER_SCHEMA='rosevear.comms.ql497.bidirectional-trial-ledger-readback.v1';
export const QL497_HARDWARE_SCHEMA='rosevear.comms.ql497.independent-hardware-audit.v1';
const HEX=/^[0-9a-f]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const ENROLL=['schema','enrollmentId','masterEndpointUrl','masterCertificateSha256',
 'masterSignerPublicKeyDigest','clientCertificateSha256','deviceEnrollmentDigest',
 'providerCustodyDigest','requestedAction','role','actorId','issuedAtMs',
 'expiresAtMs','customerDataIncluded','authorityTransfer'];
const LEDGER=['schema','reconciliationId','trialId','sourceId','receiptId',
 'requestDigest','sourceRecordDigest','masterPacketDigest','masterAuditDigest',
 'masterJournalHead','clientRecordDigest','masterRecordDigest','role','actorId',
 'issuedAtMs','expiresAtMs','customerDataIncluded','authorityTransfer'];
const HARDWARE=['schema','deviceEnrollmentDigest','challengeId','trialId',
 'independentObservationDigest','masterPacketDigest','providerActorId',
 'observedAtMs','issuedAtMs','expiresAtMs','requestedAction',
 'customerDataIncluded','authorityTransfer'];
const QL495_ROW=['sequence','previousDigest','trialId','sourceId','receiptId',
 'sourceRecordDigest','provenanceDigest','masterAuditDigest','masterJournalHead',
 'masterSignedPacketDigest','masterDecision','recordedAtMs','recordDigest'];
const QL496_ROW=['sequence','previousDigest','trialId','sourceId','receiptId',
 'sourceRecordDigest','provenanceDigest','masterAuditDigest','masterJournalHead',
 'requestDigest','masterPacketDigest','clientCertificateSha256',
 'recordedAtMs','recordDigest'];
const QL495_TRIAL=['schema','trialId','sourceId','receiptId','recordDigest',
 'masterAuditDigest','masterJournalHead','provenanceDigest','sentAtMs',
 'requestedAction','customerDataIncluded','authorityTransfer'];
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const exact=(obj,keys)=>!!obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));
const ms=x=>Number.isSafeInteger(x)&&x>0;
const hold=why=>({state:'HOLD',reason:why,masterEndpointEnrolled:false,
 originalDevicePhysicallyCertified:false,sourceOperationallyCertified:false,
 endToEndDeliveryCertified:false,productionMasterAccepted:false,
 automaticNetworkSend:false,customerWrites:false});
function key(pem){
 try{const p=createPublicKey(pem);return p.asymmetricKeyType==='ed25519'?p:null}
 catch{return null}
}
function keyDigest(pem){
 const k=key(pem);
 return k?createHash('sha256').update(k.export({format:'der',type:'spki'}))
  .digest('hex'):null;
}
function signed(packet,pem,fields){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,fields)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const publicKey=key(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!publicKey&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),publicKey,sig);
 }catch{return false}
}
const fresh=(p,now)=>ms(p.issuedAtMs)&&p.issuedAtMs<=now&&
 now-p.issuedAtMs<=120000&&ms(p.expiresAtMs)&&p.expiresAtMs>now&&
 p.expiresAtMs-p.issuedAtMs<=300000;
function endpointMetadata(url){
 try{
  const u=new URL(url);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||
   u.pathname!=='/internal/comms/master-delivery-trial'||
   !/^([a-z0-9-]+\.)+[a-z0-9-]+$/i.test(u.hostname)||
   /\.(?:localhost|local|example|invalid|test)$/i.test(u.hostname)||
   ![443,8443].includes(Number(u.port||443)))return false;
  return true;
 }catch{return false}
}
/**
 * Three DISTINCT independently pinned signers (owner, reviewer, provider).
 * This verifies a provenance *claim* only. No network or certificate handshake.
 */
export function reviewQl497IndependentMasterEnrollment({enrollmentPackets,
 approvedPins,now=Date.now()}={}){
 const labels=['provider','owner','independent-reviewer'];
 if(!exact(approvedPins,['providerPublicKeyPem','ownerPublicKeyPem',
   'reviewerPublicKeyPem','masterPublicKeyPem'])||
  !exact(enrollmentPackets,['providerPacket','ownerPacket','reviewerPacket']))
  return hold('QL497_INDEPENDENT_MASTER_CUSTODY_CONFIG_REQUIRED');
 const keys=[approvedPins.providerPublicKeyPem,approvedPins.ownerPublicKeyPem,
  approvedPins.reviewerPublicKeyPem,approvedPins.masterPublicKeyPem];
 const digests=keys.map(keyDigest);
 if(digests.some(x=>!x)||new Set(digests).size!==4)
  return hold('QL497_FOUR_DISTINCT_ENROLLED_SIGNER_IDENTITIES_REQUIRED');
 const packets=[enrollmentPackets.providerPacket,enrollmentPackets.ownerPacket,
  enrollmentPackets.reviewerPacket];
 const keyValues=keys.slice(0,3);
 if(packets.some((p,i)=>!signed(p,keyValues[i],ENROLL)||
  p.payload?.role!==labels[i]||!fresh(p.payload,now)))
  return hold('QL497_SOURCE_PROVIDER_OWNER_REVIEWER_SIGNATURES_REQUIRED');
 const [a,b,c]=packets.map(p=>p.payload);
 if(!ID.test(a.enrollmentId??'')||
  ![b,c].every(p=>p.enrollmentId===a.enrollmentId)||
  new Set(packets.map(p=>p.payload.actorId)).size!==3||
  packets.some(p=>!ID.test(p.payload.actorId??''))||
  !endpointMetadata(a.masterEndpointUrl)||
  ![a.masterCertificateSha256,a.masterSignerPublicKeyDigest,
   a.clientCertificateSha256,a.deviceEnrollmentDigest,
   a.providerCustodyDigest].every(x=>HEX.test(x??''))||
  a.masterSignerPublicKeyDigest!==digests[3]||
  a.requestedAction!=='REVIEW_PRIVATE_MASTER_ENDPOINT_CUSTODY_ONLY'||
  a.customerDataIncluded!==false||a.authorityTransfer!==false||
  ![b,c].every(p=>[
   'masterEndpointUrl','masterCertificateSha256','masterSignerPublicKeyDigest',
   'clientCertificateSha256','deviceEnrollmentDigest','providerCustodyDigest',
   'requestedAction','customerDataIncluded','authorityTransfer'
  ].every(k=>p[k]===a[k])))
  return hold('QL497_ENROLLMENT_ENDPOINT_TLS_OR_OWNER_SCOPE_MISMATCH');
 const projection={enrollmentId:a.enrollmentId,url:a.masterEndpointUrl,
  tlsFingerprint:a.masterCertificateSha256,
  masterSignerDigest:a.masterSignerPublicKeyDigest,
  clientCertificateSha256:a.clientCertificateSha256,
  deviceEnrollmentDigest:a.deviceEnrollmentDigest,
  providerCustodyDigest:a.providerCustodyDigest,
  approvedPacketDigests:packets.map(hash)};
 return {state:'QL497_THREE_PARTY_MASTER_ENDPOINT_ENROLLMENT_REVIEW_HELD',
  enrollmentDigest:hash(projection),...projection,
  signerKeysDistinct:true,localApprovedMetadataOnly:true,
  actualPrivateTlsConnected:false,masterEndpointEnrolled:false,
  originalDevicePhysicallyCertified:false,productionMasterAccepted:false,
  customerWrites:false};
}
/** Verify actual provider-backed hardware observation after QL-496 challenge.
 * Even four signatures cannot remotely prove which physical device was seen.
 */
export function reviewQl497IndependentOriginalDevice({challengePacket,
 attestationPacket,ownerPacket,reviewerPacket,hardwareAuditPacket,pins,
 trial,masterPacket,now=Date.now()}={}){
 const base=verifyQl496IndependentDeviceEvidence({challengePacket,
  attestationPacket,ownerPacket,reviewerPacket,pins,trial,masterPacket,now});
 if(base.state!=='QL496_INDEPENDENT_SIGNED_DEVICE_EVIDENCE_REVIEW_HELD')
  return hold('QL497_QL496_GENUINE_FOUR_SIGNER_WITNESS_REQUIRED');
 const digests=[pins?.attestorPublicKeyPem,pins?.ownerPublicKeyPem,
  pins?.reviewerPublicKeyPem,pins?.masterPublicKeyPem,
  pins?.hardwareAuditorPublicKeyPem].map(keyDigest);
 if(digests.some(x=>!x)||new Set(digests).size!==5||
  !signed(hardwareAuditPacket,pins.hardwareAuditorPublicKeyPem,HARDWARE))
  return hold('QL497_DISTINCT_EXTERNAL_HARDWARE_AUDITOR_SIGNED_PACKET_REQUIRED');
 const h=hardwareAuditPacket.payload;
 if(h.schema!==QL497_HARDWARE_SCHEMA||
  !ID.test(h.providerActorId??'')||
  [attestationPacket.payload.witnessActorId,ownerPacket.payload.actorId,
    reviewerPacket.payload.actorId].includes(h.providerActorId)||
  h.deviceEnrollmentDigest!==pins.deviceEnrollmentDigest||
  h.challengeId!==challengePacket.payload.challengeId||
  h.trialId!==trial.trialId||
  h.masterPacketDigest!==hash(masterPacket)||
  h.independentObservationDigest!==hash(attestationPacket)||
  h.requestedAction!=='INDEPENDENT_HARDWARE_AUDIT_REVIEW_ONLY'||
  h.customerDataIncluded!==false||h.authorityTransfer!==false||
  !ms(h.observedAtMs)||h.observedAtMs>h.issuedAtMs||
  h.observedAtMs<challengePacket.payload.issuedAtMs||
  h.observedAtMs>challengePacket.payload.expiresAtMs||
  !fresh(h,now))
  return hold('QL497_DEVICE_HARDWARE_AUDIT_SCOPE_OR_FRESHNESS_HOLD');
 return {state:'QL497_INDEPENDENT_DEVICE_HARDWARE_AUDIT_REVIEW_HELD',
  challengeId:h.challengeId,trialId:h.trialId,
  deviceEvidenceDigest:base.deviceEvidenceDigest,
  hardwareAuditDigest:hash(hardwareAuditPacket),
  independentProviderSignatureVerified:true,
  independentDeviceHardwareAuditClaimReviewed:true,
  originalDevicePhysicallyCertified:false,
  sourceOperationallyCertified:false,productionMasterAccepted:false,
  customerWrites:false};
}
function privateDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))
  throw Error('QL497_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const p=resolve(directory),st=lstatSync(p);
 if(!st.isDirectory()||st.isSymbolicLink()||
  process.platform!=='win32'&&(st.mode&0o077))
  throw Error('QL497_PRIVATE_DIRECTORY_UNSAFE');
 return p;
}
function readLedger(directory,filename,fields,now){
 const dir=privateDir(directory),path=join(dir,filename);
 let fd;
 try{
  const st=lstatSync(path);
  if(!st.isFile()||st.isSymbolicLink())throw Error('QL497_UNSAFE_JOURNAL_FILE');
  fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const stat=fstatSync(fd);
  if(!stat.isFile()||stat.size<1||stat.size>1000000||
   process.platform!=='win32'&&(stat.mode&0o077))
   throw Error('QL497_LEDGER_PERMISSIONS_OR_SIZE_HOLD');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n'))throw Error('QL497_TRUNCATED_JOURNAL');
  const rows=raw.trimEnd().split('\n').map(s=>JSON.parse(s));
  if(rows.length>64)throw Error('QL497_LEDGER_CAPACITY_HOLD');
  let prev=null,time=0;const ids=new Set();
  for(const [i,r] of rows.entries()){
   if(!exact(r,fields)||r.sequence!==i+1||r.previousDigest!==prev||
    !ID.test(r.trialId??'')||ids.has(r.trialId)||
    !ID.test(r.receiptId??'')||!QL485_SOURCE_IDS.includes(r.sourceId)||
    ![r.sourceRecordDigest,r.provenanceDigest,r.masterAuditDigest,
     r.recordDigest].every(x=>HEX.test(x??''))||
    !(r.masterJournalHead===null||HEX.test(r.masterJournalHead??''))||
    (fields===QL495_ROW&&!HEX.test(r.masterSignedPacketDigest??''))||
    (fields===QL496_ROW&&
     ![r.requestDigest,r.masterPacketDigest,r.clientCertificateSha256]
       .every(x=>HEX.test(x??'')))||
    (fields===QL495_ROW&&
     !['HOLD_FOR_INDEPENDENT_REVIEW','DENY'].includes(r.masterDecision))||
    !ms(r.recordedAtMs)||r.recordedAtMs<time||r.recordedAtMs>now||
    hash(Object.fromEntries(fields.filter(x=>x!=='recordDigest')
     .map(x=>[x,r[x]])))!==r.recordDigest)
    throw Error('QL497_LEDGER_REPLAY_OR_HASH_CHAIN_TAMPER');
   ids.add(r.trialId);time=r.recordedAtMs;prev=r.recordDigest;
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
export function readQl497ClientReceipt({directory,trialId,now=Date.now()}={}){
 try{
  if(!ID.test(trialId??''))throw Error('bad trial id');
  const rows=readLedger(directory,'ql495-master-trial-receipts.ndjson',
   QL495_ROW,now);
  const row=rows.find(r=>r.trialId===trialId);
  return row?{state:'QL497_SIGNED_CLIENT_TRIAL_JOURNAL_RECORD_READ_HELD',
   record:row,journalHead:rows.at(-1).recordDigest,
   independentOriginalClientVerified:false}:hold('QL497_GENUINE_CLIENT_RECEIPT_NOT_FOUND');
 }catch{return hold('QL497_CLIENT_RECEIPT_LEDGER_MISSING_OR_TAMPERED')}
}
export function readQl497MasterReceipt({directory,trialId,now=Date.now()}={}){
 try{
  if(!ID.test(trialId??''))throw Error('bad trial id');
  const rows=readLedger(directory,'ql496-master-receiver-trial.ndjson',
   QL496_ROW,now);
  const row=rows.find(r=>r.trialId===trialId);
  return row?{state:'QL497_SIGNED_MASTER_TRIAL_JOURNAL_RECORD_READ_HELD',
   record:row,journalHead:rows.at(-1).recordDigest,
   independentOriginalMasterVerified:false}:hold('QL497_GENUINE_MASTER_RECEIPT_NOT_FOUND');
 }catch{return hold('QL497_MASTER_RECEIPT_LEDGER_MISSING_OR_TAMPERED')}
}
export function reconcileQl497BidirectionalReceipts({trial,masterPacket,clientRecord,
 masterRecord,clientReadbackPacket,masterReadbackPacket,approvedPins,
 now=Date.now()}={}){
 if(!exact(trial,QL495_TRIAL)||trial.schema!==QL495_TRIAL_SCHEMA||
  !QL485_SOURCE_IDS.includes(trial.sourceId)||!ID.test(trial.trialId??'')||
  !ID.test(trial.receiptId??'')||
  !exact(clientRecord,QL495_ROW)||!exact(masterRecord,QL496_ROW)||
  !exact(approvedPins,['clientPublicKeyPem','masterPublicKeyPem'])||
  !keyDigest(approvedPins.clientPublicKeyPem)||
  !keyDigest(approvedPins.masterPublicKeyPem)||
  keyDigest(approvedPins.clientPublicKeyPem)===
   keyDigest(approvedPins.masterPublicKeyPem))
  return hold('QL497_INDEPENDENT_CLIENT_MASTER_RECEIPTS_AND_KEYS_REQUIRED');
 const ack=verifyQl495MasterTrialReceipt({requestPayload:trial,
  responsePacket:masterPacket,masterPublicKeyPem:approvedPins.masterPublicKeyPem,now});
 if(ack.state!=='QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD')
  return hold('QL497_PINNED_SIGNED_MASTER_PACKET_REQUIRED');
 const mHash=hash(masterPacket);
 if(clientRecord.trialId!==trial.trialId||
  clientRecord.sourceId!==trial.sourceId||
  clientRecord.receiptId!==trial.receiptId||
  clientRecord.sourceRecordDigest!==trial.recordDigest||
  clientRecord.provenanceDigest!==trial.provenanceDigest||
  clientRecord.masterAuditDigest!==trial.masterAuditDigest||
  clientRecord.masterJournalHead!==trial.masterJournalHead||
  clientRecord.masterSignedPacketDigest!==mHash||
  clientRecord.masterDecision!=='HOLD_FOR_INDEPENDENT_REVIEW'||
  masterRecord.trialId!==trial.trialId||
  masterRecord.sourceId!==trial.sourceId||
  masterRecord.receiptId!==trial.receiptId||
  masterRecord.sourceRecordDigest!==trial.recordDigest||
  masterRecord.provenanceDigest!==trial.provenanceDigest||
  masterRecord.masterAuditDigest!==trial.masterAuditDigest||
  masterRecord.masterJournalHead!==trial.masterJournalHead||
  masterRecord.masterPacketDigest!==mHash||
  masterRecord.requestDigest!==hash(trial)||
  !HEX.test(masterRecord.clientCertificateSha256??'')||
  hash(Object.fromEntries(QL495_ROW.filter(k=>k!=='recordDigest')
   .map(k=>[k,clientRecord[k]])))!==clientRecord.recordDigest||
  hash(Object.fromEntries(QL496_ROW.filter(k=>k!=='recordDigest')
   .map(k=>[k,masterRecord[k]])))!==masterRecord.recordDigest)
  return hold('QL497_TWO_SIDED_RECEIPT_RECORD_DIGEST_MISMATCH');
 const packets=[clientReadbackPacket,masterReadbackPacket],roles=['client','master'],
  pems=[approvedPins.clientPublicKeyPem,approvedPins.masterPublicKeyPem];
 if(packets.some((p,i)=>!signed(p,pems[i],LEDGER)||
   p.payload.schema!==QL497_LEDGER_SCHEMA||p.payload.role!==roles[i]||
   !fresh(p.payload,now)))return hold('QL497_TWO_INDEPENDENT_SIGNED_LEDGER_READBACKS_REQUIRED');
 const [a,b]=packets.map(x=>x.payload),fields=[
  'reconciliationId','trialId','sourceId','receiptId','requestDigest',
  'sourceRecordDigest','masterPacketDigest','masterAuditDigest',
  'masterJournalHead','clientRecordDigest','masterRecordDigest',
  'customerDataIncluded','authorityTransfer'];
 if(!ID.test(a.reconciliationId??'')||
  !ID.test(a.actorId??'')||!ID.test(b.actorId??'')||
  a.actorId===b.actorId||fields.some(k=>a[k]!==b[k])||
  a.trialId!==trial.trialId||a.sourceId!==trial.sourceId||
  a.receiptId!==trial.receiptId||a.requestDigest!==hash(trial)||
  a.sourceRecordDigest!==trial.recordDigest||
  a.masterPacketDigest!==mHash||
  a.masterAuditDigest!==trial.masterAuditDigest||
  a.masterJournalHead!==trial.masterJournalHead||
  a.clientRecordDigest!==clientRecord.recordDigest||
  a.masterRecordDigest!==masterRecord.recordDigest||
  a.customerDataIncluded!==false||a.authorityTransfer!==false)
  return hold('QL497_SIGNED_CROSS_DEVICE_AUDIT_SCOPE_MISMATCH');
 return {state:'QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD',
  reconciliationId:a.reconciliationId,trialId:trial.trialId,
  sourceId:trial.sourceId,clientRecordDigest:clientRecord.recordDigest,
  masterRecordDigest:masterRecord.recordDigest,
  masterPacketDigest:mHash,
  ownerClientAndIndependentMasterSignaturesVerified:true,
  independentNetworkPathAudited:false,
  originalDevicePhysicallyCertified:false,
  endToEndDeliveryCertified:false,
  sourceOperationallyCertified:false,
  productionMasterAccepted:false,customerWrites:false};
}
