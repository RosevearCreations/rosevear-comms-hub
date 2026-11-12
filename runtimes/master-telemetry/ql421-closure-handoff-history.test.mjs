import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildQl418OwnerSlaAudit} from './ql418-owner-sla-audit.mjs';
import {buildQl420IncidentTimeline,ql420EscalationSlaDigest} from './ql420-incident-timeline.mjs';
import {buildQl421ClosureHandoffHistory as run,
 ql421ClosureDigest,ql421OwnerAuditDigest} from './ql421-closure-handoff-history.mjs';

const controllerRevision='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const sourceId='rosevear-ai-hub',episodeId='original_episode_001';
const now=Date.parse('2026-11-11T16:00:00Z');
const sha=x=>createHash('sha256').update(x,'utf8').digest('hex');
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const copy=x=>structuredClone(x);
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
   auditSha256:sha(audit.auditExport),reviewedAtMs:now-7000,
   controllerRevision,ownerVerified:true,independentReviewerVerified:true}];
 return a;
}
function complete(){
 const a=base(),previous=buildQl420IncidentTimeline(a);
 assert.equal(previous.state,'PROTECTED_THREE_MASTER_TIMELINE');
 const incident=previous.incidents[0];
 assert.equal(incident.closureStatus,'OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED');
 const closureDigest=ql421ClosureDigest({sourceId,episodeId,
   sourceRevision:controllerRevision,controllerRevision,
   closureReviewId:incident.closureReviewId,ownerId:'owner_001',
   chronologyDigest:sha(JSON.stringify(incident.chronology))});
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
test('QL421 requires all three independently verified handoffs and leaves receiver OFF',()=>{
 const a=complete(),r=run(a);
 assert.equal(r.state,'PROTECTED_THREE_MASTER_HANDOFF_REVIEW');
 assert.equal(r.totals.readyForSupervisedDecision,1);
 assert.equal(r.cases[0].handoffState,'READY_FOR_SUPERVISED_OWNER_DECISION');
 assert.deepEqual(r.cases[0].missingMasters,[]);
 assert.equal(r.cases[0].auditHistory[0].action,'REQUEST_ACCEPTANCE');
 assert.equal(r.cases[0].ownerAcceptance,'HOLD');
 assert.equal(r.receiver,'OFF');assert.equal(r.connection,'HOLD');
 assert.equal(r.runtimeUptime,'UNKNOWN');
});
test('missing a Master or original-host custody holds handoff; no owner request bypass',()=>{
 const a=complete();a.ownerAuditHistory=[];a.masterHandoffs.pop();
 const r=run(a);
 assert.equal(r.cases[0].handoffState,'HOLD_THREE_MASTER_HANDOFF_INCOMPLETE');
 assert.deepEqual(r.cases[0].missingMasters,['ai-data-platform']);
 const b=complete();b.closureEvidence[0].independentOriginalHostReceiptVerified=false;
 assert.equal(run(b).reason,'CLOSURE_EVIDENCE_AUTHORITY_OR_CUSTODY_UNVERIFIED');
 const c=complete();c.masterHandoffs.pop();
 assert.equal(run(c).reason,'OWNER_ACCEPTANCE_REQUEST_LACKS_THREE_MASTER_PROOF');
});
test('tampered revision, digest, duplicate handoff and source confusion fail closed',()=>{
 const a=complete();a.closureEvidence[0].closureDigest='f'.repeat(64);
 assert.equal(run(a).reason,'CLOSURE_EVIDENCE_DIGEST_OR_TIME_MISMATCH');
 const b=complete();b.masterHandoffs[0].sourceRevision='f'.repeat(40);
 assert.equal(run(b).reason,'MASTER_HANDOFF_SOURCE_OR_RECEIPT_MISMATCH');
 const c=complete();c.masterHandoffs[1].masterId=c.masterHandoffs[0].masterId;
 assert.equal(run(c).reason,'DUPLICATE_MASTER_HANDOFF');
 const d=complete();d.ownerAuditHistory[0].sourceId='ai-data-platform';
 assert.equal(run(d).reason,'OWNER_HISTORY_SOURCE_OR_OWNER_MISMATCH');
});
test('owner audit hash chain is append-only and REOPEN never closes a case',()=>{
 const a=complete();const first=a.ownerAuditHistory[0];
 const second={...first,entryId:'owner_history_002',action:'REOPEN',
   atMs:now-500,previousDigest:first.entryDigest};
 second.entryDigest=ql421OwnerAuditDigest({...second,
   closureDigest:a.closureEvidence[0].closureDigest});
 a.ownerAuditHistory.push(second);
 const r=run(a);
 assert.equal(r.cases[0].handoffState,'HOLD_REOPENED');
 assert.equal(r.cases[0].auditHistory.length,2);
 const b=copy(a);b.ownerAuditHistory[1].previousDigest='f'.repeat(64);
 assert.equal(run(b).reason,'OWNER_HISTORY_REORDERED_OR_PREDECESSOR_MISMATCH');
 const c=copy(a);c.ownerAuditHistory[1].atMs=first.atMs;
 assert.equal(run(c).state,'HOLD');
});
test('missing closure or stale proof remains HOLD, even with prior verified metadata',()=>{
 const a=base();const r=run(a);
 assert.equal(r.cases[0].handoffState,'HOLD_NO_VERIFIED_CLOSURE_PROOF');
 assert.equal(r.ownerAcceptance,'HOLD');
 const b=complete();b.nowMs+=360_000;
 const stale=run(b);
 assert.equal(stale.reason,'CLOSURE_CASE_OR_REVIEW_NOT_ELIGIBLE');
 assert.equal(stale.receiver,'OFF');
 const c=complete();c.protectedReadAuthorized=false;
 assert.equal(run(c).state,'HOLD');
});
