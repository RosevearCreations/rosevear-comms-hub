import {createHash,createPublicKey} from 'node:crypto';
import {mkdirSync,openSync,writeFileSync,closeSync,readFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {reviewQl411ProtectedTelemetry} from './ql411-protected-telemetry.mjs';

const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const EPISODE=/^rosevear-ai-hub:[a-zA-Z0-9][a-zA-Z0-9_-]{7,95}$/;
const hold=(reason)=>({state:'HOLD',reason,connection:'HOLD',receiver:'OFF',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

/** Enrollment requires an *independently reviewed* expected SPKI digest and
 * matching host/revision. A value copied from a telemetry envelope is never authority.
 * Caller must protect this function behind independent owner authorization. */
export function reviewQl412SignerCandidate({spkiBase64,independentSha256,
  originalHost,sourceRevision,independentOwnerApproval}={}){
  if(originalHost!=='DESKTOP-AE894KC'||!SHA.test(sourceRevision??'')||
    independentOwnerApproval!==true||!DIGEST.test(independentSha256??''))
    return hold('OWNER_OR_HOST_AUTHORITY_MISSING');
  try{
    const bytes=Buffer.from(spkiBase64,'base64');
    if(bytes.toString('base64')!==spkiBase64||
      createHash('sha256').update(bytes).digest('hex')!==independentSha256)
      return hold('INDEPENDENT_PIN_MISMATCH');
    const key=createPublicKey({key:bytes,format:'der',type:'spki'});
    if(key.asymmetricKeyType!=='ed25519')return hold('SIGNER_KEY_TYPE_REJECTED');
    return {state:'CANDIDATE_REVIEWED',sourceId:'rosevear-ai-hub',originalHost,
      sourceRevision,spkiBase64,pinSha256:independentSha256,connection:'HOLD',
      receiver:'OFF',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
  }catch{return hold('INVALID_SIGNER_PIN');}
}

/** A directory-backed, process-restart durable, append-only replay ledger.
 * O_EXCL makes duplicates fail across independent processes. Caller provides
 * a protected, absolute, non-shared location; never use a browser or git path.
 * Failed writes are treated as replay-store unavailable by the verifier. */
export function openQl412DurableReplayLedger(directory){
  if(typeof directory!=='string'||!directory.startsWith('/')||
    directory.includes('..'))throw Error('PROTECTED_ABSOLUTE_LEDGER_PATH_REQUIRED');
  const root=resolve(directory);
  mkdirSync(root,{recursive:true,mode:0o700});
  const mode=statSync(root).mode&0o777;
  if(mode&0o077)throw Error('REPLAY_LEDGER_PERMISSIONS_UNSAFE');
  const pathFor=(key)=>{
    if(!EPISODE.test(key))throw Error('INVALID_REPLAY_EPISODE_KEY');
    return join(root,createHash('sha256').update(key).digest('hex')+'.used');
  };
  return {
    has(key){try{readFileSync(pathFor(key));return true;}catch(e){
      if(e.code==='ENOENT')return false;throw e;
    }},
    add(key){const file=pathFor(key);const fd=openSync(file,'wx',0o600);
      try{writeFileSync(fd,key+'\n');}finally{closeSync(fd);}
    }
  };
}

/** No endpoint, listener, scheduling, remote action, or trust activation. */
export function reviewQl412ThreeMasterTelemetry(envelope,{enrollment,ledger,
  expectedRevision,nowMs,aiDataControllerRevision}={}){
  if(!enrollment||enrollment.state!=='CANDIDATE_REVIEWED'||!ledger||
    enrollment.sourceRevision!==expectedRevision||
    aiDataControllerRevision!=='4b45b435fa7b6fc83b94e31556648fe4190a9f53')
    return hold('THREE_MASTER_PROTECTED_AUTHORITY_UNAVAILABLE');
  const verified=reviewQl411ProtectedTelemetry(envelope,{publicKeySpkiBase64:enrollment.spkiBase64,
    replayStore:ledger,expectedRevision,nowMs});
  if(!verified.verified)return hold(verified.reason);
  return {...verified,telemetry:'SIGNED_SOURCE_METADATA_VERIFIED',
    signerEnrollment:'CANDIDATE_REVIEWED_NOT_LIVE_ENROLLED',
    replayStore:'DURABLE_EPISODE_COMMITTED',
    aiDataReadModel:{controllerRevision:aiDataControllerRevision,
      sourceRevision:expectedRevision,hostId:verified.hostId,
      capturedAt:verified.capturedAt,services:verified.readModel},
    incidentAcceptance:'OWNER_SUPERVISED_REVIEW_REQUIRED',
    receiver:'OFF',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}

/** Explicit owner-supervised incident acceptance, never network dispatch. */
export function reviewQl412IncidentAcceptance(incident,decision,{ownerAuthorized,
  independentReviewer,sourceRevision}={}){
  if(!ownerAuthorized||!independentReviewer||!SHA.test(sourceRevision??'')||
    incident?.sourceId!=='rosevear-ai-hub'||
    !incident?.correlationKey?.startsWith('rosevear-ai-hub:')||
    decision?.correlationKey!==incident.correlationKey||
    decision?.sourceId!==incident.sourceId||
    !['ACKNOWLEDGED','FOLLOW_UP_REQUIRED'].includes(decision?.status))
    return {...hold('OWNER_SUPERVISION_OR_SOURCE_BOUNDARY_MISSING'),
      incidentAcceptance:'HOLD'};
  return {...hold('OWNER_REVIEW_RECORDED_NO_REMOTE_EXECUTION'),
    incidentAcceptance:'SUPERVISED_READ_ONLY_ACCEPTANCE',
    correlationKey:incident.correlationKey,decision:decision.status,
    sourceRevision,reviewerReference:independentReviewer};
}
