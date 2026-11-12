import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildQl418OwnerSlaAudit} from './ql418-owner-sla-audit.mjs';
import {buildQl420IncidentTimeline,ql420EscalationSlaDigest} from './ql420-incident-timeline.mjs';
import {ql421ClosureDigest,ql421OwnerAuditDigest} from './ql421-closure-handoff-history.mjs';
import {buildQl422WitnessLedgerRecheck as run,ql422WitnessDigest,
  ql422LedgerDigest,ql422OperatorRecheckDigest} from './ql422-original-host-witness.mjs';

const controllerRevision='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const sourceId='rosevear-ai-hub',episodeId='original_episode_001';
const now=Date.parse('2026-11-11T16:00:00Z');
const digest=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const clone=x=>structuredClone(x);
function base(){
 const observedAtMs=now-60_000,notifiedAtMs=now-35_000;
 const notificationId='notify_original_001',notificationDigest='b'.repeat(64);
 const timelineDigest=ql420EscalationSlaDigest({sourceId,episodeId,
   sourceRevision:controllerRevision,observedAtMs,
   deadlineAtMs:observedAtMs+900_000,notificationId,
   notificationDigest,notifiedAtMs});
 const a={
  controllerRevision,nowMs:now,protectedReadAuthorized:true,
  protectedExportAuthorized:true,independentAuditReviewerVerified:true,
  episodes:[{sourceId,episodeId,sourceRevision:controllerRevision,
    observedAtMs,signatureStatus:'VERIFIED',replayStatus:'COMMITTED',
    receiverAckStatus:'MATCHED'}],
  decisions:[{sourceId,episodeId,outcome:'ACCEPTED_FOR_REVIEW',
    decidedAtMs:now-20_000,ownerVerified:true,
    independentReviewerVerified:true}],
  assignments:[{sourceId,episodeId,ownerId:'owner_001',
    ownerRole:'MASTER_OPERATOR',ownerVerified:true,independentReviewerVerified:true,
    assignedAtMs:now-50_000,custodyDigest:'a'.repeat(64),action:'ASSIGNED'}],
  escalations:[{sourceId,episodeId,notificationId,notificationDigest,
    occurredAtMs:notifiedAtMs,deliveryState:'DELIVERED',
    historicalSeverity:'CRITICAL',
    historicalDiscrepancyDigest:'d'.repeat(64),
    historicalDiscrepancyVerified:true,
    independentHistoricalReviewerVerified:true,
    operatorVerified:true,independentReviewerVerified:true}],
  slaEvidence:[{sourceId,episodeId,notificationId,timelineDigest,
    reviewedAtMs:now-10_000,controllerRevision,
    protectedCustodyCommitted:true,independentReviewerVerified:true}],
  closureReviews:[{sourceId,episodeId,reviewId:'review_original_001',
    ownerId:'owner_001',reviewerId:'reviewer_001',
    sourceRevision:controllerRevision,custodyDigest:'c'.repeat(64),
    action:'REQUEST_CLOSURE',reviewedAtMs:now-8000,
    protectedOwnerVerified:true,independentReviewerVerified:true,
    durableReviewCommitted:true}]
 };
 const audit=buildQl418OwnerSlaAudit(a);
 assert.equal(audit.state,'PROTECTED_OWNER_SLA_WORKLIST');
 a.exportReceipts=[{receiptId:'export_receipt_001',
   auditSha256:createHash('sha256').update(audit.auditExport,'utf8').digest('hex'),
   reviewedAtMs:now-7000,controllerRevision,
   ownerVerified:true,independentReviewerVerified:true}];
 const prior=buildQl420IncidentTimeline(a),incident=prior.incidents[0];
 assert.equal(incident.closureStatus,'OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED');
 const closureDigest=ql421ClosureDigest({sourceId,episodeId,
   sourceRevision:controllerRevision,controllerRevision,
   closureReviewId:incident.closureReviewId,ownerId:'owner_001',
   chronologyDigest:digest(incident.chronology)});
 a.closureEvidence=[{sourceId,episodeId,sourceRevision:controllerRevision,
   controllerRevision,proofId:'closure_proof_001',
   closureReviewId:incident.closureReviewId,ownerId:'owner_001',
   closureDigest,verifiedAtMs:now-6000,
   independentOriginalHostReceiptVerified:true,signedReceiverAckVerified:true,
   durableReplayCommitted:true,protectedOwnerVerified:true,
   independentReviewerVerified:true,protectedCustodyCommitted:true}];
 a.masterHandoffs=MASTERS.map((masterId,i)=>({
   masterId,sourceId,episodeId,sourceRevision:controllerRevision,
   controllerRevision,receiptId:'handoff_receipt_'+String(i+1).padStart(3,'0'),
   closureDigest,receivedAtMs:now-5000+i*1000,
   independentSignerVerified:true,protectedReplayCommitted:true,
   independentReceiverAckCorrelated:true
 }));
 const first={sourceId,episodeId,sourceRevision:controllerRevision,
   entryId:'owner_history_001',action:'REQUEST_ACCEPTANCE',
   atMs:now-1000,ownerId:'owner_001',reviewerId:'reviewer_001',
   previousDigest:'0'.repeat(64),protectedOwnerVerified:true,
   independentReviewerVerified:true,appendOnlyCustodyCommitted:true};
 first.entryDigest=ql421OwnerAuditDigest({...first,closureDigest});
 a.ownerAuditHistory=[first];
 return a;
}
function complete(){
 const a=base(),c=a.closureEvidence[0];
 const w={sourceId,episodeId,sourceRevision:controllerRevision,controllerRevision,
   hostId:'DESKTOP-AE894KC',witnessId:'original_witness_001',
   sourceReceiptId:'signed_source_001',sourceReceiptDigest:'e'.repeat(64),
   receiverAckDigest:'f'.repeat(64),closureDigest:c.closureDigest,
   witnessedAtMs:now-5500,independentHostIdentityVerified:true,
   independentSourceSignerVerified:true,receiverAckSignatureVerified:true,
   durableSourceReplayCommitted:true,independentWitnessCustodyVerified:true};
 w.witnessDigest=ql422WitnessDigest(w);
 a.originalHostWitnesses=[w];a.durableMasterLedger=[];
 for(let i=0;i<3;i++){
   const r={sourceId,episodeId,sourceRevision:controllerRevision,
     controllerRevision,masterId:MASTERS[i],
     handoffReceiptId:a.masterHandoffs[i].receiptId,
     closureDigest:c.closureDigest,witnessDigest:w.witnessDigest,
     ledgerEntryId:'durable_ledger_00'+(i+1),sequence:i+1,
     committedAtMs:now-2500+i*500,
     previousDigest:a.durableMasterLedger.at(-1)?.ledgerDigest??'0'.repeat(64),
     trustedMasterSignerVerified:true,durableStoreCommitVerified:true,
     independentLedgerReaderVerified:true};
   r.ledgerDigest=ql422LedgerDigest(r);
   a.durableMasterLedger.push(r);
 }
 const last=a.durableMasterLedger.at(-1);
 const d={sourceId,episodeId,sourceRevision:controllerRevision,controllerRevision,
   decisionId:'operator_recheck_001',action:'REQUEST_SUPERVISED_ACCEPTANCE',
   ownerId:'owner_001',reviewerId:'reviewer_001',decidedAtMs:now-500,
   priorOwnerAuditDigest:a.ownerAuditHistory.at(-1).entryDigest,
   witnessDigest:w.witnessDigest,terminalLedgerDigest:last.ledgerDigest,
   protectedOwnerAuthorityVerified:true,independentReviewerVerified:true,
   durableDecisionCommitted:true};
 d.decisionDigest=ql422OperatorRecheckDigest(d);
 a.operatorRechecks=[d];
 return a;
}
test('exact original host and durable three-Master chain can only request supervised review',()=>{
 const r=run(complete());assert.equal(r.state,'PROTECTED_QL422_RECONCILIATION');
 assert.equal(r.totals.readyForSupervisedRecheck,1);
 assert.equal(r.cases[0].recheckState,'READY_FOR_SUPERVISED_OWNER_RECHECK_NOT_ACCEPTED');
 assert.equal(r.cases[0].handoffReceiptCount,3);
 assert.deepEqual(r.cases[0].missingMasters,[]);
 assert.equal(r.receiver,'OFF');assert.equal(r.connection,'HOLD');
 assert.equal(r.ownerAcceptance,'HOLD');assert.equal(r.originalHostUptime,'UNKNOWN');
});
test('original host mismatch, absent signer authority and tampered witness cannot pass',()=>{
 const a=complete();a.originalHostWitnesses[0].hostId='TEMPLAR';
 assert.equal(run(a).reason,'ORIGINAL_HOST_WITNESS_PROOF_UNVERIFIED');
 const b=complete();b.originalHostWitnesses[0].independentSourceSignerVerified=false;
 assert.equal(run(b).reason,'ORIGINAL_HOST_WITNESS_PROOF_UNVERIFIED');
 const c=complete();c.originalHostWitnesses[0].witnessDigest='1'.repeat(64);
 assert.equal(run(c).reason,'WITNESS_EXACT_DIGEST_MISMATCH');
 const d=complete();d.originalHostWitnesses.push(clone(d.originalHostWitnesses[0]));
 assert.equal(run(d).reason,'WITNESS_SOURCE_CLOSURE_OR_REPLAY_MISMATCH');
});
test('missing or unverified durable ledger stays HOLD and cannot recheck acceptance',()=>{
 const a=complete();a.operatorRechecks=[];a.durableMasterLedger.pop();
 const r=run(a);assert.equal(r.cases[0].recheckState,'HOLD_DURABLE_MASTER_LEDGER_INCOMPLETE');
 assert.deepEqual(r.cases[0].missingMasters,['ai-data-platform']);
 const b=complete();b.durableMasterLedger[1].independentLedgerReaderVerified=false;
 assert.equal(run(b).reason,'MASTER_LEDGER_SIGNER_STORE_OR_READER_UNVERIFIED');
 const c=complete();c.durableMasterLedger[1].sequence=1;
 assert.equal(run(c).reason,'MASTER_LEDGER_CHAIN_ORDER_OR_DUPLICATE');
 const d=complete();d.durableMasterLedger[2].ledgerDigest='1'.repeat(64);
 assert.equal(run(d).reason,'MASTER_LEDGER_DIGEST_MISMATCH');
});
test('operator owner/reviewer decision is strictly source- and chain-bound',()=>{
 const a=complete();a.operatorRechecks[0].reviewerId='owner_001';
 assert.equal(run(a).reason,'OPERATOR_DECISION_AUTHORITY_OR_CUSTODY_UNVERIFIED');
 const b=complete();b.operatorRechecks[0].priorOwnerAuditDigest='2'.repeat(64);
 assert.equal(run(b).reason,'OPERATOR_DECISION_CHAIN_OR_SOURCE_MISMATCH');
 const c=complete();c.operatorRechecks[0].decisionDigest='2'.repeat(64);
 assert.equal(run(c).reason,'OPERATOR_DECISION_DIGEST_MISMATCH');
 const d=complete();d.operatorRechecks[0].action='REOPEN';
 d.operatorRechecks[0].decisionDigest=ql422OperatorRecheckDigest(d.operatorRechecks[0]);
 const r=run(d);assert.equal(r.cases[0].recheckState,'HOLD_OPERATOR_REOPENED');
 assert.equal(r.connection,'HOLD');
});
test('missing witness, absent operator decision and untrusted protected read stay fail-closed',()=>{
 const a=base(),r=run(a);
 assert.equal(r.state,'PROTECTED_QL422_RECONCILIATION');
 assert.equal(r.cases[0].recheckState,'HOLD_ORIGINAL_HOST_WITNESS_MISSING');
 const b=complete();b.operatorRechecks=[];
 assert.equal(run(b).cases[0].recheckState,'HOLD_OPERATOR_RECHECK_MISSING');
 const c=complete();c.protectedReadAuthorized=false;
 assert.equal(run(c).state,'HOLD');
});
