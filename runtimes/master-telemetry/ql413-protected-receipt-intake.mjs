import {createPublicKey,verify} from 'node:crypto';

const SHA=/^[a-f0-9]{40}$/;
const ISO=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s;
const SOURCES=['ai-data-platform','rosevear-comms-hub','rosevear-ai-hub'];
const AXES=['installedRelease','persistentHistory','signedTelemetry','replayProtection','incidentAcceptance'];
const exact=(value,fields)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k));
const denied=(reason)=>({state:'HOLD',reason,connection:'HOLD',receiver:'OFF',
  masterSync:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',verifiedReceipts:[]});

/** Protected server-side receipt inspection. Caller supplies trusted signer pins
 * and expected deployed revisions independently of each receipt. No endpoint,
 * key enrollment, remote execution or automatic connection transition. */
export function reviewQl413ThreeMasterReceipts(receipts,{pins,expectedRevisions,
  nowMs,ownerSessionApproved=false,independentReviewerApproved=false,
  protectedReplayLedger}={}){
  if(!Array.isArray(receipts)||receipts.length!==3||!pins||!expectedRevisions||
    !Number.isFinite(nowMs)||!protectedReplayLedger||
    typeof protectedReplayLedger.has!=='function'||
    typeof protectedReplayLedger.add!=='function')return denied('PROTECTED_RECEIPT_AUTHORITY_UNAVAILABLE');
  const seen=new Set(),verifiedReceipts=[];
  for(const receipt of receipts){
    if(!exact(receipt,['payload','signature'])||
      !exact(receipt.payload,['schema','sourceId','hostId','revision','issuedAt','receiptId','evidence'])||
      receipt.payload.schema!=='rosevear.master360.protected-receipt.v1')
      return denied('INVALID_RECEIPT_SCHEMA');
    const p=receipt.payload;
    if(!SOURCES.includes(p.sourceId)||seen.has(p.sourceId)||
      !SHA.test(p.revision??'')||p.revision!==expectedRevisions[p.sourceId]||
      !ISO(p.issuedAt)||Date.parse(p.issuedAt)>nowMs||
      nowMs-Date.parse(p.issuedAt)>5*60_000||
      !/^[a-zA-Z0-9_-]{12,96}$/.test(p.receiptId??'')||
      !exact(p.evidence,AXES)||
      !AXES.every(k=>['VERIFIED','HOLD'].includes(p.evidence[k]))||
      (p.sourceId==='rosevear-ai-hub'&&p.hostId!=='DESKTOP-AE894KC')||
      (p.sourceId!=='rosevear-ai-hub'&&p.hostId!=='PROTECTED_MASTER_RUNTIME'))
      return denied('SOURCE_REVISION_HOST_OR_FRESHNESS_MISMATCH');
    const pin=pins[p.sourceId];
    if(typeof pin!=='string'||typeof receipt.signature!=='string'||
      !/^[A-Za-z0-9+/]{86}==$/.test(receipt.signature))
      return denied('INDEPENDENT_SIGNER_PIN_MISSING');
    try{
      const key=createPublicKey({key:Buffer.from(pin,'base64'),format:'der',type:'spki'});
      if(key.asymmetricKeyType!=='ed25519'||!verify(null,Buffer.from(JSON.stringify(p)),key,
        Buffer.from(receipt.signature,'base64')))return denied('SIGNED_RECEIPT_REJECTED');
    }catch{return denied('SIGNED_RECEIPT_REJECTED');}
    seen.add(p.sourceId);
    const replayKey=`master360:${p.sourceId}:${p.receiptId}`;
    try{if(protectedReplayLedger.has(replayKey))return denied('REPLAYED_MASTER_RECEIPT');}
    catch{return denied('REPLAY_LEDGER_UNAVAILABLE');}
    verifiedReceipts.push({sourceId:p.sourceId,hostId:p.hostId,revision:p.revision,
      issuedAt:p.issuedAt,receiptId:p.receiptId,replayKey,evidence:p.evidence});
  }
  // Reject partial batches before committing, yet never treat a receipt's
  // self-reported VERIFIED fields as independent runtime authority.
  if(seen.size!==3)return denied('MISSING_MASTER_SOURCE');
  try{for(const receipt of verifiedReceipts)protectedReplayLedger.add(receipt.replayKey);}
  catch{return denied('REPLAY_LEDGER_UNAVAILABLE');}
  const evidenceComplete=verifiedReceipts.every(r=>AXES.every(axis=>r.evidence[axis]==='VERIFIED'));
  return {state:'SIGNED_RECEIPTS_REVIEWED',verifiedReceipts,
    telemetry:evidenceComplete?'CLAIMED_VERIFIED_PENDING_INDEPENDENT_RUNTIME_REVIEW':'HOLD',
    ownerGate:ownerSessionApproved&&independentReviewerApproved?'REVIEW_REQUESTED':'HOLD',
    connection:'HOLD',receiver:'OFF',masterSync:'HOLD',
    reason:'RECEIPT_SIGNATURES_ARE_NOT_CONNECTION_AUTHORITY',
    slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}

/** Explicit refusal to auto-release connection: requires a separate hardened
 * trust activation workflow outside this read-only intake contract. */
export function resolveQl413Connection(readModel,{ownerApproval,independentRuntimeAttestation}={}){
  return {...denied(!ownerApproval?'OWNER_AUTHORIZATION_MISSING':
    !independentRuntimeAttestation?'INDEPENDENT_RUNTIME_ATTESTATION_MISSING':
      'PROTECTED_CONNECTION_ACTIVATION_NOT_IMPLEMENTED'),
    telemetry:readModel?.telemetry??'HOLD',
    nextAction:'PROTECTED_MANUAL_ENROLLMENT_AND_SIGNED_RECEIVER_ACCEPTANCE'};
}
