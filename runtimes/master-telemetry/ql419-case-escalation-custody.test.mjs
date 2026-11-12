import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildQl418OwnerSlaAudit} from './ql418-owner-sla-audit.mjs';
import {buildQl419CaseEscalationReview as run} from './ql419-case-escalation-custody.mjs';
const revision='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const now=Date.parse('2026-11-11T16:00:00Z');
const id='original_episode_001';
const base=()=>({controllerRevision:revision,nowMs:now,
 protectedReadAuthorized:true,protectedExportAuthorized:true,
 independentAuditReviewerVerified:true,
 episodes:[{sourceId:'rosevear-ai-hub',episodeId:id,sourceRevision:revision,
  observedAtMs:now-1_000_000,signatureStatus:'HOLD',replayStatus:'COMMITTED',
  receiverAckStatus:'MATCHED'}],
 decisions:[{sourceId:'rosevear-ai-hub',episodeId:id,outcome:'ACCEPTED_FOR_REVIEW',
  decidedAtMs:now-50_000,ownerVerified:true,independentReviewerVerified:true}],
 assignments:[{sourceId:'rosevear-ai-hub',episodeId:id,ownerId:'reviewer_001',
  ownerRole:'OWNER_REVIEWER',ownerVerified:true,independentReviewerVerified:true,
  assignedAtMs:now-800_000,custodyDigest:'a'.repeat(64),action:'ASSIGNED'}],
 escalations:[{sourceId:'rosevear-ai-hub',episodeId:id,
  notificationId:'notice_original_001',notificationDigest:'b'.repeat(64),
  deliveryState:'DELIVERED',occurredAtMs:now-100_000,
  operatorVerified:true,independentReviewerVerified:true}]});
test('QL419 verified escalation remains a review-only notification',()=>{
 const r=run(base());assert.equal(r.state,'PROTECTED_CASE_REVIEW');
 assert.equal(r.notifications[0].verifiedDelivery,true);
 assert.equal(r.notifications[0].action,'REVIEW_ONLY_NO_DELIVERY_EXECUTED');
 assert.equal(r.caseReviews[0].acceptance,'HOLD');
 assert.equal(r.connection,'HOLD');assert.equal(r.receiver,'OFF');
 assert.equal(r.auditExport,null);
});
test('independent export custody must match exact sanitized QL418 digest',()=>{
 const a=base(),s=buildQl418OwnerSlaAudit(a).auditExport;
 const digest=createHash('sha256').update(s).digest('hex');
 a.exportReceipts=[{receiptId:'export_receipt_001',auditSha256:digest,
  reviewedAtMs:now-1,controllerRevision:revision,
  ownerVerified:true,independentReviewerVerified:true}];
 const r=run(a);assert.equal(r.exportCustodyState,'INDEPENDENT_RECEIPT_MATCHED');
 assert.equal(r.exportVerified,true);assert.equal(r.auditExport,s);
 assert.equal(r.connection,'HOLD');
 a.exportReceipts[0].auditSha256='0'.repeat(64);
 assert.equal(run(a).reason,'EXPORT_DIGEST_MISMATCH');
});
test('rejects forged notifications, duplicate IDs and missing assignment',()=>{
 const a=base();a.escalations[0].independentReviewerVerified=false;
 assert.equal(run(a).state,'HOLD');
 const b=base();b.escalations.push({...b.escalations[0]});
 assert.equal(run(b).state,'HOLD');
 const c=base();c.assignments=[];
 assert.equal(run(c).state,'HOLD');
 const d=base();d.protectedReadAuthorized=false;
 assert.equal(run(d).state,'HOLD');
});
test('export receipts cannot pass without independent export authorization',()=>{
 const a=base();a.protectedExportAuthorized=false;
 a.exportReceipts=[{receiptId:'export_receipt_001',auditSha256:'b'.repeat(64),
  reviewedAtMs:now-1,controllerRevision:revision,
  ownerVerified:true,independentReviewerVerified:true}];
 assert.equal(run(a).reason,'UNAUTHORIZED_EXPORT_RECEIPT');
});
