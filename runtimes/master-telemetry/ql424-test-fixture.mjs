import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildQl418OwnerSlaAudit} from './ql418-owner-sla-audit.mjs';
import {ql420EscalationSlaDigest,buildQl420IncidentTimeline} from './ql420-incident-timeline.mjs';
import {ql421ClosureDigest,ql421OwnerAuditDigest} from './ql421-closure-handoff-history.mjs';
import {ql422WitnessDigest,ql422LedgerDigest,ql422OperatorRecheckDigest} from './ql422-original-host-witness.mjs';
import {openQl423DurableCustodyStore,admitQl423OriginalHostCustody,
  reviewQl423ReplayRestorationAndActivation} from './ql423-signed-custody-replay.mjs';

const now=Date.parse('2026-11-12T05:30:00Z');
const revision='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const controllerRevision='a0eea834c7e8d62232a70b13b06688c6b9b4babc';
const sourceId='rosevear-ai-hub',episodeId='original_episode_001';
const masters=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(typeof p==='string'?p:JSON.stringify(p)).digest('hex');
const date=ms=>new Date(ms).toISOString();
const key=()=>{const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  return {pin:publicKey.export({format:'der',type:'spki'}).toString('base64'),privateKey};};
const signIt=(payload,who)=>sign(null,Buffer.from(JSON.stringify(payload)),who.privateKey).toString('base64');
const sender=key(),receiver=key(),owner=key(),reviewer=key();
const masterKeys=Object.fromEntries(masters.map(m=>[m,key()]));
const clone=x=>structuredClone(x);
const signed=()=>{
 const p={schema:'rosevear.ql411.ree-telemetry.v1',sourceId,hostId:'DESKTOP-AE894KC',
   sourceRevision:revision,capturedAt:date(now-30000),episodeId,
   samples:[
     {observationId:'sample_00001',service:'hub_api_8765',
       observedAt:date(now-50000),reachable:true,latencyMs:12},
     {observationId:'sample_00002',service:'hub_api_8765',
       observedAt:date(now-40000),reachable:true,latencyMs:14}
   ]};
 const ack={schema:'rosevear.master360.ql414.receiver-ack.v1',
   operation:'MASTER360_ONE_TEST_READ_ONLY',sourceId,hostId:'DESKTOP-AE894KC',
   sourceRevision:revision,sourceEpisodeId:episodeId,
   correlationId:'correlation_00001',receivedAt:date(now-29000),
   receiverKeyId:'receiver_00001',sourcePayloadSha256:hash(p),
   decision:'METADATA_VERIFIED_FOR_OWNER_REVIEW',connection:'HOLD'};
 return {sourceEnvelope:{payload:p,signature:signIt(p,sender)},
   receiverAck:{payload:ack,signature:signIt(ack,receiver)}};
};
const dirs=[];
const directory=()=>{const d=mkdtempSync(join(tmpdir(),'ql423-'));dirs.push(d);return d;};

const admissionOpts=(store,when=now-12000)=>({
  sourceSignerPin:sender.pin,receiverSignerPin:receiver.pin,
  sourcePinIndependentlyVerified:true,receiverPinIndependentlyVerified:true,
  originalHostWitnessVerified:true,transportAuthenticated:true,ownerAuthorized:true,
  independentReviewerAuthorized:true,expectedSourceRevision:revision,
  controllerRevision,nowMs:when,store
});
function preparedCase(sourcePayload,ackPayload){
 const observedAtMs=now-60000,notifiedAtMs=now-35000;
 const notificationId='notify_original_001',notificationDigest='b'.repeat(64);
 const timelineDigest=ql420EscalationSlaDigest({sourceId,episodeId,
   sourceRevision:revision,observedAtMs,deadlineAtMs:observedAtMs+900000,
   notificationId,notificationDigest,notifiedAtMs});
 const a={controllerRevision,nowMs:now,protectedReadAuthorized:true,
   protectedExportAuthorized:true,independentAuditReviewerVerified:true,
   episodes:[{sourceId,episodeId,sourceRevision:revision,observedAtMs,
     signatureStatus:'VERIFIED',replayStatus:'COMMITTED',receiverAckStatus:'MATCHED'}],
   decisions:[{sourceId,episodeId,outcome:'ACCEPTED_FOR_REVIEW',
     decidedAtMs:now-20000,ownerVerified:true,independentReviewerVerified:true}],
   assignments:[{sourceId,episodeId,ownerId:'owner_001',ownerRole:'MASTER_OPERATOR',
     ownerVerified:true,independentReviewerVerified:true,assignedAtMs:now-50000,
     custodyDigest:'a'.repeat(64),action:'ASSIGNED'}],
   escalations:[{sourceId,episodeId,notificationId,notificationDigest,
     occurredAtMs:notifiedAtMs,deliveryState:'DELIVERED',
     historicalSeverity:'CRITICAL',historicalDiscrepancyDigest:'d'.repeat(64),
     historicalDiscrepancyVerified:true,independentHistoricalReviewerVerified:true,
     operatorVerified:true,independentReviewerVerified:true}],
   slaEvidence:[{sourceId,episodeId,notificationId,timelineDigest,
     reviewedAtMs:now-10000,controllerRevision,
     protectedCustodyCommitted:true,independentReviewerVerified:true}],
   closureReviews:[{sourceId,episodeId,reviewId:'review_original_001',
     ownerId:'owner_001',reviewerId:'reviewer_001',sourceRevision:revision,
     custodyDigest:'c'.repeat(64),action:'REQUEST_CLOSURE',
     reviewedAtMs:now-8000,protectedOwnerVerified:true,
     independentReviewerVerified:true,durableReviewCommitted:true}]};
 const audit=buildQl418OwnerSlaAudit(a);
 assert.equal(audit.state,'PROTECTED_OWNER_SLA_WORKLIST');
 a.exportReceipts=[{receiptId:'export_receipt_001',
   auditSha256:hash(audit.auditExport),reviewedAtMs:now-7000,
   controllerRevision,ownerVerified:true,independentReviewerVerified:true}];
 const incident=buildQl420IncidentTimeline(a).incidents[0];
 assert.equal(incident.closureStatus,'OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED');
 const closureDigest=ql421ClosureDigest({sourceId,episodeId,
   sourceRevision:revision,controllerRevision,
   closureReviewId:incident.closureReviewId,ownerId:'owner_001',
   chronologyDigest:hash(incident.chronology)});
 a.closureEvidence=[{sourceId,episodeId,sourceRevision:revision,
   controllerRevision,proofId:'closure_proof_001',
   closureReviewId:incident.closureReviewId,ownerId:'owner_001',
   closureDigest,verifiedAtMs:now-6000,
   independentOriginalHostReceiptVerified:true,signedReceiverAckVerified:true,
   durableReplayCommitted:true,protectedOwnerVerified:true,
   independentReviewerVerified:true,protectedCustodyCommitted:true}];
 a.masterHandoffs=masters.map((masterId,i)=>({sourceId,episodeId,
   sourceRevision:revision,controllerRevision,masterId,
   receiptId:'handoff_receipt_00'+(i+1),closureDigest,
   receivedAtMs:now-5000+i*1000,
   independentSignerVerified:true,protectedReplayCommitted:true,
   independentReceiverAckCorrelated:true}));
 const ownerEntry={sourceId,episodeId,sourceRevision:revision,
   entryId:'owner_history_001',action:'REQUEST_ACCEPTANCE',
   atMs:now-1000,ownerId:'owner_001',reviewerId:'reviewer_001',
   previousDigest:'0'.repeat(64),protectedOwnerVerified:true,
   independentReviewerVerified:true,appendOnlyCustodyCommitted:true};
 ownerEntry.entryDigest=ql421OwnerAuditDigest({...ownerEntry,closureDigest});
 a.ownerAuditHistory=[ownerEntry];
 const witness={sourceId,episodeId,sourceRevision:revision,controllerRevision,
   hostId:'DESKTOP-AE894KC',witnessId:'original_witness_001',
   sourceReceiptId:episodeId,sourceReceiptDigest:hash(sourcePayload),
   receiverAckDigest:hash(ackPayload),closureDigest,
   witnessedAtMs:now-5500,independentHostIdentityVerified:true,
   independentSourceSignerVerified:true,receiverAckSignatureVerified:true,
   durableSourceReplayCommitted:true,independentWitnessCustodyVerified:true};
 witness.witnessDigest=ql422WitnessDigest(witness);
 a.originalHostWitnesses=[witness];
 a.durableMasterLedger=[];
 for(let i=0;i<3;i++){
   const entry={sourceId,episodeId,sourceRevision:revision,controllerRevision,
     masterId:masters[i],handoffReceiptId:a.masterHandoffs[i].receiptId,
     closureDigest,witnessDigest:witness.witnessDigest,
     ledgerEntryId:'durable_ledger_00'+(i+1),
     sequence:i+1,committedAtMs:now-2500+i*500,
     previousDigest:a.durableMasterLedger.at(-1)?.ledgerDigest??'0'.repeat(64),
     trustedMasterSignerVerified:true,durableStoreCommitVerified:true,
     independentLedgerReaderVerified:true};
   entry.ledgerDigest=ql422LedgerDigest(entry);a.durableMasterLedger.push(entry);
 }
 const q={sourceId,episodeId,sourceRevision:revision,controllerRevision,
   decisionId:'operator_recheck_001',action:'REQUEST_SUPERVISED_ACCEPTANCE',
   ownerId:'owner_001',reviewerId:'reviewer_001',decidedAtMs:now-500,
   priorOwnerAuditDigest:ownerEntry.entryDigest,
   witnessDigest:witness.witnessDigest,
   terminalLedgerDigest:a.durableMasterLedger.at(-1).ledgerDigest,
   protectedOwnerAuthorityVerified:true,independentReviewerVerified:true,
   durableDecisionCommitted:true};
 q.decisionDigest=ql422OperatorRecheckDigest(q);a.operatorRechecks=[q];
 return a;
}
function restoration(){
 const dir=directory(),store=openQl423DurableCustodyStore(dir),pair=signed();
 const admitted=admitQl423OriginalHostCustody(pair,admissionOpts(store));
 assert.equal(admitted.state,'SIGNED_ORIGINAL_HOST_CUSTODY_COMMITTED');
 const ql422Inputs=preparedCase(pair.sourceEnvelope.payload,pair.receiverAck.payload);
 const stored=store.read(sourceId+':'+episodeId);
 const restoredMasterReceipts=ql422Inputs.durableMasterLedger.map((entry,i)=>{
   const p={schema:'rosevear.ql423.master-replay-restored.v1',sourceId,episodeId,
     sourceRevision:revision,controllerRevision,masterId:entry.masterId,
     ledgerEntryId:entry.ledgerEntryId,ledgerDigest:entry.ledgerDigest,
     sourceCustodyDigest:stored.recordDigest,restoredAt:date(now-1000),
     checkpointId:'checkpoint_000'+(i+1)};
   return {payload:p,signature:signIt(p,masterKeys[entry.masterId])};
 });
 const decisionPayload={schema:'rosevear.ql423.protected-activation-decision.v1',
   sourceId,episodeId,sourceRevision:revision,controllerRevision,
   action:'REQUEST_ACTIVATION_REVIEW',ownerId:'owner_identity_001',
   reviewerId:'reviewer_identity_001',decisionId:'decision_000001',
   decidedAt:date(now-100),terminalLedgerDigest:ql422Inputs.durableMasterLedger.at(-1).ledgerDigest,
   sourceCustodyDigest:stored.recordDigest};
 const operatorDecision={payload:decisionPayload,
   ownerSignature:signIt(decisionPayload,owner),
   reviewerSignature:signIt(decisionPayload,reviewer)};
 const input={sourceId,episodeId,ql422Inputs,restoredMasterReceipts,
   operatorDecision,store,restoredStore:openQl423DurableCustodyStore(dir)};
 const opts={masterPins:Object.fromEntries(masters.map(m=>[m,masterKeys[m].pin])),
   ownerPin:owner.pin,reviewerPin:reviewer.pin,
   masterPinsIndependentlyVerified:true,ownerReviewerCustodyVerified:true,
   protectedRestartWitnessVerified:true,independentStoreReaderVerified:true,
   ownerActivationSessionAuthorized:true,nowMs:now};
 return {input,opts};
}

export {restoration,signed,admissionOpts,directory,sender,receiver,owner,reviewer,masterKeys,masters,sourceId,episodeId,now,revision,controllerRevision,signIt,hash,date};
export function cleanupQl424Fixture(){for(const d of dirs)rmSync(d,{recursive:true,force:true});}
