import test from 'node:test';
import assert from 'node:assert/strict';
import {buildQl420IncidentTimeline as review, ql420EscalationSlaDigest} from './ql420-incident-timeline.mjs';

const revision='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const now=Date.parse('2026-11-11T16:00:00Z');
const sourceId='rosevear-ai-hub',episodeId='original_episode_001';
function fixture(){
 const observedAtMs=now-60_000;
 const notifiedAtMs=now-15_000;
 const deadlineAtMs=observedAtMs+900_000;
 const notificationId='notify_original_001',notificationDigest='b'.repeat(64);
 const timelineDigest=ql420EscalationSlaDigest({sourceId,episodeId,
   sourceRevision:revision,observedAtMs,deadlineAtMs,
   notificationId,notificationDigest,notifiedAtMs});
 return {controllerRevision:revision,nowMs:now,protectedReadAuthorized:true,
   protectedExportAuthorized:false,independentAuditReviewerVerified:false,
   episodes:[{sourceId,episodeId,sourceRevision:revision,
     observedAtMs,signatureStatus:'HOLD',replayStatus:'COMMITTED',
     receiverAckStatus:'MATCHED'}],
   decisions:[{sourceId,episodeId,outcome:'ACCEPTED_FOR_REVIEW',
     decidedAtMs:now-30_000,ownerVerified:true,
     independentReviewerVerified:true}],
   assignments:[{sourceId,episodeId,ownerId:'owner_001',ownerRole:'MASTER_OPERATOR',
     assignedAtMs:now-45_000,ownerVerified:true,independentReviewerVerified:true,
     custodyDigest:'a'.repeat(64),action:'ASSIGNED'}],
   escalations:[{sourceId,episodeId,notificationId,notificationDigest,
     occurredAtMs:notifiedAtMs,deliveryState:'DELIVERED',
     operatorVerified:true,independentReviewerVerified:true}],
   slaEvidence:[{sourceId,episodeId,notificationId,timelineDigest,
     reviewedAtMs:now-1_000,controllerRevision:revision,
     protectedCustodyCommitted:true,independentReviewerVerified:true}],
   closureReviews:[{sourceId,episodeId,reviewId:'review_original_001',
     ownerId:'owner_001',reviewerId:'reviewer_001',
     sourceRevision:revision,custodyDigest:'c'.repeat(64),
     action:'REQUEST_CLOSURE',reviewedAtMs:now-500,
     protectedOwnerVerified:true,independentReviewerVerified:true,
     durableReviewCommitted:true}]};
}
test('QL420 records independent SLA evidence and preserves HOLD for unresolved signature',()=>{
 const a=fixture(),r=review(a);
 assert.equal(r.state,'PROTECTED_THREE_MASTER_TIMELINE');
 assert.equal(r.incidents[0].slaStatus,'VERIFIED_WITHIN_POLICY');
 assert.equal(r.incidents[0].independentlyReviewedSla,true);
 assert.equal(r.incidents[0].closureStatus,'HOLD_UNRESOLVED_DISCREPANCIES');
 assert.deepEqual(r.incidents[0].chronology.map(e=>e.type),[
   'OBSERVED','ASSIGNED','ESCALATION_DELIVERED','OWNER_REQUEST_CLOSURE']);
 assert.equal(r.connection,'HOLD');assert.equal(r.receiver,'OFF');
 assert.equal(r.runtimeUptime,'UNKNOWN');assert.equal(r.ownerAcceptance,'HOLD');
});
test('tampered digest, source confusion and forged review fail closed',()=>{
 const a=fixture();a.slaEvidence[0].timelineDigest='0'.repeat(64);
 assert.equal(review(a).reason,'SLA_EVIDENCE_DIGEST_MISMATCH');
 const b=fixture();b.slaEvidence[0].sourceId='ai-data-platform';
 assert.equal(review(b).reason,'SLA_EVIDENCE_SOURCE_OR_ORDER_MISMATCH');
 const c=fixture();c.closureReviews[0].independentReviewerVerified=false;
 assert.equal(review(c).reason,'OWNER_CLOSURE_AUTHORITY_OR_CUSTODY_UNVERIFIED');
 const d=fixture();d.closureReviews[0].reviewerId='owner_001';
 assert.equal(review(d).state,'HOLD');
});
test('missing SLA proof is visible but cannot grant closure',()=>{
 const a=fixture();a.slaEvidence=[];
 const r=review(a);
 assert.equal(r.incidents[0].slaStatus,'HOLD_NO_INDEPENDENT_SLA_EVIDENCE');
 assert.equal(r.incidents[0].closureStatus,'HOLD_UNRESOLVED_DISCREPANCIES');
 const b=fixture();b.escalations[0].deliveryState='FAILED';
 assert.equal(review(b).incidents[0].slaStatus,'HOLD_DELIVERY_NOT_VERIFIED');
});
test('late escalations show calculated breach, never accept recovery',()=>{
 const a=fixture();a.episodes[0].observedAtMs=now-1_200_000;
 a.assignments[0].assignedAtMs=now-1_100_000;
 a.slaEvidence[0].timelineDigest=ql420EscalationSlaDigest({
   sourceId,episodeId,sourceRevision:revision,
   observedAtMs:a.episodes[0].observedAtMs,
   deadlineAtMs:a.episodes[0].observedAtMs+900_000,
   notificationId:a.escalations[0].notificationId,
   notificationDigest:a.escalations[0].notificationDigest,
   notifiedAtMs:a.escalations[0].occurredAtMs});
 const r=review(a);
 assert.equal(r.incidents[0].slaStatus,'BREACHED_VERIFIED_LATE_DELIVERY');
 assert.equal(r.totals.late,1);
 assert.equal(r.connection,'HOLD');
});
test('reopened owner closure is review-only and chronology is protected',()=>{
 const a=fixture();a.closureReviews[0].action='REOPEN';
 assert.equal(review(a).incidents[0].closureStatus,'REOPENED_FOR_REVIEW');
 const b=fixture();b.closureReviews[0].reviewedAtMs=now-20_000;
 assert.equal(review(b).reason,'CLOSURE_CASE_OR_CHRONOLOGY_MISMATCH');
 const c=fixture();c.protectedReadAuthorized=false;
 assert.equal(review(c).state,'HOLD');
 const d=fixture();d.assignments[0].assignedAtMs=now-65_000;
 assert.equal(review(d).reason,'ASSIGNMENT_BEFORE_OBSERVATION');
});
