import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {reviewQl411ProtectedTelemetry} from './ql411-protected-telemetry.mjs';
import {reviewQl414OwnerDecision} from './ql414-one-test-transport.mjs';
import {buildQl422WitnessLedgerRecheck} from './ql422-original-host-witness.mjs';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const OPAQUE=/^[A-Za-z0-9_-]{12,96}$/;
const EPISODE=/^rosevear-ai-hub:[A-Za-z0-9_-]{8,96}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const WINDOW=300000;
const digest=x=>createHash('sha256').update(x).digest('hex');
const stable=o=>JSON.stringify(o);
const eq=(a,b)=>HEX.test(a??'')&&HEX.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
  new Date(Date.parse(s)).toISOString()===s;
const validMs=(v,now)=>Number.isSafeInteger(v)&&v>=0&&v<=now;
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===k.length&&k.every(n=>Object.hasOwn(o,n));
const hold=reason=>({state:'HOLD',reason,receiver:'OFF',connection:'HOLD',
  ownerAcceptance:'HOLD',runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const verifySigned=(payload,signature,pin)=>{
  try{
    if(typeof pin!=='string'||pin.length>512||
      typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature))
      return false;
    const bytes=Buffer.from(pin,'base64');
    if(bytes.toString('base64')!==pin)return false;
    const publicKey=createPublicKey({key:bytes,format:'der',type:'spki'});
    return publicKey.asymmetricKeyType==='ed25519'&&
      verify(null,Buffer.from(stable(payload)),publicKey,Buffer.from(signature,'base64'));
  }catch{return false;}
};

/** A protected, append-only restart-persistent metadata store; no raw
 * signatures, private keys or source payloads are stored. The directory
 * must be selected by a trusted backend, NEVER from browser input. */
export function openQl423DurableCustodyStore(directory){
  if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
    throw Error('PROTECTED_ABSOLUTE_STORE_REQUIRED');
  const root=resolve(directory);
  mkdirSync(root,{recursive:true,mode:0o700});
  const st=lstatSync(root);
  if(st.isSymbolicLink()||!st.isDirectory()||(st.mode&0o077))
    throw Error('UNSAFE_CUSTODY_STORE_PERMISSIONS');
  const file=key=>{
    if(!EPISODE.test(key))throw Error('INVALID_EPISODE_KEY');
    return join(root,digest(Buffer.from(key))+'.json');
  };
  const read=key=>{
    let raw;
    try{raw=readFileSync(file(key),'utf8');}
    catch(e){if(e.code==='ENOENT')return null;throw e;}
    if(raw.length>4096)throw Error('CUSTODY_ENTRY_TOO_LARGE');
    let p;try{p=JSON.parse(raw);}catch{throw Error('CORRUPT_CUSTODY_ENTRY');}
    const keys=['schema','sourceId','episodeId','sourceRevision','controllerRevision',
      'sourcePayloadSha256','receiverAckSha256','correlationId','admittedAtMs','recordDigest'];
    if(!exact(p,keys)||p.schema!=='rosevear.ql423.custody.v1'||
      p.sourceId!=='rosevear-ai-hub'||!OPAQUE.test(p.episodeId??'')||
      !SHA.test(p.sourceRevision??'')||!SHA.test(p.controllerRevision??'')||
      !HEX.test(p.sourcePayloadSha256??'')||!HEX.test(p.receiverAckSha256??'')||
      !OPAQUE.test(p.correlationId??'')||
      !Number.isSafeInteger(p.admittedAtMs)||p.admittedAtMs<0||
      !eq(p.recordDigest,digest(Buffer.from(stable({...p,recordDigest:undefined})))))
      throw Error('CUSTODY_RECORD_CORRUPTED');
    return p;
  };
  const writeOnce=(key,input)=>{
    if(read(key))throw Error('CUSTODY_REPLAY_DETECTED');
    if(input?.sourceId!=='rosevear-ai-hub'||key!==input.sourceId+':'+input.episodeId||
      !SHA.test(input.sourceRevision??'')||!SHA.test(input.controllerRevision??''))
      throw Error('CUSTODY_SOURCE_MISMATCH');
    const p={schema:'rosevear.ql423.custody.v1',sourceId:input.sourceId,
      episodeId:input.episodeId,sourceRevision:input.sourceRevision,
      controllerRevision:input.controllerRevision,
      sourcePayloadSha256:input.sourcePayloadSha256,
      receiverAckSha256:input.receiverAckSha256,
      correlationId:input.correlationId,admittedAtMs:input.admittedAtMs};
    p.recordDigest=digest(Buffer.from(stable(p)));
    const fd=openSync(file(key),'wx',0o600);
    try{writeFileSync(fd,stable(p));fsyncSync(fd);}finally{closeSync(fd);}
    return read(key);
  };
  return Object.freeze({read,writeOnce});
}

/** Verify real Ed25519 QL-411 source and QL-414 receiver ACK signatures,
 * then commit one metadata-only receipt to the protected replay store.
 * Source and receiver pins must be independently enrolled on the backend. */
export function admitQl423OriginalHostCustody({sourceEnvelope,receiverAck},{
  sourceSignerPin,receiverSignerPin,sourcePinIndependentlyVerified=false,
  receiverPinIndependentlyVerified=false,originalHostWitnessVerified=false,
  transportAuthenticated=false,ownerAuthorized=false,independentReviewerAuthorized=false,
  expectedSourceRevision,controllerRevision,nowMs,store
}={}){
  if(!sourcePinIndependentlyVerified||!receiverPinIndependentlyVerified||
    !originalHostWitnessVerified||!transportAuthenticated||!ownerAuthorized||
    !independentReviewerAuthorized||!SHA.test(expectedSourceRevision??'')||
    !SHA.test(controllerRevision??'')||!validMs(nowMs,nowMs)||
    typeof store?.read!=='function'||typeof store?.writeOnce!=='function')
    return hold('PROTECTED_OWNER_SIGNER_OR_HOST_AUTHORITY_MISSING');
  const p=sourceEnvelope?.payload,a=receiverAck?.payload;
  if(p?.sourceId!=='rosevear-ai-hub'||p?.hostId!=='DESKTOP-AE894KC'||
    p?.sourceRevision!==expectedSourceRevision||!OPAQUE.test(p?.episodeId??'')||
    !iso(p?.capturedAt)||Date.parse(p.capturedAt)>nowMs||
    nowMs-Date.parse(p.capturedAt)>WINDOW||
    a?.sourceId!==p.sourceId||a?.hostId!==p.hostId||
    a?.sourceRevision!==p.sourceRevision||a?.sourceEpisodeId!==p.episodeId||
    !eq(a?.sourcePayloadSha256,digest(Buffer.from(stable(p))))||
    !iso(a?.receivedAt)||Date.parse(a.receivedAt)<Date.parse(p.capturedAt)||
    Date.parse(a.receivedAt)>nowMs||!OPAQUE.test(a?.correlationId??''))
    return hold('ORIGINAL_HOST_SOURCE_ACK_BINDING_INVALID');
  if(!verifySigned(p,sourceEnvelope.signature,sourceSignerPin))
    return hold('ORIGINAL_HOST_SIGNATURE_REJECTED');
  const ack=reviewQl414OwnerDecision(receiverAck,{
    trustedReceiverPublicPin:receiverSignerPin,expectedSourceRevision,
    ownerApproval:true,independentReviewerApproval:true,nowMs});
  if(ack.state!=='OWNER_SUPERVISED_ACK_REVIEWED')
    return hold('RECEIVER_ACK_SIGNATURE_REJECTED');
  const key=p.sourceId+':'+p.episodeId;
  const record={sourceId:p.sourceId,episodeId:p.episodeId,
    sourceRevision:p.sourceRevision,controllerRevision,
    sourcePayloadSha256:digest(Buffer.from(stable(p))),
    receiverAckSha256:digest(Buffer.from(stable(a))),
    correlationId:a.correlationId,admittedAtMs:nowMs};
  try{if(store.read(key))return hold('DURABLE_RECEIPT_REPLAY_REJECTED');}
  catch{return hold('PROTECTED_REPLAY_READ_FAILED');}
  const adapter={has:k=>Boolean(store.read(k)),add:k=>store.writeOnce(k,record)};
  let checked;
  try{checked=reviewQl411ProtectedTelemetry(sourceEnvelope,{
    publicKeySpkiBase64:sourceSignerPin,replayStore:adapter,
    nowMs,expectedRevision:expectedSourceRevision});}
  catch{return hold('PROTECTED_CUSTODY_ADMISSION_FAILED');}
  if(!checked?.verified)return hold(checked?.reason??'SOURCE_METADATA_NOT_VERIFIED');
  try{
    const persisted=store.read(key);
    if(!persisted||!eq(persisted.sourcePayloadSha256,record.sourcePayloadSha256)||
      !eq(persisted.receiverAckSha256,record.receiverAckSha256))
      return hold('DURABLE_COMMIT_READBACK_FAILED');
    return {...hold('SIGNED_ONE_TEST_COMMITTED_NO_ACTIVATION'),
      state:'SIGNED_ORIGINAL_HOST_CUSTODY_COMMITTED',
      sourceId:p.sourceId,hostId:p.hostId,episodeId:p.episodeId,
      sourceRevision:p.sourceRevision,controllerRevision,
      correlationId:a.correlationId,recordDigest:persisted.recordDigest};
  }catch{return hold('DURABLE_COMMIT_READBACK_FAILED');}
}

/** Re-open the protected store in a separate reader process, reconcile the
 * QL-422 chain and independently signed replay restoration receipt per
 * Master, and verify separately signed owner/reviewer decision metadata.
 * Never operates the receiver, changes CONNECTED or runs Windows recovery. */
export function reviewQl423ReplayRestorationAndActivation({
  ql422Inputs,sourceId='rosevear-ai-hub',episodeId,
  restoredMasterReceipts=[],operatorDecision,store,restoredStore
},{
  masterPins={},ownerPin,reviewerPin,
  masterPinsIndependentlyVerified=false,ownerReviewerCustodyVerified=false,
  protectedRestartWitnessVerified=false,independentStoreReaderVerified=false,
  ownerActivationSessionAuthorized=false,nowMs
}={}){
  if(!ql422Inputs||!OPAQUE.test(episodeId??'')||
    sourceId!=='rosevear-ai-hub'||!validMs(nowMs,nowMs)||
    !masterPinsIndependentlyVerified||!ownerReviewerCustodyVerified||
    !protectedRestartWitnessVerified||!independentStoreReaderVerified||
    !ownerActivationSessionAuthorized||typeof store?.read!=='function'||
    typeof restoredStore?.read!=='function'||
    !Array.isArray(restoredMasterReceipts)||restoredMasterReceipts.length!==3)
    return hold('PROTECTED_RESTORATION_AUTHORITY_UNAVAILABLE');
  const prior=buildQl422WitnessLedgerRecheck({...ql422Inputs,nowMs});
  if(prior.state!=='PROTECTED_QL422_RECONCILIATION')
    return hold('QL422_CHAIN_UNVERIFIED_'+prior.reason);
  const caseRow=prior.cases.find(c=>c.sourceId===sourceId&&c.episodeId===episodeId);
  if(!caseRow||caseRow.recheckState!=='READY_FOR_SUPERVISED_OWNER_RECHECK_NOT_ACCEPTED')
    return hold('QL422_OPERATOR_RECHECK_NOT_ELIGIBLE');
  const key=sourceId+':'+episodeId;
  let first,restored;
  try{first=store.read(key);restored=restoredStore.read(key);}
  catch{return hold('RESTORED_STORE_UNREADABLE');}
  if(!first||!restored||!eq(first.recordDigest,restored.recordDigest)||
    first.episodeId!==episodeId||first.sourceRevision!==caseRow.sourceRevision||
    first.controllerRevision!==prior.controllerRevision||
    first.admittedAtMs>nowMs||nowMs-first.admittedAtMs>WINDOW)
    return hold('ORIGINAL_CUSTODY_RESTART_MISMATCH');
  const witness=ql422Inputs.originalHostWitnesses?.find(w=>
    w.sourceId===sourceId&&w.episodeId===episodeId);
  if(!witness||!eq(witness.sourceReceiptDigest,first.sourcePayloadSha256)||
    !eq(witness.receiverAckDigest,first.receiverAckSha256))
    return hold('QL422_WITNESS_ORIGINAL_CUSTODY_MISMATCH');
  const original=ql422Inputs.durableMasterLedger?.filter(x=>
    x.sourceId===sourceId&&x.episodeId===episodeId)??[];
  const seen=new Set(),restoredIds=[];
  for(const item of restoredMasterReceipts){
    const p=item?.payload;
    if(!exact(item,['payload','signature'])||
      !exact(p,['schema','sourceId','episodeId','sourceRevision',
        'controllerRevision','masterId','ledgerEntryId','ledgerDigest',
        'sourceCustodyDigest','restoredAt','checkpointId'])||
      p.schema!=='rosevear.ql423.master-replay-restored.v1'||
      p.sourceId!==sourceId||p.episodeId!==episodeId||
      p.sourceRevision!==caseRow.sourceRevision||
      p.controllerRevision!==prior.controllerRevision||
      !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
      !OPAQUE.test(p.ledgerEntryId??'')||!OPAQUE.test(p.checkpointId??'')||
      !eq(p.sourceCustodyDigest,first.recordDigest)||
      !iso(p.restoredAt)||Date.parse(p.restoredAt)>nowMs||
      nowMs-Date.parse(p.restoredAt)>WINDOW||
      !verifySigned(p,item.signature,masterPins[p.masterId]))
      return hold('MASTER_RESTORATION_SIGNATURE_OR_BOUNDARY_INVALID');
    const priorEntry=original.find(x=>x.masterId===p.masterId);
    if(!priorEntry||priorEntry.ledgerEntryId!==p.ledgerEntryId||
      !eq(priorEntry.ledgerDigest,p.ledgerDigest))
      return hold('MASTER_RESTORED_LEDGER_DIGEST_MISMATCH');
    seen.add(p.masterId);restoredIds.push({masterId:p.masterId,
      checkpointId:p.checkpointId,ledgerEntryId:p.ledgerEntryId});
  }
  if(MASTERS.some(m=>!seen.has(m)))return hold('THREE_MASTER_RESTORE_INCOMPLETE');
  const d=operatorDecision?.payload;
  if(!exact(operatorDecision,['payload','ownerSignature','reviewerSignature'])||
    !exact(d,['schema','sourceId','episodeId','sourceRevision','controllerRevision',
      'action','ownerId','reviewerId','decisionId','decidedAt',
      'terminalLedgerDigest','sourceCustodyDigest'])||
    d.schema!=='rosevear.ql423.protected-activation-decision.v1'||
    d.sourceId!==sourceId||d.episodeId!==episodeId||
    d.sourceRevision!==caseRow.sourceRevision||
    d.controllerRevision!==prior.controllerRevision||
    !['REQUEST_ACTIVATION_REVIEW','REOPEN','MAINTAIN_HOLD'].includes(d.action)||
    !OPAQUE.test(d.ownerId??'')||!OPAQUE.test(d.reviewerId??'')||
    d.ownerId===d.reviewerId||!OPAQUE.test(d.decisionId??'')||
    !iso(d.decidedAt)||Date.parse(d.decidedAt)>nowMs||
    nowMs-Date.parse(d.decidedAt)>WINDOW||
    !eq(d.terminalLedgerDigest,caseRow.lastLedgerDigest)||
    !eq(d.sourceCustodyDigest,first.recordDigest)||
    !verifySigned(d,operatorDecision.ownerSignature,ownerPin)||
    !verifySigned(d,operatorDecision.reviewerSignature,reviewerPin))
    return hold('OWNER_AND_REVIEWER_SIGNED_DECISION_INVALID');
  const status=d.action==='REOPEN'?'HOLD_REOPENED':
    d.action==='MAINTAIN_HOLD'?'HOLD_OWNER_CONTINUITY':
      'READY_FOR_SEPARATE_SUPERVISED_ACTIVATION_NOT_EXECUTED';
  return {...hold('PROTECTED_REVIEW_ONLY_NO_RECEIVER_ACTIVATION'),
    state:'THREE_MASTER_REPLAY_RESTORED_FOR_REVIEW',
    sourceId,episodeId,sourceRevision:caseRow.sourceRevision,
    controllerRevision:prior.controllerRevision,
    recordDigest:first.recordDigest,restoredMasters:restoredIds,
    decisionId:d.decisionId,decision:d.action,activationReviewStatus:status};
}
