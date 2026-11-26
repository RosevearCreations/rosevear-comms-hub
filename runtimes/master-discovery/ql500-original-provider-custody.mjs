/**
 * QL-500 — owner-private provider discovery and independently signed receipt
 * custody. No network, unattended send, live provider certificate or grants.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {lstatSync,readFileSync,openSync,closeSync,writeSync,fsyncSync,
 unlinkSync,fstatSync,constants} from 'node:fs';
import {resolve,isAbsolute,join,sep} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {readQl497ClientReceipt,readQl497MasterReceipt,
 reconcileQl497BidirectionalReceipts} from './ql497-independent-master-enrollment.mjs';
import {reviewQl499WithOriginalEvidence} from './ql499-original-path-probe.mjs';

export const QL500_CUSTODY_SCHEMA='rosevear.comms.ql500.provider-receipt-custody.v1';
const CONFIG=['endpointUrl','serverCertificateSha256','caFile',
 'clientCertificateFile','clientKeyFile','explicitOwnerApproval'];
const FIELDS=['schema','custodyId','ceremonyId','trialId','sourceId',
 'masterEndpointUrl','masterCertificateSha256','configDigest',
 'pathWitnessDigest','clientReceiptDigest','masterReceiptDigest',
 'clientJournalHead','masterJournalHead','providerRuntimeDigest',
 'role','actorId','issuedAtMs','expiresAtMs','requestedAction',
 'customerDataIncluded','authorityTransfer'];
const COMMON=FIELDS.filter(x=>!['role','actorId','issuedAtMs','expiresAtMs'].includes(x));
const ROW=['sequence','previousDigest','custodyId','trialId','sourceId',
 'providerPacketDigest','ownerPacketDigest','configDigest',
 'clientReceiptDigest','masterReceiptDigest','recordedAtMs','recordDigest'];
const HEX=/^[0-9a-f]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/,
 NAME=/^[A-Za-z0-9_.-]{8,96}$/;
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const exact=(x,fields)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const ms=x=>Number.isSafeInteger(x)&&x>0;
const hold=reason=>({state:'HOLD',reason,providerRuntimeCertified:false,
 originalDevicePhysicallyCertified:false,originalLiveReceiptCertified:false,
 networkDeliveryCertified:false,automaticNetworkSend:false,customerWrites:false});
function endpoint(raw){
 try{
  const u=new URL(raw);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&
   u.pathname==='/internal/comms/master-delivery-trial'&&
   /^([a-z0-9-]+\.)+[a-z0-9-]+$/i.test(u.hostname)&&
   !/\.(example|invalid|test|localhost|local)$/i.test(u.hostname)&&
   (!u.port||['443','8443'].includes(u.port));
 }catch{return false;}
}
function privateDir(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))
  throw Error('QL500_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory),st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||
  process.platform!=='win32'&&(st.mode&0o077)!==0)
  throw Error('QL500_UNSAFE_PRIVATE_DIRECTORY');
 return root;
}
function privateFile(root,name,min=1,max=131072){
 if(typeof name!=='string'||!NAME.test(name))throw Error('QL500_PRIVATE_BASENAME');
 const p=join(root,name);
 if(!p.startsWith(root+sep))throw Error('QL500_PATH_ESCAPE');
 const st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.size<min||st.size>max||
  process.platform!=='win32'&&(st.mode&0o077)!==0)
  throw Error('QL500_PRIVATE_FILE_UNSAFE');
 return p;
}
function publicKey(pem){
 try{
  const p=createPublicKey(pem);
  return p.asymmetricKeyType==='ed25519'?p:null;
 }catch{return null;}
}
function keyDigest(pem){
 const p=publicKey(pem);
 return p?createHash('sha256').update(p.export({format:'der',type:'spki'}))
  .digest('hex'):null;
}
function signed(packet,pem){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,FIELDS)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const p=publicKey(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!p&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),p,sig);
 }catch{return false;}
}
const fresh=(p,now)=>ms(p.issuedAtMs)&&p.issuedAtMs<=now&&
 now-p.issuedAtMs<=120000&&ms(p.expiresAtMs)&&p.expiresAtMs>now&&
 p.expiresAtMs-p.issuedAtMs<=300000;

/** Read *only* public config fields and file metadata, never private key bytes. */
export function discoverQl500OriginalProviderConfig({directory}={}){
 try{
  const root=privateDir(directory);
  const config=JSON.parse(readFileSync(
   privateFile(root,'ql499-owner-approved-probe.json',32,8192),'utf8'));
  if(!exact(config,CONFIG)||!endpoint(config.endpointUrl)||
   !HEX.test(config.serverCertificateSha256??'')||
   config.explicitOwnerApproval!=='ONE_SUPERVISED_TLS_HANDSHAKE_NO_HTTP')
   return hold('QL500_PREAPPROVED_MASTER_CONFIG_REQUIRED');
  const files=['caFile','clientCertificateFile','clientKeyFile'];
  if(new Set(files.map(x=>config[x])).size!==3||
   files.some(x=>config[x]==='ql499-owner-approved-probe.json'))
   return hold('QL500_PRIVATE_CREDENTIAL_NAME_REUSE');
  for(const field of files)privateFile(root,config[field],32,131072);
  const projection={endpointUrl:config.endpointUrl,
   serverCertificateSha256:config.serverCertificateSha256,
   caPresent:true,clientCertificatePresent:true,clientKeyPresent:true};
  return {state:'QL500_ORIGINAL_PROVIDER_CONFIG_DISCOVERED_REVIEW_HELD',
   ...projection,configDigest:hash(projection),
   localFileMetadataRead:true,privateKeyBytesRead:false,
   windowsAclIndependentlyVerified:false,actualMasterEndpointReached:false,
   originalLiveReceiptCertified:false,providerRuntimeCertified:false,
   automaticNetworkSend:false,customerWrites:false};
 }catch{return hold('QL500_PROVIDER_CONFIGURATION_MISSING_OR_UNSAFE');}
}
/** Claim review is never real receipt proof without raw evidence. */
export function reviewQl500ProviderReceiptClaims({discovery,pathReview,
 clientReadback,masterReadback,reconciliation,providerPacket,ownerPacket,
 approvedPins,now=Date.now()}={}){
 if(discovery?.state!=='QL500_ORIGINAL_PROVIDER_CONFIG_DISCOVERED_REVIEW_HELD'||
  pathReview?.state!=='QL499_ORIGINAL_SIGNED_PATH_REVIEW_HELD'||
  clientReadback?.state!=='QL497_SIGNED_CLIENT_TRIAL_JOURNAL_RECORD_READ_HELD'||
  masterReadback?.state!=='QL497_SIGNED_MASTER_TRIAL_JOURNAL_RECORD_READ_HELD'||
  reconciliation?.state!=='QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD'||
  !exact(approvedPins,['providerPublicKeyPem','ownerPublicKeyPem',
   'masterPublicKeyPem'])||
  !signed(providerPacket,approvedPins.providerPublicKeyPem)||
  !signed(ownerPacket,approvedPins.ownerPublicKeyPem))
  return hold('QL500_GENUINE_TWO_SIDED_RECEIPTS_AND_SIGNERS_REQUIRED');
 const digests=[approvedPins.providerPublicKeyPem,
  approvedPins.ownerPublicKeyPem,approvedPins.masterPublicKeyPem].map(keyDigest);
 if(digests.some(x=>!x)||new Set(digests).size!==3)
  return hold('QL500_DISTINCT_PREAPPROVED_SIGNER_KEYS_REQUIRED');
 const p=providerPacket.payload,o=ownerPacket.payload;
 if(p.schema!==QL500_CUSTODY_SCHEMA||p.role!=='independent-provider'||
  o.role!=='original-windows-owner'||!fresh(p,now)||!fresh(o,now)||
  !ID.test(p.custodyId??'')||!ID.test(p.ceremonyId??'')||
  !ID.test(p.trialId??'')||!ID.test(p.actorId??'')||
  !ID.test(o.actorId??'')||p.actorId===o.actorId||
  COMMON.some(k=>o[k]!==p[k])||
  ![p.masterCertificateSha256,p.configDigest,p.pathWitnessDigest,
   p.clientReceiptDigest,p.masterReceiptDigest,p.clientJournalHead,
   p.masterJournalHead,p.providerRuntimeDigest].every(x=>HEX.test(x??''))||
  p.requestedAction!=='REVIEW_ORIGINAL_PROVIDER_RECEIPT_CUSTODY_ONLY'||
  p.customerDataIncluded!==false||p.authorityTransfer!==false||
  p.ceremonyId!==pathReview.ceremonyId||
  p.trialId!==pathReview.trialId||p.trialId!==reconciliation.trialId||
  p.sourceId!==reconciliation.sourceId||
  p.masterEndpointUrl!==discovery.endpointUrl||
  p.masterCertificateSha256!==discovery.serverCertificateSha256||
  p.configDigest!==discovery.configDigest||
  p.pathWitnessDigest!==pathReview.pathWitnessDigest||
  p.clientReceiptDigest!==reconciliation.clientRecordDigest||
  p.masterReceiptDigest!==reconciliation.masterRecordDigest||
  p.clientReceiptDigest!==clientReadback.record?.recordDigest||
  p.masterReceiptDigest!==masterReadback.record?.recordDigest||
  p.clientJournalHead!==clientReadback.journalHead||
  p.masterJournalHead!==masterReadback.journalHead||
  p.trialId!==clientReadback.record?.trialId||
  p.trialId!==masterReadback.record?.trialId||
  p.sourceId!==clientReadback.record?.sourceId||
  p.sourceId!==masterReadback.record?.sourceId)
  return hold('QL500_PROVIDER_OR_RECEIPT_CUSTODY_DRIFT');
 return {state:'QL500_SIGNED_PROVIDER_RECEIPT_CUSTODY_CLAIMS_REVIEW_HELD',
  custodyId:p.custodyId,ceremonyId:p.ceremonyId,trialId:p.trialId,
  sourceId:p.sourceId,configDigest:p.configDigest,
  clientReceiptDigest:p.clientReceiptDigest,
  masterReceiptDigest:p.masterReceiptDigest,
  providerPacketDigest:hash(providerPacket),ownerPacketDigest:hash(ownerPacket),
  independentOwnerProviderSignaturesChecked:true,
  providerRuntimeCertified:false,originalLiveReceiptCertified:false,
  actualNetworkDeliveryCertified:false,
  automaticNetworkSend:false,customerWrites:false};
}
/** Reverify actual prior signed originals AND separate immutable journal reads.
 * Caller-supplied REVIEW_HELD projections cannot pass this entrypoint.
 */
export function reviewQl500WithOriginalEvidence({directory,clientDirectory,
 masterDirectory,ql499Evidence,ql497ReceiptEvidence,
 providerPacket,ownerPacket,approvedPins,now=Date.now()}={}){
 if(!ql499Evidence||!ql497ReceiptEvidence)
  return hold('QL500_RAW_ORIGINAL_SIGNED_EVIDENCE_REQUIRED');
 const discovery=discoverQl500OriginalProviderConfig({directory});
 const pathReview=reviewQl499WithOriginalEvidence({...ql499Evidence,now});
 const reconciliation=reconcileQl497BidirectionalReceipts({...ql497ReceiptEvidence,now});
 const trialId=reconciliation.trialId;
 if(!ID.test(trialId??''))return hold('QL500_RAW_CLIENT_AND_MASTER_RECEIPTS_REQUIRED');
 const clientReadback=readQl497ClientReceipt({directory:clientDirectory,trialId,now});
 const masterReadback=readQl497MasterReceipt({directory:masterDirectory,trialId,now});
 const r=reviewQl500ProviderReceiptClaims({discovery,pathReview,clientReadback,
  masterReadback,reconciliation,providerPacket,ownerPacket,approvedPins,now});
 return r.state==='HOLD'?r:{...r,
  state:'QL500_ORIGINAL_SIGNED_PROVIDER_CUSTODY_REVIEW_HELD',
  originalQl497Ql499SignaturesReverified:true,
  originalLiveReceiptCertified:false,providerRuntimeCertified:false};
}
function readRows(root){
 const p=join(root,'ql500-private-custody.ndjson');
 let fd;
 try{
  const st=lstatSync(p);
  if(!st.isFile()||st.isSymbolicLink()||st.size>1000000||
   process.platform!=='win32'&&(st.mode&0o077)!==0)
   throw Error('QL500_PRIVATE_LEDGER_UNSAFE');
  fd=openSync(p,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const raw=readFileSync(fd,'utf8');
  if(raw&&!raw.endsWith('\n'))throw Error('QL500_TRUNCATED_LEDGER');
  const rows=raw?raw.trimEnd().split('\n').map(x=>JSON.parse(x)):[];
  if(rows.length>64)throw Error('QL500_JOURNAL_CAPACITY');
  let prev=null,stamp=0;const seenCustody=new Set(),seenTrials=new Set();
  for(const [i,r] of rows.entries()){
   if(!exact(r,ROW)||r.sequence!==i+1||r.previousDigest!==prev||
    !ID.test(r.custodyId??'')||!ID.test(r.trialId??'')||
    seenCustody.has(r.custodyId)||seenTrials.has(r.trialId)||
    ![r.providerPacketDigest,r.ownerPacketDigest,r.configDigest,
     r.clientReceiptDigest,r.masterReceiptDigest,r.recordDigest]
     .every(x=>HEX.test(x??''))||
    !ms(r.recordedAtMs)||r.recordedAtMs<stamp||
    hash(Object.fromEntries(ROW.filter(k=>k!=='recordDigest')
     .map(k=>[k,r[k]])))!==r.recordDigest)
    throw Error('QL500_LEDGER_REPLAY_OR_TAMPER');
   seenCustody.add(r.custodyId);seenTrials.add(r.trialId);
   prev=r.recordDigest;stamp=r.recordedAtMs;
  }
  return rows;
 }catch(e){if(e.code==='ENOENT')return [];throw e;}
 finally{if(fd!==undefined)closeSync(fd);}
}
export function readQl500PrivateCustody({directory}={}){
 try{
  const rows=readRows(privateDir(directory));
  return {state:'QL500_PRIVATE_CUSTODY_LEDGER_READ_REVIEW_HELD',
   count:rows.length,journalHead:rows.at(-1)?.recordDigest??null,
   independentlyCertified:false,automaticNetworkSend:false,
   customerWrites:false};
 }catch{return hold('QL500_LEDGER_NOT_READABLE_OR_TAMPERED');}
}
/** Only original packets, not a caller's fake "verified" flag, can authorize
 * this metadata-only journal write. It never authorizes application delivery.
 */
export function appendQl500OriginalCustody({directory,evidence,
 now=Date.now()}={}){
 const r=reviewQl500WithOriginalEvidence({...evidence,now});
 if(r.state!=='QL500_ORIGINAL_SIGNED_PROVIDER_CUSTODY_REVIEW_HELD')
  return hold('QL500_REVERIFIED_ORIGINAL_CUSTODY_REQUIRED');
 let lock=null,fd;
 try{
  const root=privateDir(directory);
  lock=join(root,'.ql500-custody-write.lock');
  fd=openSync(lock,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY,0o600);
  closeSync(fd);fd=undefined;
  const rows=readRows(root);
  if(rows.length>=64||rows.some(x=>x.custodyId===r.custodyId||
   x.trialId===r.trialId))return hold('QL500_CUSTODY_REPLAY_OR_CAPACITY_HOLD');
  const base={sequence:rows.length+1,
   previousDigest:rows.at(-1)?.recordDigest??null,
   custodyId:r.custodyId,trialId:r.trialId,sourceId:r.sourceId,
   providerPacketDigest:r.providerPacketDigest,
   ownerPacketDigest:r.ownerPacketDigest,configDigest:r.configDigest,
   clientReceiptDigest:r.clientReceiptDigest,
   masterReceiptDigest:r.masterReceiptDigest,recordedAtMs:now};
  const row={...base,recordDigest:hash(base)};
  const ledger=join(root,'ql500-private-custody.ndjson');
  fd=openSync(ledger,constants.O_CREAT|constants.O_APPEND|constants.O_WRONLY|
    (constants.O_NOFOLLOW||0),0o600);
  const st=fstatSync(fd);
  if(!st.isFile()||st.size>1000000||
   process.platform!=='win32'&&(st.mode&0o077)!==0)
   return hold('QL500_PRIVATE_LEDGER_PERMISSIONS_HOLD');
  const line=Buffer.from(JSON.stringify(row)+'\n');
  if(writeSync(fd,line)!==line.length)throw Error('QL500_SHORT_WRITE');
  fsyncSync(fd);closeSync(fd);fd=undefined;
  if(readRows(root).at(-1)?.recordDigest!==row.recordDigest)
   return hold('QL500_DURABLE_READBACK_MISMATCH');
  return {state:'QL500_ORIGINAL_RECEIPT_CUSTODY_DURABLY_RECORDED_REVIEW_HELD',
   recordDigest:row.recordDigest,sequence:row.sequence,
   realDeliveryCertified:false,automaticNetworkSend:false,
   customerWrites:false};
 }catch{return hold('QL500_PRIVATE_CUSTODY_APPEND_FAILED');}
 finally{
  if(fd!==undefined)try{closeSync(fd);}catch{}
  if(lock)try{unlinkSync(lock);}catch{}
 }
}
